import React, { useState } from 'react';
import { Employee, Company } from '../types';
import { calculatePayroll, DEFAULT_COMPANY } from '../lib/calculations';
import { Calculator, UserPlus, Calendar, DollarSign } from 'lucide-react';

interface PayrollFormProps {
  employees: Employee[];
  company: Company;
  onGenerate: (data: any) => void;
}

export const PayrollForm: React.FC<PayrollFormProps> = ({ employees, company, onGenerate }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  });
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customSalary, setCustomSalary] = useState<number | undefined>(undefined);

  const handleEmployeeChange = (id: string) => {
    setSelectedEmployeeId(id);
    const emp = employees.find(e => e.id === id);
    if (emp) {
      setCustomSalary(emp.baseSalary);
    } else {
      setCustomSalary(undefined);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee) return;

    setIsGenerating(true);
    
    // Simulate a small delay for better UX feedback
    setTimeout(() => {
      const slip = calculatePayroll(
        employee,
        company,
        period,
        paymentDate,
        0,
        0,
        customSalary
      );
      onGenerate(slip);
      setIsGenerating(false);
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
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
              <UserPlus size={14} />
              EMPLOYÉ <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={selectedEmployeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all appearance-none bg-white text-sm"
            >
              <option value="">Choisir un employé...</option>
              {employees.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName} - {emp.position}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
              <Calendar size={14} />
              Période de paie <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              placeholder="Ex: Avril 2024"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
              Date de paiement <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
              <DollarSign size={14} />
              Montant du Salaire <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              value={customSalary || ''}
              onChange={(e) => setCustomSalary(Number(e.target.value))}
              placeholder="Ex: 500000"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm font-bold text-[#1e293b]"
            />
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={!selectedEmployeeId || isGenerating}
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
    </div>
  );
};
