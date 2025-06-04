import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import SellerSidebar from './SellerSidebar';
import { Link } from 'react-router-dom';

export default function SellerProductGallery() {
  const [products, setProducts] = useState([]); // Ensure initial state is an array
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
              setProducts(productsList || []); // Ensure we set an array even if productsList is undefined
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
                <span className="mr-2">📸</span> Product Gallery {products.length > 0 && <span className="ml-2 text-sm text-gray-600">({products.length})</span>}
              </h1>
              <p className="text-gray-500 text-sm mt-1">View all your uploaded products with images and videos.</p>
            </div>
            <Link to="/products-upload" className="bg-blue-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-lg hover:bg-blue-700 transition duration-300 flex items-center">
              <span className="mr-1">+</span> Add New Product
            </Link>
          </div>

          <div className="mb-5 flex flex-col sm:flex-row gap-3">
            <div className="relative w-full sm:w-1/3">
              <input
                type="text"
                value=""
                onChange={() => {
                  // Placeholder for future search functionality
                }}
                placeholder="Search products..."
                className="p-2 sm:p-3 pl-9 border border-gray-300 rounded-lg w-full bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <span className="absolute left-3 top-2 sm:top-3 text-gray-400"><i className="bx bx-search"></i></span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(products) && products.length > 0 ? (
              products.map((product) => (
                <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-3 shadow hover:shadow-md transition duration-300">
                  <div className="aspect-w-1 aspect-h-1 mb-3">
                    {Array.isArray(product.imageUrls) && product.imageUrls.length > 0 ? (
                      <img
                        src={product.imageUrls[0]}
                        alt={product.name || 'Product Image'}
                        className="w-full h-[400px] object-cover rounded-lg"
                        onError={(e) => {
                          console.error('Image load error:', { productId: product.id, imageUrl: e.target.src, name: product.name });
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML += '<div class="absolute w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-500 text-sm">Image N/A</span></div>';
                        }}
                        onLoad={() => console.log('Image loaded:', { productId: product.id, imageUrl: product.imageUrls[0], name: product.name })}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
                        <span className="text-gray-500">No Image</span>
                      </div>
                    )}
                  </div>
                  {Array.isArray(product.videoUrls) && product.videoUrls.length > 0 && (
                    <video controls className="w-full h-[230px] mb-2 rounded-lg">
                      <source src={product.videoUrls[0]} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  )}
                  <h3 className="text-lg font-semibold text-gray-800 mb-1 truncate">{product.name || 'Unnamed Product'}</h3>
                  <p className="text-gray-600 text-sm mb-1">Price: ₦{product.price || 0}</p>
                  <p className={`text-sm font-medium mb-1 ${
                    product.status === 'pending' ? 'text-orange-500' : 
                    product.status === 'approved' ? 'text-green-500' : 'text-red-500'
                  }`}>
                    Verify: {product.status === 'pending' ? 'Pending' : 
                           product.status === 'approved' ? 'Approved' : 'Not Approved'}
                  </p>
                  <p className="text-gray-500 text-xs">
                    Uploaded: {product.uploadDate.toLocaleDateString()} {product.uploadDate.toLocaleTimeString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-600 text-center mt-6 text-lg col-span-3">No products uploaded yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}