import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import logo from '/src/assets/logi.png';

export default function AdminSidebar() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 768);

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

  return (
    <>
      {/* Toggle Button for Mobile */}
      <button
        onClick={toggleSidebar}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-800 text-white rounded-lg focus:outline-none"
      >
        <i className={`bx ${isSidebarOpen ? 'bx-x' : 'bx-menu'} text-2xl`}></i>
      </button>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 w-64 h-full bg-gray-800 text-white shadow-lg transform transition-transform duration-300 ease-in-out z-40
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:block`}
      >
        <Link to="/">
          <div className="p-4 border-b border-gray-700">
            <img src={logo} alt="Logo" className="h-10" />
          </div>
        </Link>
        <nav className="mt-4">
          <ul className="space-y-2">
            <li>
              <Link
                to="/admin/dashboard"
                onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                className="flex items-center p-3 hover:bg-gray-700 transition-colors"
              >
                <i className="bx bx-home-alt text-xl mr-3"></i>
                <span className="text-sm font-medium">Dashboard</span>
              </Link>
            </li>
            <li>
              <Link
                to="/admin/users"
                onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                className="flex items-center p-3 hover:bg-gray-700 transition-colors"
              >
                <i className="bx bx-user text-xl mr-3"></i>
                <span className="text-sm font-medium">Manage Users</span>
              </Link>
            </li>
            <li>
              <Link
                to="/admin/admins"
                onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                className="flex items-center p-3 hover:bg-gray-700 transition-colors"
              >
                <i className="bx bx-shield-alt-2 text-xl mr-3"></i>
                <span className="text-sm font-medium">Manage Admins</span>
              </Link>
            </li>
            <li>
              <Link
                to="/admin/vendors"
                onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                className="flex items-center p-3 hover:bg-gray-700 transition-colors"
              >
                <i className="bx bx-store text-xl mr-3"></i>
                <span className="text-sm font-medium">Manage Vendors</span>
              </Link>
            </li>
            <li>
              <Link
                to="/admin/products"
                onClick={() => window.innerWidth < 768 && setIsSidebarOpen(false)}
                className="flex items-center p-3 hover:bg-gray-700 transition-colors"
              >
                <i className="bx bx-package text-xl mr-3"></i>
                <span className="text-sm font-medium">Manage Products</span>
              </Link>
            </li>
            <li>
              <button
                onClick={() => {
                  if (window.innerWidth < 768) setIsSidebarOpen(false);
                }}
                className="flex items-center w-full p-3 hover:bg-gray-700 transition-colors text-left"
              >
                <i className="bx bx-log-out text-xl mr-3"></i>
                <span className="text-sm font-medium">Sign Out</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>

      {/* Overlay for Mobile (when sidebar is open) */}
      {isSidebarOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={toggleSidebar}
        ></div>
      )}
    </>
  );
}