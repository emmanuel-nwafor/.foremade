import React from 'react';
import PropTypes from 'prop-types';

export default function SellerProductUploadPopup({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md relative shadow-lg transform transition-all duration-300 animate-slide-in">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          <i className="bx bx-x text-2xl"></i>
        </button>
        <div className="flex flex-col items-center text-center">
          <i className="bx bx-check-circle text-5xl text-green-600 mb-4"></i>
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-2">
            Product Uploaded Successfully!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm">
            Your product is awaiting admin approval before going live.
          </p>
          <button
            onClick={onClose}
            className="mt-6 bg-slate-600 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

SellerProductUploadPopup.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};