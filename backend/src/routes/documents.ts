import { Router, Response } from 'express';
import { z } from 'zod';
import prisma from '../config/db';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { generateFileKey, generateUploadUrl } from '../services/storage';
import { queueDocExtraction } from '../workers/aiWorker';

const router = Router();
router.use(requireAuth);

// POST /api/v1/documents/upload-url — get a pre-signed S3/R2 URL
router.post('/upload-url', async (req: AuthenticatedRequest, res: Response) => {
  const schema = z.object({
    inspectionId: z.string(),
    docType:      z.enum(['DRIVER_LICENCE','INSURANCE_POLICY','REGISTRATION','OTHER']),
    fileName:     z.string(),
    mimeType:     z.string(),
    fileSizeBytes:z.number(),
  });
  const body = schema.parse(req.body);

  const org = await prisma.organisation.findUniqueOrThrow({ where: { id: req.orgId } });
  const market = org.market as 'US' | 'UK';
  const fileKey = generateFileKey(req.orgId!, 'docs', body.fileName);
  const uploadUrl = await generateUploadUrl(fileKey, body.mimeType, market);

  // Create document record (status: pending processing)
  const doc = await prisma.document.create({
    data: {
      inspectionId: body.inspectionId,
      type: body.docType,
      fileName: body.fileName,
      fileKey,
      mimeType: body.mimeType,
      fileSizeBytes: body.fileSizeBytes,
    },
  });

  res.json({ documentId: doc.id, uploadUrl, fileKey });
});

// POST /api/v1/documents/:id/process — trigger Claude extraction
router.post('/:id/process', async (req: AuthenticatedRequest, res: Response) => {
  const doc = await prisma.document.findUniqueOrThrow({ where: { id: req.params.id } });
  const body = z.object({ ocrText: z.string().min(1) }).parse(req.body);

  // Queue async AI extraction job
  await queueDocExtraction({
    documentId: doc.id,
    inspectionId: doc.inspectionId,
    docType: doc.type as 'DRIVER_LICENCE' | 'INSURANCE_POLICY',
    ocrText: body.ocrText,
  });

  res.json({ message: 'Document queued for Claude extraction', documentId: doc.id });
});

// GET /api/v1/documents/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
  const doc = await prisma.document.findUniqueOrThrow({ where: { id: req.params.id } });
  res.json(doc);
});

export default router;
