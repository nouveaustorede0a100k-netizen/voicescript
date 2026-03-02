import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-02-25.clover',
})

export async function POST(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    const { price_id } = await request.json()
    if (!price_id) {
      return NextResponse.json(
        { error: 'price_id requis' },
        { status: 400 }
      )
    }

    const admin = createAdminClient()
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id, email, full_name')
      .eq('id', user.id)
      .single()

    let stripeCustomerId = profile?.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: profile?.email ?? user.email,
        name: profile?.full_name ?? undefined,
        metadata: { user_id: user.id },
      })

      stripeCustomerId = customer.id

      await admin
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', user.id)
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      line_items: [{ price: price_id, quantity: 1 }],
      success_url: `${appUrl}/settings?tab=billing&success=true`,
      cancel_url: `${appUrl}/settings?tab=billing&canceled=true`,
      metadata: { user_id: user.id },
      allow_promotion_codes: true,
    })

    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error('[Billing/Checkout] Erreur:', err)
    return NextResponse.json(
      { error: 'Erreur lors de la création de la session de paiement' },
      { status: 500 }
    )
  }
}
