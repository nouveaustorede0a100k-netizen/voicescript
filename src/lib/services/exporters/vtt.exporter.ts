import type { Segment } from '@/types'
import { formatTimestamp, wrapText } from './format-timestamp'

interface VttExportOptions {
  includeSpeakers: boolean
}

/**
 * Génère un fichier WebVTT compatible avec la balise <track> HTML5.
 *
 * - Header "WEBVTT" obligatoire
 * - Timestamps : HH:MM:SS.mmm (point comme séparateur)
 * - Speakers optionnels via la balise <v>
 */
export function exportToVtt(segments: Segment[], options: VttExportOptions): string {
  const lines: string[] = ['WEBVTT', '']

  for (const segment of segments) {
    const text = segment.text.trim()
    if (!text) continue

    const start = formatTimestamp(segment.start_time, 'vtt')
    const end = formatTimestamp(segment.end_time, 'vtt')
    const wrapped = wrapText(text)

    let content = wrapped.join('\n')
    if (options.includeSpeakers && segment.speaker) {
      content = `<v ${segment.speaker}>${content}`
    }

    lines.push(`${start} --> ${end}`)
    lines.push(content)
    lines.push('')
  }

  return lines.join('\n')
}
