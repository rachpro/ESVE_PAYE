import React, { useState } from 'react';
import { Employee, Company } from '../types';
import { calculatePayroll, DEFAULT_COMPANY } from '../lib/calculations';
import { Calculator, UserPlus, Calendar, DollarSign, Plus, Trash2, AlertCircle, CheckCircle2, Activity, Layers } from 'lucide-react';
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
  const [contractType, setContractType] = useState('CDI');
  const [leaveAcquired, setLeaveAcquired] = useState(2.5);
  const [leaveTaken, setLeaveTaken] = useState(0);
  const [leaveBalance, setLeaveBalance] = useState(22.5);
  const [nbCharges, setNbCharges] = useState(1);
  const [netImposable, setNetImposable] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [benefitsInKind, setBenefitsInKind] = useState(0);
  const [ytdGrossSalary, setYtdGrossSalary] = useState(0);
  const [ytdNetImposable, setYtdNetImposable] = useState(0);
  const [ytdEmployeeCharges, setYtdEmployeeCharges] = useState(0);
  const [ytdEmployerCharges, setYtdEmployerCharges] = useState(0);
  const [ytdWorkingHours, setYtdWorkingHours] = useState(0);

  const handleEmployeeChange = (id: string) => {
    setSelectedEmployeeId(id);
    const emp = employees.find(e => e.id === id);
    if (emp) {
      setCustomLines([
        { label: "NB Charges", base: 1, rate: 0, amount: 0, type: 'info' },
        { label: "Salaire de base", base: emp.baseSalary, rate: 100, amount: emp.baseSalary, type: 'earning' },
        { label: "Indemnité de logement", amount: 0, type: 'earning' },
        { label: "Indemnité de transport", amount: 0, type: 'earning' },
        { label: "Indemnité de fonction", amount: 0, type: 'earning' },
        { label: "Retenue Assurances vieillesses (CNSS)", base: 0, rate: 5.5, amount: 0, employerAmount: 0, type: 'deduction', category: 'social' },
        { label: "IUTS (Barème progressif)", rate: 0, amount: 0, type: 'deduction', category: 'tax' },
        { label: "Retenue FSP 1%", rate: 1, amount: 0, type: 'deduction', category: 'tax' }
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
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
      contractType,
      leaveAcquired,
      leaveTaken,
      leaveBalance,
      nbCharges,
      netImposable: netImposable || netPay,
      totalEmployeeCharges: deductions,
      totalEmployerCharges: empCharges,
      overtimeHours,
      benefitsInKind,
      workingHours: employee.workingHours,
      ytdGrossSalary,
      ytdNetImposable,
      ytdEmployeeCharges,
      ytdEmployerCharges,
      ytdWorkingHours,
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
            <label className="text-[10px] font-bold uppercase tracking-wider text-[#64748b]">Solde Congés</label>
            <input type="number" value={leaveBalance ?? 0} onChange={(e) => setLeaveBalance(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] text-sm" />
          </div>
        </div>

        {/* Sage Specific Optional Fields */}
        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100 space-y-6">
          <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-800 flex items-center gap-2">
            <Activity size={14} /> Paramètres optionnels (Modèle Sage)
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[#64748b]">Nombre de Charges</label>
              <input type="number" value={nbCharges} onChange={(e) => setNbCharges(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-blue-100 bg-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[#64748b]">Heures Sup.</label>
              <input type="number" value={overtimeHours} onChange={(e) => setOvertimeHours(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-blue-100 bg-white text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase text-[#64748b]">Avantages en Nature</label>
              <input type="number" value={benefitsInKind} onChange={(e) => setBenefitsInKind(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-blue-100 bg-white text-sm" />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            <label className="text-[10px] font-black uppercase text-blue-800 flex items-center gap-2">
              <Layers size={14} /> Cumuls Annuels (Optionnel)
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#64748b]">Salaire Brut</label>
                <input type="number" value={ytdGrossSalary} onChange={(e) => setYtdGrossSalary(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-blue-100 bg-white text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#64748b]">Net Imposable</label>
                <input type="number" value={ytdNetImposable} onChange={(e) => setYtdNetImposable(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-blue-100 bg-white text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#64748b]">Charges Sal.</label>
                <input type="number" value={ytdEmployeeCharges} onChange={(e) => setYtdEmployeeCharges(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-blue-100 bg-white text-sm" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase text-[#64748b]">Charges Pat.</label>
                <input type="number" value={ytdEmployerCharges} onChange={(e) => setYtdEmployerCharges(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-blue-100 bg-white text-sm" />
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
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border border-blue-50"
            >
              <div className="bg-[#2563eb] p-8 text-white relative">
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
              
              <div className="p-8 space-y-6">
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
                    onClick={() => { setShowConfirm(false); setPendingSlip(null); }}
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
