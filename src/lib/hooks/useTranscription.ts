'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Segment, Transcription } from '@/types'

interface HistoryEntry {
  segmentId: string
  oldText: string
  newText: string
}

interface UseTranscriptionReturn {
  transcription: Transcription | null
  segments: Segment[]
  isLoading: boolean
  isSaving: boolean
  lastSavedAt: Date | null
  updateSegment: (segmentId: string, newText: string) => void
  updateTitle: (newTitle: string) => void
  saveAll: () => Promise<void>
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

export function useTranscription(transcriptionId: string): UseTranscriptionReturn {
  const supabase = createClient()
  const [transcription, setTranscription] = useState<Transcription | null>(null)
  const [segments, setSegments] = useState<Segment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)

  // Historique undo/redo
  const [history, setHistory] = useState<HistoryEntry[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)

  // File d'attente des sauvegardes pendantes (segmentId → newText)
  const pendingRef = useRef<Map<string, string>>(new Map())
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const titleTimerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  // Chargement initial
  useEffect(() => {
    let cancelled = false

    async function load() {
      setIsLoading(true)

      const { data: trans } = await supabase
        .from('transcriptions')
        .select('*')
        .eq('id', transcriptionId)
        .single()

      if (cancelled) return
      setTranscription(trans)

      const { data: segs } = await supabase
        .from('transcription_segments')
        .select('*')
        .eq('transcription_id', transcriptionId)
        .order('position', { ascending: true })

      if (cancelled) return
      setSegments(segs ?? [])
      setIsLoading(false)
    }

    load()
    return () => { cancelled = true }
  }, [transcriptionId, supabase])

  // Flush des sauvegardes pendantes
  const flushPending = useCallback(async () => {
    const entries = Array.from(pendingRef.current.entries())
    if (entries.length === 0) return

    setIsSaving(true)
    pendingRef.current.clear()

    try {
      await Promise.all(
        entries.map(([segId, text]) =>
          supabase
            .from('transcription_segments')
            .update({ text, is_edited: true })
            .eq('id', segId)
        )
      )
      setLastSavedAt(new Date())
    } catch (err) {
      console.error('[useTranscription] Erreur sauvegarde:', err)
    } finally {
      setIsSaving(false)
    }
  }, [supabase])

  // Mise à jour d'un segment (debounced)
  const updateSegment = useCallback(
    (segmentId: string, newText: string) => {
      setSegments((prev) => {
        const old = prev.find((s) => s.id === segmentId)
        if (old && old.text !== newText) {
          // Enregistrer dans l'historique (tronquer le futur si on a fait undo)
          setHistory((h) => [
            ...h.slice(0, historyIndex + 1),
            { segmentId, oldText: old.text, newText },
          ])
          setHistoryIndex((i) => i + 1)
        }
        return prev.map((s) => (s.id === segmentId ? { ...s, text: newText, is_edited: true } : s))
      })

      pendingRef.current.set(segmentId, newText)

      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(flushPending, 2000)
    },
    [flushPending, historyIndex]
  )

  // Mise à jour du titre (debounced)
  const updateTitle = useCallback(
    (newTitle: string) => {
      setTranscription((prev) => (prev ? { ...prev, title: newTitle } : prev))
      clearTimeout(titleTimerRef.current)
      titleTimerRef.current = setTimeout(async () => {
        setIsSaving(true)
        await supabase
          .from('transcriptions')
          .update({ title: newTitle })
          .eq('id', transcriptionId)
        setIsSaving(false)
        setLastSavedAt(new Date())
      }, 1500)
    },
    [supabase, transcriptionId]
  )

  const saveAll = useCallback(async () => {
    clearTimeout(saveTimerRef.current)
    await flushPending()
  }, [flushPending])

  const undo = useCallback(() => {
    if (historyIndex < 0) return
    const entry = history[historyIndex]
    setSegments((prev) =>
      prev.map((s) =>
        s.id === entry.segmentId ? { ...s, text: entry.oldText } : s
      )
    )
    pendingRef.current.set(entry.segmentId, entry.oldText)
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(flushPending, 2000)
    setHistoryIndex((i) => i - 1)
  }, [history, historyIndex, flushPending])

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return
    const entry = history[historyIndex + 1]
    setSegments((prev) =>
      prev.map((s) =>
        s.id === entry.segmentId ? { ...s, text: entry.newText } : s
      )
    )
    pendingRef.current.set(entry.segmentId, entry.newText)
    clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(flushPending, 2000)
    setHistoryIndex((i) => i + 1)
  }, [history, historyIndex, flushPending])

  // Cleanup timers
  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current)
      clearTimeout(titleTimerRef.current)
    }
  }, [])

  return {
    transcription,
    segments,
    isLoading,
    isSaving,
    lastSavedAt,
    updateSegment,
    updateTitle,
    saveAll,
    undo,
    redo,
    canUndo: historyIndex >= 0,
    canRedo: historyIndex < history.length - 1,
  }
}
