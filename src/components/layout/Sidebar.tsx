'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  FolderOpen,
  Upload,
  Settings,
  Mic,
  X,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { Button } from '@/components/ui/button'
import { useSidebarStore } from '@/lib/stores/useSidebarStore'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Projets', href: '/projects', icon: FolderOpen },
  { label: 'Nouvel upload', href: '/upload', icon: Upload },
  { label: 'Paramètres', href: '/settings', icon: Settings },
]

const PLAN_STYLES: Record<Profile['plan'], { label: string; className: string }> = {
  free: { label: 'Free', className: 'bg-slate-500/20 text-slate-300' },
  creator: { label: 'Creator', className: 'bg-indigo-500/20 text-indigo-300' },
  pro: { label: 'Pro', className: 'bg-violet-500/20 text-violet-300' },
  studio: { label: 'Studio', className: 'bg-amber-500/20 text-amber-300' },
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

function getQuotaColor(percentage: number): string {
  if (percentage >= 90) return '[&>[data-slot=progress-indicator]]:bg-rose-500'
  if (percentage >= 70) return '[&>[data-slot=progress-indicator]]:bg-amber-500'
  return '[&>[data-slot=progress-indicator]]:bg-indigo-400'
}

interface SidebarProps {
  profile: Profile | null
}

export function Sidebar({ profile }: SidebarProps) {
  const pathname = usePathname()
  const { isOpen, close } = useSidebarStore()

  const plan = profile?.plan ?? 'free'
  const planStyle = PLAN_STYLES[plan]
  const minutesUsed = profile?.minutes_used ?? 0
  const minutesLimit = profile?.minutes_limit ?? 30
  const quotaPercentage = minutesLimit > 0 ? (minutesUsed / minutesLimit) * 100 : 0

  return (
    <>
      {/* Overlay mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={close}
          aria-hidden="true"
        />
      )}

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 flex w-60 flex-col bg-vs-sidebar-dark transition-transform duration-200 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="flex h-16 items-center justify-between px-5">
          <Link href="/dashboard" className="flex items-center gap-2.5" onClick={close}>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-vs-primary">
              <Mic className="h-4.5 w-4.5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">VoiceScript</span>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-slate-400 hover:bg-white/10 hover:text-white lg:hidden"
            onClick={close}
            aria-label="Fermer le menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 pt-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={close}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-400'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Section utilisateur */}
        <div className="p-3">
          <Separator className="mb-3 bg-white/10" />
          <div className="rounded-lg bg-white/5 p-3">
            <div className="flex items-center gap-3">
              <Avatar size="default">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                ) : null}
                <AvatarFallback className="bg-indigo-600 text-xs text-white">
                  {getInitials(profile?.full_name ?? 'U')}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-white">
                  {profile?.full_name ?? 'Utilisateur'}
                </p>
                <Badge
                  variant="secondary"
                  className={cn('mt-0.5 text-[10px] leading-tight', planStyle.className)}
                >
                  {planStyle.label}
                </Badge>
              </div>
            </div>

            {/* Barre de progression quotas */}
            <div className="mt-3">
              <div className="mb-1.5 flex items-center justify-between">
                <span className="text-xs text-slate-400">Minutes utilisées</span>
                <span className="text-xs font-medium text-slate-300">
                  {minutesUsed}/{minutesLimit}
                </span>
              </div>
              <Progress
                value={Math.min(quotaPercentage, 100)}
                className={cn('h-1.5 bg-white/10', getQuotaColor(quotaPercentage))}
              />
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}
