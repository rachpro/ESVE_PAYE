import React, { useState, useEffect, useRef } from 'react';
import { Company, TemplateConfig } from '../types';
import { Building2, MapPin, Hash, Briefcase, Image as ImageIcon, Save, Phone, Mail, FileText, ShieldCheck, Activity, Layers, CreditCard, Trash2, X, CheckCircle2 } from 'lucide-react';

interface SettingsProps {
  company: Company;
  onSave?: (company: Company) => void;
  onAutoSave?: (company: Company) => void;
  onReset?: () => void;
}

export const Settings: React.FC<SettingsProps> = ({ company, onSave, onAutoSave, onReset }) => {
  const [formData, setFormData] = useState<Company>(company);
  const [isSaved, setIsSaved] = useState(false);
  const isReadOnly = !onSave;
  
  // Track initial render to prevent auto-saving on mount
  const isInitialRender = useRef(true);

  // Auto-save effect
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }

    if (isReadOnly || !onAutoSave) return;

    const timer = setTimeout(() => {
      onAutoSave(formData);
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    }, 1000); // 1-second debounce for auto-save

    return () => clearTimeout(timer);
  }, [formData, isReadOnly, onAutoSave]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSave) onSave(formData);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-[#e2e8f0] overflow-hidden max-w-2xl">
      <div className="p-6 border-b border-[#e2e8f0] bg-[#fafafa] flex justify-between items-center">
        <div>
          <h3 className="text-base font-semibold flex items-center gap-2 text-[#1e293b]">
            <Building2 className="text-[#2563eb]" size={18} />
            Informations de l'entreprise
          </h3>
          <p className="text-sm text-[#64748b] mt-1">Ces informations apparaîtront sur tous les bulletins de paie générés.</p>
        </div>
        {isSaved && (
          <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-medium bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 animate-in fade-in duration-300">
            <CheckCircle2 size={16} />
            Sauvegarde auto.
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        <fieldset disabled={isReadOnly} className="space-y-4">
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
              className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm disabled:bg-gray-50"
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
                disabled={isReadOnly}
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm disabled:bg-gray-50"
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
                placeholder="Ex: Réel Simplifié"
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
                placeholder="Ex: DME de Ouaga II"
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
              placeholder="Ex: BF01 12345 123456789012 12"
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
                  value={formData.siret || ''}
                  onChange={handleChange}
                  placeholder="Ex: 123 456 789 00012"
                  className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                  <Briefcase size={14} />
                  Code APE / NAF (Optionnel)
                </label>
                <input
                  type="text"
                  name="ape"
                  value={formData.ape || ''}
                  onChange={handleChange}
                  placeholder="Ex: 6201Z"
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
              Logo de l'entreprise
            </label>
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-6 p-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl">
                <div className="w-24 h-24 bg-white border border-[#e2e8f0] rounded-xl flex items-center justify-center p-2 shadow-sm relative group overflow-hidden">
                  {formData.logo ? (
                    <>
                      <img 
                        src={formData.logo} 
                        alt="Logo Preview" 
                        className="max-w-full max-h-full object-contain" 
                        referrerPolicy="no-referrer" 
                      />
                      {!isReadOnly && (
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <button 
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, logo: '' }))}
                            className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg"
                            title="Supprimer le logo"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <ImageIcon size={32} className="text-gray-300" />
                  )}
                </div>
                
                <div className="flex-1 space-y-3">
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onloadend = () => {
                            setFormData(prev => ({ ...prev, logo: reader.result as string }));
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                      disabled={isReadOnly}
                    />
                    <button 
                      type="button"
                      className="w-full px-4 py-2.5 bg-white border border-[#2563eb] text-[#2563eb] rounded-lg font-bold text-sm hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                    >
                      <ImageIcon size={18} />
                      Choisir une image
                    </button>
                  </div>
                  <p className="text-[10px] text-[#64748b] leading-tight">
                    Formats supportés : JPG, PNG, SVG. Taille max recommandée : 500kb.
                  </p>
                </div>
              </div>
              
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted uppercase">Ou via une URL directe</label>
                <input
                  type="text"
                  name="logo"
                  value={formData.logo || ''}
                  onChange={handleChange}
                  placeholder="https://example.com/logo.png"
                  className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] focus:ring-1 focus:ring-primary outline-none transition-all text-xs"
                />
              </div>
            </div>
          </div>

          {/* Template Configuration */}
          <div className="pt-6 mt-6 border-t border-[#e2e8f0]">
            <h4 className="text-sm font-semibold flex items-center gap-2 text-[#1e293b] mb-4">
              <FileText className="text-[#2563eb]" size={16} />
              Personnalisation du Bulletin de Paie
            </h4>
            <p className="text-xs text-[#64748b] mb-4">
              Cochez ou décochez les champs à afficher dans l'en-tête du bulletin généré :
            </p>
            <div className="grid grid-cols-2 gap-3 bg-gray-50 p-4 rounded-xl border border-[#e2e8f0]">
              {[
                { name: 'showDepartment', label: 'Département', default: false },
                { name: 'showQualification', label: 'Qualification', default: false },
                { name: 'showCategory', label: 'Catégorie / Échelon', default: true },
                { name: 'showSeniority', label: 'Ancienneté', default: true },
                { name: 'showContractType', label: 'Type de contrat', default: true },
                { name: 'showSocialSecurity', label: 'N° CNSS salarié', default: true },
                { name: 'showNiveau', label: 'Niveau', default: true },
                { name: 'showCoefficient', label: 'Coefficient', default: true },
                { name: 'showIndice', label: 'Indice', default: true },
                { name: 'showLeaveInfo', label: 'Solde des congés', default: true }
              ].map(field => (
                <label key={field.name} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    name={field.name}
                    checked={Boolean(formData.templateConfig?.[field.name as keyof TemplateConfig] ?? field.default)}
                    onChange={(e) => {
                      setFormData(prev => ({
                        ...prev,
                        templateConfig: {
                          ...(prev.templateConfig || {}),
                          [field.name]: e.target.checked
                        }
                      }));
                    }}
                    disabled={isReadOnly}
                    className="w-4 h-4 text-[#2563eb] rounded border-gray-300 focus:ring-[#2563eb] disabled:opacity-50 transition-all"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-black transition-colors">{field.label}</span>
                </label>
              ))}
            </div>
            
            <div className="mt-6 space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-[#64748b] flex items-center gap-2">
                <FileText size={14} />
                Texte de pied de page du bulletin (Notes / Mentions légales)
              </label>
              <textarea
                name="slipFooterText"
                value={formData.templateConfig?.slipFooterText || ''}
                onChange={(e) => {
                  setFormData(prev => ({
                    ...prev,
                    templateConfig: {
                      ...(prev.templateConfig || {}),
                      slipFooterText: e.target.value
                    }
                  }));
                }}
                disabled={isReadOnly}
                placeholder="Ex: Merci de conserver ce bulletin. Tout versement a été effectué par virement bancaire."
                className="w-full px-4 py-2.5 rounded-lg border border-[#e2e8f0] focus:ring-2 focus:ring-[#2563eb] outline-none transition-all text-sm min-h-[80px] disabled:bg-gray-50 resize-y"
              />
            </div>
          </div>
        </fieldset>

        <div className="pt-4">
          {onSave && (
            <button
              type="submit"
              className="w-full bg-[#2563eb] text-white py-3 rounded-lg font-semibold text-sm shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Save size={18} />
              Enregistrer les modifications
            </button>
          )}
          {isReadOnly && (
            <div className="p-4 bg-gray-50 border border-gray-100 rounded-lg text-center text-xs text-muted italic">
              Vous n'avez pas les permissions nécessaires pour modifier les informations de l'entreprise.
            </div>
          )}
        </div>
      </form>

      {onReset && (
        <div className="mt-12 p-8 border-t border-red-100 bg-red-50/30">
          <h4 className="text-sm font-bold text-red-600 flex items-center gap-2 mb-2 uppercase tracking-wider">
            <Trash2 size={16} />
            Zone de danger
          </h4>
          <p className="text-xs text-red-500 mb-4">
            La réinitialisation supprimera définitivement tous vos employés, bulletins de paie, décharges et paramètres. 
            Cette action ne peut pas être annulée.
          </p>
          <button
            onClick={onReset}
            className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-all shadow-sm flex items-center gap-2"
          >
            Réinitialiser toutes les données de l'application
          </button>
        </div>
      )}
    </div>
  );
};
