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
    <div className="fixed bottom-2 sm:bottom-4 right-2 sm:right-4 z-50 space-y-1 sm:space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-2 sm:p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out animate-slide-in ${
            alert.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          } flex items-center gap-1 sm:gap-2`}
        >
          <i className={`bx ${alert.type === 'error' ? 'bx-error-circle' : 'bx-check-circle'} text-lg sm:text-xl`}></i>
          <span className="text-xs sm:text-base">{alert.message}</span>
          <button onClick={() => removeAlert(alert.id)} className="ml-auto text-lg sm:text-xl font-bold hover:text-gray-200">
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
        <div className="flex-1 ml-0 md:ml-64 p-3 sm:p-6 flex justify-center items-center">
          <div className="flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-300">
            <i className="bx bx-loader bx-spin text-xl sm:text-2xl"></i>
            <span className="text-sm sm:text-base">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-3 sm:p-5 flex justify-center items-start">
        <div className="w-full max-w-lg sm:max-w-md md:max-w-2xl lg:max-w-5xl bg-white dark:bg-gray-800 p-3 sm:p-4 md:p-6 rounded-lg sm:rounded-xl shadow-sm">
          <div className="flex sm:flex-row justify-between items-start sm:items-center mb-3 sm:mb-6">
            <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-800 dark:text-gray-100 border-b-2 sm:border-b-0 border-blue-500 pb-2 sm:pb-0 flex items-center gap-1 sm:gap-2">
              <i className="bx bx-bell text-blue-500 text-lg sm:text-xl md:text-2xl"></i>
              Notifications
            </h2>
            {notifications.length > 0 && (
              <button
                onClick={handleClearNotifications}
                disabled={loading}
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm font-medium text-white bg-red-600 rounded-md sm:rounded-lg hover:bg-red-700 transition-all duration-200 shadow-md ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                } mt-2 sm:mt-0`}
              >
                <i className="bx bx-trash text-base sm:text-lg"></i>
                <span>Clear All</span>
              </button>
            )}
          </div>
          {loading ? (
            <div className="flex justify-center items-center py-4 sm:py-6">
              <div className="flex items-center gap-1 sm:gap-2 text-gray-600 dark:text-gray-300">
                <i className="bx bx-loader bx-spin text-xl sm:text-2xl"></i>
                <span className="text-sm sm:text-base">Loading notifications...</span>
              </div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <i className="bx bx-bell-off text-3xl sm:text-5xl text-gray-400 dark:text-gray-500 mb-2 sm:mb-4"></i>
              <p className="text-gray-600 dark:text-gray-300 italic text-sm sm:text-base">No notifications found.</p>
            </div>
          ) : (
            <ul className="space-y-2 sm:space-y-4">
              {notifications.map((notif) => {
                const { icon, color } = getNotifStyle(notif.type);
                return (
                  <li
                    key={notif.id}
                    className="p-2 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg sm:rounded-xl shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200 flex items-start gap-2 sm:gap-4"
                  >
                    <i className={`bx ${icon} text-lg sm:text-2xl ${color}`}></i>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <span className="font-medium text-gray-800 dark:text-gray-100 text-sm sm:text-base">
                          {notif.message}
                        </span>
                        <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 sm:mt-0">
                          {formatTimestamp(notif.createdAt)}
                        </span>
                      </div>
                      {notif.details && (
                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-1 sm:mt-2">
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