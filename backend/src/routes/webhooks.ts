import { Router, Request, Response } from 'express';
import { handleWebhookEvent } from '../services/stripe';
import { logger } from '../config/logger';

const router = Router();

// POST /api/webhooks/stripe — raw body required (set in index.ts)
router.post('/stripe', async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;
  if (!signature) {
    res.status(400).json({ error: 'Missing stripe-signature header' });
    return;
  }

  try {
    await handleWebhookEvent(req.body as Buffer, signature);
    res.json({ received: true });
  } catch (err: any) {
    logger.error('Stripe webhook error', { err: err.message });
    res.status(400).json({ error: err.message });
  }
});

export default router;
