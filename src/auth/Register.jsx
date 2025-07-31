import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { 
  createUserWithEmailAndPassword, 
  sendEmailVerification 
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import logo from '../assets/logi.png';

// Validation functions
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validatePassword = (password) => {
  const hasLength = password.length >= 6;
  const hasLetter = /[a-zA-Z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecialChar = /[_@!+=#$%^&*()[\]{}|;:,.<>?~`/-]/.test(password);
  return {
    isValid: hasLength && hasLetter && hasNumber && hasSpecialChar,
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
  const navigate = useNavigate();

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

    // Debug log
    console.log('Registering with:', { email, password });

    try {
      const username = generateUsername(firstName, lastName);
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userData = {
        firstName,
        lastName,
        email,
        username,
        phoneNumber: phoneNumber || '',
        createdAt: new Date().toISOString(),
        uid: user.uid,
        role: 'Buyer', // Default role
      };
      await setDoc(doc(db, 'users', user.uid), userData);

      // Trigger backend to send OTP
      const response = await fetch(`${backendUrl}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (data.success) {
        setSuccessMessage('Account created! Check your email for a verification code.');
        setShowOtpModal(true); // Show OTP modal
      } else {
        setEmailError(data.error || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setEmailError(err.message.includes('email') ? 'This email is already in use or invalid. Try another.' : 'Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
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

    // Debug log
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
        setShowOtpModal(false);
        await sendEmailVerification(auth.currentUser); // Optional Firebase verification
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
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Sign Up</h2>
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
              {passwordError && <p className="text-red-600 text-xs mt-1">{passwordError}</p>}
            </div>
            {successMessage && <p className="text-green-600 text-xs mb-4">{successMessage}</p>}
            <button
              type="submit"
              className="w-full bg-slate-600 text-white p-3 rounded-lg hover:bg-blue-800 transition duration-200"
              disabled={loading}
            >
              {loading ? 'Registering...' : 'Sign Up'}
            </button>
          </form>

          {/* Animated OTP Modal */}
          {showOtpModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white p-6 rounded-lg w-full max-w-md animate-slide-up">
                <h3 className="text-xl font-semibold mb-4">Verify Your Email</h3>
                <p className="text-gray-600 mb-4">A verification code has been sent to {email}. Please enter it below.</p>
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="relative">
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className={`w-full p-3 border rounded-lg transition-all duration-300 ${otpError ? 'border-red-500' : 'border-gray-300'}`}
                      maxLength="6"
                      required
                    />
                    <label className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none ${otp ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''}`}>
                      Verification Code
                    </label>
                    {otpError && <p className="text-red-600 text-xs mt-1">{otpError}</p>}
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-slate-600 text-white p-3 rounded-lg hover:bg-blue-800 transition duration-200"
                    disabled={loading}
                  >
                    {loading ? 'Verifying...' : 'Verify Code'}
                  </button>
                  <p className="text-center text-gray-600 mt-2">
                    Didn’t receive a code?{' '}
                    <button
                      onClick={handleResendOtp}
                      className="text-blue-600 hover:underline"
                      disabled={loading}
                    >
                      Send a new code
                    </button>
                  </p>
                  {successMessage && <p className="text-green-600 text-xs mt-2">{successMessage}</p>}
                  <button
                    onClick={() => setShowOtpModal(false)}
                    className="mt-4 text-gray-500 hover:text-gray-700"
                  >
                    Close
                  </button>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}