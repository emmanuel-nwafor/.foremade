import React, { useState, useEffect } from 'react';
import { db } from '/src/firebase';
import { doc, getDoc, setDoc, collection, deleteDoc, getDocs, onSnapshot, query, where, writeBatch } from 'firebase/firestore'; // Added writeBatch for product updates
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
  const removeAlert = (id) => setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  return { alerts, addAlert, removeAlert };
}

const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`Retry ${attempt}/${maxRetries} after ${delay}ms due to: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

export default function AdminCategoryEdit() {
  const { alerts, addAlert, removeAlert } = useAlerts();
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [subSubcategories, setSubSubcategories] = useState({});
  const [newCategory, setNewCategory] = useState('');
  const [newBannerDesktop, setNewBannerDesktop] = useState(''); // New: For dynamic banners
  const [newBannerMobile, setNewBannerMobile] = useState('');
  const [editCategory, setEditCategory] = useState(null);
  const [feeConfig, setFeeConfig] = useState(null);
  const [newFees, setNewFees] = useState({
    minPrice: '',
    maxPrice: '',
    buyerProtectionRate: '',
    handlingRate: '',
    taxRate: '',
  });
  const [newSubcategory, setNewSubcategory] = useState({});
  const [newSubSubcategory, setNewSubSubcategory] = useState({});
  const [editSubcategory, setEditSubcategory] = useState(null);
  const [editSubSubcategory, setEditSubSubcategory] = useState(null);
  const [errors, setErrors] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [showDeleteModal, setShowDeleteModal] = useState({ category: null, subcategory: null, subSubcategory: null });

  useEffect(() => {
    let isMounted = true;

    // New: Real-time listeners for all data
    const unsubCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const catList = snapshot.docs.map((doc) => doc.id).sort();
      if (isMounted) setCategories(catList);
    });

    const unsubSubcats = onSnapshot(collection(db, 'customSubcategories'), (snapshot) => {
      const subcatData = {};
      snapshot.forEach((doc) => {
        subcatData[doc.id] = doc.data().subcategories || [];
      });
      if (isMounted) setSubcategories(subcatData);
    });

    const unsubSubSubcats = onSnapshot(collection(db, 'customSubSubcategories'), (snapshot) => {
      const subSubcatData = {};
      snapshot.forEach((doc) => {
        subSubcatData[doc.id] = doc.data() || {};
      });
      if (isMounted) setSubSubcategories(subSubcatData);
    });

    const unsubFees = onSnapshot(doc(db, 'feeConfigurations', 'categoryFees'), (docSnap) => {
      if (docSnap.exists()) {
        if (isMounted) setFeeConfig(docSnap.data());
      } else {
        const defaultFees = {};
        setDoc(doc(db, 'feeConfigurations', 'categoryFees'), defaultFees);
        if (isMounted) setFeeConfig(defaultFees);
      }
    });

    setLoading(false);

    return () => {
      isMounted = false;
      unsubCategories();
      unsubSubcats();
      unsubSubSubcats();
      unsubFees();
    };
  }, []);

  const handleAddCategory = async () => {
    if (!newCategory.trim()) {
      setErrors({ newCategory: 'Category name is required.' });
      addAlert('Category name is required.', 'error');
      return;
    }
    if (categories.includes(newCategory.trim())) {
      setErrors({ newCategory: 'Category already exists.' });
      addAlert('Category already exists.', 'error');
      return;
    }
    const newErrors = {};
    if (newFees.minPrice && parseFloat(newFees.minPrice) < 0) newErrors.minPrice = 'Minimum price cannot be negative.';
    if (newFees.maxPrice && parseFloat(newFees.maxPrice) < (parseFloat(newFees.minPrice) || 0)) {
      newErrors.maxPrice = 'Maximum price must be greater than minimum price.';
    }
    if (newFees.buyerProtectionRate && (parseFloat(newFees.buyerProtectionRate) < 0 || parseFloat(newFees.buyerProtectionRate) > 100)) {
      newErrors.buyerProtectionRate = 'Rate must be between 0 and 100%.';
    }
    if (newFees.handlingRate && (parseFloat(newFees.handlingRate) < 0 || parseFloat(newFees.handlingRate) > 100)) {
      newErrors.handlingRate = 'Rate must be between 0 and 100%.';
    }
    if (newFees.taxRate && (parseFloat(newFees.taxRate) < 0 || parseFloat(newFees.taxRate) > 100)) {
      newErrors.taxRate = 'Tax rate must be between 0 and 100%.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addAlert('Please fix the form errors.', 'error');
      return;
    }
    setLoading(true);
    try {
      const catRef = doc(db, 'categories', newCategory.trim());
      await setDoc(catRef, { 
        name: newCategory.trim(), 
        createdAt: new Date(),
        bannerDesktop: newBannerDesktop || fallbackBanner, // New: Store banners
        bannerMobile: newBannerMobile || fallbackBanner
      });
      const feeRef = doc(db, 'feeConfigurations', 'categoryFees');
      const updatedFees = {
        ...feeConfig,
        [newCategory.trim()]: {
          minPrice: parseFloat(newFees.minPrice) || 1000,
          maxPrice: newFees.maxPrice ? parseFloat(newFees.maxPrice) : Infinity,
          buyerProtectionRate: (parseFloat(newFees.buyerProtectionRate) || 8) / 100,
          handlingRate: (parseFloat(newFees.handlingRate) || 20) / 100,
          taxRate: (parseFloat(newFees.taxRate) || 7.5) / 100,
        },
      };
      await setDoc(feeRef, updatedFees);
      // No need to setCategories, onSnapshot handles it
      setNewCategory('');
      setNewBannerDesktop('');
      setNewBannerMobile('');
      setNewFees({ minPrice: '', maxPrice: '', buyerProtectionRate: '', handlingRate: '', taxRate: '' });
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
      setErrors({ newCategory: 'Category name is required.' });
      addAlert('Category name is required.', 'error');
      return;
    }
    if (categories.includes(newCategory.trim()) && newCategory.trim() !== oldName) {
      setErrors({ newCategory: 'Category name already exists.' });
      addAlert('Category name already exists.', 'error');
      return;
    }
    const newErrors = {};
    if (newFees.minPrice && parseFloat(newFees.minPrice) < 0) newErrors.minPrice = 'Minimum price cannot be negative.';
    if (newFees.maxPrice && parseFloat(newFees.maxPrice) < (parseFloat(newFees.minPrice) || 0)) {
      newErrors.maxPrice = 'Maximum price must be greater than minimum price.';
    }
    if (newFees.buyerProtectionRate && (parseFloat(newFees.buyerProtectionRate) < 0 || parseFloat(newFees.buyerProtectionRate) > 100)) {
      newErrors.buyerProtectionRate = 'Rate must be between 0 and 100%.';
    }
    if (newFees.handlingRate && (parseFloat(newFees.handlingRate) < 0 || parseFloat(newFees.handlingRate) > 100)) {
      newErrors.handlingRate = 'Rate must be between 0 and 100%.';
    }
    if (newFees.taxRate && (parseFloat(newFees.taxRate) < 0 || parseFloat(newFees.taxRate) > 100)) {
      newErrors.taxRate = 'Tax rate must be between 0 and 100%.';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addAlert('Please fix the form errors.', 'error');
      return;
    }
    setLoading(true);
    try {
      const oldCatRef = doc(db, 'categories', oldName);
      const oldCatSnap = await getDoc(oldCatRef); // Get existing data for banners if not changed
      const existingData = oldCatSnap.data();
      const newCatRef = doc(db, 'categories', newCategory.trim());
      await setDoc(newCatRef, { 
        name: newCategory.trim(), 
        createdAt: new Date(),
        bannerDesktop: newBannerDesktop || existingData.bannerDesktop || fallbackBanner, // New: Update banners
        bannerMobile: newBannerMobile || existingData.bannerMobile || fallbackBanner
      });
      await deleteDoc(oldCatRef);

      const updatedFees = { ...feeConfig };
      updatedFees[newCategory.trim()] = {
        minPrice: parseFloat(newFees.minPrice) || updatedFees[oldName].minPrice,
        maxPrice: newFees.maxPrice ? parseFloat(newFees.maxPrice) : updatedFees[oldName].maxPrice,
        buyerProtectionRate: (parseFloat(newFees.buyerProtectionRate) || updatedFees[oldName].buyerProtectionRate * 100) / 100,
        handlingRate: (parseFloat(newFees.handlingRate) || updatedFees[oldName].handlingRate * 100) / 100,
        taxRate: (parseFloat(newFees.taxRate) || (updatedFees[oldName].taxRate || 7.5)) / 100,
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

      // New: Update products with old category to new category (lowercase for consistency)
      const productQuery = query(collection(db, 'products'), where('category', '==', oldName.toLowerCase()));
      const productSnap = await getDocs(productQuery);
      const batch = writeBatch(db);
      productSnap.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { category: newCategory.trim().toLowerCase() });
      });
      await batch.commit();
      addAlert(`Updated ${productSnap.size} products to new category.`, 'success');

      // onSnapshot will handle state updates
      setNewCategory('');
      setNewBannerDesktop('');
      setNewBannerMobile('');
      setNewFees({ minPrice: '', maxPrice: '', buyerProtectionRate: '', handlingRate: '', taxRate: '' });
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
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'categories', category));
      const updatedFees = { ...feeConfig };
      delete updatedFees[category];
      const feeRef = doc(db, 'feeConfigurations', 'categoryFees');
      await setDoc(feeRef, updatedFees);
      await deleteDoc(doc(db, 'customSubcategories', category));
      await deleteDoc(doc(db, 'customSubSubcategories', category));

      // New: Update products to 'Uncategorized'
      const productQuery = query(collection(db, 'products'), where('category', '==', category.toLowerCase()));
      const productSnap = await getDocs(productQuery);
      const batch = writeBatch(db);
      productSnap.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { category: 'uncategorized' });
      });
      await batch.commit();
      addAlert(`Updated ${productSnap.size} products to Uncategorized.`, 'success');

      // onSnapshot handles state
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
      const subcatRef = doc(db, 'customSubcategories', category);
      const subcatSnap = await getDoc(subcatRef);
      const existingSubcats = subcatSnap.exists() ? subcatSnap.data().subcategories || [] : [];
      const updatedSubcats = [...existingSubcats, subcatName];
      await setDoc(subcatRef, { subcategories: updatedSubcats });
      // onSnapshot handles state
      setNewSubcategory((prev) => ({ ...prev, [category]: '' }));
      addAlert(`Subcategory "${subcatName}" added! 🎉`, 'success');
    } catch (err) {
      console.error('Error adding subcategory:', err);
      addAlert('Failed to add subcategory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubcategory = async (category, oldSubcat) => {
    const newSubcatName = newSubcategory[category]?.trim();
    if (!newSubcatName) {
      addAlert('Subcategory name is required.', 'error');
      return;
    }
    if (subcategories[category]?.includes(newSubcatName) && newSubcatName !== oldSubcat) {
      addAlert('Subcategory name already exists.', 'error');
      return;
    }
    setLoading(true);
    try {
      const subcatRef = doc(db, 'customSubcategories', category);
      const subcatSnap = await getDoc(subcatRef);
      const existingSubcats = subcatSnap.exists() ? subcatSnap.data().subcategories || [] : [];
      const updatedSubcats = existingSubcats.map((s) => (s === oldSubcat ? newSubcatName : s));
      await setDoc(subcatRef, { subcategories: updatedSubcats });

      const subSubcatRef = doc(db, 'customSubSubcategories', category);
      const subSubcatSnap = await getDoc(subSubcatRef);
      const existingSubSubcats = subSubcatSnap.exists() ? subSubcatSnap.data() || {} : {};
      const updatedSubSubcats = Object.fromEntries(
        Object.entries(existingSubSubcats).map(([key, value]) =>
          key === oldSubcat ? [newSubcatName, value] : [key, value]
        )
      );
      await setDoc(subSubcatRef, updatedSubSubcats);

      // New: Update products with old subcategory
      const productQuery = query(
        collection(db, 'products'),
        where('category', '==', category.toLowerCase()),
        where('subcategory', '==', oldSubcat)
      );
      const productSnap = await getDocs(productQuery);
      const batch = writeBatch(db);
      productSnap.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { subcategory: newSubcatName });
      });
      await batch.commit();
      addAlert(`Updated ${productSnap.size} products to new subcategory.`, 'success');

      // onSnapshot handles state
      setNewSubcategory((prev) => ({ ...prev, [category]: '' }));
      setEditSubcategory(null);
      addAlert(`Subcategory "${oldSubcat}" updated to "${newSubcatName}"! 🎉`, 'success');
    } catch (err) {
      console.error('Error editing subcategory:', err);
      addAlert('Failed to edit subcategory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubcategory = async (category, subcategory) => {
    setLoading(true);
    try {
      const subcatRef = doc(db, 'customSubcategories', category);
      const subcatSnap = await getDoc(subcatRef);
      const existingSubcats = subcatSnap.exists() ? subcatSnap.data().subcategories || [] : [];
      const updatedSubcats = existingSubcats.filter((s) => s !== subcategory);
      await setDoc(subcatRef, { subcategories: updatedSubcats });

      const subSubcatRef = doc(db, 'customSubSubcategories', category);
      const subSubcatSnap = await getDoc(subSubcatRef);
      const existingSubSubcats = subSubcatSnap.exists() ? subSubcatSnap.data() || {} : {};
      const updatedSubSubcats = { ...existingSubSubcats };
      delete updatedSubSubcats[subcategory];
      await setDoc(subSubcatRef, updatedSubSubcats);

      // New: Update products to 'Uncategorized' subcategory
      const productQuery = query(
        collection(db, 'products'),
        where('category', '==', category.toLowerCase()),
        where('subcategory', '==', subcategory)
      );
      const productSnap = await getDocs(productQuery);
      const batch = writeBatch(db);
      productSnap.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { subcategory: 'uncategorized' });
      });
      await batch.commit();
      addAlert(`Updated ${productSnap.size} products to uncategorized subcategory.`, 'success');

      // onSnapshot handles state
      addAlert(`Subcategory "${subcategory}" deleted successfully! 🎉`, 'success');
    } catch (err) {
      console.error('Error deleting subcategory:', err);
      addAlert('Failed to delete subcategory.', 'error');
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
      const subSubcatRef = doc(db, 'customSubSubcategories', category);
      const subSubcatSnap = await getDoc(subSubcatRef);
      const existingSubSubcats = subSubcatSnap.exists() ? subSubcatSnap.data() || {} : {};
      const updatedSubSubcats = {
        ...existingSubSubcats,
        [subcategory]: [...(existingSubSubcats[subcategory] || []), subSubcatName],
      };
      await setDoc(subSubcatRef, updatedSubSubcats);
      // onSnapshot handles state
      setNewSubSubcategory((prev) => ({ ...prev, [`${category}_${subcategory}`]: '' }));
      addAlert(`Sub-subcategory "${subSubcatName}" added! 🎉`, 'success');
    } catch (err) {
      console.error('Error adding sub-subcategory:', err);
      addAlert('Failed to add sub-subcategory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubSubcategory = async (category, subcategory, oldSubSubcat) => {
    const newSubSubcatName = newSubSubcategory[`${category}_${subcategory}`]?.trim();
    if (!newSubSubcatName) {
      addAlert('Sub-subcategory name is required.', 'error');
      return;
    }
    if (subSubcategories[category]?.[subcategory]?.includes(newSubSubcatName) && newSubSubcatName !== oldSubSubcat) {
      addAlert('Sub-subcategory already exists.', 'error');
      return;
    }
    setLoading(true);
    try {
      const subSubcatRef = doc(db, 'customSubSubcategories', category);
      const subSubcatSnap = await getDoc(subSubcatRef);
      const existingSubSubcats = subSubcatSnap.exists() ? subSubcatSnap.data() || {} : {};
      const updatedSubSubcats = {
        ...existingSubSubcats,
        [subcategory]: existingSubSubcats[subcategory].map((s) => (s === oldSubSubcat ? newSubSubcatName : s)),
      };
      await setDoc(subSubcatRef, updatedSubSubcats);

      // New: Update products with old subSubcategory
      const productQuery = query(
        collection(db, 'products'),
        where('category', '==', category.toLowerCase()),
        where('subcategory', '==', subcategory),
        where('subSubcategory', '==', oldSubSubcat)
      );
      const productSnap = await getDocs(productQuery);
      const batch = writeBatch(db);
      productSnap.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { subSubcategory: newSubSubcatName });
      });
      await batch.commit();
      addAlert(`Updated ${productSnap.size} products to new sub-subcategory.`, 'success');

      // onSnapshot handles state
      setNewSubSubcategory((prev) => ({ ...prev, [`${category}_${subcategory}`]: '' }));
      setEditSubSubcategory(null);
      addAlert(`Sub-subcategory "${oldSubSubcat}" updated to "${newSubSubcatName}"! 🎉`, 'success');
    } catch (err) {
      console.error('Error editing sub-subcategory:', err);
      addAlert('Failed to edit sub-subcategory.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubSubcategory = async (category, subcategory, subSubcategory) => {
    setLoading(true);
    try {
      const subSubcatRef = doc(db, 'customSubSubcategories', category);
      const subSubcatSnap = await getDoc(subSubcatRef);
      const existingSubSubcats = subSubcatSnap.exists() ? subSubcatSnap.data() || {} : {};
      const updatedSubSubcats = {
        ...existingSubSubcats,
        [subcategory]: existingSubSubcats[subcategory].filter((s) => s !== subSubcategory),
      };
      await setDoc(subSubcatRef, updatedSubSubcats);

      // New: Update products to 'Uncategorized' subSubcategory
      const productQuery = query(
        collection(db, 'products'),
        where('category', '==', category.toLowerCase()),
        where('subcategory', '==', subcategory),
        where('subSubcategory', '==', subSubcategory)
      );
      const productSnap = await getDocs(productQuery);
      const batch = writeBatch(db);
      productSnap.docs.forEach((docSnap) => {
        batch.update(docSnap.ref, { subSubcategory: 'uncategorized' });
      });
      await batch.commit();
      addAlert(`Updated ${productSnap.size} products to uncategorized sub-subcategory.`, 'success');

      // onSnapshot handles state
      addAlert(`Sub-subcategory "${subSubcategory}" deleted successfully! 🎉`, 'success');
    } catch (err) {
      console.error('Error deleting sub-subcategory:', err);
      addAlert('Failed to delete sub-subcategory.', 'error');
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
    setNewBannerDesktop('');
    setNewBannerMobile('');
    setNewFees({ minPrice: '', maxPrice: '', buyerProtectionRate: '', handlingRate: '', taxRate: '' });
    setEditCategory(null);
    setErrors({});
  };

  // New: When editing, prefill banners
  useEffect(() => {
    if (editCategory) {
      const fetchExisting = async () => {
        const catRef = doc(db, 'categories', editCategory);
        const catSnap = await getDoc(catRef);
        if (catSnap.exists()) {
          const data = catSnap.data();
          setNewBannerDesktop(data.bannerDesktop);
          setNewBannerMobile(data.bannerMobile);
        }
      };
      fetchExisting();
    }
  }, [editCategory]);

  if (loading || !feeConfig) {
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
      <div className="flex-1 ml-0 md:ml-64 p-5 flex justify-center items-start">
        <div className="w-full max-w-5xl bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-lg">
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
                {/* New: Banner inputs */}
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Desktop Banner URL
                    <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="URL for desktop category banner"></i>
                  </label>
                  <input
                    type="url"
                    value={newBannerDesktop}
                    onChange={(e) => setNewBannerDesktop(e.target.value)}
                    placeholder="https://example.com/banner-desktop.jpg"
                    className="mt-1 w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200"
                    disabled={loading}
                  />
                </div>
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Mobile Banner URL
                    <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="URL for mobile category banner"></i>
                  </label>
                  <input
                    type="url"
                    value={newBannerMobile}
                    onChange={(e) => setNewBannerMobile(e.target.value)}
                    placeholder="https://example.com/banner-mobile.jpg"
                    className="mt-1 w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200"
                    disabled={loading}
                  />
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
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Tax Rate (%)
                    <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Tax percentage for this category"></i>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={newFees.taxRate}
                      onChange={(e) => handleFeeChange('taxRate', e.target.value)}
                      min="0"
                      step="0.01"
                      placeholder="7.5"
                      className={`mt-1 w-full py-2 pl-3 pr-8 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.taxRate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                      disabled={loading}
                    />
                    <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">%</span>
                  </div>
                  {errors.taxRate && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.taxRate}
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
                                buyerProtectionRate: feeConfig[cat].buyerProtectionRate * 100,
                                handlingRate: feeConfig[cat].handlingRate * 100,
                                taxRate: feeConfig[cat].taxRate ? feeConfig[cat].taxRate * 100 : 7.5,
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
                              setShowDeleteModal({ ...showDeleteModal, category: cat });
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
                                  <div className="flex justify-between items-center">
                                    <span className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                                      <i className="bx bx-subdirectory-right text-gray-500"></i>
                                      {subcat}
                                    </span>
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => {
                                          setEditSubcategory({ category: cat, subcat });
                                          setNewSubcategory((prev) => ({ ...prev, [cat]: subcat }));
                                        }}
                                        disabled={loading}
                                        className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 text-sm flex items-center gap-1"
                                        title="Edit subcategory"
                                      >
                                        <i className="bx bx-edit"></i>
                                        Edit
                                      </button>
                                      <button
                                        onClick={() => setShowDeleteModal({ ...showDeleteModal, subcategory: { category: cat, subcat } })}
                                        disabled={loading}
                                        className="text-red-600 hover:text-red-800 dark:hover:text-red-400 text-sm flex items-center gap-1"
                                        title="Delete subcategory"
                                      >
                                        <i className="bx bx-trash"></i>
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                  {editSubcategory?.category === cat && editSubcategory.subcat === subcat && (
                                    <div className="mt-2 ml-4">
                                      <input
                                        type="text"
                                        value={newSubcategory[cat] || ''}
                                        onChange={(e) => setNewSubcategory((prev) => ({ ...prev, [cat]: e.target.value }))}
                                        className="w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200"
                                        disabled={loading}
                                      />
                                      <div className="flex gap-2 mt-2">
                                        <button
                                          onClick={() => handleEditSubcategory(cat, subcat)}
                                          disabled={loading}
                                          className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-md"
                                        >
                                          <i className="bx bx-save"></i> Save
                                        </button>
                                        <button
                                          onClick={() => setEditSubcategory(null)}
                                          disabled={loading}
                                          className="py-2 px-4 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-md"
                                        >
                                          <i className="bx bx-x"></i> Cancel
                                        </button>
                                      </div>
                                    </div>
                                  )}
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
                                        className="py-2 px-3 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-md"
                                        disabled={loading}
                                      >
                                        {loading ? <i className="bx bx-loader bx-spin"></i> : <i className="bx bx-plus"></i>}
                                      </button>
                                    </div>
                                    {subSubcategories[cat]?.[subcat]?.length > 0 && (
                                      <ul className="mt-2 space-y-1 ml-6">
                                        {subSubcategories[cat][subcat].map((subSubcat) => (
                                          <li key={subSubcat} className="flex justify-between items-center">
                                            <span className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                              <i className="bx bx-subdirectory-right text-gray-400"></i>
                                              {subSubcat}
                                            </span>
                                            <div className="flex gap-2">
                                              <button
                                                onClick={() => {
                                                  setEditSubSubcategory({ category: cat, subcategory: subcat, subSubcat });
                                                  setNewSubSubcategory((prev) => ({
                                                    ...prev,
                                                    [`${cat}_${subcat}`]: subSubcat,
                                                  }));
                                                }}
                                                disabled={loading}
                                                className="text-blue-600 hover:text-blue-800 dark:hover:text-blue-400 text-sm flex items-center gap-1"
                                                title="Edit sub-subcategory"
                                              >
                                                <i className="bx bx-edit text-[15px]"></i>
                                              </button>
                                              <button
                                                onClick={() => setShowDeleteModal({ ...showDeleteModal, subSubcategory: { category: cat, subcategory: subcat, subSubcat } })}
                                                disabled={loading}
                                                className="text-red-600 hover:text-red-800 dark:hover:text-red-400 text-sm flex items-center gap-1"
                                                title="Delete sub-subcategory"
                                              >
                                                <i className="bx bx-trash text-[15px]"></i>
                                              </button>
                                            </div>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                    {editSubSubcategory?.category === cat && editSubSubcategory.subcategory === subcat && editSubSubcategory.subSubcat && (
                                      <div className="mt-2 ml-6">
                                        <input
                                          type="text"
                                          value={newSubSubcategory[`${cat}_${subcat}`] || ''}
                                          onChange={(e) => setNewSubSubcategory((prev) => ({ ...prev, [`${cat}_${subcat}`]: e.target.value }))}
                                          className="w-full max-w-md py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200"
                                          disabled={loading}
                                        />
                                        <div className="flex gap-2 mt-2">
                                          <button
                                            onClick={() => handleEditSubSubcategory(cat, subcat, editSubSubcategory.subSubcat)}
                                            disabled={loading}
                                            className="py-2 px-4 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-md"
                                          >
                                            <i className="bx bx-save"></i>
                                          </button>
                                          <button
                                            onClick={() => setEditSubSubcategory(null)}
                                            disabled={loading}
                                            className="py-2 px-4 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-md"
                                          >
                                            <i className="bx bx-x"></i>
                                          </button>
                                        </div>
                                      </div>
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

          {showDeleteModal.category && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Confirm Deletion</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to delete the category "{showDeleteModal.category}"? Products will be set to 'uncategorized'. This action cannot be undone.</p> {/* Updated warning */}
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowDeleteModal({ ...showDeleteModal, category: null })}
                    className="py-2 px-4 bg-gray-300 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteCategory(showDeleteModal.category);
                      setShowDeleteModal({ ...showDeleteModal, category: null });
                    }}
                    className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition"
                    disabled={loading}
                  >
                    <i className="bx bx-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {showDeleteModal.subcategory && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Confirm Deletion</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to delete the subcategory "{showDeleteModal.subcategory.subcat}" under "{showDeleteModal.subcategory.category}"? Products will be set to 'uncategorized'. This action cannot be undone.</p> {/* Updated warning */}
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowDeleteModal({ ...showDeleteModal, subcategory: null })}
                    className="py-2 px-4 bg-gray-300 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteSubcategory(showDeleteModal.subcategory.category, showDeleteModal.subcategory.subcat);
                      setShowDeleteModal({ ...showDeleteModal, subcategory: null });
                    }}
                    className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition"
                    disabled={loading}
                  >
                    <i className="bx bx-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {showDeleteModal.subSubcategory && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
                <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4">Confirm Deletion</h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to delete the sub-subcategory "{showDeleteModal.subSubcategory.subSubcat}" under "{showDeleteModal.subSubcategory.subcategory}" in "{showDeleteModal.subSubcategory.category}"? Products will be set to 'uncategorized'. This action cannot be undone.</p> {/* Updated warning */}
                <div className="flex justify-end gap-4">
                  <button
                    onClick={() => setShowDeleteModal({ ...showDeleteModal, subSubcategory: null })}
                    className="py-2 px-4 bg-gray-300 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      handleDeleteSubSubcategory(
                        showDeleteModal.subSubcategory.category,
                        showDeleteModal.subSubcategory.subcategory,
                        showDeleteModal.subSubcategory.subSubcat
                      );
                      setShowDeleteModal({ ...showDeleteModal, subSubcategory: null });
                    }}
                    className="py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition"
                    disabled={loading}
                  >
                    <i className="bx bx-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
      </div>
    </div>
  );
}