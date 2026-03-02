import type { Tables } from './database'
import { z } from 'zod'

export type Profile = Tables<'profiles'>
export type Project = Tables<'projects'>
export type Transcription = Tables<'transcriptions'>
export type Segment = Tables<'transcription_segments'>
export type Subscription = Tables<'subscriptions'>
export type UsageLog = Tables<'usage_logs'>

export type ProjectWithCount = Project & { transcription_count: number }

export type TranscriptionWithSegments = Transcription & {
  segments: Segment[]
}

export type TranscriptionListItem = Pick<
  Transcription,
  'id' | 'title' | 'status' | 'file_duration' | 'file_type' | 'language' | 'accent' | 'word_count' | 'confidence_avg' | 'created_at' | 'updated_at'
>

export interface UserStats {
  total_transcriptions: number
  completed_transcriptions: number
  total_minutes_consumed: number
  this_month_minutes: number
  last_transcription_at: string | null
  minutes_used: number
  minutes_limit: number
  plan: Profile['plan']
}

export type PlanType = 'free' | 'creator' | 'pro' | 'studio'
export type AccentType = 'fr-standard' | 'fr-quebec' | 'fr-africa' | 'fr-belgium' | 'fr-swiss'
export type TranscriptionStatus = 'pending' | 'processing' | 'completed' | 'error'
export type ExportFormat = 'txt' | 'srt' | 'vtt' | 'docx' | 'json'

export interface PlanConfig {
  name: string
  price: number
  priceAnnual?: number
  minutes_limit: number
  max_file_size: number
  max_file_duration: number
  export_formats: ExportFormat[]
  languages: string[] | 'all' | 'all_20'
  accents: AccentType[] | 'all'
  features: string[]
  stripe_price_id?: string
  stripe_price_annual_id?: string
}

export const uploadSchema = z.object({
  title: z.string().min(1, 'Le titre est requis').max(200),
  language: z.string().default('fr'),
  accent: z.enum(['fr-standard', 'fr-quebec', 'fr-africa', 'fr-belgium', 'fr-swiss']).default('fr-standard'),
})
export type UploadFormData = z.infer<typeof uploadSchema>

export const profileUpdateSchema = z.object({
  full_name: z.string().min(1).max(100),
  preferred_accent: z.enum(['fr-standard', 'fr-quebec', 'fr-africa', 'fr-belgium', 'fr-swiss']),
  preferred_language: z.string().default('fr'),
})
export type ProfileUpdateData = z.infer<typeof profileUpdateSchema>

export const segmentUpdateSchema = z.object({
  id: z.string().uuid(),
  text: z.string(),
})
export type SegmentUpdateData = z.infer<typeof segmentUpdateSchema>

export const signUpSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(8, 'Minimum 8 caractères'),
  full_name: z.string().min(1, 'Le nom est requis').max(100),
})
export type SignUpData = z.infer<typeof signUpSchema>

export const signInSchema = z.object({
  email: z.string().email('Email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis'),
})
export type SignInData = z.infer<typeof signInSchema>

export const projectSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100, 'Max 100 caractères'),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide').default('#4F46E5'),
  description: z.string().max(500).default(''),
})
export type ProjectFormData = z.infer<typeof projectSchema>

export type LoadingState = 'idle' | 'loading' | 'success' | 'error'

export interface ApiError {
  message: string
  code?: string
  status?: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  totalPages: number
}

export interface ExportOptions {
  format: ExportFormat
  includeTimestamps: boolean
  includeSpeakers: boolean
}
