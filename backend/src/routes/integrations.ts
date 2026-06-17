import { Router, Response } from 'express';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { env } from '../config/env';

const router = Router();
router.use(requireAuth);

// GET /api/v1/integrations/status
// Returns live connection status for every integration based on configured env vars
router.get('/status', async (_req: AuthenticatedRequest, res: Response) => {
  const configured = (v?: string) => !!v && !v.startsWith('placeholder');

  const status = {
    // US Vehicle Data
    'NHTSA API':          { connected: true,                          tag: 'US', note: 'Public API — no key required' },
    'DOT / FMCSA':        { connected: configured(env.FMCSA_API_KEY), tag: 'US' },
    'Carfax':             { connected: configured(env.CARFAX_API_KEY), tag: 'US' },

    // UK Vehicle Data
    'DVLA (UK)':          { connected: configured(env.DVLA_API_KEY),     tag: 'UK' },
    'DVSA MOT API (UK)':  { connected: configured(env.DVSA_MOT_API_KEY), tag: 'UK' },

    // Auth
    'Clerk':              { connected: configured(env.CLERK_SECRET_KEY) },

    // Payments
    'Stripe Billing':     { connected: configured(env.STRIPE_SECRET_KEY) },
    'Stripe Meters':      { connected: configured(env.STRIPE_SECRET_KEY) },
    'Stripe Portal':      { connected: configured(env.STRIPE_SECRET_KEY) },

    // AI  ← uses AI_PROVIDER, not a key directly
    'AI Provider':        { connected: env.AI_PROVIDER !== 'none', note: env.AI_PROVIDER },

    // Storage
    'Cloudflare R2':      { connected: configured(env.R2_ACCOUNT_ID) },

    // CRM & Support  ← fixed: now reads from env correctly
    'Intercom':           { connected: configured(env.INTERCOM_ACCESS_TOKEN) },

    // Monitoring
    'Sentry':             { connected: configured(env.SENTRY_DSN) },
    'PostHog':            { connected: configured(env.POSTHOG_API_KEY) },
  };

  const total     = Object.keys(status).length;
  const connected = Object.values(status).filter(s => s.connected).length;

  res.json({ connected, total, services: status });
});

export default router;
