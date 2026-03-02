'use client'

import { useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTranscription } from '@/lib/hooks/useTranscription'
import { usePlayerStore } from '@/lib/stores/usePlayerStore'
import { AudioPlayer } from '@/components/editor/AudioPlayer'
import { TranscriptText } from '@/components/editor/TranscriptText'
import { EditorToolbar } from '@/components/editor/EditorToolbar'
import { createClient } from '@/lib/supabase/client'
import { Skeleton } from '@/components/ui/skeleton'

interface TranscriptionEditorProps {
  transcriptionId: string
  audioUrl: string
}

export function TranscriptionEditor({
  transcriptionId,
  audioUrl,
}: TranscriptionEditorProps) {
  const router = useRouter()
  const {
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
    canUndo,
    canRedo,
  } = useTranscription(transcriptionId)

  const seekTo = usePlayerStore((s) => s.seekTo)
  const togglePlayback = usePlayerStore((s) => s.togglePlayback)

  // Raccourcis clavier globaux
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      const isContentEditable = target.contentEditable === 'true'
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'

      // Ctrl+S → sauvegarder
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        saveAll()
        toast.success('Sauvegardé')
        return
      }

      // Ctrl+Z → undo
      if ((e.ctrlKey || e.metaKey) && !e.shiftKey && e.key === 'z') {
        if (isContentEditable || isInput) return
        e.preventDefault()
        undo()
        return
      }

      // Ctrl+Shift+Z → redo
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z') {
        if (isContentEditable || isInput) return
        e.preventDefault()
        redo()
        return
      }

      // Ne pas intercepter les touches quand un champ est focusé
      if (isContentEditable || isInput) return

      // Espace → play/pause
      if (e.key === ' ') {
        e.preventDefault()
        togglePlayback()
        return
      }

      // Flèche gauche → reculer
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        const delta = e.shiftKey ? 1 : 5
        const current = usePlayerStore.getState().currentTime
        seekTo(Math.max(0, current - delta))
        return
      }

      // Flèche droite → avancer
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        const delta = e.shiftKey ? 1 : 5
        const current = usePlayerStore.getState().currentTime
        const dur = usePlayerStore.getState().duration
        seekTo(Math.min(dur, current + delta))
        return
      }
    },
    [saveAll, undo, redo, togglePlayback, seekTo]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Suppression
  const handleDelete = useCallback(async () => {
    const supabase = createClient()
    await supabase.from('transcriptions').delete().eq('id', transcriptionId)
    toast.success('Transcription supprimée')
    router.push('/dashboard')
  }, [transcriptionId, router])

  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex items-center gap-2 px-4 py-2 border-b">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
          <div className="flex-1" />
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-24" />
        </div>
        <div className="flex flex-1 overflow-hidden">
          <div className="w-full lg:w-[380px] p-6 border-r space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="hidden lg:block flex-1 p-6 space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border overflow-hidden">
      {/* Toolbar */}
      <EditorToolbar
        transcriptionId={transcriptionId}
        title={transcription?.title ?? 'Sans titre'}
        isSaving={isSaving}
        lastSavedAt={lastSavedAt}
        canUndo={canUndo}
        canRedo={canRedo}
        onTitleChange={updateTitle}
        onSave={saveAll}
        onUndo={undo}
        onRedo={redo}
        onDelete={handleDelete}
      />

      {/* Contenu principal : 2 colonnes desktop, 1 colonne mobile */}
      <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Colonne gauche : lecteur audio */}
        <div className="w-full lg:w-[380px] shrink-0 border-b lg:border-b-0 lg:border-r p-4 space-y-4 bg-slate-50/50">
          <AudioPlayer audioUrl={audioUrl} />

          {/* Infos et raccourcis */}
          <div className="hidden lg:block space-y-3 pt-2">
            <div className="text-xs text-muted-foreground space-y-1">
              <p className="font-medium text-foreground text-sm mb-2">Raccourcis clavier</p>
              <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1">
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">Espace</kbd>
                <span>Lecture / Pause</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">← / →</kbd>
                <span>± 5 secondes</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">Shift + ← / →</kbd>
                <span>± 1 seconde</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">Ctrl+S</kbd>
                <span>Sauvegarder</span>
                <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px] font-mono">Ctrl+Z</kbd>
                <span>Annuler</span>
              </div>
            </div>
          </div>
        </div>

        {/* Colonne droite : texte */}
        <div className="flex-1 overflow-hidden">
          <TranscriptText
            segments={segments}
            onUpdateSegment={updateSegment}
          />
        </div>
      </div>
    </div>
  )
}
