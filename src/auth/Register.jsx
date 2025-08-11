import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  updateProfile,
  sendEmailVerification 
} from 'firebase/auth';
import { doc, setDoc, addDoc, collection } from 'firebase/firestore';
import logo from '../assets/logi.png';
import { UserCheck2Icon } from 'lucide-react';
import { motion } from 'framer-motion'; // <-- added for modal animations

// Validation functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => {
  const hasLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[_@!+=#$%^&*()[\]{}|;:,.<>?~`/-]/.test(password);
  return {
    isValid: hasLength && hasLetter && hasNumber && hasSpecialChar,
    score: (hasLength ? 25 : 0) + (hasLetter ? 25 : 0) + (hasNumber ? 25 : 0) + (hasSpecialChar ? 25 : 0),
    errors: [
      !hasLength && 'Password needs 6+ characters.',
      !hasLetter && 'Password needs a letter.',
      !hasNumber && 'Password needs a number.',
      !hasSpecialChar && 'Password needs a special character (e.g., _, @, !).',
    ].filter(Boolean),
  };
};
const generateUsername = (firstName, lastName) => {
  const nameParts = [firstName, lastName].filter(part => part?.trim());
  const firstPart = nameParts[0]?.slice(0, 4).toLowerCase() || 'user';
  const secondPart = nameParts[1]?.slice(0, 3).toLowerCase() || '';
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const usernameBase = (firstPart + secondPart).replace(/[^a-z0-9]/g, '');
  return usernameBase + randomNum;
};
const validatePhoneNumber = (phoneNumber) => {
  if (!phoneNumber.trim()) return true;
  return /^\+\d{7,15}$/.test(phoneNumber);
};

