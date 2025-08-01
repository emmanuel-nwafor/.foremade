const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const { db, adminAuth, adminDb } = require('./firebaseConfig');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendOTPEmail = async (email, otp) => {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'Your OTP for Registration',
    text: `Your OTP is ${otp}. It expires in 10 minutes. Do not share it with anyone.`,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (err) {
    console.error('Email send error:', err);
    throw err;
  }
};

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => {
  const hasLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[_@!+=#$%^&*()[\]{}|;:,.<>?~`/-]/.test(password);
  console.log('Password validation:', { password, hasLength, hasLetter, hasNumber, hasSpecialChar });
  return hasLength && hasLetter && hasNumber && hasSpecialChar;
};

// Register endpoint with max debugging
router.post('/register', async (req, res) => {
  console.log('Request headers:', JSON.stringify(req.headers, null, 2)); // Log headers
  console.log('Raw request body:', JSON.stringify(req.body, null, 2)); // Log raw body
  if (!req.body || Object.keys(req.body).length === 0) {
    console.error('No body received in request. Headers:', JSON.stringify(req.headers));
    return res.status(400).json({ success: false, error: 'No data received' });
  }

  const { firstName, lastName, email, password, phoneNumber, username } = req.body;
  console.log('Destructured data:', { firstName, lastName, email, password, phoneNumber, username });

  try {
    if (!firstName?.trim()) throw new Error('First name is required.');
    if (!lastName?.trim()) throw new Error('Last name is required.');
    if (!validateEmail(email)) throw new Error('Invalid email format.');
    if (!password) throw new Error('Password is required.');
    if (!validatePassword(password)) throw new Error('Password must have 6+ chars, a letter, a number, and a special char.');

    const existingUser = await adminAuth.getUserByEmail(email).catch(err => {
      console.error('Firebase getUserByEmail error:', err);
      throw err;
    });
    if (existingUser) {
      console.log('Email already in use:', email);
      return res.status(400).json({ success: false, error: 'Email already in use. Log in instead.' });
    }

    const otp = generateOTP();
    const otpDocRef = adminDb.collection('otps').doc(email);
    await otpDocRef.set({
      otp,
      expires: adminDb.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
      createdAt: adminDb.FieldValue.serverTimestamp(),
    }).catch(err => {
      console.error('Firestore set OTP error:', err);
      throw err;
    });

    await sendOTPEmail(email, otp);
    console.log('OTP sent successfully for email:', email);
    res.json({ success: true, message: 'OTP sent to your email.' });
  } catch (err) {
    console.error('Registration endpoint error:', err.message || err);
    res.status(400).json({ success: false, error: err.message || 'Registration failed' });
  }
});

// Resend OTP endpoint
router.post('/resend-otp', async (req, res) => {
  console.log('Raw resend OTP request:', JSON.stringify(req.body, null, 2));
  if (!req.body || !req.body.email) {
    console.error('No email received in resend OTP request');
    return res.status(400).json({ success: false, error: 'Email is required' });
  }

  const { email } = req.body;

  try {
    if (!validateEmail(email)) throw new Error('Invalid email format.');

    const otp = generateOTP();
    const otpDocRef = adminDb.collection('otps').doc(email);
    await otpDocRef.set({
      otp,
      expires: adminDb.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000)),
      createdAt: adminDb.FieldValue.serverTimestamp(),
    }).catch(err => {
      console.error('Firestore set OTP error:', err);
      throw err;
    });

    await sendOTPEmail(email, otp);
    console.log('New OTP sent successfully for email:', email);
    res.json({ success: true, message: 'New OTP sent to your email.' });
  } catch (err) {
    console.error('Resend OTP error:', err.message || err);
    res.status(500).json({ success: false, error: err.message || 'Failed to resend OTP.' });
  }
});

