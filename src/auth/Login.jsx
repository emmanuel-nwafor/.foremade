import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signInWithRedirect, getRedirectResult, GoogleAuthProvider, FacebookAuthProvider, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import logo from '../assets/logi.png';

const getFriendlyErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
};

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

  useEffect(() => {
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
          const user = result.user;
          handleSocialLogin(user);
        }
      })
      .catch((err) => {
        setEmailError(getFriendlyErrorMessage(err));
      });
  }, []);

  const handleSocialLogin = async (user) => {
    try {
      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        localStorage.setItem('userData', JSON.stringify(userData));
        setSuccessMessage(`Welcome back, ${userData.name.split(' ')[0]}!`);
        setTimeout(() => {
          setLoadingGoogle(false);
          setLoadingFacebook(false);
          navigate('/profile'); // Adjust redirect path as needed
        }, 2000);
      } else {
        setEmailError('No account found. Please sign up.');
      }
    } catch (err) {
      setEmailError(getFriendlyErrorMessage(err));
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setSuccessMessage('');
    setLoadingEmail(true);

    let hasError = false;
    if (!email) {
      setEmailError('Email is required.');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    }

    if (hasError) {
      setLoadingEmail(false);
      return;
    }

    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user.emailVerified) {
        setEmailError('Please verify your email before logging in.');
        setLoadingEmail(false);
        return;
      }

      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);
      if (userSnapshot.exists()) {
        const userData = userSnapshot.data();
        localStorage.setItem('userData', JSON.stringify(userData));
        setSuccessMessage(`Welcome back, ${userData.name.split(' ')[0]}!`);
        setTimeout(() => {
          setLoadingEmail(false);
          navigate('/dashboard'); // Adjust redirect path as needed
        }, 2000);
      } else {
        setEmailError('No account found. Please sign up.');
        setLoadingEmail(false);
      }
    } catch (err) {
      setLoadingEmail(false);
      const errorMessage = getFriendlyErrorMessage(err);
      if (errorMessage.includes('email')) {
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
      setLoadingGoogle(false);
      setEmailError(getFriendlyErrorMessage(err));
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
      setLoadingFacebook(false);
      setEmailError(getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full h-screen flex">
        <div className="hidden md:block md:w-1/2 h-full bg-cover bg-center" style={{ backgroundImage: "url('https://i.pinimg.com/736x/f2/8c/a4/f28ca4118a46e68b6871946e65ab5665.jpg')" }}>
          <div className="w-full h-full bg-black bg-opacity-40 flex flex-col justify-center items-center text-white p-8">
            <h1 className="text-3xl font-bold mb-4 flex-col items-center">
              Welcome to <img src={logo} alt="Formade logo" className="h-20" />
            </h1>
            <p className="text-lg text-center">Where quality meet NEEDS!</p>
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
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-1 ${
                  email ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                }`}
              >
                Email
              </label>
              {emailError && <p className="text-red-600 text-[10px] mt-1">{emailError}</p>}
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
              />
              <label
                htmlFor="password"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-1 ${
                  password ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                }`}
              >
                Password
              </label>
              <span
                className="absolute right-3 top-3 text-gray-500 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'} text-xl`}></i>
              </span>
              {passwordError && <p className="text-red-600 text-[10px] mt-1">{passwordError}</p>}
            </div>

            {successMessage && <p className="text-green-600 text-[10px] mb-4">{successMessage}</p>}

            <button
              type="submit"
              className="w-full bg-slate-600 text-white p-3 rounded-lg hover:bg-blue-800 transition duration-200"
              disabled={loadingEmail}
            >
              {loadingEmail ? 'Logging in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-600 mb-4">Or continue with</p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleGoogleSignIn}
                className="bg-white border border-gray-300 p-[17px] max-md:p-2 text-sm rounded-lg flex items-center justify-center hover:bg-gray-100 transition duration-200"
                disabled={loadingGoogle}
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-2" />
                {loadingGoogle ? 'Processing...' : 'Google'}
              </button>
              <button
                onClick={handleFacebookSignIn}
                className="bg-white border border-gray-300 p-[17px] max-md:p-2 text-sm rounded-lg flex items-center justify-center hover:bg-gray-100 transition duration-200"
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