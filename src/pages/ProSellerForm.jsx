import React, { useState, useEffect } from 'react';
import { Building, User, CreditCard, Package, CheckCircle } from 'lucide-react';
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
  showOtpModal: false,
  otpVerified: false,
  sendingOtp: false,
};

const generateUsername = (firstName, lastName) => {
  const nameParts = [firstName, lastName].filter(part => part?.trim());
  const firstPart = nameParts[0]?.slice(0, 4).toLowerCase() || 'user';
  const secondPart = nameParts[1]?.slice(0, 3).toLowerCase() || '';
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  const usernameBase = (firstPart + secondPart).replace(/[^a-z0-9]/g, '');
  return usernameBase + randomNum;
};

const countries = [
  'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
  'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
  'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo (Congo-Brazzaville)', 'Costa Rica',
  'Croatia', 'Cuba', 'Cyprus', 'Czechia', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador', 'Egypt',
  'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France', 'Gabon',
  'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau', 'Guyana',
  'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland', 'Israel',
  'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Korea (North)', 'Korea (South)', 'Kuwait',
  'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
  'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
  'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru',
  'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Macedonia', 'Norway', 'Oman', 'Pakistan',
  'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe', 'Saudi Arabia',
  'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia', 'South Africa',
  'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria', 'Taiwan', 'Tajikistan',
  'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey', 'Turkmenistan', 'Tuvalu',
  'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu', 'Vatican City', 'Venezuela',
  'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
];

