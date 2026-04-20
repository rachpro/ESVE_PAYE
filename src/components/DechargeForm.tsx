import React, { useState } from 'react';
import { Decharge, Company } from '../types';
import { FileText, User, Hash, Phone, MapPin, DollarSign, Calendar, Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DechargeFormProps {
  company: Company;
  onGenerate: (data: Decharge) => void;
}

export const DechargeForm: React.FC<DechargeFormProps> = ({ company, onGenerate }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDecharge, setPendingDecharge] = useState<Decharge | null>(null);
  const [formData, setFormData] = useState<Partial<Decharge>>({
    beneficiaryName: '',
    cnib: '',
    cnibDate: '',
    phone: '',
    beneficiaryEmail: '',
    payerName: company.name,
    payerAddress: company.address,
    payerPhone: company.phone || '',
    payerEmail: company.email || '',
    amount: 0,
    amountInWords: '',
    purpose: '',
    paymentMode: 'Espèces',
    paymentDate: new Date().toISOString().split('T')[0],
    location: 'Ouagadougou',
    date: new Date().toISOString().split('T')[0],
    additionalNotes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? (value === '' ? 0 : Number(value)) : value }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.beneficiaryName?.trim()) newErrors.beneficiaryName = 'Le nom du bénéficiaire est obligatoire';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Le montant doit être supérieur à 0';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const decharge = { ...formData, id: Date.now().toString() } as Decharge;
    setPendingDecharge(decharge);
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    if (!pendingDecharge) return;
    onGenerate(pendingDecharge);
    setShowConfirm(false);
    setPendingDecharge(null);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden">
      <div className="p-6 border-b border-[#e2e8f0] bg-[#fafafa]">
        <h3 className="text-base font-semibold flex items-center gap-2 text-[#1e293b]">
          <FileText className="text-[#2563eb]" size={18} />
          Générateur de Décharge
        </h3>
        <p className="text-sm text-[#64748b] mt-1">Créez une décharge de paiement officielle.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-8" noValidate>
        {/* Section: Bénéficiaire */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] pb-2 border-b border-[#f1f5f9]">
              Informations du Bénéficiaire
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] flex items-center gap-2">
                  <User size={13} className="text-[#94a3b8]" />
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="beneficiaryName"
                  value={formData.beneficiaryName ?? ''}
                  onChange={handleChange}
                  placeholder="Ex: Jean Dupont"
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm ${errors.beneficiaryName ? 'border-red-500 bg-red-50' : 'border-[#e2e8f0]'}`}
                />
                {errors.beneficiaryName && <p className="text-[10px] text-red-500 font-medium italic">{errors.beneficiaryName}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#64748b] flex items-center gap-2">
                    <Hash size={13} className="text-[#94a3b8]" />
                    N° CNI (Optionnel)
                  </label>
                  <input
                    type="text"
                    name="cnib"
                    value={formData.cnib ?? ''}
                    onChange={handleChange}
                    placeholder="00000000"
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-[#64748b]">
                    Date CNI (Optionnel)
                  </label>
                  <input
                    type="date"
                    name="cnibDate"
                    value={formData.cnibDate ?? ''}
                    onChange={handleChange}
                    className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b] flex items-center gap-2">
                  <Phone size={13} className="text-[#94a3b8]" />
                  Téléphone (Optionnel)
                </label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone ?? ''}
                  onChange={handleChange}
                  placeholder="+226 XX XX XX XX"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b]">
                  E-mail (Optionnel)
                </label>
                <input
                  type="email"
                  name="beneficiaryEmail"
                  value={formData.beneficiaryEmail ?? ''}
                  onChange={handleChange}
                  placeholder="email@exemple.com"
                  className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm font-medium text-[#1e293b]"
                />
              </div>
            </div>
          </div>

        {/* Section: Détails du Paiement */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] pb-2 border-b border-[#f1f5f9]">
            Détails de la Transaction
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] flex items-center gap-2">
                <DollarSign size={13} className="text-[#94a3b8]" />
                Montant (FCFA) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount ?? 0}
                onChange={handleChange}
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm font-bold text-[#1e293b] ${errors.amount ? 'border-red-500 bg-red-50' : 'border-[#e2e8f0]'}`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b]">
                Mode de paiement
              </label>
              <select
                name="paymentMode"
                value={formData.paymentMode ?? 'Espèces'}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm bg-white font-medium text-[#1e293b]"
              >
                <option value="Espèces">Espèces</option>
                <option value="Chèque">Chèque</option>
                <option value="Virement">Virement</option>
                <option value="MobileMoney">Mobile Money</option>
              </select>
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b]">
                Montant en toutes lettres <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="amountInWords"
                value={formData.amountInWords ?? ''}
                onChange={handleChange}
                placeholder="Ex: Mille francs CFA"
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm ${errors.amountInWords ? 'border-red-500 bg-red-50' : 'border-[#e2e8f0]'}`}
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b]">
                Motif du paiement <span className="text-red-500">*</span>
              </label>
              <textarea
                name="purpose"
                value={formData.purpose ?? ''}
                onChange={handleChange}
                rows={2}
                placeholder="Précisez l'objet du paiement..."
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm ${errors.purpose ? 'border-red-500 bg-red-50' : 'border-[#e2e8f0]'}`}
              />
            </div>
          </div>
        </div>

        {/* Section: Localisation et Dates */}
        <div className="space-y-4">
          <h4 className="text-[11px] font-bold text-[#94a3b8] uppercase tracking-[0.2em] pb-2 border-b border-[#f1f5f9]">
            Cadre de Signature
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] flex items-center gap-2">
                <Calendar size={13} className="text-[#94a3b8]" />
                Date du paiement <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="paymentDate"
                value={formData.paymentDate ?? ''}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm font-medium text-[#1e293b]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] flex items-center gap-2">
                <MapPin size={13} className="text-[#94a3b8]" />
                Lieu <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                value={formData.location ?? ''}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm font-medium text-[#1e293b]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b]">
                Date de signature <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="date"
                value={formData.date ?? ''}
                onChange={handleChange}
                className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm font-medium text-[#1e293b]"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b]">
                Compléments (Optionnel)
              </label>
              <input
                type="text"
                name="additionalNotes"
                value={formData.additionalNotes ?? ''}
                onChange={handleChange}
                placeholder="Notes ou références..."
                className="w-full px-3 py-2 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm font-medium text-[#1e293b]"
              />
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-[#2563eb] text-white py-3 rounded-lg font-semibold text-sm shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <FileText size={18} />
            Générer la Décharge
          </button>
        </div>
      </form>

      <AnimatePresence>
        {showConfirm && pendingDecharge && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-blue-100"
            >
              <div className="bg-[#1e293b] p-6 text-white flex items-center gap-4">
                <div className="bg-white/10 p-3 rounded-full">
                  <AlertCircle size={24} className="text-blue-400" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">Confirmation de Décharge</h3>
                  <p className="text-gray-400 text-xs">Vérifiez les détails du paiement avant de valider.</p>
                </div>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-gray-50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-tight">Bénéficiaire</span>
                    <span className="text-sm font-black text-gray-800">{pendingDecharge.beneficiaryName}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-100 pb-2">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-tight">Montant</span>
                    <span className="text-sm font-black text-gray-800">{pendingDecharge.amount.toLocaleString('fr-FR')} FCFA</span>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs text-gray-500 uppercase font-bold tracking-tight">Motif</span>
                    <p className="text-xs text-gray-700 italic line-clamp-2">{pendingDecharge.purpose}</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100 italic text-[11px] text-blue-800">
                  <CheckCircle2 size={14} className="mt-0.5 flex-shrink-0" />
                  La décharge sera enregistrée comme preuve de paiement officielle.
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => { setShowConfirm(false); setPendingDecharge(null); }}
                    className="flex-1 px-4 py-3 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50 transition-all"
                  >
                    Réviser
                  </button>
                  <button
                    onClick={handleConfirm}
                    className="flex-1 px-4 py-3 bg-[#1e293b] text-white rounded-xl text-sm font-black hover:bg-black shadow-lg shadow-gray-200 transition-all flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} className="text-blue-400" />
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
