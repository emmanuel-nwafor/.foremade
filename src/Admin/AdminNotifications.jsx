import React, { useState, useEffect } from 'react';
import { auth, db } from '/src/firebase';
import { collection, query, orderBy, onSnapshot, deleteDoc, getDocs } from 'firebase/firestore';
import AdminSidebar from './AdminSidebar';
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
          className={`p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out animate-slide-in ${
            alert.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          } flex items-center gap-2`}
        >
          <i className={`bx ${alert.type === 'error' ? 'bx-error-circle' : 'bx-check-circle'} text-xl`}></i>
          <span>{alert.message}</span>
          <button onClick={() => removeAlert(alert.id)} className="ml-auto text-lg font-bold hover:text-gray-200">
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

export default function AdminNotifications() {
  const { alerts, addAlert, removeAlert } = useAlerts();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Check user authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setLoading(false);
      } else {
        addAlert('Please log in to access this page.', 'error');
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [addAlert]);

  // Fetch notifications in real-time
  useEffect(() => {
    if (!user) return;

    const q = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const notifList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notifList);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        addAlert('Failed to load notifications.', 'error');
        setLoading(false);
      }
    }, (err) => {
      console.error('Snapshot error:', err);
      addAlert('Error receiving real-time updates.', 'error');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, addAlert]);

  // Clear all notifications
  const handleClearNotifications = async () => {
    if (!window.confirm('Are you sure you want to clear all notifications? This cannot be undone.')) return;
    setLoading(true);
    try {
      const notifCollection = collection(db, 'notifications');
      const notifDocs = await getDocs(notifCollection);
      const deletePromises = notifDocs.docs.map((doc) => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      addAlert('All notifications cleared successfully! 🎉', 'success');
    } catch (err) {
      console.error('Error clearing notifications:', err);
      addAlert('Failed to clear notifications.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-NG', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  // Map notification type to icon and color
  const getNotifStyle = (type) => {
    switch (type) {
      case 'user_signup':
        return { icon: 'bx-user-plus', color: 'text-green-500' };
      case 'product_upload':
        return { icon: 'bx-package', color: 'text-blue-500' };
      case 'order_placed':
        return { icon: 'bx-cart', color: 'text-yellow-500' };
      case 'payment_failed':
        return { icon: 'bx-credit-card', color: 'text-red-500' };
      default:
        return { icon: 'bx-bell', color: 'text-gray-500' };
    }
  };

  if (!user) {
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
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 border-b-2 border-blue-500 pb-3 flex items-center gap-2">
              <i className="bx bx-bell text-blue-500"></i>
              Admin Notifications
            </h2>
            {notifications.length > 0 && (
              <button
                onClick={handleClearNotifications}
                disabled={loading}
                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                <i className="bx bx-trash"></i>
                Clear All
              </button>
            )}
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                <i className="bx bx-loader bx-spin text-2xl"></i>
                <span>Loading notifications...</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <i className="bx bx-bell-off text-5xl text-gray-400 dark:text-gray-500 mb-4"></i>
              <p className="text-gray-600 dark:text-gray-300 italic">No notifications found.</p>
            </div>
          ) : (
            <ul className="space-y-4">
              {notifications.map((notif) => {
                const { icon, color } = getNotifStyle(notif.type);
                return (
                  <li
                    key={notif.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200 flex items-start gap-4"
                  >
                    <i className={`bx ${icon} text-2xl ${color}`}></i>
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-gray-800 dark:text-gray-100">
                          {notif.message}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {formatTimestamp(notif.createdAt)}
                        </span>
                      </div>
                      {notif.details && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {Object.entries(notif.details).map(([key, value]) => (
                            <span key={key}>
                              <strong>{key.replace('_', ' ')}:</strong> {value} <br />
                            </span>
                          ))}
                        </p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
      </div>
    </div>
  );
}