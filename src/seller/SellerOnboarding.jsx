import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import axios from 'axios';

export default function SellerOnboarding() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    country: 'Nigeria',
    bankCode: '',
    accountNumber: '',
  });
  const [banks, setBanks] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [alerts, setAlerts] = useState([]);
  const [isOnboarded, setIsOnboarded] = useState(false);

  const addAlert = (message, type = 'error') => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setAlerts((prev) => prev.filter((alert) => alert.id !== id)), 5000);
  };

  useEffect(() => {
    if (!auth.currentUser) {
      addAlert('Please log in to onboard as a seller.');
      navigate('/login');
      return;
    }

    // Check onboarding status
    const checkOnboarding = async () => {
      const sellerRef = doc(db, 'sellers', auth.currentUser.uid);
      const sellerSnap = await getDoc(sellerRef);
      if (sellerSnap.exists() && sellerSnap.data().paystackRecipientCode) {
        setIsOnboarded(true);
      }
    };
    checkOnboarding();

    // Fetch banks for Nigeria
    const fetchBanks = async () => {
      try {
        const response = await axios.get('https://foremade-backend.onrender.com/fetch-banks');
        setBanks(response.data);
      } catch (error) {
        addAlert('Failed to fetch bank list.', 'error');
        console.error('Fetch banks error:', error);
      }
    };
    fetchBanks();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.bankCode) newErrors.bankCode = 'Select a bank.';
    if (!formData.accountNumber.match(/^\d{10}$/)) newErrors.accountNumber = 'Enter a valid 10-digit account number.';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      addAlert('Please fix form errors.');
      return;
    }
    try {
      const payload = {
        userId: auth.currentUser.uid,
        country: formData.country,
        bankCode: formData.bankCode,
        accountNumber: formData.accountNumber,
      };
      const response = await axios.post('https://foremade-backend.onrender.com/onboard-seller', payload);
      await setDoc(doc(db, 'sellers', auth.currentUser.uid), {
        paystackRecipientCode: response.data.recipientCode,
        bankCode: formData.bankCode,
        accountNumber: formData.accountNumber,
        country: formData.country,
        onboardedAt: serverTimestamp(),
      }, { merge: true });
      setIsOnboarded(true);
      addAlert('Onboarding successful!', 'success');
      navigate('/seller/dashboard');
    } catch (error) {
      console.error('Onboarding error:', error.response?.data || error.message);
      addAlert(error.response?.data?.details || 'Failed to onboard seller.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <div className="flex-1 p-4 flex justify-center items-start">
        <div className="w-full max-w-md bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6 flex items-center gap-2">
            <i className="bx bx-store text-blue-500"></i>
            Seller Onboarding
          </h2>
          {isOnboarded ? (
            <div>
              <p className="text-green-600 dark:text-green-400">
                You have successfully onboarded as a seller!
              </p>
              <button
                onClick={() => navigate('/seller/dashboard')}
                className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
              >
                <i className="bx bx-arrow-right"></i>
                Go to Dashboard
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  disabled={loading}
                >
                  <option value="Nigeria">Nigeria</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <select
                  name="bankCode"
                  value={formData.bankCode}
                  onChange={handleChange}
                  className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                    errors.bankCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
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
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Account Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="accountNumber"
                  value={formData.accountNumber}
                  onChange={handleChange}
                  placeholder="e.g., 0123456789"
                  className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                    errors.accountNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                  disabled={loading}
                />
                {errors.accountNumber && <p className="text-red-600 text-xs mt-1">{errors.accountNumber}</p>}
              </div>
              <button
                type="submit"
                className={`w-full py-2 px-4 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 flex items-center justify-center gap-2 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={loading}
              >
                <i className="bx bx-check"></i>
                Save Seller Details
              </button>
            </form>
          )}
          <div className="fixed bottom-4 right-4 space-y-2">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className={`p-4 rounded-lg shadow-md ${alert.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'}`}
              >
                {alert.message}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}