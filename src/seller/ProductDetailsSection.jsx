import React from 'react';

const ProductDetailsSection = ({
  formData,
  handleChange,
  applyFormatting,
  descriptionRef,
  descriptionPreview,
  errors,
  loading,
}) => {
  return (
    <div>
      <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
        <i className="bx bx-info-circle text-blue-500"></i>
        Product Details
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="relative group">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            Seller Name <span className="text-red-500">*</span>
            <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Your registered name"></i>
          </label>
          <input
            type="text"
            name="sellerName"
            value={formData.sellerName}
            placeholder="Enter your full name"
            className="mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 border-gray-300 dark:border-gray-600 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200"
            disabled
          />
          {errors.sellerName && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <i className="bx bx-error-circle"></i>
              {errors.sellerName}
            </p>
          )}
        </div>
        <div className="relative group">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
            Product Name <span className="text-red-500">*</span>
            <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Name of the product"></i>
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="e.g., Men's Leather Jacket"
            className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
              errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
            disabled={loading}
          />
          {errors.name && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <i className="bx bx-error-circle"></i>
              {errors.name}
            </p>
          )}
        </div>
      </div>
      <div className="mt-6 relative group">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
          Description
          <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Describe your product with optional bold, italic, or code formatting"></i>
        </label>
        <div className="mt-1">
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => applyFormatting('bold')}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm group"
              disabled={loading}
              title="Bold text (**text**)"
            >
              <i className="bx bx-bold text-lg group-hover:text-blue-500"></i>
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('italic')}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm group"
              disabled={loading}
              title="Italic text (*text*)"
            >
              <i className="bx bx-italic text-lg group-hover:text-blue-500"></i>
            </button>
            <button
              type="button"
              onClick={() => applyFormatting('code')}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm group"
              disabled={loading}
              title="Code text (`text`)"
            >
              <i className="bx bx-code text-lg group-hover:text-blue-500"></i>
            </button>
          </div>
          <textarea
            ref={descriptionRef}
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="e.g., **Premium leather** jacket with *stylish stitching*"
            className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
              errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
            } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
            rows="4"
            disabled={loading}
          />
          {formData.description && (
            <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300">
              <h4 className="font-medium mb-2">Preview</h4>
              <div
                className="prose prose-sm dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: descriptionPreview }}
              />
            </div>
          )}
        </div>
        {errors.description && (
          <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
            <i className="bx bx-error-circle"></i>
            {errors.description}
          </p>
        )}
      </div>
    </div>
  );
};

export default ProductDetailsSection;