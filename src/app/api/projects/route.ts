import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { projectSchema } from '@/types'

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Récupérer les projets avec le count de transcriptions
    const { data: projects, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Erreur de récupération' }, { status: 500 })
    }

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

    const result = (projects ?? []).map((p) => ({
      ...p,
      transcription_count: counts.get(p.id) ?? 0,
    }))

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json()
    const parsed = projectSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      )
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: parsed.data.name,
        color: parsed.data.color,
        description: parsed.data.description,
      })
      .select('*')
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Erreur de création' }, { status: 500 })
    }

    return NextResponse.json(project, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
