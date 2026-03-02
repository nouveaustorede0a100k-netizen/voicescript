import { NextResponse } from 'next/server'
import { processTranscription } from '@/lib/services/transcription-pipeline'

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET

export async function POST(request: Request) {
  try {
    // Vérifier l'authentification interne
    const apiSecret = request.headers.get('x-api-secret')

    if (!INTERNAL_SECRET || apiSecret !== INTERNAL_SECRET) {
      return NextResponse.json({ error: 'Non autorisé' }, { status: 403 })
    }

    const body = await request.json()
    const { transcription_id } = body as { transcription_id?: string }

    if (!transcription_id) {
      return NextResponse.json(
        { error: 'transcription_id requis' },
        { status: 400 }
      )
    }

    const result = await processTranscription(transcription_id)

    return NextResponse.json(result, {
      status: result.success ? 200 : 500,
    })
  } catch (error) {
    console.error(
      '[Process Route] Erreur:',
      error instanceof Error ? error.message : error
    )
    return NextResponse.json(
      { error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
