import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';
import CustomAlert, { useAlerts } from '../components/common/CustomAlert';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { useAuth } from '../contexts/AuthContext';
import SellerSidebar from './SellerSidebar';

ChartJS.register(BarElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const cardStyle = {
  background: "#fff",
  borderRadius: 16,
  boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
  maxWidth: 900,
  width: "100%",
  padding: 32,
  margin: "0 16px",
};

const ProSellerAnalytics = () => {
  const [analytics, setAnalytics] = useState({
    totalProducts: 0,
    activeProducts: 0,
    totalViews: 0,
    totalSales: 0,
    averageRating: 0,
    topProducts: [],
    monthlyTrends: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [period, setPeriod] = useState('30d');
  const { alerts, addAlert, removeAlert } = useAlerts();
  const { userProfile } = useAuth();

  const periods = [
    { value: '7d', label: 'Last 7 Days' },
    { value: '30d', label: 'Last 30 Days' },
    { value: '90d', label: 'Last 90 Days' },
    { value: '1y', label: 'Last Year' }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (userProfile && !userProfile.isProSeller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-orange-600">Pro Seller Feature</h2>
          <p className="mb-4 text-gray-700">Product analytics are only available to Pro Sellers. Upgrade now to track your performance and sales metrics!</p>
          <a href="/pro-seller-guide-full" className="inline-block px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 font-semibold">Upgrade to Pro Seller</a>
          <div className="mt-6">
            <a href="/sell" className="inline-block px-5 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Return to Dashboard</a>
          </div>
        </div>
      </div>
    );
  }

  useEffect(() => {
    let unsubscribe;
    setLoading(true);
    setError('');
    unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setError('Please log in to view analytics.');
        setLoading(false);
        return;
      }
      try {
        const sellerId = user.uid;
        const productsSnap = await getDocs(query(collection(db, 'products'), where('sellerId', '==', sellerId)));
        const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        // Calculate analytics
        const totalProducts = products.length;
        const activeProducts = products.filter(p => p.status === 'approved').length;
        const totalViews = products.reduce((sum, p) => sum + (p.views || 0), 0);
        const totalSales = products.reduce((sum, p) => sum + (p.sales || 0), 0);
        const averageRating = products.length ? (products.reduce((sum, p) => sum + (p.rating || 0), 0) / products.length) : 0;
        // Top products by sales
        const topProducts = [...products].sort((a, b) => (b.sales || 0) - (a.sales || 0)).slice(0, 5).map(p => ({
          name: p.name,
          sales: p.sales || 0,
          views: p.views || 0,
        }));
        // Monthly trends (dummy: group by createdAt month)
        const monthlyMap = {};
        products.forEach(p => {
          if (p.createdAt) {
            const date = new Date(p.createdAt);
            const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            if (!monthlyMap[month]) monthlyMap[month] = { month, views: 0, sales: 0 };
            monthlyMap[month].views += p.views || 0;
            monthlyMap[month].sales += p.sales || 0;
          }
        });
        const monthlyTrends = Object.values(monthlyMap).sort((a, b) => a.month.localeCompare(b.month));
        setAnalytics({
          totalProducts,
          activeProducts,
          totalViews,
          totalSales,
          averageRating,
          topProducts,
          monthlyTrends,
        });
      } catch (err) {
        setError('Failed to load analytics: ' + err.message);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe && unsubscribe();
  }, [period]);

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-NG').format(num);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-red-600">Error</h2>
          <p className="mb-4 text-gray-700">{error}</p>
          <a href="/sell" className="inline-block px-5 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Return to Dashboard</a>
        </div>
      </div>
    );
  }

  // Prepare chart data for Bar and Line
  const barData = {
    labels: analytics.topProducts.map(p => p.name),
    datasets: [
      {
        label: 'Sales',
        data: analytics.topProducts.map(p => p.sales),
        backgroundColor: '#8884d8',
      },
    ],
  };

  const lineData = {
    labels: analytics.monthlyTrends.map(t => t.month),
    datasets: [
      {
        label: 'Views',
        data: analytics.monthlyTrends.map(t => t.views),
        borderColor: '#8884d8',
        backgroundColor: 'rgba(136,132,216,0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Sales',
        data: analytics.monthlyTrends.map(t => t.sales),
        borderColor: '#82ca9d',
        backgroundColor: 'rgba(130,202,157,0.2)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      tooltip: { enabled: true },
    },
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="hidden md:block md:w-64 bg-white border-r max-h-screen overflow-y-auto">
        <SellerSidebar />
      </div>
      <div className="flex-1 flex justify-center items-start py-10 bg-gray-50">
        <div style={cardStyle}>
          <div className="mb-6 flex justify-between items-center">
            <a href="/sell" className="inline-block px-5 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Return to Dashboard</a>
          </div>
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Pro Seller Analytics</h1>
            <p className="text-gray-600 mt-2">Track your performance and sales metrics</p>
            {/* Period Selector */}
            <div className="mt-4">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {periods.map(p => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>
          </div>
          {/* Chart Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Top Products (Sales)</h2>
              <Bar data={barData} options={chartOptions} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Monthly Trends</h2>
              <Line data={lineData} options={chartOptions} />
            </div>
          </div>
          {/* Analytics Summary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-base font-bold text-blue-900 mb-2">Summary</h3>
              <ul className="text-gray-700 text-sm space-y-1">
                <li>Total Products: <span className="font-semibold">{analytics.totalProducts}</span></li>
                <li>Active Products: <span className="font-semibold">{analytics.activeProducts}</span></li>
                <li>Total Views: <span className="font-semibold">{formatNumber(analytics.totalViews)}</span></li>
                <li>Total Sales: <span className="font-semibold">{formatNumber(analytics.totalSales)}</span></li>
                <li>Average Rating: <span className="font-semibold">{analytics.averageRating.toFixed(2)}</span></li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-base font-bold text-green-900 mb-2">Top Products</h3>
              <ul className="text-gray-700 text-sm space-y-1">
                {analytics.topProducts.map((p, i) => (
                  <li key={i}>{p.name} — <span className="font-semibold">{p.sales} sales</span>, <span className="text-blue-700">{p.views} views</span></li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProSellerAnalytics; 