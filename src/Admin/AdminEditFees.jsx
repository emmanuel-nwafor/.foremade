import React, { useState, useEffect } from 'react';
import { db } from '/src/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AdminSidebar from '/src/admin/AdminSidebar';

function AdminEditFees() {
  const [feesConfig, setFeesConfig] = useState({
    Small: { minPrice: 2000, maxPrice: 2999, buyerProtectionRate: 0.08, handlingRate: 0.20 },
    Medium: { minPrice: 3000, maxPrice: 4999, buyerProtectionRate: 0.085, handlingRate: 0.12 },
    Large: { minPrice: 5000, maxPrice: 9999, buyerProtectionRate: 0.09, handlingRate: 0.39 },
    'X-Large': { minPrice: 10000, maxPrice: Infinity, buyerProtectionRate: 0.095, handlingRate: 0.30 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch fee configurations from Firestore
  useEffect(() => {
    const fetchFeesConfig = async () => {
      try {
        const docRef = doc(db, 'feeConfigurations', 'defaultFees');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFeesConfig(docSnap.data());
        }
      } catch (err) {
        setError('Failed to fetch fee configurations: ' + err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFeesConfig();
  }, []);

  const handleChange = (size, field, value) => {
    setFeesConfig((prev) => ({
      ...prev,
      [size]: {
        ...prev[size],
        [field]: field.includes('Rate') ? parseFloat(value) : parseInt(value, 10),
      },
    }));
  };

  const validateForm = () => {
    const errors = [];
    Object.entries(feesConfig).forEach(([size, config]) => {
      if (config.buyerProtectionRate <= 0 || isNaN(config.buyerProtectionRate)) {
        errors.push(`${size} Buyer Protection Rate must be greater than 0.`);
      }
      if (config.handlingRate <= 0 || isNaN(config.handlingRate)) {
        errors.push(`${size} Handling Rate must be greater than 0.`);
      }
      if (config.minPrice <= 0 || isNaN(config.minPrice)) {
        errors.push(`${size} Minimum Price must be greater than 0.`);
      }
      if (size !== 'X-Large' && (config.maxPrice <= config.minPrice || isNaN(config.maxPrice))) {
        errors.push(`${size} Maximum Price must be greater than Minimum Price.`);
      }
    });
    return errors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setError(validationErrors.join(' '));
      setLoading(false);
      return;
    }

    try {
      const docRef = doc(db, 'feeConfigurations', 'defaultFees');
      await setDoc(docRef, feesConfig);
      setSuccess('Fee configurations updated successfully!');
    } catch (err) {
      setError('Failed to save fee configurations: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <AdminSidebar />
        <main className="flex-1 ml-0 md:ml-64 p-6">
          <div className="container mx-auto px-4 py-8 text-center">
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <AdminSidebar />
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="container mx-auto px-4 py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Edit Seller Fees</h1>
          {error && (
            <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded-lg mb-4">
              <p className="text-red-700">{error}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-100 border-l-4 border-green-500 p-4 rounded-lg mb-4">
              <p className="text-green-700">{success}</p>
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            {Object.entries(feesConfig).map(([size, config]) => (
              <div key={size} className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-medium text-gray-700 mb-4">{size} Products</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Minimum Price (₦)</label>
                    <input
                      type="number"
                      value={config.minPrice}
                      onChange={(e) => handleChange(size, 'minPrice', e.target.value)}
                      min="0"
                      className="mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                  {size !== 'X-Large' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Maximum Price (₦)</label>
                      <input
                        type="number"
                        value={config.maxPrice}
                        onChange={(e) => handleChange(size, 'maxPrice', e.target.value)}
                        min="0"
                        className="mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
                        disabled={loading}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Buyer Protection Rate (%)</label>
                    <input
                      type="number"
                      value={(config.buyerProtectionRate * 100).toFixed(2)}
                      onChange={(e) => handleChange(size, 'buyerProtectionRate', e.target.value / 100)}
                      step="0"
                      min="0"
                      className="0.1 mt-1 w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Handling Rate (%)</label>
                    <input
                      type="number"
                      value={(config.handlingRate * 100).toFixed(2)}
                      onChange={(e) => handleChange(size, 'handlingRate', e.target.value / 100)}
                      step="0.01"
                      min="0"
                      className="mt-1 w-full py-2 px-3 border rounded-md shadow-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
                      disabled={loading}
                    />
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
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

export default AdminEditFees;