import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { StudioProvider, useStudio } from './contexts/StudioContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProductDetails from './pages/ProductDetails';
import ChatPage from './pages/ChatPage';
import Profile from './pages/Profile';
import AdminDashboard from './pages/AdminDashboard';
import Favorites from './pages/Favorites';
import SellerProfile from './pages/SellerProfile';
import AIAssistant from './components/AIAssistant';
import ToastContainer from './components/Toast';

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Routes>
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
      
      {/* Public Routes */}
      <Route path="/" element={<Home />} />
      <Route path="/product/:id" element={<ProductDetails />} />
      <Route path="/seller/:id" element={<SellerProfile />} />
      
      {/* Protected Routes */}
      <Route path="/dashboard" element={user ? <Dashboard /> : <Navigate to="/login" />} />
      <Route path="/admin" element={user ? <AdminDashboard /> : <Navigate to="/login" />} />
      <Route path="/favorites" element={user ? <Favorites /> : <Navigate to="/login" />} />
      <Route path="/chat/:sellerId" element={user ? <ChatPage /> : <Navigate to="/login" />} />
      <Route path="/chats" element={user ? <ChatPage /> : <Navigate to="/login" />} />
      <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" />} />
    </Routes>
  );
}

function MainLayout() {
  const { config } = useStudio();
  
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Navbar />
      <main>
        <AppRoutes />
      </main>
      <AIAssistant />
      <ToastContainer />
      
      <footer className="bg-gray-50 border-t border-gray-100 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div 
              className="w-6 h-6 rounded flex items-center justify-center transition-all"
              style={{ backgroundColor: config.theme.primaryColor }}
            >
              <span className="text-white text-[10px] font-bold">
                {config.content.siteName.substring(0, 2).toUpperCase()}
              </span>
            </div>
            <span className="text-lg font-bold text-gray-900">{config.content.siteName}</span>
          </div>
          <p className="text-gray-400 text-sm">
            {config.content.footerText}
          </p>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <StudioProvider>
        <Router>
          <MainLayout />
        </Router>
      </StudioProvider>
    </AuthProvider>
  );
}
