'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { AlertCircle } from 'lucide-react'

type Model = {
  id: string
  provider: string
  model_name: string
  api_key_id: string
  temperature: number
  top_p: number
  max_tokens: number
  is_active: boolean
  created_at: string
  user_api_keys: {
    id: string
    provider: string
    key_name: string | null
  } | null
}

type ApiKey = {
  id: string
  provider: string
  key_name: string | null
}

interface ModelsManagerProps {
  initialModels: Model[]
  apiKeys: ApiKey[]
}

// Pre-configured OpenAI models with web search
const MODEL_TEMPLATES = [
  {
    id: 'gpt-4o-search',
    name: 'GPT-4o + Web Search',
    model_name: 'gpt-4o',
    description: 'Fast, high-quality responses with web search and citations',
    icon: '🚀',
    temperature: 0.7,
    top_p: 1.0,
    max_tokens: 2000,
    reasoning_effort: null,
    recommended: true,
  },
  {
    id: 'gpt-4o-mini-search',
    name: 'GPT-4o Mini + Web Search',
    model_name: 'gpt-4o-mini',
    description: 'Cost-effective option with web search capability',
    icon: '⚡',
    temperature: 0.7,
    top_p: 1.0,
    max_tokens: 2000,
    reasoning_effort: null,
    recommended: false,
  },
  {
    id: 'gpt-5-search',
    name: 'GPT-5 + Web Search',
    model_name: 'gpt-5',
    description: 'Most powerful reasoning with agentic web search',
    icon: '🧠',
    temperature: 0.7,
    top_p: 1.0,
    max_tokens: 2000,
    reasoning_effort: 'low',
    recommended: false,
  },
]

export function ModelsManager({ initialModels, apiKeys }: ModelsManagerProps) {
  const router = useRouter()
  const [models, setModels] = useState<Model[]>(initialModels)

  // Check which templates are already enabled
  const getEnabledStatus = (templateId: string) => {
    const template = MODEL_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return null
    
    return models.find(
      (m) => m.model_name === template.model_name && m.is_active
    )
  }

  const handleEnableModel = async (templateId: string, apiKeyId: string) => {
    if (!apiKeyId) {
      alert('Please select an API key')
      return
    }

    const template = MODEL_TEMPLATES.find((t) => t.id === templateId)
    if (!template) return

    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      alert('You must be logged in')
      return
    }

    const { data, error } = await supabase
      .from('models')
      .insert({
        user_id: user.id,
        provider: 'openai',
        model_name: template.model_name,
        api_key_id: apiKeyId,
        temperature: template.temperature,
        top_p: template.top_p,
        max_tokens: template.max_tokens,
        system_prompt: null,
        is_active: true,
      })
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
      .single()

    if (error) {
      console.error('Error enabling model:', error)
      alert(`Failed to enable model: ${error.message}`)
      return
    }

    console.log('Model enabled successfully:', data)

    // Update local state
    if (data) {
      setModels([data, ...models])
    }

    router.refresh()
  }

  const handleDisableModel = async (modelId: string) => {
    if (!confirm('Are you sure you want to disable this model?')) {
      return
    }

    const supabase = createClient()
    const { error } = await supabase.from('models').delete().eq('id', modelId)

    if (error) {
      console.error('Error disabling model:', error)
      alert(`Failed to disable model: ${error.message}`)
      return
    }

    // Update local state
    setModels(models.filter((m) => m.id !== modelId))
    router.refresh()
  }

  const handleToggleActive = async (modelId: string, isActive: boolean) => {
    const supabase = createClient()
    const { error } = await supabase
      .from('models')
      .update({ is_active: isActive })
      .eq('id', modelId)

    if (error) {
      console.error('Error updating model:', error)
      alert(`Failed to update model: ${error.message}`)
      return
    }

    // Update local state
    setModels(
      models.map((m) => (m.id === modelId ? { ...m, is_active: isActive } : m))
    )
    router.refresh()
  }

  // Check if user has any OpenAI API keys
  const hasApiKeys = apiKeys.length > 0

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      {!hasApiKeys && (
        <div className="rounded-lg bg-yellow-50 p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-yellow-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                No OpenAI API Key Found
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <p>
                  You need to add an OpenAI API key before enabling models.{' '}
                  <a
                    href="/settings/api-keys"
                    className="font-semibold underline hover:text-yellow-800"
                  >
                    Add API key →
                  </a>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Web Search Info */}
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
              Web Search Enabled
            </h3>
            <div className="mt-2 text-sm text-blue-700">
              <p>
                All models use OpenAI's Responses API with web_search tool for
                real-time information and citations.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Model Templates */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {MODEL_TEMPLATES.map((template) => {
          const enabledModel = getEnabledStatus(template.id)
          const isEnabled = !!enabledModel

          return (
            <ModelCard
              key={template.id}
              template={template}
              isEnabled={isEnabled}
              enabledModel={enabledModel}
              apiKeys={apiKeys}
              hasApiKeys={hasApiKeys}
              onEnable={handleEnableModel}
              onDisable={handleDisableModel}
              onToggleActive={handleToggleActive}
            />
          )
        })}
      </div>
    </div>
  )
}

