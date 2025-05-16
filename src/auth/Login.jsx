import React, { useState } from 'react';
import { signInWithEmailAndPassword, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup, sendEmailVerification, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/logi.png';

const getFriendlyErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/network-request-failed':
      return 'Check your network connection and try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please try again.';
    case 'auth/user-not-found':
      return 'No account found with this email. Please sign up.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';
    case 'auth/cancelled-popup-request':
      return 'Sign-in popup was closed. Please try again.';
    case 'auth/too-many-requests':
      return 'Too many login attempts. Please try again later or reset your password.';
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with this email. Try logging in with another method.';
    default:
      return 'An error occurred. Please try again later.';
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

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
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

  const handleResendVerification = async () => {
    setLoadingEmail(true);
    setEmailError('');
    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await sendEmailVerification(user);
      setEmailError(
        `A new verification email has been sent to ${email}. Please check your inbox or spam folder.`
      );
    } catch (err) {
      console.error('Resend verification error:', err);
      setEmailError(getFriendlyErrorMessage(err));
    } finally {
      setLoadingEmail(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setEmailError('');
    setPasswordError('');
    setSuccessMessage('');
    setLoadingEmail(true);

    let hasError = false;
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address.');
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

      await user.reload();
      const refreshedUser = auth.currentUser;

      if (!refreshedUser.emailVerified) {
        setEmailError(
          <>
            Your email is not verified. Please check your inbox or spam folder for the verification email sent to {email}. Click the link to verify, then try logging in again. Need a new link?{' '}
            <button
              onClick={handleResendVerification}
              className="text-blue-600 hover:underline"
              disabled={loadingEmail}
            >
              Resend Verification
            </button>
          </>
        );
        setLoadingEmail(false);
        return;
      }

      console.log('User logged in successfully:', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      });
      setSuccessMessage('Login successful! Redirecting to profile...');
      setTimeout(() => {
        setLoadingEmail(false);
        navigate('/profile');
      }, 2000);
    } catch (err) {
      console.error('Login error:', err);
      setLoadingEmail(false);
      const errorMessage = getFriendlyErrorMessage(err);
      if (errorMessage.includes('email') || errorMessage.includes('account')) {
        setEmailError(
          <>
            {errorMessage}{' '}
            {errorMessage.includes('sign up') && (
              <Link to="/register" className="text-blue-600 hover:underline">
                Sign up here
              </Link>
            )}
          </>
        );
      } else if (errorMessage.includes('password')) {
        setPasswordError(errorMessage);
      } else {
        setEmailError(errorMessage);
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
      await setPersistence(auth, browserSessionPersistence);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await user.reload();
      const refreshedUser = auth.currentUser;

      if (!refreshedUser.emailVerified) {
        await sendEmailVerification(refreshedUser);
        setEmailError(
          <>
            Your email is not verified. Please check your inbox or spam folder for the verification email sent to {user.email}. Click the link to verify, then try logging in again. Need a new link?{' '}
            <button
              onClick={() => {
                sendEmailVerification(refreshedUser).then(() => {
                  setEmailError(`A new verification email has been sent to ${user.email}. Please check your inbox or spam folder.`);
                }).catch((err) => {
                  console.error('Resend verification error:', err);
                  setEmailError(getFriendlyErrorMessage(err));
                });
              }}
              className="text-blue-600 hover:underline"
              disabled={loadingGoogle}
            >
              Resend Verification
            </button>
          </>
        );
        setLoadingGoogle(false);
        return;
      }

      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);

      if (!userSnapshot.exists()) {
        const fullName = user.displayName || user.email.split('@')[0];
        const username = generateUsername(fullName);
        const userData = {
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
        const userData = userSnapshot.data();
        localStorage.setItem('userData', JSON.stringify(userData));
      }

      console.log('User signed in with Google successfully:', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      });
      setSuccessMessage('Google Sign-In successful! Redirecting to profile...');
      setTimeout(() => {
        setLoadingGoogle(false);
        navigate('/profile');
      }, 2000);
    } catch (err) {
      console.error('Google Sign-In error:', err);
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
      await setPersistence(auth, browserSessionPersistence);
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      await user.reload();
      const refreshedUser = auth.currentUser;

      if (!refreshedUser.emailVerified) {
        await sendEmailVerification(refreshedUser);
        setEmailError(
          <>
            Your email is not verified. Please check your inbox or spam folder for the verification email sent to {user.email}. Click the link to verify, then try logging in again. Need a new link?{' '}
            <button
              onClick={() => {
                sendEmailVerification(refreshedUser).then(() => {
                  setEmailError(`A new verification email has been sent to ${user.email}. Please check your inbox or spam folder.`);
                }).catch((err) => {
                  console.error('Resend verification error:', err);
                  setEmailError(getFriendlyErrorMessage(err));
                });
              }}
              className="text-blue-600 hover:underline"
              disabled={loadingFacebook}
            >
              Resend Verification
            </button>
          </>
        );
        setLoadingFacebook(false);
        return;
      }

      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);

      if (!userSnapshot.exists()) {
        const fullName = user.displayName || user.email.split('@')[0];
        const username = generateUsername(fullName);
        const userData = {
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
        const userData = userSnapshot.data();
        localStorage.setItem('userData', JSON.stringify(userData));
      }

      console.log('User signed in with Facebook successfully:', {
        uid: user.uid,
        email: user.email,
        emailVerified: user.emailVerified,
      });
      setSuccessMessage('Facebook Sign-In successful! Redirecting to profile...');
      setTimeout(() => {
        setLoadingFacebook(false);
        navigate('/profile');
      }, 2000);
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
        <div className="hidden md:block md:w-1/2 h-full bg-cover bg-center" style={{ backgroundImage: "url('https://i.pinimg.com/736x/ae/be/07/aebe07460a46fcef3e535c05375ce886.jpg')" }}>
          <div className="w-full h-full bg-black bg-opacity-40 flex flex-col justify-center items-center text-white p-8">
            <h1 className="text-3xl font-bold mb-4 flex items-center">
              <img src={logo} alt="Formade logo" className="h-20 ml-2" />
            </h1>
            <p className="text-lg text-center">Log in to explore your profile.</p>
          </div>
        </div>

        {/* Right Div with Form */}
        <div className="w-full md:w-1/2 h-full p-9 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Sign In</h2>
          <p className="text-gray-600 mb-6">
            Don't have an account?{' '}
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

            <div className="flex justify-between items-center mb-6">
              <label className="flex items-center text-gray-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="mr-2"
                />
                Remember Me
              </label>
              <Link to="/forgot-password" className="text-blue-600 hover:underline">
                Forgot Password?
              </Link>
            </div>

            {successMessage && <p className="text-green-600 text-[10px] mb-4">{successMessage}</p>}

            <button
              type="submit"
              className="w-full bg-slate-600 text-white p-3 rounded-lg hover:bg-blue-800 transition duration-200"
              disabled={loadingEmail}
            >
              {loadingEmail ? 'Logging in...' : 'Login'}
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