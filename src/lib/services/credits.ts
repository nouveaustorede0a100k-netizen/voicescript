import { createAdminClient } from '@/lib/supabase/server'
import type { Json } from '@/types/database'

/**
 * Consomme des minutes du quota utilisateur et enregistre un usage_log.
 */
export async function consumeCredits(
  userId: string,
  transcriptionId: string,
  seconds: number,
  metadata?: Record<string, Json>
): Promise<void> {
  const minutes = Math.ceil(seconds / 60)
  const supabase = createAdminClient()

  const { error } = await supabase.rpc('consume_minutes', {
    p_user_id: userId,
    p_transcription_id: transcriptionId,
    p_minutes: minutes,
    p_metadata: (metadata ?? {}) as Json,
  })

  if (error) {
    console.error('[Credits] Erreur consume_minutes:', error.message)
    throw new Error(`Erreur lors de la consommation des crédits : ${error.message}`)
  }
}

/**
 * Vérifie si l'utilisateur a suffisamment de quota.
 */
export async function checkCredits(
  userId: string,
  estimatedSeconds: number
): Promise<boolean> {
  const minutes = Math.ceil(estimatedSeconds / 60)
  const supabase = createAdminClient()

  const { data, error } = await supabase.rpc('check_quota', {
    p_user_id: userId,
    p_minutes: minutes,
  })

  if (error) {
    console.error('[Credits] Erreur check_quota:', error.message)
    return false
  }

  return data === true
}

/**
 * Rembourse des minutes en cas d'erreur pendant le traitement.
 * Utilise une requête SQL directe pour décrémenter minutes_used
 * en s'assurant de ne jamais descendre sous 0.
 */
export async function refundCredits(
  userId: string,
  seconds: number
): Promise<void> {
  const minutes = Math.ceil(seconds / 60)
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('minutes_used')
    .eq('id', userId)
    .single()

  if (!profile) return

  const newMinutesUsed = Math.max(0, profile.minutes_used - minutes)

  const { error } = await supabase
    .from('profiles')
    .update({ minutes_used: newMinutesUsed })
    .eq('id', userId)

  if (error) {
    console.error('[Credits] Erreur refund:', error.message)
  }
}

/**
 * Retourne les minutes restantes pour un utilisateur.
 */
export async function getRemainingMinutes(userId: string): Promise<number> {
  const supabase = createAdminClient()

  const { data: profile } = await supabase
    .from('profiles')
    .select('minutes_used, minutes_limit')
    .eq('id', userId)
    .single()

  if (!profile) return 0
  return Math.max(0, profile.minutes_limit - profile.minutes_used)
}
