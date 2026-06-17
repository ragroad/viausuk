import { Request, Response, NextFunction } from 'express';
import { env } from '../config/env';
import { logger } from '../config/logger';
import prisma from '../config/db';

export interface AuthenticatedRequest extends Request {
  userId?: string;
  orgId?:  string;
  userRole?: string;
}

const CLERK_CONFIGURED = !env.CLERK_SECRET_KEY.startsWith('placeholder');

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {

  // ── Prototype mode: Clerk not configured ─────────────────────
  // Attach a demo user so all routes work without real auth
  if (!CLERK_CONFIGURED) {
    const demoOrg = await prisma.organisation.findFirst();
    const demoUser = await prisma.user.findFirst();
    req.userId   = demoUser?.id   || 'demo-user-id';
    req.orgId    = demoOrg?.id    || 'demo-org-id';
    req.userRole = 'ADMIN';
    return next();
  }

  // ── Production mode: real Clerk verification ──────────────────
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing authorization header' });
    return;
  }

  try {
    const { clerkClient } = await import('@clerk/clerk-sdk-node');
    const token = authHeader.split(' ')[1];
    const verifyResult = await clerkClient.verifyToken(token);
    const clerkUserId = verifyResult.sub;

    const user = await prisma.user.findUnique({ where: { clerkId: clerkUserId } });
    if (!user) { res.status(401).json({ error: 'User not found' }); return; }

    const membership = await prisma.teamMember.findFirst({
      where: { userId: user.id, status: 'ACTIVE' },
    });
    if (!membership) { res.status(403).json({ error: 'No active organisation' }); return; }

    req.userId   = user.id;
    req.orgId    = membership.organisationId;
    req.userRole = membership.role;
    next();
  } catch (err) {
    logger.warn('Auth failed', { err });
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.userRole || !roles.includes(req.userRole)) {
      res.status(403).json({ error: `Requires one of: ${roles.join(', ')}` });
      return;
    }
    next();
  };
}
