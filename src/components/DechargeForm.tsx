import React, { useState } from 'react';
import { Decharge, Company } from '../types';
import { FileText, User, Hash, Phone, MapPin, DollarSign, Calendar, Save } from 'lucide-react';

interface DechargeFormProps {
  company: Company;
  onGenerate: (data: Decharge) => void;
}

export const DechargeForm: React.FC<DechargeFormProps> = ({ company, onGenerate }) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
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
    setFormData(prev => ({ ...prev, [name]: name === 'amount' ? Number(value) : value }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.beneficiaryName?.trim()) newErrors.beneficiaryName = 'Le nom du bénéficiaire est obligatoire';
    if (!formData.cnib?.trim()) newErrors.cnib = 'Le numéro CNIB est obligatoire';
    if (!formData.cnibDate) newErrors.cnibDate = 'La date de la CNI est obligatoire';
    if (!formData.phone?.trim()) newErrors.phone = 'Le numéro de téléphone est obligatoire';
    if (!formData.amount || formData.amount <= 0) newErrors.amount = 'Le montant doit être supérieur à 0';
    if (!formData.amountInWords?.trim()) newErrors.amountInWords = 'Le montant en toutes lettres est obligatoire';
    if (!formData.purpose?.trim()) newErrors.purpose = 'Le motif est obligatoire';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onGenerate({ ...formData, id: Date.now().toString() } as Decharge);
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
                value={formData.beneficiaryName}
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
                  N° CNI <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="cnib"
                  value={formData.cnib}
                  onChange={handleChange}
                  placeholder="00000000"
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm ${errors.cnib ? 'border-red-500 bg-red-50' : 'border-[#e2e8f0]'}`}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#64748b]">
                  Date CNI <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  name="cnibDate"
                  value={formData.cnibDate}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm ${errors.cnibDate ? 'border-red-500 bg-red-50' : 'border-[#e2e8f0]'}`}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b] flex items-center gap-2">
                <Phone size={13} className="text-[#94a3b8]" />
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+226 XX XX XX XX"
                className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm ${errors.phone ? 'border-red-500 bg-red-50' : 'border-[#e2e8f0]'}`}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#64748b]">
                E-mail (Optionnel)
              </label>
              <input
                type="email"
                name="beneficiaryEmail"
                value={formData.beneficiaryEmail}
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
                value={formData.amount}
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
                value={formData.paymentMode}
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
                value={formData.amountInWords}
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
                value={formData.purpose}
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
                value={formData.paymentDate}
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
                value={formData.location}
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
                value={formData.date}
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
                value={formData.additionalNotes}
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
    </div>
  );
};