// Verify OTP and complete registration
router.post('/verify-otp', async (req, res) => {
  console.log('Raw verify OTP request:', JSON.stringify(req.body, null, 2));
  if (!req.body || !req.body.email || !req.body.otp) {
    console.error('Missing email or OTP in verify request');
    return res.status(400).json({ success: false, error: 'Email and OTP are required' });
  }

  const { email, otp, firstName, lastName, password, phoneNumber, username } = req.body;

  try {
    if (!firstName?.trim()) throw new Error('First name is required.');
    if (!lastName?.trim()) throw new Error('Last name is required.');
    if (!validateEmail(email)) throw new Error('Invalid email format.');
    if (!otp) throw new Error('OTP is required.');
    if (!password) throw new Error('Password is required.');
    if (!validatePassword(password)) throw new Error('Password must have 6+ chars, a letter, a number, and a special char.');

    const otpDoc = await adminDb.collection('otps').doc(email).get().catch(err => {
      console.error('Firestore get OTP error:', err);
      throw err;
    });
    if (!otpDoc.exists || otpDoc.data().otp !== otp || otpDoc.data().expires.toDate() < new Date()) {
      console.log('Invalid or expired OTP for email:', email);
      return res.status(400).json({ success: false, error: 'Invalid or expired OTP' });
    }

    const userRecord = await adminAuth.createUser({
      email,
      password,
      displayName: username,
    }).catch(err => {
      console.error('Firebase createUser error:', err);
      throw err;
    });

    const userData = {
      email,
      name: `${firstName} ${lastName}`,
      username,
      address: '',
      phoneNumber: phoneNumber || '',
      createdAt: new Date().toISOString(),
      uid: userRecord.uid,
      profileImage: null,
    };
    await adminDb.collection('users').doc(userRecord.uid).set(userData).catch(err => {
      console.error('Firestore set user data error:', err);
      throw err;
    });

    await adminDb.collection('notifications').add({
      type: 'user_signup',
      message: `New user signed up: ${email}`,
      createdAt: adminDb.FieldValue.serverTimestamp(),
      details: { user_id: userRecord.uid, email },
    }).catch(err => {
      console.error('Firestore add notification error:', err);
      throw err;
    });

    await adminDb.collection('otps').doc(email).delete().catch(err => {
      console.error('Firestore delete OTP error:', err);
      throw err;
    });
    await adminAuth.generateEmailVerificationLink(email).catch(err => {
      console.error('Firebase email verification link error:', err);
      throw err;
    });

    console.log('User created successfully for email:', email);
    res.json({ success: true, message: 'Account created successfully.' });
  } catch (err) {
    console.error('Verify OTP error:', err.message || err);
    res.status(500).json({ success: false, error: err.message || 'Account creation failed.' });
  }
});

module.exports = router;

import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, setPersistence, browserSessionPersistence } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc, getDoc, addDoc, collection } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';
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

