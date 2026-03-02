import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'
import type { TranscriptionListItem, UserStats } from '@/types'

type TypedClient = SupabaseClient<Database>

export async function getDashboardStats(
  supabase: TypedClient,
  userId: string
): Promise<UserStats | null> {
  const { data, error } = await supabase.rpc('get_user_stats', {
    p_user_id: userId,
  })

  if (error) return null
  return data as unknown as UserStats
}

export async function getRecentTranscriptions(
  supabase: TypedClient,
  userId: string,
  limit = 10
): Promise<TranscriptionListItem[]> {
  const { data, error } = await supabase
    .from('transcriptions')
    .select(
      'id, title, status, file_duration, file_type, language, accent, word_count, confidence_avg, created_at, updated_at'
    )
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return []
  return (data ?? []) as TranscriptionListItem[]
}

export async function deleteTranscription(
  supabase: TypedClient,
  transcriptionId: string
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from('transcriptions')
    .delete()
    .eq('id', transcriptionId)

  if (error) return { success: false, error: error.message }
  return { success: true }
}
