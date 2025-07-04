import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import AdminSidebar from './AdminSidebar';

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

export default function AdminSellerWallet() {
  const { alerts, addAlert, removeAlert } = useAlerts();
  const navigate = useNavigate();
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) {
      addAlert('Please log in as admin.', 'error');
      navigate('/login');
      return;
    }

    setLoading(true);
    const fetchSellers = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'sellers'));
        const sellerList = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          email: doc.data().email || 'N/A',
          phoneNumber: doc.data().phoneNumber || 'N/A',
          walletAddress: doc.data().walletAddress || 'N/A',
          bankName: doc.data().bankName || 'N/A',
          fullName: doc.data().fullName || 'N/A',
          accountNumber: doc.data().accountNumber || 'N/A',
        }));
        setSellers(sellerList);
      } catch (error) {
        addAlert('Failed to fetch sellers.', 'error');
        console.error('Fetch error:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchSellers();
  }, [navigate]);

  const handleDelete = async () => {
    if (!selectedSeller) return;
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'sellers', selectedSeller.id));
      setSellers(sellers.filter((seller) => seller.id !== selectedSeller.id));
      addAlert('Seller wallet deleted successfully.', 'success');
      setShowDeleteModal(false);
    } catch (error) {
      addAlert('Failed to delete seller wallet.', 'error');
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <AdminSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <i className="bx bx-loader bx-spin text-2xl"></i>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-4 md:p-6">
        <div className="w-full max-w-7xl mx-auto bg-white dark:bg-gray-800 p-4 md:p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 border-b-2 border-blue-500 pb-2 md:pb-3 flex items-center gap-2">
            <i className="bx bx-wallet-alt text-blue-500"></i>
            Admin Seller Wallet
          </h2>

          {sellers.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center py-4 md:py-6">No sellers found.</p>
          ) : (
            <div className="space-y-4 mt-4 md:mt-6">
              {sellers.map((seller) => (
                <div
                  key={seller.id}
                  className="p-3 md:p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                >
                  <div className="grid grid-cols-1 gap-2  lg:flex md:items-center md:justify-between md:gap-4">
                    <div className="space-y-1">
                      <p className="text-sm font-light md:text-base text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Seller ID:</span> {seller.id}
                      </p>
                      <p className="text-sm font-light md:text-base text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-sm">Full Name:</span> {seller.fullName}
                      </p>
                      <p className="text-sm font-light md:text-base text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-sm">Email:</span> {seller.email}
                      </p>
                      <p className="text-sm font-light md:text-base text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-sm">Bank Name:</span> {seller.bankName}
                      </p>
                      <p className="text-sm font-light md:text-base text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-sm">Account Number:</span> {seller.accountNumber}
                      </p>
                    </div>
                    <div className="space-y-1 md:space-y-2">
                      <p className="text-sm font-light md:text-base text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-sm">Phone:</span> {seller.phoneNumber}
                      </p>
                      <p className="text-sm font-light md:text-base text-gray-700 dark:text-gray-300">
                        <span className="font-medium text-sm">Wallet Address:</span> {seller.walletAddress}
                      </p>
                    </div>
                    <div className="mt-2 md:mt-0">
                      <button
                        onClick={() => {
                          setSelectedSeller(seller);
                          setShowDeleteModal(true);
                        }}
                        className="w-full md:w-auto py-2 px-3 md:px-4 bg-red-600 text-white rounded-lg shadow-md hover:bg-red-700 flex items-center justify-center gap-1 md:gap-2 text-sm md:text-base transition"
                        disabled={loading}
                      >
                        <i className="bx bx-trash"></i> Delete Wallet
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showDeleteModal && (
            <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-4 md:p-6 rounded-lg shadow-lg w-11/12 md:max-w-md">
                <h3 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100 mb-2 md:mb-4">Confirm Deletion</h3>
                <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-2 md:mb-4">
                  Are you sure you want to delete the wallet for {selectedSeller.email}? This action cannot be undone.
                </p>
                <div className="flex justify-end gap-2 md:gap-4">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="py-1 md:py-2 px-2 md:px-4 bg-gray-300 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 text-sm md:text-base transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    className="py-1 md:py-2 px-2 md:px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-1 md:gap-2 text-sm md:text-base transition"
                    disabled={loading}
                  >
                    <i className="bx bx-trash"></i> Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
      </div>
    </div>
  );
}