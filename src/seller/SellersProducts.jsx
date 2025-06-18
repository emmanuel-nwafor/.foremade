import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { Link } from 'react-router-dom';
import SellerSidebar from './SellerSidebar';

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
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-3xl font-bold text-gray-800 flex items-center">
                <span className="mr-2">📦</span> My Products <span className="ml-2 text-sm text-gray-600">({filteredProducts.length})</span>
              </h1>
              <p className="text-gray-500 text-sm mt-1">Manage and track all your listed products.</p>
            </div>
            <Link to="/seller/upload-product" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center">
              <span className="mr-1">+</span> Add New Product
            </Link>
          </div>

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
                <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-4 mb-4 shadow-md hover:shadow-lg transition duration-300">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">SL:</span>
                    <span className="text-gray-900">{index + 1}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="text-gray-900 truncate max-w-[150px]">{product.name || 'Unnamed Product'}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Price:</span>
                    <span className="text-gray-900">₦{product.price || 0}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-gray-700">Verify:</span>
                    <span className={`text-sm font-medium ${
                      product.status === 'pending' ? 'text-orange-500' : 
                      product.status === 'approved' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {product.status === 'pending' ? 'Pending' : 
                       product.status === 'approved' ? 'Approved' : 'Not Approved'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2 text-left text-gray-700 font-semibold">SL</th>
                    <th className="p-2 text-left text-gray-700 font-semibold">Name</th>
                    <th className="p-2 text-left text-gray-700 font-semibold">Price</th>
                    <th className="p-2 text-left text-gray-700 font-semibold">Verify</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product, index) => (
                    <tr key={product.id} className="border-t hover:bg-gray-50 transition duration-200">
                      <td className="p-2 text-gray-900">{index + 1}</td>
                      <td className="p-2 text-gray-900 truncate max-w-xs">{product.name || 'Unnamed Product'}</td>
                      <td className="p-2 text-gray-900">₦{product.price || 0}</td>
                      <td className={`p-2 text-sm font-medium ${
                        product.status === 'pending' ? 'text-orange-500' : 
                        product.status === 'approved' ? 'text-green-500' : 'text-red-500'
                      }`}>
                        {product.status === 'pending' ? 'Pending' : 
                         product.status === 'approved' ? 'Approved' : 'Not Approved'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {filteredProducts.length === 0 && (
            <p className="text-gray-600 text-center mt-6 text-lg">No products found.</p>
          )}
        </div>
      </div>
    </div>
  );
}