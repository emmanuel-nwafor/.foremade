import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '/src/firebase';
import { collection, getDocs, query, where, doc, onSnapshot } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';

export default function OrderTracking() {
  const navigate = useNavigate();
  const [orderId, setOrderId] = useState('');
  const [orderStatus, setOrderStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [invalidAttempts, setInvalidAttempts] = useState(0);
  const [showGuide, setShowGuide] = useState(false);
  const [unsubscribe, setUnsubscribe] = useState(null);

  useEffect(() => {
    // Cleanup previous subscription if it exists
    if (unsubscribe) {
      unsubscribe();
      setUnsubscribe(null);
    }

    if (!orderId) {
      setOrderStatus(null);
      setInvalidAttempts(0);
      setShowGuide(false);
      return;
    }

    setLoading(true);
    const fetchOrderById = async () => {
      try {
        const ordersQuery = query(collection(db, 'orders'), where('userId', '==', auth.currentUser.uid));
        const ordersSnap = await getDocs(ordersQuery);

        const matchedOrder = ordersSnap.docs.find((orderDoc) => orderDoc.id === orderId);
        if (matchedOrder) {
          const orderRef = doc(db, 'orders', orderId);
          const newUnsubscribe = onSnapshot(orderRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              setOrderStatus({
                status: data.status || 'Not Found',
                updatedAt: data.updatedAt?.toDate() || new Date(),
                trackingDetails: data.trackingDetails || [],
              });
              setInvalidAttempts(0); // Reset on successful fetch
              setShowGuide(false);
            } else {
              setOrderStatus({ status: 'Not Found', updatedAt: new Date(), trackingDetails: [] });
              setInvalidAttempts((prev) => prev + 1);
            }
            setLoading(false);
          }, (error) => {
            console.error('Error fetching order:', error);
            setOrderStatus({ status: 'Error', updatedAt: new Date(), trackingDetails: [] });
            setInvalidAttempts((prev) => prev + 1);
            setLoading(false);
          });

          setUnsubscribe(() => newUnsubscribe);
        } else {
          setOrderStatus({ status: 'Not Found', updatedAt: new Date(), trackingDetails: [] });
          setInvalidAttempts((prev) => prev + 1);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching orders:', err);
        setOrderStatus({ status: 'Error', updatedAt: new Date(), trackingDetails: [] });
        setInvalidAttempts((prev) => prev + 1);
        setLoading(false);
      }
    };

    fetchOrderById();

    // Show guide if invalid attempts exceed 2
    if (invalidAttempts >= 2) {
      setShowGuide(true);
    }
  }, [orderId, auth.currentUser.uid, unsubscribe]); // Added unsubscribe to dependency array for cleanup

  const handleTrack = (e) => {
    e.preventDefault();
    if (orderId) setOrderStatus(null); // Reset status before fetching
  };

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
            <h1 className="text-2xl font-bold text-black dark:text-white mb-4">Track Your Order</h1>
            <form onSubmit={handleTrack} className="space-y-4">
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="Track your orders"
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                disabled={loading || !orderId}
                className={`w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
                  loading || !orderId ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {loading ? 'Tracking...' : 'Track Order'}
              </button>
            </form>
            {showGuide && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
                className="mt-6 p-4 bg-yellow-100 dark:bg-yellow-800 rounded-lg text-gray-800 dark:text-gray-200"
              >
                <h3 className="text-lg font-semibold">Need Help Tracking Your Order?</h3>
                <p className="text-sm mt-2">
                  Enter your full order ID (e.g., "order-12368738293") found in your order history or confirmation email. If you don’t know your order ID, check your "Orders" page or contact support.
                </p>
                <button
                  onClick={() => setShowGuide(false)}
                  className="mt-2 text-blue-600 dark:text-blue-400 hover:underline"
                >
                  Close Guide
                </button>
              </motion.div>
            )}
            {orderStatus && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="mt-6 space-y-4"
              >
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Order Status</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Status: <span className="font-medium">{orderStatus.status}</span>
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  Last Updated: {orderStatus.updatedAt.toLocaleString()}
                </p>
                {orderStatus.trackingDetails.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">Tracking Timeline</h3>
                    <ul className="list-disc pl-5">
                      {orderStatus.trackingDetails.map((detail, index) => (
                        <motion.li
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                          className="text-gray-600 dark:text-gray-400"
                        >
                          {detail.status} - {new Date(detail.timestamp).toLocaleString()}
                        </motion.li>
                      ))}
                    </ul>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}