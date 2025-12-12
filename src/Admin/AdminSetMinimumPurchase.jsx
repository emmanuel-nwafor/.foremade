import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

function CustomAlert({ alerts, removeAlert }) {
  useEffect(() => {
    if (alerts.length === 0) return;
    const timer = setTimeout(() => alerts.forEach((alert) => removeAlert(alert.id)), 5000);
    return () => clearTimeout(timer);
  }, [alerts, removeAlert]);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`p-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out animate-slide-in ${
            alert.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          } flex items-center gap-2`}
        >
          <i className={`bx ${alert.type === 'error' ? 'bx-error-circle' : 'bx-check-circle'} text-xl`}></i>
          <span>{alert.message}</span>
          <button onClick={() => removeAlert(alert.id)} className="ml-auto text-lg font-bold hover:text-gray-200">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const addAlert = (message, type = 'info') => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
  };
  const removeAlert = (id) => setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  return { alerts, addAlert, removeAlert };
}

export default function AdminSetMinimumPurchase({
  label = 'Minimum Purchase Amount',
  currencySymbol = '₦',
  firestorePath = 'settings/minimumPurchase',
  defaultValue = 25000,
}) {
  const { alerts, addAlert, removeAlert } = useAlerts();
  const navigate = useNavigate();
  const [minimumPurchase, setMinimumPurchase] = useState(defaultValue);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      addAlert('Please log in as admin.', 'error');
      navigate('/login');
      return;
    }

    const fetchMinimumPurchase = async () => {
      try {
        const configRef = doc(db, firestorePath);
        const configSnap = await getDoc(configRef);
        if (configSnap.exists()) {
          setMinimumPurchase(configSnap.data().amount || defaultValue);
        }
      } catch (error) {
        addAlert(`Failed to fetch ${label.toLowerCase()}.`, 'error');
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMinimumPurchase();
  }, [navigate, firestorePath, label, defaultValue]);

  const handleSave = async () => {
    if (!auth.currentUser) {
      addAlert('Please log in as admin.', 'error');
      navigate('/login');
      return;
    }

    if (minimumPurchase <= 0) {
      addAlert(`${label} must be greater than zero.`, 'error');
      return;
    }

    setIsSaving(true);
    try {
      const configRef = doc(db, firestorePath);
      await setDoc(configRef, { amount: minimumPurchase }, { merge: true });
      addAlert(`${label} updated successfully.`, 'success');
    } catch (error) {
      addAlert(`Failed to update ${label.toLowerCase()}.`, 'error');
      console.error('Save error:', error);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 p-6 flex justify-center items-center">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <i className="bx bx-loader bx-spin text-2xl"></i>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl bg-white dark:bg-gray-800">
      <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 border-b-2 border-blue-500 pb-2 md:pb-3 flex items-center gap-2">
        <i className="bx bx-dollar text-blue-500"></i>
        {label}
      </h2>

      <div className="mt-6 space-y-4">
        <div>
          <label htmlFor="minimumPurchase" className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300">
            {label} ({currencySymbol})
          </label>
          <div className="relative mt-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">{currencySymbol}</span>
            <input
              type="number"
              id="minimumPurchase"
              value={minimumPurchase}
              onChange={(e) => setMinimumPurchase(Math.max(0, Number(e.target.value)))}
              className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              min="0"
              required
              disabled={isSaving}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">Set the {label.toLowerCase()} buyers must meet to proceed.</p>
        </div>

        <button
          onClick={handleSave}
          className={`w-full md:w-auto py-2 px-4 md:px-6 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 flex items-center justify-center gap-2 transition ${
            isSaving ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isSaving}
        >
          <i className="bx bx-save"></i>
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <CustomAlert alerts={alerts} removeAlert={removeAlert} />
    </div>
  );
}