import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !project) {
      return NextResponse.json({ error: 'Projet introuvable' }, { status: 404 })
    }

    const { data: transcriptions } = await supabase
      .from('transcriptions')
      .select('id, title, status, file_duration, file_type, language, accent, word_count, confidence_avg, created_at, updated_at')
      .eq('project_id', id)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      project,
      transcriptions: transcriptions ?? [],
    })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function PATCH(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    const body = await request.json() as {
      name?: string
      color?: string
      description?: string
    }

    const updates: Record<string, string> = {}
    if (body.name !== undefined) updates.name = body.name
    if (body.color !== undefined) updates.color = body.color
    if (body.description !== undefined) updates.description = body.description

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'Rien à mettre à jour' }, { status: 400 })
    }

    const { error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Erreur de mise à jour' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function DELETE(_request: Request, { params }: RouteParams) {
  try {
    const { id } = await params
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })

    // Dissocier les transcriptions (ON DELETE SET NULL le fait aussi, mais soyons explicites)
    await supabase
      .from('transcriptions')
      .update({ project_id: null })
      .eq('project_id', id)

    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: 'Erreur de suppression' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
