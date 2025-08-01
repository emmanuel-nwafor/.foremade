import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import AdminSidebar from './AdminSidebar';
import { Link } from 'react-router-dom';
import { RefreshCw } from 'lucide-react';

const AdminBumpedProducts = () => {
  const [bumpedProducts, setBumpedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBumpedProducts = async () => {
    try {
      setLoading(true);
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          const querySnapshot = await getDocs(collection(db, 'productBump'));
          const productsList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            expiry: doc.data().expiry?.toDate(),
            startDate: doc.data().startDate?.toDate(),
          }));
          setBumpedProducts(productsList);
        } else {
          setError('Please log in as an admin to view bumped products.');
        }
        setLoading(false);
      });
    } catch (err) {
      setError('Failed to fetch bumped products: ' + err.message);
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchBumpedProducts();
  };

  useEffect(() => {
    fetchBumpedProducts();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isBumpActive = (product) => product.expiry && new Date(product.expiry) > new Date();

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-gray-900">
        <AdminSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6">
          <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="bg-gray-200 p-4 rounded-lg h-64"></div>
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-gray-900">
        <AdminSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg dark:bg-red-900 dark:border-red-700">
              <p className="text-red-700 dark:text-red-300">{error}</p>
              <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium underline mt-2 block">
                Return to Login
              </Link>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-2">
            <Link to="/admin/dashboard" className="inline-block px-5 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 font-semibold">
              Return to Dashboard
            </Link>
            <button
              onClick={handleRefresh}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              Refresh
            </button>
          </div>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Bumped Products</h1>
            <p className="text-gray-600 mt-2">View all products currently bumped by sellers</p>
          </div>
          {bumpedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {bumpedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition duration-300"
                >
                  <div className="relative aspect-[4/3] mb-4 overflow-hidden rounded-lg">
                    <img
                      src={product.imageUrl || 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg'}
                      alt={product.name || 'Product Image'}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML =
                          '<div class="absolute w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-500">Image N/A</span></div>';
                      }}
                    />
                    <span className="absolute top-2 left-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {isBumpActive(product) ? 'Bump Active' : 'Bump Expired'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{product.name || 'Unnamed Product'}</h3>
                  <p className="text-gray-700 text-sm mb-1">Price: ₦{(product.price || 0).toLocaleString('en-NG')}</p>
                  <p className="text-gray-600 text-xs mb-1">Seller: {product.sellerId || 'Unknown'}</p>
                  <p className="text-gray-600 text-xs">Started: {formatDate(product.startDate)}</p>
                  <p className="text-gray-600 text-xs">Expires: {formatDate(product.expiry)}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center mt-10 mb-10">
              <p className="text-gray-900 text-center text-lg mt-4">No bumped products found.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminBumpedProducts;