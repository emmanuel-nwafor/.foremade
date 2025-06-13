import React, { useState, useEffect } from 'react';
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
          className={`p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out animate-slide-in ${
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
  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };
  return { alerts, addAlert, removeAlert };
}

export default function AdminCategoryEdit() {
  const { alerts, addAlert, removeAlert } = useAlerts();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [subSubcategories, setSubSubcategories] = useState({});
  const [newCategory, setNewCategory] = useState('');
  const [editCategory, setEditCategory] = useState(null);
  const [feeConfig, setFeeConfig] = useState(null);
  const [newFees, setNewFees] = useState({
    minPrice: '',
    maxPrice: '',
    buyerProtectionRate: '',
    handlingRate: '',
  });
  const [newSubcategory, setNewSubcategory] = useState({});
  const [newSubSubcategory, setNewSubSubcategory] = useState({});
  const [errors, setErrors] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        addAlert('Please log in to access this page.', 'error');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'categories'), (snapshot) => {
      try {
        setLoading(true);
        const catList = snapshot.docs.map((doc) => doc.id).sort();
        setCategories(catList);

        const fetchSubcategories = async () => {
          const subcatData = {};
          const subSubcatData = {};
          for (const cat of catList) {
            const subcatRef = doc(db, 'customSubcategories', cat);
            const subcatSnap = await getDoc(subcatRef);
            subcatData[cat] = subcatSnap.exists() ? subcatSnap.data().subcategories || [] : [];

            const subSubcatRef = doc(db, 'customSubSubcategories', cat);
            const subSubcatSnap = await getDoc(subSubcatRef);
            subSubcatData[cat] = subSubcatSnap.exists() ? subSubcatSnap.data() || {} : {};
          }
          console.log('Subcategories fetched:', subcatData);
          console.log('Sub-subcategories fetched:', subSubcatData);
          setSubcategories(subcatData);
          setSubSubcategories(subSubcatData);
        };

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

        Promise.all([fetchSubcategories(), fetchFees()]);
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
      setErrors((prev) => ({ ...prev, newCategory: 'Category name is required.' }));
      addAlert('Category name is required.', 'error');
      return;
    }
    if (categories.includes(newCategory.trim())) {
      setErrors((prev) => ({ ...prev, newCategory: 'Category already exists.' }));
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
      console.log('Adding category:', newCategory.trim());
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
      setErrors({});
      addAlert('Category added successfully! 🎉', 'success');
    } catch (err) {
      console.error('Error adding category:', err);
      addAlert('Failed to add category.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditCategory = async (oldName) => {
    if (!newCategory.trim()) {
      setErrors((prev) => ({ ...prev, newCategory: 'Category name is required.' }));
      addAlert('Category name is required.', 'error');
      return;
    }
    if (categories.includes(newCategory.trim()) && newCategory.trim() !== oldName) {
      setErrors((prev) => ({ ...prev, newCategory: 'Category name already exists.' }));
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
      console.log('Editing category:', oldName, 'to', newCategory.trim());
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
      setErrors({});
      addAlert('Category updated successfully! 🎉', 'success');
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
      console.log('Deleting category:', category);
      await deleteDoc(doc(db, 'categories', category));
      const updatedFees = { ...feeConfig };
      delete updatedFees[category];
      const feeRef = doc(db, 'feeConfigurations', 'categoryFees');
      await setDoc(feeRef, updatedFees);
      setFeeConfig(updatedFees);
      await deleteDoc(doc(db, 'customSubcategories', category));
      await deleteDoc(doc(db, 'customSubSubcategories', category));
      addAlert('Category deleted successfully! 🎉', 'success');
    } catch (err) {
      console.error('Error deleting category:', err);
      addAlert('Failed to delete category.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubcategory = async (category) => {
    const subcatName = newSubcategory[category]?.trim();
    if (!subcatName) {
      addAlert('Subcategory name is required.', 'error');
      return;
    }
    if (subcategories[category]?.includes(subcatName)) {
      addAlert('Subcategory already exists.', 'error');
      return;
    }
    setLoading(true);
    try {
      console.log('Adding subcategory to', category, ':', subcatName);
      const subcatRef = doc(db, 'customSubcategories', category);
      const subcatSnap = await getDoc(subcatRef);
      const existingSubcats = subcatSnap.exists() ? subcatSnap.data().subcategories || [] : [];
      const updatedSubcats = [...existingSubcats, subcatName];
      await setDoc(subcatRef, { subcategories: updatedSubcats });
      setSubcategories((prev) => ({ ...prev, [category]: updatedSubcats }));
      setNewSubcategory((prev) => ({ ...prev, [category]: '' }));
      addAlert(`Subcategory "${subcatName}" added! 🎉`, 'success');
    } catch (err) {
      console.error('Error adding subcategory:', err);
      addAlert('Failed to add subcategory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubSubcategory = async (category, subcategory) => {
    const subSubcatName = newSubSubcategory[`${category}_${subcategory}`]?.trim();
    if (!subSubcatName) {
      addAlert('Sub-subcategory name is required.', 'error');
      return;
    }
    if (subSubcategories[category]?.[subcategory]?.includes(subSubcatName)) {
      addAlert('Sub-subcategory already exists.', 'error');
      return;
    }
    setLoading(true);
    try {
      console.log('Adding sub-subcategory to', category, subcategory, ':', subSubcatName);
      const subSubcatRef = doc(db, 'customSubSubcategories', category);
      const subSubcatSnap = await getDoc(subSubcatRef);
      const existingSubSubcats = subSubcatSnap.exists() ? subSubcatSnap.data() || {} : {};
      const updatedSubSubcats = {
        ...existingSubSubcats,
        [subcategory]: [...(existingSubSubcats[subcategory] || []), subSubcatName],
      };
      await setDoc(subSubcatRef, updatedSubSubcats);
      setSubSubcategories((prev) => ({
        ...prev,
        [category]: updatedSubSubcats,
      }));
      setNewSubSubcategory((prev) => ({ ...prev, [`${category}_${subcategory}`]: '' }));
      addAlert(`Sub-subcategory "${subSubcatName}" added! 🎉`, 'success');
    } catch (err) {
      console.error('Error adding sub-subcategory:', err);
      addAlert('Failed to add sub-subcategory.', 'error');
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

  const toggleCategoryExpansion = (category) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [category]: !prev[category],
    }));
  };

  const resetForm = () => {
    setNewCategory('');
    setNewFees({ minPrice: '', maxPrice: '', buyerProtectionRate: '', handlingRate: '' });
    setEditCategory(null);
    setErrors({});
  };

  if (!user || !feeConfig) {
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
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-start">
        <div className="w-full max-w-4xl bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-ld">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b-2 border-blue-500 pb-3 flex items-center gap-2">
            <i className="bx bx-category text-blue-500"></i>
            Manage Categories
          </h2>
          <div className="space-y-8">
            <div className="space-y-6 bg-gray-50 dark:bg-gray-700 p-6 rounded-lg shadow-inner">
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <i className="bx bx-plus-circle text-green-500"></i>
                {editCategory ? 'Edit Category' : 'Add New Category'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Category Name
                    <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Unique name for the category (e.g., Electronics)"></i>
                  </label>
                  <input
                    type="text"
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    placeholder="e.g., Electronics"
                    className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.newCategory ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                    disabled={loading}
                  />
                  {errors.newCategory && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.newCategory}
                    </p>
                  )}
                </div>
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Minimum Price (₦)
                    <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Minimum product price for this category"></i>
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">₦</span>
                    <input
                      type="number"
                      value={newFees.minPrice}
                      onChange={(e) => handleFeeChange('minPrice', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="1000"
                      className={`mt-1 w-full py-2 pl-8 pr-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.minPrice ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                      disabled={loading}
                    />
                  </div>
                  {errors.minPrice && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.minPrice}
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
                      value={newFees.maxPrice}
                      onChange={(e) => handleFeeChange('maxPrice', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="No maximum"
                      className={`mt-1 w-full py-2 pl-8 pr-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.maxPrice ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                      disabled={loading}
                    />
                  </div>
                  {errors.maxPrice && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.maxPrice}
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
                      value={newFees.buyerProtectionRate}
                      onChange={(e) => handleFeeChange('buyerProtectionRate', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="8"
                      className={`mt-1 w-full py-2 pl-3 pr-8 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.buyerProtectionRate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                      disabled={loading}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">%</span>
                  </div>
                  {errors.buyerProtectionRate && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.buyerProtectionRate}
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
                      value={newFees.handlingRate}
                      onChange={(e) => handleFeeChange('handlingRate', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="20"
                      className={`mt-1 w-full py-2 pl-3 pr-8 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.handlingRate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                      disabled={loading}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">%</span>
                  </div>
                  {errors.handlingRate && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.handlingRate}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-4 mt-6">
                {editCategory ? (
                  <>
                    <button
                      onClick={() => handleEditCategory(editCategory)}
                      disabled={loading}
                      className="py-2 px-6 rounded-lg text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-200 flex items-center gap-2 shadow-md"
                    >
                      <i className="bx bx-save"></i>
                      {loading ? 'Updating...' : 'Update Category'}
                    </button>
                    <button
                      onClick={resetForm}
                      disabled={loading}
                      className="py-2 px-6 rounded-lg text-white text-sm font-medium bg-red-600 hover:bg-red-700 disabled:bg-gray-400 transition-all duration-200 flex items-center gap-2 shadow-md"
                    >
                      <i className="bx bx-x"></i>
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleAddCategory}
                      disabled={loading}
                      className="py-2 px-6 rounded-lg text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-200 flex items-center gap-2 shadow-md"
                    >
                      <i className="bx bx-plus"></i>
                      {loading ? 'Adding...' : 'Add Category'}
                    </button>
                    <button
                      onClick={resetForm}
                      disabled={loading}
                      className="py-2 px-6 rounded-lg text-white text-sm font-medium bg-gray-600 hover:bg-gray-700 disabled:bg-gray-400 transition-all duration-200 flex items-center gap-2 shadow-md"
                    >
                      <i className="bx bx-refresh"></i>
                      Clear Form
                    </button>
                  </>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-list-ul text-blue-500"></i>
                Existing Categories
              </h3>
              {categories.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300 italic">No categories found. Add one above!</p>
              ) : (
                <ul className="space-y-4">
                  {categories.map((cat) => (
                    <li
                      key={cat}
                      className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200"
                    >
                      <div
                        className="flex justify-between items-center cursor-pointer"
                        onClick={() => toggleCategoryExpansion(cat)}
                      >
                        <span className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                          <i className={`bx bx-chevron-${expandedCategories[cat] ? 'up' : 'down'} text-blue-500`}></i>
                          {cat}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
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
                            className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 text-sm flex items-center gap-1"
                            title="Edit category"
                          >
                            <i className="bx bx-edit"></i>
                            Edit
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCategory(cat);
                            }}
                            disabled={loading}
                            className="text-red-600 hover:text-red-800 dark:hover:text-red-400 text-sm flex items-center gap-1"
                            title="Delete category"
                          >
                            <i className="bx bx-trash"></i>
                            Delete
                          </button>
                        </div>
                      </div>
                      {expandedCategories[cat] && (
                        <div className="mt-4 ml-4 space-y-4 animate-slide-down">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                              Add Subcategory
                              <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Subcategories group products within a category (e.g., Phones under Electronics)"></i>
                            </label>
                            <div className="flex gap-2 mt-1">
                              <input
                                type="text"
                                value={newSubcategory[cat] || ''}
                                onChange={(e) =>
                                  setNewSubcategory((prev) => ({ ...prev, [cat]: e.target.value }))
                                }
                                placeholder="e.g., Phones"
                                className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200"
                                disabled={loading}
                              />
                              <button
                                type="button"
                                onClick={() => handleAddSubcategory(cat)}
                                className="py-2 px-4 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-md"
                                disabled={loading}
                              >
                                {loading ? <i className="bx bx-loader bx-spin"></i> : <i className="bx bx-plus"></i>}
                                Add
                              </button>
                            </div>
                          </div>
                          {subcategories[cat]?.length > 0 && (
                            <ul className="space-y-3 ml-4">
                              {subcategories[cat].map((subcat) => (
                                <li key={subcat} className="flex flex-col">
                                  <div className="flex items-center gap-2">
                                    <i className="bx bx-subdirectory-right text-gray-500"></i>
                                    <span className="text-gray-600 dark:text-gray-300">{subcat}</span>
                                  </div>
                                  <div className="mt-2 ml-6">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                                      Add Sub-subcategory
                                      <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Further refine products (e.g., Smartphones under Phones)"></i>
                                    </label>
                                    <div className="flex gap-2 mt-1">
                                      <input
                                        type="text"
                                        value={newSubSubcategory[`${cat}_${subcat}`] || ''}
                                        onChange={(e) =>
                                          setNewSubSubcategory((prev) => ({
                                            ...prev,
                                            [`${cat}_${subcat}`]: e.target.value,
                                          }))
                                        }
                                        placeholder="e.g., Smartphones"
                                        className="w-full max-w-md py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200"
                                        disabled={loading}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleAddSubSubcategory(cat, subcat)}
                                        className="py-2 px-4 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-md"
                                        disabled={loading}
                                      >
                                        {loading ? <i className="bx bx-loader bx-spin"></i> : <i className="bx bx-plus"></i>}
                                        Add
                                      </button>
                                    </div>
                                    {subSubcategories[cat]?.[subcat]?.length > 0 && (
                                      <ul className="mt-2 space-y-1 ml-6">
                                        {subSubcategories[cat][subcat].map((subSubcat) => (
                                          <li key={subSubcat} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                            <i className="bx bx-subdirectory-right text-gray-400"></i>
                                            {subSubcat}
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
      </div>
    </div>
  );
}