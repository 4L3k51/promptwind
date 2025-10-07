import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { AppLayout } from '@/components/layouts/app-layout'
import { ApiKeysManager } from './api-keys-manager'

export default async function ApiKeysPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  const { data: apiKeys, error } = await supabase
    .from('user_api_keys')
    .select('id, provider, key_name, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching API keys:', error)
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            API Keys
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Manage your LLM provider API keys securely
          </p>
        </div>
        
        <ApiKeysManager initialApiKeys={apiKeys || []} />
      </div>
    </AppLayout>
  )
}
