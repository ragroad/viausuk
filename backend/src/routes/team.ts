import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { requireAuth, requireRole, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const members = await prisma.teamMember.findMany({
    where: { organisationId: req.orgId },
    include: { user: { select: { id: true, name: true, email: true, avatarUrl: true } } },
    orderBy: { invitedAt: 'asc' },
  });
  res.json(members);
});

router.post('/invite', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    email: z.string().email(),
    role:  z.enum(['ADMIN','INSPECTOR','VIEWER']).default('INSPECTOR'),
  });
  const { email, role } = schema.parse(req.body);

  // Find or create user by email
  let user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    user = await prisma.user.create({
      data: { clerkId: `pending_${Date.now()}`, email, name: email.split('@')[0] },
    });
  }

  const existing = await prisma.teamMember.findUnique({
    where: { userId_organisationId: { userId: user.id, organisationId: req.orgId! } },
  });
  if (existing) throw new AppError(409, 'User is already a member of this organisation');

  const member = await prisma.teamMember.create({
    data: { userId: user.id, organisationId: req.orgId!, role, status: 'PENDING' },
    include: { user: true },
  });

  // TODO: Send invite email via Intercom / email service
  res.status(201).json(member);
});

router.patch('/:memberId', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  const { role } = z.object({ role: z.enum(['ADMIN','INSPECTOR','VIEWER']) }).parse(req.body);
  const member = await prisma.teamMember.findFirst({
    where: { id: req.params.memberId, organisationId: req.orgId },
  });
  if (!member) throw new AppError(404, 'Member not found');
  const updated = await prisma.teamMember.update({ where: { id: req.params.memberId }, data: { role } });
  res.json(updated);
});

router.delete('/:memberId', requireRole('ADMIN'), async (req: AuthenticatedRequest, res: Response) => {
  const member = await prisma.teamMember.findFirst({
    where: { id: req.params.memberId, organisationId: req.orgId },
  });
  if (!member) throw new AppError(404, 'Member not found');
  await prisma.teamMember.delete({ where: { id: req.params.memberId } });
  res.status(204).send();
});

export default router;
