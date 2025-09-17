import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { collection, getDocs, doc, getDoc, deleteDoc, addDoc, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import AdminSidebar from './AdminSidebar';
import { Link } from 'react-router-dom';
import { RefreshCw, Trash2, PlusCircle } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminBumpedProducts = () => {
  const [bumpedProducts, setBumpedProducts] = useState([]);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('7'); // Default to 7 days

  const fetchBumpedProducts = async () => {
    try {
      setLoading(true);
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          // Fetch all bump records from productBumps
          const bumpsSnapshot = await getDocs(collection(db, 'productBumps'));
          const bumpData = bumpsSnapshot.docs.map((doc) => ({
            id: doc.id,
            productId: doc.data().productId,
            sellerId: doc.data().sellerId || 'Unknown',
            startDate: doc.data().startDate?.toDate() || null,
            expiry: doc.data().expiry?.toDate() || null,
          }));

          // Fetch corresponding product details from products
          const productsPromises = bumpData.map(async (bump) => {
            const productDoc = await getDoc(doc(db, 'products', bump.productId));
            if (productDoc.exists()) {
              const productData = productDoc.data();
              const imageUrls = Array.isArray(productData.imageUrls)
                ? productData.imageUrls.filter(url => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/'))
                : productData.imageUrl && typeof productData.imageUrl === 'string' && productData.imageUrl.startsWith('https://res.cloudinary.com/')
                ? [productData.imageUrl]
                : ['https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg'];
              return {
                ...bump,
                name: productData.name || 'Unnamed Product',
                price: productData.price || 0,
                imageUrl: imageUrls[0],
                bumpExpiry: productData.bumpExpiry?.toDate() || null,
                bumpDuration: productData.bumpDuration || 'Unknown',
                sellerName: productData.sellerName || productData.seller || bump.sellerId, // Try sellerName or seller, fallback to sellerId
              };
            } else {
              return {
                ...bump,
                name: 'Unnamed Product',
                price: 0,
                imageUrl: 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg',
                bumpExpiry: null,
                bumpDuration: 'Unknown',
                sellerName: bump.sellerId, // Fallback to sellerId if product not found
              };
            }
          });

          const productsList = await Promise.all(productsPromises);
          console.log('Fetched Products:', productsList); // Debug: Inspect combined data
          setBumpedProducts(productsList);

          // Fetch approved products for adding bumps
          console.log('Fetching approved products...');
          const productsSnapshot = await getDocs(
            query(collection(db, 'products'), where('status', '==', 'approved'))
          );
          const availableProductsList = await Promise.all(
            productsSnapshot.docs.map(async (productDoc) => {
              try {
                const data = productDoc.data();
                const imageUrls = Array.isArray(data.imageUrls)
                  ? data.imageUrls.filter(url => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/'))
                  : data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('https://res.cloudinary.com/')
                  ? [data.imageUrl]
                  : ['https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg'];
                return {
                  id: productDoc.id,
                  ...data,
                  imageUrl: imageUrls[0] || 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg',
                };
              } catch (err) {
                console.warn('Error processing product:', productDoc.id, err);
                return null;
              }
            })
          );
          const validAvailableProducts = availableProductsList.filter(p => p !== null);
          console.log('Fetched available products:', validAvailableProducts);
          setAvailableProducts(validAvailableProducts);
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

  const handleAddBump = async (productId) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      console.log('Adding bump for product:', productId);
      const durationDays = parseInt(selectedDuration);
      const startDate = new Date();
      const expiryDate = new Date(startDate);
      expiryDate.setDate(startDate.getDate() + durationDays);

      // Find the product to get sellerId
      const productDoc = await getDoc(doc(db, 'products', productId));
      if (!productDoc.exists()) throw new Error('Product not found');
      const productData = productDoc.data();
      const sellerId = productData.seller || productData.sellerId || user.uid; // Fallback to current user if no sellerId

      await addDoc(collection(db, 'productBumps'), {
        productId,
        sellerId,
        bumpDuration: `${durationDays} days`,
        startDate,
        expiry: expiryDate,
        timestamp: new Date(),
      });
      toast.success('Product bumped successfully!', {
        position: 'top-right',
        autoClose: 3000,
      });
      fetchBumpedProducts();
    } catch (err) {
      console.error('Error adding bump:', err);
      toast.error('Failed to bump product: ' + err.message, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleDeleteBump = async (bumpId) => {
    if (window.confirm('Are you sure you want to delete this product bump?')) {
      try {
        await deleteDoc(doc(db, 'productBumps', bumpId));
        setBumpedProducts(bumpedProducts.filter(product => product.id !== bumpId));
      } catch (err) {
        setError('Failed to delete product bump: ' + err.message);
      }
    }
  };

  const handleRefresh = () => {
    fetchBumpedProducts();
  };

  useEffect(() => {
    fetchBumpedProducts();
  }, []);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (e) {
      return 'Invalid Date';
    }
  };

  const isBumpActive = (product) => {
    const expiryDate = product.bumpExpiry || product.expiry;
    return expiryDate && new Date(expiryDate) > new Date();
  };

  const filteredAvailableProducts = availableProducts.filter((product) =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <main className="flex-1 ml-0 md:ml-64 p-4 sm:p-6">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Link to="/admin/dashboard" className="inline-flex px-5 py-2 bg-gray-200 text-gray-900 rounded hover:bg-gray-300 font-semibold text-sm sm:text-base w-full sm:w-auto text-center">
              Return to Dashboard
            </Link>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 text-sm sm:text-base"
              />
              <button
                onClick={handleRefresh}
                className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors w-full sm:w-auto"
              >
                <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                Refresh
              </button>
            </div>
          </div>
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white">Bumped Products</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
              View all products currently bumped by sellers
            </p>
          </div>
          {bumpedProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {bumpedProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition duration-300 relative"
                >
                  <div className="relative aspect-[4/3] mb-4 overflow-hidden rounded-lg">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML =
                          '<div class="absolute w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-500">Image N/A</span></div>';
                      }}
                    />
                    <button
                      onClick={() => handleDeleteBump(product.id)}
                      className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-[34px] h-[34px] bg-gray-300 rounded-lg p-2" />
                    </button>
                    <span
                      className="absolute top-2 left-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{ backgroundColor: isBumpActive(product) ? '#00ffaaaf' : '#ff6e6eff', color: 'white' }}
                    >
                      {isBumpActive(product) ? 'Bump Active' : 'Bump Expired'}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">{product.name}</h3>
                  <p className="text-gray-700 text-sm mb-1">Price: ₦{product.price.toLocaleString('en-NG')}</p>
                  <p className="text-gray-600 text-xs mb-1">Seller: {product.sellerName}</p>
                  <p className="text-gray-600 text-xs">Expires: {formatDate(product.expiry || product.bumpExpiry)}</p>
                  <p className="text-gray-600 text-xs">Duration: {product.bumpDuration}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center mt-10 mb-10">
              <p className="text-gray-900 dark:text-gray-300 text-center text-lg mt-4">No bumped products found.</p>
            </div>
          )}
          <h2 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-4">Add Products to Bump</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Bump Duration
            </label>
            <select
              value={selectedDuration}
              onChange={(e) => setSelectedDuration(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-64 text-sm sm:text-base"
            >
              <option value="3">3 Days</option>
              <option value="7">7 Days</option>
              <option value="14">14 Days</option>
              <option value="30">30 Days</option>
            </select>
          </div>
          {filteredAvailableProducts.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAvailableProducts.map((product) => (
                <div
                  key={product.id}
                  className="bg-white border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-lg transition duration-300 relative"
                >
                  <div className="relative aspect-[4/3] mb-4 overflow-hidden rounded-lg">
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML =
                          '<div class="absolute w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-500 text-sm">Image N/A</span></div>';
                      }}
                    />
                    {bumpedProducts.some(bp => bp.productId === product.id && isBumpActive(bp)) ? (
                      <span className="absolute top-2 right-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Bumped
                      </span>
                    ) : (
                      <button
                        onClick={() => handleAddBump(product.id)}
                        className="absolute top-2 right-2 text-green-500 hover:text-green-700"
                      >
                        <PlusCircle className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-lg p-1.5" />
                      </button>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                    {product.name || 'Unnamed Product'}
                  </h3>
                  <p className="text-gray-700 text-sm mb-1">
                    Price: ₦{product.price != null ? product.price.toLocaleString('en-NG') : 'N/A'}
                  </p>
                  <p className="text-gray-600 text-xs mb-1">Seller: {product.sellerName || product.seller || 'Unknown'}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="col-span-full flex flex-col items-center justify-center mt-10 mb-10">
              <p className="text-gray-900 dark:text-gray-300 text-center text-lg mt-4">No approved products available.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminBumpedProducts;
