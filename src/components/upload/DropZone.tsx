'use client'

import { useCallback, useRef, useState, useEffect } from 'react'
import {
  Upload,
  CheckCircle,
  XCircle,
  X,
  RefreshCw,
  FileAudio,
  Video,
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface DropZoneProps {
  maxSizeMB: number
  onFileSelect: (file: File) => void
  uploadStatus: 'idle' | 'uploading' | 'success' | 'error'
  uploadProgress: number
  uploadError: string | null
  selectedFile: File | null
  onCancel: () => void
  onRetry: () => void
  onReset: () => void
}

const ACCEPTED_TYPES = [
  'audio/mpeg',
  'audio/wav',
  'audio/mp4',
  'audio/x-m4a',
  'video/mp4',
  'video/webm',
  'audio/ogg',
  'audio/webm',
]

const ACCEPTED_EXTENSIONS = 'MP3, WAV, M4A, MP4, WEBM, OGG'

function formatSize(bytes: number): string {
  if (bytes >= 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / 1024).toFixed(0)} KB`
}

export function DropZone({
  maxSizeMB,
  onFileSelect,
  uploadStatus,
  uploadProgress,
  uploadError,
  selectedFile,
  onCancel,
  onRetry,
  onReset,
}: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [clientError, setClientError] = useState<string | null>(null)
  const [thumbnail, setThumbnail] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Génération de miniature pour les vidéos
  useEffect(() => {
    if (!selectedFile) {
      setThumbnail(null)
      return
    }

    if (!selectedFile.type.startsWith('video/')) {
      setThumbnail(null)
      return
    }

    const video = document.createElement('video')
    video.preload = 'metadata'
    const objectUrl = URL.createObjectURL(selectedFile)
    video.src = objectUrl

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration / 2)
    }

    video.onseeked = () => {
      const canvas = document.createElement('canvas')
      canvas.width = video.videoWidth
      canvas.height = video.videoHeight
      canvas.getContext('2d')?.drawImage(video, 0, 0)
      setThumbnail(canvas.toDataURL('image/jpeg'))
      URL.revokeObjectURL(objectUrl)
    }

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      setThumbnail(null)
    }

    return () => {
      URL.revokeObjectURL(objectUrl)
    }
  }, [selectedFile])

  const validateFile = useCallback(
    (file: File): string | null => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        return `Format non supporté. Formats acceptés : ${ACCEPTED_EXTENSIONS}`
      }
      if (file.size > maxSizeMB * 1024 * 1024) {
        return `Fichier trop volumineux. Taille max : ${maxSizeMB}MB`
      }
      return null
    },
    [maxSizeMB]
  )

  const handleFile = useCallback(
    (file: File) => {
      const err = validateFile(file)
      if (err) {
        setClientError(err)
        return
      }
      setClientError(null)
      onFileSelect(file)
    },
    [validateFile, onFileSelect]
  )

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setIsDragging(false)
      const file = e.dataTransfer.files[0]
      if (file) handleFile(file)
    },
    [handleFile]
  )

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (file) handleFile(file)
      if (inputRef.current) inputRef.current.value = ''
    },
    [handleFile]
  )

  const isVideo = selectedFile?.type.startsWith('video/')
  const filePreview = thumbnail ? (
    <img src={thumbnail} alt="Aperçu" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
  ) : (
    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-indigo-100">
      {isVideo ? (
        <Video className="h-6 w-6 text-indigo-600" />
      ) : (
        <FileAudio className="h-6 w-6 text-indigo-600" />
      )}
    </div>
  )

  // --- État : Uploading ---
  if (uploadStatus === 'uploading' && selectedFile) {
    return (
      <div className="rounded-xl border border-border bg-white p-8">
        <div className="flex items-center gap-4">
          {filePreview}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-vs-text">
              {selectedFile.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatSize(selectedFile.size)}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onCancel}
            aria-label="Annuler l'upload"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="mt-4 space-y-2">
          <Progress
            value={uploadProgress}
            className="h-2 [&>[data-slot=progress-indicator]]:bg-indigo-500"
          />
          <p className="text-center text-sm text-muted-foreground">
            Upload en cours… {uploadProgress}%
          </p>
        </div>
      </div>
    )
  }

  // --- État : Success ---
  if (uploadStatus === 'success' && selectedFile) {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-8 text-center">
        {thumbnail ? (
          <img src={thumbnail} alt="Aperçu" className="mx-auto h-20 w-32 rounded-lg object-cover" />
        ) : (
          <CheckCircle className="mx-auto h-12 w-12 text-emerald-500" />
        )}
        <p className="mt-3 text-sm font-medium text-emerald-800">
          {selectedFile.name}
        </p>
        <p className="mt-1 text-sm text-emerald-600">
          Upload terminé — Transcription en cours…
        </p>
      </div>
    )
  }

  // --- État : Error ---
  if (uploadStatus === 'error' || clientError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-8 text-center">
        <XCircle className="mx-auto h-12 w-12 text-rose-500" />
        <p className="mt-3 text-sm font-medium text-rose-800">
          {clientError || uploadError || 'Une erreur est survenue'}
        </p>
        <div className="mt-4 flex justify-center gap-3">
          {!clientError && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-4 w-4" />
              Réessayer
            </Button>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setClientError(null)
              onReset()
            }}
          >
            Choisir un autre fichier
          </Button>
        </div>
      </div>
    )
  }

  // --- État : Idle / Hover / Dragging ---
  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Zone de dépôt de fichier"
      className={cn(
        'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        isDragging
          ? 'scale-[1.02] border-indigo-500 bg-indigo-100'
          : 'border-slate-300 bg-slate-50 hover:border-indigo-400 hover:bg-indigo-50'
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="audio/*,video/*"
        className="hidden"
        onChange={handleInputChange}
        aria-hidden="true"
      />
      <div
        className={cn(
          'flex h-16 w-16 items-center justify-center rounded-full transition-colors',
          isDragging ? 'bg-indigo-200' : 'bg-slate-200'
        )}
      >
        <Upload
          className={cn(
            'h-8 w-8 transition-colors',
            isDragging ? 'text-indigo-600' : 'text-slate-400'
          )}
        />
      </div>
      <p className="mt-4 text-sm font-medium text-vs-text">
        {isDragging
          ? 'Déposez votre fichier ici'
          : 'Glissez votre fichier ici ou cliquez pour parcourir'}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">
        {ACCEPTED_EXTENSIONS} — Max {maxSizeMB >= 1024 ? `${maxSizeMB / 1024}GB` : `${maxSizeMB}MB`}
      </p>
    </div>
  )
}
