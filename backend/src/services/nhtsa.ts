import { logger } from '../config/logger';

const NHTSA_BASE = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const NHTSA_RECALLS = 'https://api.nhtsa.gov/recalls/recallsByVehicle';

export async function decodeVin(vin: string): Promise<Record<string, string>> {
  const url = `${NHTSA_BASE}/decodevin/${vin.toUpperCase()}?format=json`;
  logger.info('NHTSA VIN decode', { vin });

  const res = await fetch(url);
  if (!res.ok) throw new Error(`NHTSA API error: ${res.status}`);

  const data = await res.json() as any;
  const results: Record<string, string> = {};

  for (const item of (data.Results || [])) {
    if (item.Value && item.Value !== 'null' && item.Value !== 'Not Applicable') {
      results[item.Variable] = item.Value;
    }
  }
  return results;
}

export async function getRecalls(make: string, model: string, year: number): Promise<any[]> {
  const url = `${NHTSA_RECALLS}?make=${encodeURIComponent(make)}&model=${encodeURIComponent(model)}&modelYear=${year}`;
  logger.info('NHTSA recall lookup', { make, model, year });

  const res = await fetch(url);
  if (!res.ok) return [];

  const data = await res.json() as any;
  return data.results || [];
}

export function parseVinDecodeResult(raw: Record<string, string>) {
  return {
    year:         parseInt(raw['Model Year'] || '0'),
    make:         raw['Make'] || '',
    model:        raw['Model'] || '',
    trim:         raw['Trim'] || '',
    bodyType:     raw['Body Class'] || '',
    engine:       raw['Displacement (L)'] ? `${raw['Displacement (L)']}L ${raw['Engine Configuration']}` : '',
    fuelType:     raw['Fuel Type - Primary'] || '',
    driveType:    raw['Drive Type'] || '',
    plant:        raw['Plant City'] ? `${raw['Plant City']}, ${raw['Plant Country']}` : '',
    vin:          raw['VIN'] || '',
    gvwr:         raw['Gross Vehicle Weight Rating From'] || '',
  };
}
