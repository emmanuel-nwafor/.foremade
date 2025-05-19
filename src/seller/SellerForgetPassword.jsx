import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { vendorAuth } from '../firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import logo from '../assets/logi.png';

export default function SellerForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setEmail(e.target.value);
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email.');
      setLoading(false);
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      await sendPasswordResetEmail(vendorAuth, email);
      setSuccess('Password reset email sent! Check your inbox (and spam/junk folder).');
      setEmail('');
    } catch (err) {
      console.error(err);
      if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up.');
      } else {
        setError('Failed to send reset email. Please try again later.');
      }
    } finally {
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
            <p className="text-lg text-center">Reset Your Password</p>
          </div>
        </div>
        <div className="w-full md:w-1/2 h-full p-9 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Forgot Password</h2>
          <p className="text-gray-600 mb-6">
            Remember your password?{' '}
            <Link to="/seller/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>

          {error && <p className="text-red-600 text-[10px] mb-4">{error}</p>}
          {success && <p className="text-green-600 text-[10px] mb-4">{success}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="email"
                name="email"
                value={email}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${
                  error ? 'border-red-500' : success ? 'border-green-500' : 'border-gray-300 focus:ring-2 focus:ring-blue-500'
                }`}
                autoComplete="off"
                required
              />
              <label
                htmlFor="email"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-1 ${
                  email ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                }`}
              >
                Email <span className="text-red-500">*</span>
              </label>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-600 text-white p-3 rounded-lg hover:bg-blue-800 transition duration-200"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
            <p className="text-gray-600 text-center mt-4">
              Don’t have an account?{' '}
              <Link to="/seller/register" className="text-blue-600 hover:underline">
                Sign Up
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}