import React, { useState, useEffect } from 'react';
import { db } from '/src/firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import AdminSidebar from './AdminSidebar';
import MediaPreview from './MediaPreview';
import AdminActionButtons from './AdminActionbuttons';
import axios from 'axios';
import { Camera, User, ShoppingBag, Edit2, CheckCircle2, XCircle } from 'lucide-react';

function CustomAlert({ alerts, removeAlert }) {
  useEffect(() => {
    if (alerts.length === 0) return;
    const timer = setTimeout(() => alerts.forEach((alert) => removeAlert(alert.id)), 5000);
    return () => clearTimeout(timer);
  }, [alerts, removeAlert]);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-xl shadow-lg transform transition-all duration-300 ease-in-out animate-slide-in ${
            alert.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-600 text-white'
          } flex items-center gap-2`}
        >
          {alert.type === 'error' ? <XCircle size={20} /> : <CheckCircle2 size={20} />}
          <span>{alert.message}</span>
          <button onClick={() => removeAlert(alert.id)} className="ml-auto text-lg hover:text-gray-200">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const addAlert = (message, type = 'info') => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
  };
  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };
  return { alerts, addAlert, removeAlert };
}

function Admin() {
  const { alerts, addAlert, removeAlert } = useAlerts();
  const [data, setData] = useState({ products: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sortOption, setSortOption] = useState('default');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [productToReject, setProductToReject] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const productsSnap = await getDocs(collection(db, 'products'));
        const productsList = await Promise.all(
          productsSnap.docs.map(async (doc) => {
            const productData = { id: doc.id, ...doc.data() };
            const buyerCount = await getBuyerCount(productData.id);
            return { ...productData, buyerCount };
          })
        );
        setData({ products: productsList });
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to fetch data: ' + err.message);
        addAlert('Failed to load products.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [addAlert]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && (selectedProduct || isRejectionModalOpen)) {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProduct, isRejectionModalOpen]);

  const getBuyerCount = async (productId) => {
    try {
      const ordersSnap = await getDocs(collection(db, 'orders'));
      return ordersSnap.docs.filter((doc) =>
        doc.data().items.some((item) => item.productId === productId)
      ).length;
    } catch (err) {
      console.error('Error fetching buyer count:', err);
      return 0;
    }
  };

  const handleProductStatus = async (productId, newStatus) => {
    const product = data.products.find((p) => p.id === productId);
    if (newStatus === 'rejected') {
      setProductToReject(product);
      setIsRejectionModalOpen(true);
      return;
    }

    if (!window.confirm(`Are you sure you want to ${newStatus === 'approved' ? 'approve' : 'reject'} this product?`)) return;
    setLoading(true);
    try {
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, { status: newStatus });
      setData((prev) => ({
        ...prev,
        products: prev.products.map((item) =>
          item.id === productId ? { ...item, status: newStatus } : item
        ),
      }));
      addAlert(`Product ${newStatus === 'approved' ? 'approved' : 'rejected'} successfully! 🎉`, 'success');

      const endpoint = newStatus === 'approved' ? '/send-product-approved-email' : '/send-product-rejected-email';
      try {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}${endpoint}`, {
          productId,
          productName: product.name,
          sellerId: product.sellerId,
          sellerEmail: product.sellerEmail || (await getSellerEmail(product.sellerId)),
          ...(newStatus === 'rejected' && { reason: rejectionReason || customReason }),
        });
        addAlert(`${newStatus === 'approved' ? 'Approval' : 'Rejection'} email sent to seller! 📧`, 'success');
      } catch (emailError) {
        console.error(`Error sending ${newStatus} email:`, emailError);
        addAlert(`Failed to send ${newStatus} email.`, 'error');
      }
    } catch (err) {
      console.error('Error updating product status:', err);
      addAlert('Failed to update product status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectionReason && !customReason) {
      addAlert('Please select or enter a rejection reason.', 'error');
      return;
    }

    const finalReason = rejectionReason === 'Other' ? customReason : rejectionReason;
    if (!finalReason) {
      addAlert('Please enter a custom reason.', 'error');
      return;
    }

    setLoading(true);
    try {
      const productId = productToReject.id;
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, { status: 'rejected' });
      setData((prev) => ({
        ...prev,
        products: prev.products.map((item) =>
          item.id === productId ? { ...item, status: 'rejected' } : item
        ),
      }));
      addAlert('Product rejected successfully! 🎉', 'success');

      try {
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/send-product-rejected-email`, {
          productId,
          productName: productToReject.name,
          sellerId: productToReject.sellerId,
          sellerEmail: productToReject.sellerEmail || (await getSellerEmail(productToReject.sellerId)),
          reason: finalReason,
        });
        addAlert('Rejection email sent to seller! 📧', 'success');
      } catch (emailError) {
        console.error('Error sending rejection email:', emailError);
        addAlert('Failed to send rejection email.', 'error');
      }
    } catch (err) {
      console.error('Error rejecting product:', err);
      addAlert('Failed to reject product.', 'error');
    } finally {
      setLoading(false);
      setIsRejectionModalOpen(false);
      setRejectionReason('');
      setCustomReason('');
      setProductToReject(null);
    }
  };

  const getSellerEmail = async (sellerId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', sellerId));
      if (userDoc.exists()) {
        return userDoc.data().email;
      }
      return null;
    } catch (err) {
      console.error('Error fetching seller email:', err);
      return null;
    }
  };

  const handleDelete = async (productId) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'products', productId));
      setData((prev) => ({
        ...prev,
        products: prev.products.filter((item) => item.id !== productId),
      }));
      addAlert('Product deleted successfully! 🎉', 'success');
    } catch (err) {
      console.error(`Error deleting product ${productId}:`, err);
      addAlert('Failed to delete product.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCardClick = (product, e) => {
    e.stopPropagation(); // Prevent clicks on child elements from bubbling up
    console.log('Card clicked:', product.id, product.name); // Debug log
    setSelectedProduct(product);
  };

  const handleUpdateProduct = async (updatedProduct) => {
    if (!updatedProduct.name || updatedProduct.variants.some((v) => !v.price || !v.stock || !v.color)) {
      addAlert('Please fill all required fields for all variants.', 'error');
      return;
    }
    setLoading(true);
    try {
      const productRef = doc(db, 'products', updatedProduct.id);
      await updateDoc(productRef, {
        name: updatedProduct.name,
        category: updatedProduct.category,
        condition: updatedProduct.condition,
        tags: updatedProduct.tags,
        variants: updatedProduct.variants.map((variant) => ({
          ...variant,
          price: parseFloat(variant.price) || 0,
          stock: parseInt(variant.stock) || 0,
        })),
        imageUrls: updatedProduct.imageUrls || [],
      });
      setData((prev) => ({
        ...prev,
        products: prev.products.map((item) =>
          item.id === updatedProduct.id ? { ...item, ...updatedProduct } : item
        ),
      }));
      addAlert('Product updated successfully! 🎉', 'success');
      setSelectedProduct(null);
    } catch (err) {
      console.error('Error updating product:', err);
      addAlert('Failed to update product.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setIsRejectionModalOpen(false);
    setRejectionReason('');
    setCustomReason('');
    setProductToReject(null);
  };

  const sortProducts = (products) => {
    const sorted = [...products];
    switch (sortOption) {
      case 'name-asc':
        return sorted.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
      case 'name-desc':
        return sorted.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
      case 'price-asc':
        return sorted.sort((a, b) => {
          const minPriceA = a.variants && a.variants.length ? Math.min(...a.variants.map((v) => v.price || 0)) : a.price || 0;
          const minPriceB = b.variants && b.variants.length ? Math.min(...b.variants.map((v) => v.price || 0)) : b.price || 0;
          return minPriceA - minPriceB;
        });
      case 'price-desc':
        return sorted.sort((a, b) => {
          const maxPriceA = a.variants && a.variants.length ? Math.max(...a.variants.map((v) => v.price || 0)) : a.price || 0;
          const maxPriceB = b.variants && b.variants.length ? Math.max(...b.variants.map((v) => v.price || 0)) : b.price || 0;
          return maxPriceB - maxPriceA;
        });
      case 'status-pending':
        return sorted.sort((a) => (a.status === 'pending' ? -1 : 1));
      case 'status-approved':
        return sorted.sort((a) => (a.status === 'approved' ? -1 : 1));
      case 'status-not-approved':
        return sorted.sort((a) => (a.status !== 'approved' && a.status !== 'pending' ? -1 : 1));
      default:
        return sorted;
    }
  };

  const sortedProducts = sortProducts(data.products);

  const approvedCount = data.products.filter((p) => p.status === 'approved').length;
  const notApprovedCount = data.products.filter((p) => p.status !== 'approved').length;

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
        <AdminSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6">
          <div className="container mx-auto px-4 py-8 text-center">
            <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
              <i className="bx bx-loader bx-spin text-2xl"></i>
              <span>Loading...</span>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
        <AdminSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-600 text-white p-4 rounded-xl shadow-md flex items-center gap-2">
              <XCircle size={20} />
              <p>{error}</p>
            </div>
          </div>
        </main>
        <CustomAlert alerts={alerts} removeAlert={removeAlert} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-gray-900 dark:to-gray-800">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-0 flex items-center gap-2">
              <CheckCircle2 size={24} className="text-blue-500" />
              Product Verification Hub
            </h1>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-2 transition-all duration-200 shadow-md"
            >
              <i className={`bx bx-${isFilterOpen ? 'x' : 'filter-alt'}`}></i>
              {isFilterOpen ? 'Close Filters' : 'Filters & Sort'}
            </button>
          </div>
          {isFilterOpen && (
            <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-md mb-6 animate-slide-down">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 flex items-center gap-1">
                    Sort Products
                    <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Sort products by name, price, or status"></i>
                  </label>
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                  >
                    <option value="default">Default</option>
                    <option value="name-asc">Name (A-Z)</option>
                    <option value="name-desc">Name (Z-A)</option>
                    <option value="price-asc">Price (Low to High)</option>
                    <option value="price-desc">Price (High to Low)</option>
                    <option value="status-pending">Status: Pending</option>
                    <option value="status-approved">Status: Approved</option>
                    <option value="status-not-approved">Status: Not Approved</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Stats</label>
                  <div className="flex gap-2">
                    <div className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm shadow-md">
                      Approved: {approvedCount}
                    </div>
                    <div className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm shadow-md">
                      Not Approved: {notApprovedCount}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-6">
            {sortedProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white dark:bg-gray-900 p-4 rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-all duration-200 shadow-md"
                onClick={(e) => handleCardClick(product, e)}
              >
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-sm font-semibold text-gray-700 dark:text-gray-200 truncate">{product.name || 'Unnamed Product'}</h2>
                  <span
                    className={`text-xs font-medium px-2 py-1 rounded-full ${
                      product.status === 'pending' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300' :
                      product.status === 'approved' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' :
                      'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                    }`}
                  >
                    {product.status === 'pending' ? 'Pending' : product.status === 'approved' ? 'Approved' : 'Not Approved'}
                  </span>
                </div>
                <MediaPreview
                  variants={product.variants || []}
                  imageUrls={product.imageUrls || []}
                />
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <User size={14} /> Seller: {product.sellerName || 'Unknown'}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <ShoppingBag size={14} /> Buyers: {product.buyerCount || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Variants: {product.variants?.length || 0}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Price Range: ₦{product.variants && product.variants.length ? Math.min(...product.variants.map((v) => v.price || 0)).toLocaleString('en-NG') : (product.price || 0).toLocaleString('en-NG')} - ₦{product.variants && product.variants.length ? Math.max(...product.variants.map((v) => v.price || 0)).toLocaleString('en-NG') : (product.price || 0).toLocaleString('en-NG')}
                </p>
                <AdminActionButtons
                  productId={product.id}
                  currentStatus={product.status}
                  onStatusChange={handleProductStatus}
                  onDelete={handleDelete}
                  loading={loading}
                  onEdit={(e) => handleCardClick(product, e)}
                />
              </div>
            ))}
            {sortedProducts.length === 0 && (
              <p className="text-gray-600 dark:text-gray-300 text-center mt-4 col-span-3 italic">No products to verify.</p>
            )}
          </div>
        </div>
      </main>

      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 p-6 m-4 rounded-xl w-full max-w-6xl max-h-[90vh] overflow-y-auto shadow-lg flex flex-col md:flex-row gap-6">
            <div className="w-full md:w-1/2 space-y-6">
              <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                  {selectedProduct.name || 'Unnamed Product'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                  title="Close"
                >
                  <i className="bx bx-x"></i>
                </button>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Camera size={18} className="text-blue-500" /> Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <p className="text-[13px]"><span className="bg-blue-100 rounded-full p-1">Seller:</span> {selectedProduct.sellerName || 'Unknown Seller'}</p>
                  <p className="text-[13px]"><span className="bg-blue-100 rounded-full p-1">Status:</span> {selectedProduct.status === 'pending' ? 'Pending' : selectedProduct.status === 'approved' ? 'Approved' : 'Not Approved'}</p>
                  <p className="text-[13px]"><span className="bg-blue-100 rounded-full p-1">Category:</span> {selectedProduct.category || 'Uncategorized'}</p>
                  <p className="text-[13px]"><span className="bg-blue-100 rounded-full p-1">Condition:</span> {selectedProduct.condition || 'New'}</p>
                  <p className="text-[13px]"><span className="bg-blue-100 rounded-full p-1">Rating:</span> {selectedProduct.rating || 'N/A'}</p>
                  <p className="text-[13px]"><span className="bg-blue-100 rounded-full p-1">Buyers:</span> {selectedProduct.buyerCount || 0}</p>
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <Edit2 size={18} className="text-blue-500" /> Tags
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 text-sm">
                  {Array.isArray(selectedProduct.tags) ? selectedProduct.tags.join(', ') : 'None'}
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <User size={18} className="text-blue-500" /> Seller Info
                </h3>
                <p className="text-[13px] mt-3"><span className="bg-amber-100 rounded-full p-1">Name:</span> {selectedProduct.seller?.name || 'Unknown Seller'}</p>
                <p className="text-[13px] mt-4"><span className="bg-amber-100 rounded-full p-1">ID:</span> {selectedProduct.seller?.id || 'N/A'}</p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-blue-500" /> Variants
                </h3>
                {selectedProduct.variants && selectedProduct.variants.length > 0 ? (
                  <div className="space-y-4 mt-2">
                    {selectedProduct.variants.map((variant, index) => (
                      <div key={index} className="p-2 border border-gray-200 dark:border-gray-600 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Variant {index + 1}</h4>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <p className="text-[13px]"><span className="bg-blue-100 rounded-full p-1">Color:</span> {variant.color || 'N/A'}</p>
                          <p className="text-[13px]"><span className="bg-blue-100 rounded-full p-1">Size:</span> {variant.size || 'N/A'}</p>
                          <p className="text-[13px]"><span className="bg-blue-100 rounded-full p-1">Price:</span> ₦{(variant.price || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                          <p className="text-[13px]"><span className="bg-blue-100 rounded-full p-1">Stock:</span> {variant.stock || 0} units</p>
                          <p className="text-[13px]"><span className="bg-blue-100 rounded-full p-1">Images:</span> {variant.imageUrls?.length || 0}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[13px] text-gray-600 dark:text-gray-400">No variants available.</p>
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2">
                  <ShoppingBag size={18} className="text-blue-500" /> Reviews
                </h3>
                {Array.isArray(selectedProduct.reviews) && selectedProduct.reviews.length > 0 ? (
                  <ul className="list-disc pl-5 space-y-2">
                    {selectedProduct.reviews.map((review, index) => (
                      <li key={index} className="text-sm text-gray-600 dark:text-gray-400">
                        {review.comment} <span className="text-yellow-500">(Rating: {review.rating})</span>, By: {review.userName || 'Anonymous'}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-gray-600 dark:text-gray-400">No reviews available yet.</p>
                )}
              </div>
              <AdminActionButtons
                productId={selectedProduct.id}
                currentStatus={selectedProduct.status}
                onStatusChange={handleProductStatus}
                onDelete={handleDelete}
                loading={loading}
                onEdit={(e) => handleCardClick(selectedProduct, e)}
                isModal
              />
            </div>
            <div className="w-full md:w-1/2">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 flex items-center gap-2 mb-4">
                <Camera size={18} className="text-blue-500" /> Variant Media Preview
              </h3>
              <MediaPreview
                variants={selectedProduct.variants || []}
                imageUrls={selectedProduct.imageUrls || []}
                isModal
                product={selectedProduct}
                onUpdateProduct={handleUpdateProduct}
              />
            </div>
          </div>
        </div>
      )}

      {isRejectionModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-xl w-full max-w-md shadow-lg">
            <div className="flex justify-between items-center mb-4 border-b border-gray-200 dark:border-gray-700 pb-2">
              <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <XCircle size={20} className="text-red-500" /> Reject Product
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-2xl"
                title="Close"
              >
                <i className="bx bx-x"></i>
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Reason for Rejection</label>
                <select
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                >
                  <option value="">Select a reason</option>
                  <option value="Missing product image">Missing product image</option>
                  <option value="Incomplete product description">Incomplete product description</option>
                  <option value="Invalid price">Invalid price</option>
                  <option value="Product violates guidelines">Product violates guidelines</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              {rejectionReason === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Custom Reason</label>
                  <textarea
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    placeholder="Enter custom reason..."
                    className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-800 dark:border-gray-700 dark:text-gray-200 focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200"
                    rows="4"
                  />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <button
                  onClick={closeModal}
                  className="py-2 px-4 bg-gray-300 text-gray-800 rounded-lg text-sm hover:bg-gray-400 transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectSubmit}
                  className="py-2 px-4 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-all duration-200 flex items-center gap-2"
                  disabled={loading}
                >
                  {loading ? <i className="bx bx-loader bx-spin"></i> : <XCircle size={16} />}
                  Reject Product
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <CustomAlert alerts={alerts} removeAlert={removeAlert} />
    </div>
  );
}

export default Admin;