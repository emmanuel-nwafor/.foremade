import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { vendorAuth, db } from '../firebase';
import { createUserWithEmailAndPassword, onAuthStateChanged, updateProfile, sendEmailVerification, signInWithRedirect, getRedirectResult, GoogleAuthProvider, FacebookAuthProvider } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import countryCodes from '../components/common/countryCodes';
import countries from '../components/common/countries';
import logo from '../assets/logi.png';

export default function SellerRegister() {
  const [formData, setFormData] = useState({
    name: '',
    country: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [submitError, setSubmitError] = useState('');
  const [isPhoneCodeManual, setIsPhoneCodeManual] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupSuccess, setSignupSuccess] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.removeItem('vendorSignupSuccess');

    getRedirectResult(vendorAuth)
      .then((result) => {
        if (result) {
          const user = result.user;
          handleSocialSignup(user);
        }
      })
      .catch((error) => {
        setSubmitError('Social signup failed: ' + error.message);
      });

    const unsubscribe = onAuthStateChanged(vendorAuth, (currentUser) => {
      if (currentUser) {
        setFormData((prev) => ({
          ...prev,
          email: currentUser.email || prev.email,
        }));
      }
    });

    const timer = setTimeout(() => {
      setSignupSuccess(false);
      localStorage.removeItem('vendorSignupSuccess');
    }, 180000);

    return () => {
      unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const getCountryCode = (countryName) => {
    const country = countryCodes.find((c) => c.country === countryName);
    return country ? country.code : '';
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const newFormData = { ...prev, [name]: value };
      if (name === 'country') {
        setIsPhoneCodeManual(false);
        const newCode = getCountryCode(value);
        const currentNumber = prev.phone.includes('-') ? prev.phone.split('-')[1] || '' : '';
        newFormData.phone = newCode ? `${newCode}-${currentNumber}` : currentNumber;
      }
      return newFormData;
    });
    setErrors((prev) => ({ ...prev, [name]: '', phone: '' }));
  };

  const handlePhoneCodeChange = (e) => {
    const selectedCode = e.target.value;
    setIsPhoneCodeManual(true);
    setFormData((prev) => {
      const number = prev.phone.includes('-') ? prev.phone.split('-')[1] || '' : '';
      return { ...prev, phone: `${selectedCode}-${number}` };
    });
    setErrors((prev) => ({ ...prev, phone: '' }));
  };

  const handlePhoneNumberChange = (e) => {
    const number = e.target.value.replace(/[^0-9]/g, '');
    setFormData((prev) => {
      const code = isPhoneCodeManual
        ? prev.phone.includes('-')
          ? prev.phone.split('-')[0]
          : getCountryCode(prev.country)
        : getCountryCode(prev.country);
      return { ...prev, phone: code ? `${code}-${number}` : number };
    });
    setErrors((prev) => ({ ...prev, phone: '' }));
  };

  const validatePassword = (password) => {
    const hasLength = password.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(password);
    return hasLength && hasLetter && hasNumber && isAlphanumeric;
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Please enter your full name.';
    if (!formData.country) newErrors.country = 'Please select a country.';
    if (!formData.email.trim()) newErrors.email = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
      newErrors.email = 'Please enter a valid email address.';
    if (!formData.phone.includes('-') || !formData.phone.split('-')[1])
      newErrors.phone = 'Please enter a valid phone number.';
    else if (formData.phone.split('-')[1].length < 7)
      newErrors.phone = 'Phone number must be at least 7 digits.';
    if (!formData.password) newErrors.password = 'Please enter a password.';
    else if (!validatePassword(formData.password))
      newErrors.password = 'Weak password. Must be at least 6 characters and include both letters and numbers.';
    if (!formData.confirmPassword) newErrors.confirmPassword = 'Please confirm your password.';
    else if (formData.password !== formData.confirmPassword)
      newErrors.confirmPassword = 'Passwords do not match.';
    return newErrors;
  };

  const isFormValid = () => {
    return (
      formData.name.trim() &&
      formData.country &&
      formData.email.trim() &&
      formData.phone.includes('-') &&
      formData.phone.split('-')[1] &&
      formData.password &&
      formData.confirmPassword &&
      formData.password === formData.confirmPassword &&
      validatePassword(formData.password)
    );
  };

  const handleSocialSignup = async (user) => {
    try {
      const vendorData = {
        name: user.displayName || user.email.split('@')[0],
        country: formData.country || 'Unknown',
        phone: formData.phone || 'Unknown',
        createdAt: new Date().toISOString(),
        userType: 'vendor',
      };
      await setDoc(doc(db, 'vendors', user.uid), vendorData);
      await updateProfile(user, { displayName: vendorData.name }); // Use name instead of JSON
      await sendEmailVerification(user);

      setSubmitError(
        `Welcome, ${vendorData.name.split(' ')[0]}! A verification email has been sent to ${
          user.email
        }. Please verify your email to activate your vendor account.`
      );
      localStorage.setItem('vendorSignupSuccess', 'true');
      setSignupSuccess(true);
      setTimeout(() => navigate('/seller/login'), 5000);
    } catch (error) {
      setSubmitError('Social signup failed: ' + error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithRedirect(vendorAuth, provider);
    } catch (error) {
      setSubmitError('Google signup failed: ' + error.message);
    }
  };

  const handleFacebookSignIn = async () => {
    const provider = new FacebookAuthProvider();
    provider.setCustomParameters({ display: 'popup' });
    try {
      await signInWithRedirect(vendorAuth, provider);
    } catch (error) {
      setSubmitError('Facebook signup failed: ' + error.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    const newErrors = validateForm();
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) return;

    try {
      const userCredential = await createUserWithEmailAndPassword(
        vendorAuth,
        formData.email,
        formData.password
      );
      const currentUser = userCredential.user;

      const vendorData = {
        name: formData.name,
        country: formData.country,
        phone: formData.phone,
        createdAt: new Date().toISOString(),
        userType: 'vendor',
      };
      await setDoc(doc(db, 'vendors', currentUser.uid), vendorData);
      await updateProfile(currentUser, { displayName: formData.name }); // Use name instead of JSON
      await sendEmailVerification(currentUser);

      setSubmitError(
        `Welcome, ${formData.name.split(' ')[0]}! A verification email has been sent to ${
          formData.email
        }. Please verify your email to activate your vendor account.`
      );
      localStorage.setItem('vendorSignupSuccess', 'true');
      setSignupSuccess(true);
      setTimeout(() => navigate('/seller/login'), 5000);
    } catch (error) {
      if (error.code === 'auth/invalid-email' || error.code === 'auth/email-already-in-use') {
        setErrors({ email: 'Invalid email or already in use. Try a different email.' });
      } else if (error.code === 'auth/weak-password') {
        setErrors({ password: 'Weak password. Must be at least 6 characters and include both letters and numbers.' });
      } else {
        setSubmitError('Signup successful, A verification email has been sent to your email.');
        localStorage.setItem('vendorSignupSuccess', 'true');
        setSignupSuccess(true);
      }
    }
  };

  if (signupSuccess) {
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
              <p className="text-lg text-center">Become a Vendor Today!</p>
            </div>
          </div>
          <div className="w-full md:w-1/2 h-full p-9 flex flex-col justify-center items-center bg-white">
            <div className="text-center">
              <svg
                className="w-24 h-24 text-green-500 mx-auto mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
                <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" fill="none" />
              </svg>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">
                Thank you for signing up with us!
              </h2>
              <p className="text-gray-600">
                Please check your email to verify your account.{' '}
                <Link to="/seller/login" className="text-blue-600 hover:underline">
                  Go to Login
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

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
            <p className="text-lg text-center">Become a Vendor Today!</p>
          </div>
        </div>
        <div className="w-full md:w-1/2 h-full p-9 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Vendor Sign Up</h2>
          <p className="text-gray-600 mb-2">
            Already have a vendor account?{' '}
            <Link to="/seller/login" className="text-blue-600 hover:underline">
              Login
            </Link>
          </p>

          {submitError && <p className="text-green-600 text-[10px] mb-4">{submitError}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-4">
              <div className="relative flex-1">
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg transition-all duration-300 ${
                    errors.name ? 'border-red-500' : submitError ? 'border-green-500' : 'border-gray-300'
                  }`}
                  autoComplete="off"
                  required
                />
                <label
                  htmlFor="name"
                  className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-1 ${
                    formData.name ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                  }`}
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                {errors.name && <p className="text-red-600 text-[10px] mt-1">{errors.name}</p>}
              </div>
              <div className="relative flex-1">
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-lg transition-all duration-300 ${
                    errors.email ? 'border-red-500' : submitError ? 'border-green-500' : 'border-gray-300'
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
            </div>
            <div className="relative">
              <label className="block text-gray-700 text-xs sm:text-sm font-medium">
                Country or region <span className="text-red-500">*</span>
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="mt-1 w-full p-3 border rounded-lg transition-all duration-300 border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select a country</option>
                {countries.map((country, index) => (
                  <option key={index} value={country}>
                    {country}
                  </option>
                ))}
              </select>
              {errors.country && <p className="text-red-600 text-[10px] mt-1">{errors.country}</p>}
            </div>
            <div className="relative">
              <label className="block text-gray-700 text-xs sm:text-sm font-medium">
                Phone <span className="text-red-500">*</span>
              </label>
              <div className="mt-1 flex items-center border border-gray-300 rounded-lg">
                <select
                  value={
                    isPhoneCodeManual
                      ? formData.phone.split('-')[0] || ''
                      : getCountryCode(formData.country)
                  }
                  onChange={handlePhoneCodeChange}
                  className="px-2 py-3 text-xs sm:text-sm bg-gray-100 text-gray-700 border-r border-gray-300 focus:outline-none"
                >
                  {countryCodes.map((country) => (
                    <option key={`${country.code}-${country.country}`} value={country.code}>
                      {country.code} ({country.country})
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  value={
                    formData.phone.includes('-') ? formData.phone.split('-')[1] || '' : formData.phone
                  }
                  onChange={handlePhoneNumberChange}
                  placeholder="Enter phone number"
                  className="w-full p-3 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              {errors.phone && <p className="text-red-600 text-[10px] mt-1">{errors.phone}</p>}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${
                  errors.password ? 'border-red-500' : submitError ? 'border-green-500' : 'border-gray-300'
                }`}
                autoComplete="new-password"
                required
              />
              <label
                htmlFor="password"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-1 ${
                  formData.password ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                }`}
              >
                Password (6+ Alphanumeric) <span className="text-red-500">*</span>
              </label>
              <span
                className="absolute right-3 top-3 text-gray-500 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'} text-xl`}></i>
              </span>
              {errors.password && <p className="text-red-600 text-[10px] mt-1">{errors.password}</p>}
            </div>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${
                  errors.confirmPassword ? 'border-red-500' : submitError ? 'border-green-500' : 'border-gray-300'
                }`}
                autoComplete="new-password"
                required
              />
              <label
                htmlFor="confirmPassword"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-1 ${
                  formData.confirmPassword ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                }`}
              >
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <span
                className="absolute right-3 top-3 text-gray-500 cursor-pointer"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <i className={`bx ${showConfirmPassword ? 'bx-hide' : 'bx-show'} text-xl`}></i>
              </span>
              {errors.confirmPassword && (
                <p className="text-red-600 text-[10px] mt-1">{errors.confirmPassword}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={!isFormValid()}
              className={`w-full p-3 rounded-lg text-white transition duration-200 ${
                isFormValid() ? 'bg-slate-600 hover:bg-blue-800' : 'bg-gray-400 cursor-not-allowed'
              }`}
            >
              Proceed To Next
            </button>
            <div className="mt-6 text-center">
              <p className="text-gray-600 mb-4">Or continue with</p>
              <div className="flex justify-center space-x-4">
                <button
                  onClick={handleGoogleSignIn}
                  className="bg-white border border-gray-300 p-[17px] max-md:p-2 text-sm rounded-lg flex items-center justify-center hover:bg-gray-100 transition duration-200"
                >
                  <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-2" />
                  Google
                </button>
                <button
                  onClick={handleFacebookSignIn}
                  className="bg-white border border-gray-300 p-[17px] max-md:p-2 text-sm rounded-lg flex items-center justify-center hover:bg-gray-100 transition duration-200"
                >
                  <img src="https://www.facebook.com/favicon.ico" alt="Facebook" className="w-5 h-5 mr-2" />
                  Facebook
                </button>
              </div>
            </div>
            <p className="text-gray-600 mt-5 text-sm">
              Please review our{' '}
              <Link to="/seller/agreement" className="text-blue-600 hover:underline">
                Vendor User Agreement
              </Link>{' '}
              before registering.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}