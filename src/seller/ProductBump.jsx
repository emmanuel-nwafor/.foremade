import React, { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase';
import { collection, addDoc, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import SellerSidebar from './SellerSidebar';
import { Link } from 'react-router-dom';
import debounce from 'lodash.debounce';
import { PlusCircle, RefreshCw, CheckCircle } from 'lucide-react';
import { toast } from 'react-toastify';
import PaystackCheckout from '/src/components/checkout/PaystackCheckout';
import { useAuth } from '../contexts/AuthContext';

const ProductBump = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bumping, setBumping] = useState({});
  const [bumpQuota, setBumpQuota] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { userProfile } = useAuth();
  const [timeRemaining, setTimeRemaining] = useState({});

  const bumpDurations = [
    { value: '72h', label: '3 Days', price: 1500, hours: '72h' },
    { value: '168h', label: '7 Days', price: 3500, hours: '168h' },
  ];

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  const fetchProducts = async () => {
    try {
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          try {
            const q = query(collection(db, 'products'), where('sellerId', '==', user.uid));
            const querySnapshot = await getDocs(q);
            const productsList = querySnapshot.docs.map((doc) => {
              const data = doc.data();
              const imageUrls = Array.isArray(data.imageUrls)
                ? data.imageUrls.filter((url) => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/'))
                : data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('https://res.cloudinary.com/')
                ? [data.imageUrl]
                : ['https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg'];
              return {
                id: doc.id,
                ...data,
                imageUrls: imageUrls.length > 0 ? imageUrls : ['https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg'],
                uploadDate: data.uploadDate ? data.uploadDate.toDate() : new Date(),
                bumpExpiry: data.bumpExpiry ? data.bumpExpiry.toDate() : null,
                isBumped: data.isBumped || false,
              };
            });
            setProducts(productsList);
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

  const fetchBumpQuota = async () => {
    try {
      const response = await fetch('https://foremade-backend.onrender.com/api/pro-seller/bump-quota', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const text = await response.text();
      if (!response.ok) {
        const errorData = text ? JSON.parse(text) : { error: 'Unknown error' };
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error || 'No details'}`);
      }
      const data = text ? JSON.parse(text) : {};
      setBumpQuota(data.quota || 0);
    } catch (error) {
      console.error('Fetch bump quota error:', error.message);
      setBumpQuota(0);
      toast.error('Failed to load bump quota. Please try again.');
    }
  };

  const handlePaymentSuccess = async (paymentData, productId, durationHours) => {
    try {
      setIsProcessing(true);
      const user = auth.currentUser;
      if (!user) {
        throw new Error('User not authenticated');
      }
      const firebaseToken = await user.getIdToken(true); // Force refresh token
      const durationMap = { '72h': '72h', '168h': '168h' };
      const mappedDuration = durationMap[durationHours] || '24h';
      const backendUrl = 'https://foremade-backend.onrender.com';

      const duration = bumpDurations.find((d) => d.hours === durationHours);
      const totalAmount = duration.price * 100;
      const adminFee = Math.floor(totalAmount * 0.1);
      const sellerAmount = totalAmount - adminFee;

      const response = await fetch(`${backendUrl}/api/bump-product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({
          productId,
          bumpDuration: mappedDuration,
          paymentIntentId: paymentData.reference || `fallback-${Date.now()}`,
          adminFee,
          sellerAmount,
        }),
      });

      const text = await response.text();
      if (!response.ok) {
        const errorData = text ? JSON.parse(text) : { error: 'Unknown error' };
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error || 'No details'}`);
      }

      const data = text ? JSON.parse(text) : {};
      toast.success(data.message || 'Product bumped successfully!');

      const bumpExpiry = new Date();
      const durationInMs = {
        '72h': 72 * 60 * 60 * 1000,
        '168h': 168 * 60 * 60 * 1000,
      }[mappedDuration];
      bumpExpiry.setTime(bumpExpiry.getTime() + durationInMs);

      await addDoc(collection(db, 'bumpTransactions'), {
        productId,
        sellerId: user.uid,
        bumpDuration: mappedDuration,
        paymentIntentId: paymentData.reference || `fallback-${Date.now()}`,
        bumpExpiry,
        timestamp: new Date(),
      });

      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, { bumpExpiry, isBumped: true });

      const emailResponse = await fetch(`${backendUrl}/api/send-bump-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`,
        },
        body: JSON.stringify({
          sellerId: user.uid,
          productId,
          productName: products.find((p) => p.id === productId)?.name || 'Unnamed Product',
          expiryDate: bumpExpiry.toISOString(),
        }),
      });
      if (!emailResponse.ok) {
        console.warn('Email notification failed:', await emailResponse.text());
      }

      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId ? { ...product, bumpExpiry, isBumped: true } : product
        )
      );
      setBumpQuota((prev) => prev - 1);
    } catch (error) {
      console.error('Bump product error:', error.message);
      toast.error(error.message || 'Failed to bump product');
    } finally {
      setIsProcessing(false);
      setBumping((prev) => ({ ...prev, [productId]: false }));
    }
  };

  const handleCancel = () => {
    toast.info('Payment cancelled.', { position: 'top-right', autoClose: 3000 });
  };

  const handleProductClick = async (productId) => {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, {
      views: (products.find((p) => p.id === productId)?.views || 0) + 1,
    });
  };

  useEffect(() => {
    let unsubscribe;
    const setupAuthListener = () => {
      unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
          fetchProducts();
          fetchBumpQuota();
        } else {
          setError('Please log in to view your products.');
          setLoading(false);
        }
      });
    };
    setupAuthListener();
    return () => unsubscribe && unsubscribe();
  }, []);

  useEffect(() => {
    const updateTimeRemaining = () => {
      const newTimeRemaining = {};
      products.forEach((product) => {
        if (product.bumpExpiry && new Date(product.bumpExpiry) > new Date()) {
          const now = new Date();
          const expiry = new Date(product.bumpExpiry);
          const diffMs = expiry - now;
          newTimeRemaining[product.id] = diffMs > 0 ? diffMs : 0;
        }
      });
      setTimeRemaining(newTimeRemaining);
    };

    updateTimeRemaining();
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [products]);

  const formatTime = (ms) => {
    if (ms <= 0) return 'Expired';
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isBumpActive = (product) => product.isBumped && product.bumpExpiry && new Date(product.bumpExpiry) > new Date();

  const handleRefresh = () => window.location.reload();

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-50">
        <SellerSidebar onToggle={() => setSidebarOpen(!sidebarOpen)} isOpen={sidebarOpen} />
        <div className={`flex-1 p-2 sm:p-4 ${sidebarOpen ? 'ml-64' : 'ml-0'} transition-all duration-300 md:ml-64 flex justify-center items-center`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-4 w-full max-w-5xl">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3 shadow-sm animate-pulse h-32 sm:h-40" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-100 to-gray-50">
        <div className="bg-red-50 border-l-4 border-red-500 p-3 sm:p-4 rounded-lg shadow-lg max-w-xs sm:max-w-md mx-auto">
          <p className="text-red-700 text-sm sm:text-base mb-1 sm:mb-2">{error}</p>
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium underline text-sm sm:text-base">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  if (userProfile && !userProfile.isProSeller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-3 sm:p-4 rounded-lg shadow text-center max-w-sm sm:max-w-md mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-2 sm:mb-3 text-orange-600">Pro Seller Feature</h2>
          <p className="mb-2 sm:mb-3 text-gray-700 text-sm sm:text-base">Product bump is only available to Pro Sellers. Upgrade now to boost your products' visibility!</p>
          <Link to="/pro-seller-guide-full" className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 text-white rounded font-semibold" style={{ backgroundColor: '#112d4e' }} onMouseOver={(e) => e.target.style.backgroundColor = '#0d2440'} onMouseOut={(e) => e.target.style.backgroundColor = '#112d4e'}>Upgrade to Pro Seller</Link>
          <div className="mt-2 sm:mt-3">
            <Link to="/sell" className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 font-semibold text-sm sm:text-base">Return to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex m-5">
      <SellerSidebar onToggle={() => setSidebarOpen(!sidebarOpen)} isOpen={sidebarOpen} />
      <div className={`flex-1 p-2 sm:p-4 ${sidebarOpen ? 'ml-64' : 'ml-0'} mt-6 transition-all duration-300 md:ml-64`}>
        <div className="mb-4 sm:mb-6">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Product Bump</h1>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">Boost your products' visibility with the bump feature. Quota: {bumpQuota}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
            <div className="p-4 flex items-center">
              <div className="p-1 sm:p-1.5 bg-blue-100 rounded-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-1 sm:ml-2">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Bump Overview</h3>
                <p className="text-xs sm:text-sm text-gray-700">Increase visibility of your products</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 sm:p-3">
            <div className="flex items-center">
              <div className="p-1 sm:p-1.5 bg-blue-100 rounded-lg">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="ml-1 sm:ml-2">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900">Refresh</h3>
                <p className="text-xs sm:text-sm text-gray-700">Update your product list</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="mt-1 sm:mt-2 w-full px-2 sm:px-3 py-1 sm:py-1.5 text-white rounded-lg transition-colors text-xs sm:text-sm"
              style={{ backgroundColor: '#112d4e' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0d2440'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#112d4e'}
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-lg p-2 sm:p-3 shadow-md hover:shadow-lg transition duration-300"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="relative aspect-square sm:aspect-[4/3] mb-1 sm:mb-2 overflow-hidden rounded-lg">
                  <img
                    src={product.imageUrls[0]}
                    alt={product.name || 'Product Image'}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML =
                        '<div class="absolute w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-500 text-xs sm:text-sm">Image N/A</span></div>';
                    }}
                  />
                  {isBumpActive(product) && (
                    <span className="absolute top-1 left-1 inline-flex items-center px-1 sm:px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Bumped Up
                    </span>
                  )}
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-1 truncate">{product.name || 'Unnamed Product'}</h3>
                <p className="text-gray-700 text-xs sm:text-sm mb-1">Price: ₦{(product.price || 0).toLocaleString('en-NG')}</p>
                <p className="text-gray-600 text-xs mt-1">Uploaded: {product.uploadDate.toLocaleDateString('en-NG', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}</p>
                {isBumpActive(product) && timeRemaining[product.id] > 0 && (
                  <div className="mt-1 sm:mt-2 p-1 sm:p-1.5 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-xs sm:text-sm text-gray-900">Time Remaining: {formatTime(timeRemaining[product.id])}</p>
                    {product.bumpExpiry && (
                      <p className="text-xs mt-0.5">Expires: {formatDate(product.bumpExpiry)}</p>
                    )}
                  </div>
                )}
                {!isBumpActive(product) && (
                  <div className="mt-1 sm:mt-2 space-y-1 sm:space-y-1.5">
                    {bumpDurations.map((duration) => (
                      <PaystackCheckout
                        key={duration.hours}
                        email={auth.currentUser?.email}
                        amount={duration.price * 100}
                        onSuccess={(paymentData) => handlePaymentSuccess(paymentData, product.id, duration.hours)}
                        onClose={handleCancel}
                        disabled={bumping[product.id] || bumpQuota <= 0 || isProcessing}
                        buttonText={`${duration.label} (₦${duration.price.toLocaleString('en-NG')})`}
                        className={`w-full flex items-center justify-center px-1.5 sm:px-2 py-1 rounded-lg text-xs sm:text-sm font-medium transition duration-200 ${
                          bumping[product.id] || bumpQuota <= 0 || isProcessing
                            ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                            : 'text-white'
                        }`}
                        style={!(bumping[product.id] || bumpQuota <= 0 || isProcessing) ? { backgroundColor: '#112d4e' } : {}}
                        onMouseOver={(e) => {
                          if (!(bumping[product.id] || bumpQuota <= 0 || isProcessing)) {
                            e.target.style.backgroundColor = '#0d2440';
                          }
                        }}
                        onMouseOut={(e) => {
                          if (!(bumping[product.id] || bumpQuota <= 0 || isProcessing)) {
                            e.target.style.backgroundColor = '#112d4e';
                          }
                        }}
                        sellerId={auth.currentUser?.uid}
                      />
                    ))}
                  </div>
                )}
                {bumping[product.id] && (
                  <div className="flex items-center justify-center py-1">
                    <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border-b-2 border-blue-600"></div>
                    <span className="ml-1 text-xs sm:text-sm text-blue-600">Processing...</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center mt-4 sm:mt-6 mb-4 sm:mb-6">
              <PlusCircle className="w-12 sm:w-16 h-12 sm:h-16 text-gray-300" />
              <p className="text-gray-900 text-center text-sm sm:text-base mt-1 sm:mt-2">No products uploaded yet.<br />Start by adding your first product!</p>
              <Link
                to="/products-upload"
                className="mt-1 sm:mt-2 px-3 sm:px-4 py-1 sm:py-1.5 text-white rounded-lg transition duration-300 text-sm sm:text-base"
                style={{ backgroundColor: '#112d4e' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0d2440'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#112d4e'}
              >
                Add Your First Product
              </Link>
            </div>
          )}
        </div>
        <div className="mt-3 sm:mt-4 bg-blue-50/50 border border-blue-100 rounded-lg p-4 sm:p-4">
          <h3 className="text-sm sm:text-base font-semibold text-blue-800 mb-1 sm:mb-2">How Product Bump Works</h3>
          <div className="text-xs sm:text-sm text-blue-700/80 space-y-0.5 sm:space-y-1">
            <p>• Select a product from the list below.</p>
            <p>• Choose a bump duration (3 or 7 days) and click the corresponding button.</p>
            <p>• Complete the payment via Paystack to activate the bump.</p>
            <p>• Bumped products appear at the top of search results for the selected duration.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductBump;