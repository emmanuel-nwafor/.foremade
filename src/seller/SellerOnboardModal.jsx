import { Link } from 'react-router-dom';

export default function SellerOnboardModal({ isOpen, onClose, title, message, primaryAction, secondaryAction }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 w-full max-w-md">
        <div className="flex items-center gap-2 mb-4">
          <i className="bx bx-user-plus text-blue-500 text-2xl"></i>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{title}</h2>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mb-6">{message}</p>
        <div className="flex justify-end gap-4">
          {secondaryAction && (
            <button
              onClick={onClose}
              className="py-2 px-4 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition duration-300"
            >
              {secondaryAction.label}
            </button>
          )}
          {primaryAction && (
            <Link
              to={primaryAction.link}
              className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition duration-300 flex items-center gap-2"
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