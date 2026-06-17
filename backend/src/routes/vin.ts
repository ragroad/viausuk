import { Router, Response } from 'express';
import { z } from 'zod';
import { requireAuth, AuthenticatedRequest } from '../middleware/auth';
import { decodeVin, getRecalls, parseVinDecodeResult } from '../services/nhtsa';
import { lookupRegistration } from '../services/dvla';
import { analyseVin } from '../services/claude';
import { aiRateLimiter } from '../middleware/rateLimiter';

const router = Router();
router.use(requireAuth);

// GET /api/v1/vin/:vin — decode VIN via NHTSA + Claude intelligence
router.get('/:vin', aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const vin = req.params.vin.toUpperCase().trim();
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    res.status(400).json({ error: 'Invalid VIN format — must be 17 alphanumeric characters' });
    return;
  }

  // Fetch NHTSA data
  const [rawNhtsa, claudeIntel] = await Promise.allSettled([
    decodeVin(vin).then(r => parseVinDecodeResult(r)),
    analyseVin(vin),
  ]);

  const nhtsa = rawNhtsa.status === 'fulfilled' ? rawNhtsa.value : null;
  const intel = claudeIntel.status === 'fulfilled' ? claudeIntel.value : null;

  // Fetch recalls if we have make/model/year
  let recalls: any[] = [];
  if (nhtsa?.make && nhtsa?.model && nhtsa?.year) {
    const recallResult = await getRecalls(nhtsa.make, nhtsa.model, nhtsa.year).catch(() => []);
    recalls = recallResult;
  }

  res.json({
    vin,
    nhtsa,
    recalls: recalls.slice(0, 5),
    intelligence: intel,
    sources: {
      nhtsa: rawNhtsa.status === 'fulfilled',
      claude: claudeIntel.status === 'fulfilled',
    },
  });
});

// POST /api/v1/vin/plate — UK plate lookup via DVLA
router.post('/plate', aiRateLimiter, async (req: AuthenticatedRequest, res: Response) => {
  const { plate } = z.object({ plate: z.string().min(2) }).parse(req.body);
  const data = await lookupRegistration(plate);
  res.json(data);
});

export default router;
