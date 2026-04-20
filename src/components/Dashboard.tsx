import React, { useState } from 'react';
import { TrendingUp, Users, FileText, CreditCard, ReceiptText, Eye, Trash2, Download, Share2, Link, Mail, Check, X as CloseIcon } from 'lucide-react';
import { PayrollSlipData, Decharge } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface DashboardProps {
  history: PayrollSlipData[];
  dechargeHistory: Decharge[];
  onViewSlip: (slip: PayrollSlipData) => void;
  onViewDecharge: (decharge: Decharge) => void;
  onDeleteSlip?: (id: string) => void;
  onDeleteDecharge?: (id: string) => void;
  onReset?: () => void;
  onDownloadSlip?: (slip: PayrollSlipData) => void;
  onDownloadDecharge?: (decharge: Decharge) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  history = [], 
  dechargeHistory = [], 
  onViewSlip, 
  onViewDecharge,
  onDeleteSlip,
  onDeleteDecharge,
  onReset,
  onDownloadSlip,
  onDownloadDecharge
}) => {
  const [confirmingDelete, setConfirmingDelete] = useState<{id: string, type: 'slip' | 'decharge'} | null>(null);
  const [activeShareMenu, setActiveShareMenu] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyLink = (slip: PayrollSlipData) => {
    const url = window.location.href; // Simplified link
    navigator.clipboard.writeText(url);
    setCopiedId(slip.id || 'copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSendEmail = (slip: PayrollSlipData) => {
    if (!slip.employee.email) {
      alert("L'employé n'a pas d'adresse email enregistrée.");
      return;
    }
    const subject = encodeURIComponent(`Votre Bulletin de Paie - ${slip.period}`);
    const body = encodeURIComponent(`Bonjour ${slip.employee.firstName},\n\nVeuillez trouver ci-joint votre bulletin de paie pour la période de ${slip.period}.\n\nCordialement,\nLa Direction`);
    window.location.href = `mailto:${slip.employee.email}?subject=${subject}&body=${body}`;
  };

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
                      key={`${slip.id}-${idx}`} 
                      className="hover:bg-blue-50/50 transition-colors text-sm group"
                    >
                      <td className="px-6 py-4 cursor-pointer" onClick={() => onViewSlip(slip)}>
                        <div className="font-bold text-[#1e293b]">{slip.employee.firstName} {slip.employee.lastName}</div>
                        <div className="text-[10px] text-[#64748b]">{slip.employee.position}</div>
                      </td>
                      <td className="px-6 py-4 text-[#64748b] font-medium cursor-pointer" onClick={() => onViewSlip(slip)}>{slip.period}</td>
                      <td className="px-6 py-4 font-black text-[#1e293b]">
                        <div className="flex items-center justify-end gap-3">
                          <span className="cursor-pointer mr-auto" onClick={() => onViewSlip(slip)}>{slip.netPay.toLocaleString('fr-FR')}</span>
                          
                          {onDownloadSlip && (
                             <button
                               title="Télécharger PDF"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 onDownloadSlip(slip);
                               }}
                               className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-all"
                             >
                               <Download size={16} />
                             </button>
                          )}

                          <div className="relative">
                            <button
                              title="Partager"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveShareMenu(activeShareMenu === slip.id ? null : (slip.id || null));
                              }}
                              className={`p-1.5 rounded transition-all ${activeShareMenu === slip.id ? 'bg-orange-100 text-orange-600' : 'text-orange-400 hover:text-orange-600 hover:bg-orange-50'}`}
                            >
                              <Share2 size={16} />
                            </button>

                            <AnimatePresence>
                              {activeShareMenu === slip.id && (
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.95, y: -10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: -10 }}
                                  className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-100 z-[50] overflow-hidden"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <div className="p-2 space-y-1">
                                    <button 
                                      onClick={() => handleCopyLink(slip)}
                                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                    >
                                      {copiedId === slip.id ? <Check size={14} className="text-green-500" /> : <Link size={14} className="text-blue-500" />}
                                      {copiedId === slip.id ? 'Lien copié !' : 'Copier le lien'}
                                    </button>
                                    <button 
                                      onClick={() => handleSendEmail(slip)}
                                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-gray-600 hover:bg-gray-50 rounded-lg transition-colors text-left"
                                    >
                                      <Mail size={14} className="text-orange-500" />
                                      Envoyer par email
                                    </button>
                                    <div className="h-px bg-gray-100 my-1"></div>
                                    <button 
                                      onClick={() => setActiveShareMenu(null)}
                                      className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors text-left"
                                    >
                                      <CloseIcon size={14} />
                                      Fermer
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>

                          {onDeleteSlip && (
                            <div className="relative">
                              {confirmingDelete?.id === slip.id && confirmingDelete?.type === 'slip' ? (
                                <div className="absolute right-0 bottom-full mb-2 bg-[#1e293b] text-white p-2 rounded shadow-xl z-10 flex items-center gap-2 whitespace-nowrap text-[10px]">
                                  <span>Confirmer ?</span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteSlip(slip.id || '');
                                      setConfirmingDelete(null);
                                    }}
                                    className="bg-red-500 px-2 py-1 rounded font-bold hover:bg-red-600"
                                  >
                                    OUI
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmingDelete(null);
                                    }}
                                    className="bg-gray-600 px-2 py-1 rounded font-bold hover:bg-gray-500"
                                  >
                                    NON
                                  </button>
                                </div>
                              ) : (
                                <button
                                  title="Déplacer vers la corbeille"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmingDelete({ id: slip.id || '', type: 'slip' });
                                  }}
                                  className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
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
                      key={`${dec.id}-${idx}`} 
                      className="hover:bg-blue-50/50 transition-colors text-sm group"
                    >
                      <td className="px-6 py-4 cursor-pointer" onClick={() => onViewDecharge(dec)}>
                        <div className="font-bold text-[#1e293b]">{dec.beneficiaryName}</div>
                        <div className="text-[10px] text-[#64748b] truncate max-w-[150px]">{dec.purpose}</div>
                      </td>
                      <td className="px-6 py-4 text-[#64748b] font-medium cursor-pointer" onClick={() => onViewDecharge(dec)}>{new Date(dec.date).toLocaleDateString('fr-FR')}</td>
                      <td className="px-6 py-4 font-black text-[#1e293b]">
                        <div className="flex justify-between items-center gap-3">
                          <span className="cursor-pointer mr-auto" onClick={() => onViewDecharge(dec)}>{dec.amount.toLocaleString('fr-FR')}</span>
                          
                          {onDownloadDecharge && (
                             <button
                               title="Télécharger PDF"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 onDownloadDecharge(dec);
                               }}
                               className="p-1.5 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-all"
                             >
                               <Download size={16} />
                             </button>
                          )}

                          {onDeleteDecharge && (
                            <div className="relative">
                               {confirmingDelete?.id === dec.id && confirmingDelete?.type === 'decharge' ? (
                                <div className="absolute right-0 bottom-full mb-2 bg-[#1e293b] text-white p-2 rounded shadow-xl z-10 flex items-center gap-2 whitespace-nowrap text-[10px]">
                                  <span>Confirmer ?</span>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onDeleteDecharge(dec.id || '');
                                      setConfirmingDelete(null);
                                    }}
                                    className="bg-red-500 px-2 py-1 rounded font-bold hover:bg-red-600"
                                  >
                                    OUI
                                  </button>
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setConfirmingDelete(null);
                                    }}
                                    className="bg-gray-600 px-2 py-1 rounded font-bold hover:bg-gray-500"
                                  >
                                    NON
                                  </button>
                                </div>
                              ) : (
                                <button
                                  title="Déplacer vers la corbeille"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setConfirmingDelete({ id: dec.id || '', type: 'decharge' });
                                  }}
                                  className="p-1.5 text-red-400 hover:text-red-700 hover:bg-red-50 rounded transition-all"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
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
