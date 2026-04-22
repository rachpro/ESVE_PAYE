import React, { useEffect, useState } from 'react';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { AppUser, UserRole } from '../types';
import { UserCog, Shield, Edit, Eye, Trash2, Search, Filter, Check, X, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'users'), orderBy('email', 'asc'));
      const querySnapshot = await getDocs(q);
      const usersData: AppUser[] = [];
      querySnapshot.forEach((doc) => {
        usersData.push(doc.data() as AppUser);
      });
      setUsers(usersData);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'users');
    } finally {
      setLoading(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: UserRole) => {
    try {
      setIsUpdating(true);
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { role: newRole });
      setUsers(prev => prev.map(u => u.uid === userId ? { ...u, role: newRole } : u));
      setEditingUserId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteUserRecord = async (userId: string) => {
    // Prevent self-deletion
    if (userId === auth.currentUser?.uid) {
      alert("Vous ne pouvez pas supprimer votre propre compte.");
      setConfirmDeleteId(null);
      return;
    }
    
    // Prevent deleting other super admins if you are not the main one
    const superUsers = ['konerachid12@gmail.com', 'direction@svequipement.com'];
    const targetUser = users.find(u => u.uid === userId);
    if (targetUser && superUsers.includes(targetUser.email) && auth.currentUser?.email !== 'konerachid12@gmail.com') {
      alert("Vous n'avez pas les droits pour supprimer un super-administrateur.");
      setConfirmDeleteId(null);
      return;
    }

    try {
      setIsUpdating(true);
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(u => u.uid !== userId));
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `users/${userId}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'editor': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-muted border-gray-200';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Shield size={14} />;
      case 'editor': return <Edit size={14} />;
      case 'viewer': return <Eye size={14} />;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-muted font-medium">Chargement des utilisateurs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3">
            <UserCog className="text-primary" />
            Gestion des Utilisateurs
          </h1>
          <p className="text-muted text-sm mt-1">Assignez des rôles et gérez les accès à l'application.</p>
        </div>
        
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Rechercher..." 
            className="w-full pl-10 pr-4 py-2 border border-border rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-border overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-border">
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Utilisateur</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Rôle Actuel</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider">Dernière Connexion</th>
                <th className="px-6 py-4 text-xs font-bold text-muted uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredUsers.map((user) => (
                <tr key={user.uid} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {user.displayName.charAt(0)}
                      </div>
                      <div>
                        <div className="font-semibold text-text-main">{user.displayName}</div>
                        <div className="text-xs text-muted">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {editingUserId === user.uid ? (
                      <div className="flex items-center gap-2">
                        <select 
                          className="text-xs p-2 border border-border rounded-lg outline-none bg-white font-medium"
                          value={user.role}
                          onChange={(e) => updateUserRole(user.uid, e.target.value as UserRole)}
                          disabled={isUpdating}
                        >
                          <option value="admin">Administrateur</option>
                          <option value="editor">Éditeur</option>
                          <option value="viewer">Lecteur</option>
                        </select>
                        <button 
                          onClick={() => setEditingUserId(null)}
                          className="p-1 hover:bg-gray-200 rounded-lg transition-colors"
                        >
                          <X size={16} className="text-gray-500" />
                        </button>
                      </div>
                    ) : (
                      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${getRoleBadgeColor(user.role)}`}>
                        {getRoleIcon(user.role)}
                        {user.role === 'admin' ? 'Administrateur' : user.role === 'editor' ? 'Éditeur' : 'Lecteur'}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Jamais'}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => setEditingUserId(user.uid)}
                        className="p-2 text-gray-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-all"
                        title="Modifier le rôle"
                      >
                        <UserCog size={18} />
                      </button>
                      <button 
                        onClick={() => {
                          setConfirmDeleteId(user.uid);
                          setDeleteConfirmationInput('');
                        }}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                        title="Supprimer l'accès"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-muted italic">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl flex gap-4 items-start">
        <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
          <Shield size={24} />
        </div>
        <div className="space-y-1">
          <h3 className="font-bold text-blue-900">Niveaux de Permissions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
            <div>
              <div className="text-xs font-black text-blue-800 uppercase tracking-wider mb-2">Administrateur</div>
              <p className="text-xs text-blue-700 leading-relaxed">Accès complet à toutes les fonctionnalités, y compris la gestion des utilisateurs, les paramètres de l'entreprise et la réinitialisation des données.</p>
            </div>
            <div>
              <div className="text-xs font-black text-blue-800 uppercase tracking-wider mb-2">Éditeur</div>
              <p className="text-xs text-blue-700 leading-relaxed">Peut gérer les employés, générer des bulletins et des décharges, consulter l'historique et gérer la corbeille.</p>
            </div>
            <div>
              <div className="text-xs font-black text-blue-800 uppercase tracking-wider mb-2">Lecteur (Viewer)</div>
              <p className="text-xs text-blue-700 leading-relaxed">Peut uniquement consulter le tableau de bord et l'historique en lecture seule. Ne peut pas modifier ou supprimer de données.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {confirmDeleteId && (
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-red-50 text-center"
            >
              <div className="w-16 h-16 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={36} />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Supprimer l'accès ?</h3>
              <p className="text-gray-500 mb-6 text-sm">Cet utilisateur ne pourra plus accéder à l'application. Pour confirmer la suppression de <b>{users.find(u => u.uid === confirmDeleteId)?.displayName}</b>, veuillez saisir son nom ci-dessous :</p>
              
              <div className="mb-8">
                <input 
                  type="text" 
                  placeholder="Tapez le nom de l'utilisateur" 
                  className="w-full px-4 py-3 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-100 focus:border-red-400 outline-none transition-all text-center font-medium"
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                />
              </div>

              <div className="flex gap-4">
                <button 
                  onClick={() => setConfirmDeleteId(null)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all text-sm"
                >
                  Annuler
                </button>
                <button 
                  onClick={() => deleteUserRecord(confirmDeleteId!)}
                  disabled={isUpdating || deleteConfirmationInput.trim().toLowerCase() !== (users.find(u => u.uid === confirmDeleteId)?.displayName || '').trim().toLowerCase()}
                  className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all shadow-lg shadow-red-100 flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
                >
                  {isUpdating ? <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin"></div> : 'Supprimer'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
