import { PrismaClient, Plan, Market, UseCase, InspectionType,
  InspectionStatus, CaseStatus, CasePriority, TeamRole, MemberStatus,
  PhotoZone, DamageSeverity, DocType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create a demo organisation
  const org = await prisma.organisation.upsert({
    where: { slug: 'fleetco-demo' },
    update: {},
    create: {
      name: 'FleetCo Ltd',
      slug: 'fleetco-demo',
      market: Market.US,
      plan: Plan.PRO,
      useCase: UseCase.FLEET_SAFETY,
      fleetSize: '51-200',
      inspectionCount: 284,
    },
  });

  // Create demo users
  const alex = await prisma.user.upsert({
    where: { email: 'alex@fleetco.com' },
    update: {},
    create: {
      clerkId: 'demo_clerk_alex',
      email: 'alex@fleetco.com',
      name: 'Alex Morgan',
    },
  });

  const ravi = await prisma.user.upsert({
    where: { email: 'ravi@fleetco.com' },
    update: {},
    create: {
      clerkId: 'demo_clerk_ravi',
      email: 'ravi@fleetco.com',
      name: 'Ravi Patel',
    },
  });

  const sarah = await prisma.user.upsert({
    where: { email: 'sarah@fleetco.com' },
    update: {},
    create: {
      clerkId: 'demo_clerk_sarah',
      email: 'sarah@fleetco.com',
      name: 'Sarah Khan',
    },
  });

  // Team memberships
  await prisma.teamMember.upsert({
    where: { userId_organisationId: { userId: alex.id, organisationId: org.id } },
    update: {},
    create: { userId: alex.id, organisationId: org.id, role: TeamRole.ADMIN, status: MemberStatus.ACTIVE },
  });
  await prisma.teamMember.upsert({
    where: { userId_organisationId: { userId: ravi.id, organisationId: org.id } },
    update: {},
    create: { userId: ravi.id, organisationId: org.id, role: TeamRole.INSPECTOR, status: MemberStatus.ACTIVE },
  });
  await prisma.teamMember.upsert({
    where: { userId_organisationId: { userId: sarah.id, organisationId: org.id } },
    update: {},
    create: { userId: sarah.id, organisationId: org.id, role: TeamRole.INSPECTOR, status: MemberStatus.ACTIVE },
  });

  // Demo inspections
  const inspData = [
    { vin: '1HGBH41JXMN109186', make: 'Honda',   model: 'Civic',   year: 2022, type: InspectionType.PRE_PURCHASE,    status: InspectionStatus.PASSED,    score: 88, inspector: ravi.id },
    { vin: '2T1BURHE0JC055652', make: 'Toyota',   model: 'Corolla', year: 2021, type: InspectionType.INSURANCE_CLAIM, status: InspectionStatus.FAILED,    score: 52, inspector: sarah.id },
    { vin: '3VWFE21C04M000001', make: 'Volkswagen',model: 'Golf',   year: 2023, type: InspectionType.FLEET_SAFETY,    status: InspectionStatus.IN_REVIEW, score: 71, inspector: alex.id },
    { vin: '5YJSA1E26MF436610', make: 'Tesla',    model: 'Model S', year: 2021, type: InspectionType.PRE_PURCHASE,    status: InspectionStatus.PASSED,    score: 92, inspector: ravi.id },
    { vin: 'WBA3A5C51CF256651', make: 'BMW',      model: '3 Series',year: 2020, type: InspectionType.INSURANCE_CLAIM, status: InspectionStatus.PASSED,    score: 84, inspector: sarah.id },
  ];

  for (const d of inspData) {
    await prisma.inspection.create({
      data: {
        orgId: org.id,
        inspectorId: d.inspector,
        vin: d.vin,
        vehicleMake: d.make,
        vehicleModel: d.model,
        vehicleYear: d.year,
        type: d.type,
        status: d.status,
        overallScore: d.score,
      },
    });
  }

  console.log('✅ Seed complete');
  console.log('   Organisation: FleetCo Ltd (slug: fleetco-demo)');
  console.log('   Users: Alex Morgan, Ravi Patel, Sarah Khan');
  console.log(`   Inspections: ${inspData.length} records`);
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
