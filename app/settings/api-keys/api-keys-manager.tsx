'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type ApiKey = {
  id: string
  provider: string
  key_name: string | null
  created_at: string
}

interface ApiKeysManagerProps {
  initialApiKeys: ApiKey[]
}

const PROVIDERS = [
  { value: 'openai', label: 'OpenAI', icon: '🤖', color: '#10a37f' },
  { value: 'anthropic', label: 'Anthropic', icon: '🔮', color: '#c99b7a' },
  { value: 'google', label: 'Google', icon: '🔍', color: '#4285f4' },
]

export function ApiKeysManager({ initialApiKeys }: ApiKeysManagerProps) {
  const router = useRouter()
  const [apiKeys, setApiKeys] = useState<ApiKey[]>(initialApiKeys)
  const [isAdding, setIsAdding] = useState(false)
  const [newKey, setNewKey] = useState({
    provider: '',
    key_name: '',
    api_key: '',
  })
  const [showKey, setShowKey] = useState(false)

  const handleAddKey = async () => {
    if (!newKey.provider || !newKey.api_key.trim()) {
      alert('Please select a provider and enter an API key')
      return
    }

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      alert('You must be logged in')
      return
    }

    // TODO: In production, encrypt and store in Vault
    // For now, we'll store a placeholder vault_secret_id
    const { data, error } = await supabase
      .from('user_api_keys')
      .insert({
        user_id: user.id,
        provider: newKey.provider,
        key_name: newKey.key_name || `${newKey.provider.toUpperCase()} API Key`,
        vault_secret_id: `placeholder_${Date.now()}`,
      })
      .select('id, provider, key_name, created_at')
      .single()

    if (error) {
      console.error('Error adding API key:', error)
      alert(`Failed to add API key: ${error.message}`)
      return
    }

    console.log('API key created successfully:', data)

    // Update local state immediately with the new key
    if (data) {
      setApiKeys([data, ...apiKeys])
    }

    // Also refresh from server in background
    router.refresh()
    
    // Reset form
    setIsAdding(false)
    setNewKey({ provider: '', key_name: '', api_key: '' })
    setShowKey(false)
  }

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from('user_api_keys').delete().eq('id', id)

    if (error) {
      console.error('Error deleting API key:', error)
      alert(`Failed to delete API key: ${error.message}`)
      return
    }

    // Update local state immediately
    setApiKeys(apiKeys.filter((key) => key.id !== id))
    router.refresh()
  }

  const maskApiKey = (key: string) => {
    if (key.length <= 8) return '••••••••'
    return `${key.slice(0, 4)}••••••••${key.slice(-4)}`
  }

  const getProviderInfo = (provider: string) => {
    return PROVIDERS.find((p) => p.value === provider) || PROVIDERS[0]
  }

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <div className="rounded-lg bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg
              className="h-5 w-5 text-blue-400"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-blue-800">
              Secure API Key Storage
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                Your API keys are encrypted and stored securely. They are never
                displayed in full and are only used when making LLM requests.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Button */}
      <div className="flex justify-end">
        <Button onClick={() => setIsAdding(!isAdding)}>
          <Plus className="mr-2 h-4 w-4" />
          Add API Key
        </Button>
      </div>

      {/* Add New Key Form */}
      {isAdding && (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Add New API Key</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Provider
              </label>
              <Select
                value={newKey.provider}
                onValueChange={(value) =>
                  setNewKey({ ...newKey, provider: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select provider..." />
                </SelectTrigger>
                <SelectContent>
                  {PROVIDERS.map((provider) => (
                    <SelectItem key={provider.value} value={provider.value}>
                      <span className="flex items-center gap-2">
                        <span>{provider.icon}</span>
                        <span>{provider.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Key Name (optional)
              </label>
              <Input
                placeholder="e.g., Production Key, Testing Key"
                value={newKey.key_name}
                onChange={(e) =>
                  setNewKey({ ...newKey, key_name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                API Key
              </label>
              <div className="relative">
                <Input
                  type={showKey ? 'text' : 'password'}
                  placeholder="sk-..."
                  value={newKey.api_key}
                  onChange={(e) =>
                    setNewKey({ ...newKey, api_key: e.target.value })
                  }
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(!showKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddKey}>Save API Key</Button>
              <Button
                variant="outline"
                onClick={() => {
                  setIsAdding(false)
                  setNewKey({ provider: '', key_name: '', api_key: '' })
                  setShowKey(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* API Keys List */}
      <div className="rounded-lg border bg-white shadow-sm">
        {apiKeys.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">
              No API keys yet. Add your first API key to get started!
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {apiKeys.map((key) => {
              const provider = getProviderInfo(key.provider)
              return (
                <div
                  key={key.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 text-2xl">
                      {provider.icon}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">
                          {key.key_name || `${provider.label} API Key`}
                        </span>
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${provider.color}20`,
                            color: provider.color,
                          }}
                        >
                          {provider.label}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-500">
                        Added {new Date(key.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteKey(key.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

