import React, { useState } from 'react';
import { Trash2, AlertTriangle, ArrowUpLeft, FileText, CreditCard, X, AlertCircle } from 'lucide-react';
import { PayrollSlipData, Decharge } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface TrashBinProps {
  trashedHistory: PayrollSlipData[];
  trashedDecharges: Decharge[];
  onRestoreSlip: (id: string) => void;
  onRestoreDecharge: (id: string) => void;
  onDeleteSlip: (id: string) => void;
  onDeleteDecharge: (id: string) => void;
}

export const TrashBin: React.FC<TrashBinProps> = ({
  trashedHistory,
  trashedDecharges,
  onRestoreSlip,
  onRestoreDecharge,
  onDeleteSlip,
  onDeleteDecharge
}) => {
  const [confirmDelete, setConfirmDelete] = useState<{ id: string, type: 'slip' | 'decharge', name: string } | null>(null);

  const handleConfirmDelete = () => {
    if (!confirmDelete) return;
    if (confirmDelete.type === 'slip') {
      onDeleteSlip(confirmDelete.id);
    } else {
      onDeleteDecharge(confirmDelete.id);
    }
    setConfirmDelete(null);
  };
  return (
    <div className="space-y-8">
      <div className="bg-red-50 text-red-700 p-4 rounded-xl flex gap-3 items-center border border-red-100">
        <AlertTriangle size={20} className="shrink-0" />
        <p className="text-sm">
          <strong>Corbeille :</strong> Les éléments ici ont été supprimés. Vous pouvez les restaurer ou les effacer définitivement. Les éléments supprimés définitivement ne pourront pas être récupérés.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Trashed Bulletins */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 px-6 border-b border-[#e2e8f0] flex justify-between items-center bg-[#fafafa]">
            <h3 className="font-bold text-sm text-[#1e293b] flex items-center gap-2 uppercase tracking-tight">
              <CreditCard size={18} className="text-[#2563eb]" />
              Bulletins supprimés
            </h3>
            <span className="text-xs font-semibold text-[#64748b] bg-[#e2e8f0] py-1 px-2.5 rounded-full">
              {trashedHistory.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-[#e2e8f0]">
                {trashedHistory.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-[#64748b] italic text-sm">
                      Aucun bulletin dans la corbeille.
                    </td>
                  </tr>
                ) : (
                  trashedHistory.map((slip, idx) => (
                    <tr key={slip.id || idx} className="hover:bg-[#f8fafc] transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-sm text-[#1e293b]">{slip.employee.lastName} {slip.employee.firstName}</p>
                        <p className="text-xs text-[#64748b]">{slip.employee.position}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-[#475569] bg-[#f1f5f9] px-2.5 py-1 rounded-md border border-[#e2e8f0]">
                          {slip.period}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 transition-opacity">
                          <button
                            onClick={() => onRestoreSlip(slip.id || '')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors tooltip-restaure"
                            title="Restaurer"
                          >
                            <ArrowUpLeft size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDelete({ 
                                id: slip.id || '', 
                                type: 'slip', 
                                name: `Bulletin - ${slip.employee.lastName} ${slip.employee.firstName}` 
                              });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip-supr"
                            title="Supprimer définitivement"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Trashed Decharges */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden flex flex-col">
          <div className="p-5 px-6 border-b border-[#e2e8f0] flex justify-between items-center bg-[#fafafa]">
            <h3 className="font-bold text-sm text-[#1e293b] flex items-center gap-2 uppercase tracking-tight">
              <FileText size={18} className="text-[#2563eb]" />
              Décharges supprimées
            </h3>
            <span className="text-xs font-semibold text-[#64748b] bg-[#e2e8f0] py-1 px-2.5 rounded-full">
              {trashedDecharges.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <tbody className="divide-y divide-[#e2e8f0]">
                {trashedDecharges.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-12 text-center text-[#64748b] italic text-sm">
                      Aucune décharge dans la corbeille.
                    </td>
                  </tr>
                ) : (
                  trashedDecharges.map((decharge, idx) => (
                    <tr key={decharge.id || idx} className="hover:bg-[#f8fafc] transition-colors group">
                      <td className="px-6 py-4">
                        <p className="font-semibold text-sm text-[#1e293b]">{decharge.beneficiaryName}</p>
                        <p className="text-xs text-[#64748b]">{decharge.purpose}</p>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-medium text-[#475569] bg-[#f1f5f9] px-2.5 py-1 rounded-md border border-[#e2e8f0]">
                          {decharge.date}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 transition-opacity">
                          <button
                            onClick={() => onRestoreDecharge(decharge.id || '')}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors tooltip-restaure"
                            title="Restaurer"
                          >
                            <ArrowUpLeft size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDelete({ 
                                id: decharge.id || '', 
                                type: 'decharge', 
                                name: `Décharge - ${decharge.beneficiaryName}` 
                              });
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors tooltip-supr"
                            title="Supprimer définitivement"
                          >
                            <Trash2 size={16} />
                          </button>
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
      <AnimatePresence>
        {confirmDelete && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-red-100"
            >
              <div className="p-6">
                <div className="flex items-center gap-4 text-red-600 mb-4">
                  <div className="p-3 bg-red-50 rounded-full">
                    <AlertCircle size={24} />
                  </div>
                  <h3 className="text-xl font-bold">Action Irréversible</h3>
                </div>
                
                <p className="text-[#64748b] mb-6">
                  Êtes-vous sûr de vouloir supprimer définitivement <span className="font-bold text-[#1e293b]">{confirmDelete.name}</span> ? Cette action est définitive et les données ne pourront plus être récupérées.
                </p>

                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 px-4 py-2.5 bg-gray-100 text-[#64748b] rounded-xl font-semibold hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleConfirmDelete}
                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
                  >
                    Supprimer Définitivement
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
