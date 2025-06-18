import React, { useState, useEffect, useCallback } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import SellerSidebar from './SellerSidebar';
import { Link } from 'react-router-dom';
import debounce from 'lodash.debounce';

export default function SellerProductGallery() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              const q = query(collection(db, 'products'), where('sellerId', '==', user.uid));
              const querySnapshot = await getDocs(q);
              const productsList = querySnapshot.docs.map(doc => {
                const data = doc.data();
                const imageUrls = Array.isArray(data.imageUrls)
                  ? data.imageUrls.filter(url => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/'))
                  : data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('https://res.cloudinary.com/')
                  ? [data.imageUrl]
                  : ['https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg'];
                const videoUrls = Array.isArray(data.videoUrls)
                  ? data.videoUrls.filter(url => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/'))
                  : [];
                return {
                  id: doc.id,
                  ...data,
                  imageUrls: imageUrls.length > 0 ? imageUrls : ['https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg'],
                  videoUrls,
                  uploadDate: data.uploadDate ? data.uploadDate.toDate() : new Date()
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
    fetchProducts();
  }, []);

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                <span className="mr-2">📸</span> Product Gallery <span className="ml-2 text-sm text-gray-600">({filteredProducts.length})</span>
              </h1>
              <p className="text-gray-500 text-sm mt-1">Explore your uploaded products with images and videos.</p>
            </div>
            <Link to="/products-upload" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center">
              <span className="mr-1">+</span> Add New Product
            </Link>
          </div>

          <div className="mb-6">
            <div className="relative w-full max-w-md">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => debouncedSearch(e.target.value)}
                placeholder="Search by product name..."
                className="w-full p-3 pl-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"><i className="bx bx-search"></i></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => (
                <div key={product.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-xl transition duration-300">
                  <div className="relative aspect-[4/3] mb-4">
                    {product.imageUrls[0] && (
                      <img
                        src={product.imageUrls[0]}
                        alt={product.name || 'Product Image'}
                        className="w-full h-full object-cover rounded-lg hover:opacity-90 transition"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML = '<div class="absolute w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-500">Image N/A</span></div>';
                        }}
                      />
                    )}
                    {product.videoUrls[0] && (
                      <video controls className="w-full h-full rounded-lg mt-2">
                        <source src={product.videoUrls[0]} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">{product.name || 'Unnamed Product'}</h3>
                  <p className="text-gray-600 text-sm mb-1">Price: ₦{product.price || 0}</p>
                  <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                    product.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                    product.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {product.status === 'pending' ? 'Pending' : product.status === 'approved' ? 'Approved' : 'Not Approved'}
                  </span>
                  <p className="text-gray-500 text-xs mt-1">
                    Uploaded: {product.uploadDate.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center mt-6 text-lg col-span-full">No products uploaded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}