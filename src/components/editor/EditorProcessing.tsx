'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useTranscriptionStatus } from '@/lib/hooks/useTranscriptionStatus'

interface EditorProcessingProps {
  transcriptionId: string
  title: string
}

/**
 * Affiche un état d'attente tant que la transcription est en cours,
 * puis redirige vers l'éditeur une fois terminée.
 */
export function EditorProcessing({ transcriptionId, title }: EditorProcessingProps) {
  const router = useRouter()
  const { isCompleted, isError, data } = useTranscriptionStatus(transcriptionId)

  useEffect(() => {
    if (isCompleted) {
      router.refresh()
    }
  }, [isCompleted, router])

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-rose-100 flex items-center justify-center">
          <span className="text-2xl">❌</span>
        </div>
        <h2 className="text-xl font-semibold">Erreur de transcription</h2>
        <p className="text-muted-foreground max-w-md">
          {data?.error_message ?? 'Une erreur est survenue lors de la transcription.'}
        </p>
        <button
          onClick={() => router.push('/upload')}
          className="text-primary hover:underline text-sm"
        >
          Réessayer avec un nouveau fichier
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
      <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-primary animate-spin" />
      </div>
      <h2 className="text-xl font-semibold">Transcription en cours…</h2>
      <p className="text-muted-foreground max-w-md">
        « {title} » est en cours de traitement. Cette page se mettra à jour automatiquement.
      </p>
      <p className="text-xs text-muted-foreground">
        Cela peut prendre quelques minutes selon la durée du fichier.
      </p>
    </div>
  )
}
