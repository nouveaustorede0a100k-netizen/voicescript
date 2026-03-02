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

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: transcription, error } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !transcription) {
      return NextResponse.json({ error: 'Transcription introuvable' }, { status: 404 })
    }

    const { data: segments } = await supabase
      .from('transcription_segments')
      .select('*')
      .eq('transcription_id', id)
      .order('position', { ascending: true })

    return NextResponse.json({
      transcription,
      segments: segments ?? [],
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

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json() as {
      segment_id?: string
      text?: string
      title?: string
    }

    // Mise à jour du titre de la transcription
    if (body.title !== undefined) {
      const { error } = await supabase
        .from('transcriptions')
        .update({ title: body.title })
        .eq('id', id)

      if (error) {
        return NextResponse.json({ error: 'Erreur mise à jour titre' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    // Mise à jour d'un segment
    if (body.segment_id && body.text !== undefined) {
      const { error } = await supabase
        .from('transcription_segments')
        .update({ text: body.text, is_edited: true })
        .eq('id', body.segment_id)
        .eq('transcription_id', id)

      if (error) {
        return NextResponse.json({ error: 'Erreur mise à jour segment' }, { status: 500 })
      }
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Paramètres manquants' }, { status: 400 })
  } catch {
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}
