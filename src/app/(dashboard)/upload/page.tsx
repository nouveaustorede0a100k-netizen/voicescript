import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { UploadContent } from '@/components/upload/UploadContent'
import type { PlanType } from '@/types'

const MAX_SIZE_MB: Record<PlanType, number> = {
  free: 500,
  creator: 2048,
  pro: 2048,
  studio: 5120,
}

interface UploadPageProps {
  searchParams: Promise<{ project?: string }>
}

export default async function UploadPage({ searchParams }: UploadPageProps) {
  const sp = await searchParams
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const [profileResult, projectsResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('plan, minutes_used, minutes_limit, preferred_accent')
      .eq('id', user.id)
      .single(),
    supabase
      .from('projects')
      .select('id, name, color')
      .eq('user_id', user.id)
      .order('name', { ascending: true }),
  ])

  const profile = profileResult.data
  const plan = (profile?.plan ?? 'free') as PlanType
  const minutesRemaining = Math.max(
    (profile?.minutes_limit ?? 30) - (profile?.minutes_used ?? 0),
    0
  )
  const maxSizeMB = MAX_SIZE_MB[plan]
  const defaultAccent = profile?.preferred_accent ?? 'fr-standard'
  const projects = projectsResult.data ?? []
  const defaultProjectId = sp.project ?? null

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-vs-text">Nouvel upload</h1>
        <p className="text-sm text-muted-foreground">
          Importez un fichier audio ou vidéo pour le transcrire
        </p>
      </div>

      <UploadContent
        maxSizeMB={maxSizeMB}
        minutesRemaining={minutesRemaining}
        defaultAccent={defaultAccent}
        defaultProjectId={defaultProjectId}
        projects={projects}
      />
    </div>
  )
}
