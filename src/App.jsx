import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CurrencyProvider } from '/src/CurrencyContext';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

import Header from './components/layout/Header';
import TopNavigation from './components/layout/TopNavigation';
import Footer from './components/layout/EnhancedFooter';

import ChatInterface from '/src/components/chat/ChatInterface';
import SellerChat from '/src/seller/SellerChat';
import Home from './pages/Home';
import Products from './pages/Products';
import Login from './auth/Login';
import Register from './auth/Register';
import NotFound from './pages/NotFound';
import BestSelling from './components/product/BestSelling';
import Product from './pages/Product';
import AddPhone from './auth/AddPhone';
import Cart from './pages/Cart';
import Favorites from './pages/Favorites';
import Profile from './profile/EnhancedProfile';
import Checkout from './components/checkout/Checkout';
import Orders from './profile/Orders';
import Address from './profile/Address';
import Setting from './profile/Setting';
import OrderConfirmation from './components/checkout/OrderConfirmation';
import UsersOrdersPage from './seller/UsersOrdersPage';
import SettingsPage from './seller/SettingsPage';
import Dashboard from './seller/Dashboard';
import SellersProducts from './seller/SellersProducts';
import SellerOnboarding from './seller/SellerOnboarding';
import SellerProductUpload from './seller/SellerProductUpload';
import SellerProductGallery from './seller/SellerProductGallery';
import SellerTransactions from './seller/SellerTransactions';
import SellerProductVariants from './seller/SellerProductVariants';
import Support from './pages/Support';
import Admin from '/src/admin/Admin';
import AdminDashboard from '/src/admin/AdminDashboard';
import AdminNotifications from '/src/Admin/AdminNotifications.jsx';
import AdminUsers from '/src/admin/AdminUsers';
import AdminPayoutMonitor from '/src/admin/AdminPayoutMonitor';
import AdminEditFees from '/src/admin/AdminEditFees';
import AdminEditBannerAndOthers from '/src/admin/AdminEditBannerAndOthers';
import AdminEditDeals from '/src/admin/AdminEditDeals';
import AdminCategoryEdit from '/src/admin/AdminCategoryEdit';
import AdminSellerWallet from '/src/admin/AdminSellerWallet';
import AdminManager from '/src/admin/AdminManager';
import HowItWorks from './seller/HowItWorks';
import Wallet from './seller/Wallet';
import PrivacyPolicy from './pages/PrivacyPolicy';
import AllPolicies from './pages/AllPolicies';
import EmpowermentHub from './pages/EmpowermentHub';
import YouthEmpowermentForm from './pages/YouthEmpowermentForm';
import YouthEmpowermentTerms from './pages/YouthEmpowermentTerms';
import GDPRAccess from './pages/GDPRAccess';
import TabletsPhones from './pages/TabletsPhones';
import HealthBeauty from './pages/HealthBeauty';
import Electronics from './pages/Electronics';
import ComputerAccessories from './pages/ComputerAccessories';
import GamesFun from './pages/GamesFun';
import Drinks from './pages/Drinks';
import HomeKitchen from './pages/HomeKitchen';
import SmartWatches from './pages/SmartWatches';
import ForgetPassword from './auth/ForgetPassword';
import OtherProductsPage from './pages/OtherProducts';
import AboutUs from './pages/AboutUs';
import Search from './pages/Search';
import Notifications from './profile/Notifications';
import Store from './components/store/Store';
import SellerEditProduct from './seller/SellerEditProduct';
import CategoryPage from './pages/CategoryPage';
import ProSellerForm from './pages/ProSellerForm';
import ProSellerGuide from './seller/ProSellerGuide';
import BuyerProtectionPolicy from './pages/BuyerProtectionPolicy';
import RefundPolicy from './pages/RefundPolicy';
import ProRefundPolicy from './pages/ProRefundPolicy';
import TermsAndConditions from './pages/TermsAndConditions';
import SellerAgreement from './pages/SellerAgreement';
import ShippingPolicy from './pages/ShippingPolicy';

const Layout = ({ children }) => {
  const location = useLocation();
  const hideHeaderFooter = [
    '/login',
    '/register',
    '/recover-password',
    '/sell',
    '/smile',
    '/overview',
    '/settings',
    '/products-gallery',
    '/products-upload',
    '/seller/edit-product/:productId',
    '/admin',
    '/admin/payouts',
    '/admin/dashboard',
    '/admin/users',
    '/admin/admins',
    '/admin/edit/fees',
    '/admin/edit/categories',
    '/admin/sellers/payouts',
    '/admin/products',
    '/admin/notifications',
    '/admin/edit/banners',
    '/admin/edit/daily-deals',
    '/admin/sellers-wallet',
    '/admin/preset-messages',
    '/admin/manager',
    '/sellers/orders',
    '/sellers/products',
    '/seller-onboarding',
    '/transactions',
    '/products-upload-variant',
    '/dashboard',
    // '/chat',
  ].some((path) => location.pathname === path || location.pathname.startsWith(path.replace(':productId', '')));

  const showFooter = ['/profile', '/about'].includes(location.pathname);

  return (
    <>
      {!hideHeaderFooter && <TopNavigation />}
      {!hideHeaderFooter && (
        <div className="flex justify-between items-center bg-white dark:bg-gray-900">
          <Header />
        </div>
      )}
      <main className="min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white">
        {children}
      </main>
      {showFooter && <Footer />}
    </>
  );
};

