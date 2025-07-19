import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth, db } from '/src/firebase';
import { doc, setDoc, getDoc, addDoc, collection } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import logo from '../assets/logi.png';

const getFriendlyErrorMessage = (error) => {
  switch (error.code) {
    case 'auth/network-request-failed': return 'Check your network.';
    case 'auth/email-already-in-use': return 'Email already in use. Log in instead.';
    case 'auth/weak-password': return 'Password too weak.';
    case 'auth/invalid-email': return 'Invalid email.';
    case 'auth/popup-closed-by-user': return 'Sign-in cancelled.';
    case 'auth/cancelled-popup-request': return 'Sign-in popup closed.';
    case 'auth/account-exists-with-different-credential': return 'Account exists. Try logging in.';
    default: return 'Unexpected error.';
  }
};

const generateUsername = (firstName, lastName, email) => {
  if (firstName && lastName) {
    return `${firstName.toLowerCase().replace(/\s/g, '')}${lastName.toLowerCase().replace(/\s/g, '')}${Math.floor(Math.random() * 1000)}`;
  }
  return email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '') + Math.floor(Math.random() * 1000);
};

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const [signupAttempts, setSignupAttempts] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    if (!import.meta.env.VITE_RECAPTCHA_SITE_KEY) {
      console.error('Missing VITE_RECAPTCHA_SITE_KEY');
      setErrors({ form: 'reCAPTCHA config error' });
      return;
    }

    const loadRecaptcha = async (attempt = 1) => {
      const scriptId = 'recaptcha-script';
      if (document.getElementById(scriptId)) return;
      const script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://www.google.com/recaptcha/api.js?render=${import.meta.env.VITE_RECAPTCHA_SITE_KEY}`;
      script.async = true;
      script.onerror = () => {
        console.error('reCAPTCHA script failed');
        if (attempt < 3) setTimeout(() => loadRecaptcha(attempt + 1), 1000);
        else setErrors({ form: 'Failed to load reCAPTCHA. Check network.' });
      };
      document.body.appendChild(script);

      script.onload = () => {
        console.log('reCAPTCHA script loaded');
        window.grecaptcha.ready(() => {
          console.log('reCAPTCHA ready');
          window.grecaptcha.execute(import.meta.env.VITE_RECAPTCHA_SITE_KEY, { action: 'signup' })
            .then(token => {
              console.log('reCAPTCHA token:', token);
              setRecaptchaToken(token);
            })
            .catch(err => {
              console.error('reCAPTCHA execute error:', err);
              if (attempt < 3) setTimeout(() => loadRecaptcha(attempt + 1), 1000);
              else setErrors({ form: 'reCAPTCHA token failed. Try again.' });
            });
        });
      };

      return () => {
        const existingScript = document.getElementById(scriptId);
        if (existingScript) document.body.removeChild(existingScript);
      };
    };

    loadRecaptcha();
  }, []);

  useEffect(() => {
    getRedirectResult(auth)
      .then(result => {
        if (result) handleGoogleSignIn(result.user);
      })
      .catch(err => {
        setErrors({ form: getFriendlyErrorMessage(err) });
        setLoading(false);
      });
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required.';
    if (!formData.email) {
      newErrors.email = 'Email is required.';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address.';
    }
    if (!formData.password) {
      newErrors.password = 'Password is required.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (formData.phoneNumber && !/^\+\d{7,15}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone (e.g., +1234567890).';
    }
    if (!recaptchaToken) {
      newErrors.form = 'reCAPTCHA failed. Try again.';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMessage('');
    setLoading(true);

    if (signupAttempts >= 9) {
      setErrors({ form: 'Too many attempts. Try later.' });
      setLoading(false);
      return;
    }

    if (!validateForm()) {
      setLoading(false);
      setSignupAttempts(prev => prev + 1);
      return;
    }

    try {
      console.log('Sending reCAPTCHA token:', recaptchaToken);
      const response = await axios.post(`${import.meta.env.VITE_BACKEND_URL}/verify-recaptcha`, {
        token: recaptchaToken,
      }, {
        headers: { 'Content-Type': 'application/json' },
      });
      console.log('reCAPTCHA response:', response.data);

      if (!response.data.success || response.data.score < 0.5) {
        setErrors({ form: 'reCAPTCHA failed. Are you a bot?' });
        setLoading(false);
        setSignupAttempts(prev => prev + 1);
        return;
      }

      await setPersistence(auth, browserSessionPersistence);
      const { user } = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const username = generateUsername(formData.firstName, formData.lastName, formData.email);
      await updateProfile(user, { displayName: username });
      await sendEmailVerification(user);

      const payload = {
        uid: user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username,
        phoneNumber: formData.phoneNumber,
      };

      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const registerResponse = await axios.post(`${BACKEND_URL}/register`, payload);

      if (registerResponse.data.redirectUrl) {
        setSuccessMessage(`Welcome, ${formData.firstName}! Verify your email at ${formData.email}.`);
        await addDoc(collection(db, 'notifications'), {
          type: 'user_signup',
          message: `New user signed up: ${user.email}`,
          createdAt: new Date(),
          details: { user_id: user.uid, email: user.email },
        });
        setSignupAttempts(0);
        setTimeout(() => {
          setLoading(false);
          navigate(registerResponse.data.redirectUrl);
        }, 2000);
      } else {
        throw new Error('No redirect URL provided');
      }
    } catch (err) {
      console.error('Registration error:', err);
      let errorMessage = 'Registration failed. Please try again.';
      if (err.code === 'auth/email-already-in-use') {
        errorMessage = 'Email already in use. Log in instead.';
      } else if (err.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email format.';
      } else if (err.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak.';
      } else if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      }
      setErrors({ form: errorMessage });
      setLoading(false);
      setSignupAttempts(prev => prev + 1);
    }
  };

  const handleGoogleSignIn = async (user) => {
    setErrors({});
    setSuccessMessage('');
    setLoading(true);

    try {
      if (!user) {
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        await signInWithRedirect(auth, provider);
        return;
      }

      const fullName = user.displayName || user.email.split('@')[0];
      const [firstNameFromSocial, ...rest] = fullName.split(' ');
      const lastNameFromSocial = rest.join(' ');
      const username = generateUsername(firstNameFromSocial, lastNameFromSocial, user.email);

      const userDocRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDocRef);

      let userData;
      if (!userSnapshot.exists()) {
        userData = {
          email: user.email,
          firstName: firstNameFromSocial,
          lastName: lastNameFromSocial,
          username,
          phoneNumber: '',
          createdAt: new Date().toISOString(),
          uid: user.uid,
          profileImage: user.photoURL || null,
        };
        const payload = {
          uid: user.uid,
          email: user.email,
          firstName: firstNameFromSocial,
          lastName: lastNameFromSocial,
          username,
          phoneNumber: '',
        };

        const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
        const registerResponse = await axios.post(`${BACKEND_URL}/register`, payload);
        await setDoc(userDocRef, userData);
        await addDoc(collection(db, 'notifications'), {
          type: 'user_signup',
          message: `New user signed up: ${user.email}`,
          createdAt: new Date(),
          details: { user_id: user.uid, email: user.email },
        });
        await updateProfile(user, { displayName: username });
        if (!user.emailVerified) {
          await sendEmailVerification(user);
          console.log('Verification email sent:', user.email);
        }

        if (registerResponse.data.redirectUrl) {
          localStorage.setItem('userData', JSON.stringify(userData));
          setSuccessMessage(`Welcome, ${firstNameFromSocial}! Verify your email at ${user.email}.`);
          setTimeout(() => {
            setLoading(false);
            navigate(registerResponse.data.redirectUrl);
          }, 2000);
        } else {
          throw new Error('No redirect URL provided');
        }
      } else {
        userData = userSnapshot.data();
        localStorage.setItem('userData', JSON.stringify(userData));
        setSuccessMessage(`Welcome back, ${userData.firstName}!`);
        setTimeout(() => {
          setLoading(false);
          navigate(userData.role === 'Admin' ? '/admin-dashboard' : '/profile');
        }, 2000);
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setErrors({ form: getFriendlyErrorMessage(err) });
      setLoading(false);
    }
  };

  const handleFacebookSignIn = async () => {
    setErrors({});
    setSuccessMessage('');
    setLoading(false);
    setErrors({ form: 'Facebook sign-in is not supported. Please use email or Google registration.' });
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
        <div className="w-full md:w-1/2 h-full p-9 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Sign Up</h2>
          <p className="text-gray-600 mb-6">
            Already have an account? <Link to="/login" className="text-blue-600 hover:underline">Sign In</Link>
          </p>
          {errors.form && (
            <p className="text-red-600 text-xs mb-4">
              {errors.form}{' '}
              {errors.form.includes('already in use') && (
                <Link to="/login" className="text-blue-600 hover:underline">Click here to login</Link>
              )}
            </p>
          )}
          {successMessage && <p className="text-green-600 text-xs mb-4">{successMessage}</p>}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex space-x-4 mb-4">
              <div className="relative w-1/2">
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg transition-all duration-300 ${errors.firstName ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'}`}
                  autoComplete="given-name"
                  required
                />
                <label
                  htmlFor="firstName"
                  className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${formData.firstName ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''}`}
                >
                  First Name
                </label>
                {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div className="relative w-1/2">
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg transition-all duration-300 ${errors.lastName ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'}`}
                  autoComplete="family-name"
                  required
                />
                <label
                  htmlFor="lastName"
                  className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${formData.lastName ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''}`}
                >
                  Last Name
                </label>
                {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
              </div>
            </div>
            <div className="relative">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${errors.email ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'}`}
                autoComplete="email"
                required
              />
              <label
                htmlFor="email"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${formData.email ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''}`}
              >
                Email
              </label>
              {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
            </div>
            <div className="relative">
              <input
                type="tel"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${errors.phoneNumber ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'}`}
                autoComplete="tel"
              />
              <label
                htmlFor="phoneNumber"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${formData.phoneNumber ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''}`}
              >
                Phone Number
              </label>
              {errors.phoneNumber && <p className="text-red-600 text-xs mt-1">{errors.phoneNumber}</p>}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${errors.password ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'}`}
                autoComplete="new-password"
                required
              />
              <label
                htmlFor="password"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${formData.password ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''}`}
              >
                Password
              </label>
              <span
                className="absolute right-3 top-3 text-gray-500 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'} text-xl`}></i>
              </span>
              {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
            </div>
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
                onClick={() => handleGoogleSignIn()}
                className="bg-white border border-gray-300 p-3 rounded-lg flex items-center justify-center hover:bg-gray-100 transition duration-200"
                disabled={loading}
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-2" />
                {loading ? 'Processing...' : 'Google'}
              </button>
              <button
                onClick={handleFacebookSignIn}
                className="bg-white border border-gray-300 p-3 rounded-lg flex items-center justify-center hover:bg-gray-100 transition duration-200"
                disabled={loading}
              >
                <img src="https://www.facebook.com/favicon.ico" alt="Facebook" className="w-5 h-5 mr-2" />
                {loading ? 'Processing...' : 'Facebook'}
              </button>
            </div>
            <p className="text-gray-500 text-xs mt-4">
              This site is protected by reCAPTCHA and the Google{' '}
              <a href="https://policies.google.com/privacy" className="underline" target="_blank" rel="noopener noreferrer">Privacy Policy</a>{' '}
              and{' '}
              <a href="https://policies.google.com/terms" className="underline" target="_blank" rel="noopener noreferrer">Terms of Service</a>{' '}
              apply.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}