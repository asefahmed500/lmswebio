import Stripe from "stripe"

const stripeSecretKey = process.env.STRIPE_SECRET_KEY

let stripeInstance: Stripe | null = null

export function getStripe(): Stripe | null {
  if (!stripeSecretKey) return null
  if (!stripeInstance) {
    stripeInstance = new Stripe(stripeSecretKey)
  }
  return stripeInstance
}

export function isStripeConfigured(): boolean {
  return !!stripeSecretKey
}
