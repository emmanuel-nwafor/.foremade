import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import Sidebar from '/src/profile/Sidebar';
import Spinner from '/src/components/common/Spinner';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!auth.currentUser) {
          setError('Please sign in to view your orders.');
          setLoading(false);
          return;
        }

        const ordersQuery = query(collection(db, 'orders'), where('userId', '==', auth.currentUser.uid));
        const ordersSnap = await getDocs(ordersQuery);

        const fetchedOrders = await Promise.all(
          ordersSnap.docs.map(async (orderDoc) => {
            const orderData = orderDoc.data();
            const items = Array.isArray(orderData.items) ? orderData.items : [];
            const total = orderData.total || 0;
            const trackingId = orderData.paymentId || `TRK-${orderDoc.id.slice(0, 8)}`;

            let seller = { sellerId: null, displayName: 'Unknown Seller', avatar: null };
            if (items.length > 0 && items[0].productId) {
              try {
                const productRef = doc(db, 'products', items[0].productId);
                const productSnap = await getDoc(productRef);
                if (productSnap.exists()) {
                  const productData = productSnap.data();
                  const sellerId = productData.sellerId;
                  if (sellerId) {
                    const sellerRef = doc(db, 'users', sellerId);
                    const sellerSnap = await getDoc(sellerRef);
                    if (sellerSnap.exists()) {
                      const sellerData = sellerSnap.data();
                      seller = {
                        sellerId,
                        displayName: sellerData.displayName || 'Unknown Seller',
                        avatar: sellerData.avatar || 'https://ui-avatars.com/api/?name=S&background=3b82f6&color=fff&size=40',
                      };
                    }
                  }
                }
              } catch (err) {
                console.error('Error fetching seller data:', err.message);
              }
            }

            return {
              orderId: orderDoc.id,
              trackingId,
              total,
              date: orderData.date || new Date().toISOString(),
              items,
              seller,
            };
          })
        );

        setOrders(fetchedOrders);
      } catch (err) {
        setError(`Failed to load orders: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchOrders();
      else {
        setError('Please sign in to view your orders.');
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const formatPrice = (price) => {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`;
  };

  const handleChatWithSeller = (order) => {
    navigate(`/chat/${order.orderId}`, {
      state: {
        sellerId: order.seller.sellerId,
        productName: order.items[0]?.name || 'Product',
        orderId: order.orderId,
        role: 'buyer',
      },
    });
  };

  const formatDate = (date) => {
    try {
      return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (err) {
      return 'Unknown Date';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Spinner />
        <p className="text-gray-600 dark:text-gray-300">Loading orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <p className="text-red-600 dark:text-red-400 text-lg font-medium">{error}</p>
          <Link
            to="/login"
            className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-500 font-medium underline transition"
          >
            Go to Login
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800 dark:text-gray-200">
      <div className="flex flex-col md:flex-row gap-4">
        <Sidebar />
        <motion.div
          className="md:w-3/4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-4">Your Orders</h1>
            {orders.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-600 dark:text-gray-400"
              >
                No orders found.{' '}
                <Link
                  to="/products"
                  className="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-500 font-medium underline"
                >
                  Start shopping
                </Link>
              </motion.p>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {orders.map((order) => (
                    <motion.div
                      key={order.orderId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                      className="bg-white dark:bg-gray-700 rounded-lg shadow-md p-4 hover:shadow-lg transition-shadow"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={order.seller.avatar}
                            alt="Seller"
                            className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600"
                          />
                          <div>
                            <p className="text-sm font-semibold text-gray-900 dark:text-gray-400">
                              Seller
                            </p>
                            <h2 className="text-xs text-gray-800 dark:text-gray-100">
                              Order #{order.orderId}
                            </h2>
                          </div>
                        </div>
                        {/* <motion.button
                          onClick={() => handleChatWithSeller(order)}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.95 }}
                          className="mt-2 sm:mt-0 px-4 py-2 bg-gray-800 text-white rounded-full text-sm font-medium hover:bg-gray-600 dark:bg-amber-500 dark:hover:bg-amber-600 transition"
                        >
                          Chat with Seller
                        </motion.button> */}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Tracking ID: {order.trackingId}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          Date: {formatDate(order.date)}
                        </p>
                      </div>
                      <div className="space-y-2">
                        {order.items.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between text-sm text-gray-600 dark:text-gray-300"
                          >
                            <span>
                              {item.name} x{item.quantity}
                            </span>
                            <span>{formatPrice(item.price * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Orders;