import Anthropic from '@anthropic-ai/sdk';
import { env } from '../config/env';
import { logger } from '../config/logger';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const DL_SYSTEM = `You are a document extraction API for driver licences in AAMVA format.
Extract fields and return ONLY valid JSON (no markdown, no extra text) with these keys:
fullName, dateOfBirth (YYYY-MM-DD), licenceNumber, licenceClass, issueDate (YYYY-MM-DD),
expiryDate (YYYY-MM-DD), endorsements, restrictions, address, state, sex,
fraudRisk ("Low"|"Medium"|"High"), extractionConfidence (0.0-1.0).
Return null for any field not clearly readable.`;

const INS_SYSTEM = `You are an insurance document extraction API.
Return ONLY valid JSON with keys: carrier, policyNumber, insuredName, coverageType,
bodilyInjuryLimit, propertyDamageLimit, comprehensiveDeductible, collisionDeductible,
effectiveDate (YYYY-MM-DD), expiryDate (YYYY-MM-DD),
listedVehicles (array of {vin, year, make, model}), annualPremium,
extractionConfidence (0.0-1.0). Return null for missing fields.`;

const PHOTO_SYSTEM = `You are a vehicle damage assessment AI for insurance inspections.
Return ONLY valid JSON with: zoneName, severity ("None"|"Minor"|"Moderate"|"Severe"),
panelScore (0-100, 100=perfect), damageFindings (string[]),
repairEstimateLow (USD number), repairEstimateHigh (USD number),
structuralDamage (boolean), safetyRisk (boolean),
recommendations (string[]), aiConfidence (0.0-1.0).`;

async function callClaude(system: string, user: string, maxTokens = 1024): Promise<any> {
  const response = await client.messages.create({
    model: env.CLAUDE_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content: user }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '';
  const clean = text.replace(/```(?:json)?\n?/g, '').trim();
  const match = clean.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Claude returned non-JSON response');
  return JSON.parse(match[0]);
}

export async function extractDriverLicence(ocrText: string) {
  logger.info('Claude: extracting driver licence fields');
  try {
    return await callClaude(DL_SYSTEM, `Extract all fields from this driver licence text:\n\n${ocrText}`);
  } catch (err) {
    logger.error('Claude DL extraction failed', { err });
    throw err;
  }
}

export async function extractInsurancePolicy(ocrText: string) {
  logger.info('Claude: extracting insurance policy fields');
  try {
    return await callClaude(INS_SYSTEM, `Extract all fields from this insurance policy text:\n\n${ocrText}`);
  } catch (err) {
    logger.error('Claude insurance extraction failed', { err });
    throw err;
  }
}

export async function analyseVehiclePhoto(zone: string, vehicleContext: string) {
  logger.info('Claude: analysing photo zone', { zone });
  try {
    return await callClaude(
      PHOTO_SYSTEM,
      `Analyse the "${zone}" zone of a ${vehicleContext}. Return damage assessment JSON.`,
      512
    );
  } catch (err) {
    logger.error('Claude photo analysis failed', { err });
    throw err;
  }
}

export async function analyseVin(vin: string) {
  logger.info('Claude: analysing VIN', { vin });
  const system = `You are a vehicle data intelligence API. Given a VIN, return ONLY valid JSON:
{vin, year, make, model, trim, bodyType, engine, fuelType, driveType, plant,
fmcsaStatus ("Compliant"|"Non-compliant"|"Not applicable"), safetyRating,
openRecalls (number), recallDescriptions (string[]), titleStatus ("Clean"|"Salvage"|"Unknown"),
inspectionRecommendations (string[]), confidenceScore (0.0-1.0)}`;
  try {
    return await callClaude(system, `Analyse VIN: ${vin.toUpperCase()}`);
  } catch (err) {
    logger.error('Claude VIN analysis failed', { err });
    throw err;
  }
}
