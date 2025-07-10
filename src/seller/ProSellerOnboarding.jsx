import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { toast } from 'react-toastify';
import CustomAlert, { useAlerts } from '../components/common/CustomAlert';

const ProSellerOnboarding = () => {
  const [onboardingData, setOnboardingData] = useState({
    country: 'Nigeria',
    bankCode: '',
    accountNumber: '',
    email: ''
  });
  const [loading, setLoading] = useState(false);
  const [banks, setBanks] = useState([]);
  const [userCountry, setUserCountry] = useState('Nigeria');
  const { alerts, addAlert, removeAlert } = useAlerts();

  useEffect(() => {
    // Fetch user's country (this could be from user profile or IP detection)
    fetchUserCountry();
    fetchBanks();
  }, []);

  const fetchUserCountry = async () => {
    try {
      // This could be from user profile or IP detection
      // For now, we'll use a default
      setUserCountry('Nigeria');
    } catch (error) {
      console.error('Error fetching user country:', error);
    }
  };

  const fetchBanks = async () => {
    try {
      const response = await fetch('/api/banks');
      if (response.ok) {
        const data = await response.json();
        setBanks(data.banks || []);
      }
    } catch (error) {
      console.error('Error fetching banks:', error);
    }
  };

  const handleInputChange = (field, value) => {
    setOnboardingData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    const errors = [];
    
    if (!onboardingData.country) {
      errors.push('Country is required');
    }
    
    if (onboardingData.country === 'Nigeria') {
      if (!onboardingData.bankCode) {
        errors.push('Bank code is required for Nigeria');
      }
      if (!onboardingData.accountNumber) {
        errors.push('Account number is required for Nigeria');
      }
    } else if (onboardingData.country === 'United Kingdom') {
      if (!onboardingData.email) {
        errors.push('Email is required for UK');
      }
    }
    
    return errors;
  };

  const handleOnboarding = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      addAlert(errors.join(', '), 'error');
      return;
    }

    setLoading(true);
    try {
      const firebaseToken = await auth.currentUser?.getIdToken();
      if (!firebaseToken) {
        throw new Error('Authentication required');
      }

      const payload = {
        country: onboardingData.country,
        email: onboardingData.email || auth.currentUser?.email
      };

      // Add Nigeria-specific fields
      if (onboardingData.country === 'Nigeria') {
        payload.bankCode = onboardingData.bankCode;
        payload.accountNumber = onboardingData.accountNumber;
      }

      const response = await fetch('/api/pro-seller/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      
      if (response.ok) {
        if (data.redirectUrl) {
          // UK: Redirect to Stripe onboarding
          addAlert('Redirecting to Stripe onboarding...', 'info');
          window.location.href = data.redirectUrl;
        } else {
          // Nigeria: Show success message
          addAlert('Payment onboarding completed successfully!', 'success');
          // You might want to redirect to dashboard or show next steps
        }
      } else {
        throw new Error(data.error || 'Onboarding failed');
      }
    } catch (error) {
      console.error('Onboarding error:', error);
      addAlert(error.message || 'Failed to complete onboarding', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Payment Onboarding</h1>
          <p className="text-gray-600 mt-2">Set up your payment account to receive earnings</p>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div className="ml-2 text-sm font-medium text-blue-600">Registration</div>
            </div>
            <div className="w-16 h-1 bg-gray-300 mx-4"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div className="ml-2 text-sm font-medium text-blue-600">Payment Setup</div>
            </div>
            <div className="w-16 h-1 bg-gray-300 mx-4"></div>
            <div className="flex items-center">
              <div className="w-8 h-8 bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div className="ml-2 text-sm font-medium text-gray-600">Approval</div>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-lg shadow p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Payment Account Setup</h2>
          
          <div className="space-y-6">
            {/* Country Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                value={onboardingData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Nigeria">Nigeria</option>
                <option value="United Kingdom">United Kingdom</option>
              </select>
            </div>

            {/* Nigeria-specific fields */}
            {onboardingData.country === 'Nigeria' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Bank <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={onboardingData.bankCode}
                    onChange={(e) => handleInputChange('bankCode', e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a bank</option>
                    {banks.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={onboardingData.accountNumber}
                    onChange={(e) => handleInputChange('accountNumber', e.target.value)}
                    placeholder="Enter your account number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    maxLength="10"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your 10-digit account number
                  </p>
                </div>
              </>
            )}

            {/* UK-specific fields */}
            {onboardingData.country === 'United Kingdom' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={onboardingData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="Enter your email address"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  This email will be used for Stripe account setup
                </p>
              </div>
            )}

            {/* Info Cards */}
            <div className="grid grid-cols-1 gap-4">
              {onboardingData.country === 'Nigeria' && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-blue-900">Nigeria Payment Setup</h3>
                      <p className="text-sm text-blue-700 mt-1">
                        We'll verify your bank account details and set up Paystack for secure payments.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {onboardingData.country === 'United Kingdom' && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-900">UK Payment Setup</h3>
                      <p className="text-sm text-green-700 mt-1">
                        You'll be redirected to Stripe to complete your account setup securely.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              onClick={handleOnboarding}
              disabled={loading}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Complete Onboarding'}
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What happens next?</h3>
          <div className="space-y-3 text-sm text-gray-600">
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
              <p>Your payment account will be verified and set up securely</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
              <p>You'll receive notifications when payments are processed</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
              <p>Funds will be transferred to your account within 24-48 hours</p>
            </div>
            <div className="flex items-start">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3"></div>
              <p>You can track all transactions in your wallet dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProSellerOnboarding; 