import React, { useState, useEffect } from "react";

// ==========================================
// INTERFACES TYPESCRIPT (Pour la sécurité du code)
// ==========================================
interface Product {
  id: number;
  name: string;
  price: number;
  oldPrice: number | null;
  category: string;
  rating: number;
  reviews: number;
  stock: number;
  image: string;
  badge: string | null;
  description: string;
}

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  items: number;
}

interface Customer {
  id: number;
  name: string;
  email: string;
  orders: number;
  total: number;
  joined: string;
  status: string;
}

// ==========================================
// DONNÉES STATIQUES (MOCK DATA)
// ==========================================
const PRODUCTS: Product[] = [
  { id: 1, name: "Écouteurs Sans Fil Pro", price: 89.99, oldPrice: 129.99, category: "Électronique", rating: 4.8, reviews: 342, stock: 15, image: "🎧", badge: "Bestseller", description: "Son haute fidélité, autonomie 30h, réduction de bruit active." },
  { id: 2, name: "Sneakers Urban Boost", price: 59.99, oldPrice: null, category: "Mode", rating: 4.6, reviews: 218, stock: 8, image: "👟", badge: "Nouveau", description: "Confort exceptionnel, semelle amortissante, design urbain." },
  { id: 3, name: "Lampe Design LED", price: 34.99, oldPrice: 49.99, category: "Maison", rating: 4.7, reviews: 127, stock: 23, image: "💡", badge: "Promo", description: "Lumière réglable, économe en énergie, style scandinave." },
  { id: 4, name: "Sac à Dos Voyageur", price: 79.99, oldPrice: null, category: "Mode", rating: 4.9, reviews: 501, stock: 5, image: "🎒", badge: "Top vente", description: "Compartiments multiples, matière imperméable, port USB intégré." },
  { id: 5, name: "Montre Connectée S3", price: 149.99, oldPrice: 199.99, category: "Électronique", rating: 4.5, reviews: 89, stock: 12, image: "⌚", badge: "Flash", description: "Suivi santé, GPS, notifications, étanche 50m." },
  { id: 6, name: "Plante Artificielle XL", price: 24.99, oldPrice: null, category: "Maison", rating: 4.4, reviews: 74, stock: 30, image: "🌿", badge: null, description: "Hauteur 80cm, aspect naturel, zéro entretien." },
  { id: 7, name: "Roman Bestseller 2024", price: 14.99, oldPrice: 19.99, category: "Livres", rating: 4.9, reviews: 632, stock: 50, image: "📚", badge: "Coup de cœur", description: "Thriller haletant, 480 pages, traduit en 30 langues." },
  { id: 8, name: "Cafetière Italienne", price: 44.99, oldPrice: null, category: "Cuisine", rating: 4.7, reviews: 203, stock: 18, image: "☕", badge: null, description: "Acier inoxydable, 6 tasses, compatible tous feux." },
];

const ORDERS: Order[] = [
  { id: "CMD-2024-001", date: "10 Avr 2026", status: "Livré", total: 89.99, items: 2 },
  { id: "CMD-2024-002", date: "12 Avr 2026", status: "En transit", total: 149.99, items: 1 },
  { id: "CMD-2024-003", date: "14 Avr 2026", status: "En préparation", total: 59.98, items: 3 },
];

const CUSTOMERS: Customer[] = [
  { id: 1, name: "Marie Dupont", email: "marie@email.com", orders: 12, total: 842.50, joined: "Jan 2025", status: "VIP" },
  { id: 2, name: "Thomas Martin", email: "thomas@email.com", orders: 3, total: 187.00, joined: "Mar 2026", status: "Nouveau" },
  { id: 3, name: "Sophie Bernard", email: "sophie@email.com", orders: 7, total: 456.20, joined: "Sep 2025", status: "Actif" },
  { id: 4, name: "Lucas Petit", email: "lucas@email.com", orders: 1, total: 59.99, joined: "Avr 2026", status: "Nouveau" },
];

