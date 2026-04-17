import { Employee, PayrollLine, PayrollSlipData, Company } from '../types';

export const DEFAULT_COMPANY: Company = {
  name: "ECOLOGY SMART VISION EQUIPEMENT",
  address: "S/C 04 BP 398 OUAGA 04, Secteur 42 OUAGADOUGOU",
  siret: "N/A",
  ape: "N/A",
  logo: "/logo.png.jpg",
  phone: "(+226) 05 56 25 92",
  email: "direction@svequipement.com",
  rib: "BF148-01001-077355324101-26",
  rccm: "BF-OUA-01-2025-B13-08308",
  ifu: "00272062K",
  regime: "RSI",
  division: "OUAGA VII"
};

export const calculatePayroll = (
  employee: Employee,
  company: Company,
  period: string,
  paymentDate: string,
  extraBonus: number = 0,
  overtimeHours: number = 0,
  overrideSalary?: number
): PayrollSlipData => {
  const finalBaseSalary = overrideSalary !== undefined ? overrideSalary : employee.baseSalary;
  const grossSalary = finalBaseSalary;

  const lines: PayrollLine[] = [
    { label: "Salaire de base", base: finalBaseSalary, amount: finalBaseSalary, type: 'earning' },
  ];

  const netPay = grossSalary;

  return {
    id: Math.random().toString(36).substr(2, 9),
    period,
    paymentDate,
    employee,
    company,
    lines,
    grossSalary,
    netSocialAmount: grossSalary,
    netPayBeforeTax: grossSalary,
    incomeTax: 0,
    netPay,
    totalEmployerCost: grossSalary,
  };
};
