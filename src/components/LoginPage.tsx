import React, { useState } from 'react';
import { Company } from '../types';
import { ShieldCheck, LogOut, Lock, Mail, Key } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface LoginPageProps {
  company: Company;
  onLogin: (remember: boolean) => void;
  onEmailLogin?: (email: string, pass: string, remember: boolean) => Promise<void>;
  onEmailRegister?: (email: string, pass: string, remember: boolean) => Promise<void>;
  onPasswordReset?: (email: string) => Promise<void>;
  error: string | null;
  onLogout?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ company, onLogin, onEmailLogin, onEmailRegister, onPasswordReset, error, onLogout }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [showReset, setShowReset] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [localError, setLocalError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setLocalError('Veuillez saisir votre adresse email.');
      return;
    }
    setLocalError(null);
    setIsLoading(true);
    try {
      if (onPasswordReset) {
        await onPasswordReset(email);
        setResetSent(true);
      }
    } catch (err: any) {
      setLocalError('Erreur lors de l\'envoi de l\'email de réinitialisation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setIsLoading(true);

    if (!email.trim() || !password.trim()) {
      setLocalError('Veuillez remplir tous les champs obligatoires.');
      setIsLoading(false);
      return;
    }

    try {
      if (isRegistering && onEmailRegister) {
        await onEmailRegister(email, password, rememberMe);
      } else if (!isRegistering && onEmailLogin) {
        await onEmailLogin(email, password, rememberMe);
      }
    } catch (err: any) {
      let errorMessage = 'Une erreur inattendue est survenue. Veuillez réessayer.';
      const errorCode = err.code || '';
      const rawMessage = err.message || '';

      // Detailed and user-friendly error mapping
      if (errorCode === 'auth/invalid-credential' || errorCode === 'auth/wrong-password') {
        errorMessage = 'Email ou mot de passe incorrect.';
      } else if (errorCode === 'auth/user-not-found') {
        errorMessage = 'Compte non trouvé. Veuillez vérifier votre email ou créer un compte.';
      } else if (errorCode === 'auth/email-already-in-use') {
        errorMessage = 'Cette adresse email est déjà utilisée par un autre compte.';
      } else if (errorCode === 'auth/invalid-email') {
        errorMessage = 'Format d\'email invalide.';
      } else if (errorCode === 'auth/weak-password') {
        errorMessage = 'Le mot de passe doit contenir au moins 6 caractères.';
      } else if (errorCode === 'auth/too-many-requests') {
        errorMessage = 'Trop de tentatives échouées. Compte temporairement bloqué.';
      } else if (rawMessage.includes('invalid-credential') || rawMessage.includes('wrong-password')) {
        errorMessage = 'Email ou mot de passe incorrect.';
      }
      
      setLocalError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLocalError(null);
    setIsLoading(true);
    try {
      if (onLogin) {
        await onLogin(rememberMe);
      }
    } catch (err: any) {
      let errorMessage = err.message || 'Une erreur est survenue avec Google.';
      setLocalError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] p-4 relative overflow-hidden font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-white/10">
          <div className="p-10">
            {/* Logo Section */}
            <div className="flex justify-center mb-6">
              <div className="p-3 bg-white rounded-3xl shadow-lg border-4 border-[#1e293b]">
                {company.logo ? (
                  <img src={company.logo} alt="Logo" className="h-20 w-20 object-contain" referrerPolicy="no-referrer" />
                ) : (
                  <div className="h-20 w-20 bg-slate-100 flex items-center justify-center rounded-2xl">
                    <ShieldCheck size={40} className="text-[#1e293b]" />
                  </div>
                )}
              </div>
            </div>

            {/* Header Content */}
            <div className="text-center mb-8">
              <h1 className="text-3xl font-black text-[#1e293b] tracking-tight uppercase">ESVE-GESTION</h1>
              <p className="text-[#64748b] font-medium mt-1">Accédez à votre espace personnel</p>
            </div>

            {/* Error Message */}
            <AnimatePresence>
              {(error || localError) && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm font-bold text-center flex items-center justify-center gap-2"
                >
                  <Lock size={16} />
                  {error || localError}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Username/Email Input */}
              <div className="relative group">
                <input
                  type="email"
                  required
                  placeholder="Nom d'utilisateur*"
                  className="w-full px-6 py-4 bg-white border-2 border-[#e2e8f0] rounded-2xl focus:border-[#1e293b] outline-none transition-all text-base font-semibold placeholder:text-gray-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              {/* Password Input */}
              <div className="relative group">
                <input
                  type="password"
                  required
                  placeholder="Mot de passe*"
                  className="w-full px-6 py-4 bg-white border-2 border-[#e2e8f0] rounded-2xl focus:border-[#1e293b] outline-none transition-all text-base font-semibold placeholder:text-gray-400"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {!isRegistering && (
                <div className="flex justify-end pr-2">
                  <button 
                    type="button"
                    onClick={() => setShowReset(true)}
                    className="text-sm font-bold text-[#64748b] hover:text-[#1e293b] transition-colors"
                  >
                    Mot de passe oublié ?
                  </button>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#111827] hover:bg-black text-white font-black text-lg py-4 rounded-2xl transition-all shadow-xl active:scale-[0.98] disabled:opacity-70"
              >
                {isLoading ? 'Chargement...' : (isRegistering ? 'S\'enregistrer' : 'Se connecter')}
              </button>
            </form>

            {/* OR Separator */}
            <div className="relative flex items-center my-8">
              <div className="flex-grow border-t border-gray-200"></div>
              <span className="flex-shrink-0 mx-4 text-gray-400 text-sm font-medium">ou</span>
              <div className="flex-grow border-t border-gray-200"></div>
            </div>

            {/* Create Account Button */}
            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full bg-[#d97706] hover:bg-[#b45309] text-white font-black text-lg py-4 rounded-2xl transition-all shadow-lg shadow-orange-100 flex items-center justify-center gap-2 active:scale-[0.98]"
            >
              🚀 {isRegistering ? 'Me connecter à mon compte' : 'Créer mon compte gratuitement'}
            </button>

            {/* Secondary Actions */}
            <div className="mt-8 text-center">
              <button 
                onClick={() => window.location.href = '/'}
                className="text-[#d97706] font-bold text-base hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                ← Retour à la page d'accueil
              </button>
            </div>

            {/* Google Logic (Optional in UI but kept for functionality) */}
            {!isRegistering && (
              <div className="mt-4 pt-4 border-t border-gray-50 flex justify-center">
                 <button onClick={handleGoogleLogin} className="text-xs text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest font-bold">
                    Ou utiliser Google
                 </button>
              </div>
            )}
          </div>

          {/* Footer Credits */}
          <div className="bg-[#fcfcfc] border-t border-gray-100 py-10 px-8 text-center space-y-3">
            <div className="w-full h-px bg-gray-100 max-w-[100px] mx-auto mb-6"></div>
            <p className="text-[12px] text-gray-400 leading-relaxed font-medium">
              Application développée par <span className="font-bold text-gray-500">Soulama Moumouni Abdoul Wahid</span> & <span className="font-bold text-gray-500">Koné Rachid</span>
            </p>
            <p className="text-[11px] text-gray-300 font-medium tracking-tight">
              Étudiants en 3ème année de Licence — Génie Logiciel
            </p>
            <p className="text-[10px] text-gray-300 uppercase tracking-widest font-black">
              Université Virtuelle du Burkina Faso <span className="text-[8px] opacity-70">BF</span>
            </p>
          </div>
        </div>
      </motion.div>

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showReset && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowReset(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-3xl p-8 w-full max-w-sm shadow-2xl overflow-hidden"
            >
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 italic">
                  <Key size={32} />
                </div>
                <h3 className="text-xl font-black text-[#1e293b] uppercase tracking-tight">Réinitialisation</h3>
                
                {resetSent ? (
                  <div className="space-y-6">
                    <p className="text-sm text-green-600 font-bold bg-green-50 p-4 rounded-xl border border-green-100">
                      Un email a été envoyé à {email} pour réinitialiser votre mot de passe.
                    </p>
                    <button 
                      onClick={() => { setShowReset(false); setResetSent(false); }}
                      className="w-full bg-[#111827] text-white font-bold py-3 rounded-xl"
                    >
                      Retour à la connexion
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleResetPassword} className="space-y-6">
                    <p className="text-sm text-[#64748b]">Saisissez votre email pour recevoir un lien de réinitialisation.</p>
                    <input 
                      type="email"
                      required
                      placeholder="Votre email*"
                      className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl focus:border-[#1e293b] outline-none font-semibold"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                    {localError && <p className="text-xs text-red-500 font-bold">{localError}</p>}
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        type="button"
                        onClick={() => setShowReset(false)}
                        className="bg-gray-100 text-gray-600 font-bold py-3 rounded-xl"
                      >
                        Annuler
                      </button>
                      <button 
                        type="submit"
                        disabled={isLoading}
                        className="bg-[#111827] text-white font-bold py-3 rounded-xl disabled:opacity-70"
                      >
                        {isLoading ? 'Envoi...' : 'Envoyer'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
