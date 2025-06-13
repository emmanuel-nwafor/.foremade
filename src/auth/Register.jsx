import React, { useState, useEffect } from 'react';
import { GoogleAuthProvider, FacebookAuthProvider, signInWithRedirect, getRedirectResult, createUserWithEmailAndPassword, updateProfile, sendEmailVerification, setPersistence, browserSessionPersistence } from 'firebase/auth';
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

const generateUsername = (firstName, lastName) => {
  const nameParts = [firstName, lastName].filter(part => part && part.trim());
  const firstPart = nameParts[0] ? nameParts[0].slice(0, 4).toLowerCase() : 'user';
  const secondPart = nameParts[1] ? nameParts[1].slice(0, 3).toLowerCase() : '';
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
      .then((result) => {
        if (result) {
          const user = result.user;
          handleSocialSignIn(user);
        }
      })
      .catch((err) => {
        setEmailError(getFriendlyErrorMessage(err));
        setLoadingGoogle(false);
        setLoadingFacebook(false);
      });
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validatePassword = (password) => {
    const hasLength = password.length >= 6;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[_@!+=#$%^&*()[\]{}|;:,.<>?~`/-]/.test(password);
    return {
      isValid: hasLength && hasLetter && hasNumber && hasSpecialChar,
      errors: [
        !hasLength && 'Password must be at least 6 characters.',
        !hasLetter && 'Password must include at least one letter.',
        !hasNumber && 'Password must include at least one number.',
        !hasSpecialChar && 'Password must include at least one special character (e.g., _, @, !, +, =).',
      ].filter(Boolean),
    };
  };

  const validatePhoneNumber = (phoneNumber) => {
    if (!phoneNumber.trim()) return true; // Empty is valid since it's optional
    const phoneRegex = /^\+\d{7,15}$/;
    return phoneRegex.test(phoneNumber);
  };

  // const  handleNavigation = () => {
  //   navigate('/login', { replace: true });
  // };
  

  const handleSocialSignIn = async (user) => {
    try {
      const fullName = user.displayName || user.email.split('@')[0];
      const [firstNameFromSocial, ...rest] = fullName.split(' ');
      const lastNameFromSocial = rest.join(' ');
      const username = generateUsername(firstNameFromSocial, lastNameFromSocial);
      await updateProfile(user, { displayName: username });

      if (!user.emailVerified) {
        await sendEmailVerification(user);
        console.log('Verification email sent to:', user.email);
      }

      const userDoc = doc(db, 'users', user.uid);
      const userSnapshot = await getDoc(userDoc);
      let userData;
      if (!userSnapshot.exists()) {
        userData = {
          email: user.email,
          name: `${firstNameFromSocial} ${lastNameFromSocial}`,
          username: username,
          address: '',
          phoneNumber: '',
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

      const firstName = firstNameFromSocial || userData.name.split(' ')[0];
      setSuccessMessage(`Welcome, ${firstName}! ${!user.emailVerified ? 'A verification email has been sent. Please verify before logging in.' : 'You are now signed up!'}`);
      setTimeout(() => {
        setLoadingGoogle(false);
        setLoadingFacebook(false);
        navigate('/profile');
      }, 3000);
    } catch (err) {
      setEmailError(getFriendlyErrorMessage(err));
      setLoadingGoogle(false);
      setLoadingFacebook(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setFirstNameError('');
    setLastNameError('');
    setEmailError('');
    setPasswordError('');
    setPhoneNumberError('');
    setSuccessMessage('');
    setLoadingEmail(true);

    if (signupAttempts >= 9) {
      setEmailError('Too many signup attempts. Try again later.');
      setLoadingEmail(false);
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
      setPhoneNumberError('Please enter a valid phone number (e.g., +1234567890).');
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
      console.log('Verification email sent to:', user.email);

      const userData = {
        email: user.email,
        name: `${firstName} ${lastName}`,
        username: username,
        address: '',
        phoneNumber: phoneNumber.trim() || '',
        createdAt: new Date().toISOString(),
        uid: user.uid,
        profileImage: null,
      };
      await setDoc(doc(db, 'users', user.uid), userData);
      localStorage.setItem('userData', JSON.stringify(userData));

      setSuccessMessage(`Welcome, ${firstName}! Registration successful! A verification email has been sent to ${email}. Please verify your email before logging in.`);
      setSignupAttempts(0);
      setTimeout(() => {
        setLoadingEmail(false);
        navigate('/login');
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
            <h1 className="text-3xl font-bold mb-4 flex-col items-center">
              Join <img src={logo} alt="Formade logo" className="h-20" />
            </h1>
            <p className="text-lg text-center">Where quality meet NEEDS!</p>
          </div>
        </div>

        <div className="w-full md:w-1/2 h-full p-9 flex flex-col justify-center bg-white">
          <h2 className="text-2xl font-semibold text-gray-800 mb-2">Sign Up</h2>
          <p className="text-gray-600 mb-6">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline">
              Sign In
            </Link>
          </p>

          <form onSubmit={handleRegister} className="space-y-4">
            <div className="flex space-x-4 mb-4">
              <div className="relative w-1/2">
                <input
                  type="text"
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={`w-full p-3 border rounded-lg transition-all duration-300 ${
                    firstNameError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'
                  }`}
                  autoComplete="given-name"
                  required
                />
                <label
                  htmlFor="firstName"
                  className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-1 ${
                    firstName ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                  }`}
                >
                  First Name
                </label>
                {firstNameError && <p className="text-red-600 text-[10px] mt-1">{firstNameError}</p>}
              </div>
              <div className="relative w-1/2">
                <input
                  type="text"
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className={`w-full p-3 border rounded-lg transition-all duration-300 ${
                    lastNameError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'
                  }`}
                  autoComplete="family-name"
                  required
                />
                <label
                  htmlFor="lastName"
                  className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-1 ${
                    lastName ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                  }`}
                >
                  Last Name
                </label>
                {lastNameError && <p className="text-red-600 text-[10px] mt-1">{lastNameError}</p>}
              </div>
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
                type="tel"
                id="phoneNumber"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className={`w-full p-3 border rounded-lg transition-all duration-300 ${
                  phoneNumberError ? 'border-red-500' : successMessage ? 'border-green-500' : 'border-gray-300'
                }`}
                autoComplete="tel"
              />
              <label
                htmlFor="phoneNumber"
                className={`absolute left-3 top-3 text-gray-500 transition-all duration-300 transform origin-left pointer-events-none peer-focus:-translate-y-6 peer-focus:scale-75 peer-focus:text-blue-500 peer-focus:bg-white peer-focus:px-1 ${
                  phoneNumber ? '-translate-y-6 scale-75 text-blue-500 bg-white px-1' : ''
                }`}
              >
                Phone Number
              </label>
              {phoneNumberError && <p className="text-red-600 text-[10px] mt-1">{phoneNumberError}</p>}
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