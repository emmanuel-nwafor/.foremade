import React, { useState, useEffect } from 'react';
import { db } from '/src/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import AdminSidebar from './AdminSidebar';
import { Bar, Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { toast } from 'react-toastify';
import { auth } from '/src/firebase';

ChartJS.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, admins: 0, products: 0, approvedProducts: 0, rejectedProducts: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pendingProSellers, setPendingProSellers] = useState([]);
  const [approvedProSellers, setApprovedProSellers] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [usersSnap, adminsSnap, productsSnap, approvedSnap, rejectedSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'admins')),
          getDocs(collection(db, 'products')),
          getDocs(query(collection(db, 'products'), where('status', '==', 'approved'))),
          getDocs(query(collection(db, 'products'), where('status', '==', 'rejected'))),
        ]);

        setStats({
          users: usersSnap.size,
          admins: adminsSnap.size,
          products: productsSnap.size,
          approvedProducts: approvedSnap.size,
          rejectedProducts: rejectedSnap.size,
        });
      } catch (err) {
        setError('Failed to fetch dashboard stats: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Fetch pending pro seller requests from backend API
  const fetchPendingProSellers = async () => {
    setPendingLoading(true);
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      const idToken = await user.getIdToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${backendUrl}/api/admin/all-pro-sellers`, {
        headers: { 'Authorization': `Bearer ${idToken}` }
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        setPendingProSellers(data.approvals || []);
      } else {
        toast.error(data.message || 'Failed to fetch pro seller requests');
      }
    } catch (err) {
      toast.error(err.message || 'Failed to fetch pro seller requests');
    } finally {
      setPendingLoading(false);
    }
  };

  useEffect(() => {
    fetchPendingProSellers();
  }, []);

  // Approve or reject a pro seller request
  const handleApproveReject = async (proSellerId, approve) => {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');
      const idToken = await user.getIdToken();
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${backendUrl}/api/admin/approve-pro-seller`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ proSellerId, approve }),
      });
      const data = await res.json();
      if (res.ok && data.status === 'success') {
        toast.success(data.message || (approve ? 'Pro seller approved' : 'Pro seller rejected'));
        fetchPendingProSellers();
      } else {
        toast.error(data.message || 'Action failed');
      }
    } catch (err) {
      toast.error(err.message || 'Action failed');
    }
  };

  // Bar Chart Data
  const barData = {
    labels: ['Users', 'Admins', 'Approved Products', 'Rejected Products'],
    datasets: [
      {
        label: 'Counts',
        data: [stats.users, stats.admins, stats.approvedProducts, stats.rejectedProducts],
        backgroundColor: ['#3B82F6', '#10B981', '#22C55E', '#EF4444'],
        borderColor: ['#2563EB', '#059669', '#16A34A', '#DC2626'],
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
      <div className="flex min-h-screen bg-white dark:bg-gray-900">
        <AdminSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6">
          <div className="container mx-auto px-4 py-8">
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
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-white dark:bg-gray-900">
        <AdminSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6">
          <div className="container mx-auto px-4 py-8">
            <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg dark:bg-red-900 dark:border-red-700">
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 dark:text-white mb-6">Admin Dashboard</h1>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-100 p-4 rounded-lg shadow flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Total Users</h2>
                <p className="text-2xl font-bold text-blue-600">{stats.users}</p>
              </div>
              <i className="bx bx-user text-3xl text-blue-500"></i>
            </div>
            <div className="bg-green-100 p-4 rounded-lg shadow flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Total Admins</h2>
                <p className="text-2xl font-bold text-green-600">{stats.admins}</p>
              </div>
              <i className="bx bx-shield text-3xl text-green-500"></i>
            </div>
            <div className="bg-red-100 p-4 rounded-lg shadow flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-700">Total Products</h2>
                <p className="text-2xl font-bold text-red-600">{stats.products}</p>
              </div>
              <i className="bx bx-package text-3xl text-red-500"></i>
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
          {/* Pro Seller Requests Section (API) */}
          <div className="mb-10">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white mb-4">Pro Seller Requests</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 overflow-x-auto">
              {pendingLoading ? (
                <div className="text-gray-500">Loading...</div>
              ) : pendingProSellers.length === 0 ? (
                <div className="text-gray-500">No pending requests.</div>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr>
                      <th className="px-2 py-1 text-left">ProSeller ID</th>
                      <th className="px-2 py-1 text-left">User ID</th>
                      <th className="px-2 py-1 text-left">Status</th>
                      <th className="px-2 py-1 text-left">Created</th>
                      <th className="px-2 py-1 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingProSellers.map(req => (
                      <tr key={req.proSellerId} className="border-b">
                        <td className="px-2 py-1">{req.proSellerId}</td>
                        <td className="px-2 py-1">{req.userId}</td>
                        <td className="px-2 py-1">{req.status}</td>
                        <td className="px-2 py-1">{req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '-'}</td>
                        <td className="px-2 py-1 space-x-2">
                          <button onClick={() => handleApproveReject(req.proSellerId, true)} className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700">Approve</button>
                          <button onClick={() => handleApproveReject(req.proSellerId, false)} className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700">Reject</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Analytics Overview</h2>
              <div className="h-64">
                <Bar data={barData} options={chartOptions} />
              </div>
            </div>
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">Product Status</h2>
              <div className="h-64 flex items-center justify-center">
                <div className="w-1/2">
                  <Doughnut data={doughnutData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}