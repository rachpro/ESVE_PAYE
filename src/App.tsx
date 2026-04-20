/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { PayrollForm } from './components/PayrollForm';
import { PayrollSlip } from './components/PayrollSlip';
import { Settings } from './components/Settings';
import { EmployeeManagement } from './components/EmployeeManagement';
import { DechargeForm } from './components/DechargeForm';
import { DechargeDocument } from './components/DechargeDocument';
import { LoginPage } from './components/LoginPage';
import { TrashBin } from './components/TrashBin';
import { Employee, PayrollSlipData, Company, Decharge } from './types';
import { DEFAULT_COMPANY } from './lib/calculations';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, setPersistence, browserLocalPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const MOCK_EMPLOYEES: Employee[] = []; // Resetting data as requested

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState<Employee[]>(() => {
    const saved = localStorage.getItem('employees_data');
    return saved ? JSON.parse(saved) : [];
  });
  const [company, setCompany] = useState<Company>(() => {
    const saved = localStorage.getItem('company_info');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Patch old broken logo if it was cached
      if (parsed.logo === '/logo.png.jpg') {
        parsed.logo = '';
      }
      return parsed;
    }
    return DEFAULT_COMPANY;
  });
  const [history, setHistory] = useState<PayrollSlipData[]>(() => {
    const saved = localStorage.getItem('payroll_history');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    // Migration: Ensure all old slips have IDs
    return parsed.map((s: any) => ({
      ...s,
      id: s.id || Math.random().toString(36).substr(2, 9)
    }));
  });
  const [currentSlip, setCurrentSlip] = useState<PayrollSlipData | null>(null);
  const [currentDecharge, setCurrentDecharge] = useState<Decharge | null>(null);
  const [dechargeHistory, setDechargeHistory] = useState<Decharge[]>(() => {
    const saved = localStorage.getItem('decharge_history');
    if (!saved) return [];
    const parsed = JSON.parse(saved);
    // Migration: Ensure all old decharges have IDs
    return parsed.map((d: any) => ({
      ...d,
      id: d.id || Date.now().toString() + Math.random().toString(36).substr(2, 5)
    }));
  });
  
  const [trashedHistory, setTrashedHistory] = useState<PayrollSlipData[]>(() => {
    const saved = localStorage.getItem('trashed_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [trashedDecharges, setTrashedDecharges] = useState<Decharge[]>(() => {
    const saved = localStorage.getItem('trashed_decharges');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('employees_data', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('company_info', JSON.stringify(company));
  }, [company]);

  useEffect(() => {
    localStorage.setItem('payroll_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('decharge_history', JSON.stringify(dechargeHistory));
  }, [dechargeHistory]);
  
  useEffect(() => {
    localStorage.setItem('trashed_history', JSON.stringify(trashedHistory));
  }, [trashedHistory]);
  
  useEffect(() => {
    localStorage.setItem('trashed_decharges', JSON.stringify(trashedDecharges));
  }, [trashedDecharges]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        let role = 'user';
        
        // Super Utilisateurs définis en dur (Le créateur et le patron)
        const superUsers = ['konerachid12@gmail.com', 'direction@svequipement.com'];
        if (currentUser.email && superUsers.includes(currentUser.email)) {
          role = 'admin';
        }

        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            // S'il existe dans la BDD, on met à jour son rôle (sauf si c'est un super user qui force le role admin)
            if (role !== 'admin') {
               role = userDoc.data().role;
            }
          } else {
            // Création automatique du document dans Firestore : on assigne ADMIN par défaut pour ce prototype
            role = 'admin'; // TOUT NOUVEAU COMPTE EST ADMIN TEMPORAIREMENT POUR FACILITER LES TESTS
            await setDoc(doc(db, 'users', currentUser.uid), {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Utilisateur',
              role: role
            });
          }
        } catch (error) {
          console.error("Erreur avec Firestore (Règles de sécurité probables), connexion basique accordée", error);
        }
        
        setUser(currentUser);
        setIsAdmin(role === 'admin');
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async (rememberMe: boolean) => {
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      console.error("Login failed", error);
      throw error; // Renvoyer l'erreur à LoginPage
    }
  };

  const handleEmailLogin = async (email: string, pass: string, rememberMe: boolean) => {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    await signInWithEmailAndPassword(auth, email, pass);
  };

  const handleEmailRegister = async (email: string, pass: string, rememberMe: boolean) => {
    await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
    await createUserWithEmailAndPassword(auth, email, pass);
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('dashboard');
  };

  const handleGenerate = (slip: PayrollSlipData) => {
    setHistory(prev => [slip, ...prev]);
    setCurrentSlip(slip);
    setActiveTab('preview');
  };

  const handleGenerateDecharge = (decharge: Decharge) => {
    setDechargeHistory(prev => [decharge, ...prev]);
    setCurrentDecharge(decharge);
    setActiveTab('decharge-preview');
  };

  const handleSaveCompany = (newCompany: Company) => {
    setCompany(newCompany);
    localStorage.setItem('company_info', JSON.stringify(newCompany));
    setActiveTab('dashboard');
  };

  const handleAddEmployee = (emp: Employee) => {
    setEmployees([...employees, emp]);
  };

  const handleDeleteEmployee = (id: string) => {
    setEmployees(employees.filter(e => e.id !== id));
  };

  const handleUpdateEmployee = (emp: Employee) => {
    setEmployees(employees.map(e => e.id === emp.id ? emp : e));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#2563eb]"></div>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <LoginPage 
        company={company}
        onLogin={handleLogin}
        onEmailLogin={handleEmailLogin}
        onEmailRegister={handleEmailRegister}
        error={user && !isAdmin ? `Désolé, votre compte n'a pas les droits d'administration pour accéder à ${company.name}.` : null}
        onLogout={user && !isAdmin ? handleLogout : undefined}
      />
    );
  }

  const handleViewSlip = (slip: PayrollSlipData) => {
    setCurrentSlip(slip);
    setActiveTab('preview');
  };

  const handleViewDecharge = (decharge: Decharge) => {
    setCurrentDecharge(decharge);
    setActiveTab('decharge-preview');
  };

  const handleUpdateDecharge = (updated: Decharge) => {
    setDechargeHistory(dechargeHistory.map(d => d.id === updated.id ? updated : d));
    setCurrentDecharge(updated);
  };

  const handleDeleteSlip = (id: string, isPermanent = false) => {
    if (!id) {
      console.warn("Tentative de suppression d'un bulletin sans ID");
      return;
    }
    
    if (isPermanent) {
      setTrashedHistory(prev => prev.filter(s => s.id !== id));
    } else {
      // Use functional update to ensure we have the latest history
      setHistory(currentHistory => {
        const slipToTrash = currentHistory.find(s => s.id === id);
        if (slipToTrash) {
          setTrashedHistory(prev => [slipToTrash, ...prev]);
          return currentHistory.filter(s => s.id !== id);
        }
        return currentHistory;
      });
    }
  };

  const handleRestoreSlip = (id: string) => {
    if (!id) return;
    setTrashedHistory(currentTrashed => {
      const slip = currentTrashed.find(s => s.id === id);
      if (slip) {
        setHistory(prev => [slip, ...prev]);
        return currentTrashed.filter(s => s.id !== id);
      }
      return currentTrashed;
    });
  };

  const handleDeleteDecharge = (id: string, isPermanent = false) => {
    if (!id) {
      console.warn("Tentative de suppression d'une décharge sans ID");
      return;
    }
    
    if (isPermanent) {
      setTrashedDecharges(prev => prev.filter(d => d.id !== id));
    } else {
      setDechargeHistory(currentHistory => {
        const dechargeToTrash = currentHistory.find(d => d.id === id);
        if (dechargeToTrash) {
          setTrashedDecharges(prev => [dechargeToTrash, ...prev]);
          return currentHistory.filter(d => d.id !== id);
        }
        return currentHistory;
      });
    }
  };

  const handleRestoreDecharge = (id: string) => {
    if (!id) return;
    setTrashedDecharges(currentTrashed => {
      const decharge = currentTrashed.find(d => d.id === id);
      if (decharge) {
        setDechargeHistory(prev => [decharge, ...prev]);
        return currentTrashed.filter(d => d.id !== id);
      }
      return currentTrashed;
    });
  };

  const handleResetAllData = () => {
    if (window.confirm("CETTE ACTION EST IRRÉVERSIBLE. Voulez-vous vraiment supprimer TOUS les bulletins, décharges, employés et informations d'entreprise de votre stockage local ?")) {
      setEmployees([]);
      setHistory([]);
      setDechargeHistory([]);
      setTrashedHistory([]);
      setTrashedDecharges([]);
      setCompany(DEFAULT_COMPANY);
      localStorage.clear();
      setActiveTab('dashboard');
      alert("Toutes les données ont été réinitialisées.");
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
          history={history} 
          dechargeHistory={dechargeHistory}
          onViewSlip={handleViewSlip} 
          onViewDecharge={handleViewDecharge}
          onDeleteSlip={(id) => handleDeleteSlip(id, false)}
          onDeleteDecharge={(id) => handleDeleteDecharge(id, false)}
          onReset={handleResetAllData}
        />;
      case 'generate':
        return <PayrollForm employees={employees} company={company} onGenerate={handleGenerate} />;
      case 'decharge':
        return <DechargeForm company={company} onGenerate={handleGenerateDecharge} />;
      case 'decharge-preview':
        return currentDecharge ? <DechargeDocument data={currentDecharge} onUpdate={handleUpdateDecharge} /> : null;
      case 'settings':
        return <Settings company={company} onSave={handleSaveCompany} onReset={handleResetAllData} />;
      case 'preview':
        return currentSlip ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <PayrollSlip data={currentSlip} />
          </motion.div>
        ) : (
          <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-300">
            <p className="text-gray-500">Aucun bulletin à afficher. Générez-en un d'abord.</p>
            <button 
              onClick={() => setActiveTab('generate')}
              className="mt-4 text-blue-600 font-bold hover:underline"
            >
              Générer un bulletin
            </button>
          </div>
        );
      case 'employees':
        return (
          <EmployeeManagement 
            employees={employees} 
            onAdd={handleAddEmployee} 
            onDelete={handleDeleteEmployee} 
            onUpdate={handleUpdateEmployee} 
          />
        );
      case 'history':
        return <Dashboard 
          history={history} 
          dechargeHistory={dechargeHistory}
          onViewSlip={handleViewSlip} 
          onViewDecharge={handleViewDecharge}
          onDeleteSlip={(id) => handleDeleteSlip(id, false)}
          onDeleteDecharge={(id) => handleDeleteDecharge(id, false)}
          onReset={handleResetAllData}
        />;
      case 'corbeille':
        return <TrashBin 
          trashedHistory={trashedHistory}
          trashedDecharges={trashedDecharges}
          onRestoreSlip={handleRestoreSlip}
          onRestoreDecharge={handleRestoreDecharge}
          onDeleteSlip={(id) => handleDeleteSlip(id, true)}
          onDeleteDecharge={(id) => handleDeleteDecharge(id, true)}
        />;
      default:
        return <Dashboard 
          history={history} 
          dechargeHistory={dechargeHistory}
          onViewSlip={handleViewSlip} 
          onViewDecharge={handleViewDecharge}
          onDeleteSlip={(id) => handleDeleteSlip(id, false)}
          onDeleteDecharge={(id) => handleDeleteDecharge(id, false)}
          onReset={handleResetAllData}
        />;
    }
  };


  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} company={company}>
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </Layout>
  );
}

