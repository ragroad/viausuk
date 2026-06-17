import { Worker, Queue } from 'bullmq';
import redis from '../config/redis';
import { isRedisEnabled } from '../config/env';
import prisma from '../config/db';
import { extractDriverLicence, extractInsurancePolicy, analyseVehiclePhoto } from '../services/claude';
import { logger } from '../config/logger';

export const aiQueue = isRedisEnabled && redis
  ? new Queue('ai-jobs', { connection: redis as any })
  : null;

// ── Job types ──────────────────────────────────────────────────
interface DocExtractionJob {
  documentId: string;
  inspectionId: string;
  docType: 'DRIVER_LICENCE' | 'INSURANCE_POLICY';
  ocrText: string;
}

interface PhotoAnalysisJob {
  photoId: string;
  inspectionId: string;
  zone: string;
  vehicleContext: string;
}

async function processDocExtraction(data: DocExtractionJob) {
  const { documentId, docType, ocrText } = data;
  let extractedData: any;

  if (docType === 'DRIVER_LICENCE') {
    extractedData = await extractDriverLicence(ocrText);
  } else {
    extractedData = await extractInsurancePolicy(ocrText);
  }

  await prisma.document.update({
    where: { id: documentId },
    data: {
      extractedData,
      extractionConfidence: extractedData.extractionConfidence,
      fraudRiskScore: docType === 'DRIVER_LICENCE'
        ? (extractedData.fraudRisk === 'Low' ? 0.1 : extractedData.fraudRisk === 'Medium' ? 0.5 : 0.9)
        : null,
      processedAt: new Date(),
    },
  });
  logger.info('Doc extraction complete', { documentId });
}

async function processPhotoAnalysis(data: PhotoAnalysisJob) {
  const { photoId, zone, vehicleContext } = data;
  const analysis = await analyseVehiclePhoto(zone, vehicleContext);

  await prisma.photo.update({
    where: { id: photoId },
    data: {
      severity: analysis.severity?.toUpperCase() as any || 'NONE',
      panelScore: analysis.panelScore,
      damageFindings: analysis.damageFindings,
      repairEstLow: analysis.repairEstimateLow,
      repairEstHigh: analysis.repairEstimateHigh,
      structuralDmg: analysis.structuralDamage,
      safetyRisk: analysis.safetyRisk,
      aiConfidence: analysis.aiConfidence,
      aiModel: isRedisEnabled ? process.env.CLAUDE_MODEL : 'prototype-mock',
      processedAt: new Date(),
    },
  });
  logger.info('Photo analysis complete', { photoId });
}

// ── Queue job helpers ──────────────────────────────────────────
export async function queueDocExtraction(data: DocExtractionJob) {
  if (!aiQueue) {
    await processDocExtraction(data);
    return;
  }
  return aiQueue.add('doc-extraction', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}

export async function queuePhotoAnalysis(data: PhotoAnalysisJob) {
  if (!aiQueue) {
    await processPhotoAnalysis(data);
    return;
  }
  return aiQueue.add('photo-analysis', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}

// ── Worker (Redis only) ────────────────────────────────────────
const worker = isRedisEnabled && redis
  ? new Worker(
      'ai-jobs',
      async (job) => {
        logger.info('Processing AI job', { name: job.name, id: job.id });

        if (job.name === 'doc-extraction') {
          await processDocExtraction(job.data as DocExtractionJob);
        }

        if (job.name === 'photo-analysis') {
          await processPhotoAnalysis(job.data as PhotoAnalysisJob);
        }
      },
      {
        connection: redis as any,
        concurrency: 3,
      }
    )
  : null;

if (worker) {
  worker.on('completed', (job) => logger.info('AI job completed', { id: job.id, name: job.name }));
  worker.on('failed', (job, err) => logger.error('AI job failed', { id: job?.id, name: job?.name, err: err.message }));
}

export default worker;
