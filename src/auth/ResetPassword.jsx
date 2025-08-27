import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Link } from 'react-router-dom';
import logo from '../assets/logi.png';

// Dynamic base URL for API calls
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const getFriendlyErrorMessage = (error) => {
  switch (error.message) {
    case 'Network Error':
      return 'Check your network connection and try again.';
    case 'Invalid or used token':
      return 'Invalid or expired reset link. Please request a new one.';
    case 'No user found with this email':
      return 'No user found with this email.';
    case 'New password must be at least 8 characters':
      return 'New password must be at least 8 characters long.';
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
};

export default function ResetPassword() {
  const navigate = useNavigate();
  const location = useLocation();
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);

  // Parse token and email from URL
  const query = new URLSearchParams(location.search);
  const token = query.get('token');
  const email = query.get('email');

  // Validate token and email on mount
  useEffect(() => {
    if (!token || !email) {
      setError('Invalid or missing reset link. Please request a new one.');
    }
  }, [token, email]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    if (!newPassword) {
      setError('New password is required.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, token, newPassword }),
      });

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        console.error('JSON parse error:', jsonError);
        throw new Error('Server returned an invalid response');
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      setSuccessMessage('Password reset successfully! Redirecting to login...');
      setNewPassword('');
      setTimeout(() => {
        setLoading(false);
        navigate('/login');
      }, 3000);
    } catch (err) {
      console.error('Error resetting password:', err);
      setError(getFriendlyErrorMessage(err));
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="w-full h-screen flex">
        <div
          className="hidden md:block md:w-1/2 h-full bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/5625115/pexels-photo-5625115.jpeg?auto=compress&cs=tinysrgb&w=600')" }}
        >
          <div className="w-full h-full bg-black bg-opacity-40 dark:bg-black/50 flex flex-col justify-center items-center text-white p-8">
            <h1 className="text-3xl font-bold flex-col items-center">
              <img
                src={logo}
                alt="Formade logo"
                className="h-20"
                onError={(e) => {
                  e.target.src = '/fallback-logo.png';
                }}
              />
            </h1>
            <p className="text-lg">Reset Your Password</p>
          </div>
        </div>

        <div className="w-full md:w-1/2 h-full p-6 sm:p-9 flex flex-col justify-center bg-white dark:bg-gray-800">
          <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-2">
            Reset Password
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Back to login?{' '}
            <Link
              to="/login"
              className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
              aria-label="Sign in to your account"
            >
              Sign In
            </Link>
          </p>

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="relative">
              <input
                type="password"
                id="new-password"
                value={newPassword}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  setError('');
                  setSuccessMessage('');
                }}
                className={`w-full p-3 border rounded-lg transition-all duration-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 ${
                  error
                    ? 'border-red-500'
                    : successMessage
                    ? 'border-green-500'
                    : 'border-gray-300 dark:border-gray-600'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100`}
                autoComplete="new-password"
                required
                disabled={loading}
                aria-describedby={error ? 'password-error' : undefined}
                aria-invalid={error ? 'true' : 'false'}
              />
              <label
                htmlFor="new-password"
                className={`absolute left-3 top-3 text-gray-500 dark:text-gray-400 transition-all duration-300 transform origin-left pointer-events-none ${
                  newPassword
                    ? '-translate-y-6 scale-75 text-blue-500 bg-white dark:bg-gray-800 px-1'
                    : 'peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white dark:peer-focus:bg-gray-800 peer-focus:px-1'
                }`}
              >
                New Password
              </label>
              <span className="absolute right-3 top-3 text-blue-500 dark:text-blue-400">
                <i className="bx bx-lock text-xl"></i>
              </span>
              {error && (
                <p id="password-error" className="text-red-600 text-xs mt-1">
                  {error}
                </p>
              )}
            </div>

            {successMessage && (
              <div className="relative bg-green-100 text-green-700 p-3 rounded-lg flex items-center justify-between">
                <p className="text-sm">{successMessage}</p>
                <button
                  onClick={() => navigate('/login')}
                  className="ml-2 text-green-700 hover:text-green-900 focus:outline-none focus:ring-2 focus:ring-green-500"
                  aria-label="Dismiss success message and go to login"
                >
                  <i className="bx bx-check-circle text-xl"></i>
                </button>
              </div>
            )}

            <button
              type="submit"
              className={`w-full p-3 rounded-lg font-semibold transition duration-200 flex items-center justify-center space-x-2 ${
                loading || !token || !email
                  ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed'
                  : 'bg-slate-600 hover:bg-blue-800 dark:bg-slate-700 dark:hover:bg-blue-900 text-white'
              }`}
              disabled={loading || !token || !email}
              aria-label="Reset password"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z"
                    ></path>
                  </svg>
                  <span>Resetting...</span>
                </>
              ) : (
                <>
                  <span>Reset Password</span>
                  <i className="bx bx-lock text-xl"></i>
                </>
              )}
            </button>
          </form>

          <p className="text-gray-600 dark:text-gray-400 mt-5">
            Don’t have an account?{' '}
            <Link
              to="/register"
              className="text-blue-600 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
              aria-label="Sign up for a new account"
            >
              Sign Up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}