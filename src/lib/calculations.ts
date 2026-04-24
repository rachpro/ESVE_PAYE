import { Employee, PayrollLine, PayrollSlipData, Company } from '../types';

export const DEFAULT_COMPANY: Company = {
  name: "ECOLOGY SMART VISION EQUIPEMENT",
  address: "S/C 04 BP 398 OUAGA 04, Secteur 42 OUAGADOUGOU",
  siret: "N/A",
  ape: "N/A",
  logo: "https://img.icons8.com/color/200/excavator.png", // Logo par défaut (Engin de chantier)
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
  const grossSalary = finalBaseSalary + extraBonus; // Simplified for this library

  // Employee deductions (Standard BF logic)
  const employeeCNSS = Math.round(grossSalary * 0.055);
  
  // IUTS (Simplified barème for the standalone generator)
  const taxableBase = Math.max(0, grossSalary - employeeCNSS);
  let tax = 0;
  if (taxableBase > 30000) {
    tax += (Math.min(taxableBase, 50000) - 30000) * 0.121;
    if (taxableBase > 50000) tax += (Math.min(taxableBase, 80000) - 50000) * 0.139;
    if (taxableBase > 80000) tax += (Math.min(taxableBase, 120000) - 80000) * 0.157;
    if (taxableBase > 120000) tax += (Math.min(taxableBase, 170000) - 120000) * 0.184;
    // ... further brackets simplified as in the form
  }
  const incomeTax = Math.round(tax);

  // FSP (1% of Net before FSP)
  const netBeforeFSP = grossSalary - employeeCNSS - incomeTax;
  const fsp = Math.max(0, Math.round(netBeforeFSP * 0.01));

  const totalDeductions = employeeCNSS + incomeTax + fsp;
  const netPay = grossSalary - totalDeductions;

  const lines: PayrollLine[] = [
    { label: "Salaire de base", base: finalBaseSalary, amount: finalBaseSalary, type: 'earning' },
    { label: "Retenue CNSS (5.5%)", base: grossSalary, rate: 5.5, amount: employeeCNSS, type: 'deduction' },
    { label: "IUTS", base: taxableBase, amount: incomeTax, type: 'deduction' },
    { label: "RETENUE FSP 1%", base: netBeforeFSP, rate: 1, amount: fsp, type: 'deduction' },
  ];

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
    incomeTax,
    netPay,
    totalEmployerCost: grossSalary, // Plus employer charges normally
  };
};
