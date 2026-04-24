import React, { useState } from 'react';
import { Employee } from '../types';
import { UserPlus, MapPin, Hash, Briefcase, DollarSign, Clock, Trash2, Edit2, X, Save, AlertTriangle, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { formatNumeric, parseNumeric } from '../lib/numericUtils';

interface EmployeeManagementProps {
  employees: Employee[];
  onAdd?: (employee: Employee) => void;
  onDelete?: (id: string) => void;
  onUpdate?: (employee: Employee) => void;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ employees, onAdd, onDelete, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);

  const canEdit = !!onAdd && !!onUpdate && !!onDelete;
  const [formData, setFormData] = useState<Partial<Employee>>({
    firstName: '',
    lastName: '',
    address: '',
    residence: '',
    socialSecurityNumber: '',
    cnib: '',
    position: '',
    baseSalary: 0,
    matricule: '',
    hireDate: '',
    category: '',
    seniority: '',
    paymentMode: 'Virement bancaire',
    niveau: '',
    coefficient: '',
    indice: '',
    department: '',
    qualification: '',
    workingHours: 173,
    email: ''
  });

  const validateField = (name: string, value: any) => {
    let error = '';
    const valStr = String(value || '').trim();
    
    switch (name) {
      case 'firstName':
        if (!valStr) error = 'Le prénom est obligatoire pour identifier l\'employé';
        break;
      case 'lastName':
        if (!valStr) error = 'Le nom de famille est obligatoire';
        break;
      case 'position':
        if (!valStr) error = 'Veuillez préciser le poste occupé';
        break;
      case 'email':
        if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Format d\'email invalide (ex: nom@entreprise.com)';
        break;
      case 'baseSalary':
        if (value !== undefined && isNaN(Number(parseNumeric(value)))) error = 'Le salaire doit être un nombre valide';
        break;
    }
    
    if (error) {
      setErrors(prev => ({ ...prev, [name]: error }));
    } else {
      setErrors(prev => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      let processedValue: any = value;
      if (name === 'baseSalary' || name === 'workingHours' || name === 'transportAllowance' || name === 'housingAllowance' || name === 'functionAllowance') {
        const parsedValue = parseNumeric(value);
        if (parsedValue === '' || !isNaN(Number(parsedValue))) {
          processedValue = parsedValue === '' ? '' : Number(parsedValue);
        } else {
          return prev; // Reject invalid input
        }
      }
      return { ...prev, [name]: processedValue };
    });

    // Dynamic validation
    validateField(name, value);
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const currentBaseSalary = formData.baseSalary !== undefined ? Number(parseNumeric(formData.baseSalary)) : 0;
    if (!formData.firstName?.trim()) newErrors.firstName = 'Le prénom est obligatoire';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Le nom est obligatoire';
    if (!formData.position?.trim()) newErrors.position = 'Le poste est obligatoire';
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Format d\'email invalide';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setShowSaveConfirm(true);
  };

  const handleFinalSubmit = () => {
    if (editingId) {
      onUpdate({ ...formData, id: editingId } as Employee);
      setEditingId(null);
    } else {
      onAdd({ ...formData, id: Date.now().toString() } as Employee);
      setIsAdding(false);
    }
    setFormData({
      firstName: '',
      lastName: '',
      address: '',
      residence: '',
      socialSecurityNumber: '',
      cnib: '',
      position: '',
      baseSalary: 0,
      transportAllowance: 0,
      housingAllowance: 0,
      functionAllowance: 0,
      matricule: '',
      hireDate: '',
      category: '',
      seniority: '',
      paymentMode: 'Virement bancaire',
      niveau: '',
      coefficient: '',
      indice: '',
      department: '',
      qualification: '',
      workingHours: 173,
      email: ''
    });
    setErrors({});
    setShowSaveConfirm(false);
  };

  const startEdit = (emp: Employee) => {
    setFormData(emp);
    setEditingId(emp.id);
    setIsAdding(true);
    setErrors({});
  };

  const confirmDelete = (id: string) => {
    setDeleteId(id);
  };

  const handleDelete = () => {
    if (deleteId) {
      onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const employeeToDelete = employees.find(e => e.id === deleteId);

  return (
    <div className="space-y-6">
      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-[#e2e8f0]"
            >
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="p-2 bg-red-50 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold">Supprimer l'employé</h3>
              </div>
              <p className="text-[#64748b] mb-6">
                Êtes-vous sûr de vouloir supprimer <span className="font-bold text-[#1e293b]">{employeeToDelete?.firstName} {employeeToDelete?.lastName}</span> ? 
                <br />
                <span className="text-xs">Cette action est irréversible.</span>
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeleteId(null)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-[#64748b] rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleDelete}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Supprimer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Save Confirmation Modal */}
      <AnimatePresence>
        {showSaveConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-[#e2e8f0]"
            >
              <div className="flex items-center gap-3 text-[#2563eb] mb-4">
                <div className="p-2 bg-blue-50 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold">{editingId ? 'Confirmer la modification' : 'Confirmer l\'enregistrement'}</h3>
              </div>
              <p className="text-[#64748b] mb-6">
                Voulez-vous vraiment {editingId ? 'enregistrer les modifications apportées à' : 'enregistrer les informations de'} <span className="font-bold text-[#1e293b]">{formData.firstName} {formData.lastName}</span> ?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowSaveConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-[#64748b] rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleFinalSubmit}
                  className="flex-1 px-4 py-2.5 bg-[#2563eb] text-white rounded-lg font-semibold hover:opacity-90 transition-all shadow-lg shadow-blue-100"
                >
                  Confirmer
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#1e293b]">Gestion des Employés</h2>
        {!isAdding && onAdd && (
          <button
            onClick={() => setIsAdding(true)}
            className="bg-[#2563eb] text-white px-4 py-2 rounded-lg text-sm font-bold hover:opacity-90 transition-all flex items-center gap-2"
          >
            <UserPlus size={18} />
            Ajouter un employé
          </button>
        )}
      </div>

      {isAdding && (
        <div className="bg-white p-6 rounded-xl border border-[#e2e8f0] shadow-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-[#1e293b]">{editingId ? 'Modifier l\'employé' : 'Nouvel employé'}</h3>
            <button onClick={() => { setIsAdding(false); setEditingId(null); setErrors({}); }} className="text-[#64748b] hover:text-red-500">
              <X size={20} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4" noValidate>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Prénom <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="firstName" 
                value={formData.firstName} 
                onChange={handleChange} 
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none text-sm transition-all ${errors.firstName ? 'border-red-500 bg-red-50' : 'border-[#e2e8f0]'}`}
              />
              {errors.firstName && (
                <p className="text-[11px] text-red-500 font-medium italic flex items-center gap-1 mt-1">
                  <AlertTriangle size={12} />
                  {errors.firstName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Nom <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange} 
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none text-sm transition-all ${errors.lastName ? 'border-red-500 bg-red-50 ring-1 ring-red-200' : 'border-[#e2e8f0]'}`}
              />
              {errors.lastName && (
                <p className="text-[11px] text-red-500 font-medium italic flex items-center gap-1 mt-1">
                  <AlertTriangle size={12} />
                  {errors.lastName}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Salaire de Base</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="text" 
                  inputMode="numeric"
                  name="baseSalary" 
                  value={formatNumeric(formData.baseSalary)} 
                  onChange={handleChange} 
                  className={`w-full pl-9 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none text-sm transition-all ${errors.baseSalary ? 'border-red-500 bg-red-50 ring-1 ring-red-200' : 'border-[#e2e8f0]'}`}
                  placeholder="Ex: 150 000"
                />
              </div>
              {errors.baseSalary && (
                <p className="text-[11px] text-red-500 font-medium italic flex items-center gap-1 mt-1">
                  <AlertTriangle size={12} />
                  {errors.baseSalary}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Poste <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="position" 
                value={formData.position} 
                onChange={handleChange} 
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none text-sm transition-all ${errors.position ? 'border-red-500 bg-red-50 ring-1 ring-red-200' : 'border-[#e2e8f0]'}`}
              />
              {errors.position && (
                <p className="text-[11px] text-red-500 font-medium italic flex items-center gap-1 mt-1">
                  <AlertTriangle size={12} />
                  {errors.position}
                </p>
              )}
            </div>

            {/* Indemnities Section */}
            <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-blue-50/30 rounded-xl border border-blue-100">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2563eb] uppercase tracking-wider">Indemnité de Transport</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
                  <input 
                    type="text" 
                    inputMode="numeric"
                    name="transportAllowance" 
                    value={formatNumeric(formData.transportAllowance)} 
                    onChange={handleChange} 
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-blue-100 focus:ring-2 focus:ring-[#2563eb] outline-none text-sm bg-white"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2563eb] uppercase tracking-wider">Indemnité de Logement</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
                  <input 
                    type="text" 
                    inputMode="numeric"
                    name="housingAllowance" 
                    value={formatNumeric(formData.housingAllowance)} 
                    onChange={handleChange} 
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-blue-100 focus:ring-2 focus:ring-[#2563eb] outline-none text-sm bg-white"
                    placeholder="0"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#2563eb] uppercase tracking-wider">Indemnité de Fonction</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-300" size={14} />
                  <input 
                    type="text" 
                    inputMode="numeric"
                    name="functionAllowance" 
                    value={formatNumeric(formData.functionAllowance)} 
                    onChange={handleChange} 
                    className="w-full pl-9 pr-4 py-2 rounded-lg border border-blue-100 focus:ring-2 focus:ring-[#2563eb] outline-none text-sm bg-white"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">N° Matricule</label>
              <input type="text" name="matricule" value={formData.matricule || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" placeholder="EMP-202X-XXX" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Date d'embauche</label>
              <input type="date" name="hireDate" value={formData.hireDate || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Catégorie / Échelon</label>
              <input type="text" name="category" value={formData.category || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" placeholder="Catégorie V - Échelon 2" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Ancienneté (Optionnel)</label>
              <input type="text" name="seniority" value={formData.seniority || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" placeholder="X ans" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">N° Sécurité Sociale (N° CNSS)</label>
              <input type="text" name="socialSecurityNumber" value={formData.socialSecurityNumber || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Mode de paiement</label>
              <select 
                name="paymentMode" 
                value={formData.paymentMode} 
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] outline-none focus:ring-2 focus:ring-[#2563eb] text-sm bg-white"
              >
                <option value="Virement bancaire">Virement bancaire</option>
                <option value="Espèces">Espèces</option>
                <option value="Chèque">Chèque</option>
                <option value="Mobile Money">Mobile Money</option>
              </select>
            </div>

            {/* Additional Info for Sage Layout */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Niveau</label>
              <input type="text" name="niveau" value={formData.niveau || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Coefficient</label>
              <input type="text" name="coefficient" value={formData.coefficient || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Indice</label>
              <input type="text" name="indice" value={formData.indice || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Département</label>
              <input type="text" name="department" value={formData.department || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Qualification</label>
              <input type="text" name="qualification" value={formData.qualification || ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">H. de travail mensuelles</label>
              <input 
                type="text" 
                inputMode="decimal"
                name="workingHours" 
                value={formatNumeric(formData.workingHours)} 
                onChange={handleChange} 
                className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Email (pour le partage)</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                <input 
                  type="email" 
                  name="email" 
                  value={formData.email || ''} 
                  onChange={handleChange} 
                  className={`w-full pl-9 pr-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none text-sm transition-all ${errors.email ? 'border-red-500 bg-red-50 ring-1 ring-red-200' : 'border-[#e2e8f0]'}`}
                  placeholder="exemple@email.com"
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-red-500 font-medium italic flex items-center gap-1 mt-1">
                  <AlertTriangle size={12} />
                  {errors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">N° CNIB</label>
              <input 
                type="text" 
                name="cnib" 
                value={formData.cnib || ''} 
                onChange={handleChange} 
                className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] outline-none focus:ring-2 focus:ring-[#2563eb] text-sm transition-all"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Adresse</label>
              <input type="text" name="address" value={formData.address ?? ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Résidence</label>
              <input type="text" name="residence" value={formData.residence ?? ''} onChange={handleChange} className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Nombre de charges (Enfants)</label>
              <input 
                type="text" 
                inputMode="numeric"
                name="familyCharges" 
                value={formatNumeric(formData.familyCharges)} 
                onChange={handleChange} 
                className="w-full px-4 py-2 rounded-lg border border-[#e2e8f0] outline-none focus:ring-2 focus:ring-[#2563eb] text-sm" 
              />
            </div>
            <div className="md:col-span-2 pt-4">
              <button type="submit" className="w-full bg-[#2563eb] text-white py-3 rounded-lg font-bold text-sm shadow-sm hover:opacity-90 transition-all flex items-center justify-center gap-2">
                <Save size={18} />
                {editingId ? 'Mettre à jour' : 'Enregistrer l\'employé'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[#fafafa] text-[#64748b] text-xs font-bold uppercase tracking-wider">
                <th className="px-6 py-4">Employé</th>
                <th className="px-6 py-4">Poste / Salaire</th>
                <th className="px-6 py-4">CNIB / SS</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {employees.map((emp, idx) => (
                <tr key={`${emp.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#1e293b]">{emp.firstName} {emp.lastName}</div>
                    <div className="text-xs text-[#64748b]">{emp.email || emp.residence || emp.address}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-[#1e293b]">{emp.position}</div>
                    <div className="text-xs font-bold text-[#2563eb]">{formatNumeric(emp.baseSalary)} FCFA</div>
                    {(emp.transportAllowance || emp.housingAllowance || emp.functionAllowance) && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {emp.transportAllowance ? <span className="text-[9px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-100">T: {formatNumeric(emp.transportAllowance)}</span> : null}
                        {emp.housingAllowance ? <span className="text-[9px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-100">L: {formatNumeric(emp.housingAllowance)}</span> : null}
                        {emp.functionAllowance ? <span className="text-[9px] bg-blue-50 text-blue-600 px-1 rounded border border-blue-100">F: {formatNumeric(emp.functionAllowance)}</span> : null}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-mono text-[#64748b]">CNIB: {emp.cnib || 'N/A'}</div>
                    <div className="text-[10px] font-mono text-[#94a3b8]">SS: {emp.socialSecurityNumber || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      {onUpdate && (
                        <button onClick={() => startEdit(emp)} className="p-2 text-[#64748b] hover:text-[#2563eb] hover:bg-blue-50 rounded-lg transition-all">
                          <Edit2 size={16} />
                        </button>
                      )}
                      {onDelete && (
                        <button onClick={() => confirmDelete(emp.id)} className="p-2 text-[#64748b] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#64748b]">
                    Aucun employé enregistré.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
