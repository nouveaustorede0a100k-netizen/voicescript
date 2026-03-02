import { createAdminClient } from '@/lib/supabase/server'
import { getPresignedUrl, extractKeyFromUrl } from '@/lib/storage/r2'
import { transcribeAudio, getWhisperErrorMessage } from '@/lib/services/whisper'
import { consumeCredits, checkCredits, getRemainingMinutes } from '@/lib/services/credits'

interface PipelineResult {
  success: boolean
  transcriptionId: string
  error?: string
}

/**
 * Orchestre le pipeline complet de transcription :
 * 1. Récupère la transcription + profil depuis Supabase (admin)
 * 2. Vérifie le quota
 * 3. Passe en status 'processing'
 * 4. Télécharge le fichier depuis R2
 * 5. Appelle l'API Whisper
 * 6. Sauvegarde les segments
 * 7. Met à jour les métadonnées
 * 8. Consomme les minutes
 */
export async function processTranscription(
  transcriptionId: string
): Promise<PipelineResult> {
  const supabase = createAdminClient()

  // 1. Récupérer la transcription
  const { data: transcription, error: fetchError } = await supabase
    .from('transcriptions')
    .select('*')
    .eq('id', transcriptionId)
    .single()

  if (fetchError || !transcription) {
    console.error(
      `[Pipeline] Transcription ${transcriptionId} introuvable:`,
      fetchError?.message
    )
    return {
      success: false,
      transcriptionId,
      error: 'Transcription introuvable',
    }
  }

  // Ignorer si déjà traitée
  if (transcription.status === 'completed' || transcription.status === 'processing') {
    return { success: true, transcriptionId }
  }

  const userId = transcription.user_id

  try {
    // 2. Double vérification du quota
    const estimatedSeconds = transcription.file_size
      ? Math.max(Math.ceil(transcription.file_size / (1024 * 1024) / 2) * 60, 60)
      : 60

    const hasQuota = await checkCredits(userId, estimatedSeconds)
    if (!hasQuota) {
      const remaining = await getRemainingMinutes(userId)
      const needed = Math.ceil(estimatedSeconds / 60)

      await supabase.from('transcriptions').update({
        status: 'error' as const,
        error_message: `Quota insuffisant. Il vous reste ${remaining} minutes, ce fichier nécessite environ ${needed} minutes.`,
      }).eq('id', transcriptionId)

      return {
        success: false,
        transcriptionId,
        error: 'Quota insuffisant',
      }
    }

    // 3. Status → processing
    await supabase.from('transcriptions').update({
      status: 'processing' as const,
    }).eq('id', transcriptionId)

    // 4. Télécharger le fichier depuis R2
    const fileKey = extractKeyFromUrl(transcription.file_url)
    const downloadUrl = await getPresignedUrl(fileKey)

    const fileResponse = await fetch(downloadUrl, {
      signal: AbortSignal.timeout(120_000), // 2 min pour télécharger
    })

    if (!fileResponse.ok) {
      throw new Error(`Échec du téléchargement R2 : HTTP ${fileResponse.status}`)
    }

    const arrayBuffer = await fileResponse.arrayBuffer()
    const audioBuffer = Buffer.from(arrayBuffer)

    console.info(
      `[Pipeline] Transcription ${transcriptionId} : ${(audioBuffer.length / (1024 * 1024)).toFixed(1)}MB, langue=${transcription.language}`
    )

    // 5. Appeler Whisper
    const whisperResult = await transcribeAudio(
      audioBuffer,
      transcription.language,
      transcription.file_name ?? 'audio.mp3',
      transcriptionId
    )

    // 6. Sauvegarder les segments
    if (whisperResult.segments.length > 0) {
      const segmentRows = whisperResult.segments.map((seg, i) => ({
        transcription_id: transcriptionId,
        position: i,
        start_time: seg.start,
        end_time: seg.end,
        text: seg.text.trim(),
        confidence: null as number | null,
        speaker: null as string | null,
        is_edited: false,
      }))

      // Batch insert par groupes de 500
      const BATCH_SIZE = 500
      for (let i = 0; i < segmentRows.length; i += BATCH_SIZE) {
        const batch = segmentRows.slice(i, i + BATCH_SIZE)
        const { error: insertError } = await supabase
          .from('transcription_segments')
          .insert(batch)

        if (insertError) {
          console.error(
            `[Pipeline] Erreur insertion segments batch ${i}:`,
            insertError.message
          )
          throw new Error(`Erreur lors de la sauvegarde des segments : ${insertError.message}`)
        }
      }
    }

    // 7. Calculer les métadonnées
    const wordCount = whisperResult.text.split(/\s+/).filter(Boolean).length
    const fileDuration = whisperResult.duration

    // 8. Mettre à jour la transcription
    await supabase.from('transcriptions').update({
      status: 'completed' as const,
      word_count: wordCount,
      confidence_avg: null,
      file_duration: fileDuration,
    }).eq('id', transcriptionId)

    // 9. Consommer les minutes
    const actualMinutesConsumed = Math.ceil(fileDuration)
    await consumeCredits(userId, transcriptionId, actualMinutesConsumed, {
      file_name: transcription.file_name ?? 'unknown',
      file_size: transcription.file_size ?? 0,
      duration_seconds: fileDuration,
      word_count: wordCount,
      segment_count: whisperResult.segments.length,
    })

    console.info(
      `[Pipeline] Transcription ${transcriptionId} terminée : ${wordCount} mots, ${fileDuration.toFixed(0)}s, ${whisperResult.segments.length} segments`
    )

    return { success: true, transcriptionId }
  } catch (error) {
    const errorMessage = getWhisperErrorMessage(error)

    console.error(
      `[Pipeline] Erreur transcription ${transcriptionId}:`,
      error instanceof Error ? error.message : error
    )

    await supabase.from('transcriptions').update({
      status: 'error' as const,
      error_message: errorMessage,
    }).eq('id', transcriptionId)

    return {
      success: false,
      transcriptionId,
      error: errorMessage,
    }
  }
}
