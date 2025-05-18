import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vendorAuth } from '../firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import logo from '../assets/logi.png';

export default function SellerLogin() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await signInWithEmailAndPassword(vendorAuth, formData.email, formData.password);
      navigate('/overview');
    } catch (err) {
      console.error(err);
      setError('Invalid email or password. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full h-screen flex">
        <div
          className="hidden md:block md:w-1/2 h-full bg-cover bg-center"
          style={{ backgroundImage: "url('https://i.pinimg.com/736x/9c/d4/ee/9cd4ee1cd2d64ac6b70baba15564f504.jpg')" }}
        >
          <div className="w-full h-full bg-black bg-opacity-40 flex flex-col justify-center items-center text-white p-8">
            <h1 className="text-3xl font-bold mb-4 flex items-center">
              <img src={logo} alt="Formade logo" className="h-20 ml-2" />
            </h1>
            <p className="text-lg text-center">Welcome Back Vendor!</p>
          </div>
        </div>
        <div className="w-full md:w-1/2 h-full p-9 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Vendor Login</h2>
          <p className="text-gray-600 mb-6">
            Don’t have a vendor account?{' '}
            <Link to="/seller/register" className="text-blue-600 hover:underline">
              Sign Up
            </Link>
          </p>

          {error && <p className="text-red-600 text-[10px] mb-4">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Email"
                autoComplete="off"
                required
              />
            </div>
            <div className="relative">
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Password"
                autoComplete="off"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-600 text-white p-3 rounded-lg hover:bg-blue-800 transition duration-200"
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
            <p className="text-gray-600 text-center mt-4">
              <Link to="/seller/forgot-password" className="text-blue-600 hover:underline">
                Forgot Password?
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}