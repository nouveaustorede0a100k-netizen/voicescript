import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
  getDashboardStats,
  getRecentTranscriptions,
} from '@/lib/queries/dashboard'
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader'
import { UpgradeBanner } from '@/components/dashboard/UpgradeBanner'
import { StatsCards } from '@/components/dashboard/StatsCards'
import { RecentFiles } from '@/components/dashboard/RecentFiles'
import type { Profile, UserStats, TranscriptionListItem } from '@/types'

export default async function DashboardPage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileResult, stats, transcriptions] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', user.id).single(),
    getDashboardStats(supabase, user.id),
    getRecentTranscriptions(supabase, user.id, 10),
  ])

  const profile = profileResult.data as Profile | null
  const firstName = profile?.full_name?.split(' ')[0] ?? 'Utilisateur'

  const safeStats: UserStats = stats ?? {
    total_transcriptions: 0,
    completed_transcriptions: 0,
    total_minutes_consumed: 0,
    this_month_minutes: 0,
    last_transcription_at: null,
    minutes_used: profile?.minutes_used ?? 0,
    minutes_limit: profile?.minutes_limit ?? 30,
    plan: profile?.plan ?? 'free',
  }

  const safeTranscriptions: TranscriptionListItem[] = transcriptions ?? []

  return (
    <div className="space-y-6">
      <WelcomeHeader firstName={firstName} />

      <UpgradeBanner
        plan={safeStats.plan}
        minutesUsed={safeStats.minutes_used}
        minutesLimit={safeStats.minutes_limit}
      />

      <StatsCards stats={safeStats} />

      <RecentFiles initialTranscriptions={safeTranscriptions} />
    </div>
  )
}
