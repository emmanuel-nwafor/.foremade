import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { toast } from 'react-toastify';
import CustomAlert, { useAlerts } from '../components/common/CustomAlert';
import { useAuth } from '../contexts/AuthContext';

const ProductBump = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [bumping, setBumping] = useState({});
  const { alerts, addAlert, removeAlert } = useAlerts();
  const { userProfile } = useAuth();

  const bumpDurations = [
    { value: '3d', label: '3 Days', price: '₦500' },
    { value: '6d', label: '6 Days', price: '₦900' }
  ];

  // Fetch seller's products
  const fetchProducts = async () => {
    try {
      const firebaseToken = await auth.currentUser?.getIdToken();
      if (!firebaseToken) {
        throw new Error('Authentication required');
      }

      // This would be your existing products endpoint
      const response = await fetch('/api/seller/products', {
        headers: {
          'Authorization': `Bearer ${firebaseToken}`
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setProducts(data.products || []);
      } else {
        toast.error(data.error || 'Failed to fetch products');
        throw new Error(data.error || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Fetch products error:', error);
      toast.error(error.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Bump product
  const bumpProduct = async (productId, duration) => {
    try {
      setBumping(prev => ({ ...prev, [productId]: true }));
      
      const firebaseToken = await auth.currentUser?.getIdToken();
      if (!firebaseToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/bump-product', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`
        },
        body: JSON.stringify({
          productId,
          bumpDuration: duration
        })
      });

      const data = await response.json();
      
      if (response.ok) {
        toast.success(data.message || 'Product bumped successfully!');
        // Refresh products to show updated bump status
        fetchProducts();
      } else {
        toast.error(data.error || 'Failed to bump product');
        throw new Error(data.error || 'Failed to bump product');
      }
    } catch (error) {
      console.error('Bump product error:', error);
      toast.error(error.message || 'Failed to bump product');
    } finally {
      setBumping(prev => ({ ...prev, [productId]: false }));
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isBumpActive = (product) => {
    if (!product.bumpExpiry) return false;
    return new Date(product.bumpExpiry) > new Date();
  };

  const getBumpStatus = (product) => {
    if (!product.bumpExpiry) return null;
    
    const now = new Date();
    const expiry = new Date(product.bumpExpiry);
    
    if (expiry > now) {
      const diffTime = expiry - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return `Active for ${diffDays} more day${diffDays !== 1 ? 's' : ''}`;
    }
    
    return 'Expired';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  if (userProfile && userProfile.isProSeller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-orange-600">Pro Seller Feature</h2>
          <p className="mb-4 text-gray-700">Bump up is only available to Pro Sellers. Upgrade now to boost your product visibility!</p>
          <a href="/pro-seller-guide-full" className="inline-block px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 font-semibold">Upgrade to Pro Seller</a>
          <div className="mt-6">
            <a href="/sell" className="inline-block px-5 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Return to Dashboard</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6 flex justify-between items-center">
          <a href="/sell" className="inline-block px-5 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Return to Dashboard</a>
        </div>
        <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Product Bump</h1>
          <p className="text-gray-600 mt-2">Boost your product visibility and increase sales</p>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-blue-900">How Product Bump Works</h3>
              <div className="mt-2 text-sm text-blue-700">
                <p className="mb-2">• Bumped products appear at the top of search results and category pages</p>
                <p className="mb-2">• Increased visibility leads to more views and potential sales</p>
                <p className="mb-2">• Bump duration options: 3 days or 6 days</p>
                <p>• You can bump multiple products simultaneously</p>
              </div>
            </div>
          </div>
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Product Image */}
              <div className="relative h-48 bg-gray-200">
                <img
                  src={product.imageUrls?.[0] || 'https://via.placeholder.com/300x200'}
                  alt={product.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/300x200';
                  }}
                />
                {isBumpActive(product) && (
                  <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                    BUMPED
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-sm text-gray-600 mb-2">{product.description}</p>
                <p className="text-lg font-bold text-blue-600 mb-3">
                  ₦{product.price?.toLocaleString()}
                </p>

                {/* Bump Status */}
                {isBumpActive(product) && (
                  <div className="mb-3 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-green-700">
                      {getBumpStatus(product)}
                    </p>
                    {product.bumpExpiry && (
                      <p className="text-xs text-green-600 mt-1">
                        Expires: {formatDate(product.bumpExpiry)}
                      </p>
                    )}
                  </div>
                )}

                {/* Bump Options */}
                {!isBumpActive(product) && (
                  <div className="space-y-2">
                    {bumpDurations.map((duration) => (
                      <button
                        key={duration.value}
                        onClick={() => bumpProduct(product.id, duration.value)}
                        disabled={bumping[product.id]}
                        className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      >
                        <span className="text-sm font-medium text-blue-900">
                          {duration.label}
                        </span>
                        <span className="text-sm text-blue-600 font-bold">
                          {duration.price}
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Loading State */}
                {bumping[product.id] && (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                    <span className="ml-2 text-sm text-gray-600">Processing...</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {products.length === 0 && (
          <div className="text-center py-12">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
            <p className="mt-1 text-sm text-gray-500">
              You need to have products to bump them for increased visibility.
            </p>
            <div className="mt-6">
              <a
                href="/seller/upload-product"
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Upload Product
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductBump; 