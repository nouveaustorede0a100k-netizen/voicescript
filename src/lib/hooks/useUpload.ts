'use client'

import { useCallback, useRef, useState } from 'react'

type UploadStatus = 'idle' | 'uploading' | 'success' | 'error'

interface UploadResult {
  transcription_id: string
}

interface UseUploadReturn {
  status: UploadStatus
  progress: number
  error: string | null
  result: UploadResult | null
  upload: (file: File, options: { title: string; language: string; accent: string; project_id?: string | null }) => void
  cancel: () => void
  retry: () => void
  reset: () => void
}

export function useUpload(): UseUploadReturn {
  const [status, setStatus] = useState<UploadStatus>('idle')
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)

  const xhrRef = useRef<XMLHttpRequest | null>(null)
  const lastArgsRef = useRef<{
    file: File
    options: { title: string; language: string; accent: string; project_id?: string | null }
  } | null>(null)

  const upload = useCallback(
    (file: File, options: { title: string; language: string; accent: string; project_id?: string | null }) => {
      lastArgsRef.current = { file, options }
      setStatus('uploading')
      setProgress(0)
      setError(null)
      setResult(null)

      const xhr = new XMLHttpRequest()
      xhrRef.current = xhr

      const formData = new FormData()
      formData.append('file', file)
      formData.append('title', options.title)
      formData.append('language', options.language)
      formData.append('accent', options.accent)
      if (options.project_id) formData.append('project_id', options.project_id)

      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          setProgress(Math.round((e.loaded / e.total) * 100))
        }
      })

      xhr.addEventListener('load', () => {
        try {
          const data = JSON.parse(xhr.responseText)

          if (xhr.status >= 200 && xhr.status < 300) {
            setStatus('success')
            setProgress(100)
            setResult({ transcription_id: data.transcription_id })
          } else {
            setStatus('error')
            setError(data.error || 'Une erreur est survenue')
          }
        } catch {
          setStatus('error')
          setError('Réponse invalide du serveur')
        }
      })

      xhr.addEventListener('error', () => {
        setStatus('error')
        setError('Erreur de connexion. Vérifiez votre réseau.')
      })

      xhr.addEventListener('abort', () => {
        setStatus('idle')
        setProgress(0)
      })

      xhr.open('POST', '/api/upload')
      xhr.send(formData)
    },
    []
  )

  const cancel = useCallback(() => {
    xhrRef.current?.abort()
    xhrRef.current = null
  }, [])

  const retry = useCallback(() => {
    if (lastArgsRef.current) {
      upload(lastArgsRef.current.file, lastArgsRef.current.options)
    }
  }, [upload])

  const reset = useCallback(() => {
    cancel()
    setStatus('idle')
    setProgress(0)
    setError(null)
    setResult(null)
    lastArgsRef.current = null
  }, [cancel])

  return { status, progress, error, result, upload, cancel, retry, reset }
}
