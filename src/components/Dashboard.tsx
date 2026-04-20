import React from 'react';
import { TrendingUp, Users, FileText, CreditCard, ReceiptText, Eye, Trash2 } from 'lucide-react';
import { PayrollSlipData, Decharge } from '../types';

interface DashboardProps {
  history: PayrollSlipData[];
  dechargeHistory: Decharge[];
  onViewSlip: (slip: PayrollSlipData) => void;
  onViewDecharge: (decharge: Decharge) => void;
  onDeleteSlip?: (id: string) => void;
  onDeleteDecharge?: (id: string) => void;
  onReset?: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  history = [], 
  dechargeHistory = [], 
  onViewSlip, 
  onViewDecharge,
  onDeleteSlip,
  onDeleteDecharge,
  onReset
}) => {
  const totalNet = history.reduce((acc, slip) => acc + (slip?.netPay || 0), 0);
  const totalGross = history.reduce((acc, slip) => acc + (slip?.grossSalary || 0), 0);
  const totalCost = history.reduce((acc, slip) => acc + (slip?.totalEmployerCost || 0), 0);

  const stats = [
    { label: 'Masse salariale totale', value: `${totalGross.toLocaleString('fr-FR')} FCFA`, icon: TrendingUp },
    { label: 'Bulletins / Décharges', value: `${(history?.length || 0)} / ${(dechargeHistory?.length || 0)}`, icon: Users },
    { label: 'Coût Total Employeur', value: `${totalCost.toLocaleString('fr-FR')} FCFA`, icon: FileText },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-5 rounded-xl border border-[#e2e8f0] shadow-sm">
            <p className="text-[13px] font-medium text-[#64748b] mb-2">{stat.label}</p>
            <p className="text-[22px] font-bold text-[#1e293b]">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Bulletins History */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 px-6 border-b border-[#e2e8f0] flex justify-between items-center bg-[#fafafa]">
            <h3 className="font-bold text-sm text-[#1e293b] flex items-center gap-2 uppercase tracking-tight">
              <CreditCard size={18} className="text-[#2563eb]" />
              Derniers bulletins
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#ffffff] text-[#64748b] text-[10px] font-bold uppercase tracking-wider border-b border-[#e2e8f0]">
                  <th className="px-6 py-3">Employé</th>
                  <th className="px-6 py-3">Période</th>
                  <th className="px-6 py-3">Net (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-[#64748b] italic text-sm">
                      Aucun bulletin généré.
                    </td>
                  </tr>
                ) : (
                  history.slice(0, 10).map((slip, idx) => (
                    <tr 
                      key={slip.id || `slip-${idx}`} 
                      className="hover:bg-blue-50/50 transition-colors text-sm group"
                    >
                      <td className="px-6 py-4 cursor-pointer" onClick={() => onViewSlip(slip)}>
                        <div className="font-bold text-[#1e293b]">{slip.employee.firstName} {slip.employee.lastName}</div>
                        <div className="text-[10px] text-[#64748b]">{slip.employee.position}</div>
                      </td>
                      <td className="px-6 py-4 text-[#64748b] font-medium cursor-pointer" onClick={() => onViewSlip(slip)}>{slip.period}</td>
                      <td className="px-6 py-4 font-black text-[#1e293b]">
                        <div className="flex items-center justify-between gap-4">
                          <span className="cursor-pointer" onClick={() => onViewSlip(slip)}>{slip.netPay.toLocaleString('fr-FR')}</span>
                          {onDeleteSlip && (
                            <button
                              title="Déplacer vers la corbeille"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Envoyer ce bulletin à la corbeille ?")) {
                                  onDeleteSlip(slip.id || '');
                                }
                              }}
                              className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Decharges History */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 px-6 border-b border-[#e2e8f0] flex justify-between items-center bg-[#fafafa]">
            <h3 className="font-bold text-sm text-[#1e293b] flex items-center gap-2 uppercase tracking-tight">
              <ReceiptText size={18} className="text-[#2563eb]" />
              Dernières décharges
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#ffffff] text-[#64748b] text-[10px] font-bold uppercase tracking-wider border-b border-[#e2e8f0]">
                  <th className="px-6 py-3">Bénéficiaire</th>
                  <th className="px-6 py-3">Date</th>
                  <th className="px-6 py-3">Montant (FCFA)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0]">
                {dechargeHistory.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-[#64748b] italic text-sm">
                      Aucune décharge enregistrée.
                    </td>
                  </tr>
                ) : (
                  dechargeHistory.slice(0, 10).map((dec, idx) => (
                    <tr 
                      key={dec.id || `dec-${idx}`} 
                      className="hover:bg-blue-50/50 transition-colors text-sm group"
                    >
                      <td className="px-6 py-4 cursor-pointer" onClick={() => onViewDecharge(dec)}>
                        <div className="font-bold text-[#1e293b]">{dec.beneficiaryName}</div>
                        <div className="text-[10px] text-[#64748b] truncate max-w-[150px]">{dec.purpose}</div>
                      </td>
                      <td className="px-6 py-4 text-[#64748b] font-medium cursor-pointer" onClick={() => onViewDecharge(dec)}>{new Date(dec.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4 font-black text-[#1e293b]">
                        <div className="flex justify-between items-center gap-4">
                          <span className="cursor-pointer" onClick={() => onViewDecharge(dec)}>{dec.amount.toLocaleString('fr-FR')}</span>
                          {onDeleteDecharge && (
                            <button
                              title="Déplacer vers la corbeille"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (window.confirm("Envoyer cette décharge à la corbeille ?")) {
                                  onDeleteDecharge(dec.id || '');
                                }
                              }}
                              className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {onReset && (
        <div className="pt-10 flex justify-center">
          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 border border-red-100 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold transition-all"
          >
            <Trash2 size={14} />
            Réinitialiser toutes les données locales
          </button>
        </div>
      )}
    </div>
  );
};
