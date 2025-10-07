'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { Check, X, Filter } from 'lucide-react'

type Query = {
  id: string
  prompt_text: string
  model_id: string
  created_at: string
  response_length: number
  models: {
    id: string
    model_name: string
    provider: string
  }[]
  intents: {
    id: string
    label: string
  }[]
  brand_mentions: {
    id: string
    mentioned: boolean
  }[]
}

type Intent = {
  id: string
  label: string
  categories?: {
    id: string
    name: string
    parent_id: string | null
  }[] | null
}

type Category = {
  id: string
  name: string
  parent_id: string | null
}

interface AnalyticsDashboardProps {
  queries: Query[]
  intents: Intent[]
  categories: Category[]
}

type DateRange = '7d' | '30d' | '90d' | 'all'

export function AnalyticsDashboard({ queries, intents, categories }: AnalyticsDashboardProps) {
  const [dateRange, setDateRange] = useState<DateRange>('all')
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([])
  const [selectedPrompts, setSelectedPrompts] = useState<string[]>([])

  // Build category hierarchy map
  const categoryMap = useMemo(() => {
    const map = new Map<string, Category>()
    categories.forEach((cat) => map.set(cat.id, cat))
    return map
  }, [categories])

  // Extract unique parent categories, subcategories (child categories), and prompts
  const { parentCategories, childCategories, promptsList } = useMemo(() => {
    const parentCatSet = new Set<string>()
    const childCatSet = new Set<string>()
    const promptSet = new Set<string>()

    queries.forEach((query) => {
      const intent = intents.find((i) => i.id === query.intents?.[0]?.id)
      const category = intent?.categories?.[0]
      
      if (category) {
        if (category.parent_id) {
          // This is a subcategory
          const parentCat = categoryMap.get(category.parent_id)
          if (parentCat) parentCatSet.add(parentCat.name)
          childCatSet.add(category.name)
        } else {
          // This is a parent category
          parentCatSet.add(category.name)
        }
      }
      
      const promptKey = query.prompt_text
      if (promptKey) promptSet.add(promptKey.substring(0, 100))
    })

    return {
      parentCategories: Array.from(parentCatSet).sort(),
      childCategories: Array.from(childCatSet).sort(),
      promptsList: Array.from(promptSet).sort(),
    }
  }, [queries, intents, categoryMap])

  // Filter queries by date range AND selected filters
  const filteredQueries = useMemo(() => {
    let filtered = queries

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date()
      const daysAgo = {
        '7d': 7,
        '30d': 30,
        '90d': 90,
      }[dateRange]
      const cutoffDate = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
      filtered = filtered.filter((q) => new Date(q.created_at) >= cutoffDate)
    }

    // Category filter
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((q) => {
        const intent = intents.find((i) => i.id === q.intents?.[0]?.id)
        const category = intent?.categories?.[0]
        
        if (!category) return false
        
        // Check if it's a parent category or get the parent
        if (category.parent_id) {
          const parentCat = categoryMap.get(category.parent_id)
          return parentCat ? selectedCategories.includes(parentCat.name) : false
        } else {
          return selectedCategories.includes(category.name)
        }
      })
    }

    // Subcategory filter (child categories only)
    if (selectedSubcategories.length > 0) {
      filtered = filtered.filter((q) => {
        const intent = intents.find((i) => i.id === q.intents?.[0]?.id)
        const category = intent?.categories?.[0]
        
        if (!category || !category.parent_id) return false
        
        return selectedSubcategories.includes(category.name)
      })
    }

    // Prompt filter
    if (selectedPrompts.length > 0) {
      filtered = filtered.filter((q) => {
        const promptKey = (q.prompt_text || '').substring(0, 100)
        return selectedPrompts.includes(promptKey)
      })
    }

    return filtered
  }, [queries, dateRange, selectedCategories, selectedSubcategories, selectedPrompts, intents, categoryMap])

  // Calculate overall statistics
  const totalQueries = filteredQueries.length
  const queriesWithBrandMention = filteredQueries.filter(
    (q) => q.brand_mentions?.[0]?.mentioned
  ).length
  const citationRate = totalQueries > 0 ? (queriesWithBrandMention / totalQueries) * 100 : 0
  const avgResponseLength = totalQueries > 0
    ? Math.round(filteredQueries.reduce((sum, q) => sum + (q.response_length || 0), 0) / totalQueries)
    : 0

  const wilsonInterval = calculateWilsonInterval(queriesWithBrandMention, totalQueries)
  const confidenceLevel = getConfidenceLevel(wilsonInterval.width, totalQueries)

  // Time series data
  const timeSeriesData = useMemo(() => {
    const dataByDate = filteredQueries.reduce((acc, query) => {
      const date = new Date(query.created_at).toLocaleDateString()
      if (!acc[date]) {
        acc[date] = { date, total: 0, mentioned: 0 }
      }
      acc[date].total++
      if (query.brand_mentions?.[0]?.mentioned) {
        acc[date].mentioned++
      }
      return acc
    }, {} as Record<string, { date: string; total: number; mentioned: number }>)

    return Object.values(dataByDate)
      .map((d) => ({
        date: d.date,
        queries: d.total,
        citationRate: d.total > 0 ? (d.mentioned / d.total) * 100 : 0,
        mentions: d.mentioned,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [filteredQueries])

  // Category data
  const categoryData = useMemo(() => {
    const categoryStats: Record<string, { total: number; mentioned: number; intents: Set<string> }> = {}
    
    filteredQueries.forEach((query) => {
      const intent = intents.find((i) => i.id === query.intents?.[0]?.id)
      const category = intent?.categories?.[0]
      
      let categoryName = 'Uncategorized'
      if (category) {
        if (category.parent_id) {
          const parentCat = categoryMap.get(category.parent_id)
          categoryName = parentCat?.name || categoryName
        } else {
          categoryName = category.name
        }
      }
      
      if (!categoryStats[categoryName]) {
        categoryStats[categoryName] = { total: 0, mentioned: 0, intents: new Set() }
      }
      
      categoryStats[categoryName].total++
      categoryStats[categoryName].intents.add(query.intents?.[0]?.label || 'Unknown')
      if (query.brand_mentions?.[0]?.mentioned) {
        categoryStats[categoryName].mentioned++
      }
    })

    return Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        total: stats.total,
        mentioned: stats.mentioned,
        citationRate: (stats.mentioned / stats.total) * 100,
        intentCount: stats.intents.size,
        ci: calculateWilsonInterval(stats.mentioned, stats.total),
      }))
      .sort((a, b) => b.total - a.total)
  }, [filteredQueries, intents, categoryMap])

  // Subcategory data
  const subcategoryData = useMemo(() => {
    const subcategoryStats: Record<string, { total: number; mentioned: number; category: string }> = {}
    
    filteredQueries.forEach((query) => {
      const intent = intents.find((i) => i.id === query.intents?.[0]?.id)
      const category = intent?.categories?.[0]
      
      // Only process if it's a subcategory (has parent_id)
      if (category && category.parent_id) {
        const parentCat = categoryMap.get(category.parent_id)
        const subcategoryName = category.name
        const parentName = parentCat?.name || 'Other'
        
        if (!subcategoryStats[subcategoryName]) {
          subcategoryStats[subcategoryName] = { total: 0, mentioned: 0, category: parentName }
        }
        
        subcategoryStats[subcategoryName].total++
        if (query.brand_mentions?.[0]?.mentioned) {
          subcategoryStats[subcategoryName].mentioned++
        }
      }
    })

    return Object.entries(subcategoryStats)
      .map(([subcategory, stats]) => ({
        subcategory,
        category: stats.category,
        total: stats.total,
        mentioned: stats.mentioned,
        citationRate: (stats.mentioned / stats.total) * 100,
        ci: calculateWilsonInterval(stats.mentioned, stats.total),
      }))
      .sort((a, b) => b.total - a.total)
  }, [filteredQueries, intents, categoryMap])

  // Individual prompt performance
  const promptData = useMemo(() => {
    const promptStats: Record<string, { total: number; mentioned: number; label: string }> = {}
    
    filteredQueries.forEach((query) => {
      const promptText = query.prompt_text || query.intents?.[0]?.label || 'Unknown'
      const key = promptText.substring(0, 100)
      
      if (!promptStats[key]) {
        promptStats[key] = { total: 0, mentioned: 0, label: query.intents?.[0]?.label || 'Unknown' }
      }
      
      promptStats[key].total++
      if (query.brand_mentions?.[0]?.mentioned) {
        promptStats[key].mentioned++
      }
    })

    return Object.entries(promptStats)
      .map(([prompt, stats]) => ({
        prompt,
        label: stats.label,
        total: stats.total,
        mentioned: stats.mentioned,
        citationRate: (stats.mentioned / stats.total) * 100,
        ci: calculateWilsonInterval(stats.mentioned, stats.total),
      }))
      .sort((a, b) => b.total - a.total)
  }, [filteredQueries])

  // Group by model
  const byModel = filteredQueries.reduce((acc, query) => {
    const modelName = query.models?.[0]?.model_name || 'Unknown'
    if (!acc[modelName]) {
      acc[modelName] = { total: 0, mentioned: 0 }
    }
    acc[modelName].total++
    if (query.brand_mentions?.[0]?.mentioned) {
      acc[modelName].mentioned++
    }
    return acc
  }, {} as Record<string, { total: number; mentioned: number }>)

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategories([])
    setSelectedSubcategories([])
    setSelectedPrompts([])
  }

  const hasActiveFilters = selectedCategories.length > 0 || selectedSubcategories.length > 0 || selectedPrompts.length > 0

  return (
    <div className="space-y-6">
      {/* Date Range Selector */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-sm font-medium">Time Range:</span>
        <div className="flex gap-2">
          {(['7d', '30d', '90d', 'all'] as DateRange[]).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(range)}
            >
              {range === 'all' ? 'All Time' : range.toUpperCase()}
            </Button>
          ))}
        </div>
        <span className="text-sm text-muted-foreground ml-4">
          Showing {totalQueries} of {queries.length} queries
        </span>
      </div>

      {/* Filters */}
      <div className="flex items-start gap-4 flex-wrap">
        <div className="flex gap-2">
          <FilterDropdown
            label="Category"
            options={parentCategories}
            selected={selectedCategories}
            onSelect={(value) => {
              setSelectedCategories((prev) =>
                prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
              )
            }}
          />
          <FilterDropdown
            label="Subcategory"
            options={childCategories}
            selected={selectedSubcategories}
            onSelect={(value) => {
              setSelectedSubcategories((prev) =>
                prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
              )
            }}
          />
          <FilterDropdown
            label="Prompt"
            options={promptsList}
            selected={selectedPrompts}
            onSelect={(value) => {
              setSelectedPrompts((prev) =>
                prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]
              )
            }}
          />
        </div>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearAllFilters}>
            Clear All
          </Button>
        )}
      </div>

      {/* Selected Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {selectedCategories.map((cat) => (
            <Badge key={cat} variant="secondary" className="gap-1">
              Category: {cat}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSelectedCategories((prev) => prev.filter((c) => c !== cat))}
              />
            </Badge>
          ))}
          {selectedSubcategories.map((sub) => (
            <Badge key={sub} variant="secondary" className="gap-1">
              Subcategory: {sub}
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSelectedSubcategories((prev) => prev.filter((s) => s !== sub))}
              />
            </Badge>
          ))}
          {selectedPrompts.map((prompt) => (
            <Badge key={prompt} variant="secondary" className="gap-1">
              Prompt: {prompt.substring(0, 40)}...
              <X
                className="h-3 w-3 cursor-pointer"
                onClick={() => setSelectedPrompts((prev) => prev.filter((p) => p !== prompt))}
              />
            </Badge>
          ))}
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalQueries}</div>
            <p className="text-xs text-muted-foreground">
              Executed across all models
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Citation Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{citationRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {queriesWithBrandMention} of {totalQueries} queries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confidence</CardTitle>
            <ConfidenceBadge level={confidenceLevel} size="small" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {wilsonInterval.lower.toFixed(1)}% - {wilsonInterval.upper.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              95% CI (n={totalQueries})
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgResponseLength.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">characters per response</p>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      {timeSeriesData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Queries & Citation Rate Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis yAxisId="left" orientation="left" label={{ value: 'Queries', angle: -90, position: 'insideLeft' }} />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} label={{ value: 'Citation Rate (%)', angle: 90, position: 'insideRight' }} />
                <Tooltip />
                <Legend />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="queries"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  name="Total Queries"
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="mentions"
                  stroke="#10b981"
                  strokeWidth={2}
                  name="Brand Mentions"
                  dot={{ r: 4 }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="citationRate"
                  stroke="#f59e0b"
                  strokeWidth={3}
                  name="Citation Rate (%)"
                  dot={{ r: 5 }}
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Performance by Category */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Queries</TableHead>
                <TableHead className="text-right">Prompts</TableHead>
                <TableHead className="text-right">Brand Mentions</TableHead>
                <TableHead className="text-right">Citation Rate</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categoryData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No data for selected filters. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              ) : (
                categoryData.map((cat) => {
                  const conf = getConfidenceLevel(cat.ci.width, cat.total)
                  return (
                    <TableRow key={cat.category}>
                      <TableCell className="font-medium">{cat.category}</TableCell>
                      <TableCell className="text-right">{cat.total}</TableCell>
                      <TableCell className="text-right">{cat.intentCount}</TableCell>
                      <TableCell className="text-right">{cat.mentioned}</TableCell>
                      <TableCell className="text-right">
                        {cat.citationRate.toFixed(1)}%
                        <span className="text-xs text-muted-foreground ml-2">
                          ({cat.ci.lower.toFixed(0)}% - {cat.ci.upper.toFixed(0)}%)
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <ConfidenceBadge level={conf} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Performance by Subcategory */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Subcategory</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Subcategory</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Queries</TableHead>
                <TableHead className="text-right">Brand Mentions</TableHead>
                <TableHead className="text-right">Citation Rate</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {subcategoryData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground">
                    No data for selected filters. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              ) : (
                subcategoryData.map((subcat) => {
                  const conf = getConfidenceLevel(subcat.ci.width, subcat.total)
                  return (
                    <TableRow key={subcat.subcategory}>
                      <TableCell className="font-medium">{subcat.subcategory}</TableCell>
                      <TableCell className="text-muted-foreground">{subcat.category}</TableCell>
                      <TableCell className="text-right">{subcat.total}</TableCell>
                      <TableCell className="text-right">{subcat.mentioned}</TableCell>
                      <TableCell className="text-right">
                        {subcat.citationRate.toFixed(1)}%
                        <span className="text-xs text-muted-foreground ml-2">
                          ({subcat.ci.lower.toFixed(0)}% - {subcat.ci.upper.toFixed(0)}%)
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <ConfidenceBadge level={conf} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Performance by Individual Prompt */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Individual Prompt</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Prompt</TableHead>
                <TableHead className="text-right">Queries</TableHead>
                <TableHead className="text-right">Brand Mentions</TableHead>
                <TableHead className="text-right">Citation Rate</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promptData.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No data for selected filters. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              ) : (
                promptData.map((prompt) => {
                  const conf = getConfidenceLevel(prompt.ci.width, prompt.total)
                  return (
                    <TableRow key={prompt.prompt}>
                      <TableCell className="max-w-md truncate font-medium">
                        {prompt.prompt}
                      </TableCell>
                      <TableCell className="text-right">{prompt.total}</TableCell>
                      <TableCell className="text-right">{prompt.mentioned}</TableCell>
                      <TableCell className="text-right">
                        {prompt.citationRate.toFixed(1)}%
                        <span className="text-xs text-muted-foreground ml-2">
                          ({prompt.ci.lower.toFixed(0)}% - {prompt.ci.upper.toFixed(0)}%)
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <ConfidenceBadge level={conf} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Performance by Model */}
      <Card>
        <CardHeader>
          <CardTitle>Performance by Model</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Model</TableHead>
                <TableHead className="text-right">Queries</TableHead>
                <TableHead className="text-right">Brand Mentions</TableHead>
                <TableHead className="text-right">Citation Rate</TableHead>
                <TableHead className="text-right">Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(byModel).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No data for selected filters. Try adjusting your filters.
                  </TableCell>
                </TableRow>
              ) : (
                Object.entries(byModel).map(([model, stats]) => {
                  const rate = (stats.mentioned / stats.total) * 100
                  const ci = calculateWilsonInterval(stats.mentioned, stats.total)
                  const conf = getConfidenceLevel(ci.width, stats.total)
                  return (
                    <TableRow key={model}>
                      <TableCell className="font-medium">{model}</TableCell>
                      <TableCell className="text-right">{stats.total}</TableCell>
                      <TableCell className="text-right">{stats.mentioned}</TableCell>
                      <TableCell className="text-right">
                        {rate.toFixed(1)}%
                        <span className="text-xs text-muted-foreground ml-2">
                          ({ci.lower.toFixed(0)}% - {ci.upper.toFixed(0)}%)
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <ConfidenceBadge level={conf} />
                      </TableCell>
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

// Filter Dropdown Component
function FilterDropdown({
  label,
  options,
  selected,
  onSelect,
}: {
  label: string
  options: string[]
  selected: string[]
  onSelect: (value: string) => void
}) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Filter className="h-4 w-4" />
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-1">
              {selected.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}...`} />
          <CommandEmpty>No {label.toLowerCase()} found.</CommandEmpty>
          <CommandGroup className="max-h-[300px] overflow-auto">
            {options.map((option) => (
              <CommandItem
                key={option}
                onSelect={() => {
                  onSelect(option)
                }}
              >
                <div className="flex items-center gap-2 flex-1">
                  <div
                    className={`h-4 w-4 border rounded-sm flex items-center justify-center ${
                      selected.includes(option) ? 'bg-primary border-primary' : 'border-input'
                    }`}
                  >
                    {selected.includes(option) && <Check className="h-3 w-3 text-primary-foreground" />}
                  </div>
                  <span className="truncate">{option}</span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// Helper functions (same as before)
function calculateWilsonInterval(successes: number, total: number) {
  if (total === 0) {
    return { lower: 0, upper: 100, width: 100 }
  }

  const p = successes / total
  const z = 1.96
  const denominator = 1 + (z * z) / total

  const center = (p + (z * z) / (2 * total)) / denominator
  const margin =
    (z * Math.sqrt((p * (1 - p)) / total + (z * z) / (4 * total * total))) / denominator

  const lower = Math.max(0, (center - margin) * 100)
  const upper = Math.min(100, (center + margin) * 100)

  return {
    lower,
    upper,
    width: upper - lower,
  }
}

function getConfidenceLevel(ciWidth: number, sampleSize: number): string {
  if (sampleSize < 3) return 'insufficient'
  if (sampleSize >= 30 && ciWidth < 10) return 'high'
  if (sampleSize >= 10 && ciWidth <= 20) return 'medium'
  return 'low'
}

function ConfidenceBadge({ level, size = 'default' }: { level: string; size?: 'small' | 'default' }) {
  const badges = {
    high: { emoji: '🟢', text: 'High', variant: 'default' as const },
    medium: { emoji: '🟡', text: 'Medium', variant: 'secondary' as const },
    low: { emoji: '🔴', text: 'Low', variant: 'destructive' as const },
    insufficient: { emoji: '⚪', text: 'Insufficient', variant: 'outline' as const },
  }

  const badge = badges[level as keyof typeof badges] || badges.insufficient

  if (size === 'small') {
    return <span className="text-lg">{badge.emoji}</span>
  }

  return (
    <Badge variant={badge.variant}>
      {badge.emoji} {badge.text}
    </Badge>
  )
}
