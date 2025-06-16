import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
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
    { path: '/admin/dashboard', icon: 'bx-home-alt-2', label: 'Dashboard' },
    { path: '/admin/users', icon: 'bx-user', label: 'Manage Users' },
    { path: '/admin/sellers/payouts', icon: 'bx-money-withdraw', label: 'Approve Payments' },
    { path: '/admin/products', icon: 'bx-package', label: 'Manage Products' },
    { path: '/admin/edit/categories', icon: 'bx-category', label: 'Categories' },
    { path: '/admin/edit/fees', icon: 'bx-calculator', label: 'Edit Fees' },
    { path: '/admin/notifications', icon: 'bx-notification', label: 'Notifications' },
    { path: '/admin/edit/banners', icon: 'bx-image', label: 'Edit Banners & Others' },
    { path: '/admin/edit/daily-deals', icon: 'bx-purchase-tag', label: 'Daily Deals' },
  ];

  return (
    <>
      {/* Toggle Button for Mobile */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-blue-600 text-white rounded-lg focus:outline-none hover:bg-blue-700 transition-colors"
        aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
      >
        <i className={`bx ${isSidebarOpen ? 'bx-x' : 'bx-menu'} text-2xl`}></i>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 w-64 h-full bg-gradient-to-b from-gray-900 to-gray-800 text-white shadow-xl transform transition-transform duration-300 ease-in-out z-40
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:block`}
      >
        <Link to="/" onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}>
          <div className="p-4 border-b border-gray-700 flex-col items-center gap-2">
            <img src={logo} alt="Logo" className="h-10" />
            <span className="text-sm font-bold">Admin Panel</span>
          </div>
        </Link>
        <nav className="mt-4 px-2">
          <ul className="space-y-1">
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
                  <i className={`bx ${item.icon} text-xl mr-3`}></i>
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Overlay for Mobile */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}