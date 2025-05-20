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
  const [brandFilter, setBrandFilter] = useState('All Brands');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [subCategoryFilter, setSubCategoryFilter] = useState('');
  const [subSubCategoryFilter, setSubSubCategoryFilter] = useState('');

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
                isHidden: doc.data().isHidden || false // Add isHidden field
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
    if (brandFilter !== 'All Brands') filtered = filtered.filter(p => p.brand === brandFilter);
    if (categoryFilter) filtered = filtered.filter(p => p.category === categoryFilter);
    if (subCategoryFilter) filtered = filtered.filter(p => p.subCategory === subCategoryFilter);
    if (subSubCategoryFilter) filtered = filtered.filter(p => p.subSubCategory === subSubCategoryFilter);
    if (searchQuery) filtered = filtered.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    setFilteredProducts(filtered);
  };

  const handleReset = () => {
    setBrandFilter('All Brands');
    setCategoryFilter('');
    setSubCategoryFilter('');
    setSubSubCategoryFilter('');
    setSearchQuery('');
    setFilteredProducts(products);
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-600"></div>
        <p className="text-gray-600 mt-2">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-600 text-[10px] mb-4">{error}</p>
          <Link to="/seller/login" className="text-blue-600 hover:underline">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <SellerSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-4 sm:p-6">
        <div className="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
          <h1 className="text-lg sm:text-xl font-semibold text-gray-700 mb-4">Product List {products.length > 0 && `(${products.length})`}</h1>
          <div className="border-b pb-4 mb-4">
            <h2 className="text-sm font-medium text-gray-600 mb-2">Filter Products</h2>
            <div className="flex flex-wrap gap-2 sm:gap-4 items-end">
              <select
                value={brandFilter}
                onChange={(e) => setBrandFilter(e.target.value)}
                className="p-1 sm:p-2 border rounded-lg text-xs sm:text-sm w-full sm:w-auto"
              >
                <option value="All Brands">All Brands</option>
                <option value="Brand1">Brand1</option>
                <option value="Brand2">Brand2</option>
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="p-1 sm:p-2 border rounded-lg text-xs sm:text-sm w-full sm:w-auto"
              >
                <option value="">Select Category</option>
                <option value="Electronics">Electronics</option>
                <option value="Fashion">Fashion</option>
              </select>
              <select
                value={subCategoryFilter}
                onChange={(e) => setSubCategoryFilter(e.target.value)}
                className="p-1 sm:p-2 border rounded-lg text-xs sm:text-sm w-full sm:w-auto"
              >
                <option value="">Select Sub Category</option>
                <option value="SubCat1">SubCat1</option>
                <option value="SubCat2">SubCat2</option>
              </select>
              <select
                value={subSubCategoryFilter}
                onChange={(e) => setSubSubCategoryFilter(e.target.value)}
                className="p-1 sm:p-2 border rounded-lg text-xs sm:text-sm w-full sm:w-auto"
              >
                <option value="">Select Sub Sub Category</option>
                <option value="SubSubCat1">SubSubCat1</option>
                <option value="SubSubCat2">SubSubCat2</option>
              </select>
              <button
                onClick={handleReset}
                className="px-2 sm:px-4 py-1 sm:py-2 bg-gray-200 text-gray-700 rounded-lg text-xs sm:text-sm hover:bg-gray-300 w-full sm:w-auto"
              >
                Reset
              </button>
              <button
                onClick={handleFilter}
                className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 w-full sm:w-auto"
              >
                Show data
              </button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 sm:gap-4 items-center mb-4">
            <div className="relative w-full sm:w-auto">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Product Name"
                className="p-1 sm:p-2 border rounded-l-lg text-xs sm:text-sm pl-8 w-full"
              />
              <span className="absolute left-2 top-1 sm:top-2 text-gray-400"><i className="bx bx-search text-base sm:text-lg"></i></span>
            </div>
            <button className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 w-full sm:w-auto">
              Search
            </button>
            <button className="px-2 sm:px-4 py-1 sm:py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm hover:bg-green-700 w-full sm:w-auto">
              Export
            </button>
            <button className="px-2 sm:px-4 py-1 sm:py-2 bg-yellow-500 text-white rounded-lg text-xs sm:text-sm hover:bg-yellow-600 w-full sm:w-auto">
              Limited Stocks
            </button>
            <Link to="/vendor/upload-products" className="px-2 sm:px-4 py-1 sm:py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 w-full sm:w-auto">
              + Add new product
            </Link>
          </div>
          <div className="overflow-x-auto shadow-sm">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-1 sm:p-2 text-xs sm:text-sm font-semibold text-gray-700">SL</th>
                  <th className="p-1 sm:p-2 text-xs sm:text-sm font-semibold text-gray-700">Product Name</th>
                  <th className="p-1 sm:p-2 text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">Product Type</th>
                  <th className="p-1 sm:p-2 text-xs sm:text-sm font-semibold text-gray-700 hidden sm:table-cell">Unit Price</th>
                  <th className="p-1 sm:p-2 text-xs sm:text-sm font-semibold text-gray-700">Verify Status</th>
                  <th className="p-1 sm:p-2 text-xs sm:text-sm font-semibold text-gray-700">Active Status</th>
                  <th className="p-1 sm:p-2 text-xs sm:text-sm font-semibold text-gray-700">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr key={product.id} className="border-b hover:bg-gray-50">
                    <td className="p-1 sm:p-2 text-xs sm:text-sm text-gray-800">{index + 1}</td>
                    <td className="p-1 sm:p-2 text-xs sm:text-sm text-gray-800 truncate max-w-[100px] sm:max-w-[150px]">{product.name || 'Unnamed Product'}</td>
                    <td className="p-1 sm:p-2 text-xs sm:text-sm text-gray-800 hidden sm:table-cell">Physical</td>
                    <td className="p-1 sm:p-2 text-xs sm:text-sm text-gray-800 hidden sm:table-cell">₦{product.price || 0}</td>
                    <td className={`p-1 sm:p-2 text-xs sm:text-sm font-medium ${
                      product.status === 'pending' ? 'text-orange-500' : 
                      product.status === 'approved' ? 'text-green-500' : 'text-red-500'
                    }`}>
                      {product.status === 'pending' ? 'Pending' : 
                       product.status === 'approved' ? 'Approved' : 'Not Approved'}
                    </td>
                    <td className="p-1 sm:p-2 text-xs sm:text-sm">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={product.active || false}
                          onChange={() => handleToggleActive(product.id, product.active)}
                          className="hidden"
                        />
                        <div className={`w-8 sm:w-10 h-4 sm:h-5 rounded-full transition-colors ${
                          product.active ? 'bg-green-500' : 'bg-gray-300'
                        }`}>
                          <div className={`w-3 sm:w-4 h-3 sm:h-4 bg-white rounded-full shadow-md transform transition-transform ${
                            product.active ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0.5'
                          }`}></div>
                        </div>
                      </label>
                    </td>
                    <td className="p-1 sm:p-2 text-xs sm:text-sm flex space-x-1 sm:space-x-2">
                      <Link to={`/vendor/edit-product/${product.id}`} className="text-blue-600 hover:underline">
                        <i className="bx bx-edit text-base sm:text-lg"></i>
                      </Link>
                      <button onClick={() => handleToggleVisibility(product.id, product.isHidden)} className="text-green-600 hover:underline">
                        <i className={`bx ${product.isHidden ? 'bx-show' : 'bx-hide'} text-base sm:text-lg`}></i>
                      </button>
                      <button onClick={() => handleDelete(product.id)} className="text-red-600 hover:underline">
                        <i className="bx bx-trash text-base sm:text-lg"></i>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredProducts.length === 0 && (
            <p className="text-gray-600 text-center mt-4 text-xs sm:text-sm">No products found.</p>
          )}
        </div>
      </div>
    </div>
  );
}