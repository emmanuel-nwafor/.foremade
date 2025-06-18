import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where } from 'firebase/firestore';
import SellerSidebar from './SellerSidebar';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import SecondHeader from '../components/layout/SecondHeader';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ products: 0, approvedProducts: 0, rejectedProducts: 0 });

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
        backgroundColor: ['#3B82F6', '#22C55E', '#EF4444'],
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
        backgroundColor: ['#22C55E', '#EF4444', '#F59E0B'],
        borderColor: ['#16A34A', '#DC2626', '#D97706'],
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
    <div className="flex min-h-screen bg-gray-50">
      <button
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-800 text-white rounded-lg"
        onClick={() => setSidebarOpen(!sidebarOpen)}
        aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
      >
        <i className="bx bx-menu text-xl"></i>
      </button>
      <div className={`${sidebarOpen ? 'block' : 'hidden'} md:block md:w-64 bg-white border-r max-h-[calc(100vh-2rem)] overflow-y-auto`}>
        <SellerSidebar />
      </div>
      <div className="flex-1 p-8">

        <SecondHeader />

        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-8">Seller Dashboard</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-100 p-4 rounded-lg shadow flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Total Products</h2>
                <p className="text-2xl font-bold text-blue-600">{stats.products}</p>
              </div>
              <i className="bx bx-package text-3xl text-blue-500"></i>
            </div>
            <div className="bg-teal-100 p-4 rounded-lg shadow flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Approved Products</h2>
                <p className="text-2xl font-bold text-teal-600">{stats.approvedProducts}</p>
              </div>
              <i className="bx bx-check-circle text-3xl text-teal-500"></i>
            </div>
            <div className="bg-orange-100 p-4 rounded-lg shadow flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Rejected Products</h2>
                <p className="text-2xl font-bold text-orange-600">{stats.rejectedProducts}</p>
              </div>
              <i className="bx bx-x-circle text-3xl text-orange-500"></i>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Analytics</h2>
              <div className="h-64">
                <Bar data={barData} options={chartOptions} />
              </div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Product Status</h2>
              <div className="h-64 flex items-center justify-center">
                <div className="w-1/2">
                  <Doughnut data={doughnutData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}