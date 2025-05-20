import React, { useState, useEffect } from 'react';
import SellerSidebar from './SellerSidebar';
import { vendorAuth, db } from '../firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';

export default function UsersOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expandedOrder, setExpandedOrder] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      vendorAuth,
      async (user) => {
        if (user) {
          console.log('Vendor authenticated:', { uid: user.uid, email: user.email });
          try {
            const ordersQuery = query(
              collection(db, 'orders'),
              orderBy('date', 'desc')
            );
            console.log('Executing orders query for all user orders');
            const querySnapshot = await getDocs(ordersQuery);
            const allOrders = querySnapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));

            // Filter orders to only include those with items sold by this vendor
            const vendorOrders = allOrders.filter((order) =>
              order.items?.some((item) => item.sellerId === user.uid)
            );

            console.log('Filtered orders for vendor UID:', user.uid, JSON.stringify(vendorOrders, null, 2));
            setOrders(vendorOrders);
          } catch (err) {
            console.error('Firestore query error:', {
              code: err.code,
              message: err.message,
              stack: err.stack,
            });
            setError(
              `Failed to fetch user orders: ${err.message}. ${
                err.message.includes('index')
                  ? 'Please create the required index in Firestore (foremade-backend).'
                  : ''
              }`
            );
          }
        } else {
          console.warn('No vendor authenticated');
          setError('Please log in to view user orders.');
          navigate('/seller/login');
        }
        setLoading(false);
      },
      (err) => {
        console.error('Auth state error:', {
          code: err.code,
          message: err.message,
          stack: err.stack,
        });
        setError('Authentication error: ' + err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [navigate]);

  const toggleOrderDetails = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, paymentGateway) => {
    const currency = paymentGateway === 'Stripe' ? 'GBP' : 'NGN';
    return new Intl.NumberFormat(currency === 'GBP' ? 'en-GB' : 'en-NG', {
      style: 'currency',
      currency,
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SellerSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6 font-serif">
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-slate-600"></div>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <SellerSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6 font-serif">
          <div className="max-w-4xl mx-auto bg-red-100 border-l-4 border-red-500 p-4 rounded-lg animate-fade-in">
            <p className="text-red-700">{error}</p>
            <p className="mt-2">
              <Link to="/seller/login" className="text-blue-600 hover:underline">
                Return to Login
              </Link>
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <SellerSidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6 font-serif">
        <div className="max-w-5xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Your Orders</h1>
            <Link
              to="/seller/agreement"
              className="bg-gradient-to-r from-slate-600 to-slate-700 text-white px-4 py-2 rounded-lg hover:from-slate-700 hover:to-slate-800 transition-all duration-300 transform hover:scale-105"
            >
              View Agreement
            </Link>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-lg">No orders found.</p>
              <p className="mt-2">
                <Link to="/seller/products" className="text-blue-600 hover:underline">
                  Upload products to start receiving orders
                </Link>
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-sm font-semibold text-gray-700">Order ID</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Customer</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Date</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Total</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Status</th>
                    <th className="p-3 text-sm font-semibold text-gray-700">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <React.Fragment key={order.id}>
                      <tr className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3 text-sm">{order.orderId || order.id}</td>
                        <td className="p-3 text-sm">{order.shippingDetails?.name || 'N/A'}</td>
                        <td className="p-3 text-sm">{formatDate(order.date)}</td>
                        <td className="p-3 text-sm">{formatCurrency(order.total, order.paymentGateway)}</td>
                        <td className="p-3 text-sm">
                          <span
                            className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                              order.status === 'completed'
                                ? 'bg-green-100 text-green-700'
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {order.status || 'N/A'}
                          </span>
                        </td>
                        <td className="p-3 text-sm">
                          <button
                            onClick={() => toggleOrderDetails(order.id)}
                            className="text-blue-600 hover:underline"
                          >
                            {expandedOrder === order.id ? 'Hide' : 'Show'}
                          </button>
                        </td>
                      </tr>
                      {expandedOrder === order.id && (
                        <tr>
                          <td colSpan="6" className="p-3 bg-gray-50">
                            <div className="pl-4">
                              <h4 className="text-sm font-semibold text-gray-700">Items</h4>
                              {order.items && order.items.length > 0 ? (
                                <ul className="list-disc pl-5 text-sm text-gray-600">
                                  {order.items
                                    .filter((item) => item.sellerId === vendorAuth.currentUser?.uid)
                                    .map((item, index) => (
                                      <li key={index}>
                                        {item.name} x{item.quantity} - {formatCurrency(item.price * item.quantity, order.paymentGateway)}
                                      </li>
                                    ))}
                                </ul>
                              ) : (
                                <p className="text-sm text-gray-600">No items</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}