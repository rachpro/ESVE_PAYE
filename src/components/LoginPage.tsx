import React from 'react';
import { Company } from '../types';
import { ShieldCheck, LogOut, Lock } from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  company: Company;
  onLogin: () => void;
  error: string | null;
  onLogout?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ company, onLogin, error, onLogout }) => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden">
      {/* Decorative blurs */}
      <div className="absolute top-0 left-0 w-[500px] h-[500px] bg-blue-400/10 rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2 mix-blend-multiply pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-indigo-400/10 rounded-full blur-[100px] translate-x-1/2 translate-y-1/2 mix-blend-multiply pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-[#f1f5f9] overflow-hidden">
          <div className="p-8 sm:p-10">
            <div className="flex justify-center mb-8">
              {company.logo ? (
                <img src={company.logo} alt="Logo" className="h-16 w-auto object-contain drop-shadow-sm" referrerPolicy="no-referrer" />
              ) : (
                <div className="h-16 w-16 bg-[#eff6ff] text-[#2563eb] rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={32} />
                </div>
              )}
            </div>

            <div className="text-center mb-8 space-y-2">
              <h1 className="text-2xl font-bold text-[#1e293b] tracking-tight">Portail Administrateur</h1>
              <p className="text-sm text-[#64748b] leading-relaxed">
                Gestion sécurisée de la Paie et des Décharges pour <br/>
                <strong className="text-[#1e293b]">{company.name}</strong>.
              </p>
            </div>

            {!error ? (
              <div className="space-y-4">
                <button
                  onClick={onLogin}
                  className="w-full flex items-center justify-center gap-3 bg-white border border-[#e2e8f0] hover:bg-gray-50 text-[#1e293b] font-semibold py-3 px-4 rounded-xl transition-all active:scale-[0.98] shadow-sm hover:shadow"
                >
                  <svg width="24" height="24" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                    <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                    <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                    <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303c-.792 2.237-2.231 4.166-4.087 5.571.001-.001.002-.001.003-.002l6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                  </svg>
                  Continuer avec Google
                </button>
                <div className="flex items-center gap-2 justify-center text-xs text-[#94a3b8] mt-6 bg-[#f8fafc] p-2 rounded-lg border border-[#f1f5f9]">
                  <Lock size={12} className="text-[#64748b]" />
                  Accès restreint par authentification Firebase
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-medium text-center shadow-sm">
                  {error}
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="w-full flex items-center justify-center gap-2 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#1e293b] font-semibold py-3 px-4 rounded-xl transition-all shadow-sm"
                  >
                    <LogOut size={18} />
                    Se déconnecter
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="bg-[#f8fafc] border-t border-[#f1f5f9] p-4 text-center">
            <p className="text-[11px] font-medium text-[#94a3b8]">
              {company.name} © {new Date().getFullYear()}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
