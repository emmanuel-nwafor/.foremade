import React, { useState, useEffect } from 'react';
import SellerSidebar from './SellerSidebar';
import { auth, db } from '../firebase';
import { collection, getDocs } from 'firebase/firestore';
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
      auth,
      async (user) => {
        if (user) {
          try {
            console.log('Starting orders fetch for seller at:', new Date().toISOString());
            console.log('Authenticated seller UID:', user.uid);

            // Step 1: Fetch all products uploaded by the seller
            const productsCollection = collection(db, 'products');
            const productsSnap = await getDocs(productsCollection);
            console.log('Products snapshot received, count:', productsSnap.docs.length);

            const sellerProducts = productsSnap.docs
              .map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))
              .filter((product) => product.sellerId === user.uid);

            console.log('Seller products fetched, count:', sellerProducts.length);
            if (sellerProducts.length === 0) {
              console.log('No products found for this seller.');
              setOrders([]);
              setLoading(false);
              return;
            }

            // Extract product IDs uploaded by the seller
            const sellerProductIds = sellerProducts.map((product) => product.id);
            console.log('Seller product IDs:', sellerProductIds);

            // Step 2: Fetch all orders and filter based on seller's product IDs
            const ordersCollection = collection(db, 'orders');
            const ordersSnap = await getDocs(ordersCollection);
            console.log('Orders snapshot received, count:', ordersSnap.docs.length);

            const fetchedOrders = ordersSnap.docs
              .map((orderDoc) => ({
                id: orderDoc.id,
                ...orderDoc.data(),
                total: Array.isArray(orderDoc.data().items)
                  ? orderDoc.data().items
                      .filter((item) => sellerProductIds.includes(item.productId))
                      .reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0)
                  : 0,
              }))
              .filter((order) =>
                order.items.some((item) => sellerProductIds.includes(item.productId))
              )
              .map((order) => {
                const items = Array.isArray(order.items) ? order.items : [];
                const sellerItems = items.filter((item) =>
                  sellerProductIds.includes(item.productId)
                );
                return {
                  ...order,
                  items: sellerItems.map((item) => ({
                    productId: item.productId,
                    name: item.name || 'Unknown',
                    quantity: item.quantity || 0,
                    price: item.price || 0,
                    sellerId: item.sellerId,
                  })),
                };
              })
              .sort((a, b) => {
                const dateA = a.createdAt?.toDate() || new Date(0);
                const dateB = b.createdAt?.toDate() || new Date(0);
                return dateB - dateA;
              });

            console.log('Filtered orders for seller, count:', fetchedOrders.length);
            setOrders(fetchedOrders);
          } catch (err) {
            console.error('Firestore fetch error:', {
              code: err.code,
              message: err.message,
              stack: err.stack,
            });
            setError(`Failed to fetch user orders: ${err.message}.`);
          }
        } else {
          console.warn('No seller authenticated');
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
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount, currency) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'NGN',
    }).format(amount || 0);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <i className="bx bx-loader bx-spin text-2xl"></i>
            <span>Loading...</span>
          </div>
        </div>
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
      <main className="flex-1 ml-0 md:ml-64 p-4">
        <div className="max-w-8xl mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8 bg-gradient-to-br from-gray-50 to-white">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">Your Orders</h1>
          </div>
          {orders.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 text-lg">No orders found.</p>
              <p className="mt-2">
                <Link to="/products-upload" className="text-blue-600 hover:underline">
                  Upload products to start receiving orders
                </Link>
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              {/* Table for larger screens */}
              <table className="w-full text-left border-collapse hidden md:table">
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
                        <td className="p-3 text-sm">{formatDate(order.createdAt)}</td>
                        <td className="p-3 text-sm">{formatCurrency(order.total, order.currency)}</td>
                        <td className="p-3 text-sm">
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Placed
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
                                  {order.items.map((item, index) => (
                                    <li key={index}>
                                      {item.name} x{item.quantity} - {formatCurrency(item.price * item.quantity, order.currency)}
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

              {/* Card layout for mobile screens */}
              <div className="md:hidden space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50 hover:bg-gray-100">
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-gray-700">Order ID:</span>
                        <span className="text-sm">{order.orderId || order.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-gray-700">Customer:</span>
                        <span className="text-sm">{order.shippingDetails?.name || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-gray-700">Date:</span>
                        <span className="text-sm">{formatDate(order.createdAt)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-gray-700">Total:</span>
                        <span className="text-sm">{formatCurrency(order.total, order.currency)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-semibold text-gray-700">Status:</span>
                        <span className="inline-block px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          Placed
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-semibold text-gray-700">Details:</span>
                        <button
                          onClick={() => toggleOrderDetails(order.id)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {expandedOrder === order.id ? 'Hide' : 'Show'}
                        </button>
                      </div>
                      {expandedOrder === order.id && (
                        <div className="mt-2">
                          <h4 className="text-sm font-semibold text-gray-700">Items</h4>
                          {order.items && order.items.length > 0 ? (
                            <ul className="list-disc pl-5 text-sm text-gray-600">
                              {order.items.map((item, index) => (
                                <li key={index}>
                                  {item.name} x{item.quantity} - {formatCurrency(item.price * item.quantity, order.currency)}
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-600">No items</p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}