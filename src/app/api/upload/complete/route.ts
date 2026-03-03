import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const VALID_ACCENTS = [
  'fr-standard',
  'fr-quebec',
  'fr-africa',
  'fr-belgium',
  'fr-swiss',
] as const

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = await request.json()
    const {
      key,
      fileName,
      fileSize,
      fileType,
      title,
      language,
      accent,
      projectId,
    } = body

    if (!key || !fileName) {
      return NextResponse.json(
        { error: 'Paramètres manquants (key, fileName)' },
        { status: 400 }
      )
    }

    const safeAccent = VALID_ACCENTS.includes(accent)
      ? (accent as (typeof VALID_ACCENTS)[number])
      : 'fr-standard'

    const fileUrl = `${process.env.R2_PUBLIC_URL}/${key}`

    const { data: transcription, error: dbError } = await supabase
      .from('transcriptions')
      .insert({
        user_id: user.id,
        project_id: projectId || null,
        title: title || fileName || 'Sans titre',
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize || null,
        file_type: fileType || null,
        language: language || 'fr',
        accent: safeAccent,
        status: 'pending',
      })
      .select('id')
      .single()

    if (dbError || !transcription) {
      console.error('[Complete] DB Error:', dbError)
      return NextResponse.json(
        { error: `Erreur base de données : ${dbError?.message ?? 'Insertion échouée'}` },
        { status: 500 }
      )
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${appUrl}/api/transcriptions/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify({ transcription_id: transcription.id }),
    }).catch((err) => {
      console.error('[Complete] Erreur lancement pipeline:', err)
    })

    return NextResponse.json({
      transcription_id: transcription.id,
      status: 'pending',
    })
  } catch (error) {
    console.error('[Complete] Erreur:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { error: `Erreur lors de la finalisation : ${message}` },
      { status: 500 }
    )
  }
}
