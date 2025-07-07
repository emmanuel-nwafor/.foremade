import React from 'react';

const LocationSection = ({
  locationData,
  setLocationData,
  locationErrors,
  loading,
}) => {
  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocationData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div>
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
        <i className="bx bx-map-pin text-blue-500"></i>
        Location
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="relative group">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            Country <span className="text-red-500">*</span>
            <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select your country"></i>
          </label>
          <input
            type="text"
            name="country"
            value={locationData.country}
            onChange={handleChange}
            placeholder="e.g., Nigeria"
            className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
              locationErrors.country ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
            disabled={loading}
          />
          {locationErrors.country && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <i className="bx bx-error-circle"></i>
              {locationErrors.country}
            </p>
          )}
        </div>
        <div className="relative group">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            State <span className="text-red-500">*</span>
            <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select your state"></i>
          </label>
          <input
            type="text"
            name="state"
            value={locationData.state}
            onChange={handleChange}
            placeholder="e.g., Lagos"
            className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
              locationErrors.state ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
            disabled={loading}
          />
          {locationErrors.state && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <i className="bx bx-error-circle"></i>
              {locationErrors.state}
            </p>
          )}
        </div>
        <div className="relative group">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            City (Optional)
            <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Enter your city (optional)"></i>
          </label>
          <input
            type="text"
            name="city"
            value={locationData.city}
            onChange={handleChange}
            placeholder="e.g., Ikeja"
            className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 border-gray-300 dark:border-gray-600 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
            disabled={loading}
          />
        </div>
        <div className="relative group">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            Address (Optional)
            <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Enter your address (optional)"></i>
          </label>
          <input
            type="text"
            name="address"
            value={locationData.address}
            onChange={handleChange}
            placeholder="e.g., 123 Market Street"
            className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 border-gray-300 dark:border-gray-600 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
            disabled={loading}
          />
        </div>
      </div>
    </div>
  );
};

export default LocationSection;