// Backend URL from env
const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [otpError, setOtpError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [signupAttempts, setSignupAttempts] = useState(0);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);
  const navigate = useNavigate();

  // NEW: seller choice modal state
  const [showSellerModal, setShowSellerModal] = useState(false);

  // Password strength state
  const [passwordStrength, setPasswordStrength] = useState(0);

  useEffect(() => {
    const validation = validatePassword(password);
    setPasswordStrength(validation.score);
    if (!validation.isValid && password) {
      setPasswordError(validation.errors[0]);
    } else {
      setPasswordError('');
    }
  }, [password]);

  // Show seller modal on first render of this page
  useEffect(() => {
    // Show immediately when user arrives at the register page
    setShowSellerModal(true);
  }, []);

  const handleRegister = async (e) => {
    e.preventDefault();
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError('');
    setPhoneNumberError('');
    setOtpError('');
    setSuccessMessage('');
    setLoading(true);

    if (signupAttempts >= 9) {
      setEmailError('Too many attempts. Please try again later.');
      setLoading(false);
      return;
    }

    let hasError = false;
    if (!firstName.trim()) {
      setFirstNameError('First name is required.');
      hasError = true;
    }
    if (!lastName.trim()) {
      setLastNameError('Last name is required.');
      hasError = true;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setPasswordError(passwordValidation.errors[0]);
        hasError = true;
      }
    }
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      setPhoneNumberError('Invalid phone number (e.g., +1234567890).');
      hasError = true;
    }

    if (hasError) {
      setLoading(false);
      setSignupAttempts(prev => prev + 1);
      return;
    }

    console.log('Registering with:', { firstName, lastName, email, password });

    try {
      const username = generateUsername(firstName, lastName);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: username }); // Set displayName

      const userData = {
        email: user.email,
        name: `${firstName} ${lastName}`, // Match previous logic
        username,
        address: '',
        phoneNumber: phoneNumber || '',
        createdAt: new Date().toISOString(),
        uid: user.uid,
        profileImage: null,
      };
      await setDoc(doc(db, 'users', user.uid), userData);

      const response = await fetch(`${backendUrl}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Account created! Check your email for a verification code.');
        setShowOtpModal(true);
        localStorage.setItem('userData', JSON.stringify(userData)); // Save to local storage
      } else {
        setEmailError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setEmailError(err.message.includes('email') ? 'This email is already in use or invalid. Try another.' : 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    let authProvider;
    if (provider === 'google') {
      authProvider = new GoogleAuthProvider();
      setLoadingGoogle(true);
    } else if (provider === 'facebook') {
      authProvider = new FacebookAuthProvider();
      setLoadingFacebook(true);
    }
    try {
      const result = await signInWithPopup(auth, authProvider);
      const user = result.user;
      const [socialFirstName, ...rest] = user.displayName?.split(' ') || [user.email.split('@')[0], ''];
      const socialLastName = rest.join(' ');

      const username = generateUsername(socialFirstName, socialLastName);

      await updateProfile(user, { displayName: username }); // Set displayName

      const userData = {
        email: user.email,
        name: `${socialFirstName} ${socialLastName}`, // Match previous logic
        username,
        address: '',
        phoneNumber: user.phoneNumber || '',
        createdAt: new Date().toISOString(),
        uid: user.uid,
        profileImage: user.photoURL || null,
      };
      await setDoc(doc(db, 'users', user.uid), userData, { merge: true });

      localStorage.setItem('userData', JSON.stringify(userData)); // Save to local storage
      setSuccessMessage('Account created successfully with ' + provider + '! Redirecting...');
      setTimeout(() => navigate('/'), 2000); // Redirect to home without OTP
    } catch (err) {
      setEmailError('Social signup failed: ' + err.message);
    } finally {
      setLoadingGoogle(false);
      setLoadingFacebook(false);
    }
  };

  const handleResendOtp = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${backendUrl}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccessMessage('New verification code sent to your email.');
      } else {
        setEmailError(data.error || 'Failed to send code. Please try again.');
      }
    } catch (err) {
      setEmailError('Unable to send code. Check your network and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setOtpError('');
    setSuccessMessage('');
    setLoading(true);

    console.log('Verifying OTP:', { email, otp });

    if (!otp.trim()) {
      setOtpError('Please enter the verification code.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Email verified! You can log in now.');
        await sendEmailVerification(auth.currentUser); // Match previous logic
        setShowOtpModal(false);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setOtpError(data.error || 'Invalid or expired code. Please try again.');
      }
    } catch (err) {
      setOtpError('Verification failed. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  // Seller modal handlers
  const chooseStandardSeller = () => {
    // Close modal and stay on same page
    setShowSellerModal(false);
  };

  const chooseProSeller = () => {
    // Redirect to pro seller registration route
    navigate('/register/pro-seller');
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full h-screen flex">
        <div className="hidden md:block md:w-1/2 h-full bg-cover bg-center" style={{ backgroundImage: "url('https://i.pinimg.com/736x/f2/8c/a4/f28ca4118a46e68b6871946e65ab5665.jpg')" }}>
          <div className="w-full h-full bg-black bg-opacity-40 flex flex-col justify-center items-center text-white p-8">
            <h1 className="text-3xl font-bold mb-4 flex items-center">
              Join <img src={logo} alt="Formade logo" className="h-20 ml-2" />
            </h1>
            <p className="text-lg text-center">Where quality meets NEEDS!</p>
          </div>
        </div>
        <div className="w-full md:w-1/2 h-full p-9 flex flex-col justify-center bg-white relative">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">Sign Up</h2>
          </div>
          <p className="text-gray-600 mb-6">
            Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign In</Link>
          </p>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex space-x-4 mb-4">
              <div className="relative w-1/2">
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`w-full p-3 border rounded-lg transition-all duration-300 ${firstNameError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'}`}
                  autoComplete="given-name"
                  required
                />
                <label className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${firstName ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''}`}>
                  First Name
                </label>
                {firstNameError && <p className="text-red-600 text-xs mt-1">{firstNameError}</p>}
              </div>
              <div className="relative w-1/2">
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`w-full p-3 border rounded-lg transition-all duration-300 ${lastNameError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'}`}
                  autoComplete="family-name"
                  required
                />
                <label className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${lastName ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''}`}>
                  Last Name
                </label>
                {lastNameError && <p className="text-red-600 text-xs mt-1">{lastNameError}</p>}
              </div>
            </div>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${emailError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'}`}
                autoComplete="email"
                required
              />
              <label className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${email ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''}`}>
                Email
              </label>
              {emailError && <p className="text-red-600 text-xs mt-1">{emailError}</p>}
            </div>
            <div className="relative">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${phoneNumberError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'}`}
                autoComplete="tel"
              />
              <label className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${phoneNumber ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''}`}>
                Phone Number
              </label>
              {phoneNumberError && <p className="text-red-600 text-xs mt-1">{phoneNumberError}</p>}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${passwordError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'}`}
                autoComplete="new-password"
                required
              />
              <label className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${password ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''}`}>
                Password
              </label>
              <span
                className="absolute right-3 top-3 text-gray-500 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'} text-xl`}></i>
              </span>
            </div>
            {/* Password Strength Meter */}
            {password && (
              <div className="mt-2">
                <div className="text-xs text-gray-600 mb-1">Password Strength</div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ease-out ${passwordStrength >= 75 ? 'bg-green-500' : passwordStrength >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                    style={{ width: `${passwordStrength}%` }}
                  ></div>
                </div>
                <p className="text-xs mt-1">
                  {passwordStrength >= 75 ? 'Strong' : passwordStrength >= 50 ? 'Medium' : 'Weak'}
                </p>
              </div>
            )}
            {passwordError && <p className="text-red-600 text-xs mt-1">{passwordError}</p>}
            {successMessage && <p className="text-green-600 text-xs mb-4">{successMessage}</p>}
            <button
              type="submit"
              className="w-full bg-slate-600 text-white p-3 rounded-lg hover:bg-blue-800 transition duration-200"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Sign Up'}
            </button>
          </form>
          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-4">Or continue with</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={() => handleSocialLogin('google')}
                className="bg-white border border-gray-300 p-[17px] max-md:p-2 text-sm rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                disabled={loadingGoogle}
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-2" />
                {loadingGoogle ? 'Processing...' : 'Google'}
              </button>
              <button
                onClick={() => handleSocialLogin('facebook')}
                className="bg-white border border-gray-300 p-[17px] max-md:p-2 text-sm rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                disabled={loadingFacebook}
              >
                <img src="https://www.facebook.com/favicon.ico" alt="Facebook" className="w-5 h-5 mr-2" />
                {loadingFacebook ? 'Processing...' : 'Facebook'}
              </button>
            </div>
          </div>

          {/* Advanced OTP Modal */}
          {showOtpModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="m-4 bg-white p-6 rounded-lg w-full max-w-md animate-slide-up">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold">Verify Your Email</h3>
                  <button
                    onClick={() => setShowOtpModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <i className="bx bx-x text-[24px]"></i>
                  </button>
                </div>
                <p className="text-gray-600 mb-4 text-sm text-center">Enter the 6-digits code sent to your email {email}.</p>
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="flex justify-between gap-2">
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength="1"
                        value={otp[index] || ''}
                        onChange={(e) => {
                          const newOtp = otp.split('');
                          newOtp[index] = e.target.value;
                          setOtp(newOtp.join(''));
                          if (e.target.value && index < 5) document.getElementsByTagName('input')[index + 1].focus();
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !otp[index] && index > 0) document.getElementsByTagName('input')[index - 1].focus();
                        }}
                        className="w-12 h-12 text-center border rounded-lg focus:border-blue-500 focus:outline-none text-2xl font-medium"
                        required
                      />
                    ))}
                  </div>
                  {otpError && <p className="text-red-600 text-xs mt-1">{otpError}</p>}
                  <button
                    type="submit"
                    className="w-full bg-slate-600 text-white p-3 rounded-lg hover:bg-blue-800 transition duration-200"
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                  <p className="text-center text-gray-600 mt-2 text-sm">
                    Didn’t receive a code?{' '}
                    <button
                      onClick={handleResendOtp}
                      className="text-blue-600 hover:underline"
                      disabled={loading}
                    >
                      Resend
                    </button>
                  </p>
                  {successMessage && <p className="text-center text-green-600 text-xs mt-2">{successMessage}</p>}
                </form>
              </div>
            </div>
          )}

          {/* NEW: Seller Choice Modal (shows on page load) */}
          {showSellerModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center"
              aria-modal="true"
              role="dialog"
            >
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.6 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black"
              />
              {/* Modal Card */}
              <motion.div
                initial={{ y: 40, scale: 0.95, opacity: 0 }}
                animate={{ y: 0, scale: 1, opacity: 1 }}
                exit={{ y: 40, scale: 0.95, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full mx-4 p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <UserCheck2Icon className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">Choose Seller Type</h3>
                      <p className="text-sm text-gray-600">Would you like to register as a Standard or Pro seller?</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowSellerModal(false)}
                    className="text-gray-400 hover:text-gray-600"
                    aria-label="Close seller selection"
                  >
                    <i className="bx bx-x text-2xl"></i>
                  </button>
                </div>

                <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={chooseStandardSeller}
                    className="flex flex-col items-start p-4 border rounded-lg bg-white hover:shadow-lg transition-shadow"
                  >
                    <span className="text-lg font-medium text-gray-800">Standard Seller</span>
                    <span className="text-sm text-gray-500 mt-1">Quick signup, sell basic items, simpler verification.</span>
                    <span className="mt-3 inline-flex items-center text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded">Learn more</span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={chooseProSeller}
                    className="flex flex-col items-start p-4 border rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg transition-shadow"
                  >
                    <span className="text-lg font-medium">Pro Seller</span>
                    <span className="text-sm mt-1">Advanced features, premium placement, detailed verification.</span>
                    <span className="mt-3 inline-flex items-center text-xs bg-white bg-opacity-20 px-2 py-1 rounded">Recommended</span>
                  </motion.button>
                </div>

                <div className="mt-6 text-sm text-gray-500">
                  You can switch seller type later from your account settings.
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
