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
import { Plus, Search, MoreVertical, Trash2, Edit2, Play } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { executeQuery } from '@/app/actions/execute-query'

type Prompt = {
  id: string
  label: string
  category_id: string | null
  daily_sample_size: number
  is_active: boolean
  created_at: string
  categories: {
    id: string
    name: string
    color: string
    parent_id: string | null
  } | null
}

type Category = {
  id: string
  user_id: string
  name: string
  description: string | null
  parent_id: string | null
  color: string
  icon: string | null
  created_at: string
  updated_at: string
}

interface PromptsGridProps {
  initialPrompts: Prompt[]
  categories: Category[]
}

export function PromptsGrid({ initialPrompts, categories }: PromptsGridProps) {
  const [prompts, setPrompts] = useState<Prompt[]>(initialPrompts)
  const [searchQuery, setSearchQuery] = useState('')
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [newPrompt, setNewPrompt] = useState({
    label: '',
    category_id: '',
    daily_sample_size: 3,
  })
  const [executingQueryId, setExecutingQueryId] = useState<string | null>(null)
  const router = useRouter()

  // Filter prompts by search
  const filteredPrompts = prompts.filter((prompt) =>
    prompt.label.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Group prompts by category
  const groupedPrompts = categories.reduce((acc, category) => {
    acc[category.id] = filteredPrompts.filter(
      (p) => p.category_id === category.id
    )
    return acc
  }, {} as Record<string, Prompt[]>)

  // Uncategorized prompts
  const uncategorizedPrompts = filteredPrompts.filter((p) => !p.category_id)

  const getAllActiveModels = async () => {
    const supabase = createClient()
    const { data } = await supabase
      .from('models')
      .select('id, model_name')
      .eq('is_active', true)
    return data || []
  }

  const handleAddPrompt = () => {
    setIsAddingNew(true)
  }

  const handleSaveNewPrompt = async () => {
    if (!newPrompt.label.trim()) {
      alert('Please enter a prompt')
      return
    }

    const supabase = createClient()
    
    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      alert('You must be logged in to create prompts')
      return
    }

    const { data, error } = await supabase.from('intents').insert({
      user_id: user.id,
      label: newPrompt.label,
      category_id: newPrompt.category_id || null,
      daily_sample_size: newPrompt.daily_sample_size,
      is_active: true,
    }).select()

    if (error) {
      console.error('Error creating prompt:', error)
      alert(`Failed to create prompt: ${error.message}`)
      return
    }

    console.log('Prompt created successfully:', data)

    // Refresh the page to show new data
    router.refresh()
    setIsAddingNew(false)
    setNewPrompt({ label: '', category_id: '', daily_sample_size: 3 })
  }

  const handleDeletePrompt = async (id: string) => {
    if (!confirm('Are you sure you want to delete this prompt?')) {
      return
    }

    const supabase = createClient()
    
    const { error } = await supabase
      .from('intents')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting prompt:', error)
      alert(`Failed to delete prompt: ${error.message}`)
      return
    }

    // Update local state immediately for instant feedback
    setPrompts(prompts.filter((p) => p.id !== id))
    
    // Also refresh from server (in background)
    router.refresh()
  }

  const handleRunQuery = async (promptId: string) => {
    setExecutingQueryId(promptId)
    
    try {
      // Get all active models
      const models = await getAllActiveModels()
      
      if (models.length === 0) {
        alert('No active models found. Please enable at least one model in /models first.')
        return
      }
      
      // Execute query on all models
      const results = []
      for (const model of models) {
        const result = await executeQuery(promptId, model.id)
        results.push({
          modelName: model.model_name,
          ...result,
        })
      }
      
      // Show summary of all results
      const successCount = results.filter((r) => r.success).length
      const brandMentionCount = results.filter((r) => r.brandMentioned).length
      
      const summary = results
        .map((r) => {
          if (r.success) {
            return `✅ ${r.modelName}: Brand ${r.brandMentioned ? '✓' : '✗'} | ${r.citationCount} citations`
          } else {
            return `❌ ${r.modelName}: ${r.error}`
          }
        })
        .join('\n')
      
      alert(
        `Executed on ${models.length} model(s):\n\n` +
        `${summary}\n\n` +
        `Summary:\n` +
        `- Successful: ${successCount}/${models.length}\n` +
        `- Brand mentioned: ${brandMentionCount}/${successCount}`
      )
      
      // Refresh to show new queries in database
      router.refresh()
    } catch (error) {
      console.error('Query execution error:', error)
      alert('Unexpected error occurred')
    } finally {
      setExecutingQueryId(null)
    }
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-4 rounded-lg bg-white p-4 shadow">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleAddPrompt}>
          <Plus className="mr-2 h-4 w-4" />
          Add Prompt
        </Button>
      </div>

      {/* Grid Container */}
      <div className="rounded-lg bg-white shadow">
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-4 border-b bg-gray-50 px-6 py-3 text-sm font-medium text-gray-700">
          <div className="col-span-4">Prompt</div>
          <div className="col-span-2">Category</div>
          <div className="col-span-2">Subcategory</div>
          <div className="col-span-2">Samples/day</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-1"></div>
        </div>

        {/* Uncategorized Section */}
        {uncategorizedPrompts.length > 0 && (
          <div className="border-b">
            <div className="bg-gray-100 px-6 py-2 text-sm font-semibold text-gray-600">
              📋 Uncategorized ({uncategorizedPrompts.length})
            </div>
            {uncategorizedPrompts.map((prompt) => (
              <PromptRow
                key={prompt.id}
                prompt={prompt}
                categories={categories}
                onDelete={handleDeletePrompt}
                executingQueryId={executingQueryId}
                onRunQuery={handleRunQuery}
              />
            ))}
          </div>
        )}

        {/* Category Sections */}
        {categories.map((category) => {
          const categoryPrompts = groupedPrompts[category.id] || []
          if (categoryPrompts.length === 0) return null

          return (
            <div key={category.id} className="border-b last:border-b-0">
              <div
                className="px-6 py-2 text-sm font-semibold"
                style={{ backgroundColor: `${category.color}15` }}
              >
                <span
                  className="inline-block h-3 w-3 rounded-full mr-2"
                  style={{ backgroundColor: category.color }}
                />
                {category.name} ({categoryPrompts.length})
              </div>
              {categoryPrompts.map((prompt) => (
                <PromptRow
                  key={prompt.id}
                  prompt={prompt}
                  categories={categories}
                  onDelete={handleDeletePrompt}
                  executingQueryId={executingQueryId}
                  onRunQuery={handleRunQuery}
                />
              ))}
            </div>
          )
        })}

        {/* New Prompt Row */}
        {isAddingNew && (
          <div className="grid grid-cols-12 gap-4 border-t bg-blue-50 px-6 py-4">
            <div className="col-span-4">
              <Input
                placeholder="Enter prompt text..."
                value={newPrompt.label}
                onChange={(e) =>
                  setNewPrompt({ ...newPrompt, label: e.target.value })
                }
                autoFocus
              />
            </div>
            <div className="col-span-4">
              <Select
                value={newPrompt.category_id}
                onValueChange={(value) =>
                  setNewPrompt({ ...newPrompt, category_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Input
                type="number"
                min="1"
                max="50"
                value={newPrompt.daily_sample_size}
                onChange={(e) =>
                  setNewPrompt({
                    ...newPrompt,
                    daily_sample_size: parseInt(e.target.value) || 3,
                  })
                }
              />
            </div>
            <div className="col-span-2 flex gap-2">
              <Button size="sm" onClick={handleSaveNewPrompt}>
                Save
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsAddingNew(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredPrompts.length === 0 && !isAddingNew && (
          <div className="px-6 py-12 text-center">
            <p className="text-gray-500">No prompts found. Add your first prompt to get started!</p>
            <Button className="mt-4" onClick={handleAddPrompt}>
              <Plus className="mr-2 h-4 w-4" />
              Add Your First Prompt
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// Individual Prompt Row Component
function PromptRow({
  prompt,
  categories,
  onDelete,
  executingQueryId,
  onRunQuery,
}: {
  prompt: Prompt
  categories: Category[]
  onDelete: (id: string) => void
  executingQueryId: string | null
  onRunQuery: (promptId: string) => Promise<void>
}) {
  // Find parent category if exists
  const parentCategory = prompt.categories?.parent_id
    ? categories.find((c) => c.id === prompt.categories?.parent_id)
    : null

  return (
    <div className="grid grid-cols-12 gap-4 px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="col-span-4 text-sm text-gray-900">{prompt.label}</div>
      <div className="col-span-2">
        {parentCategory ? (
          <Badge
            variant="secondary"
            style={{
              backgroundColor: `${parentCategory.color}20`,
              color: parentCategory.color,
              borderColor: parentCategory.color,
            }}
          >
            {parentCategory.name}
          </Badge>
        ) : prompt.categories ? (
          <Badge
            variant="secondary"
            style={{
              backgroundColor: `${prompt.categories.color}20`,
              color: prompt.categories.color,
              borderColor: prompt.categories.color,
            }}
          >
            {prompt.categories.name}
          </Badge>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </div>
      <div className="col-span-2">
        {prompt.categories && parentCategory ? (
          <Badge variant="outline">{prompt.categories.name}</Badge>
        ) : (
          <span className="text-sm text-gray-400">—</span>
        )}
      </div>
      <div className="col-span-2 text-sm text-gray-700">
        {prompt.daily_sample_size} /day
      </div>
      <div className="col-span-1">
        <Badge variant={prompt.is_active ? 'default' : 'secondary'}>
          {prompt.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </div>
      <div className="col-span-1 flex justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              disabled={executingQueryId === prompt.id}
              onClick={async () => {
                await onRunQuery(prompt.id)
              }}
            >
              <Play className="mr-2 h-4 w-4" />
              {executingQueryId === prompt.id ? 'Running...' : 'Run Query'}
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Edit2 className="mr-2 h-4 w-4" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-red-600"
              onClick={() => onDelete(prompt.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}

