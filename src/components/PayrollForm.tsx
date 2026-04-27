import React, { useState } from 'react';
import { Employee, Company } from '../types';
import { calculatePayroll, DEFAULT_COMPANY } from '../lib/calculations';
import { Calculator, UserPlus, Calendar, DollarSign, Plus, Trash2, AlertCircle, CheckCircle2, Activity, Layers, Search, ChevronDown, X } from 'lucide-react';
import { PayrollSlipData, PayrollLine } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { formatNumeric, parseNumeric } from '../lib/numericUtils';

interface PayrollFormProps {
  employees: Employee[];
  company: Company;
  onGenerate: (data: PayrollSlipData) => void;
}

export const PayrollForm: React.FC<PayrollFormProps> = ({ employees, company, onGenerate }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSlip, setPendingSlip] = useState<PayrollSlipData | null>(null);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  });
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [signatureDate, setSignatureDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [customLines, setCustomLines] = useState<PayrollLine[]>([]);
  const [convention, setConvention] = useState('Commerce Général');
  const [contractType, setContractType] = useState('CDI');
  const [seniority, setSeniority] = useState('');
  const [leaveAcquired, setLeaveAcquired] = useState<number | string>(2.5);
  const [leaveTaken, setLeaveTaken] = useState<number | string>(0);
  const [leaveBalance, setLeaveBalance] = useState<number | string>(22.5);
  const [nbCharges, setNbCharges] = useState<number | string>(0);
  const [baseSalary, setBaseSalary] = useState<number | string>(0);
  const [netImposable, setNetImposable] = useState<number | string>(0);
  const [overtimeHours, setOvertimeHours] = useState<number | string>(0);
  const [workingDays, setWorkingDays] = useState<number | string>(30);
  const [benefitsInKind, setBenefitsInKind] = useState<number | string>(0);

  const [housingAllowance, setHousingAllowance] = useState<number | string>(0);
  const [transportAllowance, setTransportAllowance] = useState<number | string>(0);
  const [functionAllowance, setFunctionAllowance] = useState<number | string>(0);

  // Check for NaN or Infinity in lines
  const calculationError = customLines.find(l => {
    const amt = Number(l.amount);
    const base = Number(l.base);
    const empAmt = l.employerAmount !== undefined ? Number(l.employerAmount) : 0;
    return isNaN(amt) || !isFinite(amt) || isNaN(base) || !isFinite(base) || isNaN(empAmt) || !isFinite(empAmt);
  });

  // Helper for Burkina Faso Payroll Logic (reusable for YTD and month)
  const computePayrollValues = (gross: number, charges: number) => {
    // CNSS is calculated on the gross salary capped at 600,000 FCFA
    const cnssBase = Math.min(gross, 600000);
    
    // Employee deductions
    const employeeCNSS = Math.round(cnssBase * 0.055); // 5.5% (Vieillesse)
    
    // IUTS (Impôt Unique sur les Traitements et Salaires)
    // Étape A : Déterminer le Net Imposable (Base imposable = Brut - CNSS Salariale)
    const taxableBase = Math.max(0, gross - employeeCNSS);
    let tax = 0;
    
    // Étape B : Application du Barème par tranches (Réglementation BF)
    // Arrondi à la centaine inférieure pour la base imposable
    const baseForTax = Math.floor(taxableBase / 100) * 100;
    
    if (baseForTax > 30000) {
      // 30,001 à 50,000 : 12.1%
      tax += (Math.min(baseForTax, 50000) - 30000) * 0.121;
      if (baseForTax > 50000) {
        // 50,001 à 80,000 : 13.9%
        tax += (Math.min(baseForTax, 80000) - 50000) * 0.139;
        if (baseForTax > 80000) {
          // 80,001 à 120,000 : 15.7%
          tax += (Math.min(baseForTax, 120000) - 80000) * 0.157;
          if (baseForTax > 120000) {
            // 120,001 à 170,000 : 18.4%
            tax += (Math.min(baseForTax, 170000) - 120000) * 0.184;
            if (baseForTax > 170000) {
              // 170,001 à 250,000 : 21.7%
              tax += (Math.min(baseForTax, 250000) - 170000) * 0.217;
              if (baseForTax > 250000) {
                // Au-dessus de 250,000 : 25%
                tax += (baseForTax - 250000) * 0.25;
              }
            }
          }
        }
      }
    }

    // Étape C : Tableau des réductions d'impôt (Charges de famille)
    let reductionRate = 0;
    const numCharges = Number(charges);
    if (numCharges === 1) reductionRate = 0.08;
    else if (numCharges === 2) reductionRate = 0.10;
    else if (numCharges === 3) reductionRate = 0.12;
    else if (numCharges >= 4) reductionRate = 0.14;
    
    // Application de la réduction sur le montant brut de l'impôt
    const incomeTax = Math.round(tax * (1 - reductionRate));

    // FSP (Fonds de Soutien Patriotique)
    // Formule : salaire NET (avant FSP) * 1% = MONTANT FSP
    const netBeforeFSP = gross - employeeCNSS - incomeTax;
    const fsp = Math.max(0, Math.round(netBeforeFSP * 0.01));
    
    // Employer charges (according to Sage OHADA logic)
    const employerRisques = Math.round(cnssBase * 0.035); // 3.5%
    const employerVieillesse = Math.round(cnssBase * 0.055); // 5.5%
    const employerFamille = Math.round(cnssBase * 0.07); // 7.0%
    const employerCNSS = employerRisques + employerVieillesse + employerFamille;
    const tpa = Math.round(gross * 0.03); // 3.0% (Taxe Patronale d'Apprentissage)
    
    return {
      taxableBase,
      employeeCNSS,
      employerCNSS,
      incomeTax,
      fsp,
      totalEmployeeCharges: employeeCNSS + incomeTax + fsp,
      totalEmployerCharges: employerCNSS + tpa
    };
  };

  const calculateAutomatics = (lines: PayrollLine[], dependents: number) => {
    // 1st Pass: Simple Earnings and Base salary determination
    let currentBaseSalary = 0;
    const initialProcessed = lines.map(line => {
      const newLine = { ...line };
      if (line.label === "Salaire de Base") currentBaseSalary = Number(line.base) || 0;
      
      // Overtime calculation: (Base Salary / 173.33) * (Rate / 100) * Number
      if (line.label === "Heures Supplémentaires" && currentBaseSalary > 0) {
        const hourlyRate = currentBaseSalary / 173.33;
        const coef = (Number(line.rate) || 125) / 100;
        const hours = Number(line.nombre) || 0;
        newLine.base = Math.round(hourlyRate);
        newLine.amount = Math.round(hourlyRate * coef * hours);
      } else if (line.type === 'earning' && line.nombre !== undefined && line.label !== "NB Charges" && !line.label.toLowerCase().includes('nb') && line.label !== "Heures Supplémentaires") {
        // Pro-rata calculation for earnings based on working days (nombre)
        const base = Number(line.base) || 0;
        const nombre = Number(line.nombre) || 0;
        newLine.amount = Math.round(base * (nombre / 30));
      }
      
      return newLine;
    });

    // 2nd Pass: Handle Bonuses/Indemnities with dynamic methods
    let grossEarnings = 0;
    const withBonuses = initialProcessed.map(line => {
      const newLine = { ...line };
      if (line.type === 'earning') {
        if (line.calculationMethod === 'percent_base') {
          newLine.base = currentBaseSalary;
          const rateValue = Number(line.rate) || 0;
          newLine.amount = Math.round(currentBaseSalary * (rateValue / 100));
        }
        grossEarnings += (Number(newLine.amount) || 0);
      }
      return newLine;
    });

    // 3rd Pass: Handle percent_gross (needs total gross including all previous)
    // To simplify and avoid circularity, we calculate percent_gross on the final gross earnings 
    // of NON-percent_gross lines.
    const finalEarnings = withBonuses.map(line => {
      const newLine = { ...line };
      if (line.type === 'earning' && line.calculationMethod === 'percent_gross') {
        newLine.base = grossEarnings;
        const rateValue = Number(line.rate) || 0;
        newLine.amount = Math.round(grossEarnings * (rateValue / 100));
        // We don't add to grossEarnings here to avoid circularity if multiple exist
        // but for a single pass logic, we might need a 4th pass for social.
      }
      return newLine;
    });

    // Final Gross for Social/Tax calculation
    const totalGross = finalEarnings.filter(l => l.type === 'earning').reduce((acc, l) => acc + (Number(l.amount) || 0), 0);
    const results = computePayrollValues(totalGross, dependents);

    return finalEarnings.map(line => {
      const newLine = { ...line };
      
      if (line.label === "SALAIRE BRUT") {
        newLine.amount = totalGross;
        newLine.base = totalGross;
        return newLine;
      }

      // Identify and apply bases/rates dynamically for specific labels (Social/Tax)
      if (line.label === "Retenue Risques Professionnels") {
        newLine.category = 'social';
        newLine.base = Math.min(totalGross, 600000);
        newLine.rate = 0;
        newLine.employerRate = 3.5;
      } else if (line.label === "Retenue Assurances vieillesses") {
        newLine.category = 'social';
        newLine.base = Math.min(totalGross, 600000);
        newLine.rate = 5.5;
        newLine.employerRate = 5.5;
      } else if (line.label === "Retenue Prestations Familiales") {
        newLine.category = 'social';
        newLine.base = Math.min(totalGross, 600000);
        newLine.rate = 0;
        newLine.employerRate = 7.0;
      } else if (line.label === "TPA") {
        newLine.category = 'tax';
        newLine.base = totalGross;
        newLine.rate = 0;
        newLine.employerRate = 3.0;
      } else if (line.label === "RETENUE FSP 1%") {
        newLine.category = 'tax';
        newLine.base = totalGross - results.employeeCNSS - results.incomeTax;
        newLine.rate = 1.0;
        newLine.amount = results.fsp;
        newLine.employerRate = 0;
      } else if (line.label === "IUTS") {
        newLine.category = 'tax';
        newLine.amount = results.incomeTax;
        newLine.base = results.taxableBase;
        newLine.rate = 0; 
      } else if (line.category === 'social') {
        newLine.base = Math.min(totalGross, 600000);
      }

      // Final calculation for Social/Tax (except IUTS/FSP which are already set)
      if (newLine.base !== undefined && (newLine.type === 'deduction' || newLine.type === 'info') && newLine.label !== "IUTS" && newLine.label !== "RETENUE FSP 1%") {
        if (newLine.rate !== undefined && newLine.rate !== 0) {
          newLine.amount = Math.round(Number(newLine.base) * (Number(newLine.rate) / 100));
        }
        if (newLine.employerRate !== undefined && newLine.employerRate !== 0) {
          newLine.employerAmount = Math.round(Number(newLine.base) * (Number(newLine.employerRate) / 100));
        }
      }

      return newLine;
    });
  };

  const handleWorkingDaysChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = parseNumeric(e.target.value);
    if (s === '' || !isNaN(Number(s))) {
      const val = s === '' ? 0 : Number(s);
      const safeVal = Math.max(0, val);
      setWorkingDays(s === '' ? '' : safeVal);
      
      // Update all earning lines with the new working days count
      // and recalculate amount based on pro-rata (nombre / 30)
      const updatedLines = customLines.map(line => {
        if (line.type === 'earning' && line.label !== "NB Charges" && !line.label.toLowerCase().includes('nb') && line.label !== "Heures Supplémentaires") {
          const base = Number(line.base) || Number(line.amount) || 0;
          const newAmount = Math.round(base * (safeVal / 30));
          return { ...line, nombre: safeVal, amount: newAmount, base: base };
        }
        return line;
      });
      setCustomLines(calculateAutomatics(updatedLines, Number(nbCharges) || 0));
    }
  };

  const handleOvertimeHoursChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = parseNumeric(e.target.value);
    if (s === '' || !isNaN(Number(s))) {
      const val = s === '' ? 0 : Number(s);
      setOvertimeHours(s === '' ? '' : val);
      
      const updatedLines = customLines.map(line => {
        if (line.label === "Heures Supplémentaires") {
          return { ...line, nombre: val };
        }
        return line;
      });
      setCustomLines(calculateAutomatics(updatedLines, Number(nbCharges) || 0));
    }
  };

  const handleBaseSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = parseNumeric(e.target.value);
    if (s === '' || !isNaN(Number(s))) {
      const val = s === '' ? 0 : Number(s);
      setBaseSalary(s === '' ? '' : val);
      
      const updatedLines = customLines.map(line => {
        if (line.label === "Salaire de Base") {
          return { ...line, base: val, amount: val };
        }
        return line;
      });
      const processed = calculateAutomatics(updatedLines, Number(nbCharges) || 0);
      setCustomLines(processed);
    }
  };

  const filteredEmployees = React.useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const query = searchQuery.toLowerCase().trim();
    return employees.filter(emp => 
      emp.firstName.toLowerCase().includes(query) || 
      emp.lastName.toLowerCase().includes(query) || 
      (emp.matricule && emp.matricule.toLowerCase().includes(query)) ||
      (emp.position && emp.position.toLowerCase().includes(query))
    );
  }, [employees, searchQuery]);

  const highlightMatch = (text: string, query: string) => {
    if (!query || !text) return text;
    // Escape special regex characters to avoid crashes
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const parts = text.split(new RegExp(`(${escapedQuery})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) => 
          part.toLowerCase() === query.toLowerCase() ? (
            <span key={i} className="bg-yellow-100 text-yellow-800 font-bold px-0.5 rounded">{part}</span>
          ) : part
        )}
      </span>
    );
  };

  const handleEmployeeSelect = (emp: Employee) => {
    setSelectedEmployeeId(emp.id);
    setSearchQuery(`${emp.firstName} ${emp.lastName}`);
    setIsDropdownOpen(false);
    handleEmployeeChange(emp.id);
  };

  const handleEmployeeChange = (id: string) => {
    setSelectedEmployeeId(id);
    const emp = employees.find(e => e.id === id);
    if (emp) {
      setSeniority(emp.seniority || '');
      setBaseSalary(emp.baseSalary || 0);
      setHousingAllowance(emp.housingAllowance || 0);
      setTransportAllowance(emp.transportAllowance || 0);
      setFunctionAllowance(emp.functionAllowance || 0);
      const charges = emp.familyCharges || 0;
      setNbCharges(charges);
      const initialLines: PayrollLine[] = [
        { label: "NB Charges", nombre: charges, base: charges, rate: 0, amount: 0, type: 'info' },
        { label: "Salaire de Base", nombre: 30, base: emp.baseSalary, rate: 3000, amount: emp.baseSalary, type: 'earning' },
        { label: "Indemnité de logement", nombre: 30, base: emp.housingAllowance || 0, rate: 3000, amount: emp.housingAllowance || 0, type: 'earning' },
        { label: "Indemnité de transport", nombre: 30, base: emp.transportAllowance || 0, rate: 3000, amount: emp.transportAllowance || 0, type: 'earning' },
        { label: "Indemnité de fonction", nombre: 30, base: emp.functionAllowance || 0, amount: emp.functionAllowance || 0, type: 'earning' },
        { label: "Heures Supplémentaires", nombre: 0, base: 0, rate: 125, amount: 0, type: 'earning' },
        { label: "SALAIRE BRUT", base: 0, amount: 0, type: 'info' },
        { label: "Retenue Risques Professionnels", base: 0, rate: 0, amount: 0, employerAmount: 0, type: 'deduction', category: 'social' },
        { label: "Retenue Assurances vieillesses", base: 0, rate: 5.5, amount: 0, employerAmount: 0, type: 'deduction', category: 'social' },
        { label: "Retenue Prestations Familiales", base: 0, rate: 0, amount: 0, employerAmount: 0, type: 'deduction', category: 'social' },
        { label: "IUTS", rate: 0, amount: 0, type: 'deduction', category: 'tax' },
        { label: "TPA", base: 0, rate: 0, employerRate: 3, amount: 0, employerAmount: 0, type: 'deduction', category: 'tax' },
        { label: "RETENUE FSP 1%", base: 0, rate: 1, amount: 0, type: 'deduction', category: 'tax' }
      ];
      setCustomLines(calculateAutomatics(initialLines, charges));
    }
  };

  const addLine = (type: 'earning' | 'deduction') => {
    const newLine: PayrollLine = { label: "Nouveau libellé", amount: 0, type, base: 0, rate: 0, employerAmount: 0 };
    const newLines = [...customLines, newLine];
    setCustomLines(calculateAutomatics(newLines, Number(nbCharges) || 0));
  };

  const removeLine = (index: number) => {
    const newLines = customLines.filter((_, i) => i !== index);
    setCustomLines(calculateAutomatics(newLines, Number(nbCharges) || 0));
  };

  const updateLine = (index: number, field: keyof PayrollLine, value: any) => {
    let newLines = [...customLines];
    
    // Ensure numeric fields don't end up as NaN and handle formatting
    let safeValue = value;
    if (field === 'amount' || field === 'base' || field === 'rate' || field === 'employerAmount' || field === 'nombre' || field === 'employerRate') {
      const parsedValue = typeof value === 'string' ? parseNumeric(value) : value;
      if (parsedValue === '' || !isNaN(Number(parsedValue))) {
        if (parsedValue === '') {
          safeValue = '';
        } else {
          const numVal = Number(parsedValue);
          safeValue = isNaN(numVal) ? 0 : numVal;
        }
      } else {
        return; // Reject invalid input
      }
    }

    newLines[index] = { ...newLines[index], [field]: safeValue };
    
    // Auto calculate if it's base * rate (manual mode)
    if (field === 'base' || field === 'rate' || field === 'employerRate' || field === 'calculationMethod') {
      const line = newLines[index];
      if (line.calculationMethod === 'percent_base' || !line.calculationMethod || line.calculationMethod === 'manual') {
        if (line.base !== undefined) {
          if (line.rate !== undefined && line.rate !== 0) {
            line.amount = Math.round(Number(line.base) * (Number(line.rate) / 100));
          }
          if (line.employerRate !== undefined && line.employerRate !== 0) {
            line.employerAmount = Math.round(Number(line.base) * (Number(line.employerRate) / 100));
          }
        }
      }
    }
    
    // Refresh automatics on value changes
    newLines = calculateAutomatics(newLines, Number(nbCharges) || 0);
    setCustomLines(newLines);
  };

  const handleNbChargesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const s = parseNumeric(e.target.value);
    if (s === '' || !isNaN(Number(s))) {
      const val = s === '' ? 0 : Number(s);
      const safeVal = Math.max(0, val);
      setNbCharges(s === '' ? '' : safeVal);
      
      // Update the "NB Charges" line visually if it exists
      const updatedLines = customLines.map(l => l.label === "NB Charges" ? { ...l, base: safeVal } : l);
      
      setCustomLines(calculateAutomatics(updatedLines, safeVal));
    }
  };

  const handleQuickBaseSalaryEntry = (s: string) => {
    const val = Number(parseNumeric(s));
    const safeVal = isNaN(val) ? 0 : val;
    setBaseSalary(safeVal);
    // Automatically set the "Salaire de Base" line to this value
    const newLines = customLines.map(line => 
      line.label === "Salaire de Base" 
      ? { ...line, base: safeVal, amount: safeVal, calculationMethod: 'manual' as const } 
      : line
    );
    const processed = calculateAutomatics(newLines, Number(nbCharges) || 0);
    setCustomLines(processed);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee) return;

    // Validations
    const newErrors: Record<string, string> = {};
    if (!signatureDate) {
      newErrors.signatureDate = "La date de signature est obligatoire.";
    }
    if (signatureDate && paymentDate && new Date(paymentDate) < new Date(signatureDate)) {
      newErrors.paymentDate = "La date de paiement doit être supérieure ou égale à la date de signature.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setErrors({});

    // We don't set isGenerating here anymore, only in handleConfirm
    // because this stage is just showing the recap modal.
    
    const earnings = customLines.filter(l => l.type === 'earning').reduce((acc, l) => acc + Number(parseNumeric(l.amount || 0)), 0);
    const deductions = customLines.filter(l => l.type === 'deduction').reduce((acc, l) => acc + Number(parseNumeric(l.amount || 0)), 0);
    const empCharges = customLines.reduce((acc, l) => acc + Number(parseNumeric(l.employerAmount || 0)), 0);
    const netPay = earnings - deductions;
    const finalNetImposable = customLines.find(l => l.label === "IUTS")?.base || netPay;

    const slip: PayrollSlipData = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      period,
      paymentDate,
      signatureDate,
      employee: { ...employee, seniority },
      company,
      lines: customLines,
      grossSalary: earnings,
      netSocialAmount: earnings,
      netPayBeforeTax: earnings,
      incomeTax: customLines.filter(l => l.category === 'tax' && l.label === "IUTS").reduce((acc, l) => acc + Number(parseNumeric(l.amount || 0)), 0),
      netPay: netPay,
      totalEmployerCost: earnings + empCharges,
      convention,
      contractType,
      leaveAcquired: Number(parseNumeric(leaveAcquired)) || 0,
      leaveTaken: Number(parseNumeric(leaveTaken)) || 0,
      leaveBalance: Number(parseNumeric(leaveBalance)) || 0,
      nbCharges: Number(parseNumeric(nbCharges)) || 0,
      netImposable: Number(finalNetImposable),
      totalEmployeeCharges: deductions,
      totalEmployerCharges: empCharges,
      overtimeHours: Number(parseNumeric(overtimeHours)) || 0,
      benefitsInKind: Number(parseNumeric(benefitsInKind)) || 0,
      workingHours: employee.workingHours,
    };
    
    setPendingSlip(slip);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (!pendingSlip) return;
    setIsGenerating(true);

    // Use a try-catch to ensure we reset state even if onGenerate fails
    setTimeout(() => {
      try {
        onGenerate(pendingSlip);
        // If onGenerate succeeded, it usually changes the tab at the parent level,
        // but we still want to clean up local state just in case.
        setPendingSlip(null);
        setShowConfirm(false);
      } catch (error) {
        console.error("Erreur lors de la génération:", error);
        alert("Une erreur est survenue lors de la génération du bulletin. Veuillez vérifier les données et réessayer.");
      } finally {
        setIsGenerating(false);
      }
    }, 800);
  };

  if (employees.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] p-12 text-center">
        <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus size={32} />
        </div>
        <h3 className="text-lg font-bold text-[#1e293b] mb-2">Aucun employé trouvé</h3>
        <p className="text-[#64748b] mb-6">Vous devez d'abord ajouter des employés dans la section "EMPLOYÉ" avant de pouvoir générer des bulletins.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden">
      <div className="p-6 border-b border-[#e2e8f0] bg-[#fafafa]">
        <h3 className="text-base font-semibold flex items-center gap-2 text-[#1e293b]">
          <Calculator className="text-[#2563eb]" size={18} />
          Générateur de Bulletin
        </h3>
        <p className="text-sm text-[#64748b] mt-1">Saisissez les variables du mois pour automatiser le calcul.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 relative">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
              <UserPlus size={14} />
              EMPLOYÉ <span className="text-red-500">*</span>
            </label>
            <div className="relative group">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94a3b8]">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou matricule..."
                value={searchQuery}
                onFocus={() => setIsDropdownOpen(true)}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setIsDropdownOpen(true);
                  if (!e.target.value) {
                    setSelectedEmployeeId('');
                  }
                }}
                className={`w-full pl-10 pr-10 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all bg-white text-sm ${selectedEmployeeId ? 'border-blue-200 bg-blue-50/10' : ''}`}
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedEmployeeId('');
                      setIsDropdownOpen(false);
                    }}
                    className="p-1 hover:bg-gray-100 rounded-full text-gray-400"
                  >
                    <X size={14} />
                  </button>
                )}
                <ChevronDown 
                  size={16} 
                  className={`text-[#94a3b8] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} 
                />
              </div>

              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-10" 
                      onClick={() => setIsDropdownOpen(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-0 right-0 mt-2 bg-white border border-[#e2e8f0] rounded-xl shadow-xl z-20 max-h-[300px] overflow-y-auto overflow-x-hidden"
                    >
                      {filteredEmployees.length > 0 ? (
                        <div className="p-2">
                          {filteredEmployees.map((emp) => (
                            <button
                              key={emp.id}
                              type="button"
                              onClick={() => handleEmployeeSelect(emp)}
                              className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${
                                selectedEmployeeId === emp.id 
                                  ? 'bg-blue-50 border border-blue-100' 
                                  : 'hover:bg-gray-50 border border-transparent'
                              }`}
                            >
                              <div className="flex flex-col">
                                <span className="text-sm font-bold text-[#1e293b]">
                                  {highlightMatch(`${emp.firstName} ${emp.lastName}`, searchQuery)}
                                </span>
                                <div className="flex items-center gap-3 mt-0.5">
                                  <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono">
                                    {highlightMatch(emp.matricule || 'N/A', searchQuery)}
                                  </span>
                                  <span className="text-[10px] text-[#64748b]">
                                    {highlightMatch(emp.position, searchQuery)}
                                  </span>
                                </div>
                              </div>
                              {selectedEmployeeId === emp.id && (
                                <CheckCircle2 size={16} className="text-blue-600" />
                              )}
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-sm text-[#64748b]">Aucun employé ne correspond à "{searchQuery}"</p>
                        </div>
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
              <Calendar size={14} />
              Période de paie (Optionnel)
            </label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Ex: Avril 2024"
              className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Période</label>
            <input type="text" value={period || ''} onChange={(e) => setPeriod(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Date de paiement</label>
            <input 
              type="date" 
              value={paymentDate || ''} 
              onChange={(e) => {
                setPaymentDate(e.target.value);
                if (errors.paymentDate) setErrors(prev => ({ ...prev, paymentDate: '' }));
              }} 
              className={`w-full px-3 py-2 rounded-lg border text-sm ${errors.paymentDate ? 'border-red-500 bg-red-50 focus:ring-red-200' : 'border-[#e2e8f0]'}`} 
            />
            {errors.paymentDate && <p className="text-[10px] text-red-500 font-bold italic">{errors.paymentDate}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Date de signature bénéficiaire <span className="text-red-500">*</span></label>
            <input 
              type="date" 
              value={signatureDate || ''} 
              onChange={(e) => {
                setSignatureDate(e.target.value);
                if (errors.signatureDate) setErrors(prev => ({ ...prev, signatureDate: '' }));
              }} 
              className={`w-full px-3 py-2 rounded-lg border text-sm ${errors.signatureDate ? 'border-red-500 bg-red-50 focus:ring-red-200' : 'border-[#e2e8f0]'}`} 
            />
            {errors.signatureDate && <p className="text-[10px] text-red-500 font-bold italic">{errors.signatureDate}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Convention collective</label>
            <input type="text" value={convention || ''} onChange={(e) => setConvention(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Type de contrat</label>
            <select 
              value={contractType || ''} 
              onChange={(e) => setContractType(e.target.value)} 
              className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm bg-white"
            >
              <option value="CDI">CDI</option>
              <option value="CDD">CDD</option>
              <option value="Stage">Stage</option>
              <option value="Interim">Interim</option>
              <option value="Freelance">Freelance</option>
              <option value="Autre">Autre</option>
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Ancienneté</label>
            <input type="text" value={seniority || ''} onChange={(e) => setSeniority(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm" placeholder="Ex: 5 ans" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Solde Congés</label>
            <input 
              type="text" 
              inputMode="numeric" 
              value={formatNumeric(leaveBalance)} 
              onChange={(e) => {
                const s = parseNumeric(e.target.value);
                if (s === '' || !isNaN(Number(s))) {
                  setLeaveBalance(s === '' ? '' : Number(s));
                }
              }} 
              className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm" 
            />
          </div>
        </div>

        {/* Sage Specific Optional Fields */}
        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-800 flex items-center gap-2">
            <Activity size={14} /> Paramètres optionnels (Modèle Sage)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[#64748b] flex items-center gap-1">
                Salaire de Base
                <div className="group relative">
                  <AlertCircle size={10} className="text-blue-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-2 bg-gray-800 text-white text-[9px] rounded shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                    Le montant fixe contractuel avant primes et indemnités.
                  </div>
                </div>
              </label>
              <input 
                type="text" 
                inputMode="numeric" 
                value={formatNumeric(baseSalary)} 
                onChange={handleBaseSalaryChange} 
                className="w-full px-3 py-2 rounded-lg border border-blue-200 bg-blue-50/20 text-sm font-bold text-blue-900" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[#64748b]">Nombre de Charges</label>
              <input type="text" inputMode="numeric" value={formatNumeric(nbCharges)} onChange={handleNbChargesChange} className="w-full px-3 py-2 rounded-lg border border-blue-100 bg-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[#64748b]">Nombre de Jours</label>
              <input type="text" inputMode="decimal" value={formatNumeric(workingDays)} onChange={handleWorkingDaysChange} className="w-full px-3 py-2 rounded-lg border border-blue-100 bg-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[#64748b]">Heures Sup.</label>
              <input 
                type="text" 
                inputMode="decimal" 
                value={formatNumeric(overtimeHours)} 
                onChange={handleOvertimeHoursChange} 
                className="w-full px-3 py-2 rounded-lg border border-blue-100 bg-white text-sm" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[#64748b]">Avantages en Nature</label>
              <input 
                type="text" 
                inputMode="numeric" 
                value={formatNumeric(benefitsInKind)} 
                onChange={(e) => {
                  const s = parseNumeric(e.target.value);
                  if (s === '' || !isNaN(Number(s))) {
                    const val = s === '' ? 0 : Number(s);
                    setBenefitsInKind(s === '' ? '' : val);
                    setCustomLines(calculateAutomatics([...customLines], Number(nbCharges) || 0));
                  }
                }} 
                className="w-full px-3 py-2 rounded-lg border border-blue-100 bg-white text-sm" 
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-orange-600">I. Logement</label>
              <input 
                type="text" 
                inputMode="numeric" 
                value={formatNumeric(housingAllowance)} 
                onChange={(e) => {
                  const s = parseNumeric(e.target.value);
                  if (s === '' || !isNaN(Number(s))) {
                    const val = s === '' ? 0 : Number(s);
                    setHousingAllowance(s === '' ? '' : val);
                    const updated = customLines.map(l => l.label === "Indemnité de logement" ? { ...l, base: val, amount: val } : l);
                    setCustomLines(calculateAutomatics(updated, Number(nbCharges) || 0));
                  }
                }} 
                className="w-full px-3 py-2 rounded-lg border border-orange-100 bg-white text-sm font-bold text-orange-900" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-orange-600">I. Transport</label>
              <input 
                type="text" 
                inputMode="numeric" 
                value={formatNumeric(transportAllowance)} 
                onChange={(e) => {
                  const s = parseNumeric(e.target.value);
                  if (s === '' || !isNaN(Number(s))) {
                    const val = s === '' ? 0 : Number(s);
                    setTransportAllowance(s === '' ? '' : val);
                    const updated = customLines.map(l => l.label === "Indemnité de transport" ? { ...l, base: val, amount: val } : l);
                    setCustomLines(calculateAutomatics(updated, Number(nbCharges) || 0));
                  }
                }} 
                className="w-full px-3 py-2 rounded-lg border border-orange-100 bg-white text-sm font-bold text-orange-900" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-orange-600">I. Fonction</label>
              <input 
                type="text" 
                inputMode="numeric" 
                value={formatNumeric(functionAllowance)} 
                onChange={(e) => {
                  const s = parseNumeric(e.target.value);
                  if (s === '' || !isNaN(Number(s))) {
                    const val = s === '' ? 0 : Number(s);
                    setFunctionAllowance(s === '' ? '' : val);
                    const updated = customLines.map(l => l.label === "Indemnité de fonction" ? { ...l, base: val, amount: val } : l);
                    setCustomLines(calculateAutomatics(updated, Number(nbCharges) || 0));
                  }
                }} 
                className="w-full px-3 py-2 rounded-lg border border-orange-100 bg-white text-sm font-bold text-orange-900" 
              />
            </div>
          </div>

            <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl border-2 border-blue-200 shadow-sm mb-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-blue-800 flex items-center gap-2">
                  <Calculator size={14} /> Saisie Rapide du Salaire de Base
                </label>
                <p className="text-[10px] text-blue-600/70 font-medium italic">Ce montant mettra à jour la rubrique de base et recalculera les indemnités liées.</p>
              </div>
              <div className="w-48">
                <input 
                  type="text" 
                  inputMode="numeric"
                  placeholder="Ex: 150 000"
                  className="w-full px-4 py-2.5 rounded-lg border-2 border-blue-100 bg-blue-50/30 text-blue-900 font-bold outline-none focus:border-blue-400 text-lg tabular-nums"
                  onChange={(e) => {
                    const s = parseNumeric(e.target.value);
                    if (s === '' || !isNaN(Number(s))) {
                      handleQuickBaseSalaryEntry(e.target.value);
                    }
                  }}
                  value={formatNumeric(baseSalary)}
                />
              </div>
            </div>

            <div className="flex justify-between items-center bg-green-50 p-4 rounded-xl border-2 border-green-200 shadow-sm mb-4">
              <div className="space-y-1">
                <label className="text-[11px] font-black uppercase text-green-800 flex items-center gap-2">
                  <DollarSign size={14} /> Total Salaire Brut (Mois en cours)
                </label>
                <p className="text-[10px] text-green-600/70 font-medium italic">Somme de toutes les rubriques de gain (Base + Primes + Indemnités)</p>
              </div>
              <div className="w-48 text-right px-4 py-2.5 bg-green-100/50 rounded-lg border-2 border-green-100">
                <span className="text-green-900 font-black text-xl tabular-nums">
                  {customLines.filter(l => l.type === 'earning').reduce((acc, l) => acc + (Number(l.amount) || 0), 0).toLocaleString('fr-FR')}
                </span>
                <span className="text-green-700 text-xs font-bold ml-1">FCFA</span>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-[#1e293b]">Détails des Rubriques</h4>
            <div className="flex gap-2">
              <button type="button" onClick={() => addLine('earning')} className="text-[10px] bg-green-50 text-green-700 px-2 py-1 rounded border border-green-100 font-bold hover:bg-green-100 flex items-center gap-1">
                <Plus size={10} /> Gain
              </button>
              <button type="button" onClick={() => addLine('deduction')} className="text-[10px] bg-red-50 text-red-700 px-2 py-1 rounded border border-red-100 font-bold hover:bg-red-100 flex items-center gap-1">
                <Plus size={10} /> Retenue
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[#64748b] font-bold border-b text-[9px]">
                  <th className="pb-2">Libellé / Mode / Cat.</th>
                  <th className="pb-2 w-10 text-right">Nb</th>
                  <th className="pb-2 w-16 text-right">Base</th>
                  <th className="pb-2 w-12 text-right">Sal.%</th>
                  <th className="pb-2 w-18 text-right">Montant</th>
                  <th className="pb-2 w-12 text-right">Pat.%</th>
                  <th className="pb-2 w-18 text-right">Charge</th>
                  <th className="pb-2 w-6"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customLines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-2 pr-2">
                      <div className="flex flex-col gap-1">
                        <input type="text" value={line.label} onChange={(e) => updateLine(idx, 'label', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0 font-medium text-xs" />
                        {line.type === 'earning' && (
                          <div className="flex gap-1">
                            <select 
                              value={line.calculationMethod || 'manual'} 
                              onChange={(e) => updateLine(idx, 'calculationMethod', e.target.value)}
                              className="text-[8px] bg-blue-50 border-none rounded px-1 py-0 h-4 text-blue-700 outline-none"
                            >
                              <option value="manual">Fixe / Manuel</option>
                              <option value="percent_base">% Base</option>
                              <option value="percent_gross">% Brut</option>
                            </select>
                            <select 
                              value={line.subCategory || 'other'} 
                              onChange={(e) => updateLine(idx, 'subCategory', e.target.value)}
                              className="text-[8px] bg-green-50 border-none rounded px-1 py-0 h-4 text-green-700 outline-none"
                            >
                              <option value="other">Autre</option>
                              <option value="prime">Prime</option>
                              <option value="indemnity">Indemnité</option>
                            </select>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-2 pr-1">
                      <input type="text" inputMode="numeric" value={formatNumeric(line.nombre || '')} onChange={(e) => updateLine(idx, 'nombre', e.target.value)} className="w-full bg-white border border-gray-100 rounded px-1 py-0.5 text-right text-[10px]" />
                    </td>
                    <td className="py-2 pr-1">
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={formatNumeric(line.base || '')} 
                        readOnly={line.calculationMethod === 'percent_base' || line.calculationMethod === 'percent_gross'}
                        onChange={(e) => updateLine(idx, 'base', e.target.value)} 
                        className={`w-full border border-gray-100 rounded px-1 py-0.5 text-right text-[10px] ${line.calculationMethod && line.calculationMethod !== 'manual' ? 'bg-gray-50 text-gray-400' : 'bg-white'}`} 
                      />
                    </td>
                    <td className="py-2 pr-1">
                      <input type="text" inputMode="numeric" value={formatNumeric(line.rate || '')} onChange={(e) => updateLine(idx, 'rate', e.target.value)} className="w-full bg-white border border-gray-100 rounded px-1 py-0.5 text-right text-[10px]" />
                    </td>
                    <td className="py-2 pr-1">
                      <input 
                        type="text" 
                        inputMode="numeric"
                        value={formatNumeric(line.amount || '')} 
                        readOnly={line.calculationMethod === 'percent_base' || line.calculationMethod === 'percent_gross'}
                        onChange={(e) => updateLine(idx, 'amount', e.target.value)} 
                        className={`w-full border border-gray-100 rounded px-1 py-0.5 text-right font-bold text-[10px] ${line.calculationMethod && line.calculationMethod !== 'manual' ? 'bg-gray-50' : 'bg-white'} ${line.type === 'deduction' ? 'text-red-600' : 'text-green-600'}`} 
                      />
                    </td>
                    <td className="py-2 pr-1">
                      <input type="text" inputMode="numeric" value={formatNumeric(line.employerRate || '')} onChange={(e) => updateLine(idx, 'employerRate', e.target.value)} className="w-full bg-white border border-gray-100 rounded px-1 py-0.5 text-right text-[10px]" />
                    </td>
                    <td className="py-2 pr-1">
                      <input type="text" inputMode="numeric" value={formatNumeric(line.employerAmount || '')} onChange={(e) => updateLine(idx, 'employerAmount', e.target.value)} className="w-full bg-white border border-gray-100 rounded px-1 py-0.5 text-right font-bold text-[10px] text-blue-600" />
                    </td>
                    <td className="py-2">
                      <button type="button" onClick={() => removeLine(idx)} className="text-red-300 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-2 pt-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
            Date de paiement (Optionnel)
          </label>
          <input
            type="date"
            value={paymentDate || ''}
            onChange={(e) => setPaymentDate(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
          />
        </div>

        {/* Totals Summary Card - Real Time Feedback */}
        {selectedEmployeeId && !calculationError && (
          <div className="bg-[#1e293b] p-6 rounded-2xl text-white shadow-xl shadow-blue-900/10 relative overflow-hidden group">
            <div className="absolute top-2 right-4 flex items-center gap-1.5 opacity-40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              <span className="text-[8px] font-black uppercase tracking-widest text-green-400">Calcul en temps réel</span>
            </div>
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
              <Calculator size={100} />
            </div>
            <div className="relative z-10 grid grid-cols-1 sm:grid-cols-4 gap-6 divide-y sm:divide-y-0 sm:divide-x divide-gray-700/50">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1 flex items-center gap-1">
                  Salaire Brut
                </span>
                <span className="text-lg font-black tabular-nums">{customLines.filter(l => l.type === 'earning').reduce((acc, l) => acc + (Number(l.amount) || 0), 0).toLocaleString('fr-FR')} <span className="text-[10px] opacity-50">FCFA</span></span>
              </div>
              <div className="flex flex-col sm:pl-6 pt-4 sm:pt-0">
                <span className="text-[10px] font-black text-red-400 uppercase tracking-[0.2em] mb-1">Retenues Sal.</span>
                <span className="text-lg font-black tabular-nums text-red-200">{customLines.filter(l => l.type === 'deduction').reduce((acc, l) => acc + (Number(l.amount) || 0), 0).toLocaleString('fr-FR')} <span className="text-[10px] opacity-50">FCFA</span></span>
              </div>
              <div className="flex flex-col sm:pl-6 pt-4 sm:pt-0">
                <span className="text-[10px] font-black text-blue-300 uppercase tracking-[0.2em] mb-1">Charges Pat.</span>
                <span className="text-lg font-black tabular-nums text-blue-100">{customLines.reduce((acc, l) => acc + (Number(l.employerAmount) || 0), 0).toLocaleString('fr-FR')} <span className="text-[10px] opacity-50">FCFA</span></span>
              </div>
              <div className="flex flex-col sm:pl-6 pt-4 sm:pt-0 bg-blue-500/10 -m-6 p-6 sm:bg-transparent sm:m-0 sm:p-0">
                <span className="text-[10px] font-black text-yellow-400 uppercase tracking-[0.2em] mb-1">Net à Payer</span>
                <span className="text-xl font-black tabular-nums text-blue-50 animate-pulse">
                  {(customLines.filter(l => l.type === 'earning').reduce((acc, l) => acc + (Number(l.amount) || 0), 0) - 
                    customLines.filter(l => l.type === 'deduction').reduce((acc, l) => acc + (Number(l.amount) || 0), 0)
                  ).toLocaleString('fr-FR')} 
                  <span className="text-[10px] opacity-50 ml-1">FCFA</span>
                </span>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
          </div>
        )}

        {/* Error Alert for Calculation Integrity */}
        {calculationError && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border-2 border-red-200 p-4 rounded-xl flex items-start gap-4 mb-4"
          >
            <div className="bg-red-100 p-2 rounded-lg text-red-600">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-red-800 font-bold text-sm">Erreur de Calcul Détectée</p>
              <p className="text-red-600 text-[11px] font-medium leading-relaxed mt-1">
                Une valeur invalide (NaN ou Infini) a été détectée dans la rubrique : <strong>"{calculationError.label}"</strong>. 
                <br/>Vérifiez vos taux ou vos sommes de base pour corriger cette erreur avant de continuer.
              </p>
            </div>
          </motion.div>
        )}

        <div className="pt-4">
          <button
            type="submit"
            disabled={!selectedEmployeeId || isGenerating || !!calculationError}
            className="w-full bg-[#2563eb] text-white py-3 rounded-lg font-semibold text-sm shadow-sm hover:opacity-90 transition-all active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isGenerating ? (
              <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <Calculator size={18} />
            )}
            {isGenerating ? 'Génération en cours...' : 'Calculer et Générer le Bulletin'}
          </button>
        </div>
      </form>

      <AnimatePresence>
        {showConfirm && pendingSlip && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-blue-50 flex flex-col max-h-[90vh]"
            >
              <div className="bg-[#2563eb] p-8 text-white relative shrink-0">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Calculator size={120} />
                </div>
                <div className="relative flex items-center gap-5">
                  <div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md border border-white/30 shadow-inner">
                    <CheckCircle2 size={32} />
                  </div>
                  <div>
                    <h3 className="font-black text-2xl uppercase tracking-tighter">Récapitulatif de Paie</h3>
                    <p className="text-blue-100 text-sm font-medium opacity-90">Vérifiez les montants avant de générer le bulletin final.</p>
                  </div>
                </div>
              </div>
              
              <div className="p-8 space-y-6 overflow-y-auto">
                {/* Employee Header */}
                <div className="flex items-center gap-4 border-b border-gray-100 pb-6">
                  <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center text-xl font-black shadow-inner">
                    {pendingSlip.employee.firstName.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-[#1e293b] text-lg leading-tight uppercase">{pendingSlip.employee.firstName} {pendingSlip.employee.lastName}</h4>
                    <p className="text-[#64748b] text-xs font-bold uppercase tracking-widest mt-0.5">{pendingSlip.employee.position} — <span className="text-blue-600">{pendingSlip.period}</span></p>
                  </div>
                </div>

                {/* Financial Summary Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50/50 rounded-2xl p-4 border border-green-100/50">
                    <p className="text-[10px] font-black text-green-700 uppercase tracking-widest mb-1">Total Gains</p>
                    <p className="text-xl font-black text-green-800">{pendingSlip.grossSalary.toLocaleString('fr-FR')} <span className="text-xs">FCFA</span></p>
                  </div>
                  <div className="bg-red-50/50 rounded-2xl p-4 border border-red-100/50">
                    <p className="text-[10px] font-black text-red-700 uppercase tracking-widest mb-1">Total Retenues</p>
                    <p className="text-xl font-black text-red-800">{(pendingSlip.grossSalary - pendingSlip.netPay).toLocaleString('fr-FR')} <span className="text-xs">FCFA</span></p>
                  </div>
                </div>

                {/* Net Pay Highlight */}
                <div className="bg-[#1e293b] rounded-2xl p-6 text-white shadow-xl shadow-blue-900/10 relative overflow-hidden">
                  <div className="relative z-10 flex justify-between items-center">
                    <div>
                      <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Montant Net à Payer</p>
                      <h2 className="text-3xl font-black tabular-nums tracking-tighter">{pendingSlip.netPay.toLocaleString('fr-FR')} <span className="text-lg opacity-60">FCFA</span></h2>
                    </div>
                    <div className="bg-blue-600/20 p-3 rounded-xl border border-blue-500/30">
                      <DollarSign size={24} className="text-blue-400" />
                    </div>
                  </div>
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                </div>

                {/* Info Text */}
                <div className="flex items-start gap-3 p-4 bg-amber-50 rounded-xl border border-amber-100/50 text-[11px] text-amber-800 leading-relaxed font-medium">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5 text-amber-500" />
                  <span>Cette action est irréversible. Le bulletin sera instantanément généré et ajouté à l'historique permanent du salarié pour la période de <b>{pendingSlip.period}</b>.</span>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-2">
                  <button
                    onClick={() => { 
                      setShowConfirm(false); 
                      setPendingSlip(null); 
                      setIsGenerating(false); // Reset just in case
                    }}
                    className="flex-1 px-6 py-4 border-2 border-gray-100 rounded-2xl text-sm font-black text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-all uppercase tracking-widest"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 px-6 py-4 bg-[#2563eb] text-white rounded-2xl text-sm font-black hover:bg-blue-700 shadow-[0_10px_25px_-5px_rgba(37,99,235,0.4)] transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                  >
                    <CheckCircle2 size={20} />
                    Valider
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
