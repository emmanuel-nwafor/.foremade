import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AdminSidebar from './AdminSidebar';

// Custom Alert Component
function CustomAlert({ alerts, removeAlert }) {
  useEffect(() => {
    if (alerts.length === 0) return;
    const timer = setTimeout(() => alerts.forEach((alert) => removeAlert(alert.id)), 5000);
    return () => clearTimeout(timer);
  }, [alerts, removeAlert]);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-3 rounded-md shadow-md ${
            alert.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}
        >
          {alert.message}
          <button
            onClick={() => removeAlert(alert.id)}
            className="ml-2 text-sm font-bold"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// Local hook for managing alerts
function useAlerts() {
  const [alerts, setAlerts] = useState([]);

  const addAlert = (message, type = 'info') => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
  };

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return { alerts, addAlert, removeAlert };
}

export default function AdminEditFees() {
  const navigate = useNavigate();
  const { alerts, addAlert, removeAlert } = useAlerts();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [feeConfig, setFeeConfig] = useState(null);
  const [errors, setErrors] = useState({});

  // Categories from FOREMADE_Product_Categories.pdf
  const categories = [
    'Clothing',
    'Health & Beauty',
    'Perfumes',
    'Footwear',
    'Computers',
    'Phone & Tablet',
    'Watches',
    'Home & Garden',
    'Game & Fun',
    'Drinks & Containers',
    'Television & Sound',
    'Gadget & Accessories',
    'Children',
    'Power & Cables',
    'Refrigerator & Air Conditioning',
    'Car & Circle',
    'Jewellery & Accessories',
    'Sports & Outdoor',
  ];

  // Check admin authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Verify admin role
        // const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        // if (!userDoc.exists() || userDoc.data().role !== 'admin') {
        //   addAlert('Unauthorized access.', 'error');
        //   navigate('/login');
        // }
      } else {
        addAlert('Please log in as an admin.', 'error');
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  // Fetch fee configurations from Firestore
  useEffect(() => {
    const fetchFeeConfig = async () => {
      try {
        setLoading(true);
        const docRef = doc(db, 'feeConfigurations', 'categoryFees');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFeeConfig(docSnap.data());
        } else {
          // Initialize default fees
          const defaultFees = categories.reduce((acc, cat) => ({
            ...acc,
            [cat]: {
              minPrice: 1000,
              maxPrice: Infinity,
              buyerProtectionRate: 0.08,
              handlingRate: 0.20,
            },
          }), {});
          await setDoc(docRef, defaultFees);
          setFeeConfig(defaultFees);
        }
      } catch (err) {
        console.error('Error fetching fee configurations:', err);
        addAlert('Failed to load fee configurations.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchFeeConfig();
  }, []);

  // Handle input changes for a specific category
  const handleChange = (category, field, value) => {
    setFeeConfig((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: field === 'minPrice' || field === 'maxPrice' ? parseFloat(value) || 0 : parseFloat(value) || 0,
      },
    }));
    setErrors((prev) => ({ ...prev, [`${category}_${field}`]: '' }));
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};
    categories.forEach((category) => {
      const config = feeConfig[category];
      if (isNaN(config.minPrice) || config.minPrice < 0) {
        newErrors[`${category}_minPrice`] = 'Minimum price must be a non-negative number.';
      }
      if (isNaN(config.maxPrice) || config.maxPrice <= config.minPrice) {
        newErrors[`${category}_maxPrice`] = 'Maximum price must be greater than minimum price.';
      }
      if (isNaN(config.buyerProtectionRate) || config.buyerProtectionRate < 0 || config.buyerProtectionRate > 1) {
        newErrors[`${category}_buyerProtectionRate`] = 'Buyer protection rate must be between 0 and 1.';
      }
      if (isNaN(config.handlingRate) || config.handlingRate < 0 || config.handlingRate > 1) {
        newErrors[`${category}_handlingRate`] = 'Handling rate must be between 0 and 1.';
      }
    });
    return newErrors;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      addAlert('Please fix the form errors.', 'error');
      return;
    }

    try {
      const docRef = doc(db, 'feeConfigurations', 'categoryFees');
      await setDoc(docRef, feeConfig);
      addAlert('Fee configurations updated successfully!', 'success');
    } catch (err) {
      console.error('Error updating fee configurations:', err);
      addAlert('Failed to update fee configurations.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!feeConfig || !user) {
    return (
      <div className="min-h-screen flex bg-gray-50">
        <AdminSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-start">
        <div className="w-full max-w-4xl bg-white p-6 md:p-8 rounded-lg shadow-lg">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
            Edit Category Fees
          </h2>
          <form onSubmit={handleSubmit} className="space-y-8">
            {categories.map((category) => (
              <div key={category} className="p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-medium text-gray-700 mb-4">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Minimum Price (₦)
                    </label>
                    <input
                      type="number"
                      value={feeConfig[category].minPrice}
                      onChange={(e) => handleChange(category, 'minPrice', e.target.value)}
                      min="0"
                      step="0.01"
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors[`${category}_minPrice`]
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                    />
                    {errors[`${category}_minPrice`] && (
                      <p className="text-red-600 text-xs mt-1">{errors[`${category}_minPrice`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Maximum Price (₦)
                    </label>
                    <input
                      type="number"
                      value={feeConfig[category].maxPrice === Infinity ? '' : feeConfig[category].maxPrice}
                      onChange={(e) => handleChange(category, 'maxPrice', e.target.value || Infinity)}
                      min="0"
                      step="0.01"
                      placeholder="Leave blank for no maximum"
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors[`${category}_maxPrice`]
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                    />
                    {errors[`${category}_maxPrice`] && (
                      <p className="text-red-600 text-xs mt-1">{errors[`${category}_maxPrice`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Buyer Protection Rate (0 to 1)
                    </label>
                    <input
                      type="number"
                      value={feeConfig[category].buyerProtectionRate}
                      onChange={(e) => handleChange(category, 'buyerProtectionRate', e.target.value)}
                      min="0"
                      max="1"
                      step="0.01"
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors[`${category}_buyerProtectionRate`]
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                    />
                    {errors[`${category}_buyerProtectionRate`] && (
                      <p className="text-red-600 text-xs mt-1">{errors[`${category}_buyerProtectionRate`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Handling Rate (0 to 1)
                    </label>
                    <input
                      type="number"
                      value={feeConfig[category].handlingRate}
                      onChange={(e) => handleChange(category, 'handlingRate', e.target.value)}
                      min="0"
                      max="1"
                      step="0.01"
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors[`${category}_handlingRate`]
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-300 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                    />
                    {errors[`${category}_handlingRate`] && (
                      <p className="text-red-600 text-xs mt-1">{errors[`${category}_handlingRate`]}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`py-2 px-6 rounded-md text-white text-sm font-medium transition duration-200 shadow ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800'
                }`}
              >
                {loading ? 'Saving...' : 'Save Fees'}
              </button>
            </div>
          </form>
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
      </div>
    </div>
  );
}