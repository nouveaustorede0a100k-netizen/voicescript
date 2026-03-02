function pad(n: number, len = 2): string {
  return String(n).padStart(len, '0')
}

/**
 * Formate un timestamp en secondes vers le format SRT (HH:MM:SS,mmm)
 * ou VTT (HH:MM:SS.mmm).
 */
export function formatTimestamp(seconds: number, format: 'srt' | 'vtt'): string {
  const totalMs = Math.round(Math.max(0, seconds) * 1000)
  const h = Math.floor(totalMs / 3_600_000)
  const m = Math.floor((totalMs % 3_600_000) / 60_000)
  const s = Math.floor((totalMs % 60_000) / 1000)
  const ms = totalMs % 1000
  const sep = format === 'srt' ? ',' : '.'
  return `${pad(h)}:${pad(m)}:${pad(s)}${sep}${pad(ms, 3)}`
}

/**
 * Formate un timestamp en secondes vers [MM:SS] ou [HH:MM:SS].
 */
export function formatTimestampBracket(seconds: number): string {
  const total = Math.floor(Math.max(0, seconds))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h > 0) return `[${pad(h)}:${pad(m)}:${pad(s)}]`
  return `[${pad(m)}:${pad(s)}]`
}

const MAX_LINE_LENGTH = 42

/**
 * Découpe un texte long en lignes de max `maxLen` caractères
 * en coupant aux espaces. Retourne max 2 lignes.
 */
export function wrapText(text: string, maxLen = MAX_LINE_LENGTH): string[] {
  const trimmed = text.trim()
  if (trimmed.length <= maxLen) return [trimmed]

  const words = trimmed.split(/\s+/)
  const lines: string[] = []
  let currentLine = ''

  for (const word of words) {
    if (lines.length >= 2) break
    const candidate = currentLine ? `${currentLine} ${word}` : word
    if (candidate.length > maxLen && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = candidate
    }
  }

  if (currentLine && lines.length < 2) {
    lines.push(currentLine)
  }

  return lines
}
