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
        return 'bx bx-user-check';
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
    <div className="min-h-screen bg-gray-100 py-4 xs:py-6">
      <div className="container mx-auto px-3 xs:px-4">
        <h2 className="text-lg xs:text-xl font-bold text-gray-800 mb-4 xs:mb-6 flex items-center">
          <i className="bx bx-bell text-blue-600 mr-2 text-xl xs:text-2xl"></i>
          Notifications
        </h2>

        {loading ? (
          <div className="space-y-3 xs:space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-600">
            <i className="bx bx-bell-off text-4xl mb-2"></i>
            <p className="text-sm xs:text-base">No notifications yet.</p>
          </div>
        ) : (
          <div className="space-y-3 xs:space-y-4">
            {notifications.map((notif) => (
              <div
                key={notif.id}
                className={`bg-white rounded-lg shadow-sm p-4 flex items-start gap-3 xs:gap-4 ${
                  notif.read === false ? 'border-l-4 border-blue-500' : ''
                }`}
              >
                <i className={`${getIcon(notif.type)} text-blue-600 text-xl xs:text-2xl`}></i>
                <div className="flex-1">
                  <p className="text-sm xs:text-base text-gray-800">
                    {notif.message || 'No message available'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
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