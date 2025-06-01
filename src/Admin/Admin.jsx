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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.products.map((product) => (
              <div key={product.id} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md hover:shadow-lg transition">
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
          </div>
            {data.products.length === 0 && (
              <p className="text-gray-600 dark:text-gray-400 text-center mt-4">No products to verify.</p>
            )}
          </div>
        </main>
      </div>
    );
}

export default Admin;