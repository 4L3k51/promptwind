import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { AppLayout } from '@/components/layouts/app-layout'
import { ArrowRight } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth')
  }

  return (
    <AppLayout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">


        {/* Getting Started Steps */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Getting Started</h2>
          <div className="space-y-6">
            <Link href="/settings/api-keys" className="block rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-300">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Connect Your API Keys
                  </h3>
                  <p className="text-gray-600">
                    Add your OpenAI API key to start querying LLMs. You only pay for what you use.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 shrink-0 ml-4" />
              </div>
            </Link>

            <Link href="/models" className="block rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-300">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Configure Your Models
                  </h3>
                  <p className="text-gray-600">
                    Enable GPT-4o with web search to start tracking citations. Compare multiple models to see which mentions your brand most.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 shrink-0 ml-4" />
              </div>
            </Link>

            <Link href="/prompts" className="block rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-300">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Schedule Your Queries
                  </h3>
                  <p className="text-gray-600">
                    Decide how often you want to run queries on your prompts. We&apos;ll track brand mentions and citation rates with statistical confidence intervals.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 shrink-0 ml-4" />
              </div>
            </Link>

            <Link href="/analytics" className="block rounded-lg border bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-blue-300">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Explore Your Results
                  </h3>
                  <p className="text-gray-600">
                    Discover where you stand in the AI landscape with comprehensive analytics and confidence intervals.
                  </p>
                </div>
                <ArrowRight className="h-5 w-5 text-gray-400 shrink-0 ml-4" />
              </div>
            </Link>
          </div>
        </div>

        {/* What You'll Track */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">What You&apos;ll Track</h2>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Citation Rate
              </h3>
              <p className="text-gray-600">
                See how often LLMs mention your brand across different query types. We use Wilson confidence intervals to ensure statistical rigor.
              </p>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Category Performance
              </h3>
              <p className="text-gray-600">
                Discover which topics and categories you dominate—and which ones you don&apos;t. Identify opportunities to improve your AI visibility.
              </p>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Model Comparison
              </h3>
              <p className="text-gray-600">
                Compare how different LLMs (GPT-4o, GPT-4o Mini, etc.) cite your brand. Understand model-specific behavior patterns.
              </p>
            </div>

            <div className="rounded-lg border bg-white p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Time Series Trends
              </h3>
              <p className="text-gray-600">
                Track changes over time. See if your citation rate improves as you optimize your content for AI-powered search.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