const generateUsername = (firstName, lastName) => {
  const nameParts = [firstName, lastName].filter(part => part?.trim());
  const firstPart = nameParts[0]?.slice(0, 4).toLowerCase() || 'user';
  const secondPart = nameParts[1]?.slice(0, 3).toLowerCase() || '';
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const usernameBase = (firstPart + secondPart).replace(/[^a-z0-9]/g, '');
  return usernameBase + randomNum;
};

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [phoneNumberError, setPhoneNumberError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [loadingEmail, setLoadingEmail] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [loadingFacebook, setLoadingFacebook] = useState(false);
  const [signupAttempts, setSignupAttempts] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    getRedirectResult(auth)
      .then(result => {
        if (result) handleSocialSignIn(result.user);
      })
      .catch(err => {
        setEmailError(getFriendlyErrorMessage(err));
        setLoadingGoogle(false);
        setLoadingFacebook(false);
      });
  }, []);

  const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = password => {
    const hasLength = password.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[_@!+=#$%^&*()[\]{}|;:,.<>?~`/-]/.test(password);
    return {
      isValid: hasLength && hasLetter && hasNumber && hasSpecialChar,
      errors: [
        !hasLength && 'Password needs 6+ chars.',
        !hasLetter && 'Password needs a letter.',
        !hasNumber && 'Password needs a number.',
        !hasSpecialChar && 'Password needs a special char (e.g., _, @, !).',
      ].filter(Boolean),
    };
  };

  const validatePhoneNumber = phoneNumber => {
    if (!phoneNumber.trim()) return true;
    return /^\+\d{7,15}$/.test(phoneNumber);
  };

  const handleSocialSignIn = async user => {
    try {
      const fullName = user.displayName || user.email.split('@')[0];
      const [firstNameFromSocial, ...rest] = fullName.split(' ');
      const lastNameFromSocial = rest.join(' ');
      const username = generateUsername(firstNameFromSocial, lastNameFromSocial);

      const userDocRef = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDocRef);

      let userData;
      if (!userSnapshot.exists()) {
        userData = {
          email: user.email,
          name: `${firstNameFromSocial} ${lastNameFromSocial}`,
          username,
          address: '',
          phoneNumber: '',
          createdAt: new Date().toISOString(),
          uid: user.uid,
          profileImage: user.photoURL || null,
        };
        await setDoc(userDocRef, userData);
        
        await addDoc(collection(db, 'notifications'), {
          type: 'user_signup',
          message: `New social user signed up: ${user.email}`,
          createdAt: new Date(),
          details: { user_id: user.uid, email: user.email },
        });
        await updateProfile(user, { displayName: username });
        if (!user.emailVerified) {
          await sendEmailVerification(user);
          console.log('Verification email sent:', user.email);
        }
      } else {
        userData = userSnapshot.data();
      }

      localStorage.setItem('userData', JSON.stringify(userData));
      localStorage.setItem('socialEmail', user.email);
      const firstName = firstNameFromSocial || userData.name.split(' ')[0];
      setSuccessMessage(`Welcome, ${firstName}! Please log in with Google.`);
      setTimeout(() => {
        setLoadingGoogle(false);
        setLoadingFacebook(false);
        navigate('/login', { state: { email: user.email } });
      }, 3000);
    } catch (err) {
      console.error('Social sign-in error:', err);
      setEmailError(getFriendlyErrorMessage(err));
      setLoadingGoogle(false);
      setLoadingFacebook(false);
    }
  };

  const handleRegister = async e => {
    e.preventDefault();
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError('');
    setPhoneNumberError('');
    setSuccessMessage('');
    setLoadingEmail(true);

    if (signupAttempts >= 9) {
      setEmailError('Too many attempts. Try later.');
      setLoadingEmail(false);
      return;
    }

    let hasError = false;
    if (!firstName.trim()) {
      setFirstNameError('First name required.');
      hasError = true;
    }
    if (!lastName.trim()) {
      setLastNameError('Last name required.');
      hasError = true;
    }
    if (!validateEmail(email)) {
      setEmailError('Invalid email.');
      hasError = true;
    }
    if (!password) {
      setPasswordError('Password required.');
      hasError = true;
    } else {
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.isValid) {
        setPasswordError(passwordValidation.errors[0]);
        hasError = true;
      }
    }
    if (phoneNumber && !validatePhoneNumber(phoneNumber)) {
      setPhoneNumberError('Invalid phone (e.g., +1234567890).');
      hasError = true;
    }

    if (hasError) {
      setLoadingEmail(false);
      setSignupAttempts(prev => prev + 1);
      return;
    }

    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const username = generateUsername(firstName, lastName);
      await updateProfile(user, { displayName: username });

      await sendEmailVerification(user);
      console.log('Verification email sent:', user.email);

      const userData = {
        email: user.email,
        name: `${firstName} ${lastName}`,
        username,
        address: '',
        phoneNumber: phoneNumber.trim() || '',
        createdAt: new Date().toISOString(),
        uid: user.uid,
        profileImage: null,
      };
      await setDoc(doc(db, 'users', user.uid), userData);

      await addDoc(collection(db, 'notifications'), {
        type: 'user_signup',
        message: `New user signed up: ${user.email}`,
        createdAt: new Date(),
        details: { user_id: user.uid, email: user.email },
      });

      localStorage.setItem('userData', JSON.stringify(userData));
      setSuccessMessage(`Welcome, ${firstName}! Verify your email at ${email} to log in.`);
      setSignupAttempts(0);
      setTimeout(() => {
        setLoadingEmail(false);
        navigate('/login');
      }, 7000);
    } catch (err) {
      console.error('Registration error:', err);
      setLoadingEmail(false);
      const errorMessage = getFriendlyErrorMessage(err);
      if (errorMessage.includes('email')) setEmailError(errorMessage);
      else if (errorMessage.includes('password')) setPasswordError(errorMessage);
      else {
        setFirstNameError(errorMessage);
        setLastNameError(errorMessage);
      }
      setSignupAttempts(prev => prev + 1);
    }
  };

  const handleGoogleSignIn = async () => {
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError('');
    setPhoneNumberError('');
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
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError('');
    setPhoneNumberError('');
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
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex space-x-4 mb-4">
              <div className="relative w-1/2">
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={e => setFirstName(e.target.value)}
                  className={`w-full p-3 border rounded-lg transition-all duration-300 ${firstNameError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'}`}
                  autoComplete="given-name"
                  required
                />
                <label
                  htmlFor="firstName"
                  className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${firstName ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''}`}
                >
                  First Name
                </label>
                {firstNameError && <p className="text-red-600 text-xs mt-1">{firstNameError}</p>}
              </div>
              <div className="relative w-1/2">
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={e => setLastName(e.target.value)}
                  className={`w-full p-3 border rounded-lg transition-all duration-300 ${lastNameError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'}`}
                  autoComplete="family-name"
                  required
                />
                <label
                  htmlFor="lastName"
                  className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${lastName ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''}`}
                >
                  Last Name
                </label>
                {lastNameError && <p className="text-red-600 text-xs mt-1">{lastNameError}</p>}
              </div>
            </div>
            <div className="relative">
              <input
                type="email"
                id="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${emailError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'}`}
                autoComplete="email"
                required
              />
              <label
                htmlFor="email"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${email ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''}`}
              >
                Email
              </label>
              {emailError && (
                <p className="text-red-600 text-xs mt-1">
                  {emailError}{' '}
                  {emailError.includes('already in use') && (
                    <Link to="/login" className="text-blue-600 hover:underline">Click here to login</Link>
                  )}
                </p>
              )}
            </div>
            <div className="relative">
              <input
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={e => setPhoneNumber(e.target.value)}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${phoneNumberError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'}`}
                autoComplete="tel"
              />
              <label
                htmlFor="phoneNumber"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${phoneNumber ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''}`}
              >
                Phone Number
              </label>
              {phoneNumberError && <p className="text-red-600 text-xs mt-1">{phoneNumberError}</p>}
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${passwordError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'}`}
                autoComplete="new-password"
                required
              />
              <label
                htmlFor="password"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${password ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''}`}
              >
                Password
              </label>
              <span
                className="absolute right-3 top-3 text-gray-500 cursor-pointer"
                onClick={() => setShowPassword(!showPassword)}
              >
                <i className={`bx ${showPassword ? 'bx-hide' : 'bx-show'} text-xl`}></i>
              </span>
              {passwordError && <p className="text-red-600 text-xs mt-1">{passwordError}</p>}
            </div>
            {successMessage && <p className="text-green-600 text-xs mb-4">{successMessage}</p>}
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
                className="bg-white border border-gray-300 p-3 rounded-lg flex items-center justify-center hover:bg-gray-100 transition duration-200"
                disabled={loadingGoogle}
              >
                <img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5 mr-2" />
                {loadingGoogle ? 'Processing...' : 'Google'}
              </button>
              <button
                onClick={handleFacebookSignIn}
                className="bg-white border border-gray-300 p-3 rounded-lg flex items-center justify-center hover:bg-gray-100 transition duration-200"
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