import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { exportToTxt } from '@/lib/services/exporters/txt.exporter'
import { exportToSrt } from '@/lib/services/exporters/srt.exporter'
import { exportToVtt } from '@/lib/services/exporters/vtt.exporter'
import { exportToDocx } from '@/lib/services/exporters/docx.exporter'
import type { ExportFormat, Segment } from '@/types'

interface ExportBody {
  transcription_id: string
  format: ExportFormat
  options?: {
    includeTimestamps?: boolean
    includeSpeakers?: boolean
  }
}

const CONTENT_TYPES: Record<ExportFormat, string> = {
  txt: 'text/plain; charset=utf-8',
  srt: 'application/x-subrip; charset=utf-8',
  vtt: 'text/vtt; charset=utf-8',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  json: 'application/json; charset=utf-8',
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const body = (await request.json()) as ExportBody
    const { transcription_id, format, options } = body

    if (!transcription_id || !format) {
      return NextResponse.json(
        { error: 'Paramètres manquants : transcription_id et format requis' },
        { status: 400 }
      )
    }

    const validFormats: ExportFormat[] = ['txt', 'srt', 'vtt', 'docx', 'json']
    if (!validFormats.includes(format)) {
      return NextResponse.json(
        { error: `Format non supporté : ${format}` },
        { status: 400 }
      )
    }

    // Récupérer la transcription
    const { data: transcription, error: tError } = await supabase
      .from('transcriptions')
      .select('*')
      .eq('id', transcription_id)
      .single()

    if (tError || !transcription) {
      return NextResponse.json({ error: 'Transcription introuvable' }, { status: 404 })
    }

    if (transcription.status !== 'completed') {
      return NextResponse.json(
        { error: 'La transcription doit être terminée pour pouvoir être exportée' },
        { status: 422 }
      )
    }

    // Récupérer les segments
    const { data: segments } = await supabase
      .from('transcription_segments')
      .select('*')
      .eq('transcription_id', transcription_id)
      .order('position', { ascending: true })

    const segs: Segment[] = segments ?? []

    // Générer le nom de fichier propre
    const safeTitle = transcription.title
      .replace(/[^a-zA-Z0-9àâäéèêëïîôùûüÿçœæ\s-]/gi, '')
      .trim()
      .replace(/\s+/g, '_')
      .substring(0, 100) || 'transcription'

    const fileName = `${safeTitle}.${format}`
    const contentType = CONTENT_TYPES[format]

    let fileContent: string | Buffer

    switch (format) {
      case 'txt':
        fileContent = exportToTxt(segs, {
          includeTimestamps: options?.includeTimestamps ?? true,
          includeSpeakers: options?.includeSpeakers ?? true,
        })
        break

      case 'srt':
        fileContent = exportToSrt(segs)
        break

      case 'vtt':
        fileContent = exportToVtt(segs, {
          includeSpeakers: options?.includeSpeakers ?? false,
        })
        break

      case 'docx':
        fileContent = await exportToDocx(segs, {
          title: transcription.title,
          createdAt: transcription.created_at,
          duration: transcription.file_duration,
          language: transcription.language,
          wordCount: transcription.word_count,
        })
        break

      case 'json':
        fileContent = JSON.stringify(
          {
            title: transcription.title,
            language: transcription.language,
            duration: transcription.file_duration,
            word_count: transcription.word_count,
            segments: segs.map((s) => ({
              position: s.position,
              start_time: s.start_time,
              end_time: s.end_time,
              text: s.text,
              speaker: s.speaker,
            })),
          },
          null,
          2
        )
        break

      default:
        return NextResponse.json({ error: 'Format non supporté' }, { status: 400 })
    }

    const buf =
      typeof fileContent === 'string' ? Buffer.from(fileContent, 'utf-8') : fileContent
    const arrayBuf = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer

    return new Response(arrayBuf, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': String(buf.length),
      },
    })
  } catch {
    return NextResponse.json(
      { error: "Erreur lors de la génération de l'export" },
      { status: 500 }
    )
  }
}
