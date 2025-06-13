import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import AdminSidebar from './AdminSidebar';
import 'boxicons/css/boxicons.min.css';

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
          <button onClick={() => removeAlert(alert.id)} className="ml-2 text-sm font-bold">✕</button>
        </div>
      ))}
    </div>
  );
}

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
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [feeConfig, setFeeConfig] = useState({});
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.email));
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          addAlert('Unauthorized access.', 'error');
          // navigate('/login');
        } else {
          setUser(currentUser);
        }
      } else {
        addAlert('Please log in as an admin.', 'error');
        // navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const catSnapshot = await getDocs(collection(db, 'categories'));
        const catList = catSnapshot.docs.map((doc) => doc.id).sort();
        setCategories(catList);

        const docRef = doc(db, 'feeConfigurations', 'categoryFees');
        const docSnap = await getDoc(docRef);
        let feeData = {};
        if (docSnap.exists()) {
          feeData = docSnap.data();
        } else {
          // Initialize default fees for all categories
          feeData = catList.reduce((acc, cat) => ({
            ...acc,
            [cat]: { minPrice: 1000, maxPrice: Infinity, buyerProtectionRate: 0.08, handlingRate: 0.20 },
          }), {});
          await setDoc(docRef, feeData);
        }

        // Ensure all categories have fee configs
        const updatedFees = { ...feeData };
        catList.forEach((cat) => {
          if (!updatedFees[cat]) {
            updatedFees[cat] = { minPrice: 1000, maxPrice: Infinity, buyerProtectionRate: 0.08, handlingRate: 0.20 };
          }
        });
        // Remove configs for non-existent categories
        Object.keys(updatedFees).forEach((cat) => {
          if (!catList.includes(cat)) delete updatedFees[cat];
        });

        if (JSON.stringify(updatedFees) !== JSON.stringify(feeData)) {
          await setDoc(docRef, updatedFees);
        }
        setFeeConfig(updatedFees);
      } catch (err) {
        console.error('Error fetching data:', err);
        addAlert('Failed to load data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    if (user) fetchData();
  }, [user]);

  const handleFeeChange = (category, field, value) => {
    setFeeConfig((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]:
          field === 'minPrice' || field === 'maxPrice'
            ? value === ''
              ? Infinity
              : parseFloat(value) || 0
            : (parseFloat(value) || 0) / 100,
      },
    }));
    setErrors((prev) => ({ ...prev, [`${category}_${field}`]: '' }));
  };

  const validateFeeForm = () => {
    const newErrors = {};
    categories.forEach((category) => {
      const config = feeConfig[category] || {};
      if (config.minPrice < 0) {
        newErrors[`${category}_minPrice`] = 'Minimum price cannot be negative.';
      }
      if (config.maxPrice !== Infinity && config.maxPrice < config.minPrice) {
        newErrors[`${category}_maxPrice`] = 'Maximum price must be greater than minimum price.';
      }
      if (config.buyerProtectionRate < 0 || config.buyerProtectionRate > 1) {
        newErrors[`${category}_buyerProtectionRate`] = 'Rate must be between 0 and 100%.';
      }
      if (config.handlingRate < 0 || config.handlingRate > 1) {
        newErrors[`${category}_handlingRate`] = 'Rate must be between 0 and 100%.';
      }
    });
    return newErrors;
  };

  const handleFeeSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const newErrors = validateFeeForm();
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

  if (!user || loading || Object.keys(feeConfig).length === 0) {
    return (
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
        <AdminSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-start">
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6 border-b pb-3">
            Edit Category Fees 💰
          </h2>
          <form onSubmit={handleFeeSubmit} className="space-y-8">
            {categories.map((category) => (
              <div key={category} className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4">{category}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Minimum Price (₦)</label>
                    <input
                      type="number"
                      value={feeConfig[category]?.minPrice === Infinity ? '' : feeConfig[category]?.minPrice || ''}
                      onChange={(e) => handleFeeChange(category, 'minPrice', e.target.value)}
                      min="0"
                      step="0.01"
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors[`${category}_minPrice`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                    />
                    {errors[`${category}_minPrice`] && (
                      <p className="text-red-600 text-xs mt-1">{errors[`${category}_minPrice`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Maximum Price (₦)</label>
                    <input
                      type="number"
                      value={feeConfig[category]?.maxPrice === Infinity ? '' : feeConfig[category]?.maxPrice || ''}
                      onChange={(e) => handleFeeChange(category, 'maxPrice', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="Leave blank for no maximum"
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors[`${category}_maxPrice`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                    />
                    {errors[`${category}_maxPrice`] && (
                      <p className="text-red-600 text-xs mt-1">{errors[`${category}_maxPrice`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Buyer Protection Rate (%)</label>
                    <input
                      type="number"
                      value={(feeConfig[category]?.buyerProtectionRate * 100) || ''}
                      onChange={(e) => handleFeeChange(category, 'buyerProtectionRate', e.target.value)}
                      min="0"
                      max="100"
                      step="0.01"
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors[`${category}_buyerProtectionRate`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                    />
                    {errors[`${category}_buyerProtectionRate`] && (
                      <p className="text-red-600 text-xs mt-1">{errors[`${category}_buyerProtectionRate`]}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Handling Rate (%)</label>
                    <input
                      type="number"
                      value={(feeConfig[category]?.handlingRate * 100) || ''}
                      onChange={(e) => handleFeeChange(category, 'handlingRate', e.target.value)}
                      min="0"
                      max="100"
                      step="0.01"
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors[`${category}_handlingRate`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
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
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {loading ? 'Saving...' : 'Save Fees 💾'}
              </button>
            </div>
          </form>
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
      </div>
    </div>
  );
}