import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';
import logo from '../assets/logi.png';

const getFriendlyErrorMessage = (error) => {
  switch (error.message) {
    case 'Network Error':
      return 'Check your network connection and try again.';
    case 'No user found with this email':
      return 'No user found with this email.';
    case 'Valid email is required':
      return 'Please enter a valid email address.';
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
};

export default function ForgetPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Validate email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setSuccessMessage('');
    setLoading(true);

    if (!email) {
      setEmailError('Email is required.');
      setLoading(false);
      return;
    }

    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/request-password-reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset link');
      }

      setSuccessMessage(`Password reset email sent to ${email}. Please check your inbox.`);
      setEmail('');
      setTimeout(() => {
        setLoading(false);
        navigate('/login');
      }, 7000);
    } catch (err) {
      console.error('Error sending password reset email:', err);
      setEmailError(getFriendlyErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full h-screen flex">
        <div
          className="hidden md:block md:w-1/2 h-full bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/5625115/pexels-photo-5625115.jpeg?auto=compress&cs=tinysrgb&w=600')" }}
        >
          <div className="w-full h-full bg-black bg-opacity-40 dark:bg-black/50 flex flex-col justify-center items-center text-white p-8">
            <h1 className="text-3xl font-bold flex-col items-center">
              <img src={logo} alt="Formade logo" className="h-20" />
            </h1>
            <p className="text-lg">Recover Your Password.</p>
          </div>
        </div>

        <div className="w-full md:w-1/2 h-full p-9 flex flex-col justify-center bg-white dark:bg-gray-800">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Forgot Password
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
              Sign In
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                }}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${
                  emailError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300 dark:border-gray-600'
                }`}
                autoComplete="email"
                required
              />
              <label
                htmlFor="email"
                className={`absolute left-3 top-3 text-gray-500 dark:text-gray-400 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white dark:peer-focus:bg-gray-800 peer-focus:px-1 ${
                  email ? '-translate-y-6 scale-75 text-blue-500 bg-white dark:bg-gray-800 px-1' : ''
                }`}
              >
                Email
              </label>
              <span className="absolute right-3 top-3 text-blue-500 dark:text-blue-400">
                <i className="bx bx-envelope text-xl"></i>
              </span>
              {emailError && <p className="text-red-600 text-[10px] mt-1">{emailError}</p>}
            </div>

            {successMessage && <p className="text-green-600 text-[10px] mb-4">{successMessage}</p>}

            <button
              type="submit"
              className="w-full bg-slate-600 text-white p-3 rounded-lg hover:bg-blue-800 transition duration-200 dark:bg-slate-700 dark:hover:bg-blue-900"
              disabled={loading}
            >
              {loading ? (
                'Sending...'
              ) : (
                <>
                  Send Reset Link{' '}
                  <i className="bx bx-send text-blue-500 text-xl inline-block ml-2"></i>
                </>
              )}
            </button>
          </form>

          <p className="text-gray-600 dark:text-gray-400 mt-5">
            Don’t have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300">
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}