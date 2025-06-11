import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, setDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
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
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editCategory, setEditCategory] = useState(null);
  const [errors, setErrors] = useState({});

  // Check admin authentication
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Verify admin role (commented as per original)
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

  // Fetch categories and fee configurations
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch categories
        const catSnapshot = await getDocs(collection(db, 'categories'));
        const catList = catSnapshot.docs.map((doc) => doc.id).sort();
        setCategories(catList);

        // Fetch fee configurations
        const docRef = doc(db, 'feeConfigurations', 'categoryFees');
        const docSnap = await getDoc(docRef);
        let feeData;
        if (docSnap.exists()) {
          feeData = docSnap.data();
          setFeeConfig(feeData);
        } else {
          // Initialize default fees for existing categories
          const defaultFees = catList.reduce((acc, cat) => ({
            ...acc,
            [cat]: {
              minPrice: 1000,
              maxPrice: Infinity,
              buyerProtectionRate: 0.08, // 8%
              handlingRate: 0.20, // 20%
            },
          }), {});
          await setDoc(docRef, defaultFees);
          feeData = defaultFees;
          setFeeConfig(defaultFees);
        }

        // Sync feeConfig with categories (add missing, remove deleted)
        const updatedFees = { ...feeData };
        catList.forEach((cat) => {
          if (!updatedFees[cat]) {
            updatedFees[cat] = {
              minPrice: 1000,
              maxPrice: Infinity,
              buyerProtectionRate: 0.08,
              handlingRate: 0.20,
            };
          }
        });
        Object.keys(updatedFees).forEach((cat) => {
          if (!catList.includes(cat)) {
            delete updatedFees[cat];
          }
        });
        if (Object.keys(updatedFees).length !== Object.keys(feeData).length) {
          await setDoc(docRef, updatedFees);
          setFeeConfig(updatedFees);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        addAlert('Failed to load data.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle fee input changes
  const handleFeeChange = (category, field, value) => {
    setFeeConfig((prev) => ({
      ...prev,
      [category]: {
        ...prev[category],
        [field]: field === 'minPrice' || field === 'maxPrice' ? parseFloat(value) || 0 : parseFloat(value) || 0,
      },
    }));
    setErrors((prev) => ({ ...prev, [`${category}_${field}`]: '' }));
  };

  // Validate fee form
  const validateFeeForm = () => {
    const newErrors = {};
    categories.forEach((category) => {
      const config = feeConfig[category];
      if (isNaN(config.minPrice) || config.minPrice < 0) {
        newErrors[`${category}_minPrice`] = 'Minimum price must be a non-negative number.';
      }
      if (isNaN(config.maxPrice) || config.maxPrice <= config.minPrice) {
        newErrors[`${category}_maxPrice`] = 'Maximum price must be greater than minimum price.';
      }
      if (isNaN(config.buyerProtectionRate) || config.buyerProtectionRate < 0) {
        newErrors[`${category}_buyerProtectionRate`] = 'Buyer protection rate must be non-negative.';
      }
      if (isNaN(config.handlingRate) || config.handlingRate < 0) {
        newErrors[`${category}_handlingRate`] = 'Handling rate must be non-negative.';
      }
    });
    return newErrors;
  };

  // Handle fee form submission
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

  // Handle category creation
  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      addAlert('Category name is required.', 'error');
      return;
    }
    if (categories.includes(newCategory.trim())) {
      addAlert('Category already exists.', 'error');
      return;
    }
    setLoading(true);
    try {
      const catRef = doc(db, 'categories', newCategory.trim());
      await setDoc(catRef, { name: newCategory.trim(), createdAt: new Date() });
      setCategories((prev) => [...prev, newCategory.trim()].sort());
      setFeeConfig((prev) => ({
        ...prev,
        [newCategory.trim()]: {
          minPrice: 1000,
          maxPrice: Infinity,
          buyerProtectionRate: 0.08,
          handlingRate: 0.20,
        },
      }));
      setNewCategory('');
      addAlert('Category added successfully!', 'success');
    } catch (err) {
      console.error('Error adding category:', err);
      addAlert('Failed to add category.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle category edit
  const handleEditCategory = async (oldName) => {
    if (!newCategory.trim()) {
      addAlert('New category name is required.', 'error');
      return;
    }
    if (categories.includes(newCategory.trim()) && newCategory.trim() !== oldName) {
      addAlert('Category name already exists.', 'error');
      return;
    }
    setLoading(true);
    try {
      // Update category
      const oldCatRef = doc(db, 'categories', oldName);
      const newCatRef = doc(db, 'categories', newCategory.trim());
      await setDoc(newCatRef, { name: newCategory.trim(), createdAt: new Date() });
      await deleteDoc(oldCatRef);

      // Update feeConfig
      const updatedFees = { ...feeConfig };
      updatedFees[newCategory.trim()] = updatedFees[oldName];
      delete updatedFees[oldName];
      const feeRef = doc(db, 'feeConfigurations', 'categoryFees');
      await setDoc(feeRef, updatedFees);

      // Update subcategories and sub-subcategories
      const subcatRef = doc(db, 'customSubcategories', oldName);
      const subcatSnap = await getDoc(subcatRef);
      if (subcatSnap.exists()) {
        const newSubcatRef = doc(db, 'customSubcategories', newCategory.trim());
        await setDoc(newSubcatRef, subcatSnap.data());
        await deleteDoc(subcatRef);
      }
      const subSubcatRef = doc(db, 'customSubSubcategories', oldName);
      const subSubcatSnap = await getDoc(subSubcatRef);
      if (subSubcatSnap.exists()) {
        const newSubSubcatRef = doc(db, 'customSubSubcategories', newCategory.trim());
        await setDoc(newSubSubcatRef, subSubcatSnap.data());
        await deleteDoc(subSubcatRef);
      }

      setCategories((prev) => prev.map((cat) => (cat === oldName ? newCategory.trim() : cat)).sort());
      setFeeConfig(updatedFees);
      setNewCategory('');
      setEditCategory(null);
      addAlert('Category updated successfully!', 'success');
    } catch (err) {
      console.error('Error editing category:', err);
      addAlert('Failed to edit category.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Are you sure you want to delete "${category}"?`)) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'categories', category));
      setCategories((prev) => prev.filter((cat) => cat !== category));
      setFeeConfig((prev) => {
        const updated = { ...prev };
        delete updated[category];
        return updated;
      });
      await deleteDoc(doc(db, 'customSubcategories', category));
      await deleteDoc(doc(db, 'customSubSubcategories', category));
      const feeRef = doc(db, 'feeConfigurations', 'categoryFees');
      await setDoc(feeRef, feeConfig);
      addAlert('Category deleted successfully!', 'success');
    } catch (err) {
      console.error('Error deleting category:', err);
      addAlert('Failed to delete category.', 'error');
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
          {/* Fee Configuration Section */}
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
            Edit Category Fees
          </h2>
          <form onSubmit={handleFeeSubmit} className="space-y-8">
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
                      onChange={(e) => handleFeeChange(category, 'minPrice', e.target.value)}
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
                      onChange={(e) => handleFeeChange(category, 'maxPrice', e.target.value || Infinity)}
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
                      Buyer Protection Rate (%)
                    </label>
                    <input
                      type="number"
                      value={(feeConfig[category].buyerProtectionRate * 100).toFixed(2)}
                      onChange={(e) => handleFeeChange(category, 'buyerProtectionRate', parseFloat(e.target.value) / 100)}
                      min="0"
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
                      Handling Rate (%)
                    </label>
                    <input
                      type="number"
                      value={(feeConfig[category].handlingRate * 100).toFixed(2)}
                      onChange={(e) => handleFeeChange(category, 'handlingRate', parseFloat(e.target.value) / 100)}
                      min="0"
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

          {/* Category Management Section */}
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mt-8 mb-6 border-b pb-3">
            Manage Categories
          </h2>
          <div className="space-y-4">
            <div className="flex gap-4">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Enter category name"
                className="w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
                disabled={loading}
              />
              {editCategory ? (
                <>
                  <button
                    onClick={() => handleEditCategory(editCategory)}
                    disabled={loading}
                    className={`py-2 px-4 rounded-md text-white text-sm font-medium transition duration-200 ${
                      loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
                    }`}
                  >
                    Update
                  </button>
                  <button
                    onClick={() => { setEditCategory(null); setNewCategory(''); }}
                    disabled={loading}
                    className={`py-2 px-4 rounded-md text-white text-sm font-medium transition duration-200 ${
                      loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'
                    }`}
                  >
                    Cancel
                  </button>
                </>
              ) : (
                <button
                  onClick={handleAddCategory}
                  disabled={loading}
                  className={`py-2 px-4 rounded-md text-white text-sm font-medium transition duration-200 ${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800'
                  }`}
                >
                  Add Category
                </button>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Existing Categories</h3>
              <ul className="space-y-2">
                {categories.map((cat) => (
                  <li key={cat} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <span>{cat}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setEditCategory(cat); setNewCategory(cat); }}
                        disabled={loading}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        disabled={loading}
                        className="text-red-600 hover:underline text-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
      </div>
    </div>
  );
}