import React, { useState, useEffect } from 'react';
import { Building, User, CreditCard, Package, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomAlert, { useAlerts } from '../components/common/CustomAlert';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';

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
  agree: false
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
  const { alerts, addAlert, removeAlert } = useAlerts();
  const { user } = useAuth();

  // Fetch categories and banks on mount
  useEffect(() => {
    let didCancel = false;
    setCategoriesLoading(true);
    setBanksLoading(true);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
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
          setBanks([]);
          setBanksLoading(false);
        }
      });
    return () => { didCancel = true; };
  }, []);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    if (step === 1) {
      if (!formData.businessName) newErrors.businessName = 'Business name is required';
      if (!formData.regNumber) newErrors.regNumber = 'Registration number is required';
      if (!formData.address) newErrors.address = 'Business address is required';
      if (!formData.country) newErrors.country = 'Country is required';
    }
    if (step === 2) {
      if (!formData.phone) newErrors.phone = 'Phone number is required';
      if (!formData.email) newErrors.email = 'Email is required';
      if (!formData.manager) newErrors.manager = 'Manager name is required';
      if (!formData.managerEmail) newErrors.managerEmail = 'Manager email is required';
      if (!formData.managerPhone) newErrors.managerPhone = 'Manager phone is required';
      // Prevent manager/company email from being the same as person's email
      if (
        formData.managerEmail &&
        formData.email &&
        formData.managerEmail.trim().toLowerCase() === formData.email.trim().toLowerCase()
      ) {
        newErrors.managerEmail = 'Manager/Company email must be different from your personal email';
      }
    }
    if (step === 3) {
      if (!formData.productLines) newErrors.productLines = 'Product line is required';
      if (!formData.bankName) newErrors.bankName = 'Bank name is required';
      if (!formData.accountName) newErrors.accountName = 'Account name is required';
      if (!formData.accountNumber) newErrors.accountNumber = 'Account number is required';
      if (!formData.agree) newErrors.agree = 'You must agree to the terms';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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
  setIsSubmitting(true);
  try {
    const submissionData = {
      ...formData,
      submittedAt: new Date().toISOString(),
      timestamp: Date.now(),
      userAgent: navigator.userAgent,
      formType: 'Pro Seller Application',
    };
    console.log('Submitting Pro Seller Application:', submissionData);
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://foremade-backend.onrender.com';
    let idToken = null;
    if (user) {
      idToken = await user.getIdToken();
      console.log('Fetched ID Token:', idToken ? 'Present' : 'Null');
    } else {
      console.log('No authenticated user found');
    }
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
    console.log('API Response:', result, 'Status:', response.status, 'Headers:', Object.fromEntries(response.headers.entries()));
    if (!response.ok) {
      throw new Error(result.message || 'Submission failed');
    }
    if (result.redirectUrl) {
      window.location.href = result.redirectUrl;
      return;
    }
    addAlert('Pro Seller application submitted successfully! We will review your application and get back to you soon.', 'success');
    setFormData(initialFormData);
    setCurrentStep(1);
  } catch (error) {
    console.error('Submission error:', error.message, error);
    addAlert('There was an error submitting your application. Please try again or contact support.', 'error');
  } finally {
    setIsSubmitting(false);
  }
};

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRegNumberBlur = async () => {
    if (!formData.regNumber || !formData.businessName) return;
    setFormData(prev => ({ ...prev, regVerifying: true, regError: '', regVerified: false }));
    try {
      const payload = { country: formData.country === 'Nigeria' ? 'NG' : formData.country, regNumber: formData.regNumber };
      console.log('Verifying reg number:', payload);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${backendUrl}/verify-business-reg-number`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log('Reg number verification response:', data);
      if (res.ok && data.status === 'success' && data.data && data.data.isValid) {
        setFormData(prev => ({ ...prev, regVerified: true, regVerifying: false, regError: '' }));
      } else {
        setFormData(prev => ({ ...prev, regVerified: false, regVerifying: false, regError: (data.data && data.data.message) || data.message || 'Verification failed.' }));
      }
    } catch (err) {
      setFormData(prev => ({ ...prev, regVerified: false, regVerifying: false, regError: 'Network or server error.' }));
      console.error('Reg number verification error:', err);
    }
  };

  const handleAccountNumberBlur = async () => {
    if (!formData.accountNumber || !formData.bankCode) return;
    setFormData(prev => ({ ...prev, accountVerifying: true, accountError: '', accountVerified: false, accountName: '' }));
    try {
      const payload = { accountNumber: formData.accountNumber, bankCode: formData.bankCode };
      console.log('Verifying bank account:', payload);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      const res = await fetch(`${backendUrl}/verify-bank-account`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      console.log('Bank account verification response:', data);
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
      exit: { x: -50, opacity: 0 }
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
                <input type="text" placeholder="Business Name" value={formData.businessName} onChange={e => handleInputChange('businessName', e.target.value)} className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.businessName ? 'border-red-500' : 'border-gray-300'}`} />
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
                  placeholder="Registration Number"
                  value={formData.regNumber}
                  onChange={e => handleInputChange('regNumber', e.target.value)}
                  onBlur={handleRegNumberBlur}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${formData.regError ? 'border-red-500' : formData.regVerified ? 'border-green-500' : errors.regNumber ? 'border-red-500' : 'border-gray-300'}`}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tax Reference</label>
                <input type="text" placeholder="Tax Reference (optional)" value={formData.taxRef} onChange={e => handleInputChange('taxRef', e.target.value)} className="w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all border-gray-300" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Business Address <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Business Address" value={formData.address} onChange={e => handleInputChange('address', e.target.value)} className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.address ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Country <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Country" value={formData.country} onChange={e => handleInputChange('country', e.target.value)} className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.country ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.country && <p className="text-red-500 text-xs mt-1">{errors.country}</p>}
              </div>
            </div>
          )}
          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="mb-6 text-center">
                <User className="w-6 h-6 text-orange-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-orange-800 mb-2">Contact Information</h2>
                <p className="text-orange-600">How can we reach you?</p>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Phone Number <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Phone Number" value={formData.phone} onChange={e => handleInputChange('phone', e.target.value)} className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.phone ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address <span className="text-red-500">*</span></label>
                <input type="email" placeholder="Email Address" value={formData.email} onChange={e => handleInputChange('email', e.target.value)} className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Manager Name <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Manager Name" value={formData.manager} onChange={e => handleInputChange('manager', e.target.value)} className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.manager ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.manager && <p className="text-red-500 text-xs mt-1">{errors.manager}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Manager Email <span className="text-red-500">*</span></label>
                <input type="email" placeholder="Manager Email" value={formData.managerEmail} onChange={e => handleInputChange('managerEmail', e.target.value)} className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.managerEmail ? 'border-red-500' : 'border-gray-300'}`} />
                {errors.managerEmail && <p className="text-red-500 text-xs mt-1">{errors.managerEmail}</p>}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Manager Phone <span className="text-red-500">*</span></label>
                <input type="text" placeholder="Manager Phone" value={formData.managerPhone} onChange={e => handleInputChange('managerPhone', e.target.value)} className={`w-full px-4 py-3 border rounded-xl text-gray-900 placeholder-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.managerPhone ? 'border-red-500' : 'border-gray-300'}`} />
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
                      <label key={cat.value || cat.code || cat.name || idx} className="flex items-center space-x-2 bg-orange-50 rounded-lg px-3 py-2 cursor-pointer hover:bg-orange-100 transition">
                        <input
                          type="checkbox"
                          checked={formData.productLines.includes(cat.value || cat.name || cat)}
                          onChange={e => {
                            let newLines = formData.productLines.includes(cat.value || cat.name || cat)
                              ? formData.productLines.filter(v => v !== (cat.value || cat.name || cat))
                              : [...formData.productLines, cat.value || cat.name || cat];
                            handleInputChange('productLines', newLines);
                            console.log('Selected product lines:', newLines);
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
                    console.log('Selected bank:', selected);
                  }}
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${errors.bankName ? 'border-red-500' : 'border-gray-300'}`}
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
                <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center">Account Number <span className="text-red-500">*</span>
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
                  className={`w-full px-4 py-3 border rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all ${formData.accountError ? 'border-red-500' : formData.accountVerified ? 'border-green-500' : errors.accountNumber ? 'border-red-500' : 'border-gray-300'}`}
                />
                {formData.accountName && (
                  <div className="mt-2 flex items-center text-green-600 text-sm font-semibold">
                    <CheckCircle className="w-5 h-5 mr-1" />
                    {formData.accountName}
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <input type="checkbox" checked={formData.agree} onChange={e => handleInputChange('agree', e.target.checked)} />
                <label className="text-sm text-gray-700">
                  I agree to the
                  <Link to="/terms-conditions" target="_blank" rel="noopener noreferrer" className="text-orange-600 underline hover:text-orange-800 ml-1">Pro Seller Terms & Conditions</Link>
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
                <div><span className="font-semibold">Registration Number:</span> {formData.regNumber} {formData.regVerified && <CheckCircle className="inline w-4 h-4 text-green-500 ml-1" />}</div>
                <div><span className="font-semibold">Tax Reference:</span> {formData.taxRef} {formData.taxVerified && <CheckCircle className="inline w-4 h-4 text-green-500 ml-1" />}</div>
                <div><span className="font-semibold">Business Address:</span> {formData.address}</div>
                <div><span className="font-semibold">Country:</span> {formData.country}</div>
                <div><span className="font-semibold">Phone:</span> {formData.phoneCode} {formData.phone}</div>
                <div><span className="font-semibold">Email:</span> {formData.email}</div>
                <div><span className="font-semibold">Manager:</span> {formData.manager}</div>
                <div><span className="font-semibold">Manager Email:</span> {formData.managerEmail}</div>
                <div><span className="font-semibold">Manager Phone:</span> {formData.managerPhone}</div>
                <div><span className="font-semibold">Product Lines:</span> {formData.productLines.join(', ')}</div>
                <div><span className="font-semibold">Bank:</span> {formData.bankName}</div>
                <div><span className="font-semibold">Account Number:</span> {formData.accountNumber} {formData.accountVerified && <CheckCircle className="inline w-4 h-4 text-green-500 ml-1" />}</div>
                <div><span className="font-semibold">Account Name:</span> {formData.accountName}</div>
                <div><span className="font-semibold">Agreed to Terms:</span> {formData.agree ? 'Yes' : 'No'}</div>
              </div>
              <div className="text-xs text-gray-500 text-center">By submitting, you confirm all information is correct and consent to verification.</div>
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
    { label: 'Review & Submit' }
  ];

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-100 flex items-center justify-center py-8 px-2 sm:px-4">
      <CustomAlert alerts={alerts} removeAlert={removeAlert} />
      <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 md:px-8">
        <div className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-orange-100 dark:border-gray-800 overflow-hidden">
          <div className="px-4 sm:px-8 md:px-12 pt-10 pb-4 md:pt-14 md:pb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-orange-700 dark:text-orange-400 tracking-tight">Pro Seller Registration</h1>
              <CheckCircle className="w-9 h-9 text-orange-500 self-center" />
            </div>
            {/* Mobile Stepper */}
            <div className="block sm:hidden mb-10">
              <div className="flex items-center w-full mb-2">
                {steps.map((step, idx) => (
                  <React.Fragment key={step.label}>
                    <div className="flex-1 flex flex-col items-center">
                      <div className={`w-7 h-7 flex items-center justify-center rounded-full border-2 text-sm font-bold
                        ${idx < currentStep - 1 ? 'border-orange-600 bg-orange-100 text-orange-600' : idx === currentStep - 1 ? 'border-orange-700 bg-orange-200 text-orange-700' : 'border-gray-200 bg-gray-100 text-gray-400'}`}>{idx + 1}</div>
                    </div>
                    {idx < steps.length - 1 && (
                      <div className={`flex-1 h-1 mx-1 rounded-full ${idx < currentStep - 1 ? 'bg-orange-600' : 'bg-gray-200'}`}></div>
                    )}
                  </React.Fragment>
                ))}
              </div>
              <div className="flex justify-between w-full px-1">
                {steps.map((step, idx) => (
                  <span key={step.label} className={`text-[10px] font-semibold uppercase tracking-wide text-center flex-1 ${idx === currentStep - 1 ? 'text-orange-700' : 'text-gray-400'}`}>{step.label}</span>
                ))}
              </div>
            </div>
            {/* Desktop Stepper */}
            <div className="hidden sm:flex items-center justify-center mb-10 gap-4">
              {steps.map((step, idx) => (
                <React.Fragment key={step.label}>
                  <div className={`flex flex-col items-center ${idx < currentStep - 1 ? 'text-orange-600' : idx === currentStep - 1 ? 'text-orange-700 font-bold dark:text-orange-300' : 'text-gray-300 dark:text-gray-600'}`}>
                    <div className={`w-9 h-9 flex items-center justify-center rounded-full border-4 ${idx < currentStep - 1 ? 'border-orange-600 bg-orange-100' : idx === currentStep - 1 ? 'border-orange-700 bg-orange-200 dark:bg-orange-900' : 'border-gray-200 bg-gray-100 dark:bg-gray-800'} text-lg font-bold`}>{idx + 1}</div>
                    <span className="text-xs mt-2 font-semibold tracking-wide uppercase whitespace-nowrap">{step.label}</span>
                  </div>
                  {idx < steps.length - 1 && <div className={`flex-1 h-1 mx-2 rounded-full ${idx < currentStep - 1 ? 'bg-orange-600' : 'bg-gray-200 dark:bg-gray-700'}`}></div>}
                </React.Fragment>
              ))}
            </div>
            <form onSubmit={e => { e.preventDefault(); handleContinue(); }}>
              <div className="max-h-[60vh] md:max-h-[65vh] overflow-y-auto pb-4 custom-scrollbar px-1 md:px-2">
                {renderStepContent()}
              </div>
              {/* Sticky Button Footer */}
              <div className="sticky bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-white via-white/90 to-transparent dark:from-gray-900 dark:via-gray-900/90 dark:to-transparent px-0 pt-6 pb-4 mt-8 border-t border-orange-100 dark:border-gray-800 shadow-2xl flex flex-col items-center gap-2">
                <div className="flex flex-col sm:flex-row w-full gap-3 sm:gap-4">
                  {currentStep > 1 && (
                    <button type="button" onClick={handleBack} className="flex-1 px-6 py-3 rounded-xl bg-orange-100 text-orange-700 font-bold text-base sm:text-lg shadow hover:bg-orange-200 transition border-2 border-orange-200">Back</button>
                  )}
                  <button type="submit" disabled={isSubmitting} className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-extrabold text-base sm:text-lg shadow-lg hover:from-orange-600 hover:to-orange-700 focus:ring-4 focus:ring-orange-200 transition border-2 border-orange-500 disabled:opacity-60 disabled:cursor-not-allowed">
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