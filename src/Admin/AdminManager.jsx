import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { collection, query, onSnapshot, doc, getDoc, updateDoc, setDoc, where } from 'firebase/firestore';
import AdminSidebar from './AdminSidebar';

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
          className={`p-4 rounded-lg shadow-lg ${alert.type === 'error' ? 'bg-red-600' : 'bg-green-600'} text-white flex items-center gap-2`}
        >
          <i className={`bx ${alert.type === 'error' ? 'bx-error-circle' : 'bx-check-circle'} text-xl`}></i>
          <span>{alert.message}</span>
          <button onClick={() => removeAlert(alert.id)} className="ml-auto text-lg font-bold hover:text-gray-200">✕</button>
        </div>
      ))}
    </div>
  );
}

function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const addAlert = (message, type = 'success') => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
  };
  const removeAlert = (id) => setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  return { alerts, addAlert, removeAlert };
}

export default function AdminManager() {
  const { alerts, addAlert, removeAlert } = useAlerts();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('sellers');
  const [sellers, setSellers] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newVariant, setNewVariant] = useState({ color: '', size: '', stock: '' });

  useEffect(() => {
    if (!auth.currentUser) {
      addAlert('Please log in.', 'error');
      navigate('/login');
      return;
    }

    // Fetch sellers
    const sellersQuery = query(collection(db, 'sellers'));
    const unsubscribeSellers = onSnapshot(sellersQuery, async (snapshot) => {
      const sellerData = [];
      for (const docSnapshot of snapshot.docs) {
        const seller = { id: docSnapshot.id, ...docSnapshot.data() };
        // Fetch bank name
        if (seller.bankCode) {
          const bankRef = doc(db, 'banks', seller.bankCode);
          const bankSnap = await getDoc(bankRef);
          seller.bankName = bankSnap.exists() ? bankSnap.data().name || 'N/A' : 'N/A';
        } else {
          seller.bankName = 'N/A';
        }
        // Count seller's products
        const productsQuery = query(collection(db, 'products'), where('sellerId', '==', seller.id));
        const productsSnap = await getDoc(doc(db, 'products', seller.id));
        seller.productCount = productsSnap.exists() ? (await onSnapshot(productsQuery, (snap) => snap.size)).size : 0;
        sellerData.push(seller);
      }
      setSellers(sellerData);
    }, (error) => {
      addAlert('Failed to fetch sellers.', 'error');
      console.error('Sellers fetch error:', error);
    });

    // Fetch products
    const productsQuery = query(collection(db, 'products'));
    const unsubscribeProducts = onSnapshot(productsQuery, async (snapshot) => {
      const productData = [];
      for (const docSnapshot of snapshot.docs) {
        const product = { id: docSnapshot.id, ...docSnapshot.data() };
        // Count buyers (orders for this product)
        const ordersQuery = query(collection(db, 'orders'), where('productId', '==', product.id));
        const ordersSnap = await getDoc(doc(db, 'orders', product.id));
        product.buyerCount = ordersSnap.exists() ? (await onSnapshot(ordersQuery, (snap) => snap.size)).size : 0;
        productData.push(product);
      }
      setProducts(productData);
    }, (error) => {
      addAlert('Failed to fetch products.', 'error');
      console.error('Products fetch error:', error);
    });

    // Fetch orders
    const ordersQuery = query(collection(db, 'orders'));
    const unsubscribeOrders = onSnapshot(ordersQuery, (snapshot) => {
      setOrders(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    }, (error) => {
      addAlert('Failed to fetch orders.', 'error');
      console.error('Orders fetch error:', error);
    });

    // Fetch favorites
    const favoritesQuery = query(collection(db, 'favorites'));
    const unsubscribeFavorites = onSnapshot(favoritesQuery, (snapshot) => {
      const favoriteCounts = {};
      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        favoriteCounts[data.productId] = (favoriteCounts[data.productId] || 0) + 1;
      });
      const favoriteData = Object.entries(favoriteCounts).map(([productId, count]) => ({
        productId,
        count,
      }));
      favoriteData.sort((a, b) => b.count - a.count);
      setFavorites(favoriteData);
    }, (error) => {
      addAlert('Failed to fetch favorites.', 'error');
      console.error('Favorites fetch error:', error);
    });

    setLoading(false);

    return () => {
      unsubscribeSellers();
      unsubscribeProducts();
      unsubscribeOrders();
      unsubscribeFavorites();
    };
  }, [navigate]);

  const handleAddVariant = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setLoading(true);
    try {
      const productRef = doc(db, 'products', selectedProduct.id);
      const productSnap = await getDoc(productRef);
      const currentVariants = productSnap.exists() ? productSnap.data().variants || [] : [];
      const updatedVariants = [...currentVariants, { ...newVariant, stock: parseInt(newVariant.stock) || 0 }];
      await updateDoc(productRef, { variants: updatedVariants });
      addAlert('Variant added successfully!', 'success');
      setNewVariant({ color: '', size: '', stock: '' });
      setIsModalOpen(false);
    } catch (error) {
      addAlert('Failed to add variant.', 'error');
      console.error('Add variant error:', error);
    } finally {
      setLoading(false);
    }
  };

  const openVariantModal = (product) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <AdminSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <i className="bx bx-loader bx-spin text-2xl"></i>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-5 flex justify-center items-start">
        <div className="w-full lg:max-w-5xl md:max-w-4xl sm:max-w-3xl bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 border-b-2 border-blue-500 pb-3 flex items-center gap-2">
            <i className="bx bx-user text-blue-500"></i>
            Admin Manager
          </h2>

          {/* Tabs */}
          <div className="flex border-b border-gray-300 dark:border-gray-600 mt-6">
            {['sellers', 'products', 'orders', 'favorites'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-2 px-4 text-sm md:text-base font-medium ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-500'
                    : 'text-gray-600 dark:text-gray-300 hover:text-blue-500'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          {/* Sellers Tab */}
          {activeTab === 'sellers' && (
            <div className="mt-6 space-y-4">
              {sellers.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No sellers found.</p>
              ) : (
                sellers.map((seller) => (
                  <div key={seller.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Seller ID:</span> {seller.id}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Name:</span> {seller.fullName || 'Unknown'}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Bank:</span> {seller.bankName}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Account Number:</span> {seller.accountNumber || 'N/A'}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Products:</span> {seller.productCount || 0}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="mt-6 space-y-4">
              {products.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No products found.</p>
              ) : (
                products.map((product) => (
                  <div key={product.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Product ID:</span> {product.id}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Name:</span> {product.name || 'Unnamed Product'}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Seller ID:</span> {product.sellerId}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Price:</span> ₦{product.price?.toFixed(2) || '0.00'}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Buyers:</span> {product.buyerCount || 0}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Variants:</span> {product.variants?.length ? product.variants.map(v => `${v.color} (${v.size}, ${v.stock})`).join(', ') : 'None'}</p>
                    <button
                      onClick={() => openVariantModal(product)}
                      className="mt-2 py-1 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-sm"
                    >
                      <i className="bx bx-plus"></i> Add Variant
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === 'orders' && (
            <div className="mt-6 space-y-4">
              {orders.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No orders found.</p>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Order ID:</span> {order.id}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Product ID:</span> {order.productId}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Buyer ID:</span> {order.buyerId}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Amount:</span> ₦{order.amount?.toFixed(2) || '0.00'}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Status:</span> {order.status || 'Unknown'}</p>
                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Date:</span> {new Date(order.createdAt?.toDate()).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Favorites Tab */}
          {activeTab === 'favorites' && (
            <div className="mt-6 space-y-4">
              {favorites.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No favorited products found.</p>
              ) : (
                favorites.map((favorite) => {
                  const product = products.find((p) => p.id === favorite.productId) || {};
                  return (
                    <div key={favorite.productId} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm">
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Product ID:</span> {favorite.productId}</p>
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Name:</span> {product.name || 'Unnamed Product'}</p>
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Seller ID:</span> {product.sellerId || 'N/A'}</p>
                      <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Favorite Count:</span> {favorite.count}</p>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* Variant Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4">Add Variant for {selectedProduct?.name}</h2>
                <form onSubmit={handleAddVariant}>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Color</label>
                    <input
                      type="text"
                      value={newVariant.color}
                      onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                      className="mt-1 p-2 w-full border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Size</label>
                    <input
                      type="text"
                      value={newVariant.size}
                      onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                      className="mt-1 p-2 w-full border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                      required
                    />
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock</label>
                    <input
                      type="number"
                      value={newVariant.stock}
                      onChange={(e) => setNewVariant({ ...newVariant, stock: e.target.value })}
                      className="mt-1 p-2 w-full border rounded-lg text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300"
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={loading}
                    >
                      Add Variant
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
      </div>
    </div>
  );
}