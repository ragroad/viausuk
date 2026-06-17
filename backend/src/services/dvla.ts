import { env } from '../config/env';
import { logger } from '../config/logger';

export async function lookupRegistration(plate: string): Promise<any> {
  if (!env.DVLA_API_KEY) {
    logger.warn('DVLA_API_KEY not configured — returning mock data');
    return mockDvlaResponse(plate);
  }

  logger.info('DVLA lookup', { plate });
  const res = await fetch(`${env.DVLA_BASE_URL}/vehicles`, {
    method: 'POST',
    headers: {
      'x-api-key': env.DVLA_API_KEY,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ registrationNumber: plate.toUpperCase() }),
  });

  if (res.status === 404) throw new Error(`Vehicle not found: ${plate}`);
  if (!res.ok) throw new Error(`DVLA API error: ${res.status}`);

  return res.json();
}

function mockDvlaResponse(plate: string) {
  return {
    registrationNumber: plate.toUpperCase(),
    taxStatus: 'Taxed',
    taxDueDate: '2025-03-01',
    motStatus: 'Valid',
    motExpiryDate: '2026-06-30',
    make: 'VAUXHALL',
    yearOfManufacture: 2019,
    engineCapacity: 1598,
    co2Emissions: 128,
    fuelType: 'PETROL',
    markedForExport: false,
    colour: 'SILVER',
    typeApproval: 'M1',
    wheelplan: '2 AXLE RIGID BODY',
  };
}
