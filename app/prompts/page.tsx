import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { PromptsGrid } from './prompts-grid'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Prompts - PromptWind',
  description: 'Manage your LLM prompts and organize them by category',
}

export default async function PromptsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: prompts, error: promptsError } = await supabase
    .from('intents')
    .select(`
      id,
      label,
      category_id,
      daily_sample_size,
      is_active,
      created_at,
      categories (
        id,
        name,
        color,
        parent_id
      )
    `)
    .order('created_at', { ascending: false })

  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('*')
    .order('name', { ascending: true })

  if (promptsError || categoriesError) {
    console.error('Error fetching data:', promptsError || categoriesError)
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Prompts
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your LLM prompts and organize them by category
          </p>
        </div>
        
        <PromptsGrid 
          initialPrompts={prompts || []} 
          categories={categories || []}
        />
      </div>
    </AppLayout>
  )
}
