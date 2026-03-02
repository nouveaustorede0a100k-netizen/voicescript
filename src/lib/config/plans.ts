import type { PlanType, PlanConfig } from '@/types'

export const PLANS: Record<PlanType, PlanConfig> = {
  free: {
    name: 'Free',
    price: 0,
    minutes_limit: 30,
    max_file_size: 500_000_000,
    max_file_duration: 1800,
    export_formats: ['txt'],
    languages: ['fr', 'en'],
    accents: ['fr-standard'],
    features: [
      '30 minutes / mois',
      'Export TXT',
      '2 langues',
      'Accent standard',
    ],
  },
  creator: {
    name: 'Créateur',
    price: 990,
    minutes_limit: 180,
    max_file_size: 2_000_000_000,
    max_file_duration: 7200,
    export_formats: ['txt', 'srt', 'vtt', 'docx'],
    languages: 'all',
    accents: 'all',
    features: [
      '180 minutes / mois',
      'Export SRT, VTT, DOCX',
      'Toutes les langues',
      'Tous les accents',
      '5 projets',
      'Repurposing IA',
    ],
    stripe_price_id: process.env.STRIPE_PRICE_CREATOR,
  },
  pro: {
    name: 'Pro',
    price: 1990,
    minutes_limit: 600,
    max_file_size: 2_000_000_000,
    max_file_duration: 14400,
    export_formats: ['txt', 'srt', 'vtt', 'docx', 'json'],
    languages: 'all',
    accents: 'all',
    features: [
      '600 minutes / mois',
      'Tous les exports',
      'Toutes les langues',
      'Clés API',
      '20 projets',
      'Repurposing IA',
      'Support prioritaire',
    ],
    stripe_price_id: process.env.STRIPE_PRICE_PRO,
  },
  studio: {
    name: 'Studio',
    price: 4990,
    minutes_limit: 2400,
    max_file_size: 5_000_000_000,
    max_file_duration: 28800,
    export_formats: ['txt', 'srt', 'vtt', 'docx', 'json'],
    languages: 'all',
    accents: 'all',
    features: [
      '2 400 minutes / mois',
      'Tous les exports',
      'Toutes les langues',
      'API illimitée',
      'Projets illimités',
      'Repurposing IA',
      'Support dédié',
    ],
    stripe_price_id: process.env.STRIPE_PRICE_STUDIO,
  },
}

export function getPlan(planType: PlanType): PlanConfig {
  return PLANS[planType]
}

export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(cents / 100)
}
