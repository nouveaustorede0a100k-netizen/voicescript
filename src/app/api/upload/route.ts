import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { uploadFile } from '@/lib/storage/r2'

const ALLOWED_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/x-m4a',
  'video/mp4',
  'video/webm',
  'audio/ogg',
  'audio/webm',
]

const MAX_SIZES: Record<string, number> = {
  free: 500 * 1024 * 1024,
  creator: 2 * 1024 * 1024 * 1024,
  pro: 2 * 1024 * 1024 * 1024,
  studio: 5 * 1024 * 1024 * 1024,
}

function formatMB(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${Math.round(bytes / (1024 * 1024 * 1024))}GB`
  return `${Math.round(bytes / (1024 * 1024))}MB`
}

export async function POST(request: Request) {
  try {
    console.log('[Upload] Début du traitement')

    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    console.log('[Upload] Auth:', user?.id, 'Error:', authError?.message)

    if (authError || !user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan, minutes_used, minutes_limit')
      .eq('id', user.id)
      .single()

    console.log('[Upload] Profil:', profile?.plan, 'Error:', profileError?.message)
    const plan = profile?.plan || 'free'

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const title = (formData.get('title') as string) || 'Sans titre'
    const language = (formData.get('language') as string) || 'fr'
    const accent = (formData.get('accent') as string) || 'fr-standard'
    const projectId = (formData.get('project_id') as string) || null

    console.log('[Upload] Fichier:', file?.name, 'Taille:', file?.size, 'Type:', file?.type)

    if (!file) {
      return NextResponse.json({ error: 'Aucun fichier fourni' }, { status: 422 })
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        {
          error:
            'Format non supporté. Formats acceptés : MP3, WAV, M4A, MP4, WEBM, OGG',
        },
        { status: 415 }
      )
    }

    const maxSize = MAX_SIZES[plan] || MAX_SIZES.free
    if (file.size > maxSize) {
      return NextResponse.json(
        {
          error: `Fichier trop volumineux. Max ${formatMB(maxSize)} pour le plan ${plan}`,
        },
        { status: 413 }
      )
    }

    const estimatedMinutes = Math.max(Math.ceil(file.size / (1024 * 1024) / 2), 1)

    const { data: hasQuota, error: quotaError } = await supabase.rpc('check_quota', {
      p_user_id: user.id,
      p_minutes: estimatedMinutes,
    })
    console.log('[Upload] Quota check:', hasQuota, 'Error:', quotaError?.message)

    if (hasQuota === false) {
      const remaining = Math.max(
        (profile?.minutes_limit ?? 30) - (profile?.minutes_used ?? 0),
        0
      )
      return NextResponse.json(
        {
          error: `Quota dépassé. Il vous reste ${remaining} minutes. Passez au plan supérieur.`,
        },
        { status: 429 }
      )
    }

    console.log('[Upload] R2 config:', {
      accountId: process.env.R2_ACCOUNT_ID ? 'SET' : 'MISSING',
      accessKey: process.env.R2_ACCESS_KEY_ID ? 'SET' : 'MISSING',
      secretKey: process.env.R2_SECRET_ACCESS_KEY ? 'SET' : 'MISSING',
      bucket: process.env.R2_BUCKET_NAME || 'MISSING',
    })

    console.log('[Upload] Début upload R2...')
    const buffer = Buffer.from(await file.arrayBuffer())
    const r2Result = await uploadFile(buffer, user.id, file.name, file.type)
    console.log('[Upload] R2 OK:', r2Result.key)

    const validAccents = [
      'fr-standard',
      'fr-quebec',
      'fr-africa',
      'fr-belgium',
      'fr-swiss',
    ] as const
    const safeAccent = validAccents.includes(accent as typeof validAccents[number])
      ? (accent as typeof validAccents[number])
      : 'fr-standard'

    const { data: transcription, error: dbError } = await supabase
      .from('transcriptions')
      .insert({
        user_id: user.id,
        project_id: projectId,
        title,
        file_url: r2Result.url,
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        language,
        accent: safeAccent,
        status: 'pending',
      })
      .select('id')
      .single()

    console.log('[Upload] DB insert:', transcription?.id, 'Error:', dbError?.message)

    if (dbError || !transcription) {
      return NextResponse.json(
        { error: `Erreur base de données : ${dbError?.message ?? 'Insertion échouée'}` },
        { status: 500 }
      )
    }

    // Lancer le pipeline de transcription en arrière-plan (fire-and-forget)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    fetch(`${appUrl}/api/transcriptions/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-secret': process.env.INTERNAL_API_SECRET || '',
      },
      body: JSON.stringify({ transcription_id: transcription.id }),
    }).catch((err) => {
      console.error('[Upload] Erreur lancement pipeline:', err)
    })

    console.log('[Upload] Succès, transcription_id:', transcription.id)
    return NextResponse.json({
      transcription_id: transcription.id,
      status: 'pending',
      file_url: r2Result.url,
      file_size: r2Result.size,
    })
  } catch (error) {
    console.error('[Upload] ERREUR COMPLÈTE:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { error: `Erreur lors de l'upload : ${message}` },
      { status: 500 }
    )
  }
}
