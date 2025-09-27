import React from 'react';
import PropTypes from 'prop-types';
import { UploadCloudIcon } from 'lucide-react';

export default function SellerProductUploadPopup({ isOpen, onClose, message, icon, type}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3">
      <div className="bg-white dark:bg-gray-800 p-6 rounded-lg w-full max-w-md relative shadow-lg transform transition-all duration-300 animate-slide-in">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
          aria-label="Close popup"
        >
          <i className="bx bx-x text-2xl"></i>
        </button>
        <div className="flex flex-col items-center text-center">
          <UploadCloudIcon color='blue' size={60} />
          <h1 className="text-xl font-bold m-2">Upload successful</h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your product is awaiting admin approval before going live. 
              This would take around 24 hours.
            </p>
          <div className="mt-6 flex gap-4">
              <button
                onClick={onClose}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                Close
              </button>
          </div>
        </div>
      </div>
    </div>
  );
}

SellerProductUploadPopup.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  message: PropTypes.string,
  icon: PropTypes.string,
  type: PropTypes.oneOf(['success', 'question']),
  showYesNoButtons: PropTypes.bool,
  onYes: PropTypes.func,
  onNo: PropTypes.func,
};

SellerProductUploadPopup.defaultProps = {
  message: 'Action completed!',
  icon: 'bx-check-circle',
  type: 'success',
  showYesNoButtons: false,
  onYes: () => {},
  onNo: () => {},
};