import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { env } from '../config/env';
import { logger } from '../config/logger';

// Cloudflare R2 — S3-compatible, zero egress fees
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: env.R2_SECRET_ACCESS_KEY || '',
  },
});

function getBucket(market: 'US' | 'UK' = 'US'): string {
  return market === 'UK' ? env.R2_BUCKET_UK : env.R2_BUCKET_US;
}

export async function generateUploadUrl(
  key: string,
  contentType: string,
  market: 'US' | 'UK' = 'US'
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: getBucket(market),
    Key: key,
    ContentType: contentType,
  });
  // URL expires in 5 minutes — browser must upload within this window
  return getSignedUrl(r2Client, command, { expiresIn: 300 });
}

export async function generateDownloadUrl(key: string, market: 'US' | 'UK' = 'US'): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: getBucket(market),
    Key: key,
  });
  return getSignedUrl(r2Client, command, { expiresIn: 3600 });
}

export async function deleteFile(key: string, market: 'US' | 'UK' = 'US'): Promise<void> {
  try {
    await r2Client.send(new DeleteObjectCommand({ Bucket: getBucket(market), Key: key }));
    logger.info('File deleted from R2', { key });
  } catch (err) {
    logger.error('R2 delete failed', { err, key });
    throw err;
  }
}

export function buildPublicUrl(key: string): string {
  return `${env.R2_PUBLIC_URL}/${key}`;
}

export function generateFileKey(orgId: string, type: string, filename: string): string {
  const date = new Date().toISOString().slice(0, 10);
  const random = Math.random().toString(36).slice(2, 8);
  return `${orgId}/${type}/${date}/${random}-${filename}`;
}
