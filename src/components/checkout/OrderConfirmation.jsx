import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '/src/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import 'boxicons/css/boxicons.min.css';

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
          className={`p-4 rounded-lg shadow-md transform transition-all duration-300 ease-in-out animate-slide-in ${
            alert.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          } flex items-center gap-2`}
        >
          <i className={`bx ${alert.type === 'error' ? 'bx-error-circle' : 'bx-check-circle'} text-xl`}></i>
          <span>{alert.message}</span>
          <button onClick={() => removeAlert(alert.id)} className="ml-auto text-gray-200 hover:text-white">
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

export default function OrderConfirmation() {
  const { alerts, addAlert, removeAlert } = useAlerts();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Get orderId from query param first, then state
        const searchParams = new URLSearchParams(location.search);
        let orderId = searchParams.get('orderId') || location.state?.order?.id;
        console.log('Attempting to fetch order with ID:', orderId);

        if (!orderId) {
          console.warn('No orderId provided in query params or state');
          addAlert('Order not found. Please check your link or contact support.', 'error');
          setLoading(false);
          return;
        }

        // Validate orderId format
        if (!orderId.startsWith('order-')) {
          console.warn('Invalid orderId format:', orderId);
          addAlert('Invalid order ID. Please contact support.', 'error');
          setLoading(false);
          return;
        }

        // Try fetching the order with retries
        let orderData = null;
        let attempts = 3;
        while (attempts > 0) {
          try {
            const orderRef = doc(db, 'orders', orderId);
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
              orderData = { id: orderSnap.id, ...orderSnap.data() };
              console.log('Order found:', orderData);
              break;
            }
            console.warn(`Order ${orderId} not found on attempt ${4 - attempts}`);
            attempts--;
            if (attempts > 0) {
              await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
            }
          } catch (err) {
            console.error('Firestore fetch error:', err);
            attempts--;
            if (attempts === 0) {
              throw err;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
          }
        }

        // If order not found, try base orderId (without seller suffix)
        if (!orderData && orderId.includes('-')) {
          const baseOrderId = orderId.split('-').slice(0, 2).join('-'); // e.g., order-1234567890
          console.log('Trying base orderId:', baseOrderId);
          const ordersQuery = query(
            collection(db, 'orders'),
            where('id', '==', baseOrderId)
          );
          const querySnap = await getDocs(ordersQuery);
          if (!querySnap.empty) {
            // Use the first matching order
            const firstOrder = querySnap.docs[0];
            orderData = { id: firstOrder.id, ...firstOrder.data() };
            console.log('Found order with base ID:', orderData);
            orderId = firstOrder.id; // Update orderId to full ID
          }
        }

        // Fallback to location.state.order if Firestore fetch fails
        if (!orderData && location.state?.order) {
          console.log('Using state.order as fallback:', location.state.order);
          orderData = { ...location.state.order, id: orderId };
          addAlert('Order loaded from session. Some details may be incomplete.', 'info');
        }

        if (!orderData) {
          console.error('No order data found for ID:', orderId);
          addAlert('Order not found. Please contact support at support@foremade.com.', 'error');
          setLoading(false);
          return;
        }

        setOrder(orderData);
      } catch (err) {
        console.error('Error fetching order:', {
          message: err.message,
          stack: err.stack,
        });
        addAlert('Failed to load order. Please try again or contact support.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrder();
  }, [location, addAlert]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <div className="flex gap-2 text-gray-600 dark:text-gray-300">
          <i className="bx bx-loader bx-spin text-2xl"></i>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <div className="text-center text-gray-600 dark:text-gray-300">
          <i className="bx bx-error-circle text-4xl text-red-500 mb-2"></i>
          <p>Order not found. Please contact <a href="mailto:support@foremade.com" className="text-blue-600 hover:underline">support@foremade.com</a>.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
          <i className="bx bx-check-circle text-green-500"></i>
          Order Confirmation
        </h2>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4">
            Order #{order.id}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            Thank you for your purchase! Your order has been successfully placed.
          </p>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg"
              >
                <img
                  src={item.imageUrls?.[0] || 'https://via.placeholder.com/150'}
                  alt={item.name || 'Product'}
                  className="w-16 h-16 object-cover rounded"
                  onError={(e) => {
                    e.target.src = 'https://via.placeholder.com/150';
                  }}
                />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">{item.name || 'Unknown Product'}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Quantity: {item.quantity || 1}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Price: {order.currency === 'gbp' ? '£' : '₦'}
                    {((item.price || 0) * (item.quantity || 1)).toLocaleString('en-NG', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-gray-200 dark:border-gray-600 pt-4">
            <div className="flex justify-between text-gray-600 dark:text-gray-300">
              <span>Subtotal</span>
              <span>
                {order.currency === 'gbp' ? '£' : '₦'}
                {(order.totalAmount || order.total || 0).toLocaleString('en-NG', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-gray-800 dark:text-gray-100 mt-2">
              <span>Total</span>
              <span>
                {order.currency === 'gbp' ? '£' : '₦'}
                {(order.totalAmount || order.total || 0).toLocaleString('en-NG', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
          <div className="mt-6">
            <h4 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Shipping Details</h4>
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {order.shippingDetails?.name || 'Not provided'}<br />
              {order.shippingDetails?.address || 'Not provided'}<br />
              {order.shippingDetails?.city || ''}{order.shippingDetails?.city && order.shippingDetails?.postalCode ? ', ' : ''}{order.shippingDetails?.postalCode || ''}<br />
              {order.shippingDetails?.country || 'Not provided'}<br />
              <strong>Email:</strong> {order.shippingDetails?.email || 'Not provided'}<br />
              <strong>Phone:</strong> {order.shippingDetails?.phone || 'Not provided'}
            </p>
          </div>
        </div>
      </div>
      <CustomAlert alerts={alerts} removeAlert={removeAlert} />
    </div>
  );
}