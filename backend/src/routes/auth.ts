import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { logger } from '../config/logger';

const router = Router();

// POST /api/v1/auth/sync — called after Clerk sign-in to sync user to our DB
router.post('/sync', async (req: Request, res: Response) => {
  const schema = z.object({
    clerkId: z.string().min(1),
    email:   z.string().email(),
    name:    z.string().min(1),
  });
  const { clerkId, email, name } = schema.parse(req.body);

  const user = await prisma.user.upsert({
    where: { clerkId },
    update: { email, name },
    create: { clerkId, email, name },
  });

  logger.info('User synced', { userId: user.id });
  res.json({ userId: user.id });
});

// GET /api/v1/auth/me — get current user + org context
router.get('/me', requireAuth, async (req: AuthenticatedRequest, res: Response) => {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.userId } });
  const membership = await prisma.teamMember.findFirst({
    where: { userId: user.id, status: 'ACTIVE' },
    include: {
      organisation: {
        select: {
          id: true, name: true, slug: true, plan: true,
          market: true, useCase: true, inspectionCount: true,
        },
      },
    },
  });

  res.json({ user, membership });
});

export default router;
