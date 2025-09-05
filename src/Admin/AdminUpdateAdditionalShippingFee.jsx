import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { auth, db } from '/src/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import AdminSidebar from './AdminSidebar'; // Adjust path as needed
import { Percent } from 'lucide-react';

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

export default function AdminUpdateAdditionalShippingFee({
  label = 'Additional Shipping Fee',
  percentageSymbol = '%',
  firestorePath = 'settings/shippingFees',
  defaultValue = 30,
}) {
  const { alerts, addAlert, removeAlert } = useAlerts();
  const navigate = useNavigate();
  const [percentage, setPercentage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  // Check if user is admin
//   useEffect(() => {
//     const checkAdmin = async () => {
//       if (auth.currentUser) {
//         try {
//           const userRef = doc(db, 'users', auth.currentUser.uid);
//           const userSnap = await getDoc(userRef);
//           if (userSnap.exists() && userSnap.data().role === 'admin') {
//             setIsAdmin(true);
//           } else {
//             setIsAdmin(false);
//             addAlert('Access denied: Admin privileges required.', 'error');
//             navigate('/');
//           }
//         } catch (error) {
//           console.error('Error checking admin status:', error);
//           addAlert('Failed to verify admin status: ' + error.message, 'error');
//           navigate('/');
//         }
//       } else {
//         setIsAdmin(false);
//         addAlert('Please log in as admin.', 'error');
//         navigate('/login');
//       }
//     };
//     checkAdmin();
//   }, [addAlert, navigate]);

  // Fetch or initialize shipping percentage
  useEffect(() => {
    const fetchOrInitializeShippingFee = async () => {
      try {
        const shipRef = doc(db, firestorePath);
        const shipSnap = await getDoc(shipRef);
        if (shipSnap.exists()) {
          const data = shipSnap.data();
          console.log('Fetched Firestore document:', data);
          const fetchedPercentage = typeof data.additionalPercentage === 'number' 
            ? data.additionalPercentage * 100 
            : defaultValue;
          setPercentage(fetchedPercentage.toFixed(1));
        } else {
          console.log('Shipping fee document does not exist, creating with default value');
          await setDoc(shipRef, { additionalPercentage: defaultValue / 100 });
          setPercentage(defaultValue.toFixed(1));
        }
      } catch (error) {
        console.error('Error fetching/initializing shipping fee:', error);
        addAlert(`Failed to load ${label.toLowerCase()}: ${error.message}`, 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchOrInitializeShippingFee();
  }, [addAlert, firestorePath, defaultValue, label]);

  // Handle form submission
  const handleSave = async (e) => {
    e.preventDefault();
    const newPercentage = Number(percentage);
    console.log('Attempting to save percentage:', newPercentage);
    if (isNaN(newPercentage) || newPercentage < 0 || newPercentage > 100) {
      addAlert(`${label} must be between 0 and 100.`, 'error');
      return;
    }
    if (!isAdmin) {
      addAlert('Unauthorized: Only admins can update shipping fees.', 'error');
      return;
    }
    setIsSaving(true);
    try {
      const shipRef = doc(db, firestorePath);
      console.log('Saving to Firestore: additionalPercentage =', newPercentage / 100);
      await setDoc(shipRef, { additionalPercentage: newPercentage / 100 }, { merge: true });
      setPercentage(newPercentage.toFixed(1));
      addAlert(`${label} updated successfully to ${newPercentage}%.`, 'success');
    } catch (error) {
      console.error('Error updating shipping percentage:', error);
      addAlert(`Failed to update ${label.toLowerCase()}: ${error.message}`, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle input change
  const handleInputChange = (e) => {
    const value = e.target.value;
    console.log('Input changed to:', value);
    setPercentage(value);
  };

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
          <i className="bx bx-loader bx-spin text-2xl"></i>
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <CustomAlert alerts={alerts} removeAlert={removeAlert} />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <AdminSidebar />
      <motion.div
        className="flex-1 p-6 flex justify-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className="w-full max-w-5xl bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 border-b-2 border-blue-500 pb-2 md:pb-3 flex items-center gap-2">
            <Percent className="text-blue-500" size={24} />
            {label}
          </h2>
          <div className="mt-6 space-y-4">
            <div>
              <label
                htmlFor="additionalShippingPercentage"
                className="block text-sm md:text-base font-medium text-gray-700 dark:text-gray-300"
              >
                {label} ({percentageSymbol})
              </label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                  {percentageSymbol}
                </span>
                <input
                  type="number"
                  id="additionalShippingPercentage"
                  value={percentage}
                  onChange={handleInputChange}
                  className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  min="0"
                  max="100"
                  step="0.1"
                  required
                  disabled={isSaving}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1 dark:text-gray-400">
                Set the {label.toLowerCase()} applied to all products.
              </p>
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
      </motion.div>
    </div>
  );
}
