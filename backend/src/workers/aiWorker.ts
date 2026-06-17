import { Worker, Queue } from 'bullmq';
import redis from '../config/redis';
import prisma from '../config/db';
import { extractDriverLicence, extractInsurancePolicy, analyseVehiclePhoto } from '../services/claude';
import { logger } from '../config/logger';

export const aiQueue = new Queue('ai-jobs', { connection: redis as any });

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

// ── Queue job helpers ──────────────────────────────────────────
export async function queueDocExtraction(data: DocExtractionJob) {
  return aiQueue.add('doc-extraction', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}

export async function queuePhotoAnalysis(data: PhotoAnalysisJob) {
  return aiQueue.add('photo-analysis', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 3000 },
    removeOnComplete: 100,
    removeOnFail: 50,
  });
}

// ── Worker ─────────────────────────────────────────────────────
const worker = new Worker(
  'ai-jobs',
  async (job) => {
    logger.info('Processing AI job', { name: job.name, id: job.id });

    if (job.name === 'doc-extraction') {
      const { documentId, docType, ocrText } = job.data as DocExtractionJob;
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

    if (job.name === 'photo-analysis') {
      const { photoId, zone, vehicleContext } = job.data as PhotoAnalysisJob;
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
          aiModel: process.env.CLAUDE_MODEL,
          processedAt: new Date(),
        },
      });
      logger.info('Photo analysis complete', { photoId });
    }
  },
  {
    connection: redis as any,
    concurrency: 3,
  }
);

worker.on('completed', (job) => logger.info('AI job completed', { id: job.id, name: job.name }));
worker.on('failed', (job, err) => logger.error('AI job failed', { id: job?.id, name: job?.name, err: err.message }));

export default worker;
