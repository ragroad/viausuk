import { env } from '../config/env';
import { logger } from '../config/logger';

const STRIPE_CONFIGURED = !env.STRIPE_SECRET_KEY.startsWith('placeholder');

// Lazy-load Stripe only when configured
function getStripe() {
  if (!STRIPE_CONFIGURED) throw new Error('Stripe not configured — add STRIPE_SECRET_KEY to .env');
  const Stripe = require('stripe');
  return new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2024-06-20' });
}

export async function createCheckoutSession(orgId: string, priceId: string): Promise<string> {
  if (!STRIPE_CONFIGURED) {
    logger.warn('Stripe not configured — returning mock checkout URL');
    return `${env.FRONTEND_URL}/billing?mock=true`;
  }
  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{ price: priceId, quantity: 1 }],
    mode: 'subscription',
    success_url: `${env.FRONTEND_URL}/billing?session={CHECKOUT_SESSION_ID}`,
    cancel_url:  `${env.FRONTEND_URL}/billing`,
    metadata: { orgId },
  });
  return session.url!;
}

export async function createPortalSession(orgId: string): Promise<string> {
  if (!STRIPE_CONFIGURED) {
    logger.warn('Stripe not configured — returning mock portal URL');
    return `${env.FRONTEND_URL}/billing?mock=true`;
  }
  // Full implementation in original stripe.ts
  throw new Error('Portal session requires stripeCustomerId — see full stripe.ts');
}

export async function handleWebhookEvent(body: Buffer, signature: string): Promise<void> {
  if (!STRIPE_CONFIGURED) {
    logger.warn('Stripe webhook received but Stripe not configured — ignoring');
    return;
  }
  const stripe = getStripe();
  const event = stripe.webhooks.constructEvent(body, signature, env.STRIPE_WEBHOOK_SECRET);
  logger.info('Stripe webhook received', { type: event.type });
  // Full webhook handling in original stripe.ts
}

export async function recordInspectionMeterEvent(orgId: string): Promise<void> {
  if (!STRIPE_CONFIGURED) return; // silently skip in prototype mode
  // Full implementation in original stripe.ts
}
