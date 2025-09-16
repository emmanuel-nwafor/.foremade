import React from 'react';
import PropTypes from 'prop-types';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { auth } from '../firebase';

export default function SellerLocationForm({ locationData, setLocationData, errors, saveLocation }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    const newLocation = { ...locationData, [name]: value };
    console.log('SellerLocationForm handleChange:', name, value, newLocation);
    setLocationData(newLocation);
  };

  const handleSave = async () => {
    if (saveLocation) {
      const userId = auth.currentUser?.uid;
      if (userId) {
        try {
          await setDoc(doc(db, 'sellerLocations', userId), locationData, { merge: true });
          console.log('Location saved to Firestore:', locationData);
        } catch (err) {
          console.error('Error saving location:', err);
        }
      }
    }
  };

  React.useEffect(() => {
    if (saveLocation && Object.values(locationData).some(val => val)) {
      handleSave();
    }
  }, [locationData, saveLocation]);

  return (
    <div className="mt-6">
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
        <i className="bx bx-map text-blue-500"></i>
        Seller Location
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative group">
          <label
            htmlFor="country"
            className={`text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 ${
              locationData.country ? '-translate-y-6 scale-75 text-blue-500 bg-white dark:bg-gray-800 px-1' : ''
            } transition-all duration-300 transform origin-left pointer-events-none absolute left-3 top-3`}
          >
            Country <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="country"
            name="country"
            value={locationData.country || ''}
            onChange={handleChange}
            className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
              errors.country ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
          />
          {errors.country && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <i className="bx bx-error-circle"></i>
              {errors.country}
            </p>
          )}
        </div>
        <div className="relative group">
          <label
            htmlFor="state"
            className={`text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 ${
              locationData.state ? '-translate-y-6 scale-75 text-blue-500 bg-white dark:bg-gray-800 px-1' : ''
            } transition-all duration-300 transform origin-left pointer-events-none absolute left-3 top-3`}
          >
            State <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            id="state"
            name="state"
            value={locationData.state || ''}
            onChange={handleChange}
            className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
              errors.state ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
          />
          {errors.state && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <i className="bx bx-error-circle"></i>
              {errors.state}
            </p>
          )}
        </div>
        <div className="relative group">
          <label
            htmlFor="city"
            className={`text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 ${
              locationData.city ? '-translate-y-6 scale-75 text-blue-500 bg-white dark:bg-gray-800 px-1' : ''
            } transition-all duration-300 transform origin-left pointer-events-none absolute left-3 top-3`}
          >
            City
          </label>
          <input
            type="text"
            id="city"
            name="city"
            value={locationData.city || ''}
            onChange={handleChange}
            className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
              errors.city ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
          />
          {errors.city && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <i className="bx bx-error-circle"></i>
              {errors.city}
            </p>
          )}
        </div>
        <div className="relative group">
          <label
            htmlFor="address"
            className={`text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 ${
              locationData.address ? '-translate-y-6 scale-75 text-blue-500 bg-white dark:bg-gray-800 px-1' : ''
            } transition-all duration-300 transform origin-left pointer-events-none absolute left-3 top-3`}
          >
            Address
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={locationData.address || ''}
            onChange={handleChange}
            className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
              errors.address ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
          />
          {errors.address && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <i className="bx bx-error-circle"></i>
              {errors.address}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

SellerLocationForm.propTypes = {
  locationData: PropTypes.shape({
    country: PropTypes.string,
    state: PropTypes.string,
    city: PropTypes.string,
    address: PropTypes.string,
  }).isRequired,
  setLocationData: PropTypes.func.isRequired,
  errors: PropTypes.object.isRequired,
  saveLocation: PropTypes.func,
};

SellerLocationForm.defaultProps = {
  saveLocation: null,
};