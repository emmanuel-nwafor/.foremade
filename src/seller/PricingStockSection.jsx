import React from 'react';

const PricingStockSection = ({
  formData,
  handleChange,
  errors,
  loading,
  fees,
  feeConfig,
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
        <i className="bx bx-money text-blue-500"></i>
        Pricing & Stock
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative group">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            Price (₦) <span className="text-red-500">*</span>
            <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Price in Naira"></i>
          </label>
          <input
            type="number"
            name="price"
            value={formData.price}
            onChange={handleChange}
            step="0.01"
            min="0"
            placeholder="e.g., 5000.00"
            className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
              errors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
            disabled={loading}
          />
          {errors.price && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <i className="bx bx-error-circle"></i>
              {errors.price}
            </p>
          )}
        </div>
        <div className="relative group">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            Stock Quantity <span className="text-red-500">*</span>
            <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Available stock"></i>
          </label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            placeholder="e.g., 10"
            className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
              errors.stock ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
            disabled={loading}
          />
          {errors.stock && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <i className="bx bx-error-circle"></i>
              {errors.stock}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 relative group">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          Product Size <span className="text-red-500">*</span>
          <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select product size"></i>
        </label>
        <select
          name="manualSize"
          value={formData.manualSize}
          onChange={handleChange}
          className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
            errors.manualSize ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
          disabled={loading}
        >
          <option value="">Select a size</option>
          {manualSizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>
        {errors.manualSize && (
          <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
            <i className="bx bx-error-circle"></i>
            {errors.manualSize}
          </p>
        )}
      </div>
      {fees.productSize && feeConfig && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
            <i className="bx bx-calculator text-blue-500"></i>
            Foremade Fees
          </h4>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            <p>Category: <span className="font-semibold">{fees.productSize}</span></p>
            <p>Buyer Protection Fee ({(feeConfig[fees.productSize]?.buyerProtectionRate * 100).toFixed(2)}%): ₦{fees.buyerProtectionFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
            <p>Handling Fee ({(feeConfig[fees.productSize]?.handlingRate * 100).toFixed(2)}%): ₦{fees.handlingFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
            <p className="font-bold">
              Total Estimated Price for Buyer: ₦{fees.totalEstimatedPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </p>
            <p className="font-bold text-green-600">
              Your Estimated Earnings: ₦{fees.sellerEarnings.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Note: International shipping costs can be added separately.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PricingStockSection;