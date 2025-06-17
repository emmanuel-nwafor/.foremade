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
import AdminEditBannerAndOthers from '/src/admin/AdminEditBannerAndOthers';
import AdminEditDeals from '/src/admin/AdminEditDeals';

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
import BabyProducts from './pages/BabyProducts';
import ComputerAccessories from './pages/ComputerAccessories';
import GamesFun from './pages/GamesFun';
import Drinks from './pages/Drinks';
import HomeKitchen from './pages/HomeKitchen';
import SmartWatches from './pages/SmartWatches';
import ForgetPassword from './auth/ForgetPassword';

import OtherProductsPage from './pages/OtherProducts'; // Dynamic page
import AdminCategoryEdit from './admin/AdminCategoryEdit';
import AboutUs from './pages/AboutUs';
import Search from './pages/Search';
import Notifications from './profile/Notifications';
import Store from './components/store/Store';

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
    // '/stores',

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

    '/sellers/orders',
    '/sellers/products',
    '/seller-onboarding',
    '/dashboard',
  ].includes(location.pathname);

  // Show footer on profile page and About Us page
  const showFooter = ['/profile', '/about'].includes(location.pathname);

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
            <Route path="/admin/edit/banners" element={<AdminEditBannerAndOthers />} />
            <Route path="/admin/edit/daily-deals" element={<AdminEditDeals />} />

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
            <Route path="/privacy-policy/eu/access" element={<GDPRAccess />} />
            <Route path="/pages/Shoes" element={<OtherProductsPage category="Shoes" />} />
            <Route path="/pages/Fashion" element={<OtherProductsPage category="Fashion" />} />
            <Route path="/pages/GamesAndFun" element={<GamesFun />} />
            <Route path="/pages/HomeAndKitchen" element={<HomeKitchen />} />
            <Route path="/pages/OtherProducts/:category" element={<OtherProductsPage />} />
            <Route path="/stores" element={<Store />} />
            
            {/* === Previously Protected User Routes (Now Open) === */}
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

            {/* === Fallback Route === */}
            <Route path="*" element={<NotFound />} />
            <Route path="/about" element={<AboutUs />} />
          </Routes>
        </Layout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;