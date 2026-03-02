import { NextResponse } from 'next/server'
import { createServerSupabaseClient, createAdminClient } from '@/lib/supabase/server'

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

    // Soft-delete : désactiver le compte au lieu de supprimer
    await admin.from('profiles').update({
      full_name: '[Compte supprimé]',
      avatar_url: '',
      plan: 'free',
      minutes_used: 0,
      minutes_limit: 0,
    }).eq('id', user.id)

    // Annuler l'abonnement Stripe si existant
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_customer_id) {
      try {
        const Stripe = (await import('stripe')).default
        const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
          apiVersion: '2026-02-25.clover',
        })

        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'active',
        })

        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id)
        }
      } catch (stripeErr) {
        console.error('[DeleteAccount] Erreur Stripe:', stripeErr)
      }
    }

    // Déconnecter l'utilisateur côté auth
    await admin.auth.admin.updateUserById(user.id, {
      ban_duration: '876000h', // ~100 ans
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('[DeleteAccount] Erreur:', err)
    return NextResponse.json(
      { error: 'Erreur lors de la suppression du compte' },
      { status: 500 }
    )
  }
}
