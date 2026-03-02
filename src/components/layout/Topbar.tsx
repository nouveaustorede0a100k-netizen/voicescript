'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Menu,
  Upload,
  Bell,
  User,
  CreditCard,
  LogOut,
} from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useSidebarStore } from '@/lib/stores/useSidebarStore'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types'

interface TopbarProps {
  profile: Profile | null
}

const BREADCRUMB_MAP: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projets',
  '/upload': 'Nouvel upload',
  '/settings': 'Paramètres',
}

function getBreadcrumb(pathname: string): string {
  if (BREADCRUMB_MAP[pathname]) return BREADCRUMB_MAP[pathname]
  if (pathname.startsWith('/editor/')) return 'Éditeur'
  if (pathname.startsWith('/settings/')) return 'Paramètres'
  return 'Dashboard'
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Topbar({ profile }: TopbarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { toggle } = useSidebarStore()
  const supabase = createClient()
  const breadcrumb = getBreadcrumb(pathname)

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  return (
    <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-white px-4 lg:px-6">
      <div className="flex items-center gap-3">
        {/* Hamburger mobile */}
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={toggle}
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </Button>

        {/* Breadcrumb */}
        <h1 className="text-lg font-semibold text-vs-text">{breadcrumb}</h1>
      </div>

      <div className="flex items-center gap-2">
        {/* Bouton nouvel upload — masqué sur petits écrans */}
        <Button asChild size="sm" className="hidden sm:inline-flex">
          <Link href="/upload">
            <Upload className="h-4 w-4" />
            Nouvel upload
          </Link>
        </Button>

        {/* Notifications */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5 text-muted-foreground" />
        </Button>

        {/* Menu utilisateur */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full"
              aria-label="Menu utilisateur"
            >
              <Avatar size="sm">
                {profile?.avatar_url ? (
                  <AvatarImage src={profile.avatar_url} alt={profile.full_name} />
                ) : null}
                <AvatarFallback className="bg-vs-primary text-[10px] text-white">
                  {getInitials(profile?.full_name ?? 'U')}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium">
                {profile?.full_name ?? 'Utilisateur'}
              </p>
              <p className="text-xs text-muted-foreground">
                {profile?.email ?? ''}
              </p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <User className="h-4 w-4" />
                Mon profil
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/settings" className="cursor-pointer">
                <CreditCard className="h-4 w-4" />
                Facturation
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onClick={handleSignOut}
              className="cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
