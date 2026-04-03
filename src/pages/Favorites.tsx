import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { Product } from '../types';
import ProductCard from '../components/ProductCard';
import { Heart, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Favorites() {
  const { user } = useAuth();
  const [favoriteProducts, setFavoriteProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const favsRef = collection(db, 'users', user.uid, 'favorites');
    const unsubscribe = onSnapshot(favsRef, async (snap) => {
      const productIds = snap.docs.map(doc => doc.id);
      
      if (productIds.length === 0) {
        setFavoriteProducts([]);
        setLoading(false);
        return;
      }

      const products = await Promise.all(
        productIds.map(async (id) => {
          const productDoc = await getDoc(doc(db, 'products', id));
          if (productDoc.exists()) {
            return { id: productDoc.id, ...(productDoc.data() as object) } as Product;
          }
          return null;
        })
      );

      setFavoriteProducts(products.filter(p => p !== null) as Product[]);
      setLoading(false);
    });

    return unsubscribe;
  }, [user]);

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse bg-gray-50 rounded-3xl h-[400px]" />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-12">
        <h1 className="text-4xl font-black text-gray-900 tracking-tight mb-2 flex items-center gap-3">
          Mes Favoris
          <Heart className="text-red-500 w-8 h-8 fill-current" />
        </h1>
        <p className="text-gray-500 font-medium">Retrouvez tous les articles que vous avez aimés.</p>
      </div>

      {favoriteProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {favoriteProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="py-32 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
          <div className="w-20 h-20 bg-white rounded-[2rem] shadow-lg flex items-center justify-center mx-auto mb-6">
            <Heart className="w-10 h-10 text-gray-200" />
          </div>
          <h2 className="text-2xl font-black text-gray-900 mb-2">Votre liste est vide</h2>
          <p className="text-gray-500 mb-8 max-w-xs mx-auto font-medium">Parcourez le marché et cliquez sur le coeur pour ajouter des articles ici.</p>
          <Link to="/" className="inline-flex items-center gap-2 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-500/20">
            <ShoppingBag className="w-5 h-5" />
            Explorer le marché
          </Link>
        </div>
      )}
    </div>
  );
}
