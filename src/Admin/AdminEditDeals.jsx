import React, { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '/src/firebase';
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
  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };
  return { alerts, addAlert, removeAlert };
}

export default function AdminEditDailyDeals() {
  const { alerts, addAlert, removeAlert } = useAlerts();
  const [deals, setDeals] = useState([]);
  const [products, setProducts] = useState([]);
  const [newDeal, setNewDeal] = useState({
    id: '',
    productId: '',
    discount: '',
    startDate: '',
    endDate: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedForm, setExpandedForm] = useState(true);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch products
        const productSnapshot = await getDocs(collection(db, 'products'));
        const productList = productSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((p) => p.status === 'approved');
        setProducts(productList);

        // Fetch deals
        const dealSnapshot = await getDocs(collection(db, 'dailyDeals'));
        const dealList = dealSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setDeals(dealList);
        addAlert('Data loaded successfully!', 'success');
      } catch (err) {
        console.error('Error fetching data:', err);
        addAlert('Failed to load products or deals.', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDeal((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!newDeal.productId) newErrors.productId = 'Please select a product.';
    if (!newDeal.discount || newDeal.discount < 0 || newDeal.discount > 100) {
      newErrors.discount = 'Discount must be between 0 and 100%.';
    }
    if (!newDeal.startDate) newErrors.startDate = 'Start date is required.';
    if (!newDeal.endDate) newErrors.endDate = 'End date is required.';
    if (newDeal.startDate && newDeal.endDate && newDeal.startDate > newDeal.endDate) {
      newErrors.endDate = 'End date must be after start date.';
    }
    return newErrors;
  };

  const handleSaveDeal = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      addAlert('Please fix form errors.', 'error');
      return;
    }

    try {
      setLoading(true);
      const dealId = isEditing ? newDeal.id : `deal-${Date.now()}`;
      const dealData = {
        productId: newDeal.productId,
        discount: parseFloat(newDeal.discount) / 100,
        startDate: newDeal.startDate,
        endDate: newDeal.endDate,
        createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, 'dailyDeals', dealId), dealData);
      addAlert(isEditing ? 'Deal updated successfully! 🎉' : 'Deal added successfully! 🎉', 'success');
      setDeals((prev) =>
        isEditing
          ? prev.map((deal) => (deal.id === dealId ? { id: dealId, ...dealData } : deal))
          : [...prev, { id: dealId, ...dealData }]
      );
      resetForm();
    } catch (err) {
      console.error('Error saving deal:', err);
      addAlert('Failed to save deal.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditDeal = (deal) => {
    setNewDeal({
      id: deal.id,
      productId: deal.productId,
      discount: (deal.discount * 100).toString(),
      startDate: deal.startDate,
      endDate: deal.endDate,
    });
    setIsEditing(true);
    setExpandedForm(true);
  };

  const handleDeleteDeal = async (dealId) => {
    if (!confirm('Delete this deal?')) return;
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'dailyDeals', dealId));
      setDeals((prev) => prev.filter((deal) => deal.id !== dealId));
      addAlert('Deal deleted successfully!', 'success');
    } catch (err) {
      console.error('Error deleting deal:', err);
      addAlert('Failed to delete deal.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setNewDeal({ id: '', productId: '', discount: '', startDate: '', endDate: '' });
    setIsEditing(false);
    setErrors({});
  };

  const toggleFormExpansion = () => {
    setExpandedForm((prev) => !prev);
  };

  const getProduct = (productId) => products.find((p) => p.id === productId) || {};

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
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-5 flex justify-center items-start">
        <div className="w-full max-w-5xl bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b-2 border-blue-500 pb-3 flex items-center gap-2">
            <i className="bx bx-purchase-tag text-blue-500"></i>
            Manage Daily Deals
          </h2>
          <div className="p-6 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 transition-all duration-200">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={toggleFormExpansion}
            >
              <span className="font-medium text-gray-800 dark:text-gray-100 flex items-center gap-2">
                <i className={`bx bx-chevron-${expandedForm ? 'up' : 'down'} text-blue-500`}></i>
                {isEditing ? 'Edit Deal' : 'Add New Deal'}
              </span>
              {isEditing && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetForm();
                  }}
                  className="text-gray-600 hover:text-gray-800 dark:hover:text-gray-400 text-sm flex items-center gap-1"
                  title="Cancel editing"
                >
                  <i className="bx bx-x"></i>
                  Cancel
                </button>
              )}
            </div>
            {expandedForm && (
              <form onSubmit={handleSaveDeal} className="mt-4 ml-4 space-y-4 animate-slide-down">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Product
                      <i
                        className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help"
                        title="Select a product for the deal"
                      ></i>
                    </label>
                    <select
                      name="productId"
                      value={newDeal.productId}
                      onChange={handleInputChange}
                      className={`mt-1 w-full py-2 pl-3 pr-8 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.productId ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name || 'Unnamed Product'}
                        </option>
                      ))}
                    </select>
                    {errors.productId && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <i className="bx bx-error-circle"></i>
                        {errors.productId}
                      </p>
                    )}
                  </div>
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Discount (%)
                      <i
                        className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help"
                        title="Discount percentage for the deal"
                      ></i>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        name="discount"
                        value={newDeal.discount}
                        onChange={handleInputChange}
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="20"
                        className={`mt-1 w-full py-2 pl-3 pr-8 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                          errors.discount ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                      />
                      <span className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-500">%</span>
                    </div>
                    {errors.discount && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <i className="bx bx-error-circle"></i>
                        {errors.discount}
                      </p>
                    )}
                  </div>
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Start Date
                      <i
                        className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help"
                        title="When the deal starts"
                      ></i>
                    </label>
                    <input
                      type="date"
                      name="startDate"
                      value={newDeal.startDate}
                      onChange={handleInputChange}
                      className={`mt-1 w-full py-2 pl-3 pr-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.startDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                    />
                    {errors.startDate && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <i className="bx bx-error-circle"></i>
                        {errors.startDate}
                      </p>
                    )}
                  </div>
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      End Date
                      <i
                        className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help"
                        title="When the deal ends"
                      ></i>
                    </label>
                    <input
                      type="date"
                      name="endDate"
                      value={newDeal.endDate}
                      onChange={handleInputChange}
                      className={`mt-1 w-full py-2 pl-3 pr-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.endDate ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                    />
                    {errors.endDate && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <i className="bx bx-error-circle"></i>
                        {errors.endDate}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    type="submit"
                    disabled={loading}
                    className="py-2 px-6 rounded-lg text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 transition-all duration-200 flex items-center gap-2 shadow-sm"
                  >
                    {loading ? <i className="bx bx-loader bx-spin"></i> : <i className="bx bx-save"></i>}
                    {loading ? 'Saving...' : isEditing ? 'Update Deal' : 'Add Deal'}
                  </button>
                </div>
              </form>
            )}
          </div>
          <div className="mt-6 p-6 bg-white dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
            <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
              <i className="bx bx-list-ul text-blue-500"></i>
              Current Daily Deals
            </h3>
            {deals.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300 italic">No deals available.</p>
            ) : (
              <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {deals.map((deal) => {
                  const product = getProduct(deal.productId);
                  return (
                    <li
                      key={deal.id}
                      className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:shadow-md transition-all duration-200"
                    >
                      <img
                        src={product.imageUrls?.[0] || '/images/placeholder.jpg'}
                        alt={product.name || 'Product'}
                        className="h-32 w-full object-cover rounded-lg mb-2"
                      />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                          {product.name || 'Unnamed Product'}
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          Discount: {(deal.discount * 100).toFixed(2)}%
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300">
                          {deal.startDate} to {deal.endDate}
                        </p>
                      </div>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          Deal {deal.id.split('-')[1]}
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditDeal(deal)}
                            className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
                            title="Edit deal"
                          >
                            <i className="bx bx-edit"></i>
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteDeal(deal.id)}
                            className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
                            title="Delete deal"
                          >
                            <i className="bx bx-trash"></i>
                            Delete
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
      </div>
    </div>
  );
}