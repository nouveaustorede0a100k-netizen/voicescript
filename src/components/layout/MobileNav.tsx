'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderOpen,
  Plus,
  Search,
  Settings,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileNavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: MobileNavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projets', href: '/projects', icon: FolderOpen },
  { label: 'Upload', href: '/upload', icon: Plus },
  { label: 'Recherche', href: '/projects', icon: Search },
  { label: 'Réglages', href: '/settings', icon: Settings },
]

export function MobileNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-white pb-[env(safe-area-inset-bottom)] lg:hidden">
      <div className="flex h-16 items-center justify-around">
        {NAV_ITEMS.map((item) => {
          const isUpload = item.href === '/upload' && item.label === 'Upload'
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          if (isUpload) {
            return (
              <Link
                key={`${item.label}-${item.href}`}
                href={item.href}
                className="flex flex-col items-center"
                aria-label={item.label}
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-vs-primary shadow-lg shadow-indigo-500/30 -translate-y-2">
                  <Plus className="h-6 w-6 text-white" />
                </div>
              </Link>
            )
          }

          return (
            <Link
              key={`${item.label}-${item.href}`}
              href={item.href}
              className={cn(
                'flex flex-col items-center gap-0.5 px-2',
                isActive ? 'text-indigo-500' : 'text-gray-400'
              )}
              aria-label={item.label}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
