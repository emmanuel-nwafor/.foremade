import React, { useState, useEffect } from 'react';
import { Building, User, Package, CheckCircle, Mail } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomAlert, { useAlerts } from '../components/common/CustomAlert';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile, getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const initialFormData = {
  businessName: '',
  regNumber: '',
  regVerified: false,
  regVerifying: false,
  regError: '',
  taxRef: '',
  taxVerified: false,
  taxVerifying: false,
  taxError: '',
  address: '',
  country: 'Nigeria',
  phone: '',
  phoneCode: '+234',
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  manager: '',
  managerEmail: '',
  managerPhone: '',
  productLines: [],
  categories: [],
  bankName: '',
  bankCode: '',
  accountNumber: '',
  accountName: '',
  accountVerified: false,
  accountVerifying: false,
  accountError: '',
  agree: false,
  signup: false,
  otp: '',
};

const generateUsername = (firstName, lastName) => {
  const nameParts = [firstName, lastName].filter(part => part?.trim());
  const firstPart = nameParts[0]?.slice(0, 4).toLowerCase() || 'user';
  const secondPart = nameParts[1]?.slice(0, 3).toLowerCase() || '';
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const usernameBase = (firstPart + secondPart).replace(/[^a-z0-9]/g, '');
  return usernameBase + randomNum;
};

