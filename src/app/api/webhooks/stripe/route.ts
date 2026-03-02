// TODO: Webhook Stripe pour gérer les événements de paiement
import { NextResponse } from 'next/server'

export async function POST() {
  return NextResponse.json({ message: 'Stripe webhook endpoint' })
}
