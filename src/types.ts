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
}

export interface PayrollLine {
  label: string;
  base?: number;
  rate?: number;
  amount: number;
  type: 'earning' | 'deduction' | 'info';
  category?: 'social' | 'tax' | 'other';
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

export interface PayrollSlipData {
  id: string;
  period: string;
  paymentDate: string;
  employee: Employee;
  company: Company;
  lines: PayrollLine[];
  grossSalary: number;
  netSocialAmount: number;
  netPayBeforeTax: number;
  incomeTax: number;
  netPay: number;
  totalEmployerCost: number;
}
