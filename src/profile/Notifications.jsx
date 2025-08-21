import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where } from 'firebase/firestore';
import { auth, db } from '/src/firebase';
import { toast } from 'react-toastify';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) {
          setNotifications([]);
          setLoading(false);
          return;
        }

        const q = query(
          collection(db, 'notifications'),
          where('userId', '==', userId),
          orderBy('createdAt', 'desc')
        );
        const snapshot = await getDocs(q);
        const notifs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setNotifications(notifs);
      } catch (err) {
        console.error('Error fetching notifications:', err);
        toast.error('Failed to load notifications.');
      } finally {
        setLoading(false);
      }
    };
    fetchNotifications();
  }, []);

  const getIcon = (type) => {
    switch (type) {
      case 'signup':
        return 'bx bx-user-plus';
      case 'login':
        return 'bx bx-log-in';
      case 'order_placed':
        return 'bx bx-package';
      case 'order_status':
        return 'bx bx-truck';
      case 'promo':
        return 'bx bx-gift';
      default:
        return 'bx bx-bell';
    }
  };

  const formatMessage = (type, data) => {
    switch (type) {
      case 'signup':
        return 'Welcome! You have successfully signed up.';
      case 'login':
        return `You logged in from ${data?.device || 'an unknown device'} at ${formatDate(data?.timestamp || new Date())}`;
      case 'order_placed':
        return `Your order #${data?.orderId || 'N/A'} has been placed.`;
      case 'order_status':
        return `Order #${data?.orderId || 'N/A'} is now ${data?.status || 'updated'}.`;
      case 'promo':
        return data?.message || 'New promotion available! Check it out.';
      default:
        return 'New notification received.';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleString('en-NG', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-6">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
          <i className="bx bx-bell text-blue-600 mr-3 text-2xl"></i>
          Your Activity & Notifications
        </h2>

        {loading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500">
            <i className="bx bx-bell-off text-4xl mb-4"></i>
            <p className="text-lg">No activities or notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white rounded-lg shadow-md p-4 flex items-start gap-4 ${
                  notif.read === false ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <i className={`${getIcon(notif.type)} text-blue-600 text-2xl`}></i>
                <div className="flex-1">
                  <p className="text-base text-gray-800">
                    {formatMessage(notif.type, notif.data)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(notif.createdAt)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;