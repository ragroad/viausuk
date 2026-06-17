// ── Core types matching Prisma schema ─────────────────────────

export type Plan    = 'FREE' | 'PAY_PER_USE' | 'PRO' | 'ENTERPRISE';
export type Market  = 'US' | 'UK';
export type UseCase = 'PRE_PURCHASE' | 'INSURANCE_CLAIM' | 'FLEET_SAFETY' | 'DEALER_TRADE_IN';
export type TeamRole = 'ADMIN' | 'INSPECTOR' | 'VIEWER';

export type InspectionStatus = 'PENDING' | 'IN_PROGRESS' | 'PASSED' | 'FAILED' | 'IN_REVIEW';
export type InspectionType   = 'PRE_PURCHASE' | 'INSURANCE_CLAIM' | 'FLEET_SAFETY' | 'MOT_STYLE';
export type CaseStatus       = 'OPEN' | 'IN_REVIEW' | 'CLOSED' | 'DISPUTED';
export type CasePriority     = 'NORMAL' | 'URGENT';
export type PhotoZone        = 'FRONT' | 'REAR' | 'DRIVER_SIDE' | 'PASSENGER_SIDE' | 'INTERIOR' | 'ENGINE_BAY' | 'FRONT_TYRES' | 'REAR_TYRES';
export type DamageSeverity   = 'NONE' | 'MINOR' | 'MODERATE' | 'SEVERE';
export type DocType          = 'DRIVER_LICENCE' | 'INSURANCE_POLICY' | 'REGISTRATION' | 'OTHER';

export interface Organisation {
  id:               string;
  name:             string;
  slug:             string;
  plan:             Plan;
  market:           Market;
  useCase?:         UseCase;
  fleetSize?:       string;
  inspectionCount:  number;
  currentPeriodEnd?:string;
}

export interface User {
  id:         string;
  clerkId:    string;
  email:      string;
  name:       string;
  avatarUrl?: string;
}

export interface TeamMember {
  id:      string;
  userId:  string;
  role:    TeamRole;
  status:  'ACTIVE' | 'PENDING' | 'INACTIVE';
  user:    Pick<User, 'id' | 'name' | 'email' | 'avatarUrl'>;
  invitedAt:  string;
  lastActiveAt?: string;
}

export interface Inspection {
  id:           string;
  orgId:        string;
  inspectorId?: string;
  inspector?:   Pick<User, 'id' | 'name'>;
  vin?:         string;
  plate?:       string;
  vehicleYear?: number;
  vehicleMake?: string;
  vehicleModel?:string;
  vehicleTrim?: string;
  type:         InspectionType;
  status:       InspectionStatus;
  overallScore?:number;
  reportUrl?:   string;
  notes?:       string;
  recallCount:  number;
  documents?:   Document[];
  photos?:      Photo[];
  checklistItems?: ChecklistItem[];
  createdAt:    string;
  updatedAt:    string;
}

export interface Document {
  id:                 string;
  inspectionId:       string;
  type:               DocType;
  fileName:           string;
  fileUrl?:           string;
  extractedData?:     Record<string, any>;
  extractionConfidence?: number;
  fraudRiskScore?:    number;
  livenessResult?:    string;
  processedAt?:       string;
}

export interface Photo {
  id:              string;
  inspectionId:    string;
  zone:            PhotoZone;
  fileUrl?:        string;
  thumbnailUrl?:   string;
  severity?:       DamageSeverity;
  panelScore?:     number;
  damageFindings?: string[];
  repairEstLow?:   number;
  repairEstHigh?:  number;
  structuralDmg:   boolean;
  safetyRisk:      boolean;
  aiConfidence?:   number;
  processedAt?:    string;
}

export interface ChecklistItem {
  id:          string;
  category:    string;
  item:        string;
  result:      'pass' | 'fail' | 'warn' | 'na';
  notes?:      string;
}

export interface Case {
  id:           string;
  orgId:        string;
  inspectionId: string;
  inspection?:  Inspection;
  status:       CaseStatus;
  priority:     CasePriority;
  reportUrl?:   string;
  timeline?:    CaseEvent[];
  createdAt:    string;
  updatedAt:    string;
}

export interface CaseEvent {
  id:        string;
  event:     string;
  actor:     string;
  createdAt: string;
}

export interface Invoice {
  id:             string;
  stripeInvoiceId:string;
  amount:         number;
  currency:       string;
  status:         string;
  pdfUrl?:        string;
  periodStart:    string;
  periodEnd:      string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  code?:  string;
}

export interface PaginatedResponse<T> {
  data:     T[];
  total:    number;
  page:     number;
  limit:    number;
}
