import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, onSnapshot, setDoc, deleteDoc, limit } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Product, Review } from '../types';
import { useAuth } from '../hooks/useAuth';
import ProductCard from '../components/ProductCard';
import { MessageSquare, ShoppingCart, ArrowLeft, ShieldCheck, Truck, RotateCcw, User, Star, Heart, Send, ShieldAlert, Share2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { showToast } from '../components/Toast';

import { handleFirestoreError, OperationType } from '../lib/firestoreUtils';

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [showReportModal, setShowReportModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Review form
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    const productRef = doc(db, 'products', id);
    const path = `products/${id}`;
    const unsubscribe = onSnapshot(productRef, (docSnap) => {
      if (docSnap.exists()) {
        const productData = { id: docSnap.id, ...(docSnap.data() as object) } as Product;
        setProduct(productData);
        
        // Fetch similar products
        const qSimilar = query(
          collection(db, 'products'),
          where('category', '==', productData.category),
          limit(5)
        );
        const unsubSimilar = onSnapshot(qSimilar, (similarSnap) => {
          setSimilarProducts(
            similarSnap.docs
              .map(d => ({ id: d.id, ...d.data() } as Product))
              .filter(p => p.id !== id)
              .slice(0, 4)
          );
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'products');
        });
        return () => unsubSimilar();
      } else {
        setProduct(null);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
      setLoading(false);
    });

    return unsubscribe;
  }, [id]);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    showToast('Lien copié dans le presse-papier !');
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    if (!product?.sellerId) return;

    const q = query(collection(db, 'reviews'), where('sellerId', '==', product.sellerId));
    const unsubscribe = onSnapshot(q, (snap) => {
      setReviews(snap.docs.map(d => ({ id: d.id, ...(d.data() as object) } as Review)));
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'reviews');
    });

    return unsubscribe;
  }, [product?.sellerId]);

  useEffect(() => {
    if (!user || !id) return;
    const favRef = doc(db, 'users', user.uid, 'favorites', id);
    const path = `users/${user.uid}/favorites/${id}`;
    const unsubscribe = onSnapshot(favRef, (doc) => {
      setIsFavorite(doc.exists());
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, path);
    });
    return unsubscribe;
  }, [user, id]);

  const toggleFavorite = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id) return;
    const favRef = doc(db, 'users', user.uid, 'favorites', id);
    const path = `users/${user.uid}/favorites/${id}`;
    try {
      if (isFavorite) {
        await deleteDoc(favRef);
        showToast('Retiré des favoris');
      } else {
        await setDoc(favRef, {
          userId: user.uid,
          productId: id,
          createdAt: new Date().toISOString()
        });
        showToast('Ajouté aux favoris !');
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  };

  const handleAddReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !product || !comment.trim()) return;

    setSubmittingReview(true);
    const path = 'reviews';
    try {
      const reviewData = {
        sellerId: product.sellerId,
        reviewerId: user.uid,
        reviewerName: profile?.displayName || 'Anonyme',
        rating,
        comment,
        createdAt: new Date().toISOString()
      };
      await addDoc(collection(db, 'reviews'), reviewData);
      setComment('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      navigate('/login');
      return;
    }
    if (!id || !reportReason.trim()) return;

    setIsReporting(true);
    const path = 'reports';
    try {
      await addDoc(collection(db, 'reports'), {
        reporterId: user.uid,
        targetId: id,
        targetType: 'product',
        reason: reportReason,
        status: 'pending',
        createdAt: new Date().toISOString()
      });
      setShowReportModal(false);
      setReportReason('');
      showToast('Merci. Votre signalement a été envoyé aux administrateurs.');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    } finally {
      setIsReporting(false);
    }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-20 animate-pulse bg-gray-50 rounded-3xl h-[600px]" />;
  if (!product) return <div className="text-center py-20 font-bold text-gray-500">Produit non trouvé.</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex justify-between items-center mb-8">
        <button 
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-500 font-bold hover:text-indigo-600 transition-all group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Retour
        </button>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleShare}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${copied ? 'bg-green-50 text-green-600' : 'bg-gray-50 text-gray-500 hover:text-indigo-600'}`}
          >
            {copied ? 'Lien copié !' : 'Partager'}
          </button>
          
          <button 
            onClick={toggleFavorite}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all ${isFavorite ? 'bg-red-50 text-red-600' : 'bg-gray-50 text-gray-500 hover:text-red-600'}`}
          >
            <Heart className={`w-5 h-5 ${isFavorite ? 'fill-current' : ''}`} />
            {isFavorite ? 'Favori' : 'Ajouter aux favoris'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 mb-20">
        {/* Images */}
        <div className="space-y-6">
          <div className="aspect-square rounded-[2rem] overflow-hidden bg-gray-50 border border-gray-100 shadow-2xl shadow-indigo-500/5 relative">
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className={`w-full h-full object-cover ${product.status === 'sold' ? 'grayscale' : ''}`}
              referrerPolicy="no-referrer"
            />
            {product.status === 'sold' && (
              <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center">
                <span className="px-8 py-3 bg-white text-gray-900 rounded-full font-black text-xl uppercase tracking-widest shadow-2xl">Vendu</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="flex flex-col">
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                {product.category}
              </span>
              {product.condition && (
                <span className="px-3 py-1 bg-gray-100 text-gray-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                  {product.condition === 'new' ? 'Neuf' : 
                   product.condition === 'used_like_new' ? 'Comme neuf' :
                   product.condition === 'used_good' ? 'Bon état' : 'État correct'}
                </span>
              )}
              {product.isFeatured && (
                <span className="px-3 py-1 bg-amber-50 text-amber-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                  Vedette
                </span>
              )}
            </div>
            <h1 className="text-5xl font-black text-gray-900 tracking-tight mb-4">{product.name}</h1>
            <div className="text-4xl font-black text-indigo-600">{product.price}€</div>
          </div>

          <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100 mb-8">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Description</h3>
            <p className="text-gray-600 leading-relaxed font-medium">
              {product.description}
            </p>
          </div>

          <div className="flex flex-col gap-4 mb-12">
            <Link 
              to={product.status === 'sold' ? '#' : `/chat/${product.sellerId}`}
              className={`w-full py-5 rounded-2xl font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-3 ${product.status === 'sold' ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-500/20'}`}
            >
              <MessageSquare className="w-6 h-6" />
              {product.status === 'sold' ? 'Cet article est vendu' : 'Contacter pour acheter (Paiement direct)'}
            </Link>
            <p className="text-center text-sm text-gray-400 font-medium italic">
              * Le paiement s'effectue directement entre vous et le vendeur pour plus de sécurité.
            </p>
          </div>

          {/* Seller Info */}
          <Link 
            to={`/seller/${product.sellerId}`}
            className="flex items-center gap-4 p-6 border border-gray-100 rounded-3xl mb-8 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all group"
          >
            <div className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center overflow-hidden group-hover:bg-indigo-100 transition-colors">
              <User className="w-6 h-6 text-gray-300 group-hover:text-indigo-400 transition-colors" />
            </div>
            <div>
              <div className="text-xs font-black text-gray-400 uppercase tracking-widest">Vendu par</div>
              <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{product.sellerName}</div>
              <div className="flex items-center gap-1 mt-1">
                <Star className="w-3 h-3 text-amber-400 fill-current" />
                <span className="text-xs font-bold text-gray-600">
                  {reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1) : "5.0"}
                  ({reviews.length})
                </span>
              </div>
            </div>
          </Link>

          <button 
            onClick={() => setShowReportModal(true)}
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors mt-auto"
          >
            <ShieldAlert className="w-4 h-4" />
            Signaler cet article
          </button>
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-black text-gray-900 mb-2">Signaler l'article</h3>
            <p className="text-gray-500 mb-6 font-medium">Pourquoi souhaitez-vous signaler cet article ?</p>
            
            <form onSubmit={handleReport}>
              <textarea 
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                placeholder="Ex: Contrefaçon, arnaque, contenu inapproprié..."
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-red-500/20 mb-6 text-sm font-medium min-h-[120px]"
                required
              />
              
              <div className="flex gap-4">
                <button 
                  type="button"
                  onClick={() => setShowReportModal(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-xl font-bold hover:bg-gray-200 transition-all"
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  disabled={isReporting}
                  className="flex-1 py-4 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all disabled:opacity-50"
                >
                  {isReporting ? 'Envoi...' : 'Signaler'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="mt-24 border-t border-gray-100 pt-20">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-black text-gray-900 mb-2 tracking-tight">Produits Similaires</h2>
              <p className="text-gray-500">D'autres articles dans la catégorie {product.category}.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {similarProducts.map(p => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 border-t border-gray-100 pt-20">
        <div className="lg:col-span-1">
          <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tight">Avis sur le vendeur</h2>
          <p className="text-gray-500 mb-8 font-medium">Découvrez ce que les autres acheteurs pensent de {product.sellerName}.</p>
          
          {user && user.uid !== product.sellerId && (
            <form onSubmit={handleAddReview} className="bg-gray-50 p-6 rounded-3xl border border-gray-100">
              <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest mb-4">Laisser un avis</h3>
              <div className="flex gap-2 mb-4">
                {[1, 2, 3, 4, 5].map(i => (
                  <button 
                    key={i} 
                    type="button"
                    onClick={() => setRating(i)}
                    className={`p-1 transition-all ${rating >= i ? 'text-amber-400' : 'text-gray-300'}`}
                  >
                    <Star className={`w-6 h-6 ${rating >= i ? 'fill-current' : ''}`} />
                  </button>
                ))}
              </div>
              <textarea 
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Votre expérience..."
                className="w-full p-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500/20 mb-4 text-sm font-medium min-h-[100px]"
                required
              />
              <button 
                disabled={submittingReview}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                Publier l'avis
              </button>
            </form>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          {reviews.length > 0 ? (
            reviews.map(review => (
              <div key={review.id} className="p-6 border border-gray-100 rounded-3xl hover:border-indigo-100 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center">
                      <User className="w-5 h-5 text-gray-300" />
                    </div>
                    <div>
                      <div className="font-bold text-gray-900">{review.reviewerName}</div>
                      <div className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                        {format(new Date(review.createdAt), 'dd MMMM yyyy', { locale: fr })}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star key={i} className={`w-3 h-3 ${review.rating >= i ? 'text-amber-400 fill-current' : 'text-gray-200'}`} />
                    ))}
                  </div>
                </div>
                <p className="text-gray-600 font-medium leading-relaxed italic">"{review.comment}"</p>
              </div>
            ))
          ) : (
            <div className="py-20 text-center bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200">
              <Star className="w-10 h-10 text-gray-200 mx-auto mb-4" />
              <p className="text-gray-400 font-bold">Aucun avis pour le moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
