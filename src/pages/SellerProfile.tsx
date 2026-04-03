import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, query, where, getDocs, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Review, UserProfile } from '../types';
import ProductCard from '../components/ProductCard';
import { User, Star, MessageSquare, ShoppingBag, ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';

export default function SellerProfile() {
  const { id } = useParams();
  const [seller, setSeller] = useState<UserProfile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    // Real-time seller profile
    const unsubSeller = onSnapshot(doc(db, 'users', id), (snap) => {
      if (snap.exists()) {
        setSeller({ uid: snap.id, ...(snap.data() as object) } as UserProfile);
      } else {
        setSeller(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Seller profile snapshot error:", err);
      setLoading(false);
    });

    // Real-time seller products
    const qProducts = query(collection(db, 'products'), where('sellerId', '==', id));
    const unsubProducts = onSnapshot(qProducts, (snap) => {
      setProducts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Product)));
    });

    // Real-time seller reviews
    const qReviews = query(collection(db, 'reviews'), where('sellerId', '==', id));
    const unsubReviews = onSnapshot(qReviews, (snap) => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...d.data() } as Review)));
    });

    return () => {
      unsubSeller();
      unsubProducts();
      unsubReviews();
    };
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20">
        <div className="animate-pulse space-y-8">
          <div className="h-48 bg-gray-100 rounded-[2rem]" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-64 bg-gray-50 rounded-3xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!seller) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-400">Vendeur non trouvé.</h2>
        <Link to="/" className="text-indigo-600 font-bold mt-4 inline-block">Retour à l'accueil</Link>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) 
    : "5.0";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link to={-1 as any} className="flex items-center gap-2 text-gray-500 font-bold hover:text-indigo-600 transition-all mb-8 group">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
        Retour
      </Link>

      {/* Header Profile */}
      <div className="bg-white border border-gray-100 rounded-[2.5rem] mb-16 shadow-2xl shadow-indigo-500/5 relative overflow-hidden">
        {/* Banner */}
        <div className="h-48 w-full bg-indigo-600 relative overflow-hidden">
          {seller.bannerURL ? (
            <img src={seller.bannerURL} alt="Banner" className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 opacity-60" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
        </div>

        <div className="px-8 md:px-12 pb-12 -mt-16 relative">
          <div className="flex flex-col md:flex-row items-end gap-8 md:gap-12">
            <div className="w-32 h-32 rounded-[2rem] bg-indigo-50 flex items-center justify-center border-4 border-white shadow-xl overflow-hidden">
              {seller.photoURL ? (
                <img src={seller.photoURL} alt={seller.displayName} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <User className="w-16 h-16 text-indigo-300" />
              )}
            </div>
            
            <div className="flex-1 text-center md:text-left pb-2">
              <div className="flex flex-col md:flex-row md:items-center gap-4 mb-4">
                <h1 className="text-4xl font-black text-gray-900 tracking-tight">{seller.displayName}</h1>
                <div className="flex items-center justify-center md:justify-start gap-2 px-4 py-2 bg-amber-50 text-amber-600 rounded-2xl font-black text-sm">
                  <Star className="w-4 h-4 fill-current" />
                  {averageRating} ({reviews.length} avis)
                </div>
                {seller.isVerified && (
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">Vérifié</span>
                )}
              </div>
              
              <div className="flex flex-wrap justify-center md:justify-start gap-6 text-gray-500 font-bold">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-indigo-500" />
                  {products.length} Articles
                </div>
                {seller.location && (
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 text-indigo-500">📍</span>
                    {seller.location}
                  </div>
                )}
              </div>
            </div>

            <Link 
              to={`/chat/${seller.uid}`}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20 flex items-center gap-3 mb-2"
            >
              <MessageSquare className="w-5 h-5" />
              Contacter le vendeur
            </Link>
          </div>

          {seller.bio && (
            <div className="mt-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-2">À propos</h3>
              <p className="text-gray-600 font-medium leading-relaxed">{seller.bio}</p>
            </div>
          )}
        </div>
      </div>

      {/* Products Grid */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Articles de {seller.displayName}</h2>
          <div className="h-1 flex-1 bg-gray-50 mx-8 rounded-full" />
        </div>

        {products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <ProductCard product={product} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-gray-50 rounded-[2rem] border-2 border-dashed border-gray-200">
            <ShoppingBag className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-400 font-bold text-xl">Aucun article en vente pour le moment.</p>
          </div>
        )}
      </div>
    </div>
  );
}
