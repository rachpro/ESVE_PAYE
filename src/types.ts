export interface TemplateConfig {
  showCategory?: boolean;
  showSeniority?: boolean;
  showContractType?: boolean;
  showSocialSecurity?: boolean;
  showNiveau?: boolean;
  showCoefficient?: boolean;
  showIndice?: boolean;
  showDepartment?: boolean;
  showQualification?: boolean;
  showLeaveInfo?: boolean;
  primaryColor?: string;
  slipFooterText?: string;
}

export interface Company {
  name: string;
  address: string;
  siret: string;
  ape: string;
  logo?: string;
  phone?: string;
  email?: string;
  rib?: string;
  rccm?: string;
  ifu?: string;
  regime?: string;
  division?: string;
  sector?: string;
  cnssEmployer?: string;
  templateConfig?: TemplateConfig;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  address: string;
  residence?: string;
  socialSecurityNumber?: string;
  cnib?: string;
  position: string;
  baseSalary: number;
  matricule?: string;
  hireDate?: string;
  category?: string;
  seniority?: string;
  paymentMode?: string;
  niveau?: string;
  coefficient?: string;
  indice?: string;
  department?: string;
  qualification?: string;
  workingHours?: number;
  email?: string;
  transportAllowance?: number;
  housingAllowance?: number;
  functionAllowance?: number;
  familyCharges?: number;
}

export interface PayrollLine {
  label: string;
  nombre?: number | string;
  base?: number | string;
  rate?: number | string;
  amount: number | string;
  type: 'earning' | 'deduction' | 'info';
  category?: 'social' | 'tax' | 'other';
  employerAmount?: number | string;
  employerRate?: number | string;
  calculationMethod?: 'manual' | 'percent_base' | 'percent_gross';
  subCategory?: 'prime' | 'indemnity' | 'other';
}

export interface Decharge {
  id: string;
  beneficiaryName: string;
  cnib: string;
  cnibDate: string;
  phone: string;
  beneficiaryEmail?: string;
  payerName: string;
  payerAddress: string;
  payerPhone?: string;
  payerEmail?: string;
  amount: number;
  amountInWords: string;
  purpose: string;
  paymentMode: 'Espèces' | 'Chèque' | 'Virement' | 'MobileMoney';
  paymentDate: string;
  location: string;
  date: string;
  additionalNotes?: string;
  signature?: string;
}

export type UserRole = 'admin' | 'editor' | 'viewer';

export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string;
  role: UserRole;
  createdAt?: string;
  lastLogin?: string;
}

export interface PayrollSlipData {
  id: string;
  period: string;
  paymentDate: string;
  signatureDate?: string;
  employee: Employee;
  company: Company;
  lines: PayrollLine[];
  grossSalary: number;
  netSocialAmount: number;
  netPayBeforeTax: number;
  incomeTax: number;
  netPay: number;
  totalEmployerCost: number;
  convention?: string;
  contractType?: string;
  leaveAcquired?: number;
  leaveTaken?: number;
  leaveBalance?: number;
  nbCharges?: number;
  netImposable?: number;
  totalEmployeeCharges?: number;
  totalEmployerCharges?: number;
  overtimeHours?: number;
  overtimeAmount?: number;
  benefitsInKind?: number;
  workingHours?: number;
}