// Popup component for successful submission
const SuccessPopup = ({ isOpen, onClose, onConfirm }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl border border-orange-200 dark:border-gray-700"
            initial={{ scale: 0.8, y: 50, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, y: 50, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
          >
            <div className="flex items-center justify-center mb-4">
              <CheckCircle className="w-12 h-12 text-green-500" />
            </div>
            <h2 className="text-xl font-bold text-orange-800 dark:text-orange-400 text-center mb-4">
              Pro Seller Account Created Successfully!
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
              Would you like to complete your onboarding process by providing your account details?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={onConfirm}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-bold text-base shadow-lg hover:from-orange-600 hover:to-orange-700 focus:ring-4 focus:ring-orange-200 transition"
              >
                Yes
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 rounded-xl bg-orange-100 text-orange-700 font-bold text-base shadow hover:bg-orange-200 transition border-2 border-orange-200"
              >
                No
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const ProSellerForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [banks, setBanks] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [banksLoading, setBanksLoading] = useState(true);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const { alerts, addAlert, removeAlert } = useAlerts();
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://foremade-backend.onrender.com';

  useEffect(() => {
    let didCancel = false;
    setCategoriesLoading(true);
    setBanksLoading(true);
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        if (!didCancel) {
          setCategories(data);
          setCategoriesLoading(false);
        }
      })
      .catch(err => {
        if (!didCancel) {
          setCategories([
            { name: 'Electronics' },
            { name: 'Fashion' },
            { name: 'Home & Living' },
            { name: 'Beauty' },
            { name: 'Sports' },
            { name: 'Automotive' },
            { name: 'Books' },
            { name: 'Toys' },
            { name: 'Groceries' },
            { name: 'Health' },
          ]);
          setCategoriesLoading(false);
        }
      });
    fetch(`${backendUrl}/fetch-banks`)
      .then(res => res.json())
      .then(data => {
        if (!didCancel) {
          setBanks(data);
          setBanksLoading(false);
        }
      })
      .catch(err => {
        if (!didCancel) {
          setBanks([
            { code: '044', name: 'Access Bank' },
            { code: '063', name: 'Diamond Bank' },
            { code: '050', name: 'Ecobank' },
            { code: '011', name: 'First Bank' },
            { code: '033', name: 'United Bank for Africa' },
          ]);
          setBanksLoading(false);
          addAlert('Failed to fetch banks. Using fallback data.', 'error');
        }
      });
    return () => { didCancel = true; };
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (field === 'regNumber') {
      validateRegNumber(value);
    }
  };

  const validateRegNumber = (value) => {
    const isValid = /^\d{7,8}$/.test(value);
    if (!isValid && value) {
      setFormData(prev => ({ ...prev, regError: 'Registration number must be 7-8 digits' }));
    } else {
      setFormData(prev => ({ ...prev, regError: '', regVerified: isValid }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.businessName) newErrors.businessName = 'Business name is required';
      if (!formData.regNumber) newErrors.regNumber = 'Registration number is required';
      if (formData.regError) newErrors.regNumber = formData.regError;
      if (!formData.address) newErrors.address = 'Business address is required';
      if (!formData.country) newErrors.country = 'Country is required';
    }
    if (step === 2) {
      if (!formData.firstName) newErrors.firstName = 'First name is required';
      if (!formData.lastName) newErrors.lastName = 'Last name is required';
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (formData.signup && !formData.password) newErrors.password = 'Password is required for signup';
      if (!formData.manager) newErrors.manager = 'Manager name is required';
      if (!formData.managerEmail) newErrors.managerEmail = 'Manager email is required';
      if (
        formData.managerEmail &&
        formData.email &&
        formData.managerEmail.trim().toLowerCase() === formData.email.trim().toLowerCase()
      ) {
        newErrors.managerEmail = 'Manager/Company email must be different from your personal email';
      }
    }
    if (step === 3) {
      if (!formData.productLines.length) newErrors.productLines = 'At least one product line is required';
      if (!formData.agree) newErrors.agree = 'You must agree to the terms';
    }
    if (step === 5) {
      if (!formData.otp) newErrors.otp = 'Verification code is required';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const sendOtp = async () => {
    try {
      const response = await fetch(`${backendUrl}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to send OTP');
      }
      setOtpSent(true);
      addAlert('OTP sent to your email. Please check your inbox.', 'success');
    } catch (error) {
      console.error('Send OTP error:', error);
      addAlert(`Failed to send OTP: ${error.message}. Please try again.`, 'error');
      setIsSubmitting(false);
    }
  };

  const verifyOtp = async () => {
    setOtpVerifying(true);
    try {
      const response = await fetch(`${backendUrl}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: formData.otp }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'OTP verification failed');
      }
      return true;
    } catch (error) {
      console.error('Verify OTP error:', error);
      addAlert(error.message, 'error');
      return false;
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleContinue = async () => {
    if (currentStep < 4) {
      if (validateStep(currentStep)) {
        setCurrentStep(currentStep + 1);
      }
    } else if (currentStep === 4) {
      if (validateStep(4)) {
        if (formData.signup && !user) {
          await sendOtp();
          if (otpSent) {
            setCurrentStep(5); // Move to OTP verification step
          }
        } else {
          await handleSubmit();
        }
      }
    } else if (currentStep === 5) {
      if (validateStep(5)) {
        const verified = await verifyOtp();
        if (verified) {
          await handleSubmit();
        }
      }
    }
  };

  const handleResendOtp = async () => {
    try {
      const response = await fetch(`${backendUrl}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to resend OTP');
      }
      addAlert('New OTP sent to your email. Please check your inbox.', 'success');
    } catch (error) {
      console.error('Resend OTP error:', error);
      addAlert(`Failed to resend OTP: ${error.message}. Please try again.`, 'error');
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      let uid = user?.uid;
      let idToken = null;

      const currentAuth = getAuth();
      const currentUser = currentAuth.currentUser;

      if (!currentUser && formData.signup && formData.email && formData.password) {
        const credential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        uid = credential.user.uid;
        idToken = await credential.user.getIdToken(true);
        await updateProfile(credential.user, { displayName: `${formData.firstName} ${formData.lastName}` });
        if (typeof setUser === 'function') {
          setUser(credential.user);
        } else {
          console.warn('setUser is not a function. Skipping auth context update.');
        }

        const username = generateUsername(formData.firstName, formData.lastName);
        const userDocRef = doc(db, 'users', uid);
        let attempts = 0;
        const maxAttempts = 3;
        while (attempts < maxAttempts) {
          try {
            await setDoc(userDocRef, {
              email: formData.email,
              username,
              firstName: formData.firstName,
              lastName: formData.lastName,
              createdAt: new Date().toISOString(),
              phoneNumber: formData.phoneCode + formData.phone,
              country: formData.country,
              addresses: [{ street: formData.address, city: '', state: '', postalCode: '', country: formData.country }],
              proStatus: 'pending',
            }, { merge: true });
            break;
          } catch (error) {
            attempts++;
            if (attempts === maxAttempts) {
              console.error('Firestore profile creation failed after retries:', error);
              throw new Error('Failed to create user profile in Firestore after multiple attempts.');
            }
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      } else if (currentUser) {
        uid = currentUser.uid;
        try {
          idToken = await currentUser.getIdToken(true);
        } catch (error) {
          if (error.code === 'auth/user-token-expired') {
            addAlert('Your session has expired. Please sign in again.', 'error');
            navigate('/login');
            return;
          }
          throw error;
        }
      } else {
        throw new Error('No authenticated user found and signup not selected.');
      }

      const submissionData = {
        ...formData,
        submittedAt: new Date().toISOString(),
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        formType: 'Pro Seller Application',
        uid: uid || `guest_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      };

      const response = await fetch(`${backendUrl}/api/pro-seller`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify(submissionData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || result.message || 'Submission failed');
      }

      setFormData(initialFormData);
      setCurrentStep(1);
      setOtpSent(false);
      setShowSuccessPopup(true); // Show the success popup
    } catch (error) {
      console.error('Submission error:', error.message, error);
      if (error.code === 'auth/user-token-expired') {
        addAlert('Your session has expired. Please sign in again.', 'error');
        navigate('/login');
      } else {
        addAlert(`There was an error submitting your application: ${error.message}. Please try again or contact support.`, 'error');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePopupClose = () => {
    setShowSuccessPopup(false);
    navigate('/profile');
  };

  const handlePopupConfirm = () => {
    setShowSuccessPopup(false);
    navigate('/seller-onboarding');
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRegNumberBlur = () => {
    validateRegNumber(formData.regNumber);
  };

  const handleTaxRefBlur = () => {
    setFormData(prev => ({ ...prev, taxError: '', taxVerified: true }));
  };

  const handleAccountNumberBlur = async () => {
    if (!formData.accountNumber || !formData.bankCode) return;
    setFormData(prev => ({ ...prev, accountVerifying: true, accountError: '', accountVerified: false, accountName: '' }));
    try {
      const payload = { accountNumber: formData.accountNumber, bankCode: formData.bankCode };
      const res = await fetch(`${backendUrl}/verify-bank-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok && (data.accountName || data.account_name)) {
        setFormData(prev => ({ ...prev, accountVerified: true, accountVerifying: false, accountError: '', accountName: data.accountName || data.account_name }));
      } else {
        setFormData(prev => ({ ...prev, accountVerified: false, accountVerifying: false, accountError: data.message || 'Verification failed.', accountName: '' }));
      }
    } catch (err) {
      setFormData(prev => ({ ...prev, accountVerified: false, accountVerifying: false, accountError: 'Network or server error.', accountName: '' }));
      console.error('Bank account verification error:', err);
    }
  };

  const renderStepContent = () => {
    const variants = {
      enter: { x: 50, opacity: 0 },
      center: { x: 0, opacity: 1 },
      exit: { x: -50, opacity: 0 },
    };
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="mb-6 text-center">
                <Building className="w-6 h-6 text-orange-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-orange-800 mb-2">Business Information</h2>
                <p className="text-orange-600">Let's start with your business details</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Business Name"
                  value={formData.businessName}
                  onChange={e => handleInputChange('businessName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.businessName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.businessName && <p className="text-red-500 text-xs mt-1">{errors.businessName}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  Registration Number <span className="text-red-500">*</span>
                  {formData.regVerifying && <span className="ml-2 text-xs text-orange-500 animate-pulse">Verifying...</span>}
                  {formData.regVerified && !formData.regError && <CheckCircle className="ml-2 w-5 h-5 text-green-500" />}
                  {formData.regError && <span className="ml-2 text-xs text-red-500">{formData.regError}</span>}
                </label>
                <input
                  type="text"
                  placeholder="7-8 digits (e.g., 1234567)"
                  value={formData.regNumber}
                  onChange={e => {
                    const value = e.target.value;
                    const filteredValue = value.replace(/[^0-9]/g, '').slice(0, 8);
                    handleInputChange('regNumber', filteredValue);
                  }}
                  onBlur={handleRegNumberBlur}
                  pattern="\d{7,8}"
                  title="Must be 7-8 digits"
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    formData.regError ? 'border-red-500' : formData.regVerified ? 'border-green-500' : errors.regNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                  required
                />
                {errors.regNumber && <p className="text-red-500 text-xs mt-1">{errors.regNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tax Reference (Optional)
                  {formData.taxVerifying && <span className="ml-2 text-xs text-orange-500 animate-pulse">Verifying...</span>}
                  {formData.taxVerified && !formData.taxError && <CheckCircle className="ml-2 w-5 h-5 text-green-500" />}
                  {formData.taxError && <span className="ml-2 text-xs text-red-500">{formData.taxError}</span>}
                </label>
                <input
                  type="text"
                  placeholder="Tax Reference (optional)"
                  value={formData.taxRef}
                  onChange={e => handleInputChange('taxRef', e.target.value)}
                  onBlur={handleTaxRefBlur}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    formData.taxError ? 'border-red-500' : formData.taxVerified ? 'border-green-500' : 'border-gray-300'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Address <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Business Address"
                  value={formData.address}
                  onChange={e => handleInputChange('address', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Country"
                  value={formData.country}
                  onChange={e => {
                    handleInputChange('country', e.target.value);
                    handleInputChange('regNumber', '');
                    setFormData(prev => ({ ...prev, regError: '', regVerified: false }));
                  }}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.country ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="mb-6 text-center">
                <User className="w-6 h-6 text-orange-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-orange-800 mb-2">Contact Information</h2>
                <p className="text-orange-600">How can we reach you? <span className="text-sm text-gray-500">(Sign up option available)</span></p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">First Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={e => handleInputChange('firstName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.firstName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Last Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={e => handleInputChange('lastName', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.lastName ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Phone Number"
                  value={formData.phone}
                  onChange={e => handleInputChange('phone', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={e => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.signup}
                  onChange={e => handleInputChange('signup', e.target.checked)}
                  className="accent-orange-500 w-4 h-4"
                />
                <label className="text-sm text-gray-700">Create an account with this email</label>
              </div>
              {formData.signup && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Password <span className="text-red-500">*</span></label>
                  <input
                    type="password"
                    placeholder="Password"
                    value={formData.password}
                    onChange={e => handleInputChange('password', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Manager Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Manager Name"
                  value={formData.manager}
                  onChange={e => handleInputChange('manager', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.manager ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.manager && <p className="text-red-500 text-xs mt-1">{errors.manager}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Manager Email <span className="text-red-500">*</span></label>
                <input
                  type="email"
                  placeholder="Manager Email"
                  value={formData.managerEmail}
                  onChange={e => handleInputChange('managerEmail', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.managerEmail ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.managerEmail && <p className="text-red-500 text-xs mt-1">{errors.managerEmail}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Manager Phone <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Manager Phone"
                  value={formData.managerPhone}
                  onChange={e => handleInputChange('managerPhone', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.managerPhone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.managerPhone && <p className="text-red-500 text-xs mt-1">{errors.managerPhone}</p>}
              </div>
            </div>
          )}
          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="mb-6 text-center">
                <Package className="w-6 h-6 text-orange-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-orange-800 mb-2">Products & Banking</h2>
                <p className="text-orange-600">Tell us about your products and banking details</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Product Line <span className="text-red-500">*</span></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {categoriesLoading ? (
                    <span className="text-gray-400 italic">Loading categories...</span>
                  ) : categories.length > 0 ? (
                    categories.map((cat, idx) => (
                      <label
                        key={cat.value || cat.code || cat.name || idx}
                        className="flex items-center space-x-2 bg-orange-50 rounded-lg px-3 py-2 cursor-pointer hover:bg-orange-100 transition"
                      >
                        <input
                          type="checkbox"
                          checked={formData.productLines.includes(cat.value || cat.name || cat)}
                          onChange={e => {
                            let newLines = formData.productLines.includes(cat.value || cat.name || cat)
                              ? formData.productLines.filter(v => v !== (cat.value || cat.name || cat))
                              : [...formData.productLines, cat.value || cat.name || cat];
                            handleInputChange('productLines', newLines);
                          }}
                          className="accent-orange-500 w-4 h-4"
                        />
                        <span className="text-sm">{cat.label || cat.name || cat}</span>
                      </label>
                    ))
                  ) : (
                    <span className="text-gray-400 italic">No categories available.</span>
                  )}
                </div>
                {errors.productLines && <p className="text-red-500 text-xs mt-1">{errors.productLines}</p>}
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.agree}
                  onChange={e => handleInputChange('agree', e.target.checked)}
                  className="accent-orange-500 w-4 h-4"
                />
                <label className="text-sm text-gray-700">
                  I agree to the
                  <Link
                    to="/terms-conditions"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-orange-600 underline hover:text-orange-800 ml-1"
                  >
                    Pro Seller Terms & Conditions
                  </Link>
                  <span className="text-red-500">*</span>
                </label>
                {errors.agree && <p className="text-red-500 text-xs mt-1">{errors.agree}</p>}
              </div>
            </div>
          )}
          {currentStep === 4 && (
            <div className="space-y-6">
              <div className="mb-6 text-center">
                <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-green-700 mb-2">Review & Submit</h2>
                <p className="text-green-600">Please review your information before submitting.</p>
              </div>
              <div className="bg-orange-50 rounded-xl p-4 shadow space-y-3 text-sm">
                <div><span className="font-semibold">Business Name:</span> {formData.businessName}</div>
                <div>
                  <span className="font-semibold">Registration Number:</span> {formData.regNumber}{' '}
                  {formData.regVerified && <CheckCircle className="inline w-4 h-4 text-green-500 ml-1" />}
                </div>
                <div>
                  <span className="font-semibold">Tax Reference:</span> {formData.taxRef || 'Not provided'}{' '}
                  {formData.taxVerified && <CheckCircle className="inline w-4 h-4 text-green-500 ml-1" />}
                </div>
                <div><span className="font-semibold">Business Address:</span> {formData.address}</div>
                <div><span className="font-semibold">Country:</span> {formData.country}</div>
                <div><span className="font-semibold">First Name:</span> {formData.firstName}</div>
                <div><span className="font-semibold">Last Name:</span> {formData.lastName}</div>
                <div><span className="font-semibold">Phone:</span> {formData.phoneCode} {formData.phone}</div>
                <div><span className="font-semibold">Email:</span> {formData.email}</div>
                {formData.signup && <div><span className="font-semibold">Password:</span> [Set for new account]</div>}
                <div><span className="font-semibold">Manager:</span> {formData.manager}</div>
                <div><span className="font-semibold">Manager Email:</span> {formData.managerEmail}</div>
                <div><span className="font-semibold">Manager Phone:</span> {formData.managerPhone}</div>
                <div><span className="font-semibold">Product Lines:</span> {formData.productLines.join(', ') || 'None'}</div>
                <div><span className="font-semibold">Agreed to Terms:</span> {formData.agree ? 'Yes' : 'No'}</div>
              </div>
              <div className="text-xs text-gray-500 text-center">By submitting, you confirm all information is correct and consent to verification.</div>
            </div>
          )}
          {currentStep === 5 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="mb-6 text-center">
                <Mail className="w-6 h-6 text-orange-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-orange-800 mb-2">Verify Your Email</h2>
                <p className="text-orange-600">Enter the 6-digit code sent to {formData.email}</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Verification Code <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={formData.otp}
                  onChange={e => handleInputChange('otp', e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.otp ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.otp && <p className="text-red-500 text-xs mt-1">{errors.otp}</p>}
              </div>
              <div className="text-center">
                <button
                  onClick={handleResendOtp}
                  className="text-orange-600 underline hover:text-orange-800 text-sm"
                  disabled={otpVerifying}
                >
                  Resend OTP
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  const steps = [
    { label: 'Business' },
    { label: 'Contact' },
    { label: 'Product' },
    { label: 'Review' },
    { label: 'Verification', conditional: formData.signup && !user },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center py-8 px-2 sm:px-4">
      <CustomAlert alerts={alerts} removeAlert={removeAlert} />
      <SuccessPopup
        isOpen={showSuccessPopup}
        onClose={handlePopupClose}
        onConfirm={handlePopupConfirm}
      />
      <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 md:px-8">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-orange-100 dark:border-gray-800 overflow-hidden">
          <div className="px-4 sm:px-8 md:px-12 pt-10 pb-4 md:pt-14 md:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-orange-700 dark:text-orange-400 tracking-tight">
                Pro Seller Registration
              </h1>
              <CheckCircle className="w-9 h-9 text-orange-500 self-center" />
            </div>
            <div className="block sm:hidden mb-10">
              <div className="flex items-center w-full mb-2">
                {steps.map((step, idx) => {
                  if (step.conditional && !step.conditional) return null;
                  return (
                    <React.Fragment key={step.label}>
                      <div className="flex-1 flex flex-col items-center">
                        <div
                          className={`w-7 h-7 flex items-center justify-center rounded-full border-2 text-sm font-bold
                          ${
                            idx < currentStep - 1
                              ? 'border-orange-600 bg-orange-100 text-orange-600'
                              : idx === currentStep - 1
                              ? 'border-orange-700 bg-orange-200 text-orange-700'
                              : 'border-gray-200 bg-gray-100 text-gray-400'
                          }`}
                        >
                          {idx + 1}
                        </div>
                      </div>
                      {idx < steps.length - 1 && (!steps[idx + 1].conditional || steps[idx + 1].conditional) && (
                        <div className={`flex-1 h-1 mx-1 rounded-full ${idx < currentStep - 1 ? 'bg-orange-600' : 'bg-gray-200'}`}></div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
              <div className="flex justify-between w-full px-1">
                {steps.map((step, idx) => {
                  if (step.conditional && !step.conditional) return null;
                  return (
                    <span
                      key={step.label}
                      className={`text-[10px] font-semibold uppercase tracking-wide text-center flex-1 ${
                        idx === currentStep - 1 ? 'text-orange-700' : 'text-gray-400'
                      }`}
                    >
                      {step.label}
                    </span>
                  );
                })}
              </div>
            </div>
            <div className="hidden sm:flex items-center justify-center mb-10 gap-4">
              {steps.map((step, idx) => {
                if (step.conditional && !step.conditional) return null;
                return (
                  <React.Fragment key={step.label}>
                    <div
                      className={`flex flex-col items-center ${
                        idx < currentStep - 1
                          ? 'text-orange-600'
                          : idx === currentStep - 1
                          ? 'text-orange-700 font-bold dark:text-orange-300'
                          : 'text-gray-300 dark:text-gray-600'
                      }`}
                    >
                      <div
                        className={`w-9 h-9 flex items-center justify-center rounded-full border-4 ${
                          idx < currentStep - 1
                            ? 'border-orange-600 bg-orange-100'
                            : idx === currentStep - 1
                            ? 'border-orange-700 bg-orange-200 dark:bg-orange-900'
                            : 'border-gray-200 bg-gray-100 dark:bg-gray-800'
                        } text-lg font-bold`}
                      >
                        {idx + 1}
                      </div>
                      <span className="text-xs mt-2 font-semibold tracking-wide uppercase whitespace-nowrap">{step.label}</span>
                    </div>
                    {idx < steps.length - 1 && (!steps[idx + 1].conditional || steps[idx + 1].conditional) && (
                      <div className={`flex-1 h-1 mx-2 rounded-full ${idx < currentStep - 1 ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                    )}
                  </React.Fragment>
                );
              })}
            </div>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleContinue();
              }}
            >
              <div className="max-h-[60vh] md:max-h-[65vh] overflow-y-auto pb-4 custom-scrollbar px-1 md:px-2">
                {renderStepContent()}
              </div>
              <div className="sticky bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-gray-900 dark:via-gray-900/90 dark:to-transparent px-0 pt-6 pb-4 mt-8 border-t border-orange-100 dark:border-gray-800 shadow-2xl flex flex-col items-center gap-2">
                <div className="flex flex-col sm:flex-row w-full gap-3 sm:gap-4">
                  {currentStep > 1 && (
                    <button
                      type="button"
                      onClick={handleBack}
                      className="flex-1 px-6 py-3 rounded-xl bg-orange-100 text-orange-700 font-bold text-base sm:text-lg shadow hover:bg-orange-200 transition border-2 border-orange-200"
                      disabled={isSubmitting || otpVerifying}
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting || otpVerifying}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-extrabold text-base sm:text-lg shadow-lg hover:from-orange-600 hover:to-orange-700 focus:ring-4 focus:ring-orange-200 transition border-2 border-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting || otpVerifying
                      ? 'Processing...'
                      : currentStep < 4
                      ? 'Continue'
                      : currentStep === 4
                      ? formData.signup && !user
                        ? 'Send OTP'
                        : 'Submit'
                      : 'Verify OTP'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProSellerForm;