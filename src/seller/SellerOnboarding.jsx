import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import axios from 'axios';
import SellerSidebar from './SellerSidebar';

export default function SellerOnboarding() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    country: 'Nigeria',
    idNumber: '',
    bankName: '',
    bankCode: '',
    accountNumber: '',
    iban: '',
    email: auth.currentUser?.email || '',
  });
  const [banks, setBanks] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = 'Full name is required.';
    if (formData.country === 'Nigeria') {
      if (!formData.bankCode) newErrors.bankCode = 'Select a bank.';
      if (!formData.accountNumber.match(/^\d{10}$/)) newErrors.accountNumber = 'Enter a valid 10-digit account number.';
    } else {
      if (!formData.idNumber.trim()) newErrors.idNumber = 'Enter a valid ID number.';
      if (!formData.iban.match(/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/)) newErrors.iban = 'Enter a valid IBAN.';
      if (!formData.email.match(/\S+@\S+\.\S+/)) newErrors.email = 'Enter a valid email.';
    }
    return newErrors;
  };

  useEffect(() => {
    const initialize = async () => {
      try {
        if (!auth.currentUser) {
          setError('Please log in to onboard.');
          navigate('/login');
          return;
        }
        const sellerRef = doc(db, 'sellers', auth.currentUser.uid);
        const sellerSnap = await getDoc(sellerRef);
        if (sellerSnap.exists()) {
          setShowModal(true);
          return;
        }
        if (formData.country === 'Nigeria') {
          const response = await axios.get('https://foremade-backend.onrender.com/fetch-banks');
          setBanks(response.data);
        }
      } catch (err) {
        setError('Initialization error: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, [formData.country, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const createRecipient = async (bankCode, accountNumber, name) => {
    const response = await axios.post(
      'https://api.paystack.co/transferrecipient',
      {
        type: 'nuban',
        name,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN',
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    if (!response.data.status) {
      throw new Error('Failed to create transfer recipient');
    }
    return response.data.data.recipient_code;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      return;
    }
    try {
      const payload = {
        userId: auth.currentUser.uid,
        country: formData.country,
        fullName: formData.fullName,
        email: formData.email,
        bankCode: formData.country === 'Nigeria' ? formData.bankCode : undefined,
        accountNumber: formData.country === 'Nigeria' ? formData.accountNumber : undefined,
        iban: formData.country === 'United Kingdom' ? formData.iban : undefined,
        bankName: formData.country === 'United Kingdom' ? formData.bankName : undefined,
        idNumber: formData.country === 'United Kingdom' ? formData.idNumber : undefined,
      };
      const response = await axios.post('https://foremade-backend.onrender.com/onboard-seller', payload);
      if (response.data.error) throw new Error(response.data.error);

      let recipientCode = null;
      if (formData.country === 'Nigeria') {
        recipientCode = await createRecipient(formData.bankCode, formData.accountNumber, formData.fullName);
      }

      const currentDate = new Date().toISOString();
      await setDoc(doc(db, 'sellers', auth.currentUser.uid), {
        fullName: formData.fullName,
        country: formData.country,
        idNumber: formData.country === 'United Kingdom' ? formData.idNumber : '',
        bankName: formData.country === 'Nigeria' ? banks.find((b) => b.code === formData.bankCode)?.name : formData.bankName,
        bankCode: formData.country === 'Nigeria' ? formData.bankCode : '',
        accountNumber: formData.country === 'Nigeria' ? formData.accountNumber : '',
        iban: formData.country === 'United Kingdom' ? formData.iban : '',
        email: formData.country === 'United Kingdom' ? formData.email : '',
        paystackRecipientCode: recipientCode || '',
        createdAt: currentDate,
        updatedAt: currentDate,
      }, { merge: true });

      alert('Onboarding successful!');
      navigate('/seller-dashboard');
    } catch (error) {
      setError('Failed to onboard: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <i className="bx bx-loader bx-spin text-2xl"></i>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <div className="bg-red-50 border-l-4 border-red-500 p-6 rounded-lg shadow-lg">
            <p className="text-red-700 text-base mb-4">{error}</p>
            <Link to="/login" className="text-blue-600 hover:text-blue-800 font-medium underline">
              Return to Login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-50">
      <SellerSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-4">
        <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 flex items-center">
              <i className="bx bxs-bank text-blue-500 mr-2"></i>
              Seller Onboarding
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              Set up your seller account to start selling.
            </p>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Full Name <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  className={`w-full p-3 pl-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                    errors.fullName ? 'border-red-500' : ''
                  }`}
                  disabled={loading}
                />
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  <i className="bx bx-user"></i>
                </span>
              </div>
              {errors.fullName && <p className="text-red-600 text-xs mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Country <span className="text-red-500">*</span>
              </label>
              <select
                name="country"
                value={formData.country}
                onChange={handleChange}
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                disabled={loading}
              >
                <option value="Nigeria">Nigeria</option>
                <option value="United Kingdom">UK</option>
              </select>
            </div>
            {formData.country === 'Nigeria' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="bankCode"
                    value={formData.bankCode}
                    onChange={handleChange}
                    className={`mt-1 w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                      errors.bankCode ? 'border-red-500' : ''
                    }`}
                    disabled={loading}
                  >
                    <option value="">Select a bank</option>
                    {banks.map((bank) => (
                      <option key={bank.code} value={bank.code}>
                        {bank.name}
                      </option>
                    ))}
                  </select>
                  {errors.bankCode && <p className="text-red-600 text-xs mt-1">{errors.bankCode}</p>}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Account Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      placeholder="e.g., 0123456789"
                      className={`w-full p-3 pl-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                        errors.accountNumber ? 'border-red-500' : ''
                      }`}
                      disabled={loading}
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <i className="bx bx-bank"></i>
                    </span>
                  </div>
                  {errors.accountNumber && <p className="text-red-600 text-xs mt-1">{errors.accountNumber}</p>}
                </div>
              </>
            )}
            {formData.country === 'United Kingdom' && (
              <>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    ID Number <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      name="idNumber"
                      value={formData.idNumber}
                      onChange={handleChange}
                      className={`w-full p-3 pl-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                        errors.idNumber ? 'border-red-500' : ''
                      }`}
                      disabled={loading}
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <i className="bx bx-id-card"></i>
                    </span>
                  </div>
                  {errors.idNumber && <p className="text-red-600 text-xs mt-1">{errors.idNumber}</p>}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Bank Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder="e.g., Barclays"
                      className={`w-full p-3 pl-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                        errors.bankName ? 'border-red-500' : ''
                      }`}
                      disabled={loading}
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <i className="bx bx-bank"></i>
                    </span>
                  </div>
                  {errors.bankName && <p className="text-red-600 text-xs mt-1">{errors.bankName}</p>}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    IBAN <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="text"
                      name="iban"
                      value={formData.iban}
                      onChange={handleChange}
                      placeholder="e.g., GB33BUKB20201555555555"
                      className={`w-full p-3 pl-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                        errors.iban ? 'border-red-500' : ''
                      }`}
                      disabled={loading}
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <i className="bx bx-credit-card"></i>
                    </span>
                  </div>
                  {errors.iban && <p className="text-red-600 text-xs mt-1">{errors.iban}</p>}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="e.g., seller@example.com"
                      className={`w-full p-3 pl-10 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition ${
                        errors.email ? 'border-red-500' : ''
                      }`}
                      disabled={loading}
                    />
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                      <i className="bx bx-envelope"></i>
                    </span>
                  </div>
                  {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                </div>
              </>
            )}
            <button
              type="submit"
              className={`w-full py-2 px-4 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 flex items-center justify-center gap-2 transition duration-300 ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              <i className="bx bx-check"></i>
              Complete Onboarding
            </button>
          </form>
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Already Onboarded</h2>
            <p className="text-gray-600 mb-4">You are already onboarded as a seller. Would you like to proceed to your dashboard?</p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => navigate('/smile')}
                className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Yes
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="py-2 px-4 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}