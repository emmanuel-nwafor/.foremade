import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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
              console.log('Fetched products:', productsList);
            } catch (err) {
              setError('Failed to fetch products: ' + err.message);
              console.error('Error fetching products:', err);
            }
          } else {
            setError('Please log in to view your products.');
          }
          setLoading(false);
        });
      } catch (err) {
        setError('Authentication error: ' + err.message);
        setLoading(false);
        console.error('Authentication error:', err);
      }
    };

    fetchProducts();
  }, []);

  const handleFilter = () => {
    let filtered = products;
    if (searchQuery) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredProducts(filtered);
  };

  const handleToggleActive = async (productId, currentActive) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, { active: !currentActive });
      setProducts(products.map(p => p.id === productId ? { ...p, active: !currentActive } : p));
      setFilteredProducts(filteredProducts.map(p => p.id === productId ? { ...p, active: !currentActive } : p));
    } catch (err) {
      console.error('Error toggling active status:', err);
      setError('Failed to toggle active status: ' + err.message);
    }
  };

  const handleToggleVisibility = async (productId, currentHidden) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, { isHidden: !currentHidden });
      setProducts(products.map(p => p.id === productId ? { ...p, isHidden: !currentHidden } : p));
      setFilteredProducts(filteredProducts.map(p => p.id === productId ? { ...p, isHidden: !currentHidden } : p));
    } catch (err) {
      console.error('Error toggling visibility:', err);
      setError('Failed to toggle visibility: ' + err.message);
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', productId));
      setProducts(products.filter(p => p.id !== productId));
      setFilteredProducts(filteredProducts.filter(p => p.id !== productId));
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Failed to delete product: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-600"></div>
        <p className="text-gray-700 ml-4 text-lg">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-white">
        <div className="bg-red-100 border-l-4 border-red-500 p-6 rounded-lg shadow">
          <p className="text-red-700 text-base mb-4">{error}</p>
          <Link to="/seller/login" className="text-blue-600 hover:text-blue-800 font-medium underline">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-50 to-white">
      <SellerSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-3 sm:p-4">
        <div className="bg-white rounded-xl shadow p-4 sm:p-5 border border-gray-200">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-5">
            <div className="mb-3 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center">
                <span className="mr-2">📦</span> My Products {products.length > 0 && <span className="ml-2 text-sm text-gray-600">({products.length})</span>}
              </h1>
              <p className="text-gray-500 text-sm mt-1">Manage and track all your listed products.</p>
            </div>
            <Link to="/seller/upload-product" className="bg-blue-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center">
              <span className="mr-1">+</span> Add New Product
            </Link>
          </div>

          <div className="mb-5 flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-1/3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleFilter();
                }}
                placeholder="Search by Product Name..."
                className="p-2 sm:p-3 pl-9 border border-gray-300 rounded-lg w-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <span className="absolute left-3 top-2 sm:top-3 text-gray-400"><i className="bx bx-search"></i></span>
            </div>
            <button className="px-4 py-2 sm:px-5 sm:py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300">
              Search
            </button>
          </div>

          <div className="overflow-x-auto">
            <div className="block sm:hidden">
              {filteredProducts.map((product, index) => (
                <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3 mb-2 shadow hover:shadow-md transition-transform transform hover:scale-105">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700">SL:</span>
                    <span className="text-gray-900">{index + 1}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700">Name:</span>
                    <span className="text-gray-900 truncate max-w-[150px]">{product.name || 'Unnamed Product'}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700">Type:</span>
                    <span className="text-gray-900">Physical</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700">Price:</span>
                    <span className="text-gray-900">₦{product.price || 0}</span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700">Verify:</span>
                    <span className={`text-sm font-medium ${
                      product.status === 'pending' ? 'text-orange-500' : 
                      product.status === 'approved' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {product.status === 'pending' ? 'Pending' : 
                       product.status === 'approved' ? 'Approved' : 'Not Approved'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-medium text-gray-700">Active:</span>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={product.active || false}
                        onChange={() => handleToggleActive(product.id, product.active)}
                        className="hidden peer"
                      />
                      <div className="w-10 h-5 rounded-full transition-colors peer-checked:bg-green-500 bg-gray-300">
                        <div className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform peer-checked:translate-x-6"></div>
                      </div>
                    </label>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-700">Actions:</span>
                    <div className="flex space-x-2">
                      <Link to={`/seller/edit-product/${product.id}`} className={`text-blue-600 hover:text-blue-800 ${product.status === 'pending' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <i className="bx bx-edit text-lg"></i>
                      </Link>
                      <button onClick={() => handleToggleVisibility(product.id, product.isHidden)} className="text-green-600 hover:text-green-800">
                        <i className={`bx ${product.isHidden ? 'bx-show' : 'bx-hide'} text-lg`}></i>
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800">
                        <i className="bx bx-trash text-lg"></i>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="hidden sm:block">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
                {filteredProducts.map((product) => (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3 shadow hover:shadow-md transition duration-300">
                    <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">{product.name || 'Unnamed Product'}</h3>
                    <p className="text-gray-600 text-sm mb-1">Type: Physical</p>
                    <p className="text-gray-600 text-sm mb-1">Price: ₦{product.price || 0}</p>
                    <p className={`text-sm font-medium mb-1 ${
                      product.status === 'pending' ? 'text-orange-500' : 
                      product.status === 'approved' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      Verify: {product.status === 'pending' ? 'Pending' : 
                             product.status === 'approved' ? 'Approved' : 'Not Approved'}
                    </p>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-gray-700 text-sm">Active:</span>
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={product.active || false}
                          onChange={() => handleToggleActive(product.id, product.active)}
                          className="hidden peer"
                        />
                        <div className="w-10 h-5 rounded-full transition-colors peer-checked:bg-green-500 bg-gray-300">
                          <div className="w-4 h-4 bg-white rounded-full shadow-md transform transition-transform peer-checked:translate-x-6"></div>
                        </div>
                      </label>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Link to={`/seller/edit-product/${product.id}`} className={`text-blue-600 hover:text-blue-800 ${product.status === 'pending' ? 'opacity-50 cursor-not-allowed' : ''}`}>
                        <i className="bx bx-edit text-lg"></i>
                      </Link>
                      <button onClick={() => handleToggleVisibility(product.id, product.isHidden)} className="text-green-600 hover:text-green-800">
                        <i className={`bx ${product.isHidden ? 'bx-show' : 'bx-hide'} text-lg`}></i>
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:text-red-800">
                        <i className="bx bx-trash text-lg"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {filteredProducts.length === 0 && (
            <p className="text-gray-600 text-center mt-4 text-lg">No products found.</p>
          )}
        </div>
      </div>
    </div>
  );
}