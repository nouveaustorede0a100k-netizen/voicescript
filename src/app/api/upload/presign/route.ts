import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { getPresignedUploadUrl } from '@/lib/storage/r2'
import { PLANS } from '@/lib/config/plans'
import type { PlanType } from '@/types'

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

    const { fileName, fileSize, fileType } = await request.json()

    if (!fileName || !fileSize || !fileType) {
      return NextResponse.json(
        { error: 'Paramètres manquants (fileName, fileSize, fileType)' },
        { status: 400 }
      )
    }

    if (!ALLOWED_TYPES.includes(fileType)) {
      return NextResponse.json(
        { error: 'Format non supporté. Formats acceptés : MP3, WAV, M4A, MP4, WEBM, OGG' },
        { status: 415 }
      )
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, minutes_used, minutes_limit')
      .eq('id', user.id)
      .single()

    const plan = (profile?.plan || 'free') as PlanType
    const planConfig = PLANS[plan]
    const maxSize = planConfig.max_file_size

    if (fileSize > maxSize) {
      const maxMB = Math.round(maxSize / (1024 * 1024))
      return NextResponse.json(
        { error: `Fichier trop volumineux. Max pour le plan ${planConfig.name} : ${maxMB} MB` },
        { status: 413 }
      )
    }

    const estimatedMinutes = Math.max(Math.ceil(fileSize / (1024 * 1024) / 2), 1)
    const { data: hasQuota } = await supabase.rpc('check_quota', {
      p_user_id: user.id,
      p_minutes: estimatedMinutes,
    })

    if (hasQuota === false) {
      const remaining = Math.max(
        (profile?.minutes_limit ?? 30) - (profile?.minutes_used ?? 0),
        0
      )
      return NextResponse.json(
        { error: `Quota dépassé. Il vous reste ${remaining} minutes. Passez au plan supérieur.` },
        { status: 429 }
      )
    }

    console.log('[Presign] Generating URL for:', { fileName, fileSize, fileType, userId: user.id })
    console.log('[Presign] R2 config:', {
      accountId: process.env.R2_ACCOUNT_ID ? 'SET' : 'MISSING',
      accessKey: process.env.R2_ACCESS_KEY_ID ? 'SET' : 'MISSING',
      secretKey: process.env.R2_SECRET_ACCESS_KEY ? 'SET' : 'MISSING',
      bucket: process.env.R2_BUCKET_NAME || 'MISSING',
    })

    const { uploadUrl, key } = await getPresignedUploadUrl(
      user.id,
      fileName,
      fileType,
      600
    )

    console.log('[Presign] OK, key:', key)
    return NextResponse.json({ uploadUrl, key })
  } catch (error) {
    console.error('[Presign] Erreur:', error)
    const message = error instanceof Error ? error.message : 'Erreur inconnue'
    return NextResponse.json(
      { error: `Erreur lors de la préparation : ${message}` },
      { status: 500 }
    )
  }
}
