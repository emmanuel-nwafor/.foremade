import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import SellerSidebar from './SellerSidebar';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Package, CheckCircle2, XCircle, BarChart2, PieChart, Plus, ShoppingBag, Wallet, Info } from 'lucide-react';
import SecondHeader from '../components/layout/SecondHeader';
import { useAuth } from '../contexts/AuthContext';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ products: 0, approvedProducts: 0, rejectedProducts: 0 });
  // Add state for confetti/sparkle animation and animated stats
  const [displayStats, setDisplayStats] = useState({ products: 0, approvedProducts: 0, rejectedProducts: 0 });
  const [sellerName, setSellerName] = useState('');
  const { userProfile } = useAuth();

  // Animate stats count-up
  useEffect(() => {
    let frame;
    let start = { ...displayStats };
    let end = { ...stats };
    let duration = 800;
    let startTime = null;
    function animateStats(ts) {
      if (!startTime) startTime = ts;
      let progress = Math.min((ts - startTime) / duration, 1);
      setDisplayStats({
        products: Math.floor(start.products + (end.products - start.products) * progress),
        approvedProducts: Math.floor(start.approvedProducts + (end.approvedProducts - start.approvedProducts) * progress),
        rejectedProducts: Math.floor(start.rejectedProducts + (end.rejectedProducts - start.rejectedProducts) * progress),
      });
      if (progress < 1) {
        frame = requestAnimationFrame(animateStats);
      }
    }
    frame = requestAnimationFrame(animateStats);
    return () => cancelAnimationFrame(frame);
  }, [stats]);

  // Fetch seller name for personalization
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setSellerName(user.displayName || 'Seller');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    console.log('Seller Dashboard mounted');
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      console.log('Auth state changed:', user ? 'User logged in' : 'No user');
      if (!user) {
        setError('Please log in to view your dashboard.');
        setLoading(false);
        return;
      }

      try {
        const sellerId = user.uid;
        const [productsSnap, approvedSnap, rejectedSnap] = await Promise.all([
          getDocs(query(collection(db, 'products'), where('sellerId', '==', sellerId))),
          getDocs(query(collection(db, 'products'), where('sellerId', '==', sellerId), where('status', '==', 'approved'))),
          getDocs(query(collection(db, 'products'), where('sellerId', '==', sellerId), where('status', '==', 'rejected'))),
        ]);

        setStats({
          products: productsSnap.size,
          approvedProducts: approvedSnap.size,
          rejectedProducts: rejectedSnap.size,
        });
      } catch (err) {
        console.error('Error fetching seller stats:', err);
        setError('Failed to load dashboard stats: ' + err.message);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      console.log('Seller Dashboard unmounting');
      unsubscribeAuth();
    };
  }, []);

  // Bar Chart Data
  const barData = {
    labels: ['Total Products', 'Approved Products', 'Rejected Products'],
    datasets: [
      {
        label: 'Counts',
        data: [stats.products, stats.approvedProducts, stats.rejectedProducts],
        backgroundColor: ['#2563EB', '#16A34A', '#DC2626'],
        borderColor: ['#2563EB', '#16A34A', '#DC2626'],
        borderWidth: 1,
      },
    ],
  };

  // Doughnut Chart Data
  const doughnutData = {
    labels: ['Approved Products', 'Rejected Products', 'Pending Products'],
    datasets: [
      {
        label: 'Product Status',
        data: [
          stats.approvedProducts,
          stats.rejectedProducts,
          stats.products - (stats.approvedProducts + stats.rejectedProducts),
        ],
        backgroundColor: ['#2563EB', '#16A34A', '#DC2626'],
        borderColor: ['#2563EB', '#16A34A', '#DC2626'],
        borderWidth: 1,
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

  if (loading) {
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-gray-200 p-4 rounded-lg h-24"></div>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="bg-gray-200 h-64 rounded-lg"></div>
              <div className="bg-gray-200 h-64 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
          <p className="text-red-700">{error}</p>
          <Link to="/login" className="text-blue-600 hover:underline mt-2 inline-block">
            Return to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen bg-white overflow-x-hidden">     
      <div className={`${sidebarOpen ? 'block' : ''} md:block md:w-64 bg-white border-r max-h-[calc(100vh-2rem)] overflow-y-auto`}>
        <SellerSidebar />
      </div>
      <div className="flex-1 p-3 sm:p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Welcome Section */}
          <div className="relative flex flex-col items-center md:flex-row md:items-center md:justify-between bg-white border border-blue-100 rounded-2xl shadow-sm p-4 sm:p-6 md:p-8 mb-8 md:mb-10">
            <div className="flex flex-col items-center md:items-start text-center md:text-left w-full md:w-auto">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-blue-900 mb-1 tracking-tight">Welcome back, <span className="text-blue-600">{sellerName}</span>!</h1>
              <p className="text-gray-500 text-sm sm:text-base">Here’s a snapshot of your store’s performance.</p>
            </div>
            <div className="mt-4 md:mt-0 flex-shrink-0">
              <img src="https://i.pinimg.com/originals/97/16/5e/97165e191052892894cb886b4a8c0971.gif" alt="Seller Avatar" className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full shadow border-2 border-blue-100 bg-white object-contain" />
            </div>
          </div>
          {/* Quick Actions */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-3 sm:gap-4 mb-8 md:mb-10 items-stretch">
            <Link to="/products-upload" className="flex-1 min-w-[140px] flex items-center gap-2 px-4 py-3 rounded-lg bg-[#112d4e] text-white font-semibold shadow-sm hover:bg-[#112d4e] focus:outline-blue-400 focus:ring-2 focus:ring-blue-300 transition" title="Add Product">
              <Plus className="w-5 h-5" /> Add Product
            </Link>
            <Link to="/sellers/orders" className="flex-1 min-w-[140px] flex items-center gap-2 px-4 py-3 rounded-lg bg-[#112d4e] text-white font-semibold shadow-sm hover:bg-[#112d4e] focus:outline-green-400 focus:ring-2 focus:ring-green-300 transition" title="View Orders">
              <ShoppingBag className="w-5 h-5" /> View Orders
            </Link>
            <Link to="/smile" className="flex-1 min-w-[140px] flex items-center gap-2 px-4 py-3 rounded-lg bg-[#112d4e] text-white font-semibold shadow-sm hover:bg-[#112d4e] focus:outline-gray-400 focus:ring-2 focus:ring-gray-300 transition" title="Withdraw Funds">
              <Wallet className="w-5 h-5" /> Withdraw Funds
            </Link>
            {userProfile && userProfile.isProSeller && (
              <div className="flex flex-1 min-w-[140px] gap-2">
                <Link to="/product-bump" className="flex-1 flex items-center gap-2 px-4 py-3 rounded-lg bg-[#112d4e] text-white font-semibold shadow-sm hover:bg-[#112d4e] focus:outline-purple-400 focus:ring-2 focus:ring-purple-300 transition" title="Product Bump">
                  <Package className="w-5 h-5" /> Product Bump
                </Link>
                <Link to="/product-bump-info" className="flex items-center px-3 py-3 rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 transition" title="What is Product Bump?">
                  <Info className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>
          {/* Stats Cards - Responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white border border-blue-100 p-5 rounded-xl shadow flex items-center justify-between transition-transform hover:scale-105 focus-within:scale-105 cursor-pointer group relative overflow-hidden" tabIndex={0} aria-label="Total Products" aria-live="polite">
              <div>
                <h2 className="text-sm font-semibold text-blue-700 mb-1">Total Products</h2>
                <p className="text-2xl font-extrabold text-blue-900 animate-countup">{displayStats.products}</p>
              </div>
              <Package className="w-8 h-8 text-blue-500 group-hover:scale-110 group-focus:scale-110 transition-transform z-10" />
            </div>
            <div className="bg-white border border-green-100 p-5 rounded-xl shadow flex items-center justify-between transition-transform hover:scale-105 focus-within:scale-105 cursor-pointer group relative overflow-hidden" tabIndex={0} aria-label="Approved Products" aria-live="polite">
              <div>
                <h2 className="text-sm font-semibold text-green-700 mb-1">Approved Products</h2>
                <p className="text-2xl font-extrabold text-green-900 animate-countup">{displayStats.approvedProducts}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500 group-hover:scale-110 group-focus:scale-110 transition-transform z-10" />
            </div>
            <div className="bg-white border border-orange-100 p-5 rounded-xl shadow flex items-center justify-between transition-transform hover:scale-105 focus-within:scale-105 cursor-pointer group relative overflow-hidden" tabIndex={0} aria-label="Rejected Products" aria-live="polite">
              <div>
                <h2 className="text-sm font-semibold text-orange-700 mb-1">Rejected Products</h2>
                <p className="text-2xl font-extrabold text-orange-900 animate-countup">{displayStats.rejectedProducts}</p>
              </div>
              <XCircle className="w-8 h-8 text-orange-500 group-hover:scale-110 group-focus:scale-110 transition-transform z-10" />
            </div>
          </div>
          {/* Charts - stack vertically on mobile/tablet */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-blue-100 p-5 rounded-xl shadow">
              <div className="flex items-center gap-2 mb-3">
                <BarChart2 className="w-5 h-5 text-blue-500" />
                <h2 className="text-base font-bold text-blue-900">Product Analytics</h2>
              </div>
              <div className="h-56 sm:h-64">
                <Bar data={barData} options={chartOptions} />
              </div>
            </div>
            <div className="bg-white border border-purple-100 p-5 rounded-xl shadow">
              <div className="flex items-center gap-2 mb-3">
                <PieChart className="w-5 h-5 text-purple-500" />
                <h2 className="text-base font-bold text-purple-900">Product Status</h2>
              </div>
              <div className="h-56 sm:h-64 flex items-center justify-center">
                <div className="w-3/4 sm:w-1/2">
                  <Doughnut data={doughnutData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
          {/* Analytics Section */}
          <div className="mt-8">
            <div className="flex justify-end mt-4">
              <Link to="/pro-seller-analytics" className="inline-block px-5 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold shadow">
                See More Analytics
              </Link>
            </div>
          </div>
          <SecondHeader />
        </div>
      </div>
    </div>
  );
}