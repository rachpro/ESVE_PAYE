import React, { useState } from 'react';
import { Employee, Company } from '../types';
import { calculatePayroll, DEFAULT_COMPANY } from '../lib/calculations';
import { Calculator, UserPlus, Calendar, DollarSign, Plus, Trash2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { PayrollSlipData, PayrollLine } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface PayrollFormProps {
  employees: Employee[];
  company: Company;
  onGenerate: (data: PayrollSlipData) => void;
}

export const PayrollForm: React.FC<PayrollFormProps> = ({ employees, company, onGenerate }) => {
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingSlip, setPendingSlip] = useState<PayrollSlipData | null>(null);
  const [period, setPeriod] = useState(() => {
    const now = new Date();
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return `${months[now.getMonth()]} ${now.getFullYear()}`;
  });
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [customLines, setCustomLines] = useState<PayrollLine[]>([]);
  const [convention, setConvention] = useState('Commerce Général');
  const [leaveAcquired, setLeaveAcquired] = useState(2.5);
  const [leaveTaken, setLeaveTaken] = useState(0);
  const [leaveBalance, setLeaveBalance] = useState(22.5);

  const handleEmployeeChange = (id: string) => {
    setSelectedEmployeeId(id);
    const emp = employees.find(e => e.id === id);
    if (emp) {
      setCustomLines([
        { label: "Salaire de base", base: emp.baseSalary, rate: 1, amount: emp.baseSalary, type: 'earning' },
        { label: "Prime de transport", amount: 0, type: 'earning' },
        { label: "Prime de logement", amount: 0, type: 'earning' },
        { label: "CNSS - Pension vieillesse", base: 0, rate: 5.5, amount: 0, employerAmount: 0, type: 'deduction', category: 'social' },
        { label: "RAMU - Assurance maladie", base: 0, rate: 2.5, amount: 0, employerAmount: 0, type: 'deduction', category: 'social' },
        { label: "Abattement forfaitaire (25%)", rate: 25, amount: 0, type: 'deduction', category: 'tax' },
        { label: "IUTS (15% sur base nette)", rate: 15, amount: 0, type: 'deduction', category: 'tax' }
      ]);
    }
  };

  const addLine = (type: 'earning' | 'deduction') => {
    setCustomLines([...customLines, { label: "Nouveau libellé", amount: 0, type, base: 0, rate: 0, employerAmount: 0 }]);
  };

  const removeLine = (index: number) => {
    setCustomLines(customLines.filter((_, i) => i !== index));
  };

  const updateLine = (index: number, field: keyof PayrollLine, value: any) => {
    const newLines = [...customLines];
    newLines[index] = { ...newLines[index], [field]: value };
    
    // Auto calculate if it's base * rate
    if (field === 'base' || field === 'rate') {
      const line = newLines[index];
      if (line.base !== undefined && line.rate !== undefined && line.rate !== 0) {
        // If rate is entered as percentage (e.g. 5.5), we should use value/100 if it's used as multiplier
        // But let's assume they might enter it directly or as multiplier.
        // In the screenshot, Rate is "5.5 %".
        line.amount = line.base * (line.rate / 100);
      }
    }
    
    setCustomLines(newLines);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const employee = employees.find(e => e.id === selectedEmployeeId);
    if (!employee) return;

    setIsGenerating(true);
    
    const earnings = customLines.filter(l => l.type === 'earning').reduce((acc, l) => acc + l.amount, 0);
    const deductions = customLines.filter(l => l.type === 'deduction').reduce((acc, l) => acc + l.amount, 0);
    const empCharges = customLines.reduce((acc, l) => acc + (l.employerAmount || 0), 0);
    const netPay = earnings - deductions;

    const slip: PayrollSlipData = {
      id: Math.random().toString(36).substr(2, 9),
      period,
      paymentDate,
      employee,
      company,
      lines: customLines,
      grossSalary: earnings,
      netSocialAmount: earnings,
      netPayBeforeTax: earnings,
      incomeTax: customLines.filter(l => l.category === 'tax').reduce((acc, l) => acc + l.amount, 0),
      netPay: netPay,
      totalEmployerCost: earnings + empCharges,
      convention,
      leaveAcquired,
      leaveTaken,
      leaveBalance,
    };
    
    setPendingSlip(slip);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (!pendingSlip) return;
    setIsGenerating(true);
    setShowConfirm(false);

    setTimeout(() => {
      onGenerate(pendingSlip);
      setIsGenerating(false);
      setPendingSlip(null);
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
              value={selectedEmployeeId || ''}
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
            <input type="date" value={paymentDate || ''} onChange={(e) => setPaymentDate(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Convention collective</label>
            <input type="text" value={convention || ''} onChange={(e) => setConvention(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Solde Congés</label>
            <input type="number" value={leaveBalance ?? 0} onChange={(e) => setLeaveBalance(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm" />
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
                <tr className="text-[#64748b] font-bold border-b">
                  <th className="pb-2">Libellé</th>
                  <th className="pb-2 w-24 text-right">Base</th>
                  <th className="pb-2 w-16 text-right">Taux %</th>
                  <th className="pb-2 w-28 text-right">Montant Sal.</th>
                  <th className="pb-2 w-28 text-right">Charge Pat.</th>
                  <th className="pb-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {customLines.map((line, idx) => (
                  <tr key={idx} className="hover:bg-gray-50/50">
                    <td className="py-2 pr-2">
                      <input type="text" value={line.label} onChange={(e) => updateLine(idx, 'label', e.target.value)} className="w-full bg-transparent border-none focus:ring-0 p-0 font-medium" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" value={line.base || ''} onChange={(e) => updateLine(idx, 'base', Number(e.target.value))} className="w-full bg-white border border-gray-100 rounded px-1 py-1 text-right" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" value={line.rate || ''} onChange={(e) => updateLine(idx, 'rate', Number(e.target.value))} className="w-full bg-white border border-gray-100 rounded px-1 py-1 text-right" />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" value={line.amount || ''} onChange={(e) => updateLine(idx, 'amount', Number(e.target.value))} className={`w-full bg-white border border-gray-100 rounded px-1 py-1 text-right font-bold ${line.type === 'deduction' ? 'text-red-600' : 'text-green-600'}`} />
                    </td>
                    <td className="py-2 pr-2">
                      <input type="number" value={line.employerAmount || ''} onChange={(e) => updateLine(idx, 'employerAmount', Number(e.target.value))} className="w-full bg-white border border-gray-100 rounded px-1 py-1 text-right font-bold text-blue-600" />
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

      <AnimatePresence>
        {showConfirm && pendingSlip && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-blue-100"
            >
              <div className="bg-blue-600 p-6 text-white flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-full">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="font-bold text-lg">Vérification Finale</h3>
                  <p className="text-blue-100 text-xs">Veuillez confirmer les informations avant la génération.</p>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-tight">Employé</span>
                    <span className="text-sm font-black text-gray-800">{pendingSlip.employee.firstName} {pendingSlip.employee.lastName}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-tight">Période</span>
                    <span className="text-sm font-black text-gray-800">{pendingSlip.period}</span>
                  </div>
                  <div className="flex justify-between font-black text-lg pt-1">
                    <span className="text-blue-600 uppercase text-xs self-center">Net à Payer</span>
                    <span className="text-[#1e293b]">{pendingSlip.netPay.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100 italic text-[11px] text-blue-800">
                  <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
                  En confirmant, le bulletin sera officiellement enregistré dans l'historique de l'entreprise.
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setShowConfirm(false); setPendingSlip(null); }}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-xl text-sm font-black hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} />
                    Confirmer
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
