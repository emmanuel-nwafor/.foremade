import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import countries from '../components/common/countries'; 
import countryCodes from '../components/common/countryCodes';

export default function Shipping() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    country: 'Nigeria',
    streetAddress: '',
    streetAddress2: '',
    city: '',
    state: '',
    zipCode: '',
    phoneNumber: '',
    phoneCode: '+234',
    isLandline: false,
  });

  const [errors, setErrors] = useState({});
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!user) {
      alert('You must be logged in to submit shipping details. Please sign up or log in.');
      navigate('/login');
      return;
    }

    const newErrors = {};
    if (!formData.streetAddress) newErrors.streetAddress = 'Please enter a valid street address';
    if (!formData.city) newErrors.city = 'Please enter a valid city';
    if (!formData.state) newErrors.state = 'Please enter a valid state or province';
    if (!formData.zipCode) newErrors.zipCode = 'Please enter a valid ZIP code';
    if (!formData.phoneNumber) newErrors.phoneNumber = 'Please enter a valid phone number';

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const shippingDetails = { ...formData, userId: user.uid };
      console.log('Shipping details submitted:', shippingDetails);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen p-4 sm:p-6 md:p-10 bg-gray-100">
      <div className="bg-white p-6 sm:p-8 rounded-lg w-full max-w-xl">
        <h1 className="text-xl sm:text-2xl font-bold mb-2">Add a shipping address</h1>
        <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">To continue, we need your contact information.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Country or region</label>
            <select
              name="country"
              value={formData.country}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {countries.map((country, index) => (
                <option key={index} value={country}>{country}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Street Address</label>
            <input
              type="text"
              name="streetAddress"
              value={formData.streetAddress}
              onChange={handleChange}
              className={`mt-1 block w-full border rounded-md p-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.streetAddress ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder=""
            />
            {errors.streetAddress && (
              <p className="text-red-500 text-xs mt-1">{errors.streetAddress}</p>
            )}
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Street Address 2 (Optional)</label>
            <input
              type="text"
              name="streetAddress2"
              value={formData.streetAddress2}
              onChange={handleChange}
              className="mt-1 block w-full border border-gray-300 rounded-md p-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder=""
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className={`mt-1 block w-full border rounded-md p-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.city ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder=""
            />
            {errors.city && (
              <p className="text-red-500 text-xs mt-1">{errors.city}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700">State or Province</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-md p-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.state ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder=""
              />
              {errors.state && (
                <p className="text-red-500 text-xs mt-1">{errors.state}</p>
              )}
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700">ZIP Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                className={`mt-1 block w-full border rounded-md p-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.zipCode ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder=""
              />
              {errors.zipCode && (
                <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700">Phone number</label>
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0">
              <select
                name="phoneCode"
                value={formData.phoneCode}
                onChange={handleChange}
                className="border border-gray-300 rounded-md p-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 w-full sm:w-24"
              >
                {countryCodes.map((item, index) => (
                  <option key={index} value={item.code}>{item.code}</option>
                ))}
              </select>
              <input
                type="text"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`flex-1 border rounded-md p-2 text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder=""
              />
            </div>
            {errors.phoneNumber && (
              <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isLandline"
              checked={formData.isLandline}
              onChange={handleChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label className="ml-2 text-xs sm:text-sm text-gray-700">Phone number is a landline</label>
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-blue-600 text-white py-2 rounded-full hover:bg-blue-700 transition text-sm sm:text-base"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}