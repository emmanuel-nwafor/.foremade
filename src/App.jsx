import SellerAgreement from './seller/SellerAgreement';
import ShippingPolicy from './pages/ShippingPolicy';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CurrencyProvider } from './CurrencyContext';

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
import SellerProductVariants from './seller/SellerProductVariants';
import SellerProductGallery from './seller/SellerProductGallery';
import Support from './pages/Support';
import TermsConditions from './pages/TermsAndConditions';

import Admin from './Admin/Admin';
import AdminDashboard from './Admin/AdminDashboard';
import AdminNotifications from './Admin/AdminNotifications';
import AdminUsers from './Admin/AdminUsers';
import AdminPayoutMonitor from './Admin/AdminPayoutMonitor';
import AdminEditBannerAndOthers from './Admin/AdminEditBannerAndOthers';
import AdminEditDeals from './Admin/AdminEditDeals';
import AdminEditFees from './Admin/AdminEditFees';
import AdminCategoryEdit from './Admin/AdminCategoryEdit';
import AdminManager from './Admin/AdminManager';
import AdminSellerWallet from './Admin/AdminSellerWallet';
import AdminProSellerRequests from './Admin/AdminProSellerRequests';
import AdminBumpedProducts from './Admin/AdminBumpedProducts';
import AdminTransactions from './Admin/AdminTransactions';

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
import ProSellerFullGuide from './seller/ProSellerFullGuide';
import BulkUpload from './seller/BulkUpload';
import ProductBump from './seller/ProductBump';
import SellerTransactions from './seller/SellerTransactions';
import ProSellerAnalytics from './seller/ProSellerAnalytics';
import SellerChat from './seller/SellerChat';
import UserAgreement from './pages/UserAgreement';
import BuyerProtectionPolicy from './pages/BuyerProtectionPolicy';
import RefundPolicy from './pages/RefundPolicy';
import ProductBumpInfo from './seller/ProductBumpInfo';
import OrderTracking from './profile/OrderTracking';
import DailyDeals from './pages/DailyDeals';
import AllTrendingFashion from './pages/AllTrendingFashion';
import AllTrendingGadgets from './pages/AllTrendingGadgets';
import ProtectedRoute from './auth/ProtectedRoute'; // Ensure correct path

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
    '/products-upload-variant',
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
    '/admin/manager',
    '/admin/edit/banners',
    '/admin/edit/daily-deals',
    '/admin/pro-sellers-requests',
    '/admin/bumped-products',
    '/bulk-upload',
    '/product-bump',
    '/product-bump-info',
    '/seller-transactions',
    '/seller/edit-product:id',
    '/pro-seller-analytics',
    '/sellers/orders',
    '/sellers/products',
    '/seller-onboarding',
    '/dashboard',
    '/admin/sellers-wallet',
    '/seller-chat',
    '/admin/transactions',
  ].includes(location.pathname);

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

