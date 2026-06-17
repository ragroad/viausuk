import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { generateFileKey, generateUploadUrl } from '../services/storage';
import { queuePhotoAnalysis } from '../workers/aiWorker';

const router = Router();
router.use(requireAuth);

router.post('/upload-url', async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    inspectionId: z.string(),
    zone:         z.enum(['FRONT','REAR','DRIVER_SIDE','PASSENGER_SIDE','INTERIOR','ENGINE_BAY','FRONT_TYRES','REAR_TYRES']),
    fileName:     z.string(),
    mimeType:     z.string(),
    fileSizeBytes:z.number(),
  });
  const body = schema.parse(req.body);
  const org = await prisma.organisation.findUniqueOrThrow({ where: { id: req.orgId } });
  const market = org.market as 'US' | 'UK';
  const fileKey = generateFileKey(req.orgId!, 'photos', body.fileName);
  const uploadUrl = await generateUploadUrl(fileKey, body.mimeType, market);

  const photo = await prisma.photo.create({
    data: {
      inspectionId: body.inspectionId,
      zone: body.zone,
      fileName: body.fileName,
      fileKey,
      mimeType: body.mimeType,
      fileSizeBytes: body.fileSizeBytes,
    },
  });

  res.json({ photoId: photo.id, uploadUrl, fileKey });
});

router.post('/:id/analyse', async (req: AuthenticatedRequest, res: Response) => {
  const photo = await prisma.photo.findUniqueOrThrow({ where: { id: req.params.id } });
  const inspection = await prisma.inspection.findUniqueOrThrow({ where: { id: photo.inspectionId } });

  const vehicleContext = [inspection.vehicleYear, inspection.vehicleMake, inspection.vehicleModel]
    .filter(Boolean).join(' ') || 'vehicle';

  await queuePhotoAnalysis({
    photoId: photo.id,
    inspectionId: photo.inspectionId,
    zone: photo.zone,
    vehicleContext,
  });

  res.json({ message: 'Photo queued for Claude analysis', photoId: photo.id });
});

router.get('/inspection/:inspectionId', async (req: AuthenticatedRequest, res: Response) => {
  const photos = await prisma.photo.findMany({
    where: { inspectionId: req.params.inspectionId },
    orderBy: { createdAt: 'asc' },
  });
  res.json(photos);
});

export default router;
