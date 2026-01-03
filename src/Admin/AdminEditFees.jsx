import React, { useState, useEffect } from 'react';
import { db } from '/src/firebase';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';
import AdminSidebar from './AdminSidebar';
import AdminSetMinimumPurchase from './AdminSetMinimumPurchase';
import 'boxicons/css/boxicons.min.css';
import AdminSortCategory from './AdminSortCategory';

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
          className={`p-4 rounded-lg shadow-md transform transition-all duration-300 ease-in-out animate-slide-in ${
            alert.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          } flex items-center gap-2`}
        >
          <i className={`bx ${alert.type === 'error' ? 'bx-error-circle' : 'bx-check-circle'} text-xl`}></i>
          <span>{alert.message}</span>
          <button onClick={() => removeAlert(alert.id)} className="ml-auto text-lg font-bold hover:text-gray-200">
            ✕
          </button>
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
  const removeAlert = (id) => setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  return { alerts, addAlert, removeAlert };
}

export default function AdminEditFees() {
  const { alerts, addAlert, removeAlert } = useAlerts();
  const [loading, setLoading] = useState(true);
  const [feeConfig, setFeeConfig] = useState({});
  const [categories, setCategories] = useState([]);
  const [errors, setErrors] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

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
          feeData = catList.reduce((acc, cat) => ({
            ...acc,
            [cat]: { minPrice: 1000, maxPrice: Infinity, buyerProtectionRate: 0.08, handlingRate: 0.20, taxRate: 0.075 },
          }), {});
          await setDoc(docRef, feeData);
        }

        const updatedFees = { ...feeData };
        catList.forEach((cat) => {
          if (!updatedFees[cat]) {
            updatedFees[cat] = { minPrice: 1000, maxPrice: Infinity, buyerProtectionRate: 0.08, handlingRate: 0.20, taxRate: 0.075 };
          }
        });
        setFeeConfig(updatedFees);
      } catch (err) {
        console.error('Error fetching data:', err);
        addAlert('Failed to load categories or fees.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleFeeChange = (category, field, value) => {
    setFeeConfig((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]:
          field === 'minPrice' || field === 'maxPrice'
            ? value === '' ? Infinity : parseFloat(value) || 0
            : (parseFloat(value) || 0) / 100,
      },
    }));
    setErrors((prev) => ({ ...prev, [`${category}_${field}`]: '' }));
  };

  const validateFeeForm = () => {
    const newErrors = {};
    categories.forEach((category) => {
      const config = feeConfig[category] || {};
      if (config.minPrice < 0) newErrors[`${category}_minPrice`] = 'Minimum price cannot be negative.';
      if (config.maxPrice !== Infinity && config.maxPrice < config.minPrice) newErrors[`${category}_maxPrice`] = 'Maximum price must be greater than minimum price.';
      if (config.buyerProtectionRate < 0 || config.buyerProtectionRate > 1) newErrors[`${category}_buyerProtectionRate`] = 'Rate must be between 0 and 100%.';
      if (config.handlingRate < 0 || config.handlingRate > 1) newErrors[`${category}_handlingRate`] = 'Rate must be between 0 and 100%.';
      if (config.taxRate < 0 || config.taxRate > 1) newErrors[`${category}_taxRate`] = 'Tax rate must be between 0 and 100%.';
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
      addAlert('Fees updated successfully! 🎉', 'success');
    } catch (err) {
      console.error('Error saving fees:', err);
      addAlert('Failed to save fees.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetCategoryFees = (category) => {
    setFeeConfig((prev) => ({
      ...prev,
      [category]: { minPrice: 1000, maxPrice: Infinity, buyerProtectionRate: 0.08, handlingRate: 0.20, taxRate: 0.075 },
    }));
    setErrors((prev) => ({
      ...prev,
      [`${category}_minPrice`]: '',
      [`${category}_maxPrice`]: '',
      [`${category}_buyerProtectionRate`]: '',
      [`${category}_handlingRate`]: '',
      [`${category}_taxRate`]: '',
    }));
  };

  const toggleCategoryExpansion = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <AdminSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <i className="bx bx-loader bx-spin text-2xl"></i>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }
  

  return (
  <>
    <div className="min-h-screen flex-col bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-5 flex justify-center items-start">
        <div className="w-full max-w-5xl bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md">
          <AdminSetMinimumPurchase label="Set Minimum Purchase" currencySymbol="₦" firestorePath="settings/minimumPurchase" defaultValue={25000} />
            <AdminSortCategory />
  
        <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mt-8 mb-6 border-b-2 border-blue-500 pb-3 flex items-center gap-2">
            <i className="bx bx-money text-blue-500"></i>
            Edit Category Fees
          </h2>
          {categories.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-300 italic">
              No categories found. Add categories in Firestore to set fees.
            </p>
          ) : (
            <form onSubmit={handleFeeSubmit} className="space-y-6">
              {categories.map((category) => (
                <div
                  key={category}
                  className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200"
                >
                  <div
                    className="flex justify-between items-center cursor-pointer"
                    onClick={() => toggleCategoryExpansion(category)}
                  >
                    <span className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                      <i className={`bx bx-chevron-${expandedCategories[category] ? 'up' : 'down'} text-blue-500`}></i>
                      {category}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        resetCategoryFees(category);
                      }}
                      disabled={loading}
                      className="text-gray-600 hover:text-gray-800 dark:hover:text-gray-400 text-sm flex items-center gap-1"
                      title="Reset fees to default"
                    >
                      <i className="bx bx-refresh"></i>
                      Reset
                    </button>
                  </div>
                  {expandedCategories[category] && (
                    <div className="mt-4 ml-4 space-y-4 animate-slide-down">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="relative group">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            Minimum Price (₦)
                            <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Minimum product price for this category"></i>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₦</span>
                            <input
                              type="number"
                              value={feeConfig[category]?.minPrice === Infinity ? '' : feeConfig[category]?.minPrice || ''}
                              onChange={(e) => handleFeeChange(category, 'minPrice', e.target.value)}
                              min="0"
                              step="0.01"
                              placeholder="1000"
                              className={`mt-1 w-full py-2 pl-8 pr-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                                errors[`${category}_minPrice`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                              } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                              disabled={loading}
                            />
                          </div>
                          {errors[`${category}_minPrice`] && (
                            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                              <i className="bx bx-error-circle"></i>
                              {errors[`${category}_minPrice`]}
                            </p>
                          )}
                        </div>
                        <div className="relative group">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            Maximum Price (₦)
                            <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Maximum product price (leave blank for no limit)"></i>
                          </label>
                          <div className="relative">
                            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₦</span>
                            <input
                              type="number"
                              value={feeConfig[category]?.maxPrice === Infinity ? '' : feeConfig[category]?.maxPrice || ''}
                              onChange={(e) => handleFeeChange(category, 'maxPrice', e.target.value)}
                              min="0"
                              step="0.01"
                              placeholder="No maximum"
                              className={`mt-1 w-full py-2 pl-8 pr-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                                errors[`${category}_maxPrice`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                              } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                              disabled={loading}
                            />
                          </div>
                          {errors[`${category}_maxPrice`] && (
                            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                              <i className="bx bx-error-circle"></i>
                              {errors[`${category}_maxPrice`]}
                            </p>
                          )}
                        </div>
                        <div className="relative group">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            Buyer Protection Rate (%)
                            <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Fee percentage for buyer protection"></i>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={(feeConfig[category]?.buyerProtectionRate * 100) || ''}
                              onChange={(e) => handleFeeChange(category, 'buyerProtectionRate', e.target.value)}
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="8"
                              className={`mt-1 w-full py-2 pl-3 pr-8 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                                errors[`${category}_buyerProtectionRate`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                              } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                              disabled={loading}
                            />
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">%</span>
                          </div>
                          {errors[`${category}_buyerProtectionRate`] && (
                            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                              <i className="bx bx-error-circle"></i>
                              {errors[`${category}_buyerProtectionRate`]}
                            </p>
                          )}
                        </div>
                        <div className="relative group">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            Handling Rate (%)
                            <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Fee percentage for handling"></i>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={(feeConfig[category]?.handlingRate * 100) || ''}
                              onChange={(e) => handleFeeChange(category, 'handlingRate', e.target.value)}
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="20"
                              className={`mt-1 w-full py-2 pl-3 pr-8 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                                errors[`${category}_handlingRate`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                              } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                              disabled={loading}
                            />
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">%</span>
                          </div>
                          {errors[`${category}_handlingRate`] && (
                            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                              <i className="bx bx-error-circle"></i>
                              {errors[`${category}_handlingRate`]}
                            </p>
                          )}
                        </div>
                        <div className="relative group">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                            Tax Rate (%)
                            <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Tax percentage for this category"></i>
                          </label>
                          <div className="relative">
                            <input
                              type="number"
                              value={(feeConfig[category]?.taxRate * 100) || ''}
                              onChange={(e) => handleFeeChange(category, 'taxRate', e.target.value)}
                              min="0"
                              max="100"
                              step="0.01"
                              placeholder="7.5"
                              className={`mt-1 w-full py-2 pl-3 pr-8 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                                errors[`${category}_taxRate`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                              } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                              disabled={loading}
                            />
                            <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">%</span>
                          </div>
                          {errors[`${category}_taxRate`] && (
                            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                              <i className="bx bx-error-circle"></i>
                              {errors[`${category}_taxRate`]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              <div className="flex justify-end mt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className={`py-2 px-6 rounded-lg text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-200 flex items-center gap-2 shadow-sm`}
                >
                  {loading ? <i className="bx bx-loader bx-spin"></i> : <i className="bx bx-save"></i>}
                  {loading ? 'Saving...' : 'Save Fees'}
                </button>
              </div>
            </form>
          )}
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
      </div>
    </div>
  </>
  );
}