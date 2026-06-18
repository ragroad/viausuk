import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV:     z.enum(['development', 'test', 'production']).default('development'),
  PORT:         z.coerce.number().default(3001),
  FRONTEND_URL: z.string().default('http://localhost:5173'),
  PROTOTYPE_MODE: z.coerce.boolean().default(true),

  // Set automatically by docker-compose, or copy backend/.env.example for local dev
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required — run "docker compose up" or copy backend/.env.example to backend/.env'),
  // Leave empty to skip Redis/BullMQ and process AI jobs inline
  REDIS_URL:    z.string().default(''),

  // ── AI ────────────────────────────────────────────────────────
  AI_PROVIDER:         z.enum(['anthropic','openai','gemini','none']).default('none'),
  ANTHROPIC_API_KEY:   z.string().optional(),
  CLAUDE_MODEL:        z.string().default('claude-sonnet-4-6'),
  OPENAI_API_KEY:      z.string().optional(),
  OPENAI_MODEL:        z.string().default('gpt-4o'),
  GEMINI_API_KEY:      z.string().optional(),
  GEMINI_MODEL:        z.string().default('gemini-1.5-pro'),

  // ── Auth ──────────────────────────────────────────────────────
  CLERK_SECRET_KEY: z.string().default('placeholder_clerk'),

  // ── Stripe ────────────────────────────────────────────────────
  STRIPE_SECRET_KEY:        z.string().default('placeholder_stripe'),
  STRIPE_WEBHOOK_SECRET:    z.string().default('placeholder_stripe_wh'),
  STRIPE_PRICE_PRO_MONTHLY: z.string().optional(),
  STRIPE_PRICE_PAY_PER_USE: z.string().optional(),
  STRIPE_PRICE_FREE:        z.string().optional(),

  // ── Storage ───────────────────────────────────────────────────
  R2_ACCOUNT_ID:        z.string().optional(),
  R2_ACCESS_KEY_ID:     z.string().optional(),
  R2_SECRET_ACCESS_KEY: z.string().optional(),
  R2_BUCKET_US:         z.string().default('via-inspections-us'),
  R2_BUCKET_UK:         z.string().default('via-inspections-uk'),
  R2_PUBLIC_URL:        z.string().optional(),

  // ── Vehicle APIs ──────────────────────────────────────────────
  FMCSA_API_KEY:    z.string().optional(),
  CARFAX_API_KEY:   z.string().optional(),
  DVLA_API_KEY:     z.string().optional(),
  DVLA_BASE_URL:    z.string().default('https://driver-vehicle-licensing.api.gov.uk/vehicle-enquiry/v1'),
  DVSA_MOT_API_KEY: z.string().optional(),

  // ── CRM & Support ─────────────────────────────────────────────
  INTERCOM_ACCESS_TOKEN: z.string().optional(),

  // ── Monitoring ────────────────────────────────────────────────
  SENTRY_DSN:      z.string().optional(),
  POSTHOG_API_KEY: z.string().optional(),
  POSTHOG_HOST:    z.string().default('https://app.posthog.com'),

  // ── Security ──────────────────────────────────────────────────
  JWT_SECRET: z.string().default('prototype-jwt-secret-change-in-production'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌  Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isPrototypeMode = env.PROTOTYPE_MODE;
export const isRedisEnabled = !!env.REDIS_URL.trim();
export const isStorageEnabled = !!(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY);
export const isAiEnabled = env.AI_PROVIDER !== 'none';

// Startup status log
const d = parsed.data;
const ok  = (v?: string) => v && !v.startsWith('placeholder');
console.log('\n── VIA Backend ──────────────────────────────────');
console.log(`   Mode     : ${d.PROTOTYPE_MODE ? '⚠  prototype — zero-config defaults' : '✓  production'}`);
console.log(`   Database : ✓  PostgreSQL`);
console.log(`   Redis    : ${isRedisEnabled ? '✓  configured' : '⚠  disabled — inline job processing'}`);
console.log(`   AI       : ${d.AI_PROVIDER === 'none' ? '⚠  none — mock responses active' : `✓  ${d.AI_PROVIDER}`}`);
console.log(`   Clerk    : ${ok(d.CLERK_SECRET_KEY)    ? '✓  configured' : '⚠  placeholder — demo auth'}`);
console.log(`   Stripe   : ${ok(d.STRIPE_SECRET_KEY)   ? '✓  configured' : '⚠  placeholder — billing disabled'}`);
console.log(`   Storage  : ${isStorageEnabled            ? '✓  R2 configured' : '⚠  none — mock upload URLs'}`);
console.log('─────────────────────────────────────────────────\n');
