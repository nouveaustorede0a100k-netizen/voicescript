import type { Segment } from '@/types'
import { formatTimestamp, wrapText } from './format-timestamp'

/**
 * Génère un fichier SRT (SubRip) conforme au standard YouTube.
 *
 * - Timestamps : HH:MM:SS,mmm (virgule comme séparateur)
 * - Max 2 lignes par bloc, max 42 caractères par ligne
 * - Les segments longs sont découpés automatiquement
 */
export function exportToSrt(segments: Segment[]): string {
  const blocks: string[] = []
  let counter = 1

  for (const segment of segments) {
    const text = segment.text.trim()
    if (!text) continue

    // Découper en sous-segments si trop long pour 2 lignes de 42 car
    const subSegments = splitSegmentForSubtitles(text, segment.start_time, segment.end_time)

    for (const sub of subSegments) {
      const start = formatTimestamp(sub.start, 'srt')
      const end = formatTimestamp(sub.end, 'srt')
      const wrapped = wrapText(sub.text)

      blocks.push(`${counter}\n${start} --> ${end}\n${wrapped.join('\n')}`)
      counter++
    }
  }

  return blocks.join('\n\n') + '\n'
}

interface SubSegment {
  text: string
  start: number
  end: number
}

/**
 * Découpe un segment trop long en sous-segments temporellement répartis.
 * Chaque sous-segment fait max 84 caractères (2 lignes × 42).
 */
function splitSegmentForSubtitles(
  text: string,
  startTime: number,
  endTime: number
): SubSegment[] {
  const maxChars = 84
  if (text.length <= maxChars) {
    return [{ text, start: startTime, end: endTime }]
  }

  const words = text.split(/\s+/)
  const result: SubSegment[] = []
  let currentWords: string[] = []
  let currentLen = 0

  const totalDuration = endTime - startTime
  const charPerSecond = text.length / totalDuration
  let segStart = startTime

  for (const word of words) {
    const newLen = currentLen + (currentLen > 0 ? 1 : 0) + word.length

    if (newLen > maxChars && currentWords.length > 0) {
      const segText = currentWords.join(' ')
      const segDuration = segText.length / charPerSecond
      result.push({ text: segText, start: segStart, end: segStart + segDuration })
      segStart += segDuration
      currentWords = [word]
      currentLen = word.length
    } else {
      currentWords.push(word)
      currentLen = newLen
    }
  }

  if (currentWords.length > 0) {
    result.push({ text: currentWords.join(' '), start: segStart, end: endTime })
  }

  return result
}
