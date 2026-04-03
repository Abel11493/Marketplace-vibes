import { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, orderBy, addDoc, onSnapshot } from 'firebase/firestore';
import { Product, UserProfile, Report } from '../types';
import { Users, Package, ShieldAlert, Trash2, ShieldCheck, UserMinus, Search, RefreshCcw, AlertTriangle, Star, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function AdminDashboard() {
  const { profile } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'products' | 'reports'>('users');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (profile?.role === 'admin' || profile?.email === 'jordeeahy@gmail.com') {
      setLoading(true);
      
      const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
        setUsers(snap.docs.map(doc => ({ uid: doc.id, ...(doc.data() as object) } as UserProfile)));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'users');
      });

      const unsubProducts = onSnapshot(query(collection(db, 'products'), orderBy('createdAt', 'desc')), (snap) => {
        setProducts(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Product)));
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'products');
      });

      const unsubReports = onSnapshot(query(collection(db, 'reports'), orderBy('createdAt', 'desc')), (snap) => {
        setReports(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Report)));
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'reports');
        setLoading(false);
      });

      return () => {
        unsubUsers();
        unsubProducts();
        unsubReports();
      };
    }
  }, [profile]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersSnap, productsSnap, reportsSnap] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'reports'), orderBy('createdAt', 'desc')))
      ]);

      setUsers(usersSnap.docs.map(doc => ({ uid: doc.id, ...(doc.data() as object) } as UserProfile)));
      setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Product)));
      setReports(reportsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Report)));
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, 'admin_fetch');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVerified = async (user: UserProfile) => {
    const newStatus = !user.isVerified;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), { isVerified: newStatus });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Action irréversible : Supprimer ce produit ?')) return;
    const path = `products/${id}`;
    try {
      await deleteDoc(doc(db, 'products', id));
      setProducts(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  };

  const handleToggleAdmin = async (user: UserProfile) => {
    const newRole = user.role === 'admin' ? 'seller' : 'admin';
    if (!confirm(`Changer le rôle de ${user.displayName} en ${newRole} ?`)) return;
    const path = `users/${user.uid}`;
    try {
      await updateDoc(doc(db, 'users', user.uid), { role: newRole });
      setUsers(prev => prev.map(u => u.uid === user.uid ? { ...u, role: newRole as any } : u));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleToggleFeatured = async (product: Product) => {
    const path = `products/${product.id}`;
    try {
      await updateDoc(doc(db, 'products', product.id), { isFeatured: !product.isFeatured });
      setProducts(prev => prev.map(p => p.id === product.id ? { ...p, isFeatured: !p.isFeatured } : p));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  const handleUpdateReportStatus = async (reportId: string, status: 'resolved' | 'dismissed') => {
    const path = `reports/${reportId}`;
    try {
      await updateDoc(doc(db, 'reports', reportId), { status });
      setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  };

  if (profile?.role !== 'admin' && profile?.email !== 'jordeeahy@gmail.com') {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShieldAlert className="w-16 h-16 text-red-500 mx-auto mb-6" />
        <h2 className="text-3xl font-black text-gray-900 mb-4">Accès Refusé</h2>
        <p className="text-gray-500">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
      </div>
    );
  }

  const filteredUsers = users.filter(u => 
    u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sellerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredReports = reports.filter(r => 
    r.reason.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.targetId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 flex items-center gap-3">
            Contrôle Administrateur
            <ShieldCheck className="text-indigo-600 w-8 h-8" />
          </h1>
          <p className="text-gray-500 font-medium italic">Inspection complète du système MarketVibe.</p>
        </div>
        
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Rechercher..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white border border-gray-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none"
            />
          </div>
          <button 
            onClick={fetchData}
            className="p-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-indigo-50 hover:text-indigo-600 transition-all"
          >
            <RefreshCcw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center">
              <Users className="text-indigo-600 w-5 h-5" />
            </div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Utilisateurs</span>
          </div>
          <div className="text-3xl font-black text-gray-900">{users.length}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Package className="text-purple-600 w-5 h-5" />
            </div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Produits</span>
          </div>
          <div className="text-3xl font-black text-gray-900">{products.length}</div>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-2">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <AlertTriangle className="text-amber-600 w-5 h-5" />
            </div>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Signalements</span>
          </div>
          <div className="text-3xl font-black text-gray-900">{reports.filter(r => r.status === 'pending').length}</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-8 p-1 bg-gray-100 rounded-2xl w-fit">
        <button 
          onClick={() => setActiveTab('users')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'users' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Utilisateurs
        </button>
        <button 
          onClick={() => setActiveTab('products')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'products' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Produits
        </button>
        <button 
          onClick={() => setActiveTab('reports')}
          className={`px-6 py-2 rounded-xl font-bold text-sm transition-all ${activeTab === 'reports' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
        >
          Signalements
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                {activeTab === 'users' ? (
                  <>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Utilisateur</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Rôle</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Date d'inscription</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </>
                ) : activeTab === 'products' ? (
                  <>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Produit</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Vendeur</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Prix</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </>
                ) : (
                  <>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Cible</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Raison</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Statut</th>
                    <th className="px-6 py-4 text-xs font-black text-gray-400 uppercase tracking-widest text-right">Actions</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {activeTab === 'users' ? (
                filteredUsers.map(user => (
                  <tr key={user.uid} className="hover:bg-gray-50/50 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
                          {user.photoURL ? <img src={user.photoURL} alt="" className="w-full h-full object-cover" /> : <Users className="w-5 h-5 text-gray-300" />}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900">{user.displayName}</div>
                          <div className="text-xs text-gray-400 font-medium">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.role === 'admin' ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                      {format(new Date(user.createdAt), 'dd MMM yyyy', { locale: fr })}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleToggleVerified(user)}
                          className={`p-2 rounded-xl transition-all ${user.isVerified ? 'text-blue-600 bg-blue-50' : 'text-gray-400 hover:text-blue-600'}`}
                          title={user.isVerified ? "Enlever la vérification" : "Vérifier l'utilisateur"}
                        >
                          <CheckCircle2 className={`w-5 h-5 ${user.isVerified ? 'fill-current' : ''}`} />
                        </button>
                        <button 
                          onClick={() => handleToggleAdmin(user)}
                          className="p-2 text-gray-400 hover:text-indigo-600 transition-all"
                          title="Changer le rôle"
                        >
                          <ShieldCheck className="w-5 h-5" />
                        </button>
                        <button className="p-2 text-gray-400 hover:text-red-600 transition-all" title="Bannir">
                          <UserMinus className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : activeTab === 'products' ? (
                filteredProducts.map(product => (
                  <tr key={product.id} className="hover:bg-gray-50/50 transition-all">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gray-100 overflow-hidden">
                          <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="font-bold text-gray-900">{product.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                      {product.sellerName}
                    </td>
                    <td className="px-6 py-4 font-bold text-indigo-600">
                      {product.price}€
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleToggleFeatured(product)}
                          className={`p-2 rounded-xl transition-all ${product.isFeatured ? 'text-amber-500 bg-amber-50' : 'text-gray-400 hover:text-amber-500'}`}
                          title="Mettre en vedette"
                        >
                          <Star className={`w-5 h-5 ${product.isFeatured ? 'fill-current' : ''}`} />
                        </button>
                        <button 
                          onClick={() => handleDeleteProduct(product.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                filteredReports.map(report => (
                  <tr key={report.id} className="hover:bg-gray-50/50 transition-all">
                    <td className="px-6 py-4">
                      <div className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{report.targetType}</div>
                      <div className="font-bold text-gray-900 truncate max-w-[200px]">{report.targetId}</div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 font-medium line-clamp-1">{report.reason}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        report.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                        report.status === 'resolved' ? 'bg-green-50 text-green-600' : 
                        'bg-gray-50 text-gray-400'
                      }`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {report.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => handleUpdateReportStatus(report.id, 'resolved')}
                              className="p-2 text-gray-400 hover:text-green-600 transition-all"
                              title="Marquer comme résolu"
                            >
                              <CheckCircle2 className="w-5 h-5" />
                            </button>
                            <button 
                              onClick={() => handleUpdateReportStatus(report.id, 'dismissed')}
                              className="p-2 text-gray-400 hover:text-red-600 transition-all"
                              title="Rejeter"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          
          {((activeTab === 'users' && filteredUsers.length === 0) || 
            (activeTab === 'products' && filteredProducts.length === 0) ||
            (activeTab === 'reports' && filteredReports.length === 0)) && (
            <div className="py-20 text-center">
              <Search className="w-10 h-10 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">Aucun résultat trouvé.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
