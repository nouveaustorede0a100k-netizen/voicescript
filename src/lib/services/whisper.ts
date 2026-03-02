import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const MAX_RETRIES = 3
const RETRY_DELAYS = [1000, 2000, 4000]
const REQUEST_TIMEOUT = 300_000 // 5 min
const WHISPER_MAX_SIZE = 25 * 1024 * 1024 // 25 MB

export interface WhisperSegment {
  id: number
  start: number
  end: number
  text: string
  words?: Array<{ word: string; start: number; end: number }>
}

export interface WhisperResult {
  segments: WhisperSegment[]
  text: string
  language: string
  duration: number
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof OpenAI.APIError) {
    return error.status === 429 || error.status >= 500
  }
  if (error instanceof Error) {
    return (
      error.message.includes('ECONNRESET') ||
      error.message.includes('ETIMEDOUT') ||
      error.message.includes('fetch failed')
    )
  }
  return false
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function callWhisperWithRetry(
  audioBuffer: Buffer,
  language: string,
  fileName: string,
  transcriptionId?: string
): Promise<WhisperResult> {
  let lastError: unknown

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const arrayBuf = audioBuffer.buffer.slice(
        audioBuffer.byteOffset,
        audioBuffer.byteOffset + audioBuffer.byteLength
      ) as ArrayBuffer
      const file = new File([arrayBuf], fileName, { type: 'audio/mpeg' })

      const response = await openai.audio.transcriptions.create(
        {
          file,
          model: 'whisper-1',
          language: language === 'auto' ? undefined : language,
          response_format: 'verbose_json',
          timestamp_granularities: ['segment'],
        },
        { timeout: REQUEST_TIMEOUT }
      )

      return {
        segments: (response.segments ?? []).map((seg, i) => ({
          id: i,
          start: seg.start,
          end: seg.end,
          text: seg.text,
        })),
        text: response.text,
        language: response.language ?? language,
        duration: response.duration ?? 0,
      }
    } catch (error) {
      lastError = error

      if (attempt < MAX_RETRIES && isRetryableError(error)) {
        const delay = RETRY_DELAYS[attempt] ?? 4000
        console.error(
          `[Whisper] Tentative ${attempt + 1}/${MAX_RETRIES} échouée pour ${transcriptionId ?? 'unknown'}. Retry dans ${delay}ms`,
          error instanceof Error ? error.message : error
        )
        await sleep(delay)
        continue
      }

      break
    }
  }

  throw lastError
}

/**
 * Transcrit un buffer audio via l'API Whisper.
 * Les fichiers <= 25MB sont envoyés directement.
 * Les fichiers > 25MB sont découpés en chunks et les résultats fusionnés.
 */
export async function transcribeAudio(
  audioBuffer: Buffer,
  language: string = 'fr',
  fileName: string = 'audio.mp3',
  transcriptionId?: string
): Promise<WhisperResult> {
  if (audioBuffer.length <= WHISPER_MAX_SIZE) {
    return callWhisperWithRetry(audioBuffer, language, fileName, transcriptionId)
  }

  // Découpage en chunks pour les fichiers > 25MB
  const chunks = splitBuffer(audioBuffer, WHISPER_MAX_SIZE - 1024 * 1024) // marge 1MB
  const results: WhisperResult[] = []
  let timeOffset = 0

  for (let i = 0; i < chunks.length; i++) {
    const chunkName = `chunk_${i}_${fileName}`
    const result = await callWhisperWithRetry(
      chunks[i],
      language,
      chunkName,
      transcriptionId
    )

    // Ajuster les timestamps pour les chunks après le premier
    if (timeOffset > 0) {
      result.segments = result.segments.map((seg) => ({
        ...seg,
        start: seg.start + timeOffset,
        end: seg.end + timeOffset,
      }))
    }

    results.push(result)
    timeOffset += result.duration
  }

  return mergeResults(results)
}

function splitBuffer(buffer: Buffer, chunkSize: number): Buffer[] {
  const chunks: Buffer[] = []
  for (let offset = 0; offset < buffer.length; offset += chunkSize) {
    chunks.push(buffer.subarray(offset, Math.min(offset + chunkSize, buffer.length)))
  }
  return chunks
}

function mergeResults(results: WhisperResult[]): WhisperResult {
  const allSegments: WhisperSegment[] = []
  let fullText = ''
  let totalDuration = 0

  for (const result of results) {
    allSegments.push(...result.segments)
    fullText += (fullText ? ' ' : '') + result.text
    totalDuration += result.duration
  }

  // Renuméroter les segments
  const renumbered = allSegments.map((seg, i) => ({ ...seg, id: i }))

  return {
    segments: renumbered,
    text: fullText,
    language: results[0]?.language ?? 'fr',
    duration: totalDuration,
  }
}

/**
 * Mappe une erreur Whisper en message utilisateur français.
 */
export function getWhisperErrorMessage(error: unknown): string {
  if (error instanceof OpenAI.APIError) {
    if (error.status === 429) {
      return 'Erreur API Whisper : service temporairement surchargé. Réessayez dans quelques minutes.'
    }
    if (error.status >= 500) {
      return 'Erreur API Whisper : service temporairement indisponible. Réessayez dans quelques minutes.'
    }
    if (error.status === 400) {
      return 'Le fichier audio semble corrompu. Essayez avec un autre format (MP3 recommandé).'
    }
  }

  if (error instanceof Error && error.message.includes('timeout')) {
    return 'La transcription a pris trop de temps. Essayez avec un fichier plus court.'
  }

  return "Erreur inattendue lors de la transcription. Veuillez réessayer."
}
