import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Settings, DollarSign, Package, List, Calculator, Bell, Image, Tag, MessageSquarePlus, Menu, X, Award, TrendingUp, CalendarArrowUp } from 'lucide-react';
import logo from '/src/assets/logi.png';

export default function AdminSidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => {
      setIsSidebarOpen(window.innerWidth >= 768);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const menuItems = [
    { path: '/admin/dashboard', icon: Home, label: 'Dashboard' },
    { path: '/admin/users', icon: Users, label: 'Manage Users' },
    { path: '/admin/sellers-wallet', icon: Settings, label: 'Account Management' },
    { path: '/admin/sellers/payouts', icon: DollarSign, label: 'Approve Payments' },
    { path: '/admin/transactions', icon: CalendarArrowUp, label: 'Transactions' },
    { path: '/admin/products', icon: Package, label: 'Manage Products' },
    { path: '/admin/edit/categories', icon: List, label: 'Categories' },
    { path: '/admin/edit/fees', icon: Calculator, label: 'Edit Fees' },
    { path: '/admin/notifications', icon: Bell, label: 'Notifications' },
    { path: '/admin/edit/banners', icon: Image, label: 'Edit Banners & Others' },
    { path: '/admin/edit/daily-deals', icon: Tag, label: 'Daily Deals' },
    { path: '/admin/manager', icon: MessageSquarePlus, label: 'Admin Manager' },
    { path: '/admin/pro-sellers-requests', icon: Award, label: 'Admin Pro Sellers' },
    { path: '/admin/bumped-products', icon: TrendingUp, label: 'Admin Bumped Products' },
  ];

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg focus:outline-none hover:bg-blue-700 transition-colors"
        aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
      >
        {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      <div
        className={`fixed top-0 left-0 w-64 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl transform transition-transform duration-300 ease-in-out z-40
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:block max-h-[calc(100vh)] overflow-y-auto overflow-x-auto`}
      >
        <Link to="/" onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}>
          <div className="p-4 border-b border-gray-700 flex-col items-center gap-2">
            <img src={logo} alt="Logo" className="h-10" />
            <span className="text-sm font-bold">Admin Panel</span>
          </div>
        </Link>
        <nav className="mt-4 px-2">
          <ul className="space-y-1 whitespace-nowrap">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                  className={`flex items-center p-3 rounded-lg transition-all duration-200 ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 mr-3" />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}