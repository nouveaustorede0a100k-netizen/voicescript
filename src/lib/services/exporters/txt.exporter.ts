import type { Segment } from '@/types'
import { formatTimestampBracket } from './format-timestamp'

interface TxtExportOptions {
  includeTimestamps: boolean
  includeSpeakers: boolean
}

export function exportToTxt(segments: Segment[], options: TxtExportOptions): string {
  const lines: string[] = []

  for (const segment of segments) {
    const parts: string[] = []

    if (options.includeTimestamps) {
      parts.push(formatTimestampBracket(segment.start_time))
    }

    if (options.includeSpeakers && segment.speaker) {
      parts.push(`[${segment.speaker}]`)
    }

    parts.push(segment.text.trim())

    lines.push(parts.join(' '))
  }

  return lines.join('\n\n') + '\n'
}
