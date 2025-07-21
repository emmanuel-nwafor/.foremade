import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { toast } from 'react-toastify';
import CustomAlert, { useAlerts } from '../components/common/CustomAlert';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend } from 'chart.js';
import { useAuth } from '../contexts/AuthContext';

ChartJS.register(BarElement, LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

        {/* Key Metrics */}
        {(!analytics.topProducts?.length && !analytics.monthlyTrends?.length) && (
          <div className="text-center text-gray-500 mb-8">No analytics data available yet.</div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalProducts)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-gray-900">{formatNumber(analytics.totalViews)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Sales</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.totalSales)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Average Rating</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.averageRating.toFixed(1)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trends Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
            <div style={{ width: '100%', height: 300 }}>
              <Line data={lineData} options={chartOptions} />
            </div>
          </div>

          {/* Top Products Chart */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
            <div style={{ width: '100%', height: 300 }}>
              <Bar data={barData} options={chartOptions} />
            </div>
          </div>
        </div>

        {/* Top Products Table */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Top Performing Products</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Views</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sales</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {analytics.topProducts.map((product, index) => (
                  <tr key={product.productId}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {product.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(product.views)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatNumber(product.sales)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(product.sales)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProSellerAnalytics; 