const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { loading, user } = useAuth() || { loading: true, user: null };
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoadingAdmin, setIsLoadingAdmin] = useState(adminOnly);

  useEffect(() => {
    if (adminOnly && user) {
      const checkAdmin = async () => {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        setIsAdmin(userSnap.exists() && userSnap.data().isAdmin === true);
        setIsLoadingAdmin(false);
      };
      checkAdmin();
    } else {
      setIsLoadingAdmin(false);
    }
  }, [user, adminOnly]);

  if (loading || isLoadingAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);
  return null;
}

function AppRoutes() {
  const location = useLocation();
  return (
    <AuthProvider>
      <CurrencyProvider>
        <Layout>
          <Routes>
            {/* All your routes here, replacing the old <Routes> block */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/add-phone" element={<AddPhone />} />
            <Route path="/sellers-guide" element={<HowItWorks />} />
            <Route path="/pro-seller-form" element={<ProSellerForm />} />
            <Route path="/smile" element={<ProtectedRoute><Wallet /></ProtectedRoute>} />
            <Route path="/sell" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/sellers/products" element={<ProtectedRoute><SellersProducts /></ProtectedRoute>} />
            <Route path="/products-upload" element={<ProtectedRoute><SellerProductUpload /></ProtectedRoute>} />
            <Route path="/products-gallery" element={<ProtectedRoute><SellerProductGallery /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/sellers/orders" element={<ProtectedRoute><UsersOrdersPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/seller-onboarding" element={<ProtectedRoute><SellerOnboarding /></ProtectedRoute>} />
            <Route path="/products-upload-variant" element={<ProtectedRoute><SellerProductVariants /></ProtectedRoute>} />
            <Route path="/recover-password" element={<ForgetPassword />} />
            <Route path="/transactions" element={<ProtectedRoute><SellerTransactions /></ProtectedRoute>} />
            <Route path="/chat/:orderId" element={<ProtectedRoute><ChatInterface /></ProtectedRoute>} />
            <Route path="/seller-chat" element={<ProtectedRoute><SellerChat /></ProtectedRoute>} />
            <Route path="/seller-chat/:chatId" element={<ProtectedRoute><SellerChat /></ProtectedRoute>} />
            <Route path="/admin/sellers-wallet" element={<ProtectedRoute adminOnly={true}><AdminSellerWallet /></ProtectedRoute>} />
            <Route path="/admin/manager" element={<ProtectedRoute adminOnly={true}><AdminManager /></ProtectedRoute>} />
            <Route path="/admin/dashboard" element={<ProtectedRoute adminOnly={true}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/admin/users" element={<ProtectedRoute adminOnly={true}><AdminUsers /></ProtectedRoute>} />
            <Route path="/admin/products" element={<ProtectedRoute adminOnly={true}><Admin /></ProtectedRoute>} />
            <Route path="/admin/sellers/payouts" element={<ProtectedRoute adminOnly={true}><AdminPayoutMonitor /></ProtectedRoute>} />
            <Route path="/admin/edit/fees" element={<ProtectedRoute adminOnly={true}><AdminEditFees /></ProtectedRoute>} />
            <Route path="/admin/edit/categories" element={<ProtectedRoute adminOnly={true}><AdminCategoryEdit /></ProtectedRoute>} />
            <Route path="/admin/notifications" element={<ProtectedRoute adminOnly={true}><AdminNotifications /></ProtectedRoute>} />
            <Route path="/admin/edit/banners" element={<ProtectedRoute adminOnly={true}><AdminEditBannerAndOthers /></ProtectedRoute>} />
            <Route path="/admin/edit/daily-deals" element={<ProtectedRoute adminOnly={true}><AdminEditDeals /></ProtectedRoute>} />
            <Route path="/" element={<Home />} />
            <Route path="/support" element={<Support />} />
            <Route path="/empowerment-hub" element={<EmpowermentHub />} />
            <Route path="/youth-empowerment-form" element={<YouthEmpowermentForm />} />
            <Route path="/youth-empowerment-terms" element={<YouthEmpowermentTerms />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<Product key={location.pathname} />} />
            <Route path="/best-selling" element={<BestSelling />} />
            <Route path="/electronics" element={<Electronics />} />
            <Route path="/tablet-phones" element={<TabletsPhones />} />
            <Route path="/smart-watches" element={<SmartWatches />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/privacy-policy/:type" element={<AllPolicies />} />
            <Route path="/privacy-policy/eu/access" element={<GDPRAccess />} />
            <Route path="/pages/other-products/:category" element={<OtherProductsPage />} />
            <Route path="/stores" element={<Store />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/address" element={<Address />} />
            <Route path="/setting" element={<Setting />} />
            <Route path="/search" element={<Search />} />
            <Route path="/notifications" element={<Notifications />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/category/:categoryName" element={<CategoryPage />} />
            <Route path="/pro-seller-guide" element={<ProSellerGuide />} />
            <Route path="/pro-refund-policy" element={<ProRefundPolicy />} />
            <Route path="/seller/edit-product/:productId" element={<SellerEditProduct />} />
            <Route path="/buyer-protection-policy" element={<BuyerProtectionPolicy />} />
            <Route path="/refund-policy" element={<RefundPolicy />} />
            <Route path="/terms-conditions" element={<TermsAndConditions />} />
            <Route path="/seller-agreement" element={<SellerAgreement />} />
            <Route path="/shipping-policy" element={<ShippingPolicy />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </CurrencyProvider>
    </AuthProvider>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  );
}

export default App;