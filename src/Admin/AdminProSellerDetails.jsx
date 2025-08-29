import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminSidebar from './AdminSidebar';
import { motion } from 'framer-motion';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '/src/firebase'; // Adjust path to your firebaseConfig.js

export default function AdminProSellerDetails() {
  const { proSellerId } = useParams();
  const navigate = useNavigate();
  const [proSeller, setProSeller] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProSellerDetails();
  }, [proSellerId]);

  const fetchProSellerDetails = async () => {
    setLoading(true);
    try {
      const proSellerRef = doc(db, 'proSellers', proSellerId); // Assuming 'proSellers' collection
      const proSellerSnap = await getDoc(proSellerRef);
      if (proSellerSnap.exists()) {
        const data = proSellerSnap.data();
        setProSeller(data);
        setFormData(data);
      } else {
        setError('Pro seller not found');
      }
    } catch (err) {
      console.error('Fetch error:', err);
      setError(`Failed to fetch pro seller details: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSave = async () => {
    try {
      const proSellerRef = doc(db, 'proSellers', proSellerId);
      await updateDoc(proSellerRef, formData);
      setProSeller(formData);
      setIsEditing(false);
      toast.success('Pro seller updated successfully');
    } catch (err) {
      console.error('Update error:', err);
      toast.error(err.message || 'Failed to update pro seller');
    }
  };

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this pro seller?')) {
      try {
        const proSellerRef = doc(db, 'proSellers', proSellerId);
        await deleteDoc(proSellerRef);
        toast.success('Pro seller deleted successfully');
        navigate('/admin/pro-seller-requests');
      } catch (err) {
      console.error('Delete error:', err);
      toast.error(err.message || 'Failed to delete pro seller');
    }
  };
}

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <AdminSidebar />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 ml-0 md:ml-64 p-4 md:p-6 lg:p-8"
        >
          <div className="max-w-8xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 lg:p-10 text-center">
            <p className="text-gray-600 dark:text-gray-400">Loading pro seller details...</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <AdminSidebar />
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex-1 ml-0 md:ml-64 p-4 md:p-6 lg:p-8"
        >
          <div className="max-w-8xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 lg:p-10 text-center">
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <AdminSidebar />
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex-1 ml-0 md:ml-64 p-4 md:p-6 lg:p-8"
      >
        <div className="max-w-8xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 md:p-8 lg:p-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 dark:text-gray-100 bg-clip-text text-transparent bg-gradient-to-r from-blue-900 to-amber-500 mb-6">
            Pro Seller Details
          </h1>
          <div className="flex justify-end mb-6">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-1 text-sm"
            >
              <i className="bx bx-edit"></i> {isEditing ? 'Cancel' : 'Edit'}
            </button>
            {isEditing && (
              <button
                onClick={handleSave}
                className="ml-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition flex items-center gap-1 text-sm"
              >
                <i className="bx bx-save"></i> Save
              </button>
            )}
            <button
              onClick={handleDelete}
              className="ml-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center gap-1 text-sm"
            >
              <i className="bx bx-trash"></i> Delete
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: 'Pro Seller ID', key: 'proSellerId' },
              { label: 'User ID', key: 'userId' },
              { label: 'Business Name', key: 'businessName' },
              { label: 'Account Name', key: 'accountName' },
              { label: 'Account Number', key: 'accountNumber' },
              { label: 'Bank Name', key: 'bankName' },
              { label: 'Address', key: 'address' },
              { label: 'Email', key: 'email' },
              { label: 'Phone', key: 'phone' },
              { label: 'Manager', key: 'manager' },
              { label: 'Manager Email', key: 'managerEmail' },
              { label: 'Manager Phone', key: 'managerPhone' },
              { label: 'Reg Number', key: 'regNumber' },
              { label: 'Tax Ref', key: 'taxRef' },
              { label: 'Country', key: 'country' },
              { label: 'Business Type', key: 'businessType' },
              { label: 'Status', key: 'status' },
              { label: 'Created At', key: 'createdAt', format: formatDate },
              { label: 'Updated At', key: 'updatedAt', format: formatDate },
              { label: 'Description', key: 'description' },
              { label: 'Categories', key: 'categories', isArray: true },
              { label: 'Analytics', key: 'features.analytics', isBoolean: true },
              { label: 'Bulk Upload', key: 'features.bulkUpload', isBoolean: true },
              { label: 'Priority Support', key: 'features.prioritySupport', isBoolean: true },
              { label: 'Product Bumping', key: 'features.productBumping', isBoolean: true },
              { label: 'Is Active', key: 'isActive', isBoolean: true },
              { label: 'Account Verified', key: 'extraFields.accountVerified', isBoolean: true },
              { label: 'Reg Verified', key: 'extraFields.regVerified', isBoolean: true },
              { label: 'Tax Verified', key: 'extraFields.taxVerified', isBoolean: true },
              { label: 'Website', key: 'website' },
            ].map(({ label, key, format = (v) => v, isArray = false, isBoolean = false }) => {
              const value = isArray ? (formData[key] || []).join(', ') : isBoolean ? formData[key] ? 'Yes' : 'No' : format(formData[key]);
              return (
                <div key={key} className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">{label}</label>
                  {isEditing ? (
                    <input
                      type={isBoolean ? 'checkbox' : 'text'}
                      name={key}
                      value={isBoolean ? undefined : formData[key] || ''}
                      checked={isBoolean ? !!formData[key] : undefined}
                      onChange={handleInputChange}
                      className="mt-1 p-2 w-full border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  ) : (
                    <p className="mt-1 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-900 dark:text-gray-100">{value || '-'}</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );

  function formatDate(dateObj) {
    if (!dateObj) return '-';
    if (dateObj instanceof Date) {
      return isNaN(dateObj.getTime()) ? '-' : dateObj.toLocaleDateString();
    }
    const d = new Date(dateObj);
    return isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
  }
}