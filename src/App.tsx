import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import ChatBubble from './components/ChatBubble';
import ScrollToTop from './components/ScrollToTop';
import ProtectedAdminRoute from './components/ProtectedAdminRoute';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Wishlist from './pages/Wishlist';
import Checkout from './pages/Checkout';
import Login from './pages/Login';
import Account from './pages/Account';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

function StorefrontLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <CartDrawer />
      <ChatBubble />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <div className="min-h-screen bg-ink text-cream font-body grain">
                <ScrollToTop />
                <Routes>
                  <Route path="/" element={<StorefrontLayout><Home /></StorefrontLayout>} />
                  <Route path="/shop" element={<StorefrontLayout><Shop /></StorefrontLayout>} />
                  <Route path="/product/:id" element={<StorefrontLayout><ProductDetail /></StorefrontLayout>} />
                  <Route path="/wishlist" element={<StorefrontLayout><Wishlist /></StorefrontLayout>} />
                  <Route path="/checkout" element={<StorefrontLayout><Checkout /></StorefrontLayout>} />
                  <Route path="/login" element={<StorefrontLayout><Login /></StorefrontLayout>} />
                  <Route path="/signup" element={<StorefrontLayout><Login /></StorefrontLayout>} />
                  <Route path="/account" element={<StorefrontLayout><ProtectedRoute><Account /></ProtectedRoute></StorefrontLayout>} />
                  <Route path="/admin/login" element={<AdminLogin />} />
                  <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
                </Routes>
              </div>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
