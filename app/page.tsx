import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowRight, Key, BarChart3, Settings, CheckCircle2, TrendingUp, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center">
              <Image 
                src="/promptwind.png" 
                alt="PromptWind" 
                width={200}
                height={56}
                style={{ height: '48px', width: 'auto' }}
                priority
              />
            </Link>
            <div className="flex items-center gap-4">
              <Link href="/auth">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/auth">
                <Button>Get Started Free</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-5xl font-bold tracking-tight text-gray-900 sm:text-6xl mb-6">
            Track Your Brand Across LLM Responses.<br />With Full Control.
          </h1>
          <p className="mx-auto max-w-3xl text-xl text-gray-600 mb-10">
            Monitor how ChatGPT, Claude, and other AI models mention your brand. Use your own API keys, control your costs and get useful insights to improve your AI visibility.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link href="/auth">
              <Button size="lg" className="gap-2">
                Start Tracking for Free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <a href="https://github.com/4L3k51/promptwind" target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="gap-2">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
                Self-Host on GitHub
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section className="bg-gray-900 text-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
            Statistical rigor at the lowest costs.
            </h2>
            <p className="text-lg text-gray-300">
            Real confidence requires real measurement. You decide how to track: depth, breadth, or both.
            </p>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-center mb-12">
          Take control of your AI visibility measurement.
        </h2>
        <div className="grid gap-8 md:grid-cols-3">
          {/* Column 1 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Use Your Own API Keys</CardTitle>
              </div>
              <p className="text-sm text-gray-600">No markups. No monthly subscription trap.</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Add your OpenAI, Anthropic, or Google API keys</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>You pay LLM providers directly (typically $3-10/month)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Encrypted storage, never exposed</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Control your own rate limits</span>
              </div>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-xs font-semibold text-blue-900">
                  Compare: $5/month (your API costs) vs. $99+/month (typical tools)
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Column 2 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">See What's Actually Happening</CardTitle>
              </div>
              <p className="text-sm text-gray-600">Track citation patterns with confidence.</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Citation rate with confidence intervals</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Brand position tracking (1st, 2nd, 3rd mention)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Competitor mentions and rankings</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>See which queries mention you and which don't</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Sample size guidance (know when you have enough data)</span>
              </div>
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-xs font-semibold text-green-900">
                  Understand trends, not just one-off responses.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Column 3 */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2 mb-2">
                <Settings className="h-6 w-6 text-primary" />
                <CardTitle className="text-xl">Flexible Tracking</CardTitle>
              </div>
              <p className="text-sm text-gray-600">Track what matters to your business.</p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Define your key queries ("best CRM," "database comparison," etc.)</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Test multiple question variations</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Schedule automatic daily checks</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Track multiple LLM models simultaneously</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5" />
                <span>Export all data (CSV/JSON)</span>
              </div>
              <div className="mt-4 p-3 bg-purple-50 rounded-lg">
                <p className="text-xs font-semibold text-purple-900">
                  Set it up once, monitor continuously.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* How It Works */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>
          <div className="grid gap-8 md:grid-cols-4">
            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">Connect Your API Keys</h3>
              <p className="text-sm text-gray-600">
                Add your OpenAI, Anthropic, or Google keys. They're encrypted and stored securely.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">Define What to Track</h3>
              <p className="text-sm text-gray-600">
                Set up "intents" - the business questions you care about. Example: "What are the best databases for startups?"
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">Configure Your Tracking</h3>
              <p className="text-sm text-gray-600">
                Choose how often to check (daily samples), which models to test, and question variations.
              </p>
            </div>

            <div className="text-center">
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <span className="text-2xl font-bold text-orange-600">4</span>
              </div>
              <h3 className="font-semibold mb-2">Monitor Your Visibility</h3>
              <p className="text-sm text-gray-600">
                See citation rates, brand positions, competitor comparisons, and trends over time. Export data anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-primary text-primary-foreground py-20">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">
            Start Tracking Your AI Visibility Today
          </h2>
          <p className="text-xl mb-8 opacity-90">
            No credit card required. Use your own API keys. Cancel anytime.
          </p>
          <Link href="/auth">
            <Button size="lg" variant="secondary" className="gap-2">
              Get Started Free
              <ArrowRight className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-white py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-gray-600">
            <p>&copy; 2025 LLM Citation Tracker. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
