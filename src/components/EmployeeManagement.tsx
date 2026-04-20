import React, { useState } from 'react';
import { Employee } from '../types';
import { UserPlus, MapPin, Hash, Briefcase, DollarSign, Clock, Trash2, Edit2, X, Save, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface EmployeeManagementProps {
  employees: Employee[];
  onAdd: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onUpdate: (employee: Employee) => void;
}

export const EmployeeManagement: React.FC<EmployeeManagementProps> = ({ employees, onAdd, onDelete, onUpdate }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
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
    paymentMode: 'Virement bancaire'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
    setFormData(prev => ({ ...prev, [name]: name === 'baseSalary' ? (value === '' ? 0 : Number(value)) : value }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName?.trim()) newErrors.firstName = 'Le prénom est obligatoire';
    if (!formData.lastName?.trim()) newErrors.lastName = 'Le nom est obligatoire';
    if (!formData.position?.trim()) newErrors.position = 'Le poste est obligatoire';
    if (!formData.baseSalary || formData.baseSalary <= 0) newErrors.baseSalary = 'Le salaire doit être supérieur à 0';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

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
      matricule: '',
      hireDate: '',
      category: '',
      seniority: '',
      paymentMode: 'Virement bancaire'
    });
    setErrors({});
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

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-[#1e293b]">Gestion des EMPLOYÉS</h2>
        {!isAdding && (
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
              {errors.firstName && <p className="text-[11px] text-red-500 font-medium italic">{errors.firstName}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Nom <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="lastName" 
                value={formData.lastName} 
                onChange={handleChange} 
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none text-sm transition-all ${errors.lastName ? 'border-red-500 bg-red-50' : 'border-[#e2e8f0]'}`}
              />
              {errors.lastName && <p className="text-[11px] text-red-500 font-medium italic">{errors.lastName}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Poste <span className="text-red-500">*</span></label>
              <input 
                type="text" 
                name="position" 
                value={formData.position} 
                onChange={handleChange} 
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none text-sm transition-all ${errors.position ? 'border-red-500 bg-red-50' : 'border-[#e2e8f0]'}`}
              />
              {errors.position && <p className="text-[11px] text-red-500 font-medium italic">{errors.position}</p>}
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#64748b] uppercase tracking-wider">Salaire de base (FCFA) <span className="text-red-500">*</span></label>
              <input 
                type="number" 
                name="baseSalary" 
                value={formData.baseSalary ?? 0} 
                onChange={handleChange} 
                className={`w-full px-4 py-2 rounded-lg border focus:ring-2 focus:ring-[#2563eb] outline-none text-sm transition-all ${errors.baseSalary ? 'border-red-500 bg-red-50' : 'border-[#e2e8f0]'}`}
              />
              {errors.baseSalary && <p className="text-[11px] text-red-500 font-medium italic">{errors.baseSalary}</p>}
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
                <th className="px-6 py-4">Poste</th>
                <th className="px-6 py-4">Salaire</th>
                <th className="px-6 py-4">CNIB / SS</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0]">
              {employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-[#1e293b]">{emp.firstName} {emp.lastName}</div>
                    <div className="text-xs text-[#64748b]">{emp.residence || emp.address}</div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#64748b]">{emp.position}</td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-[#1e293b]">{emp.baseSalary.toLocaleString()} FCFA</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs font-mono text-[#64748b]">CNIB: {emp.cnib || 'N/A'}</div>
                    <div className="text-[10px] font-mono text-[#94a3b8]">SS: {emp.socialSecurityNumber || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button onClick={() => startEdit(emp)} className="p-2 text-[#64748b] hover:text-[#2563eb] hover:bg-blue-50 rounded-lg transition-all">
                        <Edit2 size={16} />
                      </button>
                      <button onClick={() => confirmDelete(emp.id)} className="p-2 text-[#64748b] hover:text-red-600 hover:bg-red-50 rounded-lg transition-all">
                        <Trash2 size={16} />
                      </button>
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
