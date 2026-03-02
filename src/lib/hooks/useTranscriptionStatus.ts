'use client'

import { useEffect, useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { TranscriptionStatus } from '@/types'

interface TranscriptionStatusData {
  status: TranscriptionStatus
  error_message: string | null
}

interface UseTranscriptionStatusReturn {
  data: TranscriptionStatusData | null
  isLoading: boolean
  isProcessing: boolean
  isCompleted: boolean
  isError: boolean
}

/**
 * Poll le statut d'une transcription toutes les 3s tant qu'elle est
 * en 'pending' ou 'processing'. Arrête automatiquement quand
 * 'completed' ou 'error'.
 */
export function useTranscriptionStatus(
  transcriptionId: string | null
): UseTranscriptionStatusReturn {
  const [data, setData] = useState<TranscriptionStatusData | null>(null)
  const [isLoading, setIsLoading] = useState(!!transcriptionId)

  const fetchStatus = useCallback(async () => {
    if (!transcriptionId) return null

    const supabase = createClient()
    const { data: row } = await supabase
      .from('transcriptions')
      .select('status, error_message')
      .eq('id', transcriptionId)
      .single()

    return row as TranscriptionStatusData | null
  }, [transcriptionId])

  useEffect(() => {
    if (!transcriptionId) {
      setData(null)
      setIsLoading(false)
      return
    }

    let active = true
    let timer: ReturnType<typeof setTimeout>

    const poll = async () => {
      const result = await fetchStatus()
      if (!active) return

      if (result) {
        setData(result)
        setIsLoading(false)

        const shouldContinue =
          result.status === 'pending' || result.status === 'processing'

        if (shouldContinue) {
          timer = setTimeout(poll, 3000)
        }
      } else {
        setIsLoading(false)
      }
    }

    poll()

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [transcriptionId, fetchStatus])

  const status = data?.status
  return {
    data,
    isLoading,
    isProcessing: status === 'processing' || status === 'pending',
    isCompleted: status === 'completed',
    isError: status === 'error',
  }
}
