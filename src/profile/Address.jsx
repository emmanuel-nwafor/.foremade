import React, { useState, useEffect } from 'react';
import { auth } from '../firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Link } from 'react-router-dom';
import Sidebar from './Sidebar';
import Spinner from '../components/common/Spinner';

export default function Address() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthError, setIsAuthError] = useState(false);
  const [userData, setUserData] = useState(null);
  const [addresses, setAddresses] = useState([]);
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
  });
  
  const [formErrors, setFormErrors] = useState({});
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [orderCount, setOrderCount] = useState(0);
  const [wishlistCount] = useState(3); // Mock, as in Profile.jsx
  const ORDER_HISTORY_KEY = 'orderHistory_1';

  const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const getOrderCount = () => {
    try {
      const storedOrders = localStorage.getItem(ORDER_HISTORY_KEY);
      return storedOrders ? JSON.parse(storedOrders).length : 0;
    } catch (err) {
      console.error('Error getting order count:', err);
      return 0;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      try {
        console.log('Auth state changed at:', new Date().toISOString());
        if (!user) {
          console.log('No user found, redirecting to login');
          setError('Please sign in to manage your addresses.');
          setIsAuthError(true);
          setLoading(false);
          return;
        }

        console.log('User authenticated, UID:', user.uid);
        const storedUserData = localStorage.getItem('userData');
        let additionalData = {};
        if (storedUserData) {
          try {
            additionalData = JSON.parse(storedUserData);
            if (typeof additionalData.name !== 'string' || additionalData.name.includes('{')) {
              console.warn('Corrupted name field:', additionalData.name);
              additionalData.name = 'Emmanuel Chinecherem';
            }
            if (typeof additionalData.username !== 'string') {
              additionalData.username = 'emmaChi';
            }
          } catch (err) {
            console.error('Error parsing userData:', err);
            additionalData = {};
          }
        }

        // Fetch addresses from Firestore
        console.log('Fetching Firestore data for UID:', user.uid);
        const userDoc = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDoc);
        if (!docSnap.exists()) {
          console.warn('User document not found in Firestore:', user.uid);
          setError('User profile not found.');
          setLoading(false);
          return;
        }

        const firestoreData = docSnap.data();
        console.log('Firestore data fetched:', firestoreData);
        const userAddresses = firestoreData.addresses || additionalData.addresses || [];

        setUserData({
          email: user.email || 'test@example.com',
          username: additionalData.username || user.displayName || 'emmaChi',
          name: additionalData.name || user.displayName || 'Emmanuel Chinecherem',
          profileImage: additionalData.profileImage || null,
          createdAt: additionalData.createdAt || '2025-05-04T23:28:48.857Z',
          address: additionalData.address || (userAddresses[0]?.street
            ? `${userAddresses[0].street}, ${userAddresses[0].city}, ${userAddresses[0].state}, ${userAddresses[0].postalCode}, ${userAddresses[0].country}`
            : 'Not provided'),
          addresses: userAddresses,
          uid: user.uid,
        });
        setAddresses(userAddresses);
        setOrderCount(getOrderCount());
      } catch (err) {
        console.error('Error in useEffect:', err.message, err.stack);
        setError('Failed to load addresses. Please try again.');
      } finally {
        console.log('Setting loading to false at:', new Date().toISOString());
        setLoading(false);
      }
    }, (err) => {
      console.error('Auth state error:', err);
      setError('Authentication error. Please try again.');
      setLoading(false);
    });

    const handleOrderPlaced = () => setOrderCount(getOrderCount());
    window.addEventListener('orderPlaced', handleOrderPlaced);
    return () => {
      console.log('Cleaning up useEffect');
      unsubscribe();
      window.removeEventListener('orderPlaced', handleOrderPlaced);
    };
  }, []);

  const validateForm = () => {
    const errors = {};
    if (!formData.street.trim()) errors.street = 'Street is required.';
    if (!formData.city.trim()) errors.city = 'City is required.';
    if (!formData.state.trim()) errors.state = 'State is required.';
    if (!formData.country.trim()) errors.country = 'Country is required.';
    if (!formData.postalCode.trim()) errors.postalCode = 'Postal code is required.';
    return errors;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleAddOrUpdateAddress = async (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setLoading(true);
      const newAddress = {
        id: editingAddressId || generateId(),
        street: formData.street,
        city: formData.city,
        state: formData.state,
        country: formData.country,
        postalCode: formData.postalCode,
      };

      let updatedAddresses;
      if (editingAddressId) {
        updatedAddresses = addresses.map((addr) =>
          addr.id === editingAddressId ? newAddress : addr
        );
      } else {
        updatedAddresses = [...addresses, newAddress];
      }

      // Update Firestore
      const userDoc = doc(db, 'users', userData.uid);
      await setDoc(
        userDoc,
        {
          addresses: updatedAddresses,
          address: updatedAddresses[0]
            ? `${updatedAddresses[0].street}, ${updatedAddresses[0].city}, ${updatedAddresses[0].state}, ${updatedAddresses[0].postalCode}, ${updatedAddresses[0].country}`
            : 'Not provided',
        },
        { merge: true }
      );

      // Update localStorage
      const updatedUserData = {
        ...userData,
        addresses: updatedAddresses,
        address: updatedAddresses[0]
          ? `${updatedAddresses[0].street}, ${updatedAddresses[0].city}, ${updatedAddresses[0].state}, ${updatedAddresses[0].postalCode}, ${updatedAddresses[0].country}`
          : 'Not provided',
      };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));

      setAddresses(updatedAddresses);
      setUserData(updatedUserData);
      setFormData({ street: '', city: '', state: '', country: '', postalCode: '' });
      setFormErrors({});
      setEditingAddressId(null);
    } catch (err) {
      console.error('Error saving address:', err);
      setError('Failed to save address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditAddress = (address) => {
    setFormData({
      street: address.street,
      city: address.city,
      state: address.state,
      country: address.country,
      postalCode: address.postalCode,
    });
    setEditingAddressId(address.id);
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      setLoading(true);
      const updatedAddresses = addresses.filter((addr) => addr.id !== addressId);

      // Update Firestore
      const userDoc = doc(db, 'users', userData.uid);
      await setDoc(
        userDoc,
        {
          addresses: updatedAddresses,
          address: updatedAddresses[0]
            ? `${updatedAddresses[0].street}, ${updatedAddresses[0].city}, ${updatedAddresses[0].state}, ${updatedAddresses[0].postalCode}, ${updatedAddresses[0].country}`
            : 'Not provided',
        },
        { merge: true }
      );

      // Update localStorage
      const updatedUserData = {
        ...userData,
        addresses: updatedAddresses,
        address: updatedAddresses[0]
          ? `${updatedAddresses[0].street}, ${updatedAddresses[0].city}, ${updatedAddresses[0].state}, ${updatedAddresses[0].postalCode}, ${updatedAddresses[0].country}`
          : 'Not provided',
      };
      localStorage.setItem('userData', JSON.stringify(updatedUserData));

      setAddresses(updatedAddresses);
      setUserData(updatedUserData);
    } catch (err) {
      console.error('Error deleting address:', err);
      setError('Failed to delete address. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Spinner />
        <p className="text-gray-600 dark:text-gray-300 mt-4">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        {isAuthError ? (
          <Link to="/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        ) : (
          <button
            onClick={() => setError('')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800 dark:text-gray-700">
      <div className="flex flex-col md:flex-row gap-6">
        <Sidebar userData={userData} orderCount={orderCount} wishlistCount={wishlistCount} />
        <div className="md:w-3/4">
          <div className="rounded-lg p-6 mb-6 border border-gray-300 dark:border-gray-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Personal Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-gray-500 dark:text-gray-300">Username</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{userData.username}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-300">First Name</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">{userData.name.split(' ')[0]}</p>
              </div>
              <div>
                <p className="text-gray-500 dark:text-gray-300">Last Name</p>
                <p className="font-semibold text-gray-800 dark:text-gray-200">
                  {userData.name.split(' ').slice(1).join(' ') || '-'}
                </p>
              </div>
            </div>
          </div>
          <div className="rounded-lg p-6 mb-6 border border-gray-300 dark:border-gray-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
              {editingAddressId ? 'Edit Address' : 'Add New Address'}
            </h3>
            <form onSubmit={handleAddOrUpdateAddress} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-500 dark:text-gray-300">Street</label>
                <input
                  type="text"
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg ${
                    formErrors.street ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
                  }`}
                />
                {formErrors.street && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{formErrors.street}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-500 dark:text-gray-300">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg ${
                    formErrors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
                  }`}
                />
                {formErrors.city && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{formErrors.city}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-500 dark:text-gray-300">State</label>
                <input
                  type="text"
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg ${
                    formErrors.state ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
                  }`}
                />
                {formErrors.state && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{formErrors.state}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-500 dark:text-gray-300">Country</label>
                <input
                  type="text"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg ${
                    formErrors.country ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
                  }`}
                />
                {formErrors.country && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{formErrors.country}</p>
                )}
              </div>
              <div>
                <label className="block text-gray-500 dark:text-gray-300">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className={`w-full p-3 border rounded-lg ${
                    formErrors.postalCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-300'
                  }`}
                />
                {formErrors.postalCode && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-1">{formErrors.postalCode}</p>
                )}
              </div>
              <div className="col-span-1 md:col-span-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                  disabled={loading}
                >
                  {editingAddressId ? 'Update Address' : 'Add Address'}
                </button>
                {editingAddressId && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormData({ street: '', city: '', state: '', country: '', postalCode: '' });
                      setEditingAddressId(null);
                      setFormErrors({});
                    }}
                    className="ml-2 px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
          <div className="rounded-lg p-6 border border-gray-300 dark:border-gray-300">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">Saved Addresses</h3>
            {addresses.length === 0 ? (
              <div className="text-center">
                <div className="inline-block p-4 rounded-full mb-2 bg-gray-100">
                  <i className="bx bx-map text-2xl"></i>
                </div>
                <p className="text-gray-400 dark:text-gray-300">No addresses found!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div key={address.id} className="flex justify-between items-center p-4 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-semibold text-gray-800 dark:text-gray-200">{address.street}</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {address.city}, {address.state}, {address.postalCode}, {address.country}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditAddress(address)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <i className="bx bx-edit text-lg"></i>
                      </button>
                      <button
                        onClick={() => handleDeleteAddress(address.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <i className="bx bx-trash text-lg"></i>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}