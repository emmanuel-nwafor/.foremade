import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import {
  signInWithEmailAndPassword,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  FacebookAuthProvider,
  setPersistence,
  browserSessionPersistence,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import logo from '../assets/logi.png';

const getFriendlyErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/invalid-credential': return 'Incorrect email or password.';
    case 'auth/wrong-password': return 'Wrong password. Please try again.';
    case 'auth/user-not-found': return 'No account found with this email.';
    case 'auth/invalid-email': return 'Please enter a valid email address.';
    case 'auth/user-disabled': return 'This account is not available.';
    case 'auth/too-many-requests': return 'Too many attempts. Please try again later.';
    case 'auth/otp-not-verified': return 'Please verify your email with the code sent to you.';
    default: return 'Something went wrong. Please try again.';
  }
};

const ADMIN_EMAILS = [
  'echinecherem729@gmail.com',
  'emitexc.e.o1@gmail.com',
  'info@foremade.com',
  'support@foremade.com',
];

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);
  const navigate = useNavigate();
  const { state } = useLocation();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  useEffect(() => {
    const socialEmail = localStorage.getItem('socialEmail') || state?.email || '';
    if (socialEmail) {
      setEmail(socialEmail);
      setPasswordError('Use Google Sign-In for this account.');
    }
  }, [state]);

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          const user = result.user;
          handleSocialLogin(user);
        }
      })
      .catch((err) => {
        console.error('Redirect result error:', err);
        setEmailError(getFriendlyErrorMessage(err));
        setLoadingGoogle(false);
        setLoadingFacebook(false);
      });
  }, []);

  const handleSocialLogin = async (user) => {
    try {
      const response = await fetch('https://foremade-backend.onrender.com/verify-otp-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await response.json();
      if (!data.success) {
        setEmailError(data.error || 'Please verify your email with the code sent to you.');
        setLoadingGoogle(false);
        setLoadingFacebook(false);
        return;
      }

      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);
      let userData;

      if (userSnapshot.exists()) {
        userData = userSnapshot.data();
      } else {
        const role = ADMIN_EMAILS.includes(user.email) ? 'Admin' : 'Buyer';
        const displayName = user.displayName || '';
        const [firstName, lastName] = displayName.split(' ').length > 1 ? displayName.split(' ') : [displayName, ''];
        userData = {
          uid: user.uid,
          email: user.email,
          firstName: firstName || user.email.split('@')[0],
          lastName: lastName || '',
          username: user.email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000),
          phoneNumber: user.phoneNumber || '',
          role,
        };
        await setDoc(userDoc, userData);
      }

      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.removeItem('socialEmail');
      const firstName = userData.firstName || userData.name?.split(' ')[0] || 'User';
      setSuccessMessage(`Welcome, ${firstName}!`);
      setTimeout(() => {
        setLoadingGoogle(false);
        setLoadingFacebook(false);
        navigate(ADMIN_EMAILS.includes(userData.email) ? '/admin/dashboard' : '/profile');
      }, 2000);
    } catch (err) {
      console.error('Social login error:', err);
      setEmailError(getFriendlyErrorMessage(err) || 'Login failed. Please try again.');
      setLoadingGoogle(false);
      setLoadingFacebook(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setSuccessMessage('');
    setLoadingEmail(true);

    let hasError = false;
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (!trimmedEmail) {
      setEmailError('Email is required.');
      hasError = true;
    } else if (!validateEmail(trimmedEmail)) {
      setEmailError('Please enter a valid email address.');
      hasError = true;
    }
    if (!trimmedPassword && !passwordError.includes('Google Sign-In')) {
      setPasswordError('Password is required.');
      hasError = true;
    }

    if (hasError) {
      setLoadingEmail(false);
      return;
    }

    console.log('Attempting login with:', { email: trimmedEmail, password: trimmedPassword });

    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      const user = userCredential.user;

      const response = await fetch('https://foremade-backend.onrender.com/verify-otp-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email }),
      });
      const data = await response.json();
      if (!data.success) {
        setEmailError(data.error || 'Please verify your email with the code sent to you.');
        setLoadingEmail(false);
        return;
      }

      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        localStorage.setItem('userData', JSON.stringify(userData));
        localStorage.removeItem('socialEmail');
        const firstName = userData.firstName || userData.name?.split(' ')[0] || 'User';
        setSuccessMessage(`Welcome, ${firstName}!`);
        setTimeout(() => {
          setLoadingEmail(false);
          navigate(ADMIN_EMAILS.includes(userData.email) ? '/admin/dashboard' : '/profile');
        }, 2000);
      } else {
        setEmailError('Account not found. Please contact support.');
        setLoadingEmail(false);
      }
    } catch (err) {
      console.error('Login error:', err);
      setLoadingEmail(false);
      const errorMessage = getFriendlyErrorMessage(err);
      if (errorMessage.includes('email') || errorMessage.includes('account') || errorMessage.includes('valid')) {
        setEmailError(errorMessage);
      } else {
        setPasswordError(errorMessage);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setEmailError('');
    setPasswordError('');
    setSuccessMessage('');
    setLoadingGoogle(true);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await signInWithRedirect(auth, provider);
    } catch (err) {
      console.error('Google sign-in error:', err);
      setLoadingGoogle(false);
      setEmailError(getFriendlyErrorMessage(err) || 'Sign-in failed. Please try again.');
    }
  };

  const handleFacebookSignIn = async () => {
    setEmailError('');
    setPasswordError('');
    setSuccessMessage('');
    setLoadingFacebook(true);

    const provider = new FacebookAuthProvider();
    provider.setCustomParameters({ display: 'popup' });
    try {
      await signInWithRedirect(auth, provider);
    } catch (err) {
      console.error('Facebook sign-in error:', err);
      setLoadingFacebook(false);
      setEmailError(getFriendlyErrorMessage(err) || 'Sign-in failed. Please try again.');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full h-screen flex">
        <div
          className="hidden md:block md:w-1/2 h-full bg-cover bg-center"
          style={{ backgroundImage: "url('https://images.pexels.com/photos/7621356/pexels-photo-7621356.jpeg?auto=compress&cs=tinysrgb&w=600')" }}
        >
          <div className="w-full h-full bg-black bg-opacity-40 flex flex-col justify-center items-center text-white p-8">
            <h1 className="text-3xl font-bold mb-4 flex items-center">
              Welcome to <img src={logo} alt="Logo" className="h-20 ml-2" />
            </h1>
            <p className="text-lg text-center">Where quality meets NEEDS!</p>
          </div>
        </div>
        <div className="w-full md:w-1/2 h-full p-9 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Sign In</h2>
          <p className="text-gray-600 mb-6">
            Don’t have an account?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">
              Sign Up
            </Link>
          </p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${
                  emailError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'
                }`}
                autoComplete="email"
                required
              />
              <label
                htmlFor="email"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${
                  email ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                }`}
              >
                Email
              </label>
              {emailError && <p className="text-red-600 text-xs mt-1">{emailError}</p>}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${
                  passwordError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'
                }`}
                autoComplete="current-password"
                required
                disabled={passwordError.includes('Google Sign-In')}
              />
              <label
                htmlFor="password"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${
                  password || passwordError.includes('Google Sign-In') ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                }`}
              >
                Password
              </label>
              <span
                className="absolute right-3 top-3 text-gray-500 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
                style={{ display: passwordError.includes('Google Sign-In') ? 'none' : 'block' }}
              >
                <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'} text-xl`}></i>
              </span>
              {passwordError && <p className="text-red-600 text-xs mt-1">{passwordError}</p>}
            </div>
            {successMessage && <p className="text-green-600 text-xs mt-1">{successMessage}</p>}
            <button
              type="submit"
              className="w-full bg-slate-600 text-white p-3 rounded-lg hover:bg-blue-800 transition duration-200"
              disabled={loadingEmail || passwordError.includes('Google Sign-In')}
            >
              {loadingEmail ? 'Logging in...' : 'Sign In'}
            </button>
          </form>
          <p className="text-gray-600 mt-2">
            <Link to="/recover-password" className="hover:underline hover:text-blue-700">
              Forgot Password?
            </Link>
          </p>
          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-4">Or continue with</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleGoogleSignIn}
                className="bg-white border border-gray-300 p-[17px] max-md:p-2 text-sm rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                disabled={loadingGoogle}
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-2" />
                {loadingGoogle ? 'Processing...' : 'Google'}
              </button>
              <button
                onClick={handleFacebookSignIn}
                className="bg-white border border-gray-300 p-[17px] max-md:p-2 text-sm rounded-lg flex items-center justify-center hover:bg-gray-100 transition-colors"
                disabled={loadingFacebook}
              >
                <img src="https://www.facebook.com/favicon.ico" alt="Facebook" className="w-5 h-5 mr-2" />
                {loadingFacebook ? 'Processing...' : 'Facebook'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}