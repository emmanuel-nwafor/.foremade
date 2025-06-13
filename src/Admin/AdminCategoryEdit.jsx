import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, setDoc, collection, deleteDoc, onSnapshot } from 'firebase/firestore';
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

export default function AdminCategoryEdit() {
  const navigate = useNavigate();
  const { alerts, addAlert, removeAlert } = useAlerts();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [editCategory, setEditCategory] = useState(null);
  const [feeConfig, setFeeConfig] = useState(null);
  const [newFees, setNewFees] = useState({
    minPrice: '',
    maxPrice: '',
    buyerProtectionRate: '',
    handlingRate: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
      } else {
        addAlert('Please log in as an admin.', 'error');
        // navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      try {
        setLoading(true);
        const catList = snapshot.docs.map((doc) => doc.id).sort();
        setCategories(catList);

        const fetchFees = async () => {
          const docRef = doc(db, 'feeConfigurations', 'categoryFees');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setFeeConfig(docSnap.data());
          } else {
            const defaultFees = {};
            await setDoc(docRef, defaultFees);
            setFeeConfig(defaultFees);
          }
        };
        fetchFees();
      } catch (err) {
        console.error('Error fetching data:', err);
        addAlert('Failed to load data.', 'error');
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      addAlert('Category name is required.', 'error');
      return;
    }
    if (categories.includes(newCategory.trim())) {
      addAlert('Category already exists.', 'error');
      return;
    }
    const newErrors = {};
    if (newFees.minPrice && parseFloat(newFees.minPrice) < 0) newErrors.minPrice = 'Minimum price cannot be negative.';
    if (newFees.maxPrice && parseFloat(newFees.maxPrice) < (parseFloat(newFees.minPrice) || 0)) {
      newErrors.maxPrice = 'Maximum price must be greater than minimum price.';
    }
    if (newFees.buyerProtectionRate && parseFloat(newFees.buyerProtectionRate) < 0) {
      newErrors.buyerProtectionRate = 'Buyer protection rate cannot be negative.';
    }
    if (newFees.handlingRate && parseFloat(newFees.handlingRate) < 0) {
      newErrors.handlingRate = 'Handling rate cannot be negative.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addAlert('Please fix the form errors.', 'error');
      return;
    }
    setLoading(true);
    try {
      const catRef = doc(db, 'categories', newCategory.trim());
      await setDoc(catRef, { name: newCategory.trim(), createdAt: new Date() });
      const feeRef = doc(db, 'feeConfigurations', 'categoryFees');
      const updatedFees = {
        ...feeConfig,
        [newCategory.trim()]: {
          minPrice: parseFloat(newFees.minPrice) || 1000,
          maxPrice: newFees.maxPrice ? parseFloat(newFees.maxPrice) : Infinity,
          buyerProtectionRate: parseFloat(newFees.buyerProtectionRate) || 8,
          handlingRate: parseFloat(newFees.handlingRate) || 20,
        },
      };
      await setDoc(feeRef, updatedFees);
      setNewCategory('');
      setNewFees({ minPrice: '', maxPrice: '', buyerProtectionRate: '', handlingRate: '' });
      addAlert('Category added successfully!', 'success');
    } catch (err) {
      console.error('Error adding category:', err);
      addAlert('Failed to add category.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = async (oldName) => {
    if (!newCategory.trim()) {
      addAlert('New category name is required.', 'error');
      return;
    }
    if (categories.includes(newCategory.trim()) && newCategory.trim() !== oldName) {
      addAlert('Category name already exists.', 'error');
      return;
    }
    const newErrors = {};
    if (newFees.minPrice && parseFloat(newFees.minPrice) < 0) newErrors.minPrice = 'Minimum price cannot be negative.';
    if (newFees.maxPrice && parseFloat(newFees.maxPrice) < (parseFloat(newFees.minPrice) || 0)) {
      newErrors.maxPrice = 'Maximum price must be greater than minimum price.';
    }
    if (newFees.buyerProtectionRate && parseFloat(newFees.buyerProtectionRate) < 0) {
      newErrors.buyerProtectionRate = 'Buyer protection rate cannot be negative.';
    }
    if (newFees.handlingRate && parseFloat(newFees.handlingRate) < 0) {
      newErrors.handlingRate = 'Handling rate cannot be negative.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addAlert('Please fix the form errors.', 'error');
      return;
    }
    setLoading(true);
    try {
      const oldCatRef = doc(db, 'categories', oldName);
      const newCatRef = doc(db, 'categories', newCategory.trim());
      await setDoc(newCatRef, { name: newCategory.trim(), createdAt: new Date() });
      await deleteDoc(oldCatRef);

      const updatedFees = { ...feeConfig };
      updatedFees[newCategory.trim()] = {
        minPrice: parseFloat(newFees.minPrice) || updatedFees[oldName].minPrice,
        maxPrice: newFees.maxPrice ? parseFloat(newFees.maxPrice) : updatedFees[oldName].maxPrice,
        buyerProtectionRate: parseFloat(newFees.buyerProtectionRate) || updatedFees[oldName].buyerProtectionRate,
        handlingRate: parseFloat(newFees.handlingRate) || updatedFees[oldName].handlingRate,
      };
      delete updatedFees[oldName];
      const feeRef = doc(db, 'feeConfigurations', 'categoryFees');
      await setDoc(feeRef, updatedFees);

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

      setNewCategory('');
      setNewFees({ minPrice: '', maxPrice: '', buyerProtectionRate: '', handlingRate: '' });
      setEditCategory(null);
      addAlert('Category updated successfully!', 'success');
    } catch (err) {
      console.error('Error editing category:', err);
      addAlert('Failed to edit category.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (category) => {
    if (!window.confirm(`Are you sure you want to delete "${category}"?`)) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'categories', category));
      const updatedFees = { ...feeConfig };
      delete updatedFees[category];
      const feeRef = doc(db, 'feeConfigurations', 'categoryFees');
      await setDoc(feeRef, updatedFees);
      setFeeConfig(updatedFees);
      await deleteDoc(doc(db, 'customSubcategories', category));
      await deleteDoc(doc(db, 'customSubSubcategories', category));
      addAlert('Category deleted successfully!', 'success');
    } catch (err) {
      console.error('Error deleting category:', err);
      addAlert('Failed to delete category.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleFeeChange = (field, value) => {
    setNewFees((prev) => ({
      ...prev,
      [field]: value,
    }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  if (!user || !feeConfig) {
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
            Manage Categories
          </h2>
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-700">Add/Edit Category</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category Name</label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="Enter category name"
                    className="mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Minimum Price (₦)</label>
                  <input
                    type="number"
                    value={newFees.minPrice}
                    onChange={(e) => handleFeeChange('minPrice', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Enter minimum price"
                    className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.minPrice ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={loading}
                  />
                  {errors.minPrice && (
                    <p className="text-red-600 text-xs mt-1">{errors.minPrice}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Maximum Price (₦)</label>
                  <input
                    type="number"
                    value={newFees.maxPrice}
                    onChange={(e) => handleFeeChange('maxPrice', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Leave blank for no maximum"
                    className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.maxPrice ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={loading}
                  />
                  {errors.maxPrice && (
                    <p className="text-red-600 text-xs mt-1">{errors.maxPrice}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Buyer Protection Rate (%)</label>
                  <input
                    type="number"
                    value={newFees.buyerProtectionRate}
                    onChange={(e) => handleFeeChange('buyerProtectionRate', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Enter rate"
                    className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.buyerProtectionRate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={loading}
                  />
                  {errors.buyerProtectionRate && (
                    <p className="text-red-600 text-xs mt-1">{errors.buyerProtectionRate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Handling Rate (%)</label>
                  <input
                    type="number"
                    value={newFees.handlingRate}
                    onChange={(e) => handleFeeChange('handlingRate', e.target.value)}
                    min="0"
                    step="0.01"
                    placeholder="Enter rate"
                    className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.handlingRate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={loading}
                  />
                  {errors.handlingRate && (
                    <p className="text-red-600 text-xs mt-1">{errors.handlingRate}</p>
                  )}
                </div>
              </div>
              <div className="flex gap-4 mt-4">
                {editCategory ? (
                  <>
                    <button
                      onClick={() => handleEditCategory(editCategory)}
                      disabled={loading}
                      className="py-2 px-4 rounded-md text-white text-sm transition duration-200 bg-blue-600 hover:bg-blue-700"
                    >
                      Update
                    </button>
                    <button
                      onClick={() => {
                        setEditCategory(null);
                        setNewCategory('');
                        setNewFees({ minPrice: '', maxPrice: '', buyerProtectionRate: '', handlingRate: '' });
                      }}
                      disabled={loading}
                      className="py-2 px-4 rounded-md text-white text-sm transition duration-200 bg-red-600 hover:bg-red-700"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={handleAddCategory}
                    disabled={loading}
                    className={`py-2 px-4 rounded-md text-white text-sm transition duration-200 ${
                      loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    Add Category
                  </button>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Existing Categories</h3>
              <ul className="space-y-2">
                {categories.map((cat) => (
                  <li key={cat} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                    <span>{cat}</span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setEditCategory(cat);
                          setNewCategory(cat);
                          setNewFees({
                            minPrice: feeConfig[cat].minPrice === Infinity ? '' : feeConfig[cat].minPrice,
                            maxPrice: feeConfig[cat].maxPrice === Infinity ? '' : feeConfig[cat].maxPrice,
                            buyerProtectionRate: feeConfig[cat].buyerProtectionRate,
                            handlingRate: feeConfig[cat].handlingRate,
                          });
                        }}
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