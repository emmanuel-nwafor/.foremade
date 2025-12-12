import { Link } from 'react-router-dom';

export default function SellerOnboardModal({ isOpen, onClose, title, message, primaryAction, secondaryAction }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-opacity duration-300">
      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-2xl p-6 w-full max-w-md transform transition-all duration-300 ease-out scale-100 opacity-100 animate-fadeIn">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <i className="bx bx-user-plus text-blue-500 text-2xl"></i>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <i className="bx bx-x"></i>
          </button>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6 text-center">{message}</p>
        <div className="flex justify-end gap-4">
          {secondaryAction && (
            <button
              onClick={onClose}
              className="py-2 px-4 bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors duration-200"
            >
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <Link
              to={primaryAction.link}
              className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2"
              onClick={onClose}
            >
              <i className="bx bx-user-plus"></i>
              {primaryAction.label}
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}