// Individual Model Card Component
function ModelCard({
  template,
  isEnabled,
  enabledModel,
  apiKeys,
  hasApiKeys,
  onEnable,
  onDisable,
  onToggleActive,
}: {
  template: typeof MODEL_TEMPLATES[0]
  isEnabled: boolean
  enabledModel: Model | null
  apiKeys: ApiKey[]
  hasApiKeys: boolean
  onEnable: (templateId: string, apiKeyId: string) => void
  onDisable: (modelId: string) => void
  onToggleActive: (modelId: string, isActive: boolean) => void
}) {
  const [selectedApiKey, setSelectedApiKey] = useState('')

  return (
    <Card className={isEnabled ? 'border-green-200 bg-green-50' : ''}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{template.icon}</span>
            <div>
              <CardTitle className="text-lg">{template.name}</CardTitle>
              {template.recommended && (
                <Badge variant="default" className="mt-1">
                  Recommended
                </Badge>
              )}
            </div>
          </div>
          {isEnabled && enabledModel && (
            <Switch
              checked={enabledModel.is_active}
              onCheckedChange={(checked) =>
                onToggleActive(enabledModel.id, checked)
              }
            />
          )}
        </div>
        <CardDescription>{template.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Configuration */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Temperature:</span>
              <span className="font-medium">{template.temperature}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Top P:</span>
              <span className="font-medium">{template.top_p}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Max Tokens:</span>
              <span className="font-medium">{template.max_tokens}</span>
            </div>
            {template.reasoning_effort && (
              <div className="flex justify-between">
                <span className="text-gray-600">Reasoning:</span>
                <span className="font-medium">{template.reasoning_effort}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {!isEnabled ? (
            <div className="space-y-2">
              <Select
                value={selectedApiKey}
                onValueChange={setSelectedApiKey}
                disabled={!hasApiKeys}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select API key..." />
                </SelectTrigger>
                <SelectContent>
                  {apiKeys.map((key) => (
                    <SelectItem key={key.id} value={key.id}>
                      {key.key_name || 'OpenAI API Key'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                className="w-full"
                onClick={() => onEnable(template.id, selectedApiKey)}
                disabled={!hasApiKeys || !selectedApiKey}
              >
                Enable Model
              </Button>
            </div>
          ) : (
            enabledModel && (
              <div className="space-y-2">
                <div className="rounded-md bg-white p-2 text-sm">
                  <span className="text-gray-600">API Key: </span>
                  <span className="font-medium">
                    {enabledModel.user_api_keys?.key_name || 'OpenAI Key'}
                  </span>
                </div>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => onDisable(enabledModel.id)}
                >
                  Disable Model
                </Button>
              </div>
            )
          )}
        </div>
      </CardContent>
    </Card>
  )
}

