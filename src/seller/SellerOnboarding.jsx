import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

const SellerOnboarding = () => {
  const [country, setCountry] = useState('');
  const [bankCode, setBankCode] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSetup = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not logged in');

      const response = await fetch('http://localhost:5000/create-seller-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sellerId: user.uid,
          email: user.email,
          country,
          bankCode: country === 'Nigeria' ? bankCode : undefined,
          accountNumber: country === 'Nigeria' ? accountNumber : undefined,
        }),
      });

      const result = await response.json();
      if (result.error) throw new Error(result.error);

      if (result.status === 'redirect') {
        window.location.href = result.redirectUrl;
        return;
      }

      await setDoc(doc(db, 'sellers', user.uid), {
        email: user.email,
        paystackRecipientCode: result.paystackRecipientCode || null,
        stripeAccountId: result.stripeAccountId || null,
        country,
        createdAt: new Date(),
      });

      navigate('/wallet');
    } catch (err) {
      setError('Setup failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">Become a Seller</h2>
        {error && <p className="text-red-600 mb-4">{error}</p>}
        <form onSubmit={handleSetup}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Country</label>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="mt-1 p-2 w-full border rounded"
              required
            >
              <option value="">Select Country</option>
              <option value="Nigeria">Nigeria</option>
              <option value="United Kingdom">United Kingdom</option>
            </select>
          </div>
          {country === 'Nigeria' && (
            <>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Bank Code</label>
                <input
                  type="text"
                  value={bankCode}
                  onChange={(e) => setBankCode(e.target.value)}
                  className="mt-1 p-2 w-full border rounded"
                  placeholder="e.g., 044"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="mt-1 p-2 w-full border rounded"
                  placeholder="e.g., 1234567890"
                  required
                />
              </div>
            </>
          )}
          <button
            type="submit"
            disabled={loading}
            className={`w-full p-2 bg-blue-600 text-white rounded ${
              loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-700'
            }`}
          >
            {loading ? 'Processing...' : 'Complete Setup'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default SellerOnboarding;