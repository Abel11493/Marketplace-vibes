import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, limit, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { Sparkles, ArrowRight, ShieldCheck, Zap, Heart, Search, Filter } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { showToast } from '../components/Toast';
import { useStudio } from '../contexts/StudioContext';

import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

const CATEGORIES = ["Tous", "Electronique", "Mode", "Maison", "Loisirs"];

export default function Home() {
  const { config } = useStudio();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [recentProducts, setRecentProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("Tous");
  const [searchTerm, setSearchTerm] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [selectedCondition, setSelectedCondition] = useState("Tous");
  const [sortBy, setSortBy] = useState("newest");
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    const path = 'products';
    
    // Featured products
    const qFeatured = query(
      collection(db, 'products'),
      where('isFeatured', '==', true),
      limit(4)
    );
    
    // Recent products with optional category filter
    let qRecent;
    if (selectedCategory === "Tous") {
      qRecent = query(
        collection(db, 'products'),
        orderBy('createdAt', 'desc'),
        limit(24)
      );
    } else {
      qRecent = query(
        collection(db, 'products'),
        where('category', '==', selectedCategory),
        orderBy('createdAt', 'desc'),
        limit(24)
      );
    }

    const unsubFeatured = onSnapshot(qFeatured, (snap) => {
      setFeaturedProducts(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Product)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });

    const unsubRecent = onSnapshot(qRecent, (snap) => {
      setRecentProducts(snap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Product)));
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return () => {
      unsubFeatured();
      unsubRecent();
    };
  }, [selectedCategory]);

  const filteredRecent = recentProducts
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            p.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPrice = (!minPrice || p.price >= parseFloat(minPrice)) &&
                           (!maxPrice || p.price <= parseFloat(maxPrice));
      const matchesCondition = selectedCondition === "Tous" || p.condition === selectedCondition;
      const matchesAvailability = !showOnlyAvailable || p.status === 'available';
      
      return matchesSearch && matchesPrice && matchesCondition && matchesAvailability;
    })
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.price - b.price;
      if (sortBy === "price_desc") return b.price - a.price;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const clearFilters = () => {
    setSelectedCategory("Tous");
    setSearchTerm("");
    setMinPrice("");
    setMaxPrice("");
    setSelectedCondition("Tous");
    setSortBy("newest");
    setShowOnlyAvailable(true);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative pt-20 pb-32 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div 
            className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-3xl opacity-50 transition-all" 
            style={{ backgroundColor: config.theme.primaryColor + '20' }}
          />
          <div 
            className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-3xl opacity-50 transition-all"
            style={{ backgroundColor: config.theme.accentColor + '20' }}
          />
        </div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-8 transition-all"
            style={{ backgroundColor: config.theme.primaryColor + '10', color: config.theme.primaryColor }}
          >
            <Sparkles className="w-4 h-4" />
            Découvrez le futur du commerce local
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-6xl sm:text-7xl font-black text-gray-900 tracking-tight mb-8 leading-[1.1]"
          >
            {config.content.heroTitle.split(',').map((part, i) => (
              <React.Fragment key={i}>
                {part}{i === 0 && <br />}
              </React.Fragment>
            ))}
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-500 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            {config.content.heroSubtitle}
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link 
              to="/dashboard" 
              className="w-full sm:w-auto px-8 py-4 text-white rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-2 group"
              style={{ backgroundColor: config.theme.primaryColor, boxShadow: `0 20px 25px -5px ${config.theme.primaryColor}33` }}
            >
              Vendre un article
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <div className="w-full sm:w-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Rechercher un produit..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-80 pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-2xl font-bold text-lg outline-none focus:ring-2 transition-all"
                style={{ borderColor: config.theme.primaryColor + '20' }}
              />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Produits Phares</h2>
              <p className="text-gray-500">La crème de la crème sélectionnée pour vous.</p>
            </div>
          </div>

          {loading && featuredProducts.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse bg-gray-100 rounded-2xl aspect-[4/5]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Categories & Explorer */}
      <section className="py-24 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Explorer le Marché</h2>
              <p className="text-gray-500">Trouvez exactement ce que vous cherchez.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
              <button 
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg ${showFilters ? 'text-white' : 'bg-white text-gray-500 border border-gray-100 hover:bg-gray-50'}`}
                style={{ 
                  backgroundColor: showFilters ? config.theme.primaryColor : 'white',
                  boxShadow: showFilters ? `0 10px 15px -3px ${config.theme.primaryColor}33` : 'none'
                }}
              >
                <Filter className="w-4 h-4" />
                Filtres
                {(minPrice || maxPrice || selectedCondition !== "Tous" || !showOnlyAvailable) && (
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                )}
              </button>

              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-6 py-3 bg-white border border-gray-100 rounded-xl font-bold text-sm text-gray-500 outline-none focus:ring-2 transition-all appearance-none cursor-pointer"
                style={{ borderColor: config.theme.primaryColor + '10' }}
              >
                <option value="newest">Plus récents</option>
                <option value="price_asc">Prix croissant</option>
                <option value="price_desc">Prix décroissant</option>
              </select>
            </div>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden mb-12"
              >
                <div className="bg-white border border-gray-100 rounded-3xl p-8 grid grid-cols-1 md:grid-cols-4 gap-8 shadow-sm">
                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Catégories</label>
                    <div className="flex flex-wrap gap-2">
                      {CATEGORIES.map(cat => (
                        <button 
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-4 py-2 rounded-lg font-bold text-xs transition-all ${selectedCategory === cat ? 'bg-indigo-50 text-indigo-600' : 'bg-gray-50 text-gray-500 hover:bg-gray-100'}`}
                          style={selectedCategory === cat ? { backgroundColor: config.theme.primaryColor + '10', color: config.theme.primaryColor } : {}}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Prix</label>
                    <div className="flex items-center gap-2">
                      <input 
                        type="number" 
                        placeholder="Min" 
                        value={minPrice}
                        onChange={(e) => setMinPrice(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-2"
                        style={{ borderColor: config.theme.primaryColor + '10' }}
                      />
                      <span className="text-gray-300">-</span>
                      <input 
                        type="number" 
                        placeholder="Max" 
                        value={maxPrice}
                        onChange={(e) => setMaxPrice(e.target.value)}
                        className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-2"
                        style={{ borderColor: config.theme.primaryColor + '10' }}
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">État</label>
                    <select 
                      value={selectedCondition}
                      onChange={(e) => setSelectedCondition(e.target.value)}
                      className="w-full px-4 py-2 bg-gray-50 border border-gray-100 rounded-xl text-sm font-medium outline-none focus:ring-2"
                      style={{ borderColor: config.theme.primaryColor + '10' }}
                    >
                      <option value="Tous">Tous les états</option>
                      <option value="new">Neuf</option>
                      <option value="used_like_new">Comme neuf</option>
                      <option value="used_good">Bon état</option>
                      <option value="used_fair">État correct</option>
                    </select>
                  </div>

                  <div className="space-y-4">
                    <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Disponibilité</label>
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setShowOnlyAvailable(!showOnlyAvailable)}
                        className={`relative w-12 h-6 rounded-full transition-all ${showOnlyAvailable ? 'bg-indigo-600' : 'bg-gray-200'}`}
                        style={{ backgroundColor: showOnlyAvailable ? config.theme.primaryColor : '#e5e7eb' }}
                      >
                        <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${showOnlyAvailable ? 'translate-x-6' : ''}`} />
                      </button>
                      <span className="text-sm font-bold text-gray-600">Articles disponibles uniquement</span>
                    </div>
                    <button 
                      onClick={clearFilters}
                      className="text-xs font-bold hover:underline pt-2"
                      style={{ color: config.theme.primaryColor }}
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                <div key={i} className="animate-pulse bg-white rounded-2xl aspect-[4/5]" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
              {filteredRecent.length > 0 ? (
                filteredRecent.map(product => (
                  <ProductCard key={product.id} product={product} />
                ))
              ) : (
                <div className="col-span-full py-20 text-center bg-white rounded-3xl border-2 border-dashed border-gray-200">
                  <p className="text-gray-400 font-medium">Aucun produit trouvé dans cette catégorie.</p>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
      {/* Newsletter Section */}
      <section 
        className="py-24 rounded-[3rem] my-24 mx-4 sm:mx-8 relative overflow-hidden group transition-all"
        style={{ backgroundColor: config.theme.primaryColor }}
      >
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-64 h-64 bg-white rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full translate-x-1/2 translate-y-1/2 blur-3xl group-hover:scale-150 transition-transform duration-1000" />
        </div>
        
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl sm:text-5xl font-black text-white mb-6 tracking-tight">
            Ne manquez plus aucune bonne affaire
          </h2>
          <p className="text-indigo-100 text-lg mb-10 font-medium max-w-2xl mx-auto">
            Inscrivez-vous à notre newsletter pour recevoir les meilleures offres et les nouveaux produits en avant-première.
          </p>
          
          <form 
            onSubmit={(e) => {
              e.preventDefault();
              showToast('Merci pour votre inscription !');
              (e.target as HTMLFormElement).reset();
            }}
            className="flex flex-col sm:flex-row gap-4 max-w-lg mx-auto"
          >
            <input 
              type="email" 
              placeholder="Votre adresse email" 
              required
              className="flex-1 px-6 py-4 bg-white/10 border border-white/20 rounded-2xl text-white placeholder:text-indigo-200 outline-none focus:ring-2 focus:ring-white/30 backdrop-blur-md font-bold"
            />
            <button 
              type="submit"
              className="px-8 py-4 bg-white rounded-2xl font-black hover:bg-indigo-50 transition-all shadow-xl shadow-black/10 active:scale-95"
              style={{ color: config.theme.primaryColor }}
            >
              S'abonner
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
