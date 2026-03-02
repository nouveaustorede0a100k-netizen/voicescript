import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ProjectsContent } from '@/components/projects/ProjectsContent'

export default async function ProjectsPage() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  // Compter les transcriptions par projet
  const projectIds = (projects ?? []).map((p) => p.id)
  const counts = new Map<string, number>()

  if (projectIds.length > 0) {
    const { data: transcriptions } = await supabase
      .from('transcriptions')
      .select('project_id')
      .in('project_id', projectIds)

    for (const t of transcriptions ?? []) {
      if (t.project_id) {
        counts.set(t.project_id, (counts.get(t.project_id) ?? 0) + 1)
      }
    }
  }

  const projectsWithCounts = (projects ?? []).map((p) => ({
    ...p,
    transcription_count: counts.get(p.id) ?? 0,
  }))

  return <ProjectsContent initialProjects={projectsWithCounts} />
}
