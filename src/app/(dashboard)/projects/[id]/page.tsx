import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ProjectDetail } from '@/components/projects/ProjectDetail'
import type { TranscriptionListItem } from '@/types'

interface ProjectPageProps {
  params: Promise<{ id: string }>
}

export default async function ProjectPage({ params }: ProjectPageProps) {
  const { id } = await params
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()

  if (!project) redirect('/projects')

  const { data: transcriptions } = await supabase
    .from('transcriptions')
    .select('id, title, status, file_duration, file_type, language, accent, word_count, confidence_avg, created_at, updated_at')
    .eq('project_id', id)
    .order('created_at', { ascending: false })

  const safeTranscriptions: TranscriptionListItem[] = (transcriptions ?? []).map((t) => ({
    ...t,
    word_count: t.word_count ?? 0,
  }))

  return (
    <ProjectDetail
      project={project}
      initialTranscriptions={safeTranscriptions}
    />
  )
}
