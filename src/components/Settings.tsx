import React, { useState } from 'react';
import { Company } from '../types';
import { Building2, MapPin, Hash, Briefcase, Image as ImageIcon, Save, Phone, Mail, FileText, ShieldCheck, Activity, Layers, CreditCard } from 'lucide-react';

interface SettingsProps {
  company: Company;
  onSave: (company: Company) => void;
}

export const Settings: React.FC<SettingsProps> = ({ company, onSave }) => {
  const [formData, setFormData] = useState<Company>(company);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden max-w-2xl">
      <div className="p-6 border-b border-[#e2e8f0] bg-[#fafafa]">
        <h3 className="text-base font-semibold flex items-center gap-2 text-[#1e293b]">
          <Building2 className="text-[#2563eb]" size={18} />
          Informations de l'entreprise
        </h3>
        <p className="text-sm text-[#64748b] mt-1">Ces informations apparaîtront sur tous les bulletins de paie générés.</p>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
              <Building2 size={14} />
              Nom de l'entreprise <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
              <MapPin size={14} />
              Adresse complète <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                <FileText size={14} />
                Numéro IFU (Optionnel)
              </label>
              <input
                type="text"
                name="ifu"
                value={formData.ifu || ''}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                <ShieldCheck size={14} />
                N° RCCM (Optionnel)
              </label>
              <input
                type="text"
                name="rccm"
                value={formData.rccm || ''}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                <Activity size={14} />
                Régime d'imposition (Optionnel)
              </label>
              <input
                type="text"
                name="regime"
                value={formData.regime || ''}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                <Layers size={14} />
                Division fiscale (Optionnel)
              </label>
              <input
                type="text"
                name="division"
                value={formData.division || ''}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
              <CreditCard size={14} />
              Numéro RIB (Optionnel)
            </label>
            <input
              type="text"
              name="rib"
              value={formData.rib || ''}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                <Hash size={14} />
                SIRET (Optionnel)
              </label>
              <input
                type="text"
                name="siret"
                value={formData.siret}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                <Briefcase size={14} />
                Code APE (Optionnel)
              </label>
              <input
                type="text"
                name="ape"
                value={formData.ape}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                <Phone size={14} />
                Téléphone (Optionnel)
              </label>
              <input
                type="text"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                <Mail size={14} />
                Email (Optionnel)
              </label>
              <input
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
              <ImageIcon size={14} />
              URL du Logo
            </label>
            <div className="flex gap-4 items-center">
              <input
                type="text"
                name="logo"
                value={formData.logo || ''}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className="flex-1 px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
              />
              {formData.logo && (
                <div className="w-12 h-12 border border-[#e2e8f0] rounded-lg overflow-hidden bg-gray-50 flex items-center justify-center">
                  <img src={formData.logo} alt="Preview" className="max-w-full max-h-full object-contain" referrerPolicy="no-referrer" />
                </div>
              )}
            </div>
            <p className="text-[10px] text-[#64748b]">Utilisez l'URL de l'image téléchargée ou une URL externe.</p>
          </div>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            className="w-full bg-[#2563eb] text-white py-3 rounded-lg font-semibold text-sm shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
          >
            <Save size={18} />
            Enregistrer les modifications
          </button>
        </div>
      </form>
    </div>
  );
};
