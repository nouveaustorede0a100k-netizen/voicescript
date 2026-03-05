'use client'

import { useCallback, useRef, useState } from 'react'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadOptions {
  title: string
  language: string
  accent: string
  project_id?: string | null
}

interface UploadResult {
  transcription_id: string
}

interface UseUploadReturn {
  status: UploadStatus
  progress: number
  error: string | null
  result: UploadResult | null
  upload: (file: File, options: UploadOptions) => void
  cancel: () => void
  retry: () => void
  reset: () => void
}

async function jsonOrThrow(res: Response): Promise<Record<string, unknown>> {
  const data = await res.json()
  if (!res.ok) {
    throw new Error(
      (data.error as string) || `Erreur serveur (${res.status})`
    )
  }
  return data
}

export function useUpload(): UseUploadReturn {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)

  const abortControllerRef = useRef<AbortController | null>(null)
  const abortedRef = useRef(false)
  const lastArgsRef = useRef<{ file: File; options: UploadOptions } | null>(null)

  const upload = useCallback((file: File, options: UploadOptions) => {
    lastArgsRef.current = { file, options }
    abortedRef.current = false
    setStatus('uploading')
    setProgress(0)
    setError(null)
    setResult(null)

    ;(async () => {
      try {
        // Étape 1 — Obtenir l'URL signée
        const presignData = await jsonOrThrow(
          await fetch('/api/upload/presign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
            }),
          })
        )

        if (abortedRef.current) return

        const uploadUrl = presignData.uploadUrl as string
        const key = presignData.key as string

        console.log('[Upload] Presign OK:', { uploadUrl: uploadUrl.substring(0, 80) + '...', key })
        console.log('[Upload] File:', file.name, file.size, file.type)

        // Étape 2 — Upload direct vers R2 (fetch, aucun header)
        const controller = new AbortController()
        abortControllerRef.current = controller

        const r2Response = await fetch(uploadUrl, {
          method: 'PUT',
          body: file,
          signal: controller.signal,
        })

        if (!r2Response.ok) {
          const errorText = await r2Response.text()
          console.error('[Upload] R2 error:', r2Response.status, errorText)
          throw new Error(`Upload échoué: ${r2Response.status}`)
        }
        console.log('[Upload] R2 OK:', r2Response.status)

        if (abortedRef.current) return

        // Étape 3 — Finaliser (créer la transcription en DB)
        setProgress(97)
        const completeData = await jsonOrThrow(
          await fetch('/api/upload/complete', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              title: options.title,
              language: options.language,
              accent: options.accent,
              projectId: options.project_id ?? null,
            }),
          })
        )

        setStatus('success')
        setProgress(100)
        setResult({
          transcription_id: completeData.transcription_id as string,
        })
      } catch (err) {
        if (abortedRef.current || (err as Error).message === '__aborted__' || (err as Error).name === 'AbortError') {
          setStatus('idle')
          setProgress(0)
          return
        }
        console.error('[Upload] Full error:', err)
        setStatus('error')
        const message = err instanceof Error ? err.message : 'Erreur inconnue'
        setError(message)
      }
    })()
  }, [])

  const cancel = useCallback(() => {
    abortedRef.current = true
    abortControllerRef.current?.abort()
    abortControllerRef.current = null
    setStatus('idle')
    setProgress(0)
  }, [])

  const retry = useCallback(() => {
    if (lastArgsRef.current) {
      upload(lastArgsRef.current.file, lastArgsRef.current.options)
    }
  }, [upload])

  const reset = useCallback(() => {
    cancel()
    setError(null)
    setResult(null)
    lastArgsRef.current = null
  }, [cancel])

  return { status, progress, error, result, upload, cancel, retry, reset }
}
