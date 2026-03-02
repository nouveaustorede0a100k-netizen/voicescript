'use client'

import { useCallback, useRef, useState } from 'react'

export type RepurposeType = 'article' | 'thread' | 'newsletter' | 'summary' | 'faq'

export interface RepurposeOptions {
  tone: 'formel' | 'décontracté' | 'professionnel'
  length: 'court' | 'moyen' | 'long'
}

interface UseRepurposeReturn {
  result: string
  isGenerating: boolean
  error: string | null
  generate: (transcriptionId: string, type: RepurposeType, options: RepurposeOptions) => Promise<void>
  reset: () => void
}

export function useRepurpose(): UseRepurposeReturn {
  const [result, setResult] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const generate = useCallback(
    async (
      transcriptionId: string,
      type: RepurposeType,
      options: RepurposeOptions
    ) => {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller

      setIsGenerating(true)
      setResult('')
      setError(null)

      try {
        const res = await fetch('/api/repurpose', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            transcription_id: transcriptionId,
            type,
            options,
          }),
          signal: controller.signal,
        })

        if (!res.ok) {
          const data = await res.json().catch(() => null)
          throw new Error(data?.error ?? `Erreur HTTP ${res.status}`)
        }

        const reader = res.body?.getReader()
        if (!reader) throw new Error('Stream indisponible')

        const decoder = new TextDecoder()

        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          const chunk = decoder.decode(value, { stream: true })
          setResult((prev) => prev + chunk)
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return
        setError(
          err instanceof Error
            ? err.message
            : 'La génération a échoué. Réessayez.'
        )
      } finally {
        setIsGenerating(false)
      }
    },
    []
  )

  const reset = useCallback(() => {
    abortRef.current?.abort()
    setResult('')
    setError(null)
    setIsGenerating(false)
  }, [])

  return { result, isGenerating, error, generate, reset }
}
