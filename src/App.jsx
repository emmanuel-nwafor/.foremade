import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import Products from './pages/Products';
import Login from './auth/Login';
import Register from './auth/Register';
import NotFound from './pages/NotFound';
import BestSelling from './components/product/BestSelling';
import Product from './pages/Product';
import AddPhone from './auth/AddPhone';
import ProtectedRoute from './auth/ProtectedRoute';
import Cart from './pages/Cart';
import Favorites from './pages/Favorites';
import Profile from './profile/Profile';
import Checkout from './components/checkout/Checkout';
import Orders from './profile/Orders';
import Address from './profile/Address';
import Setting from './profile/Setting';
import OrderConfirmation from './components/checkout/OrderConfirmation';
import UsersOrdersPage from './seller/UsersOrdersPage';
import SettingsPage from './seller/SettingsPage';
import Dashboard from './seller/Dashboard';
import SellersProducts from './seller/SellersProducts';
import SellerProductUpload from './seller/SellerProductUpload';
import SellerProductGallery from './seller/SellerProductGallery';
import Admin from '/src/admin/Admin';
import AdminDashboard from '/src/admin/AdminDashboard';
import AdminUsers from '/src/admin/AdminUsers';
import AdminAdmins from '/src/admin/AdminAdmins';
import AdminVendors from '/src/admin/AdminVendors';
import HowItWorks from './seller/HowItWorks';
import Wallet from './seller/Wallet';

import TabletsPhones from './pages/TabletsPhones'
import HealthBeauty from './pages/HealthBeauty'
import Electronics from './pages/Electronics'
import BabyProducts from './pages/BabyProducts'
import ComputerAccessories from './pages/ComputerAccessories'
import GamesFun from './pages/GamesFun'
import Drinks from './pages/Drinks'
import HomeKitchen from './pages/HomeKitchen'
import SmartWatches from './pages/SmartWatches'

const Layout = ({ children }) => {
  const location = useLocation();
  const hideHeaderFooter = [
    '/login',
    '/register',
    '/sell',
    '/smile',
    '/overview',
    '/vendor/orders',
    '/vendor/products',
    '/settings',
    '/products-gallery',
    '/products-upload',
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/admins',
    '/admin/vendors',
    '/admin/products',
    '/sellers/orders',
    '/sellers/products',
    '/seller/login',
  ].includes(location.pathname);

  // Show footer only on profile-related routes
  const showFooter = [
    '/profile',
    '/orders',
    '/address',
    '/setting',
  ].includes(location.pathname);

  return (
    <>
      {!hideHeaderFooter && <Header />}
      <main className="min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white">
        {children}
      </main>
      {!hideHeaderFooter && showFooter && <Footer />}
    </>
  );
};

function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          {/* === Authentication Routes (No Header/Footer) === */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/add-phone" element={<AddPhone />} />
          <Route path="/seller/login" element={<Login />} />
          <Route path="/sellers-guide" element={<HowItWorks />} />

          {/* === Public Routes === */}
          <Route path="/" element={<Home />} />
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


          {/* === Protected User Routes === */}
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route
            path="/favorites"
            element={
              <ProtectedRoute>
                <Favorites />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation"
            element={
              <ProtectedRoute>
                <OrderConfirmation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Orders />
              </ProtectedRoute>
            }
          />
          <Route
            path="/address"
            element={
              <ProtectedRoute>
                <Address />
              </ProtectedRoute>
            }
          />
          <Route
            path="/setting"
            element={
              <ProtectedRoute>
                <Setting />
              </ProtectedRoute>
            }
          />

          <Route
            path="/smile"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />

          {/* === Seller Routes (Protected) === */}
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

          {/* === Admin Routes (Protected) === */}
          <Route path="/admin" element={<Admin />} />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/users"
            element={
              <ProtectedRoute>
                <AdminUsers />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/admins"
            element={
              <ProtectedRoute>
                <AdminAdmins />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/vendors"
            element={
              <ProtectedRoute>
                <AdminVendors />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/products"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />

          {/* === Fallback Route === */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;