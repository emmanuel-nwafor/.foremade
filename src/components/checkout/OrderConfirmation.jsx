import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { db } from '/src/firebase';
import { doc, getDoc } from 'firebase/firestore';
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
    setAlerts((prev) => prev.filter((alert => alert.id !== id)));
  }
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
        const orderId = new URLSearchParams(location.search).get('orderId') || location.state?.order?.id;
        if (!orderId) {
          addAlert('Order not found.', 'error');
          setLoading(false);
          return;
        }

        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists()) {
          addAlert('Order not found.', 'error');
          setLoading(false);
          return;
        }

        setOrder({ id: orderSnap.id, ...orderSnap.data() });
      } catch (err) {
        console.error('Error fetching order:', err);
        addAlert('Failed to load order.', 'error');
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
          <p>Order not found.</p>
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
                  src={item.imageUrls[0] || 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg'}
                  alt={item.name}
                  className="w-16 h-16 object-cover rounded"
                  onError={(e) => {
                    e.target.src = 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg';
                  }}
                />
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-gray-800 dark:text-gray-100">{item.name}</h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Quantity: {item.quantity}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-300">
                    Price: {order.currency === 'gbp' ? '£' : '₦'}
                    {(item.price * item.quantity).toLocaleString('en-NG', {
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
                {order.total.toLocaleString('en-NG', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
            <div className="flex justify-between font-semibold text-gray-800 dark:text-gray-100 mt-2">
              <span>Total</span>
              <span>
                {order.currency === 'gbp' ? '£' : '₦'}
                {order.total.toLocaleString('en-NG', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </span>
            </div>
          </div>
        </div>
      </div>
      <CustomAlert alerts={alerts} removeAlert={removeAlert} />
    </div>
  );
}