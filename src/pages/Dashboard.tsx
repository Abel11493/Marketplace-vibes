import { useParams, useNavigate, Link } from 'react-router-dom';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Product } from '../types';
import { Plus, Trash2, Edit2, Package, Tag, Euro, Image as ImageIcon, CheckCircle2, AlertCircle, X, TrendingUp, ShoppingBag, DollarSign, BarChart3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { showToast } from '../components/Toast';

import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [condition, setCondition] = useState<'new' | 'used_like_new' | 'used_good' | 'used_fair'>('new');
  const [imageUrl, setImageUrl] = useState('');
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'products'), where('sellerId', '==', user.uid));
    const path = 'products';
    const unsubscribe = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Product)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const stats = useMemo(() => {
    const total = products.length;
    const sold = products.filter(p => p.status === 'sold').length;
    const available = total - sold;
    const totalValue = products.reduce((acc, p) => acc + p.price, 0);
    const soldValue = products.filter(p => p.status === 'sold').reduce((acc, p) => acc + p.price, 0);

    const categoryData = products.reduce((acc: any[], p) => {
      const existing = acc.find(item => item.name === p.category);
      if (existing) {
        existing.value += 1;
      } else {
        acc.push({ name: p.category, value: 1 });
      }
      return acc;
    }, []);

    return { total, sold, available, totalValue, soldValue, categoryData };
  }, [products]);

  const handleToggleSold = async (product: Product) => {
    const newStatus = product.status === 'sold' ? 'available' : 'sold';
    const path = `products/${product.id}`;
    try {
      await updateDoc(doc(db, 'products', product.id), { status: newStatus });
      showToast(newStatus === 'sold' ? 'Produit marqué comme vendu' : 'Produit remis en vente');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
      setError("Erreur lors de la mise à jour du statut.");
      showToast('Erreur lors de la mise à jour', 'error');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    if (file.size > 500 * 1024) {
      setError("L'image est trop volumineuse (max 500Ko pour la base de données).");
      showToast("L'image est trop volumineuse", 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setBase64Image(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      setError("Vous devez être connecté pour publier.");
      return;
    }
    if (!profile) {
      setError("Chargement de votre profil vendeur en cours... Veuillez réessayer dans un instant.");
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    const path = 'products';
    try {
      const finalImageUrl = base64Image || imageUrl || `https://picsum.photos/seed/${Date.now()}/800/600`;
      
      await addDoc(collection(db, 'products'), {
        name,
        description,
        price: parseFloat(price) || 0,
        category,
        condition,
        images: [finalImageUrl],
        sellerId: user.uid,
        sellerName: profile.displayName || 'Vendeur MarketVibe',
        isFeatured: false,
        status: 'available',
        createdAt: new Date().toISOString()
      });
      
      setShowAddModal(false);
      resetForm();
      showToast('Produit ajouté avec succès !');
    } catch (error: any) {
      if (error.message?.includes('too large')) {
        setError("L'image est trop volumineuse pour la base de données. Essayez une image plus petite.");
        showToast("L'image est trop volumineuse", 'error');
      } else {
        handleFirestoreError(error, OperationType.CREATE, path);
        setError("Une erreur est survenue lors de la publication. Veuillez réessayer.");
        showToast("Erreur lors de la publication", 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet article ?')) return;
    const path = `products/${id}`;
    try {
      await deleteDoc(doc(db, 'products', id));
      showToast('Produit supprimé');
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
      setError("Erreur lors de la suppression.");
      showToast('Erreur lors de la suppression', 'error');
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCategory('');
    setCondition('new');
    setImageUrl('');
    setBase64Image(null);
  };

  const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2">Tableau de Bord</h1>
          <p className="text-gray-500 font-medium">Gérez vos articles et suivez vos performances.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20"
        >
          <Plus className="w-5 h-5" />
          Ajouter un produit
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Total Articles</p>
              <h3 className="text-2xl font-black text-gray-900">{stats.total}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-green-600">
            <TrendingUp className="w-3 h-3" />
            <span>{stats.available} en ligne</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Ventes</p>
              <h3 className="text-2xl font-black text-gray-900">{stats.sold}</h3>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
            <span>{stats.total > 0 ? Math.round((stats.sold / stats.total) * 100) : 0}% de conversion</span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600">
              <DollarSign className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Valeur Totale</p>
              <h3 className="text-2xl font-black text-gray-900">{stats.totalValue}€</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400">Valeur de votre inventaire</p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Chiffre d'Affaires</p>
              <h3 className="text-2xl font-black text-gray-900">{stats.soldValue}€</h3>
            </div>
          </div>
          <p className="text-xs font-bold text-gray-400">Articles marqués comme vendus</p>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <BarChart3 className="w-5 h-5 text-indigo-600" />
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Répartition par Catégorie</h3>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.categoryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 700 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: '#9ca3af', fontSize: 12, fontWeight: 700 }}
                />
                <Tooltip 
                  cursor={{ fill: '#f9fafb' }}
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {stats.categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-indigo-600 p-8 rounded-3xl text-white shadow-xl shadow-indigo-500/20 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-black mb-2 tracking-tight">Conseil Pro</h3>
            <p className="text-indigo-100 text-sm leading-relaxed mb-6">
              Les articles avec des photos de haute qualité et des descriptions détaillées se vendent en moyenne 3x plus vite. N'oubliez pas de marquer vos articles comme vendus pour garder votre inventaire à jour !
            </p>
          </div>
          <div className="space-y-4">
            <div className="p-4 bg-white/10 rounded-2xl border border-white/10">
              <p className="text-xs font-bold uppercase tracking-widest opacity-70 mb-1">Taux de vente</p>
              <p className="text-2xl font-black">{stats.total > 0 ? Math.round((stats.sold / stats.total) * 100) : 0}%</p>
            </div>
            <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-bold hover:bg-indigo-50 transition-all">
              Optimiser mes annonces
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 h-64 rounded-3xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {products.map(product => (
            <div key={product.id} className={`bg-white border border-gray-100 rounded-3xl overflow-hidden hover:shadow-xl hover:shadow-indigo-500/5 transition-all group ${product.status === 'sold' ? 'opacity-75' : ''}`}>
              <div className="aspect-video bg-gray-50 relative overflow-hidden">
                <img src={product.images[0]} alt="" className={`w-full h-full object-cover ${product.status === 'sold' ? 'grayscale' : ''}`} />
                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => handleToggleSold(product)}
                    className={`p-2 rounded-xl shadow-lg transition-all ${product.status === 'sold' ? 'bg-green-500 text-white' : 'bg-white text-gray-600 hover:text-green-600'}`}
                    title={product.status === 'sold' ? "Remettre en vente" : "Marquer comme vendu"}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                  </button>
                  <button className="p-2 bg-white rounded-xl shadow-lg text-gray-600 hover:text-indigo-600 transition-all">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(product.id)}
                    className="p-2 bg-white rounded-xl shadow-lg text-gray-600 hover:text-red-600 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                {product.status === 'sold' && (
                  <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-[2px] flex items-center justify-center">
                    <span className="px-6 py-2 bg-white text-gray-900 rounded-full font-black text-sm uppercase tracking-widest">Vendu</span>
                  </div>
                )}
              </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                  <span className="text-indigo-600 font-black text-lg">{product.price}€</span>
                </div>
                <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
                  <div className="flex items-center gap-1">
                    <Tag className="w-4 h-4" />
                    {product.category}
                  </div>
                  <div className="flex items-center gap-1">
                    <CheckCircle2 className={`w-4 h-4 ${product.status === 'sold' ? 'text-gray-300' : 'text-green-500'}`} />
                    {product.status === 'sold' ? 'Vendu' : 'En ligne'}
                  </div>
                </div>
              </div>
            </div>
          ))}
          
          {products.length === 0 && (
            <div className="col-span-full py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-bold">Vous n'avez pas encore de produits.</p>
              <button 
                onClick={() => setShowAddModal(true)}
                className="text-indigo-600 font-bold mt-2 hover:underline"
              >
                Ajouter votre premier article
              </button>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Nouvel Article</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleAddProduct} className="p-8 space-y-6">
              {error && (
                <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Nom du produit</label>
                  <div className="relative">
                    <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input 
                      type="text" 
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
                      placeholder="Ex: iPhone 15 Pro"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Prix (€)</label>
                  <div className="relative">
                    <Euro className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                    <input 
                      type="number" 
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium"
                      placeholder="999"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Catégorie</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium appearance-none"
                    required
                  >
                    <option value="">Sélectionner une catégorie</option>
                    <option value="Electronique">Electronique</option>
                    <option value="Mode">Mode</option>
                    <option value="Maison">Maison</option>
                    <option value="Loisirs">Loisirs</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest">État</label>
                  <select 
                    value={condition}
                    onChange={(e) => setCondition(e.target.value as any)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium appearance-none"
                    required
                  >
                    <option value="new">Neuf</option>
                    <option value="used_like_new">Comme neuf</option>
                    <option value="used_good">Bon état</option>
                    <option value="used_fair">État correct</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium min-h-[120px]"
                  placeholder="Décrivez votre produit en détail..."
                  required
                />
              </div>

              <div className="space-y-4">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Image du produit</label>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div 
                      onClick={() => document.getElementById('fileInput')?.click()}
                      className={`aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden ${base64Image ? 'border-indigo-500 bg-indigo-50' : 'border-gray-200 hover:border-indigo-400 hover:bg-gray-50'}`}
                    >
                      {base64Image ? (
                        <img src={base64Image} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <>
                          <ImageIcon className="w-8 h-8 text-gray-300 mb-2" />
                          <span className="text-xs font-bold text-gray-400">Cliquez pour ajouter une photo</span>
                          <span className="text-[10px] text-gray-300">Max 500Ko</span>
                        </>
                      )}
                    </div>
                    <input 
                      id="fileInput"
                      type="file" 
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </div>

                  <div className="space-y-4">
                    <div className="relative">
                      <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-300" />
                      <input 
                        type="url" 
                        value={imageUrl}
                        onChange={(e) => {
                          setImageUrl(e.target.value);
                          setBase64Image(null);
                        }}
                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none font-medium text-sm"
                        placeholder="Ou collez une URL d'image..."
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 font-medium italic">
                      * Privilégiez l'ajout direct pour plus de fiabilité.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-bold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50"
                >
                  {isSubmitting ? 'Publication...' : 'Publier l\'article'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
