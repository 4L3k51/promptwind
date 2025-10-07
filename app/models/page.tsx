import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { ModelsManager } from './models-manager'

export default async function ModelsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select(`
      id,
      provider,
      model_name,
      api_key_id,
      temperature,
      top_p,
      max_tokens,
      is_active,
      created_at,
      user_api_keys (
        id,
        provider,
        key_name
      )
    `)
    .order('created_at', { ascending: false })

  const { data: apiKeys, error: apiKeysError } = await supabase
    .from('user_api_keys')
    .select('id, provider, key_name')
    .eq('provider', 'openai')
    .order('created_at', { ascending: false })

  if (modelsError || apiKeysError) {
    console.error('Error fetching data:', modelsError || apiKeysError)
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Models
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Enable OpenAI models with web search for citation tracking
          </p>
        </div>
        
        <ModelsManager 
          initialModels={models || []} 
          apiKeys={apiKeys || []}
        />
      </div>
    </AppLayout>
  )
}
