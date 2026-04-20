import React, { useState } from 'react';
import { LayoutDashboard, Users, FileText, Settings, PlusCircle, LogOut, AlertTriangle, X, Trash2, ShieldCheck, UserCog } from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { Company, UserRole } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  company: Company;
  userRole: UserRole;
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, company, userRole }) => {
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const isAdmin = userRole === 'admin';
  const isEditor = userRole === 'editor' || isAdmin;
  const isViewer = userRole === 'viewer';

  const menuItems = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, visible: true },
    { id: 'employees', label: 'Employés', icon: Users, visible: isEditor },
    { id: 'generate', label: 'Bulletins de paie', icon: PlusCircle, visible: isEditor },
    { id: 'decharge', label: 'Décharge', icon: FileText, visible: isEditor },
    { id: 'history', label: 'Historique', icon: FileText, visible: true },
    { id: 'corbeille', label: 'Corbeille', icon: Trash2, visible: isEditor },
    { id: 'users', label: 'Utilisateurs', icon: UserCog, visible: isAdmin },
    { id: 'settings', label: 'Paramètres', icon: Settings, visible: isAdmin || isEditor },
  ];

  const handleLogout = () => {
    signOut(auth);
    setShowLogoutConfirm(false);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] flex font-sans text-[#1e293b]">
      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 border border-[#e2e8f0]"
            >
              <div className="flex items-center gap-3 text-red-600 mb-4">
                <div className="p-2 bg-red-50 rounded-full">
                  <AlertTriangle size={24} />
                </div>
                <h3 className="text-lg font-bold">Confirmation</h3>
              </div>
              <p className="text-[#64748b] mb-6">
                Êtes-vous sûr de vouloir vous déconnecter ?
              </p>
              <div className="flex gap-3">
                <button 
                  onClick={() => setShowLogoutConfirm(false)}
                  className="flex-1 px-4 py-2.5 bg-gray-100 text-[#64748b] rounded-lg font-semibold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button 
                  onClick={handleLogout}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-all shadow-lg shadow-red-100"
                >
                  Déconnexion
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className="w-[260px] bg-white flex flex-col border-r border-[#e2e8f0] h-screen sticky top-0">
        <div className="p-8 pb-6 flex flex-col items-center text-center">
          <div className="mb-6 w-full flex justify-center">
            {company.logo ? (
              <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm">
                <img 
                  src={company.logo} 
                  alt="Logo" 
                  className="h-24 w-auto object-contain drop-shadow-md" 
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.onerror = null; // Prevent infinite loop
                    e.currentTarget.src = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(company.name) + '&background=2563eb&color=fff&size=128&rounded=true&bold=true';
                  }}
                />
              </div>
            ) : (
              <div className="w-20 h-20 bg-white border-2 border-dashed border-[#cbd5e1] rounded-2xl flex items-center justify-center text-[#2563eb] shadow-sm">
                <ShieldCheck size={40} />
              </div>
            )}
          </div>
          <div className="space-y-1 w-full">
            <h1 className="text-xs font-black text-[#1e293b] leading-tight uppercase tracking-[0.15em] border-b border-blue-100 pb-2 mb-2">
              {company.name}
            </h1>
          </div>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          {menuItems.filter(i => i.id !== 'settings' && i.id !== 'users' && i.visible).map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                activeTab === item.id 
                  ? 'bg-[#eff6ff] text-[#2563eb]' 
                  : 'text-[#64748b] hover:bg-gray-50'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#e2e8f0] space-y-1">
          {menuItems.filter(i => (i.id === 'settings' || i.id === 'users') && i.visible).map((item) => (
            <button 
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                activeTab === item.id 
                  ? 'bg-[#eff6ff] text-[#2563eb]' 
                  : 'text-[#64748b] hover:bg-gray-50'
              }`}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </button>
          ))}
          <button 
            onClick={() => setShowLogoutConfirm(true)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#64748b] hover:bg-red-50 hover:text-red-600 transition-all duration-200 text-sm font-medium group relative"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
            
            {/* Hover Tooltip/Confirmation Hint */}
            <div className="absolute left-full ml-2 px-3 py-1 bg-[#1e293b] text-white text-[10px] rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-10">
              Cliquer pour confirmer la déconnexion
            </div>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 flex flex-col gap-6">
        <header className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-2xl font-bold text-[#1e293b]">
              {menuItems.find(i => i.id === activeTab)?.label}
            </h1>
            <p className="text-sm text-[#64748b] mt-1">Période : Avril 2024</p>
          </div>
          <div className="flex items-center gap-4">
            {isEditor && (
              <button 
                onClick={() => setActiveTab('generate')}
                className="px-5 py-2.5 bg-[#2563eb] text-white rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                + Créer un bulletin
              </button>
            )}
            <div className="w-10 h-10 bg-primary-light rounded-full border border-blue-100 flex items-center justify-center font-bold text-primary">
              {auth.currentUser?.displayName?.charAt(0) || auth.currentUser?.email?.charAt(0).toUpperCase() || 'U'}
            </div>
          </div>
        </header>

        <div className="max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  );
};
