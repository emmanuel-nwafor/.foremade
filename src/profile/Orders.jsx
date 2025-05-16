import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import Sidebar from '/src/profile/Sidebar';
import Spinner from '../components/common/Spinner';

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [displayOrders, setDisplayOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('date');
  const [sortOrder, setSortOrder] = useState('desc');

  useEffect(() => {
    console.log('Starting orders fetch at:', new Date().toISOString());
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        if (!user) {
          console.log('No user authenticated');
          setError('Please sign in to view your orders.');
          setLoading(false);
          return;
        }

        console.log('User authenticated, UID:', user.uid);
        const ordersQuery = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const ordersSnap = await getDocs(ordersQuery);
        console.log('Orders snapshot received, count:', ordersSnap.docs.length);

        const fetchedOrders = await Promise.all(
          ordersSnap.docs.map(async (orderDoc) => {
            const orderData = orderDoc.data();
            console.log('Processing order:', orderDoc.id, orderData);

            const items = Array.isArray(orderData.items) ? orderData.items : [];
            const total = orderData.total || 0;
            const trackingId = orderData.paymentId || `TRK-${orderDoc.id.slice(0, 8)}`;
            const status = orderData.status || 'Pending';

            return {
              orderId: orderDoc.id,
              trackingId,
              total,
              status,
              date: orderData.date || new Date().toISOString(),
              items: items.map(item => ({
                name: item.name || 'Unknown',
                quantity: item.quantity || 0,
                price: item.price || 0,
              })),
            };
          })
        );

        console.log('Orders processed, count:', fetchedOrders.length);
        setOrders(fetchedOrders);
        setDisplayOrders(fetchedOrders);
        window.dispatchEvent(new Event('orderCountUpdated'));
      } catch (err) {
        console.error('Error loading orders:', err.message, err.stack);
        setError(`Failed to load orders: ${err.message}`);
      } finally {
        console.log('Setting loading to false at:', new Date().toISOString());
        setLoading(false);
      }
    }, (err) => {
      console.error('Auth state error:', err);
      setError('Authentication error. Please try again.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const sortedOrders = [...orders].sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'trackingId') {
        comparison = a.trackingId.localeCompare(b.trackingId);
      } else if (sortBy === 'date') {
        comparison = new Date(a.date) - new Date(b.date);
      } else if (sortBy === 'status') {
        comparison = a.status.localeCompare(b.status);
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    setDisplayOrders(sortedOrders);
  }, [orders, sortBy, sortOrder]);

  const handleSortChange = (e) => {
    setSortBy(e.target.value);
  };

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Spinner />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600">{error}</p>
        <Link to="/login" className="text-blue-600 hover:underline">Go to Login</Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800">
      <div className="flex flex-col md:flex-row gap-6">
        <Sidebar />
        <div className="md:w-3/4">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold text-gray-800">Your Orders</h1>
            {orders.length > 0 && (
              <div className="flex items-center gap-2">
                <label className="text-gray-600">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={handleSortChange}
                  className="p-2 border border-gray-300 rounded-lg"
                >
                  <option value="date">Date</option>
                  <option value="trackingId">Tracking ID</option>
                  <option value="status">Status</option>
                </select>
                <button
                  onClick={toggleSortOrder}
                  className="p-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
                </button>
              </div>
            )}
          </div>
          {displayOrders.length === 0 ? (
            <p className="text-gray-600">
              No orders found.{' '}
              <Link to="/products" className="text-blue-600 hover:underline">Start shopping</Link>
            </p>
          ) : (
            <div className="space-y-6">
              {displayOrders.map((order) => (
                <div key={order.orderId} className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-semibold text-gray-800">Order #{order.orderId}</h2>
                    <span className={`text-sm ${order.status === 'completed' ? 'text-green-600' : 'text-blue-600'}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">Tracking ID: {order.trackingId}</p>
                  <p className="text-sm text-gray-600 mb-2">Date: {new Date(order.date).toLocaleDateString()}</p>
                  <div className="space-y-2">
                    {order.items.map((item, index) => (
                      <p key={index} className="text-sm text-gray-600">
                        {item.name} x{item.quantity} - ₦{(item.price * item.quantity).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                      </p>
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mt-4">
                    Total: ₦{order.total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;