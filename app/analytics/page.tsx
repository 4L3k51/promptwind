import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { AnalyticsDashboard } from './analytics-dashboard'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Analytics - PromptWind',
  description: 'Track brand mentions and citation rates with Wilson confidence intervals',
}

export default async function AnalyticsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: queries, error: queriesError } = await supabase
    .from('queries')
    .select(`
      id,
      prompt_text,
      model_id,
      created_at,
      response_length,
      models (
        id,
        model_name,
        provider
      ),
      intents (
        id,
        label
      ),
      brand_mentions (
        id,
        mentioned
      )
    `)
    .order('created_at', { ascending: false })

  const { data: intents, error: intentsError } = await supabase
    .from('intents')
    .select(`
      id, 
      label,
      categories (
        id,
        name,
        parent_id
      )
    `)
    .order('label', { ascending: true })

  const { data: allCategories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name, parent_id')

  if (queriesError || intentsError || categoriesError) {
    console.error('Error fetching analytics data:')
    if (queriesError) {
      console.error('Queries error:', JSON.stringify(queriesError, null, 2))
    }
    if (intentsError) {
      console.error('Intents error:', JSON.stringify(intentsError, null, 2))
    }
    if (categoriesError) {
      console.error('Categories error:', JSON.stringify(categoriesError, null, 2))
    }
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Analytics
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Track brand mentions and citation rates across models
          </p>
        </div>
        
        <AnalyticsDashboard 
          queries={queries || []} 
          intents={intents || []}
          categories={allCategories || []}
        />
      </div>
    </AppLayout>
  )
}
