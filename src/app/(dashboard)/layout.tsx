import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/Sidebar'
import { Topbar } from '@/components/layout/Topbar'
import { MobileNav } from '@/components/layout/MobileNav'
import type { Profile } from '@/types'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const safeProfile = (profile as Profile) ?? null

  return (
    <div className="flex min-h-screen bg-vs-background">
      {/* Sidebar desktop fixe + mobile slide-in */}
      <Sidebar profile={safeProfile} />

      {/* Zone contenu principale */}
      <div className="flex flex-1 flex-col lg:min-w-0">
        <Topbar profile={safeProfile} />
        <main className="flex-1 overflow-y-auto p-4 pb-20 lg:p-6 lg:pb-6">
          {children}
        </main>
      </div>

      {/* Navigation mobile en bas */}
      <MobileNav />
    </div>
  )
}