function App() {
  return (
    <BrowserRouter>
      <CurrencyProvider>
        <AuthProvider>
          <Layout>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/recover-password" element={<ForgetPassword />} />
              <Route path="/add-phone" element={<AddPhone />} />
              <Route path="/pro-seller-form" element={<ProSellerForm />} />
              <Route path="/sellers-guide" element={<HowItWorks />} />
                <Route
                  path="/"
                  element={<Home />}
                />

                <Route
                  path="/smile"
                  element={<Wallet />}
                />
                <Route
                  path="/sell"
                  element={<Dashboard />}
                />
                <Route
                  path="/sellers/products"
                  element={<SellersProducts />}
                />
                <Route
                  path="/products-upload"
                  element={<SellerProductUpload />}
                />
                <Route
                  path="/products-upload-variant"
                  element={<SellerProductVariants />}
                />
                <Route
                  path="/products-gallery"
                  element={<SellerProductGallery />}
                />
                <Route
                  path="/seller/edit-product/:productId"
                  element={<SellerEditProduct />}
                />
                <Route
                  path="/dashboard"
                  element={<Dashboard />}
                />
                <Route
                  path="/sellers/orders"
                  element={<UsersOrdersPage />}
                />
                <Route
                  path="/settings"
                  element={<SettingsPage />}
                />
                <Route
                  path="/seller-onboarding"
                  element={<SellerOnboarding />}
                />
                <Route
                  path="/bulk-upload"
                  element={<BulkUpload />}
                />
                <Route
                  path="/product-bump"
                  element={<ProductBump />}
                />
                <Route
                  path="/product-bump-info"
                  element={<ProductBumpInfo />}
                />
                <Route
                  path="/seller-transactions"
                  element={<SellerTransactions />}
                />
                <Route
                  path="/pro-seller-analytics"
                  element={<ProSellerAnalytics />}
                />
                <Route
                  path="/terms-conditions"
                  element={<TermsConditions />}
                />
                <Route
                  path="/seller-agreement"
                  element={<SellerAgreement />}
                />
                <Route
                  path="/pro-seller-guide"
                  element={<ProSellerGuide />}
                />
                <Route
                  path="/pro-seller-guide-full"
                  element={<ProSellerFullGuide />}
                />
                <Route
                  path="/support"
                  element={<Support />}
                />
                <Route
                  path="/buyer-protection-policy"
                  element={<BuyerProtectionPolicy />}
                />
                <Route
                  path="/refund-policy"
                  element={<RefundPolicy />}
                />
                <Route
                  path="/empowerment-hub"
                  element={<EmpowermentHub />}
                />
                <Route
                  path="/youth-empowerment-form"
                  element={<YouthEmpowermentForm />}
                />
                <Route
                  path="/youth-empowerment-terms"
                  element={<YouthEmpowermentTerms />}
                />
                <Route
                  path="/products"
                  element={<Products />}
                />
                <Route
                  path="/product/:id"
                  element={<Product />}
                />
                <Route
                  path="/best-selling"
                  element={<BestSelling />}
                />
                <Route
                  path="/electronics"
                  element={<Electronics />}
                />
                <Route
                  path="/tablet-phones"
                  element={<TabletsPhones />}
                />
                <Route
                  path="/smart-watches"
                  element={<SmartWatches />}
                />
                <Route
                  path="/privacy-policy"
                  element={<PrivacyPolicy />}
                />
                <Route
                  path="/shipping-policy"
                  element={<ShippingPolicy />}
                />
                <Route
                  path="/privacy-policy/:type"
                  element={<AllPolicies />}
                />
                <Route
                  path="/privacy-policy/eu/access"
                  element={<GDPRAccess />}
                />
                <Route
                  path="/pages/other-products/:category"
                  element={<OtherProductsPage />}
                />
                <Route
                  path="/stores"
                  element={<Store />}
                />
                <Route
                  path="/cart"
                  element={<Cart />}
                />
                <Route
                  path="/checkout"
                  element={<Checkout />}
                />
                <Route
                  path="/favorites"
                  element={<Favorites />}
                />
                <Route
                  path="/order-confirmation"
                  element={<OrderConfirmation />}
                />
                <Route
                  path="/profile"
                  element={<Profile />}
                />
                <Route
                  path="/orders"
                  element={<Orders />}
                />
                <Route
                  path="/address"
                  element={<Address />}
                />
                <Route
                  path="/setting"
                  element={<Setting />}
                />
                <Route
                  path="/search"
                  element={<Search />}
                />
                <Route
                  path="/notifications"
                  element={<Notifications />}
                />
                <Route
                  path="/about"
                  element={<AboutUs />}
                />
                <Route
                  path="/seller-chat"
                  element={<SellerChat />}
                />
                <Route
                  path="/order-tracking"
                  element={<OrderTracking />}
                />
                <Route
                  path="/category/:categoryName"
                  element={<CategoryPage />}
                />
                <Route
                  path="/user-agreement"
                  element={<UserAgreement />}
                />
                <Route
                  path="/daily-deals"
                  element={<DailyDeals />}
                />
                <Route
                  path="/trending-fashions"
                  element={<AllTrendingFashion />}
                />
                <Route
                  path="/trending-gadgets"
                  element={<AllTrendingGadgets />}
                />
                
              <Route element={<ProtectedRoute />}>
                {/* Admin Routes */}
                <Route
                  path="/admin/dashboard"
                  element={<AdminDashboard />}
                />
                <Route
                  path="/admin/transactions"
                  element={<AdminTransactions />}
                />
                <Route
                  path="/admin/users"
                  element={<AdminUsers />}
                />
                <Route
                  path="/admin/products"
                  element={<Admin />}
                />
                <Route
                  path="/admin/sellers/payouts"
                  element={<AdminPayoutMonitor />}
                />
                <Route
                  path="/admin/edit/fees"
                  element={<AdminEditFees />}
                />
                <Route
                  path="/admin/edit/categories"
                  element={<AdminCategoryEdit />}
                />
                <Route
                  path="/admin/notifications"
                  element={<AdminNotifications />}
                />
                <Route
                  path="/admin/edit/banners"
                  element={<AdminEditBannerAndOthers />}
                />
                <Route
                  path="/admin/edit/daily-deals"
                  element={<AdminEditDeals />}
                />
                <Route
                  path="/admin/manager"
                  element={<AdminManager />}
                />
                <Route
                  path="/admin/sellers-wallet"
                  element={<AdminSellerWallet />}
                />
                <Route
                  path="/admin/pro-sellers-requests"
                  element={<AdminProSellerRequests />}
                />
                <Route
                  path="/admin/bumped-products"
                  element={<AdminBumpedProducts />}
                />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </Layout>
        </AuthProvider>
      </CurrencyProvider>
    </BrowserRouter>
  );
}

export default App;