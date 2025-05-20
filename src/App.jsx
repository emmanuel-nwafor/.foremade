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
import SellerRegister from './seller/SellerRegister';
import SellerProductUpload from './seller/SellerProductUpload';
import Orders from './profile/Orders';
import Address from './profile/Address';
import Setting from './profile/Setting';
import SellerLogin from './seller/SellerLogin';
import OrderConfirmation from './components/checkout/OrderConfirmation';
import UsersOrdersPage from './seller/UsersOrdersPage';
import SettingsPage from './seller/SettingsPage';
import SellerAgreement from './seller/SellerAgreement';
import SellerForgotPassword from './seller/SellerForgetPassword';
import Dashboard from './seller/Dashboard';
import SellersProducts from './seller/SellersProducts';
import SellerProductGallery from './seller/SellerProductGallery';
import Admin from '/src/admin/Admin';
import AdminDashboard from '/src/admin/AdminDashboard';
import AdminUsers from '/src/admin/AdminUsers';
import AdminAdmins from '/src/admin/AdminAdmins';
import AdminVendors from '/src/admin/AdminVendors';

const Layout = ({ children }) => {
  const location = useLocation();
  const hideHeaderFooter = [
    '/login',
    '/register',
    '/seller/register',
    '/seller/login',
    '/vendor/dashboard',
    '/overview',
    '/vendor/orders',
    '/vendor/products',
    '/settings',
    '/seller/agreement',
    '/seller/forgot-password',
    '/vendor/products-gallery',
    '/vendor/products-upload',
    '/admin',
    '/admin/dashboard',
    '/admin/users',
    '/admin/admins',
    '/admin/vendors',
    '/admin/products',
  ].includes(location.pathname);

  return (
    <>
      {!hideHeaderFooter && <Header />}
      <main className="min-h-screen bg-white text-black dark:bg-gray-900 dark:text-white">
        {children}
      </main>
      {!hideHeaderFooter && <Footer />}
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
          <Route path="/seller/login" element={<SellerLogin />} />
          <Route path="/seller/register" element={<SellerRegister />} />
          <Route path="/seller/forgot-password" element={<SellerForgotPassword />} />
          <Route path="/seller/agreement" element={<SellerAgreement />} />

          {/* === Public Routes === */}
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<Products />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/best-selling" element={<BestSelling />} />

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

          {/* === Seller Routes (Protected) === */}
          <Route
            path="/vendor/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/products"
            element={
              <ProtectedRoute>
                <SellersProducts />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/products-upload"
            element={
              <ProtectedRoute>
                <SellerProductUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/products-gallery"
            element={
              <ProtectedRoute>
                <SellerProductGallery />
              </ProtectedRoute>
            }
          />
          <Route
            path="/vendor/orders"
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
          <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
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