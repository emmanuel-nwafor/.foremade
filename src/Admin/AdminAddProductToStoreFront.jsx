import React, { useState, useEffect } from 'react';
import { auth, db } from '/src/firebase';
import { collection, getDocs, query, where, addDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { PlusCircle, Trash2, RefreshCw } from 'lucide-react';
import { toast } from 'react-toastify';

const AdminAddProductToStoreFront = () => {
  const [products, setProducts] = useState([]);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchProducts = async () => {
    if (!user) return;
    // Placeholder admin check - replace with your actual logic
    const isAdmin = true; // TODO: Implement proper admin check, e.g., user.getIdTokenResult().then((idTokenResult) => idTokenResult.claims.admin)
    if (!isAdmin) {
      setError('You must be an admin to access this page.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching approved products...');
      // Fetch all approved products
      const productsSnapshot = await getDocs(
        query(collection(db, 'products'), where('status', '==', 'approved'))
      );
      const productsList = await Promise.all(
        productsSnapshot.docs.map(async (productDoc) => {
          try {
            const data = productDoc.data();
            const imageUrls = Array.isArray(data.imageUrls)
              ? data.imageUrls.filter(url => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/'))
              : data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('https://res.cloudinary.com/')
              ? [data.imageUrl]
              : ['https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg'];
            // Check if product is bumped
            const bumpSnapshot = await getDocs(
              query(collection(db, 'productBumps'), where('productId', '==', productDoc.id), where('expiry', '>', new Date()))
            );
            const isBumped = !bumpSnapshot.empty;
            const bumpData = isBumped ? bumpSnapshot.docs[0].data() : {};
            return {
              id: productDoc.id,
              ...data,
              imageUrl: imageUrls[0] || 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg',
              isBumped,
              bumpExpiry: isBumped ? bumpData.expiry?.toDate() : null,
              bumpDuration: isBumped ? bumpData.bumpDuration : null,
            };
          } catch (err) {
            console.warn('Error processing product:', productDoc.id, err);
            return null;
          }
        })
      );

      // Fetch featured products
      console.log('Fetching featured products...');
      const featuredSnapshot = await getDocs(collection(db, 'featuredProducts'));
      const featuredList = await Promise.all(
        featuredSnapshot.docs.map(async (featuredDoc) => {
          try {
            const productRef = doc(db, 'products', featuredDoc.data().productId);
            const productDoc = await getDoc(productRef);
            if (productDoc.exists()) {
              const productData = productDoc.data();
              const imageUrls = Array.isArray(productData.imageUrls)
                ? productData.imageUrls.filter(url => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/'))
                : productData.imageUrl && typeof productData.imageUrl === 'string' && productData.imageUrl.startsWith('https://res.cloudinary.com/')
                ? [productData.imageUrl]
                : ['https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg'];
              // Check if product is bumped
              const bumpSnapshot = await getDocs(
                query(collection(db, 'productBumps'), where('productId', '==', featuredDoc.data().productId), where('expiry', '>', new Date()))
              );
              const isBumped = !bumpSnapshot.empty;
              const bumpData = isBumped ? bumpSnapshot.docs[0].data() : {};
              return {
                id: featuredDoc.id,
                productId: featuredDoc.data().productId,
                name: productData.name || 'Unnamed Product',
                price: productData.price || 0,
                imageUrl: imageUrls[0] || 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg',
                isBumped,
                bumpExpiry: isBumped ? bumpData.expiry?.toDate() : null,
                bumpDuration: isBumped ? bumpData.bumpDuration : null,
                addedAt: featuredDoc.data().addedAt?.toDate() || new Date(),
                sellerName: productData.sellerName || productData.seller || 'Unknown',
              };
            }
            console.warn('Featured product not found:', featuredDoc.data().productId);
            return null;
          } catch (err) {
            console.warn('Error fetching featured product:', err);
            return null;
          }
        })
      );
      const validProducts = productsList.filter(p => p !== null);
      const validFeaturedProducts = featuredList.filter(p => p !== null);
      console.log('Fetched products:', validProducts);
      console.log('Fetched featured products:', validFeaturedProducts);
      setProducts(validProducts);
      setFeaturedProducts(validFeaturedProducts);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to fetch products: ' + err.message);
      toast.error('Failed to fetch products: ' + err.message, {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddToFeatured = async (productId) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('User not authenticated');
      console.log('Adding product to featured:', productId);
      await addDoc(collection(db, 'featuredProducts'), {
        productId,
        addedBy: user.uid,
        addedAt: new Date(),
      });
      toast.success('Product added to storefront!', {
        position: 'top-right',
        autoClose: 3000,
      });
      fetchProducts();
    } catch (err) {
      console.error('Error adding to featured:', err);
      toast.error('Failed to add product to storefront: ' + err.message, {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handleRemoveFromFeatured = async (featuredId) => {
    if (window.confirm('Are you sure you want to remove this product from the storefront?')) {
      try {
        console.log('Removing featured product:', featuredId);
        await deleteDoc(doc(db, 'featuredProducts', featuredId));
        toast.success('Product removed from storefront!', {
          position: 'top-right',
          autoClose: 3000,
        });
        fetchProducts();
      } catch (err) {
        console.error('Error removing from featured:', err);
        toast.error('Failed to remove product from storefront: ' + err.message, {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    }
  };

  const handleRefresh = () => {
    console.log('Refreshing products...');
    fetchProducts();
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        fetchProducts();
      } else {
        setError('Please log in as an admin to access this page.');
        setLoading(false);
        toast.error('Please log in as an admin.', {
          position: 'top-right',
          autoClose: 3000,
        });
      }
    });
    return () => unsubscribe();
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
    return product.isBumped && product.bumpExpiry && new Date(product.bumpExpiry) > new Date();
  };

  const filteredProducts = products.filter((product) =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="w-full px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="bg-gray-200 p-4 rounded-lg h-64"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full px-4 py-8">
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg dark:bg-red-900 dark:border-red-700">
          <p className="text-red-700 dark:text-red-300">{error}</p>
          <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium underline mt-2 block">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-8">
      <div className="mb-8">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800 dark:text-white">Manage Featured Products</h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 text-sm sm:text-base">
          Add or remove products from the featured section of the storefront.
        </p>
      </div>
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          to="/admin/dashboard"
          className="inline-flex px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 font-semibold text-sm sm:text-base w-full sm:w-auto text-center"
        >
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
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-4">Currently Featured Products</h3>
      {featuredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
          {featuredProducts.map((product) => (
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
                <button
                  onClick={() => handleRemoveFromFeatured(product.id)}
                  className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-lg p-1.5" />
                </button>
                {isBumpActive(product) && (
                  <span
                    className="absolute top-2 left-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: '#00ffaaaf', color: 'white' }}
                  >
                    Bump Active
                  </span>
                )}
              </div>
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 truncate">{product.name}</h4>
              <p className="text-gray-700 text-sm mb-1">Price: ₦{product.price.toLocaleString('en-NG')}</p>
              <p className="text-gray-600 text-xs mb-1">Seller: {product.sellerName}</p>
              {isBumpActive(product) && (
                <>
                  <p className="text-gray-600 text-xs">Expires: {formatDate(product.bumpExpiry)}</p>
                  <p className="text-gray-600 text-xs">Duration: {product.bumpDuration}</p>
                </>
              )}
              <p className="text-gray-600 text-xs">Added: {formatDate(product.addedAt)}</p>
            </div>
          ))}
        </div>
      ) : (
        <div className="col-span-full flex flex-col items-center justify-center mt-6 mb-8">
          <p className="text-gray-900 dark:text-gray-300 text-center text-sm sm:text-base">
            No featured products selected.
          </p>
        </div>
      )}
      <h3 className="text-lg sm:text-xl font-semibold text-gray-800 dark:text-white mb-4">Available Products</h3>
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
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
                      '<div class="absolute w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"><span className="text-gray-500 text-sm">Image N/A</span></div>';
                  }}
                />
                {featuredProducts.some(fp => fp.productId === product.id) ? (
                  <span className="absolute top-2 right-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Featured
                  </span>
                ) : (
                  <button
                    onClick={() => handleAddToFeatured(product.id)}
                    className="absolute top-2 right-2 text-green-500 hover:text-green-700"
                  >
                    <PlusCircle className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-300 rounded-lg p-1.5" />
                  </button>
                )}
                {isBumpActive(product) && (
                  <span
                    className="absolute top-2 left-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ backgroundColor: '#00ffaaaf', color: 'white' }}
                  >
                    Bump Active
                  </span>
                )}
              </div>
              <h4 className="text-base sm:text-lg font-semibold text-gray-900 mb-2 truncate">
                {product.name || 'Unnamed Product'}
              </h4>
              <p className="text-gray-700 text-sm mb-1">Price: ₦{product.price.toLocaleString('en-NG')}</p>
              <p className="text-gray-600 text-xs mb-1">Seller: {product.sellerName || product.seller || 'Unknown'}</p>
              {isBumpActive(product) && (
                <>
                  <p className="text-gray-600 text-xs">Expires: {formatDate(product.bumpExpiry)}</p>
                  <p className="text-gray-600 text-xs">Duration: {product.bumpDuration}</p>
                </>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="col-span-full flex flex-col items-center justify-center mt-6 mb-8">
          <p className="text-gray-900 dark:text-gray-300 text-center text-sm sm:text-base">
            No approved products available.
          </p>
        </div>
      )}
    </div>
  );
};

export default AdminAddProductToStoreFront;