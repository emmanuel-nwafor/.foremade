import React, { useState, useEffect } from 'react';
import { db } from '/src/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import AdminSidebar from '/src/admin/AdminSidebar';
import MediaPreview from '/src/admin/MediaPreview'; // Assume this component is created
import AdminActionButtons from '/src/admin/AdminActionbuttons'; // Assume this component is created

function Admin() {
  const [data, setData] = useState({ products: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsSnap = await getDocs(collection(db, 'products'));
        setData({
          products: productsSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() })),
        });
      } catch (err) {
        setError('Failed to fetch data: ' + err.message);
      }
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleProductStatus = async (productId, newStatus) => {
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, { status: newStatus });
      setData((prev) => ({
        ...prev,
        products: prev.products.map((item) =>
          item.id === productId ? { ...item, status: newStatus } : item
        ),
      }));
    } catch (err) {
      console.error('Error updating product status:', err);
      setError('Failed to update product status: ' + err.message);
    }
  };

  const handleDelete = async (productId) => {
    try {
      await deleteDoc(doc(db, 'products', productId));
      setData((prev) => ({
        ...prev,
        products: prev.products.filter((item) => item.id !== productId),
      }));
    } catch (err) {
      console.error(`Error deleting product ${productId}:`, err);
      setError(`Failed to delete product: ` + err.message);
    }
  };

  const handleCardClick = (product) => {
    setSelectedProduct(product);
  };

  const closeModal = () => {
    setSelectedProduct(null);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-gray-900">
        <AdminSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6">
          <div className="container mx-auto px-4 py-8 text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
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
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6">Product Verification</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {data.products.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                onClick={() => handleCardClick(product)}
              >
                <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-2">{product.name || 'Unnamed Product'}</h2>
                <MediaPreview imageUrls={product.imageUrls} videoUrls={product.videoUrls} />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Seller: {product.sellerName}</p>
                <p className={`text-sm font-medium ${
                  product.status === 'pending' ? 'text-orange-500' :
                  product.status === 'approved' ? 'text-green-500' : 'text-red-500'
                } mb-2`}>
                  Status: {product.status === 'pending' ? 'Pending' :
                         product.status === 'approved' ? 'Approved' : 'Not Approved'}
                </p>
                <AdminActionButtons
                  productId={product.id}
                  currentStatus={product.status}
                  onStatusChange={handleProductStatus}
                  onDelete={handleDelete}
                />
              </div>
            ))}
            {data.products.length === 0 && (
              <p className="text-gray-600 dark:text-gray-400 text-center mt-4">No products to verify.</p>
            )}
          </div>
        </div>
      </main>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{selectedProduct.name || 'Unnamed Product'}</h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Details</h3>
                <p><strong>Seller:</strong> {selectedProduct.sellerName || 'Unknown Seller'}</p>
                <p><strong>Status:</strong> {selectedProduct.status === 'pending' ? 'Pending' : selectedProduct.status === 'approved' ? 'Approved' : 'Not Approved'}</p>
                <p><strong>Price:</strong> ₦{(selectedProduct.price || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                <p><strong>Stock:</strong> {selectedProduct.stock || 0} units</p>
                <p><strong>Category:</strong> {selectedProduct.category || 'Uncategorized'}</p>
                <p><strong>Colors:</strong> {Array.isArray(selectedProduct.colors) ? selectedProduct.colors.join(', ') : 'None'}</p>
                <p><strong>Sizes:</strong> {Array.isArray(selectedProduct.sizes) ? selectedProduct.sizes.join(', ') : 'None'}</p>
                <p><strong>Condition:</strong> {selectedProduct.condition || 'New'}</p>
                <p><strong>Rating:</strong> {selectedProduct.rating || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Media Preview</h3>
                <MediaPreview imageUrls={selectedProduct.imageUrls} videoUrls={selectedProduct.videoUrls} />
                <div className="mt-2">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Image URLs:</h4>
                  {Array.isArray(selectedProduct.imageUrls) && selectedProduct.imageUrls.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {selectedProduct.imageUrls.map((url, index) => (
                        <li key={`image-${index}`}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline text-sm break-all"
                          >
                            Image {index + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No images uploaded.</p>
                  )}
                </div>
                <div className="mt-2">
                  <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400">Video URLs:</h4>
                  {Array.isArray(selectedProduct.videoUrls) && selectedProduct.videoUrls.length > 0 ? (
                    <ul className="list-disc pl-5">
                      {selectedProduct.videoUrls.map((url, index) => (
                        <li key={`video-${index}`}>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline text-sm break-all"
                          >
                            Video {index + 1}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-600 dark:text-gray-400">No videos uploaded.</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Tags</h3>
                <p>{Array.isArray(selectedProduct.tags) ? selectedProduct.tags.join(', ') : 'None'}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Seller Info</h3>
                <p className='text-[15px]'>
                  <span className='text-green-500'>Name:</span> {selectedProduct.seller?.name || 'Unknown Seller'}</p>
                <p className='text-[15px]'>
                  <span className='text-green-500'>ID:</span> {selectedProduct.seller?.id || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">Reviews</h3>
                {Array.isArray(selectedProduct.reviews) && selectedProduct.reviews.length > 0 ? (
                  <ul className="list-disc pl-5">
                    {selectedProduct.reviews.map((review, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                        {review.comment} (Rating: {review.rating}, By: {review.userName || 'Anonymous'})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600 dark:text-gray-400">No reviews available.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;