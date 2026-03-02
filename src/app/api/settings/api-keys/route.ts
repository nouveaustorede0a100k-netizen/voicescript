import { NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'

function generateApiKey(): string {
  const uuid = randomUUID().replace(/-/g, '')
  const extra = randomUUID().replace(/-/g, '').slice(0, 16)
  return `sk-vs-${uuid}${extra}`
}

function maskKey(key: string): string {
  if (key.length < 10) return key
  return `${key.slice(0, 6)}****...${key.slice(-4)}`
}

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Vérifier plan Pro/Studio
    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.plan !== 'pro' && profile.plan !== 'studio')) {
      return NextResponse.json(
        { error: 'Plan Pro ou Studio requis' },
        { status: 403 }
      )
    }

    // Pour le MVP, on stocke les clés dans un simple fichier de données
    // En production, elles seraient dans une table api_keys avec hashing
    // Ici on simule avec la table usage_logs metadata comme stockage temporaire
    // En réalité, il faudrait une table dédiée. Pour le MVP on retourne un tableau vide.
    return NextResponse.json({ keys: [] })
  } catch (err) {
    console.error('[ApiKeys/GET] Erreur:', err)
    return NextResponse.json(
      { error: 'Erreur lors du chargement' },
      { status: 500 }
    )
  }
}

export async function POST() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    if (!profile || (profile.plan !== 'pro' && profile.plan !== 'studio')) {
      return NextResponse.json(
        { error: 'Plan Pro ou Studio requis' },
        { status: 403 }
      )
    }

    const key = generateApiKey()
    const prefix = maskKey(key)

    // MVP : en production, stocker le hash de la clé dans une table api_keys
    // Pour l'instant, on retourne la clé générée
    return NextResponse.json({
      key,
      key_prefix: prefix,
      id: randomUUID(),
      created_at: new Date().toISOString(),
    })
  } catch (err) {
    console.error('[ApiKeys/POST] Erreur:', err)
    return NextResponse.json(
      { error: 'Erreur lors de la création' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const keyId = searchParams.get('id')

    if (!keyId) {
      return NextResponse.json({ error: 'ID de clé requis' }, { status: 400 })
    }

    // MVP : en production, supprimer le hash de la clé de la table api_keys
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[ApiKeys/DELETE] Erreur:', err)
    return NextResponse.json(
      { error: 'Erreur lors de la révocation' },
      { status: 500 }
    )
  }
}
