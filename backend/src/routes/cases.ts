import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const router = Router();
router.use(requireAuth);

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { status, priority } = req.query as Record<string, string>;
  const where: any = { orgId: req.orgId };
  if (status)   where.status   = status;
  if (priority) where.priority = priority;

  const cases = await prisma.case.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    include: {
      inspection: {
        select: { id: true, vin: true, vehicleMake: true, vehicleModel: true,
                  vehicleYear: true, type: true, overallScore: true, inspector: { select: { name: true } } },
      },
      timeline: { orderBy: { createdAt: 'asc' } },
    },
  });
  res.json(cases);
});

router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const c = await prisma.case.findFirst({
    where: { id: req.params.id, orgId: req.orgId },
    include: {
      inspection: { include: { documents: true, photos: true, checklistItems: true } },
      timeline: { orderBy: { createdAt: 'asc' } },
    },
  });
  if (!c) throw new AppError(404, 'Case not found');
  res.json(c);
});

router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({ inspectionId: z.string(), priority: z.enum(['NORMAL','URGENT']).default('NORMAL') });
  const { inspectionId, priority } = schema.parse(req.body);

  const inspection = await prisma.inspection.findFirst({ where: { id: inspectionId, orgId: req.orgId } });
  if (!inspection) throw new AppError(404, 'Inspection not found');

  const c = await prisma.case.create({
    data: { orgId: req.orgId!, inspectionId, priority },
  });
  await prisma.caseEvent.create({ data: { caseId: c.id, event: 'Case opened', actor: 'System' } });
  res.status(201).json(c);
});

router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    status:   z.enum(['OPEN','IN_REVIEW','CLOSED','DISPUTED']).optional(),
    priority: z.enum(['NORMAL','URGENT']).optional(),
    notes:    z.string().optional(),
  });
  const data = schema.parse(req.body);
  const existing = await prisma.case.findFirst({ where: { id: req.params.id, orgId: req.orgId } });
  if (!existing) throw new AppError(404, 'Case not found');

  const updated = await prisma.case.update({ where: { id: req.params.id }, data: { ...data, updatedAt: new Date() } });

  if (data.status) {
    await prisma.caseEvent.create({
      data: { caseId: req.params.id, event: `Status changed to ${data.status}`, actor: req.userId! },
    });
  }
  res.json(updated);
});

export default router;
