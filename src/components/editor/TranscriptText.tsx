'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import type { Segment } from '@/types'

interface TranscriptTextProps {
  segments: Segment[]
  onUpdateSegment: (segmentId: string, newText: string) => void
}

function formatTimestamp(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function getConfidenceBadge(confidence: number | null) {
  if (confidence === null) return null
  const pct = Math.round(confidence * 100)
  if (pct >= 90) return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-emerald-300 text-emerald-700 bg-emerald-50">{pct}%</Badge>
  if (pct >= 70) return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-amber-300 text-amber-700 bg-amber-50">{pct}%</Badge>
  return <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-rose-300 text-rose-700 bg-rose-50">{pct}%</Badge>
}

function SegmentBlock({
  segment,
  isActive,
  onUpdate,
}: {
  segment: Segment
  isActive: boolean
  onUpdate: (newText: string) => void
}) {
  const blockRef = useRef<HTMLDivElement>(null)
  const textRef = useRef<HTMLParagraphElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const seekTo = usePlayerStore((s) => s.seekTo)

  // Scroll auto vers le segment actif
  useEffect(() => {
    if (isActive && blockRef.current && !isEditing) {
      blockRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [isActive, isEditing])

  const handleBlur = useCallback(() => {
    setIsEditing(false)
    const el = textRef.current
    if (!el) return
    const newText = el.textContent ?? ''
    if (newText !== segment.text) {
      onUpdate(newText)
    }
  }, [segment.text, onUpdate])

  const handleTimestampClick = useCallback(() => {
    seekTo(segment.start_time)
  }, [seekTo, segment.start_time])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsEditing(false)
        if (textRef.current) textRef.current.textContent = segment.text
        textRef.current?.blur()
      }
    },
    [segment.text]
  )

  return (
    <div
      ref={blockRef}
      className={`group rounded-lg p-3 transition-colors ${
        isActive
          ? 'bg-indigo-50 border border-indigo-200'
          : 'hover:bg-slate-50 border border-transparent'
      }`}
    >
      {/* En-tête du segment */}
      <div className="flex items-center gap-2 mb-1.5">
        {segment.speaker && (
          <Badge variant="secondary" className="text-[11px] px-2 py-0">
            {segment.speaker}
          </Badge>
        )}
        <button
          onClick={handleTimestampClick}
          className="text-xs text-muted-foreground font-mono hover:text-primary transition-colors cursor-pointer"
          aria-label={`Aller à ${formatTimestamp(segment.start_time)}`}
        >
          {formatTimestamp(segment.start_time)}
        </button>
        {getConfidenceBadge(segment.confidence)}
        {segment.is_edited && (
          <span className="text-[10px] text-muted-foreground italic">modifié</span>
        )}
      </div>

      {/* Texte du segment (éditable) */}
      <p
        ref={textRef}
        contentEditable
        suppressContentEditableWarning
        onFocus={() => setIsEditing(true)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className={`text-sm leading-relaxed outline-none rounded px-1 -mx-1 ${
          isEditing
            ? 'ring-2 ring-primary/30 bg-white'
            : 'focus:ring-2 focus:ring-primary/20'
        }`}
        role="textbox"
        aria-label={`Segment ${segment.position + 1}`}
        tabIndex={0}
      >
        {segment.text}
      </p>
    </div>
  )
}

export function TranscriptText({ segments, onUpdateSegment }: TranscriptTextProps) {
  const currentTime = usePlayerStore((s) => s.currentTime)
  const setActiveSegmentId = usePlayerStore((s) => s.setActiveSegmentId)

  // Trouver le segment actif
  const activeSegment = segments.find(
    (s) => currentTime >= s.start_time && currentTime < s.end_time
  )

  useEffect(() => {
    setActiveSegmentId(activeSegment?.id ?? null)
  }, [activeSegment?.id, setActiveSegmentId])

  if (segments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <p className="text-muted-foreground">Aucun segment de transcription disponible.</p>
      </div>
    )
  }

  return (
    <ScrollArea className="h-full">
      <div className="space-y-1 p-4">
        {segments.map((segment) => (
          <SegmentBlock
            key={segment.id}
            segment={segment}
            isActive={activeSegment?.id === segment.id}
            onUpdate={(newText) => onUpdateSegment(segment.id, newText)}
          />
        ))}
      </div>
    </ScrollArea>
  )
}
