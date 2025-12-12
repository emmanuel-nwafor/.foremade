import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { db, auth } from '/src/firebase';
import { doc, onSnapshot, collection, getDocs, query, where } from 'firebase/firestore';
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
    if (unsubscribe) {
      unsubscribe();
      setUnsubscribe(null);
    }

    if (!orderId || !auth.currentUser) {
      setOrderStatus(null);
      setInvalidAttempts(0);
      setShowGuide(false);
      return;
    }

    setLoading(true);
    const orderRef = doc(db, 'orders', orderId);

    const newUnsubscribe = onSnapshot(
      orderRef,
      (docSnapshot) => {
        if (docSnapshot.exists()) {
          const data = docSnapshot.data();
          setOrderStatus({
            status: data.status || 'Order Placed',
            updatedAt: data.updatedAt?.toDate() || new Date(),
            trackingDetails: data.trackingDetails || [],
          });
          setInvalidAttempts(0);
          setShowGuide(false);
        } else {
          // Fallback to search by trackingId if document ID fails
          const fetchByTrackingId = async () => {
            const ordersQuery = query(collection(db, 'orders'), where('userId', '==', auth.currentUser.uid));
            const ordersSnap = await getDocs(ordersQuery);
            const matchedOrder = ordersSnap.docs.find((doc) => {
              const data = doc.data();
              return data.paymentId === orderId || `TRK-${doc.id.slice(0, 8)}` === orderId;
            });
            if (matchedOrder) {
              const data = matchedOrder.data();
              setOrderStatus({
                status: data.status || 'Order Placed',
                updatedAt: data.updatedAt?.toDate() || new Date(),
                trackingDetails: data.trackingDetails || [],
              });
              setInvalidAttempts(0);
              setShowGuide(false);
            } else {
              setOrderStatus({ status: 'Not Found', updatedAt: new Date(), trackingDetails: [] });
              setInvalidAttempts((prev) => prev + 1);
            }
            setLoading(false);
          };
          fetchByTrackingId();
        }
      },
      (error) => {
        console.error('Error fetching order:', error);
        setOrderStatus({ status: 'Error', updatedAt: new Date(), trackingDetails: [] });
        setInvalidAttempts((prev) => prev + 1);
        setLoading(false);
      }
    );

    setUnsubscribe(() => newUnsubscribe);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [orderId, auth.currentUser]);

  useEffect(() => {
    if (invalidAttempts >= 2) {
      setShowGuide(true);
    }
  }, [invalidAttempts]);

  const handleTrack = (e) => {
    e.preventDefault();
    if (orderId && auth.currentUser) {
      setOrderStatus(null);
    }
  };

  const stages = ['Order Placed', 'Packed', 'Shipped', 'Delivered'];
  const getCurrentStep = (status, trackingDetails) => {
    if (!status || status === 'Not Found' || status === 'Error') return 0;
    if (trackingDetails.length > 0) {
      const lastStatus = trackingDetails[trackingDetails.length - 1].status;
      return stages.indexOf(lastStatus) + 1 || 1;
    }
    return stages.indexOf(status) + 1 || 1;
  };
  const currentStep = orderStatus ? getCurrentStep(orderStatus.status, orderStatus.trackingDetails) : 0;
  const progress = (currentStep / stages.length) * 100;

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
                placeholder="Track your orders (e.g., order ID or TRK-...)"
                className="w-full p-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
              <button
                type="submit"
                disabled={loading || !orderId || !auth.currentUser}
                className={`w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition ${
                  loading || !orderId || !auth.currentUser ? 'opacity-50 cursor-not-allowed' : ''
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
                  Enter your full order ID (e.g., "order-12368738293") or tracking ID (e.g., "TRK-order12") from your order history or confirmation email. If you don’t know your ID, check your "Orders" page or contact support.
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
                className="mt-6 space-y-6"
              >
                <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">Order Status</h2>
                <div className="w-full">
                  <div className="relative">
                    <div className="flex justify-between items-center mb-2">
                      {stages.map((stage, index) => (
                        <div key={index} className="flex flex-col items-center relative">
                          <motion.div
                            className={`w-8 h-8 rounded-full flex items-center justify-center z-10 ${
                              index < currentStep
                                ? 'bg-blue-600 text-white'
                                : index === currentStep
                                ? 'bg-blue-200 text-blue-800'
                                : 'bg-gray-200 text-gray-500'
                            }`}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                          >
                            {index + 1}
                          </motion.div>
                          <span className="text-xs mt-1 text-gray-600 dark:text-gray-400">{stage}</span>
                        </div>
                      ))}
                    </div>
                    <motion.div
                      className="absolute top-4 left-0 h-1 bg-gray-300"
                      style={{ width: '100%' }}
                      initial={{ width: 0 }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 1, ease: 'easeInOut' }}
                    />
                    <motion.div
                      className="absolute top-4 left-0 h-1 bg-blue-500"
                      style={{ width: `${progress}%` }}
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-4">
                    Current Step: {currentStep > 0 ? stages[currentStep - 1] : 'Not Found'}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400">
                    Last Updated: {orderStatus.updatedAt.toLocaleString()}
                  </p>
                  {orderStatus.trackingDetails.length > 0 && (
                    <div className="space-y-2 mt-4">
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
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}