import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Navigate, 
  useLocation 
} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';

import Header from './components/layout/Header';
import TopNavigation from './components/layout/TopNavigation';
import Footer from './components/layout/EnhancedFooter';
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
import Support from './pages/Support';
import Admin from '/src/admin/Admin';
import AdminDashboard from '/src/admin/AdminDashboard';
import AdminNotifications from '/src/admin/AdminNotifications';
import AdminUsers from '/src/admin/AdminUsers';
import AdminPayoutMonitor from '/src/admin/AdminPayoutMonitor';
import AdminEditFees from './admin/AdminEditFees';
import HowItWorks from './seller/HowItWorks';
import Wallet from './seller/Wallet';

import PrivacyPolicy from './pages/PrivacyPolicy';
import AllPolicies from './pages/AllPolicies';
import EmpowermentHub from './pages/EmpowermentHub';
import YouthEmpowermentForm from './pages/YouthEmpowermentForm';
import YouthEmpowermentTerms from './pages/YouthEmpowermentTerms';

import TabletsPhones from './pages/TabletsPhones';
import HealthBeauty from './pages/HealthBeauty';
import Electronics from './pages/Electronics';
import BabyProducts from './pages/BabyProducts';
import ComputerAccessories from './pages/ComputerAccessories';
import GamesFun from './pages/GamesFun';
import Drinks from './pages/Drinks';
import HomeKitchen from './pages/HomeKitchen';
import SmartWatches from './pages/SmartWatches';
import ForgetPassword from './auth/ForgetPassword';

import OtherProductsPage from './pages/OtherProducts'; // Dynamic page
import AdminCategoryEdit from './admin/AdminCategoryEdit';

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

    '/privacy-policy',
    '/privacy-policy/cookies',
    '/privacy-policy',
    '/privacy-policy/contact',
    '/privacy-policy/us',
    '/privacy-policy/nigeria',
    '/privacy-policy/asia',
    '/privacy-policy/eu',
    '/privacy-policy/australia',

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

    '/sellers/orders',
    '/sellers/products',
    '/seller-onboarding',
    '/dashboard',
  ].includes(location.pathname);

  // Only show footer on profile page
  const showFooter = location.pathname === '/profile';

  return (
    <>
      {!hideHeaderFooter && <TopNavigation />}
      {!hideHeaderFooter && <Header />}
      <main className="min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white">
        {children}
      </main>
      {showFooter && <Footer />}
    </>
  );
};

const ProtectedRoute = ({ children }) => {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }


  return children;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout>
          <Routes>
            {/* === Authentication Routes === */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/add-phone" element={<AddPhone />} />
            <Route path="/sellers-guide" element={<HowItWorks />} />

            {/* === Protected Seller Routes === */}
            <Route
              path="/smile"
              element={
                <ProtectedRoute>
                  <Wallet />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sell"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sellers/products"
              element={
                <ProtectedRoute>
                  <SellersProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products-upload"
              element={
                <ProtectedRoute>
                  <SellerProductUpload />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products-gallery"
              element={
                <ProtectedRoute>
                  <SellerProductGallery />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/sellers/orders"
              element={
                <ProtectedRoute>
                  <UsersOrdersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/seller-onboarding"
              element={
                <ProtectedRoute>
                  <SellerOnboarding />
                </ProtectedRoute>
              }
            />
            <Route
              path="/recover-password"
              element={
                <ProtectedRoute>
                  <ForgetPassword />
                </ProtectedRoute>
              }
            />
            
            {/* === Previously Protected Admin Routes (Now Open) === */}
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/products" element={<Admin />} />
            <Route path="/admin/sellers/payouts" element={<AdminPayoutMonitor />} />
            <Route path="/admin/edit/fees" element={<AdminEditFees />} />
            <Route path="/admin/edit/categories" element={<AdminCategoryEdit />} />
            <Route path="/admin/notifications" element={<AdminNotifications />} />

            {/* === Public Routes === */}
            <Route path="/" element={<Home />} />
            <Route path="/support" element={<Support />} />
            <Route path="/empowerment-hub" element={<EmpowermentHub />} />
            <Route path="/youth-empowerment-form" element={<YouthEmpowermentForm />} />
            <Route path="/youth-empowerment-terms" element={<YouthEmpowermentTerms />} />
            <Route path="/products" element={<Products />} />
            <Route path="/product/:id" element={<Product />} />
            <Route path="/best-selling" element={<BestSelling />} />
            <Route path="/games-fun" element={<GamesFun />} />
            <Route path="/electronics" element={<Electronics />} />
            <Route path="/baby-products" element={<BabyProducts />} />
            <Route path="/drinks-categories" element={<Drinks />} />
            <Route path="/home-kitchen" element={<HomeKitchen />} />
            <Route path="/tablet-phones" element={<TabletsPhones />} />
            <Route path="/health-beauty" element={<HealthBeauty />} />
            <Route path="/smart-watches" element={<SmartWatches />} />
            <Route path="/computers-accessories" element={<ComputerAccessories />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/privacy-policy/:type" element={<AllPolicies />} />
            <Route path="/pages/Shoes" element={<OtherProductsPage category="Shoes" />} />
            <Route path="/pages/Fashion" element={<OtherProductsPage category="Fashion" />} />
            <Route path="/pages/GamesAndFun" element={<GamesFun />} />
            <Route path="/pages/HomeAndKitchen" element={<HomeKitchen />} />
            <Route path="/pages/OtherProducts/:category" element={<OtherProductsPage />} />

            {/* === Previously Protected User Routes (Now Open) === */}
            <Route path="/cart" element={<Cart />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/favorites" element={<Favorites />} />
            <Route path="/order-confirmation" element={<OrderConfirmation />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/address" element={<Address />} />
            <Route path="/setting" element={<Setting />} />

            {/* === Fallback Route === */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;