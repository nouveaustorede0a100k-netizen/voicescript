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

  const xhrRef = useRef<XMLHttpRequest | null>(null)
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

        // Étape 2 — Upload direct vers R2 avec progression
        await new Promise<void>((resolve, reject) => {
          const xhr = new XMLHttpRequest()
          xhrRef.current = xhr

          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              setProgress(Math.round((e.loaded / e.total) * 95))
            }
          })

          xhr.addEventListener('load', () => {
            console.log('[Upload] XHR load:', xhr.status, xhr.statusText)
            console.log('[Upload] XHR response:', xhr.responseText.substring(0, 200))
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve()
            } else {
              reject(
                new Error(
                  `Upload R2 échoué (${xhr.status} ${xhr.statusText}): ${xhr.responseText.substring(0, 150)}`
                )
              )
            }
          })

          xhr.addEventListener('error', () => {
            console.error('[Upload] XHR error event, readyState:', xhr.readyState, 'status:', xhr.status)
            reject(new Error(`Erreur réseau lors de l'envoi (readyState: ${xhr.readyState})`))
          })

          xhr.addEventListener('abort', () => {
            console.log('[Upload] XHR aborted')
            abortedRef.current = true
            reject(new Error('__aborted__'))
          })

          xhr.open('PUT', uploadUrl)
          xhr.setRequestHeader('Content-Type', file.type)
          xhr.send(file)
        })

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
        if (abortedRef.current || (err as Error).message === '__aborted__') {
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
    xhrRef.current?.abort()
    xhrRef.current = null
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
