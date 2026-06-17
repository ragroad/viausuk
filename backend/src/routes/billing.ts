import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { createCheckoutSession, createPortalSession } from '../services/stripe';
import { AppError } from '../middleware/errorHandler';
import prisma from '../config/db';

const router = Router();
router.use(requireAuth);

// GET /api/v1/billing/overview
router.get('/overview', async (req: AuthenticatedRequest, res: Response) => {
  const org = await prisma.organisation.findUniqueOrThrow({
    where: { id: req.orgId },
    select: {
      plan: true,
      inspectionCount: true,
      currentPeriodEnd: true,
      stripeSubscriptionId: true,
    },
  });
  const invoices = await prisma.invoice.findMany({
    where: { orgId: req.orgId },
    orderBy: { createdAt: 'desc' },
    take: 10,
  });
  res.json({ ...org, invoices });
});

// POST /api/v1/billing/checkout
// ← fixed: createCheckoutSession now takes (orgId, priceId) — 2 args only
router.post('/checkout', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  const { priceId } = z.object({ priceId: z.string() }).parse(req.body);
  const url = await createCheckoutSession(req.orgId!, priceId);
  res.json({ url });
});

// POST /api/v1/billing/portal
router.post('/portal', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  const url = await createPortalSession(req.orgId!);
  res.json({ url });
});

export default router;
