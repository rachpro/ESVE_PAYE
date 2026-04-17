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
import { Employee, PayrollSlipData, Company, Decharge } from './types';
import { DEFAULT_COMPANY } from './lib/calculations';
import { motion, AnimatePresence } from 'motion/react';
import { auth, googleProvider, db } from './firebase';
import { signInWithPopup, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const MOCK_EMPLOYEES: Employee[] = []; // Resetting data as requested

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [company, setCompany] = useState<Company>(DEFAULT_COMPANY);
  const [history, setHistory] = useState<PayrollSlipData[]>([]);
  const [currentSlip, setCurrentSlip] = useState<PayrollSlipData | null>(null);
  const [currentDecharge, setCurrentDecharge] = useState<Decharge | null>(null);
  const [dechargeHistory, setDechargeHistory] = useState<Decharge[]>([]);

  useEffect(() => {
    localStorage.setItem('employees_data', JSON.stringify(employees));
  }, [employees]);

  useEffect(() => {
    localStorage.setItem('payroll_history', JSON.stringify(history));
  }, [history]);

  useEffect(() => {
    localStorage.setItem('decharge_history', JSON.stringify(dechargeHistory));
  }, [dechargeHistory]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        let role = 'user';
        
        if (userDoc.exists()) {
          role = userDoc.data().role;
        } else {
          // Auto-admin for the owner email
          if (currentUser.email === 'konerachid12@gmail.com') {
            role = 'admin';
          }
          await setDoc(doc(db, 'users', currentUser.uid), {
            uid: currentUser.uid,
            email: currentUser.email,
            displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Utilisateur',
            role: role
          });
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

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setActiveTab('dashboard');
  };

  const handleGenerate = (slip: PayrollSlipData) => {
    setHistory([slip, ...history]);
    setCurrentSlip(slip);
    setActiveTab('preview');
  };

  const handleGenerateDecharge = (decharge: Decharge) => {
    setDechargeHistory([decharge, ...dechargeHistory]);
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
        error={user && !isAdmin ? "Désolé, votre compte n'a pas les droits d'administration pour accéder à ESVE." : null}
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

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard 
          history={history} 
          dechargeHistory={dechargeHistory}
          onViewSlip={handleViewSlip} 
          onViewDecharge={handleViewDecharge}
        />;
      case 'generate':
        return <PayrollForm employees={employees} company={company} onGenerate={handleGenerate} />;
      case 'decharge':
        return <DechargeForm company={company} onGenerate={handleGenerateDecharge} />;
      case 'decharge-preview':
        return currentDecharge ? <DechargeDocument data={currentDecharge} onUpdate={handleUpdateDecharge} /> : null;
      case 'settings':
        return <Settings company={company} onSave={handleSaveCompany} />;
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
        />;
      default:
        return <Dashboard 
          history={history} 
          dechargeHistory={dechargeHistory}
          onViewSlip={handleViewSlip} 
          onViewDecharge={handleViewDecharge}
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

