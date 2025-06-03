import React, { useState } from 'react';
import { db, auth } from '/src/firebase';
import { doc, setDoc } from 'firebase/firestore';
import axios from 'axios';
import { toast } from 'react-toastify';

const SellerOnboarding = () => {
  const [formData, setFormData] = useState({
    bankCode: '',
    accountNumber: '',
    country: 'Nigeria', // Default to Nigeria, can toggle for UK
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) {
        throw new Error('You must be logged in to onboard.');
      }

      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/onboard-seller`, {
        userId,
        bankCode: formData.bankCode,
        accountNumber: formData.accountNumber,
        country: formData.country,
      });

      // Save minimal seller data to Firestore
      await setDoc(doc(db, 'sellers', userId), {
        userId,
        email: auth.currentUser.email,
        country: formData.country,
        paystackRecipientCode: formData.country === 'Nigeria' ? response.data.recipientCode : null,
        stripeAccountId: formData.country === 'United Kingdom' ? response.data.stripeAccountId : null,
        onboarded: true,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      toast.success('Onboarding successful! You can now receive payouts.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } catch (error) {
      console.error('Onboarding error:', error);
      toast.error(error.message || 'Failed to onboard. Try again.', {
        position: 'top-right',
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold mb-4">Seller Onboarding</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
        <div>
          <label htmlFor="country" className="block text-sm font-medium text-gray-700">
            Country
          </label>
          <select
            id="country"
            name="country"
            value={formData.country}
            onChange={handleInputChange}
            className="mt-1 w-full p-3 border border-gray-300 rounded-lg"
            disabled={loading}
          >
            <option value="Nigeria">Nigeria</option>
            <option value="United Kingdom">United Kingdom</option>
          </select>
        </div>
        {formData.country === 'Nigeria' && (
          <>
            <div>
              <label htmlFor="bankCode" className="block text-sm font-medium text-gray-700">
                Bank Code (e.g., 044 for Access Bank)
              </label>
              <input
                type="text"
                id="bankCode"
                name="bankCode"
                value={formData.bankCode}
                onChange={handleInputChange}
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg"
                required
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
                Account Number
              </label>
              <input
                type="text"
                id="accountNumber"
                name="accountNumber"
                value={formData.accountNumber}
                onChange={handleInputChange}
                className="mt-1 w-full p-3 border border-gray-300 rounded-lg"
                required
                disabled={loading}
              />
            </div>
          </>
        )}
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg text-white text-sm font-medium transition duration-200 ${
            loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800'
          }`}
        >
          {loading ? 'Processing...' : 'Complete Onboarding'}
        </button>
      </form>
      {formData.country === 'United Kingdom' && (
        <p className="mt-4 text-sm text-gray-600">
          You’ll be redirected to Stripe to complete onboarding after submitting.
        </p>
      )}
    </div>
  );
};

export default SellerOnboarding;