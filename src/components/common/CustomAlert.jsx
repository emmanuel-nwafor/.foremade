import { useState } from 'react';

const CustomAlert = ({ alerts, removeAlert }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-center p-4 rounded-lg shadow-lg transition-all duration-300 transform translate-x-0 opacity-100 ${
            alert.type === 'success'
              ? 'bg-green-500 text-white'
              : 'bg-red-500 text-white'
          } animate-slide-in`}
          onClick={() => removeAlert(alert.id)}
          role="alert"
        >
          <i
            className={`bx ${
              alert.type === 'success' ? 'bx-check-circle' : 'bx-error-circle'
            } text-xl mr-2`}
          ></i>
          <span>{alert.message}</span>
          <button
            className="ml-auto text-white hover:text-gray-200"
            aria-label="Close alert"
          >
            <i className="bx bx-x text-xl"></i>
          </button>
        </div>
      ))}
    </div>
  );
};

export const useAlerts = () => {
  const [alerts, setAlerts] = useState([]);

  const addAlert = (message, type = 'success', autoClose = 3000) => {
    const id = Date.now().toString();
    setAlerts((prev) => [...prev, { id, message, type }]);

    if (autoClose) {
      setTimeout(() => {
        setAlerts((prev) => prev.filter((alert) => alert.id !== id));
      }, autoClose);
    }
  };

  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };

  return { alerts, addAlert, removeAlert };
};

export default CustomAlert;