import React, { useState, useEffect, useCallback, useRef } from 'react';
import { auth, db } from '../firebase';
import { collection, query, where, getDocs, setDoc, doc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import SellerSidebar from './SellerSidebar';
import { Link } from 'react-router-dom';
import JsBarcode from 'jsbarcode';
import debounce from 'lodash.debounce';
import { PlusCircle, Image as ImageIcon, Video as VideoIcon, GalleryHorizontal, RefreshCw, Edit2, Plus } from 'lucide-react';

export default function SellerProductGallery() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState(null);
  const barcodeRef = useRef(null);

  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearchQuery(value);
    }, 300),
    []
  );

  // Ensure all products have a barcodeValue
  const ensureBarcodeValues = async (userId) => {
    try {
      const q = query(collection(db, 'products'), where('sellerId', '==', userId));
      const querySnapshot = await getDocs(q);
      const updates = querySnapshot.docs.map(async (productDoc) => {
        const productData = productDoc.data();
        if (!productData.barcodeValue) {
          const barcodeValue = productDoc.id; // Use product ID as barcode value
          await setDoc(doc(db, 'products', productDoc.id), { barcodeValue }, { merge: true });
          console.log(`Added barcodeValue ${barcodeValue} to product ${productDoc.id}`);
        }
      });
      await Promise.all(updates);
    } catch (err) {
      console.error('Error ensuring barcode values:', err);
      setError('Failed to initialize barcodes: ' + err.message);
    }
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        onAuthStateChanged(auth, async (user) => {
          if (user) {
            try {
              // Ensure barcode values for all products
              await ensureBarcodeValues(user.uid);

              // Fetch products
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
                const variants = Array.isArray(data.variants) ? data.variants : [];
                return {
                  id: doc.id,
                  ...data,
                  imageUrls: imageUrls.length > 0 ? imageUrls : ['https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg'],
                  videoUrls,
                  variants,
                  barcodeValue: data.barcodeValue || doc.id, // Fallback to ID if barcodeValue missing
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

  // Generate barcode in modal
  useEffect(() => {
    if (showModal && modalContent && modalContent.barcodeValue && barcodeRef.current) {
      try {
        JsBarcode(barcodeRef.current, modalContent.barcodeValue, {
          format: 'CODE128',
          height: 50,
          width: 2,
          displayValue: true,
          background: 'transparent',
          fontSize: 14,
        });
      } catch (err) {
        console.error('Error generating barcode:', err);
        setError('Failed to generate barcode: ' + err.message);
      }
    }
  }, [showModal, modalContent]);

  const filteredProducts = products.filter(product =>
    product.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleRefresh = () => window.location.reload();

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 shadow-md animate-pulse h-64" />
            ))}
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
        <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-6 mb-8 p-4 sm:p-6 md:p-8 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-100 shadow-sm">
          <GalleryHorizontal className="w-8 h-8 text-blue-600 mb-2 md:mb-0" />
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 flex items-center gap-3 flex-wrap">
              Product Gallery
              <span className="inline-block bg-blue-100 text-blue-700 text-base md:text-lg font-semibold px-3 py-1 rounded-full ml-2">{products.length} {products.length === 1 ? 'Product' : 'Products'}</span>
            </h1>
            <p className="text-gray-500 text-sm md:text-base mt-1">Explore your uploaded products with images, videos, and barcodes.</p>
          </div>
          <button onClick={handleRefresh} title="Refresh" className="ml-0 md:ml-auto bg-white border border-blue-200 rounded-full p-2 md:p-3 hover:bg-blue-100 transition focus:outline-blue-400 focus:ring-2 focus:ring-blue-300 mt-2 md:mt-0">
            <RefreshCw className="w-5 h-5 md:w-6 md:h-6 text-blue-600" />
          </button>
          <Link to="/products-upload" className="hidden sm:flex bg-[#112d4e] text-white px-8 py-4 md:px-10 md:py-5 rounded-xl hover:bg-[#1a4577] transition duration-300 items-center gap-3 shadow-xl focus:outline-[#112d4e] focus:ring-4 focus:ring-blue-300 ml-4 font-bold text-lg md:text-xl">
            <PlusCircle className="w-7 h-7 md:w-8 md:h-8" /> <span>Add New Product</span>
          </Link>
        </div>
        <Link
          to="/products-upload"
          className="sm:hidden fixed bottom-8 right-4 md:bottom-12 md:right-12 z-50 rounded-full bg-[#112d4e] text-white p-7 shadow-2xl hover:bg-[#1a4577] transition focus:outline-[#112d4e] focus:ring-4 focus:ring-blue-300 flex items-center justify-center animate-pulseBtn"
          title="Add New Product"
          aria-label="Add New Product"
          tabIndex={0}
        >
          <Plus className="w-12 h-12 font-bold" />
          <span className="sr-only">Add New Product</span>
        </Link>
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-200 max-w-full overflow-x-auto">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProducts.length > 0 ? (
              filteredProducts.map((product) => {
                const displayImage = product.variants?.length > 0 && product.variants[0].imageUrls?.length > 0
                  ? product.variants[0].imageUrls[0]
                  : product.imageUrls[0];
                return (
                  <div
                    key={product.id}
                    className="bg-white border border-gray-200 rounded-xl p-4 shadow-md hover:shadow-xl transition duration-300 animate-slide-in focus:ring-2 focus:ring-blue-300 outline-none cursor-pointer group"
                    tabIndex={0}
                    onClick={() => {
                      setShowModal(true);
                      setModalContent(product);
                    }}
                    title="View product media"
                  >
                    <div className="relative aspect-[4/3] mb-4 overflow-hidden">
                      {displayImage ? (
                        <img
                          src={displayImage}
                          alt={product.name || 'Product Image'}
                          className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300 hover:opacity-90"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = '<div class="absolute w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-500">Image N/A</span></div>';
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
                          <span className="text-gray-500">Image N/A</span>
                        </div>
                      )}
                      {product.videoUrls[0] && (
                        <VideoIcon className="absolute bottom-2 right-2 w-8 h-8 text-blue-600 bg-white rounded-full p-1 shadow" title="Video available" />
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2 truncate">{product.name || 'Unnamed Product'}</h3>
                    <p className="text-gray-600 text-sm mb-1">
                      Price: {product.variants?.length > 0
                        ? `₦${Math.min(...product.variants.map((v) => v.price || 0)).toLocaleString('en-NG')} - ₦${Math.max(...product.variants.map((v) => v.price || 0)).toLocaleString('en-NG')}`
                        : `₦${(product.price || 0).toLocaleString('en-NG')}`}
                    </p>
                    <p className="text-gray-600 text-sm mb-1">Variants: {product.variants?.length || 0}</p>
                    <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                      product.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                      product.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {product.status === 'pending' ? 'Pending' : product.status === 'approved' ? 'Approved' : 'Not Approved'}
                    </span>
                    <p className="text-gray-500 text-xs mt-1">
                      Uploaded: {product.uploadDate.toLocaleDateString('en-NG', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                    <Link to={`/seller/edit-product/${product.id}`} className="mt-4 inline-flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded focus:outline-blue-400 focus:ring-2 focus:ring-blue-300 transition" title="Edit Product">
                      <Edit2 className="w-4 h-4" /> Edit
                    </Link>
                  </div>
                );
              })
            ) : (
              <div className="flex flex-col items-center justify-center mt-10 mb-10 animate-slide-in col-span-full">
                <ImageIcon className="w-24 h-24 mb-4 text-blue-200" />
                <p className="text-gray-600 text-center text-lg">No products uploaded yet.<br/>Start by adding your first product!</p>
                <Link to="/products-upload" className="bg-[#112d4e] text-white px-6 py-3 rounded-lg hover:bg-[#1a4577] transition duration-300 flex items-center gap-2 shadow-lg focus:outline-[#112d4e] focus:ring-2 focus:ring-blue-300 mt-4">
                  <PlusCircle className="w-5 h-5" /> Add Your First Product
                </Link>
              </div>
            )}
          </div>
        </div>
        {showModal && modalContent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 animate-fade-in overflow-y-auto p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-4 sm:p-6 max-w-lg w-full relative mx-auto">
              <button onClick={() => setShowModal(false)} className="absolute top-2 right-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full p-2 focus:outline-blue-400" title="Close">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-700 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 truncate">{modalContent.name || 'Unnamed Product'}</h3>
              {modalContent.imageUrls && modalContent.imageUrls.length > 0 && (
                <img src={modalContent.imageUrls[0]} alt={modalContent.name || 'Product Image'} className="w-full h-64 object-cover rounded-lg mb-4" />
              )}
              {modalContent.videoUrls && modalContent.videoUrls.length > 0 && (
                <video src={modalContent.videoUrls[0]} controls className="w-full h-64 rounded-lg mb-4" />
              )}
              <p className="text-gray-600 dark:text-gray-300 text-sm mb-2">
                Price: ₦{modalContent.variants?.length > 0
                  ? `${Math.min(...modalContent.variants.map((v) => v.price || 0)).toLocaleString('en-NG')} - ₦${Math.max(...modalContent.variants.map((v) => v.price || 0)).toLocaleString('en-NG')}`
                  : (modalContent.price || 0).toLocaleString('en-NG')}
              </p>
              <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${
                modalContent.status === 'pending' ? 'bg-orange-100 text-orange-800' :
                modalContent.status === 'approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {modalContent.status === 'pending' ? 'Pending' : modalContent.status === 'approved' ? 'Approved' : 'Not Approved'}
              </span>
              <div className="mt-4">
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Barcode</h4>
                <canvas ref={barcodeRef} className="mt-2 w-full bg-white dark:bg-gray-800 rounded-lg" />
                <p className="text-gray-600 dark:text-gray-300 text-xs mt-1">Barcode Value: {modalContent.barcodeValue}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="mt-6 w-full bg-[#112d4e] text-white py-2 rounded-lg hover:bg-[#1a4577] transition focus:outline-[#112d4e] focus:ring-2 focus:ring-blue-300">Close</button>
            </div>
          </div>
        )}
        <style>{`
          @keyframes slide-in {
            from { opacity: 0; transform: translateY(32px); }
            to { opacity: 1; transform: none; }
          }
          .animate-slide-in {
            animation: slide-in 0.7s cubic-bezier(0.4,0,0.2,1);
          }
          @keyframes fade-in {
            from { opacity: 0; }
            to { opacity: 1; }
          }
          .animate-fade-in {
            animation: fade-in 0.5s cubic-bezier(0.4,0,0.2,1);
          }
          @keyframes pulseBtn {
            0%, 100% { box-shadow: 0 0 0 0 rgba(124,58,237,0.4), 0 8px 32px 0 rgba(30,58,138,0.18); }
            50% { box-shadow: 0 0 0 12px rgba(124,58,237,0.15), 0 8px 32px 0 rgba(30,58,138,0.18); }
          }
          .animate-pulseBtn {
            animation: pulseBtn 1.2s infinite;
          }
        `}</style>
      </div>
    </div>
  );
}