import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { auth } from '../lib/firebase';
import { ShoppingBag, MessageSquare, User, LogOut, LayoutDashboard, ShieldCheck, Heart } from 'lucide-react';
import { useStudio } from '../contexts/StudioContext';

export default function Navbar() {
  const { user, profile } = useAuth();
  const { config } = useStudio();

  const handleLogout = () => auth.signOut();

  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div 
              className="w-8 h-8 rounded-lg flex items-center justify-center transition-all"
              style={{ backgroundColor: config.theme.primaryColor }}
            >
              <ShoppingBag className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-gray-900 tracking-tight">{config.content.siteName}</span>
          </Link>

          <div className="flex items-center gap-6">
            <Link to="/" className="text-gray-600 hover:text-indigo-600 font-medium transition-colors">Accueil</Link>
            
            {user ? (
              <>
                <Link to="/chats" className="text-gray-600 hover:text-indigo-600 transition-colors">
                  <MessageSquare className="w-5 h-5" />
                </Link>
                
                <Link to="/favorites" className="text-gray-600 hover:text-red-500 transition-colors">
                  <Heart className="w-5 h-5" />
                </Link>

                <Link to="/dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors">
                  <LayoutDashboard className="w-5 h-5" />
                </Link>

                {(profile?.role === 'admin' || profile?.email === 'jordeeahy@gmail.com') && (
                  <Link to="/admin" className="text-gray-600 hover:text-indigo-600 transition-colors">
                    <ShieldCheck className="w-5 h-5" />
                  </Link>
                )}

                <div className="flex items-center gap-4 pl-4 border-l border-gray-100">
                  <Link to="/profile" className="flex items-center gap-2 group">
                    <div 
                      className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border border-gray-200 transition-all"
                      style={{ borderColor: 'transparent' }}
                    >
                      {profile?.photoURL ? (
                        <img src={profile.photoURL} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <User className="w-4 h-4 text-gray-400 group-hover:text-indigo-500" />
                      )}
                    </div>
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="text-gray-600 hover:text-indigo-600 font-medium px-4 py-2">Connexion</Link>
                <Link 
                  to="/register" 
                  className="text-white px-5 py-2 rounded-full font-medium transition-all shadow-sm"
                  style={{ backgroundColor: config.theme.primaryColor }}
                >
                  S'inscrire
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
