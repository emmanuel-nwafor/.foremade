import React, { useState } from 'react';
import { createUserWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, updateProfile, sendEmailVerification, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logi.png';

const getFriendlyErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/network-request-failed':
      return 'Check your network connection and try again.';
    case 'auth/email-already-in-use':
      return 'This email is already in use. Please log in instead.';
    case 'auth/weak-password':
      return 'Password is too weak.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in popup was closed. Please try again.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email.';
    default:
      return 'An unexpected error occurred. Please try again later.';
  }
};

const generateUsername = (fullName) => {
  const nameParts = fullName.trim().split(' ').filter(part => part);
  const firstName = nameParts[0] || '';
  const lastName = nameParts[1] || '';
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  let usernameBase;
  if (firstName) {
    usernameBase = (firstName.slice(0, 4) + lastName.slice(0, 3)).toLowerCase();
  } else {
    usernameBase = 'user';
  }
  const username = (usernameBase + randomNum).replace(/[^a-z0-9]/g, '');
  return username;
};

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [nameError, setNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const hasLength = password.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const isAlphanumeric = /^[a-zA-Z0-9]+$/.test(password);
    return hasLength && hasLetter && hasNumber && isAlphanumeric;
  };

  const handleNavigation = () => {
    navigate('/login', { replace: true });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setSuccessMessage('');
    setLoadingEmail(true);

    let hasError = false;
    if (!name.trim()) {
      setNameError('Full name is required.');
      hasError = true;
    }
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password is required.');
      hasError = true;
    } else if (!validatePassword(password)) {
      setPasswordError('Weak password. Must be at least 6 characters and include both letters and numbers.');
      hasError = true;
    }

    if (hasError) {
      setLoadingEmail(false);
      return;
    }

    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const username = generateUsername(name);
      await updateProfile(user, { displayName: username });

      await sendEmailVerification(user);
      console.log('Verification email sent to:', user.email);

      const userData = {
        email: email,
        name: name,
        username: username,
        address: '',
        createdAt: new Date().toISOString(),
        uid: user.uid,
        profileImage: null,
      };
      await setDoc(doc(db, 'users', user.uid), userData);
      localStorage.setItem('userData', JSON.stringify(userData));

      const firstName = name.split(' ')[0];
      setSuccessMessage(
        `Welcome, ${firstName}! Registration successful! A verification email has been sent to ${email}. Please verify your email before logging in.`
      );
      setTimeout(() => {
        setLoadingEmail(false);
        handleNavigation();
      }, 7000);
    } catch (err) {
      console.error('Registration error:', err);
      setLoadingEmail(false);
      const errorMessage = getFriendlyErrorMessage(err);
      if (errorMessage.includes('email')) {
        setEmailError(errorMessage);
      } else if (errorMessage.includes('password')) {
        setPasswordError(errorMessage);
      } else {
        setNameError(errorMessage);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setSuccessMessage('');
    setLoadingGoogle(true);

    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try {
      await setPersistence(auth, browserSessionPersistence);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const fullName = user.displayName || user.email.split('@')[0];
      const username = generateUsername(fullName);
      await updateProfile(user, { displayName: username });

      await sendEmailVerification(user);
      console.log('Verification email sent to:', user.email);

      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);
      let userData;
      if (!userSnapshot.exists()) {
        userData = {
          email: user.email,
          name: fullName,
          username: username,
          address: '',
          createdAt: new Date().toISOString(),
          uid: user.uid,
          profileImage: user.photoURL || null,
        };
        await setDoc(userDoc, userData);
        localStorage.setItem('userData', JSON.stringify(userData));
      } else {
        userData = userSnapshot.data();
        localStorage.setItem('userData', JSON.stringify(userData));
      }

      setSuccessMessage(
        `Welcome, ${fullName}! A verification email has been sent to ${user.email}. Please verify your email before logging in.`
      );
      setTimeout(() => {
        setLoadingGoogle(false);
        handleNavigation();
      }, 7000);
    } catch (err) {
      console.error('Google Sign-In error:', err);
      setLoadingGoogle(false);
      setEmailError(getFriendlyErrorMessage(err));
    }
  };

  const handleFacebookSignIn = async () => {
    setNameError('');
    setEmailError('');
    setPasswordError('');
    setSuccessMessage('');
    setLoadingFacebook(true);

    const provider = new FacebookAuthProvider();
    provider.setCustomParameters({ display: 'popup' });
    try {
      await setPersistence(auth, browserSessionPersistence);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      const fullName = user.displayName || user.email.split('@')[0];
      const username = generateUsername(fullName);
      await updateProfile(user, { displayName: username });

      await sendEmailVerification(user);
      console.log('Verification email sent to:', user.email);

      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);
      let userData;
      if (!userSnapshot.exists()) {
        userData = {
          email: user.email,
          name: fullName,
          username: username,
          address: '',
          createdAt: new Date().toISOString(),
          uid: user.uid,
          profileImage: user.photoURL || null,
        };
        await setDoc(userDoc, userData);
        localStorage.setItem('userData', JSON.stringify(userData));
      } else {
        userData = userSnapshot.data();
        localStorage.setItem('userData', JSON.stringify(userData));
      }

      setSuccessMessage(
        `Welcome, ${fullName}! A verification email has been sent to ${user.email}. Please verify your email before logging in.`
      );
      setTimeout(() => {
        setLoadingFacebook(false);
        handleNavigation();
      }, 7000);
    } catch (err) {
      console.error('Facebook Sign-In error:', err);
      setLoadingFacebook(false);
      setEmailError(getFriendlyErrorMessage(err));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full h-screen flex">
        {/* Left Div */}
        <div className="hidden md:block md:w-1/2 h-full bg-cover bg-center" style={{ backgroundImage: "url('https://i.pinimg.com/736x/f2/8c/a4/f28ca4118a46e68b6871946e65ab5665.jpg')" }}>
          <div className="w-full h-full bg-black bg-opacity-40 flex flex-col justify-center items-center text-white p-8">
            <h1 className="text-3xl font-bold mb-4 flex-col items-center">
              Join <img src={logo} alt="Formade logo" className="h-20" />
            </h1>
            <p className="text-lg text-center">Where quality meet NEEDS!</p>
          </div>
        </div>

        {/* Right Div with Form */}
        <div className="w-full md:w-1/2 h-full p-9 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Sign Up</h2>
          <p className="text-gray-600 mb-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="relative">
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${
                  nameError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'
                }`}
                autoComplete="off"
                required
              />
              <label
                htmlFor="name"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-1 ${
                  name ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                }`}
              >
                Full Name
              </label>
              {nameError && <p className="text-red-600 text-[10px] mt-1">{nameError}</p>}
            </div>

            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${
                  emailError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'
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
                Email
              </label>
              {emailError && (
                <p className="text-red-600 text-[10px] mt-1">
                  {emailError}{' '}
                  {emailError.includes('already in use') && (
                    <Link to="/login" className="text-blue-600 hover:underline">
                      Click here to login
                    </Link>
                  )}
                </p>
              )}
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
                autoComplete="new-password"
                required
              />
              <label
                htmlFor="password"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-1 ${
                  password ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                }`}
              >
                Password (6+ Characters, Letters & Numbers)
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
              {loadingEmail ? 'Registering...' : 'Sign Up'}
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