import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import {
  collection,
  doc,
  onSnapshot,
  query,
  where,
  getDocs,
  limit,
  Timestamp
} from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import SellerSidebar from './SellerSidebar';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// IMPORTANT: This component requires a Firebase composite index on the 'transactions' collection
// with fields: userId (Ascending), createdAt (Descending), __name__ (Descending)
// Create the index here: https://console.firebase.google.com/v1/r/project/foremade-backend/firestore/indexes?create_composite=ClVwcm9qZWN0cy9mb3JlbWFkZS1iYWNrZW5kL2RhdGFiYXNlcy8oZGVmYXVsdCkvY29sbGVjdGlvbkdyb3Vwcy90cmFuc2FjdGlvbnMvaW5kZXhlcy9fEAEaCgoGdXNlcklkEAEaDQoJY3JlYXRlZEF0EAIaDAoIX19uYW1lX18QAg

export default function Dashboard() {
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wallet, setWallet] = useState({
    availableBalance: 0,
    pendingBalance: 0,
    updatedAt: null
  });
  const [orderStats, setOrderStats] = useState({
    pending: 0,
    confirmed: 0,
    processing: 0,
    readyToShip: 0,
    cancelled: 0,
    delivered: 0,
    returned: 0
  });
  const [salesStats, setSalesStats] = useState({
    orders: { value: 0, change: 0 },
    views: { value: 0, change: 0 },
    conversionRate: { value: 0, change: 0 }
  });
  const [salesData, setSalesData] = useState({
    labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    datasets: [{
      label: 'Sales',
      data: [],
      borderColor: 'rgb(99, 102, 241)',
      backgroundColor: 'rgba(99, 102, 241, 0.1)',
      fill: true,
      tension: 0.4
    }]
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    console.log('Dashboard component mounted');
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      if (user) {
        setVendor(user);
        listenToWalletData(user.uid);
        listenToTransactions(user.uid);
        fetchOrderStats(user.uid);
        fetchSalesStats(user.uid);
        fetchWeeklySalesData(user.uid);
      } else {
        setError('Please log in to view your dashboard.');
      }
      setLoading(false);
    });

    return () => {
      console.log('Dashboard component unmounting');
      unsubscribeAuth();
    };
  }, []);

  const fetchOrderStats = async (uid) => {
    try {
      const ordersRef = collection(db, 'orders');
      const statuses = ['pending', 'confirmed', 'processing', 'readyToShip', 'cancelled', 'delivered', 'returned'];
      const stats = {};

      for (const status of statuses) {
        const q = query(
          ordersRef,
          where('sellerId', '==', uid),
          where('status', '==', status)
        );
        const snapshot = await getDocs(q);
        stats[status] = snapshot.size;
      }

      setOrderStats(stats);
    } catch (err) {
      console.error('Error fetching order stats:', err);
    }
  };

  const fetchSalesStats = async (uid) => {
    try {
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

      // Fetch orders for this month and last month
      const ordersRef = collection(db, 'orders');
      const thisMonthQuery = query(
        ordersRef,
        where('sellerId', '==', uid),
        where('createdAt', '>=', Timestamp.fromDate(thisMonth))
      );
      const lastMonthQuery = query(
        ordersRef,
        where('sellerId', '==', uid),
        where('createdAt', '>=', Timestamp.fromDate(lastMonth)),
        where('createdAt', '<', Timestamp.fromDate(thisMonth))
      );

      const [thisMonthOrders, lastMonthOrders] = await Promise.all([
        getDocs(thisMonthQuery),
        getDocs(lastMonthQuery)
      ]);

      // Calculate percentage change
      const thisMonthCount = thisMonthOrders.size;
      const lastMonthCount = lastMonthOrders.size;
      const orderChange = lastMonthCount ? ((thisMonthCount - lastMonthCount) / lastMonthCount) * 100 : 0;

      // Similar calculations for views (assuming you have a views collection)
      // This is a simplified version - you might want to adjust based on your actual data structure
      const viewsRef = collection(db, 'productViews');
      const thisMonthViewsQuery = query(
        viewsRef,
        where('sellerId', '==', uid),
        where('viewedAt', '>=', Timestamp.fromDate(thisMonth))
      );
      const lastMonthViewsQuery = query(
        viewsRef,
        where('sellerId', '==', uid),
        where('viewedAt', '>=', Timestamp.fromDate(lastMonth)),
        where('viewedAt', '<', Timestamp.fromDate(thisMonth))
      );

      const [thisMonthViews, lastMonthViews] = await Promise.all([
        getDocs(thisMonthViewsQuery),
        getDocs(lastMonthViewsQuery)
      ]);

      const thisMonthViewCount = thisMonthViews.size;
      const lastMonthViewCount = lastMonthViews.size;
      const viewChange = lastMonthViewCount ? ((thisMonthViewCount - lastMonthViewCount) / lastMonthViewCount) * 100 : 0;

      setSalesStats({
        orders: { value: thisMonthCount, change: orderChange },
        views: { value: thisMonthViewCount, change: viewChange },
        conversionRate: { 
          value: thisMonthViewCount ? Math.round((thisMonthCount / thisMonthViewCount) * 100) : 0,
          change: 0 // You might want to calculate this based on your business logic
        }
      });
    } catch (err) {
      console.error('Error fetching sales stats:', err);
    }
  };

  const fetchWeeklySalesData = async (uid) => {
    try {
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      
      const ordersRef = collection(db, 'orders');
      const weeklyQuery = query(
        ordersRef,
        where('sellerId', '==', uid),
        where('createdAt', '>=', Timestamp.fromDate(weekAgo))
      );

      const snapshot = await getDocs(weeklyQuery);
      const dailySales = new Array(7).fill(0);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

      snapshot.forEach(doc => {
        const data = doc.data();
        const date = data.createdAt.toDate();
        const dayIndex = date.getDay();
        dailySales[dayIndex] += data.amount || 0;
      });

      // Rotate array to start from Monday
      const rotatedSales = [...dailySales.slice(1), dailySales[0]];
      const rotatedDays = [...days.slice(1), days[0]];

      setSalesData({
        labels: rotatedDays,
        datasets: [{
          label: 'Sales',
          data: rotatedSales,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4
        }]
      });
    } catch (err) {
      console.error('Error fetching weekly sales data:', err);
    }
  };

  const listenToWalletData = (uid) => {
    console.log('Setting up wallet listener for uid:', uid);
    const walletRef = doc(db, 'wallets', uid);
    return onSnapshot(walletRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('Wallet data updated:', data);
        setWallet({
          availableBalance: data.availableBalance || 0,
          pendingBalance: data.pendingBalance || 0,
          updatedAt: data.updatedAt?.toDate() || null
        });
      } else {
        console.log('No wallet document exists for uid:', uid);
      }
    }, (err) => {
      console.error('Wallet listener error:', err);
      setError('Failed to load wallet data: ' + err.message);
    });
  };

  const listenToTransactions = (uid) => {
    console.log('Setting up transactions listener for uid:', uid);
    try {
      // Simplified query that doesn't require a composite index
      const q = query(
        collection(db, 'transactions'),
        where('userId', '==', uid),
        limit(5)
      );

      return onSnapshot(q, (querySnapshot) => {
        console.log('Transactions data updated, count:', querySnapshot.size);
        const transactions = querySnapshot.docs.map(doc => {
          const data = doc.data();
          console.log('Transaction document:', doc.id, data);
          return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || null
          };
        });
        // Sort transactions client-side instead
        transactions.sort((a, b) => {
          const dateA = a.createdAt || new Date(0);
          const dateB = b.createdAt || new Date(0);
          return dateB - dateA;
        });
        setRecentTransactions(transactions);
      }, (err) => {
        console.error('Transactions listener error:', err);
        setError('Failed to load transactions: ' + err.message);
      });
    } catch (err) {
      console.error('Error setting up transactions listener:', err);
      setError('Error setting up transactions: ' + err.message);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-red-700">{error}</p>
          <Link to="/login" className="text-blue-600 hover:underline mt-2 inline-block">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        mode: 'index',
        intersect: false,
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-800 text-white rounded-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
      >
        <i className="bx bx-menu text-xl"></i>
      </button>

      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:w-64 bg-white border-r`}>
        <SellerSidebar />
      </div>

      <div className="flex-1 p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold mb-8">Overview</h1>

          {/* Balance Section */}
          <div className="bg-white rounded-xl p-6 mb-8">
            <h2 className="text-lg font-medium mb-4">Balance</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <i className="bx bx-wallet text-green-600"></i>
                  </div>
                  <h3 className="text-lg font-medium">Available Balance</h3>
                </div>
                <p className="text-3xl font-bold mb-2">₦{wallet.availableBalance.toLocaleString()}</p>
                <p className="text-gray-600">Withdrawable now</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                    <i className="bx bx-time text-orange-600"></i>
                  </div>
                  <h3 className="text-lg font-medium">Pending Balance</h3>
                </div>
                <p className="text-3xl font-bold mb-2">₦{wallet.pendingBalance.toLocaleString()}</p>
                <p className="text-gray-600">Awaiting confirmation</p>
              </div>
            </div>
          </div>

          {/* Order List */}
          <div className="bg-white rounded-xl p-6 mb-8">
            <h2 className="text-lg font-medium mb-4">Order list</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="bx bx-time text-orange-600"></i>
                </div>
                <p className="text-2xl font-bold mb-1">{orderStats.pending}</p>
                <p className="text-gray-600 text-sm">Pending</p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="bx bx-check-circle text-green-600"></i>
                </div>
                <p className="text-2xl font-bold mb-1">{orderStats.confirmed}</p>
                <p className="text-gray-600 text-sm">Confirmed</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="bx bx-cog text-blue-600"></i>
                </div>
                <p className="text-2xl font-bold mb-1">{orderStats.processing}</p>
                <p className="text-gray-600 text-sm">Processing</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="bx bx-package text-purple-600"></i>
                </div>
                <p className="text-2xl font-bold mb-1">{orderStats.readyToShip}</p>
                <p className="text-gray-600 text-sm">Ready to ship</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="bx bx-x-circle text-red-600"></i>
                </div>
                <p className="text-2xl font-bold mb-1">{orderStats.cancelled}</p>
                <p className="text-gray-600 text-sm">Cancelled</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="bx bx-check-double text-green-600"></i>
                </div>
                <p className="text-2xl font-bold mb-1">{orderStats.delivered}</p>
                <p className="text-gray-600 text-sm">Delivered</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center mb-3">
                  <i className="bx bx-revision text-yellow-600"></i>
                </div>
                <p className="text-2xl font-bold mb-1">{orderStats.returned}</p>
                <p className="text-gray-600 text-sm">Returned</p>
              </div>
            </div>
          </div>

          {/* Sales Analysis */}
          <div className="bg-white rounded-xl p-6">
            <h2 className="text-lg font-medium mb-6">Sales analysis</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="bx bx-shopping-bag text-gray-400"></i>
                    <span className="text-gray-600">Orders</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    salesStats.orders.change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {salesStats.orders.change > 0 ? '+' : ''}{salesStats.orders.change}%
                  </span>
                </div>
                <p className="text-2xl font-bold">{salesStats.orders.value}</p>
                <p className="text-sm text-gray-500">This month</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <i className="bx bx-show text-gray-400"></i>
                    <span className="text-gray-600">Views</span>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    salesStats.views.change > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {salesStats.views.change > 0 ? '+' : ''}{salesStats.views.change}%
                  </span>
                </div>
                <p className="text-2xl font-bold">{salesStats.views.value}</p>
                <p className="text-sm text-gray-500">This month</p>
              </div>

              <div className="lg:col-span-2">
                <div className="h-48 bg-gray-50 rounded-xl p-4">
                  <Line data={salesData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}