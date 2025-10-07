'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Settings,
  BarChart3,
  Bot,
  Key,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Prompts', href: '/prompts', icon: FileText },
  { name: 'Models', href: '/models', icon: Bot },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'API Keys', href: '/settings/api-keys', icon: Key },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()

  return (
    <div className="flex h-screen w-64 flex-col border-r bg-white">
      {/* Logo/Brand */}
      <div className="flex h-20 items-center border-b px-4">
        <Link href="/" className="flex items-center">
          <Image 
            src="/promptwind.png" 
            alt="PromptWind" 
            width={200}
            height={56}
            style={{ height: '56px', width: 'auto' }}
            priority
          />
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          // Check if current item is active
          const isExactMatch = pathname === item.href
          const isChildRoute = pathname?.startsWith(item.href + '/')
          // Don't highlight parent if there's a more specific exact match
          const hasMoreSpecificMatch = navigation.some(nav => 
            nav.href !== item.href && pathname === nav.href
          )
          const isActive = isExactMatch || (isChildRoute && !hasMoreSpecificMatch)
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      {/* User section */}
      <div className="border-t p-4">
        <form action="/auth/signout" method="post">
          <button
            type="submit"
            className="w-full rounded-lg bg-muted px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-red-100 hover:text-red-600"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  )
}

