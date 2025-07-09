import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '/src/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import Sidebar from '/src/profile/Sidebar';
import Spinner from '/src/components/common/Spinner';

const Orders = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        if (!auth.currentUser) {
          toast.error('Please sign in to view orders.');
          navigate('/login');
          return;
        }

        const ordersQuery = query(
          collection(db, 'orders'),
          where('userId', '==', auth.currentUser.uid)
        );
        const querySnapshot = await getDocs(ordersQuery);
        const fetchedOrders = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setOrders(fetchedOrders);
      } catch (err) {
        console.error('Error fetching orders:', err.message);
        toast.error('Failed to load orders. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchOrders();
      else {
        setLoading(false);
        toast.error('Please sign in to view orders.');
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(price);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp.toDate()).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Invalid date';
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800 dark:text-gray-700">
      <div className="flex flex-col md:flex-row gap-4">
        <Sidebar />
        <div className="md:w-3/4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6">Your Orders</h2>
            {orders.length === 0 ? (
              <p className="text-gray-600 text-center">No orders found.</p>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {orders.map((order) => (
                    <motion.div
                      key={order.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3 }}
                      className="p-4 sm:p-6 bg-gray-50 dark:bg-gray-800 rounded-lg shadow-md hover:bg-gray-100 dark:hover:bg-gray-700 transition border border-gray-200"
                    >
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800 text-sm sm:text-base">
                            Order #{order.id}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.items?.[0]?.name || 'Product'}
                          </p>
                          <p className="text-sm text-gray-600">
                            {formatPrice(order.totalPrice || 0)}
                          </p>
                          <p className="text-xs text-gray-500">
                            Placed on {formatDate(order.createdAt)}
                          </p>
                        </div>
                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 items-start sm:items-center">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                          <Link
                            to={`/chat/${order.id}`}
                            state={{
                              sellerId: order.sellerId,
                              productName: order.items?.[0]?.name || 'Product',
                              role: 'buyer',
                            }}
                            className="px-3 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition"
                          >
                            Chat with Seller
                          </Link>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Orders;