// ==========================================
// COMPOSANT PRINCIPAL : APP
// ==========================================
export default function App() {
  const [view, setView] = useState<string>("home");
  const [adminSection, setAdminSection] = useState<string>("dashboard");
  const [cart, setCart] = useState<any[]>([]);
  const [wishlist, setWishlist] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("Tous");
  const [sortBy, setSortBy] = useState<string>("popular");
  const [notification, setNotification] = useState<{ msg: string; type: string } | null>(null);
  const [priceRange, setPriceRange] = useState<number[]>([0, 200]);
  const [adminProducts, setAdminProducts] = useState<Product[]>(PRODUCTS);
  const [showAddProduct, setShowAddProduct] = useState<boolean>(false);
  const [promoCode, setPromoCode] = useState<string>("");
  const [promoApplied, setPromoApplied] = useState<boolean>(false);
  const [user, setUser] = useState({ name: "Jean Dupont", email: "jean@email.com", avatar: "JD" });
  const [filterStars, setFilterStars] = useState<number>(0);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const showNotif = (msg: string, type = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) return prev.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      return [...prev, { ...product, qty: 1 }];
    });
    showNotif(`${product.name} ajouté au panier ! 🛒`);
  };

  const toggleWishlist = (product: Product) => {
    setWishlist(prev => {
      const exists = prev.find(i => i.id === product.id);
      if (exists) {
        showNotif(`Retiré des favoris`, "info");
        return prev.filter(i => i.id !== product.id);
      }
      showNotif(`${product.name} ajouté aux favoris ❤️`);
      return [...prev, product];
    });
  };

  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  const navItems = [
    { id: "home", label: "Accueil", icon: "🏠" },
    { id: "shop", label: "Boutique", icon: "🛍️" },
    { id: "deals", label: "Promotions", icon: "🔥" },
    { id: "orders", label: "Mes commandes", icon: "📦" },
    { id: "wishlist", label: "Favoris", icon: "❤️" },
    { id: "account", label: "Mon compte", icon: "👤" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif", background: "#f8f7f4", minHeight: "100vh", color: "#1a1a2e" }}>
      {/* Styles globaux injectés */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=Playfair+Display:wght@600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        .btn-primary { background: linear-gradient(135deg, #c8a96e, #e8c97e); color: #1a1a2e; border: none; padding: 12px 28px; border-radius: 50px; font-weight: 700; cursor: pointer; transition: all 0.3s; font-size: 15px; }
        .btn-primary:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(200,169,110,0.4); }
        .btn-outline { background: transparent; color: #1a1a2e; border: 2px solid #1a1a2e; padding: 10px 24px; border-radius: 50px; font-weight: 600; cursor: pointer; transition: all 0.3s; font-size: 14px; }
        .btn-outline:hover { background: #1a1a2e; color: #fff; }
        .card { background: #fff; border-radius: 20px; box-shadow: 0 2px 20px rgba(0,0,0,0.06); transition: all 0.3s; overflow: hidden; padding: 16px; }
        .card:hover { transform: translateY(-4px); box-shadow: 0 12px 40px rgba(0,0,0,0.12); }
        .grid-4 { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
        @media (max-width: 768px) { .grid-4 { grid-template-columns: 1fr 1fr; } }
        .notif { position: fixed; top: 24px; right: 24px; z-index: 1000; background: #1a1a2e; color: #fff; padding: 14px 24px; border-radius: 16px; box-shadow: 0 8px 32px rgba(0,0,0,0.2); display: flex; align-items: center; gap: 10px; font-weight: 500; font-size: 14px; border-left: 4px solid #c8a96e; }
        .deal-timer { display: flex; gap: 8px; }
        .timer-block { background: rgba(255,255,255,0.1); border-radius: 10px; padding: 10px 14px; text-align: center; }
      `}</style>

      {/* NOTIFICATION */}
      {notification && <div className="notif">✓ {notification.msg}</div>}

      {/* HEADER */}
      <header style={{ background: "#fff", borderBottom: "1px solid #f0ede8", position: "sticky", top: 0, zIndex: 400 }}>
        <div style={{ maxWidth: 1400, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyBetween: "space-between" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, fontWeight: 800, color: "#1a1a2e", cursor: "pointer" }} onClick={() => setView("home")}>
            Shop<span style={{ color: "#c8a96e" }}>Nova</span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginLeft: "auto" }}>
            <button onClick={() => setView("wishlist")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, position: "relative" }}>
              ❤️ {wishlist.length > 0 && <span style={{ position: "absolute", top: -5, right: -10, background: "#e74c3c", color: "#fff", borderRadius: "50%", padding: "2px 6px", fontSize: 10 }}>{wishlist.length}</span>}
            </button>
            <button onClick={() => setView("cart")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 20, position: "relative" }}>
              🛒 {cartCount > 0 && <span style={{ position: "absolute", top: -5, right: -10, background: "#c8a96e", color: "#1a1a2e", borderRadius: "50%", padding: "2px 6px", fontSize: 10 }}>{cartCount}</span>}
            </button>
            <button style={{ background: "#1a1a2e", color: "#c8a96e", border: "none", borderRadius: "50%", width: 38, height: 38, fontWeight: 700 }}>{user.avatar}</button>
          </div>
        </div>

        {/* BARRE DE NAVIGATION */}
        <div style={{ background: "#1a1a2e", padding: "0 24px" }}>
          <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", gap: 4 }}>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setView(item.id)} style={{ padding: "12px 18px", border: "none", background: view === item.id ? "rgba(200,169,110,0.2)" : "transparent", color: view === item.id ? "#c8a96e" : "rgba(255,255,255,0.7)", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
                {item.icon} {item.label}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* CONTENU PRINCIPAL EN FONCTION DE LA VUE */}
      <main style={{ maxWidth: 1400, margin: "0 auto", padding: "24px" }}>
        {view === "home" && (
          <HomeView 
            setView={setView} 
            products={adminProducts} 
            addToCart={addToCart} 
            toggleWishlist={toggleWishlist} 
            wishlist={wishlist} 
            setSelectedCategory={setSelectedCategory} 
          />
        )}
        {view === "shop" && <div style={{ textAlign: "center", padding: 40 }}><h2>Boutique (En cours de chargement...)</h2></div>}
        {view === "cart" && <div style={{ textAlign: "center", padding: 40 }}><h2>Votre Panier ({cartCount} articles)</h2></div>}
        {view === "wishlist" && <div style={{ textAlign: "center", padding: 40 }}><h2>Vos Favoris ({wishlist.length})</h2></div>}
      </main>
    </div>
  );
}

// ==========================================
// SOUS-COMPOSANT : HOME VIEW
// ==========================================
function HomeView({ setView, products, addToCart, toggleWishlist, wishlist, setSelectedCategory }: any) {
  const [timerH, setTimerH] = useState(5);
  const [timerM, setTimerM] = useState(42);
  const [timerS, setTimerS] = useState(17);

  useEffect(() => {
    const t = setInterval(() => {
      setTimerS(s => {
        if (s === 0) {
          setTimerM(m => {
            if (m === 0) {
              setTimerH(h => h - 1);
              return 59;
            }
            return m - 1;
          });
          return 59;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <div>
      {/* HERO BANNER */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e 0%, #2d2d5e 50%, #1a3a2e 100%)", borderRadius: 28, padding: "60px 48px", marginBottom: 32, color: "#fff" }}>
        <h1 style={{ fontSize: 44, fontWeight: 800, marginBottom: 20 }}>
          Tout ce dont vous <span style={{ color: "#c8a96e" }}>avez besoin,</span> livré rapidement.
        </h1>
        <p style={{ opacity: 0.8, marginBottom: 24 }}>Découvrez des milliers de produits sélectionnés avec soin.</p>
        <button className="btn-primary" onClick={() => setView("shop")}>🛍️ Explorer la boutique</button>
      </div>

      {/* FLASH DEAL */}
      <div style={{ background: "linear-gradient(135deg, #1a1a2e, #2d2d5e)", color: "#fff", borderRadius: 20, padding: "24px", marginBottom: 36 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 20 }}>
          <div>
            <div style={{ color: "#c8a96e", fontWeight: 700, fontSize: 13 }}>⚡ FLASH DEAL DU JOUR</div>
            <h3 style={{ fontSize: 22 }}>Jusqu'à -40% sur l'Électronique</h3>
          </div>
          <div className="deal-timer">
            <div className="timer-block"><span style={{ color: "#c8a96e", fontWeight: "bold" }}>{String(timerH).padStart(2, '0')}</span>h</div>
            <div className="timer-block"><span style={{ color: "#c8a96e", fontWeight: "bold" }}>{String(timerM).padStart(2, '0')}</span>m</div>
            <div className="timer-block"><span style={{ color: "#c8a96e", fontWeight: "bold" }}>{String(timerS).padStart(2, '0')}</span>s</div>
          </div>
        </div>
      </div>

      {/* GRILLE PRODUITS (MEILLEURES VENTES) */}
      <h2 style={{ marginBottom: 20, fontFamily: "Playfair Display" }}>🏆 Meilleures ventes</h2>
      <div className="grid-4">
        {products.slice(0, 4).map((p: Product) => (
          <ProductCard key={p.id} product={p} addToCart={addToCart} toggleWishlist={toggleWishlist} isFavorite={!!wishlist.find((w: any) => w.id === p.id)} />
        ))}
      </div>
    </div>
  );
}

// ==========================================
// SOUS-COMPOSANT : CARTE PRODUIT
// ==========================================
function ProductCard({ product, addToCart, toggleWishlist, isFavorite }: { product: Product, addToCart: any, toggleWishlist: any, isFavorite: boolean }) {
  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", justifyBetween: "space-between", position: "relative" }}>
      <button onClick={() => toggleWishlist(product)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", cursor: "pointer", fontSize: 18 }}>
        {isFavorite ? "❤️" : "🤍"}
      </button>
      <div style={{ fontSize: 48, textAlign: "center", margin: "16px 0" }}>{product.image}</div>
      <div>
        <span style={{ fontSize: 11, background: "#f0ede8", padding: "2px 8px", borderRadius: 10, fontWeight: "bold" }}>{product.category}</span>
        <h4 style={{ margin: "8px 0 4px 0", fontSize: 15 }}>{product.name}</h4>
        <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontWeight: "bold", color: "#1a1a2e" }}>{product.price} €</span>
          {product.oldPrice && <span style={{ textDecoration: "line-through", color: "#aaa", fontSize: 12 }}>{product.oldPrice} €</span>}
        </div>
      </div>
      <button className="btn-primary" style={{ width: "100%", padding: "8px 0", fontSize: 13 }} onClick={() => addToCart(product)}>
        🛒 Ajouter au panier
      </button>
    </div>
  );
}