const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const ProSellerForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);
  const [banks, setBanks] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [banksLoading, setBanksLoading] = useState(true);
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
    if (field === 'otp' && typeof value !== 'string') {
      value = String(value || '');
    }
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      if (field === 'email') {
        newData.otpVerified = false;
        newData.otp = '';
      }
      return newData;
    });
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    if (field === 'regNumber') {
      const filteredValue = value.replace(/[^0-9]/g, '').slice(0, 8);
      setFormData(prev => ({ ...prev, regNumber: filteredValue }));
      validateRegNumber(filteredValue);
    }
  };

  const validateRegNumber = (value) => {
    setFormData(prev => ({ ...prev, regError: '', regVerified: false, regVerifying: false }));
    const isValid = /^\d{7,8}$/.test(value);
    if (!isValid && value) {
      setFormData(prev => ({ ...prev, regError: 'Registration number must be 7-8 digits' }));
    } else if (isValid) {
      setFormData(prev => ({ ...prev, regVerifying: true }));
      setTimeout(() => {
        setFormData(prev => ({ ...prev, regVerified: true, regVerifying: false }));
      }, 1500);
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
      if (!validateEmail(formData.email)) newErrors.email = 'Please enter a valid email address.';
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
      if (formData.signup && !formData.otpVerified) newErrors.email = 'Please verify your email with OTP';
    }
    if (step === 3) {
      if (!formData.productLines.length) newErrors.productLines = 'At least one product line is required';
      if (!formData.bankName) newErrors.bankName = 'Bank name is required';
      if (!formData.accountNumber) newErrors.accountNumber = 'Account number is required';
      if (!formData.agree) newErrors.agree = 'You must agree to the terms';
      if (formData.accountError) newErrors.accountNumber = formData.accountError;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOtp = async () => {
    if (!validateEmail(formData.email)) {
      setErrors(prev => ({ ...prev, email: 'Please enter a valid email address.' }));
      return false;
    }
    setFormData(prev => ({ ...prev, sendingOtp: true }));
    try {
      const response = await fetch(`${backendUrl}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (data.success) {
        addAlert('Check your email for a verification code.', 'success');
        setFormData(prev => ({ ...prev, showOtpModal: true, otp: '', sendingOtp: false }));
        return true;
      } else {
        setErrors(prev => ({ ...prev, email: data.error || 'Failed to send OTP. Please try again.' }));
        setFormData(prev => ({ ...prev, sendingOtp: false }));
        return false;
      }
    } catch (err) {
      console.error('Send OTP error:', err.message);
      setErrors(prev => ({ ...prev, email: 'Unable to send OTP. Check your connection or try again.' }));
      setFormData(prev => ({ ...prev, sendingOtp: false }));
      return false;
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setErrors(prev => ({ ...prev, otp: '' }));
    setIsSubmitting(true);
    if (!formData.otp.trim()) {
      setErrors(prev => ({ ...prev, otp: 'Please enter the verification code.' }));
      setIsSubmitting(false);
      return;
    }
    try {
      const response = await fetch(`${backendUrl}/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, otp: formData.otp }),
      });
      const data = await response.json();
      if (data.success) {
        setFormData(prev => ({ ...prev, showOtpModal: false, otpVerified: true, otp: '' }));
        setIsSubmitting(false);
        if (validateStep(currentStep)) {
          setCurrentStep(currentStep + 1);
        }
      } else {
        setErrors(prev => ({ ...prev, otp: data.error || 'Invalid or expired code. Please try again.' }));
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error('Verify OTP error:', err.message);
      setErrors(prev => ({ ...prev, otp: 'Verification failed. Check your connection or try again.' }));
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setIsSubmitting(true);
    setFormData(prev => ({ ...prev, sendingOtp: true }));
    try {
      const response = await fetch(`${backendUrl}/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email }),
      });
      const data = await response.json();
      if (data.success) {
        addAlert('New verification code sent to your email.', 'success');
        setFormData(prev => ({ ...prev, otp: '', sendingOtp: false }));
      } else {
        setErrors(prev => ({ ...prev, email: data.error || 'Failed to send code. Please try again.' }));
        setFormData(prev => ({ ...prev, sendingOtp: false }));
      }
    } catch (err) {
      console.error('Resend OTP error:', err.message);
      setErrors(prev => ({ ...prev, email: 'Unable to send code. Check your network and try again.' }));
      setFormData(prev => ({ ...prev, sendingOtp: false }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinue = async () => {
    if (currentStep < 4) {
      if (validateStep(currentStep)) {
        setCurrentStep(currentStep + 1);
      }
    } else {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep(3)) {
      setIsSubmitting(false);
      return;
    }
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
            addAlert('Account and profile created successfully!', 'success');
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
      addAlert('Pro Seller application submitted successfully! We will review your application and get back to you soon.', 'success');
      setFormData(initialFormData);
      setCurrentStep(1);
      navigate('/profile');
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
                  {formData.regVerifying && <span className="ml-2 text-xs text-orange-500 animate-pulse">Verifying... <span className="ml-1 w-4 h-4 border-2 border-t-orange-500 border-orange-200 rounded-full animate-spin"></span></span>}
                  {formData.regVerified && !formData.regError && <CheckCircle className="ml-2 w-5 h-5 text-green-500" />}
                  {formData.regError && <span className="ml-2 text-xs text-red-500">{formData.regError}</span>}
                </label>
                <input
                  type="text"
                  placeholder="7-8 digits (e.g., 1234567)"
                  value={formData.regNumber}
                  onChange={e => handleInputChange('regNumber', e.target.value)}
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
                <select
                  value={formData.country}
                  onChange={e => {
                    handleInputChange('country', e.target.value);
                    handleInputChange('regNumber', '');
                    setFormData(prev => ({ ...prev, regError: '', regVerified: false }));
                  }}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.country ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Country</option>
                  {countries.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
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
                <div className="relative">
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={formData.email}
                    onChange={e => handleInputChange('email', e.target.value)}
                    className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    } ${formData.signup ? (formData.otpVerified ? 'pr-10' : 'pr-20') : ''}`}
                  />
                  {formData.signup && !formData.otpVerified && (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      disabled={formData.sendingOtp || !validateEmail(formData.email)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-orange-500 text-white px-3 py-1 rounded-md text-sm font-medium hover:bg-orange-600 disabled:opacity-50"
                    >
                      {formData.sendingOtp ? 'Sending...' : 'Verify'}
                    </button>
                  )}
                  {formData.signup && formData.otpVerified && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-500 animate-pulse" />
                  )}
                </div>
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
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Bank Name <span className="text-red-500">*</span></label>
                <select
                  value={formData.bankCode}
                  onChange={e => {
                    const selected = banks.find(b => b.code === e.target.value);
                    handleInputChange('bankCode', e.target.value);
                    handleInputChange('bankName', selected ? selected.name : '');
                  }}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    errors.bankName ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select Bank</option>
                  {banksLoading ? (
                    <option value="">Loading banks...</option>
                  ) : banks.length > 0 ? (
                    banks.map((bank, idx) => (
                      <option key={bank.code || idx} value={bank.code}>{bank.name}</option>
                    ))
                  ) : (
                    <option value="">No banks available.</option>
                  )}
                </select>
                {errors.bankName && <p className="text-red-500 text-xs mt-1">{errors.bankName}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">
                  Account Number <span className="text-red-500">*</span>
                  {formData.accountVerifying && <span className="ml-2 text-xs text-orange-500 animate-pulse">Verifying...</span>}
                  {formData.accountVerified && !formData.accountError && <CheckCircle className="ml-2 w-5 h-5 text-green-500" />}
                  {formData.accountError && <span className="ml-2 text-xs text-red-500">{formData.accountError}</span>}
                </label>
                <input
                  type="text"
                  placeholder="Account Number"
                  value={formData.accountNumber}
                  onChange={e => handleInputChange('accountNumber', e.target.value)}
                  onBlur={handleAccountNumberBlur}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${
                    formData.accountError ? 'border-red-500' : formData.accountVerified ? 'border-green-500' : errors.accountNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {formData.accountName && (
                  <div className="mt-2 flex items-center text-green-600 text-sm font-semibold">
                    <CheckCircle className="w-5 h-5 mr-1" />
                    {formData.accountName}
                  </div>
                )}
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
                <div><span className="font-semibold">Bank:</span> {formData.bankName}</div>
                <div>
                  <span className="font-semibold">Account Number:</span> {formData.accountNumber}{' '}
                  {formData.accountVerified && <CheckCircle className="inline w-4 h-4 text-green-500 ml-1" />}
                </div>
                <div><span className="font-semibold">Account Name:</span> {formData.accountName || 'Not verified'}</div>
                <div><span className="font-semibold">Agreed to Terms:</span> {formData.agree ? 'Yes' : 'No'}</div>
              </div>
              <div className="text-xs text-gray-500 text-center">By submitting, you confirm all information is correct and consent to verification.</div>
            </div>
          )}
          {formData.showOtpModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="m-4 bg-white p-6 rounded-lg w-full max-w-md animate-slide-up">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-lg font-semibold">Verify Your Email</h3>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, showOtpModal: false, otp: '' }))}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <i className="bx bx-x text-[24px]"></i>
                  </button>
                </div>
                <p className="text-gray-600 mb-4 text-sm text-center">Enter the 6-digit code sent to your email {formData.email}.</p>
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="flex justify-between gap-2">
                    {Array(6).fill().map((_, index) => (
                      <input
                        key={index}
                        type="text"
                        maxLength="1"
                        value={formData.otp[index] || ''}
                        onChange={(e) => {
                          const newOtp = formData.otp.split('');
                          newOtp[index] = e.target.value.replace(/[^0-9]/g, '').slice(0, 1);
                          handleInputChange('otp', newOtp.join(''));
                          if (e.target.value && index < 5) {
                            document.getElementsByTagName('input')[index + 1].focus();
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Backspace' && !formData.otp[index] && index > 0) {
                            document.getElementsByTagName('input')[index - 1].focus();
                          }
                        }}
                        className="w-12 h-12 text-center border rounded-lg focus:border-blue-500 focus:outline-none text-2xl font-medium"
                        required
                      />
                    ))}
                  </div>
                  {errors.otp && <p className="text-red-600 text-xs mt-1">{errors.otp}</p>}
                  <button
                    type="submit"
                    className="w-full bg-slate-600 text-white p-3 rounded-lg hover:bg-blue-800 transition duration-200"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Verifying...' : 'Verify Code'}
                  </button>
                  <p className="text-center text-gray-600 mt-2 text-sm">
                    Didn’t receive a code?{' '}
                    <button
                      onClick={handleResendOtp}
                      className="text-blue-600 hover:underline"
                      disabled={isSubmitting || formData.sendingOtp}
                    >
                      {formData.sendingOtp ? 'Sending...' : 'Resend'}
                    </button>
                  </p>
                </form>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  const steps = [
    { label: 'Business Info' },
    { label: 'Contact Info' },
    { label: 'Products & Banking' },
    { label: 'Review & Submit' },
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center py-8 px-2 sm:px-4">
      <CustomAlert alerts={alerts} removeAlert={removeAlert} />
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
                {steps.map((step, idx) => (
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
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-1 rounded-full ${idx < currentStep - 1 ? 'bg-orange-600' : 'bg-gray-200'}`}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-between w-full px-1">
                {steps.map((step, idx) => (
                  <span
                    key={step.label}
                    className={`text-[10px] font-semibold uppercase tracking-wide text-center flex-1 ${
                      idx === currentStep - 1 ? 'text-orange-700' : 'text-gray-400'
                    }`}
                  >
                    {step.label}
                  </span>
                ))}
              </div>
            </div>
            <div className="hidden sm:flex items-center justify-center mb-10 gap-4">
              {steps.map((step, idx) => (
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
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-1 mx-2 rounded-full ${idx < currentStep - 1 ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>
                  )}
                </React.Fragment>
              ))}
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
                    >
                      Back
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting || formData.sendingOtp}
                    className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-extrabold text-base sm:text-lg shadow-lg hover:from-orange-600 hover:to-orange-700 focus:ring-4 focus:ring-orange-200 transition border-2 border-orange-500 disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? 'Submitting...' : currentStep < 4 ? 'Continue' : 'Submit'}
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