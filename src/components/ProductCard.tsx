import { Link } from 'react-router-dom';
import { Product } from '../types';
import { MessageSquare, ShoppingCart, Star, Heart } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { db } from '../lib/firebase';
import { doc, setDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { useState, useEffect } from 'react';

interface ProductCardProps {
  product: Product;
}

import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function ProductCard({ product }: ProductCardProps) {
  const { user } = useAuth();
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    if (!user) return;
    const favRef = doc(db, 'users', user.uid, 'favorites', product.id);
    const path = `users/${user.uid}/favorites/${product.id}`;
    const unsubscribe = onSnapshot(favRef, (doc) => {
      setIsFavorite(doc.exists());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsubscribe;
  }, [user, product.id]);

  const toggleFavorite = async (e: React.MouseEvent) => {
    e.preventDefault();
    if (!user) return;
    const favRef = doc(db, 'users', user.uid, 'favorites', product.id);
    const path = `users/${user.uid}/favorites/${product.id}`;
    try {
      if (isFavorite) {
        await deleteDoc(favRef);
      } else {
        await setDoc(favRef, {
          userId: user.uid,
          productId: product.id,
          createdAt: new Date().toISOString()
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all group">
      <Link to={`/product/${product.id}`} className="block relative aspect-square overflow-hidden bg-gray-50">
        <img 
          src={product.images[0] || `https://picsum.photos/seed/${product.id}/600/600`} 
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          referrerPolicy="no-referrer"
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.isFeatured && (
            <div className="bg-indigo-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1 shadow-lg shadow-indigo-500/20">
              <Star className="w-3 h-3 fill-current" />
              Vedette
            </div>
          )}
          {product.status === 'sold' && (
            <div className="bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1 shadow-lg shadow-red-500/20">
              Vendu
            </div>
          )}
          {product.condition && (
            <div className="bg-white/90 backdrop-blur-sm text-gray-900 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md flex items-center gap-1 shadow-sm border border-gray-100">
              {product.condition === 'new' ? 'Neuf' : 
               product.condition === 'used_like_new' ? 'Comme neuf' :
               product.condition === 'used_good' ? 'Bon état' : 'État correct'}
            </div>
          )}
        </div>
        <button 
          onClick={toggleFavorite}
          className={`absolute top-3 right-3 p-2 rounded-xl backdrop-blur-md transition-all ${isFavorite ? 'bg-red-500 text-white' : 'bg-white/80 text-gray-400 hover:text-red-500'}`}
        >
          <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>
      </Link>
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-2">
          <Link to={`/product/${product.id}`} className="text-lg font-bold text-gray-900 hover:text-indigo-600 transition-colors line-clamp-1">
            {product.name}
          </Link>
          <span className="text-indigo-600 font-bold text-lg">{product.price}€</span>
        </div>
        
        <p className="text-gray-500 text-sm line-clamp-2 mb-4 h-10">
          {product.description}
        </p>
        
        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider">Vendeur</span>
            <span className="text-sm font-medium text-gray-700">{product.sellerName}</span>
          </div>
          
          <div className="flex gap-2">
            <Link 
              to={`/chat/${product.sellerId}`}
              className="px-4 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 text-sm font-bold"
            >
              <MessageSquare className="w-4 h-4" />
              Contacter
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
