'use server'

import { createClient } from '@/lib/supabase/server'

export async function executeQuery(intentId: string, modelId: string) {
  const supabase = await createClient()

  // Get authenticated user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, error: 'Not authenticated' }
  }

  try {
    // 1. Get intent details
    const { data: intent, error: intentError } = await supabase
      .from('intents')
      .select('id, label')
      .eq('id', intentId)
      .single()

    if (intentError || !intent) {
      return { success: false, error: 'Intent not found' }
    }

    // 2. Get model details with API key
    const { data: model, error: modelError } = await supabase
      .from('models')
      .select(`
        id,
        provider,
        model_name,
        temperature,
        top_p,
        max_tokens,
        api_key_id,
        user_api_keys (
          vault_secret_id
        )
      `)
      .eq('id', modelId)
      .single()

    if (modelError || !model) {
      return { success: false, error: 'Model not found' }
    }

    // 3. For now, use a placeholder for the API key
    // TODO: Retrieve actual key from Vault using vault_secret_id
    const apiKey = process.env.OPENAI_API_KEY // Temporary: use your own key for testing

    if (!apiKey) {
      return { success: false, error: 'OpenAI API key not configured' }
    }

    // 4. Call OpenAI Responses API with web search
    const openaiResponse = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model.model_name,
        tools: [{ type: 'web_search' }],
        input: intent.label,
        // Note: Responses API doesn't support temperature, top_p, max_tokens
        // These parameters are for Chat Completions API only
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API error:', errorText)
      
      let errorMessage = `OpenAI API error: ${openaiResponse.status}`
      try {
        const errorJson = JSON.parse(errorText)
        if (errorJson.error?.message) {
          errorMessage += ` - ${errorJson.error.message}`
        }
      } catch (e) {
        errorMessage += ` - ${errorText.substring(0, 200)}`
      }
      
      return { success: false, error: errorMessage }
    }

    const responseData = await openaiResponse.json()
    console.log('OpenAI Response:', JSON.stringify(responseData, null, 2))

    // 5. Extract the text and citations
    const messageItem = responseData.output?.find((item: any) => item.type === 'message')
    const responseText = messageItem?.content?.[0]?.text || ''
    const citations = messageItem?.content?.[0]?.annotations || []

    // 6. Store query in database
    const { data: query, error: queryError } = await supabase
      .from('queries')
      .insert({
        user_id: user.id,
        intent_id: intentId,
        paraphrase_id: null, // Using direct prompt text
        model_id: modelId,
        prompt_text: intent.label,
        response_text: responseText,
        response_hash: null, // TODO: Generate hash
        response_length: responseText.length,
        model_version: model.model_name,
        temperature: model.temperature,
        top_p: model.top_p,
        max_tokens: model.max_tokens,
      })
      .select()
      .single()

    if (queryError) {
      console.error('Error storing query:', queryError)
      return { success: false, error: 'Failed to store query results' }
    }

    // 7. Simple brand detection (just checking if "Supabase" is mentioned)
    // TODO: Make this configurable per user
    const brandMentioned = responseText.toLowerCase().includes('supabase')

    // 8. Store brand mention
    if (query) {
      await supabase.from('brand_mentions').insert({
        query_id: query.id,
        mentioned: brandMentioned,
        position_among_brands: null, // TODO: Parse and rank
        first_mention_char: brandMentioned
          ? responseText.toLowerCase().indexOf('supabase')
          : null,
      })
    }

    return {
      success: true,
      queryId: query?.id,
      brandMentioned,
      citationCount: citations.length,
      responsePreview: responseText.substring(0, 200),
    }
  } catch (error) {
    console.error('Query execution error:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

