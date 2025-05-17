import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vendorAuth } from '../firebase';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import logo from '../assets/logi.png';

export default function SellerLogin() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate('/overview');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email.trim()) newErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Enter a valid email address.';
    if (!formData.password) newErrors.password = 'Password is required.';
    else if (formData.password.length < 6)
      newErrors.password = 'Password must be at least 6 characters.';
    else if (!/^[a-zA-Z0-9]+$/.test(formData.password))
      newErrors.password = 'Weak password. Use letters and numbers.';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }

    try {
      console.log('Attempting login for:', formData.email);
      const userCredential = await signInWithEmailAndPassword(
        vendorAuth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;

      await user.reload();
      const refreshedUser = vendorAuth.currentUser;

      if (!refreshedUser.emailVerified) {
        await sendEmailVerification(refreshedUser);
        setErrors({
          email: `Your email is not verified. A verification email has been sent to ${formData.email}. Please verify and try again.`,
        });
        console.warn('Email not verified for:', formData.email);
        setLoading(false);
        return;
      }

      console.log('Login successful:', { uid: user.uid, email: user.email });
      toast.success('Logged in successfully as a vendor!');
      navigate('/overview');
    } catch (error) {
      console.error('Login error:', {
        code: error.code,
        message: error.message,
      });
      if (error.code === 'auth/invalid-email' || error.code === 'auth/user-not-found') {
        setErrors({ email: 'Invalid email. Please check and try again.' });
      } else if (error.code === 'auth/wrong-password') {
        setErrors({ password: 'Incorrect password. Please try again.' });
      } else {
        toast.error('Failed to log in. Please try again.');
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full h-screen flex">
        <div
          className="hidden md:block md:w-1/2 h-full bg-cover bg-center"
          style={{ backgroundImage: "url('https://i.pinimg.com/736x/42/4c/f9/424cf978bcf32fec77f5794bdcbf333a.jpg')" }}
        >
          <div className="w-full h-full bg-black bg-opacity-40 flex flex-col justify-center items-center text-white p-8">
            <h1 className="text-3xl font-bold mb-4 flex items-center">
              <img src={logo} alt="Formade logo" className="h-20 ml-2" />
            </h1>
            <p className="text-lg text-center">Log in to manage your vendor account.</p>
          </div>
        </div>
        <div className="w-full md:w-1/2 h-full p-9 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Vendor Sign In</h2>
          <p className="text-gray-600 mb-6">
            Don’t have a vendor account?{' '}
            <Link to="/seller/register" className="text-blue-600 hover:underline">
              Create a new account
            </Link>
          </p>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${
                  errors.email ? 'border-red-500' : 'border-gray-300'
                }`}
                autoComplete="off"
                required
              />
              <label
                htmlFor="email"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-1 ${
                  formData.email ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                }`}
              >
                Email <span className="text-red-500">*</span>
              </label>
              {errors.email && <p className="text-red-600 text-[10px] mt-1">{errors.email}</p>}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                autoComplete="current-password"
                required
              />
              <label
                htmlFor="password"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-1 ${
                  formData.password ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                }`}
              >
                Password (Alphanumeric Only) <span className="text-red-500">*</span>
              </label>
              <span
                className="absolute right-3 top-3 text-gray-500 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'} text-xl`}></i>
              </span>
              {errors.password && <p className="text-red-600 text-[10px] mt-1">{errors.password}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className={`w-full p-3 rounded-lg text-white transition duration-200 ${
                loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-slate-600 hover:bg-blue-800'
              }`}
            >
              {loading ? 'Logging in...' : 'Log In'}
            </button>
          </form>
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={5000} />
    </div>
  );
}