import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { recordInspectionMeterEvent } from '../services/stripe';

const router = Router();
router.use(requireAuth);

// GET /api/v1/inspections
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
  const { status, type, page = '1', limit = '20' } = req.query as Record<string, string>;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const where: any = { orgId: req.orgId };
  if (status) where.status = status;
  if (type)   where.type   = type;

  const [inspections, total] = await Promise.all([
    prisma.inspection.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { inspector: { select: { id: true, name: true } } },
    }),
    prisma.inspection.count({ where }),
  ]);

  res.json({ inspections, total, page: parseInt(page), limit: parseInt(limit) });
});

// GET /api/v1/inspections/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const inspection = await prisma.inspection.findFirst({
    where: { id: req.params.id, orgId: req.orgId },
    include: {
      inspector:      { select: { id: true, name: true } },
      documents:      true,
      photos:         true,
      checklistItems: { orderBy: { sortOrder: 'asc' } },
      case:           true,
    },
  });
  if (!inspection) throw new AppError(404, 'Inspection not found');
  res.json(inspection);
});

// POST /api/v1/inspections
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    vin:    z.string().optional(),
    plate:  z.string().optional(),
    type:   z.enum(['PRE_PURCHASE','INSURANCE_CLAIM','FLEET_SAFETY','MOT_STYLE']),
    vehicleYear:  z.number().optional(),
    vehicleMake:  z.string().optional(),
    vehicleModel: z.string().optional(),
    notes:  z.string().optional(),
  });
  const data = schema.parse(req.body);

  // Check plan limits
  const org = await prisma.organisation.findUniqueOrThrow({ where: { id: req.orgId } });
  if (org.plan === 'FREE' && org.inspectionCount >= 5) {
    throw new AppError(402, 'Free plan limit reached. Upgrade to continue.', 'PLAN_LIMIT_REACHED');
  }

  const inspection = await prisma.inspection.create({
    data: {
      orgId: req.orgId!,
      inspectorId: req.userId,
      ...data,
      status: 'PENDING',
    },
  });

  // Bump inspection count
  await prisma.organisation.update({
    where: { id: req.orgId },
    data: { inspectionCount: { increment: 1 } },
  });

  res.status(201).json(inspection);
});

// PATCH /api/v1/inspections/:id
router.patch('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    status:       z.enum(['PENDING','IN_PROGRESS','PASSED','FAILED','IN_REVIEW']).optional(),
    overallScore: z.number().min(0).max(100).optional(),
    notes:        z.string().optional(),
    reportUrl:    z.string().url().optional(),
  });
  const data = schema.parse(req.body);

  const existing = await prisma.inspection.findFirst({ where: { id: req.params.id, orgId: req.orgId } });
  if (!existing) throw new AppError(404, 'Inspection not found');

  const updated = await prisma.inspection.update({ where: { id: req.params.id }, data });

  // If just completed, record Stripe meter event for pay-per-use
  if (data.status && ['PASSED','FAILED'].includes(data.status)) {
    await recordInspectionMeterEvent(req.orgId!);
  }

  res.json(updated);
});

// DELETE /api/v1/inspections/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const existing = await prisma.inspection.findFirst({ where: { id: req.params.id, orgId: req.orgId } });
  if (!existing) throw new AppError(404, 'Inspection not found');
  await prisma.inspection.delete({ where: { id: req.params.id } });
  res.status(204).send();
});

export default router;
