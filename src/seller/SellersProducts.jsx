import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import SellerSidebar from './SellerSidebar';
import { Info, RefreshCw, Edit2, PlusCircle, Package, Plus } from 'lucide-react';

export default function SellersProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              const q = query(collection(db, 'products'), where('sellerId', '==', user.uid));
              const querySnapshot = await getDocs(q);
              const productsList = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                active: doc.data().active || true,
                isHidden: doc.data().isHidden || false
              }));
              setProducts(productsList);
              setFilteredProducts(productsList);
            } catch (err) {
              setError('Failed to fetch products: ' + err.message);
            }
          } else {
            setError('Please log in to view your products.');
          }
          setLoading(false);
        });
      } catch (err) {
        setError('Authentication error: ' + err.message);
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    const filtered = products.filter(p =>
      p.name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [searchQuery, products]);

  const handleRefresh = () => window.location.reload();

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <i className="bx bx-loader bx-spin text-2xl"></i>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-50">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg">
          <p className="text-red-700 text-base mb-4">{error}</p>
          <Link to="/seller/login" className="text-blue-600 hover:text-blue-800 font-medium underline">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-50">
      <SellerSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-4">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mb-8 p-4 sm:p-6 md:p-8 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 shadow-sm">
          <Package className="w-8 h-8 text-blue-600 mb-2 md:mb-0" />
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 flex items-center gap-3 flex-wrap">
              My Products
              <span className="inline-block bg-blue-100 text-blue-700 text-base md:text-lg font-semibold px-3 py-1 rounded-full ml-2">{products.length} {products.length === 1 ? 'Product' : 'Products'}</span>
            </h1>
            <p className="text-gray-500 text-sm md:text-base mt-1">Manage and track all your listed products.</p>
          </div>
          <button onClick={handleRefresh} title="Refresh" className="ml-0 md:ml-auto bg-white border border-blue-200 rounded-full p-2 md:p-3 hover:bg-blue-100 transition focus:outline-blue-400 focus:ring-2 focus:ring-blue-300 mt-2 md:mt-0">
            <RefreshCw className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </button>
          <Link to="/products-upload" className="hidden sm:flex bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 md:px-10 md:py-5 rounded-xl hover:from-blue-700 hover:to-purple-700 transition duration-300 items-center gap-3 shadow-xl focus:outline-blue-400 focus:ring-4 focus:ring-blue-300 ml-4 font-bold text-lg md:text-xl animate-none hover:animate-pulseBtn">
            <PlusCircle className="w-7 h-7 md:w-8 md:h-8" /> <span>Add New Product</span>
          </Link>
        </div>
        {/* Floating Add Button (Mobile/Tablet): use better + icon */}
        <Link
          to="/products-upload"
          className="sm:hidden fixed bottom-8 right-4 md:bottom-12 md:right-12 z-50 rounded-full bg-gradient-to-br from-blue-600 via-purple-500 to-pink-500 text-white p-7 shadow-2xl hover:from-blue-700 hover:to-pink-600 transition focus:outline-blue-400 focus:ring-4 focus:ring-blue-300 flex items-center justify-center animate-pulseBtn"
          title="Add New Product"
          aria-label="Add New Product"
          tabIndex={0}
        >
          {/* Use Lucide Plus or a custom SVG for a bold + icon */}
          <Plus className="w-12 h-12 font-bold" />
          <span className="sr-only">Add New Product</span>
        </Link>
        {/* Main Card */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 max-w-full overflow-x-auto">

          <div className="mb-6 flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-1/3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name..."
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"><i className="bx bx-search"></i></span>
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  <i className="bx bx-x"></i>
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="block sm:hidden">
              {filteredProducts.map((product, index) => (
                <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-md hover:shadow-xl transition duration-300 animate-slide-in focus:ring-2 focus:ring-blue-300 outline-none" tabIndex={0}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">SL:</span>
                    <span className="text-gray-900">{index + 1}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Name:</span>
                    <Link to={`/seller/edit-product/${product.id}`} className="text-blue-900 font-medium hover:underline focus:underline cursor-pointer focus:outline-blue-400">{product.name || 'Unnamed Product'}</Link>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Price:</span>
                    <span className="text-gray-900">₦{product.price || 0}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Verify:</span>
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                      product.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      product.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status === 'pending' && <Info className="w-3 h-3" />} 
                      {product.status === 'approved' && <Info className="w-3 h-3" />} 
                      {product.status === 'pending' ? 'Pending' : product.status === 'approved' ? 'Approved' : 'Not Approved'}
                    </span>
                  </div>
                  <div className="flex justify-end mt-2">
                    <Link to={`/seller/edit-product/${product.id}`} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded focus:outline-blue-400 focus:ring-2 focus:ring-blue-300 transition" title="View/Edit Product">
                      <Edit2 className="w-4 h-4" /> Edit
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            {/* Table: improved for tablet */}
            <div className="hidden sm:block w-full overflow-x-auto">
              <table className="w-full min-w-[600px] border-collapse text-sm md:text-base">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left text-gray-700 font-semibold">SL</th>
                    <th className="p-2 text-left text-gray-700 font-semibold">Name</th>
                    <th className="p-2 text-left text-gray-700 font-semibold">Price</th>
                    <th className="p-2 text-left text-gray-700 font-semibold flex items-center gap-1">
                      Verify
                      <span className="group relative cursor-pointer">
                        <Info className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition" />
                        <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-40 bg-gray-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity duration-200 shadow-lg">
                          Status: Pending = Awaiting approval, Approved = Live, Not Approved = Rejected
                        </span>
                      </span>
                    </th>
                    <th className="p-2 text-left text-gray-700 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <tr key={product.id} className={`border-t transition duration-200 animate-slide-in outline-none ${index % 2 === 0 ? 'bg-white' : 'bg-blue-50'}`} tabIndex={0}>
                      <td className="p-2 text-gray-900">{index + 1}</td>
                      <td className="p-2 text-blue-900 font-medium truncate max-w-xs hover:underline focus:underline cursor-pointer" title={product.name || 'Unnamed Product'}>
                        <Link to={`/seller/edit-product/${product.id}`} className="focus:outline-blue-400">{product.name || 'Unnamed Product'}</Link>
                      </td>
                      <td className="p-2 text-gray-900">₦{product.price || 0}</td>
                      <td className="p-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${
                          product.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                          product.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.status === 'pending' && <Info className="w-3 h-3" />} 
                          {product.status === 'approved' && <Info className="w-3 h-3" />} 
                          {product.status === 'pending' ? 'Pending' : product.status === 'approved' ? 'Approved' : 'Not Approved'}
                        </span>
                      </td>
                      <td className="p-2">
                        <Link to={`/seller/edit-product/${product.id}`} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded focus:outline-blue-400 focus:ring-2 focus:ring-blue-300 transition" title="View/Edit Product">
                          <Edit2 className="w-4 h-4" /> Edit
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-10 mb-10 animate-slide-in">
              <img src="/src/assets/icons/empty-cart.svg" alt="No products" className="w-32 h-32 mb-6 opacity-80" />
              <p className="text-gray-700 text-center text-xl font-semibold mb-4">No products found</p>
              <Link to="/products-upload" className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center gap-2 shadow-lg focus:outline-blue-400 focus:ring-2 focus:ring-blue-300">
                <PlusCircle className="w-5 h-5" /> Add Your First Product
              </Link>
            </div>
          )}
        </div>
      </div>
      <style>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(16px); }
          to { opacity: 1; transform: none; }
        }
        .animate-fade-in {
          animation: fade-in 0.7s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes slide-in {
          from { opacity: 0; transform: translateY(32px); }
          to { opacity: 1; transform: none; }
        }
        .animate-slide-in {
          animation: slide-in 0.7s cubic-bezier(0.4,0,0.2,1);
        }
        @keyframes pulseBtn {
          0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4), 0 8px 32px 0 rgba(30,58,138,0.18); }
          50% { box-shadow: 0 0 0 12px rgba(124,58,237,0.15), 0 8px 32px 0 rgba(30,58,138,0.18); }
        }
        .animate-pulseBtn {
          animation: pulseBtn 1.2s infinite;
        }
      `}</style>
    </div>
  );
}