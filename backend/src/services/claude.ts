import Anthropic from '@anthropic-ai/sdk';
import { env, isAiEnabled } from '../config/env';
import { logger } from '../config/logger';

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

function getClient() {
  return new Anthropic({ apiKey: env.ANTHROPIC_API_KEY || 'prototype-key' });
}

async function callClaude(system: string, user: string, maxTokens = 1024): Promise<any> {
  const response = await getClient().messages.create({
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

function mockDriverLicence() {
  return {
    fullName: 'Alex Morgan',
    dateOfBirth: '1988-04-12',
    licenceNumber: 'D1234567',
    licenceClass: 'C',
    issueDate: '2022-01-15',
    expiryDate: '2028-01-15',
    endorsements: null,
    restrictions: null,
    address: '123 Fleet Street, Austin, TX 78701',
    state: 'TX',
    sex: 'M',
    fraudRisk: 'Low',
    extractionConfidence: 0.92,
  };
}

function mockInsurancePolicy() {
  return {
    carrier: 'Demo Mutual Insurance',
    policyNumber: 'POL-2024-88421',
    insuredName: 'FleetCo Ltd',
    coverageType: 'Commercial Auto',
    bodilyInjuryLimit: '$500,000',
    propertyDamageLimit: '$250,000',
    comprehensiveDeductible: 500,
    collisionDeductible: 750,
    effectiveDate: '2024-01-01',
    expiryDate: '2025-01-01',
    listedVehicles: [{ vin: '1HGCM82633A004352', year: 2021, make: 'Honda', model: 'Accord' }],
    annualPremium: 4200,
    extractionConfidence: 0.89,
  };
}

function mockPhotoAnalysis(zone: string) {
  return {
    zoneName: zone,
    severity: 'Minor',
    panelScore: 82,
    damageFindings: ['Light scuff on bumper', 'Small paint chip near wheel arch'],
    repairEstimateLow: 350,
    repairEstimateHigh: 650,
    structuralDamage: false,
    safetyRisk: false,
    recommendations: ['Touch-up paint recommended', 'Monitor for rust'],
    aiConfidence: 0.87,
  };
}

function mockVinAnalysis(vin: string) {
  return {
    vin: vin.toUpperCase(),
    year: 2021,
    make: 'Honda',
    model: 'Accord',
    trim: 'Sport',
    bodyType: 'Sedan',
    engine: '1.5L Turbo',
    fuelType: 'Gasoline',
    driveType: 'FWD',
    plant: 'Marysville, USA',
    fmcsaStatus: 'Compliant',
    safetyRating: '5-Star',
    openRecalls: 0,
    recallDescriptions: [],
    titleStatus: 'Clean',
    inspectionRecommendations: ['Check brake pads', 'Verify tire tread depth'],
    confidenceScore: 0.91,
  };
}

export async function extractDriverLicence(ocrText: string) {
  logger.info('Extracting driver licence fields', { mode: isAiEnabled ? 'ai' : 'mock' });
  if (!isAiEnabled) return mockDriverLicence();
  try {
    return await callClaude(DL_SYSTEM, `Extract all fields from this driver licence text:\n\n${ocrText}`);
  } catch (err) {
    logger.error('Claude DL extraction failed', { err });
    throw err;
  }
}

export async function extractInsurancePolicy(ocrText: string) {
  logger.info('Extracting insurance policy fields', { mode: isAiEnabled ? 'ai' : 'mock' });
  if (!isAiEnabled) return mockInsurancePolicy();
  try {
    return await callClaude(INS_SYSTEM, `Extract all fields from this insurance policy text:\n\n${ocrText}`);
  } catch (err) {
    logger.error('Claude insurance extraction failed', { err });
    throw err;
  }
}

export async function analyseVehiclePhoto(zone: string, vehicleContext: string) {
  logger.info('Analysing photo zone', { zone, mode: isAiEnabled ? 'ai' : 'mock' });
  if (!isAiEnabled) return mockPhotoAnalysis(zone);
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
  logger.info('Analysing VIN', { vin, mode: isAiEnabled ? 'ai' : 'mock' });
  if (!isAiEnabled) return mockVinAnalysis(vin);
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
