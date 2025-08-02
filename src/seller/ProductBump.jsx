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

  const fetchBumpQuota = async (firebaseToken) => {
    try {
      const response = await fetch('https://foremade-backend.onrender.com/api/pro-seller/bump-quota', {
        headers: { 'Authorization': `Bearer ${firebaseToken}` },
      });
      const text = await response.text();
      if (!response.ok) {
        const errorData = text ? JSON.parse(text) : { error: 'Unknown error' };
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.error || 'No details'}`);
      }
      const data = text ? JSON.parse(text) : {};
      setBumpQuota(data.quota || 0);
    } catch (error) {
      setBumpQuota(0);
      toast.error('Failed to load bump quota. Buttons may be disabled.');
    }
  };

  const handlePaymentSuccess = async (paymentData, productId, durationHours) => {
    try {
      setIsProcessing(true);
      const firebaseToken = await auth.currentUser?.getIdToken();
      const durationMap = { '72h': '72h', '168h': '168h' };
      const mappedDuration = durationMap[durationHours] || '24h';
      const backendUrl = 'https://foremade-backend.onrender.com';

      const duration = bumpDurations.find((d) => d.hours === durationHours);
      const totalAmount = duration.price * 100;
      const adminFee = Math.floor(totalAmount * 0.1);
      const sellerAmount = totalAmount - adminFee;

      const response = await fetch(`${backendUrl}/api/bump-product`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${firebaseToken}` },
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
        sellerId: auth.currentUser?.uid,
        bumpDuration: mappedDuration,
        paymentIntentId: paymentData.reference || `fallback-${Date.now()}`,
        bumpExpiry,
        timestamp: new Date(),
      });

      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, { bumpExpiry, isBumped: true });

      // Send email notification to seller
      const emailResponse = await fetch(`${backendUrl}/api/send-bump-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${firebaseToken}` },
        body: JSON.stringify({
          sellerId: auth.currentUser?.uid,
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
    fetchProducts();
    const fetchQuotaOnAuth = async () => {
      const firebaseToken = await auth.currentUser?.getIdToken();
      if (firebaseToken) fetchBumpQuota(firebaseToken);
    };
    fetchQuotaOnAuth();
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
      <div className="min-h-screen flex bg-gradient-to-br from-background-light to-background-light/50">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm animate-pulse h-64" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-background-light to-background-light/50">
        <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg">
          <p className="text-red-700 text-base mb-4">{error}</p>
          <Link to="/login" className="text-secondary hover:text-secondary/80 font-medium underline">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  if (userProfile && !userProfile.isProSeller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-orange-600">Pro Seller Feature</h2>
          <p className="mb-4 text-gray-700">Product bump is only available to Pro Sellers. Upgrade now to boost your products' visibility!</p>
          <Link to="/pro-seller-guide-full" className="inline-block px-6 py-2 text-white rounded font-semibold" style={{ backgroundColor: '#112d4e' }} onMouseOver={(e) => e.target.style.backgroundColor = '#0d2440'} onMouseOut={(e) => e.target.style.backgroundColor = '#112d4e'}>Upgrade to Pro Seller</Link>
          <div className="mt-6">
            <Link to="/sell" className="inline-block px-5 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 font-semibold">Return to Dashboard</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-50">
      {/* Sidebar Container */}
      <div className="relative">
        {/* Mobile Menu Button */}
        <button
          className="md:hidden fixed top-4 left-4 z-50 p-2 bg-[#112d4e] text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300"
          onClick={() => setSidebarOpen(!sidebarOpen)}
          aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
        >
          {sidebarOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div 
            className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          ></div>
        )}
        
        {/* Sidebar */}
        <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 fixed md:static top-0 left-0 h-full z-40 md:z-0 w-64 bg-[#112d4e] shadow-lg md:shadow-none transition-transform duration-300 ease-in-out overflow-y-auto`}>
          <SellerSidebar />
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 ml-0 md:ml-64 p-10">
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-2">
          <a href="/sell" className="inline-block px-5 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 font-semibold">Return to Dashboard</a>
        </div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Product Bump</h1>
          <p className="text-gray-600 mt-2">Boost your products' visibility with the bump feature</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Bump Overview</h3>
                <p className="text-sm text-gray-700">Increase visibility of your products</p>
              </div>
            </div>
          </div>
          <div className="bg-blue-100 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Search Products</h3>
                <p className="text-sm text-gray-700">Filter your products by name</p>
              </div>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => debouncedSearch(e.target.value)}
              placeholder="Search by product name..."
              className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Refresh</h3>
                <p className="text-sm text-gray-700">Update your product list</p>
              </div>
            </div>
            <button
              onClick={handleRefresh}
              className="mt-4 w-full px-4 py-2 text-white rounded-lg transition-colors"
              style={{ backgroundColor: '#112d4e' }}
              onMouseOver={(e) => e.target.style.backgroundColor = '#0d2440'}
              onMouseOut={(e) => e.target.style.backgroundColor = '#112d4e'}
            >
              Refresh
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition duration-300"
                onClick={() => handleProductClick(product.id)}
              >
                <div className="relative aspect-[4/3] mb-4 overflow-hidden rounded-lg">
                  <img
                    src={product.imageUrls[0]}
                    alt={product.name || 'Product Image'}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML =
                        '<div class="absolute w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-500">Image N/A</span></div>';
                    }}
                  />
                  {isBumpActive(product) && (
                    <span className="absolute top-2 left-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Bumped Up
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{product.name || 'Unnamed Product'}</h3>
                <p className="text-gray-700 text-sm mb-1">Price: ₦{(product.price || 0).toLocaleString('en-NG')}</p>
                <p className="text-gray-600 text-xs mt-1">Uploaded: {product.uploadDate.toLocaleDateString('en-NG', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}</p>
                {isBumpActive(product) && timeRemaining[product.id] > 0 && (
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-sm text-gray-900">Time Remaining: {formatTime(timeRemaining[product.id])}</p>
                    {product.bumpExpiry && (
                      <p className="text-xs text-gray-700 mt-1">Expires: {formatDate(product.bumpExpiry)}</p>
                    )}
                  </div>
                )}
                {!isBumpActive(product) && (
                  <div className="mt-3 space-y-2">
                    {bumpDurations.map((duration) => (
                      <PaystackCheckout
                        key={duration.hours}
                        email={auth.currentUser?.email}
                        amount={duration.price * 100}
                        onSuccess={(paymentData) => handlePaymentSuccess(paymentData, product.id, duration.hours)}
                        onClose={handleCancel}
                        disabled={bumping[product.id] || bumpQuota <= 0 || isProcessing}
                        buttonText={`${duration.label} (₦${duration.price.toLocaleString('en-NG')})`}
                        className={`w-full flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium transition duration-200 ${
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
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-secondary"></div>
                    <span className="ml-2 text-sm text-primary">Processing...</span>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center mt-10 mb-10">
              <PlusCircle className="w-24 h-24 text-gray-300" />
              <p className="text-gray-900 text-center text-lg mt-4">No products uploaded yet.<br />Start by adding your first product!</p>
              <Link
                to="/products-upload"
                className="mt-4 px-6 py-2 text-white rounded-lg transition duration-300"
                style={{ backgroundColor: '#112d4e' }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#0d2440'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#112d4e'}
              >
                Add Your First Product
              </Link>
            </div>
          )}
        </div>
        <div className="mt-8 bg-secondary/5 border border-secondary/20 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-primary mb-4">How Product Bump Works</h3>
          <div className="text-sm text-primary/80 space-y-2">
            <p>• Bumped products appear at the top of search results and category pages.</p>
            <p>• Increased visibility leads to more views and potential sales.</p>
            <p>• Choose from durations: 72h, 168h.</p>
            <p>• You can bump multiple products simultaneously.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductBump;