import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, setDoc, serverTimestamp, collection, query, where, onSnapshot } from 'firebase/firestore';
import axios from 'axios';
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
  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };
  return { alerts, addAlert, removeAlert };
}

export default function AdminBankSetup() {
  const { alerts, addAlert, removeAlert } = useAlerts();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    country: 'Nigeria',
    bankCode: '',
    accountNumber: '',
    iban: '',
    bankName: '',
  });
  const [banks, setBanks] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [bankDetails, setBankDetails] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [showForm, setShowForm] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      addAlert('Please log in as admin.', 'error');
      navigate('/login');
      return;
    }

    const fetchBanks = async () => {
      try {
        const response = await axios.get('https://foremade-backend.onrender.com/fetch-banks');
        setBanks(response.data);
      } catch (error) {
        addAlert('Failed to fetch bank list.', 'error');
        console.log(error);
      }
    };
    if (formData.country === 'Nigeria') fetchBanks();

    const checkBankSetup = async () => {
      const adminRef = doc(db, 'admins', auth.currentUser.uid);
      const adminSnap = await getDoc(adminRef);
      if (adminSnap.exists() && adminSnap.data().paystackRecipientCode) {
        setBankDetails({
          bankCode: adminSnap.data().bankCode || '',
          accountNumber: adminSnap.data().accountNumber || '',
          iban: adminSnap.data().iban || '',
          bankName: adminSnap.data().bankName || '',
          country: adminSnap.data().country,
        });
        setShowForm(false);
      }
    };
    checkBankSetup();

    const q = query(collection(db, 'transactions'), where('adminFees', '>', 0));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const transactionData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(transactionData);
      const earnings = transactionData.reduce((sum, txn) => sum + (txn.adminFees || 0), 0);
      setTotalEarnings(earnings);
    }, (error) => {
      addAlert('Failed to fetch transactions.', 'error');
      console.error('Transaction fetch error:', error);
    });

    return () => unsubscribe();
  }, [formData.country, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (formData.country === 'Nigeria') {
      if (!formData.bankCode) newErrors.bankCode = 'Select a bank.';
      if (!formData.accountNumber.match(/^\d{10}$/)) newErrors.accountNumber = 'Enter a valid 10-digit account number.';
    } else {
      if (!formData.iban.match(/^[A-Z]{2}\d{2}[A-Z0-9]{1,30}$/)) newErrors.iban = 'Enter a valid IBAN.';
      if (!formData.bankName.trim()) newErrors.bankName = 'Enter a bank name.';
    }
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      addAlert('Please fix form errors.');
      return;
    }
    try {
      const payload = {
        userId: auth.currentUser.uid,
        country: formData.country,
        ...(formData.country === 'Nigeria' ? { bankCode: formData.bankCode, accountNumber: formData.accountNumber } : {}),
        ...(formData.country === 'United Kingdom' ? { iban: formData.iban, bankName: formData.bankName } : {}),
      };
      const response = await axios.post('https://foremade-backend.onrender.com/admin-bank', payload);
      await setDoc(doc(db, 'admins', auth.currentUser.uid), {
        paystackRecipientCode: response.data.recipientCode || '',
        bankCode: formData.bankCode || '',
        accountNumber: formData.accountNumber || '',
        iban: formData.iban || '',
        bankName: formData.bankName || '',
        country: formData.country,
        setupAt: serverTimestamp(),
      }, { merge: true });
      setBankDetails({
        bankCode: formData.bankCode || '',
        accountNumber: formData.accountNumber || '',
        iban: formData.iban || '',
        bankName: formData.bankName || '',
        country: formData.country,
      });
      setShowForm(false);
      addAlert('Admin bank details saved!', 'success');
    } catch (error) {
      console.error('Admin bank error:', error.response?.data || error.message);
      addAlert(error.response?.data?.details || 'Failed to save bank details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setShowForm(true);
    setFormData({
      country: bankDetails.country,
      bankCode: bankDetails.bankCode || '',
      accountNumber: bankDetails.accountNumber || '',
      iban: bankDetails.iban || '',
      bankName: bankDetails.bankName || '',
    });
  };

  const exportToCSV = () => {
    const headers = ['Transaction ID,Date,Total Fees,Tax Fee,Handling Fee,Buyer Protection Fee,Description'];
    const rows = transactions.map((txn) => [
      txn.id,
      new Date(txn.createdAt?.toDate()).toLocaleDateString(),
      `₦${(txn.adminFees || 0).toFixed(2)}`,
      `₦${(txn.taxFee || 0).toFixed(2)}`,
      `₦${(txn.handlingFee || 0).toFixed(2)}`,
      `₦${(txn.buyerProtectionFee || 0).toFixed(2)}`,
      txn.description || '',
    ].join(','));
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin_transactions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    addAlert('Transactions exported to CSV!', 'success');
  };

  const refreshData = () => {
    const q = query(collection(db, 'transactions'), where('adminFees', '>', 0));
    onSnapshot(q, (snapshot) => {
      const transactionData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setTransactions(transactionData);
      const earnings = transactionData.reduce((sum, txn) => sum + (txn.adminFees || 0), 0);
      setTotalEarnings(earnings);
      addAlert('Data refreshed!', 'success');
    }, (error) => {
      addAlert('Failed to refresh data.', 'error');
      console.error('Refresh error:', error);
    });
  };

  if (!auth.currentUser) {
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
      <div className="flex-1 ml-0 md:ml-64 p-5 flex justify-center items-start">
        <div className="w-full lg:max-w-5xl md:max-w-4xl sm:max-w-3xl bg-white dark:bg-gray-800 p-6 md:p-8 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 border-b-2 border-blue-500 pb-3 flex items-center gap-2">
              <i className="bx bx-bank text-blue-500"></i>
              Admin Bank & Wallet
            </h2>
            {!showForm && (
              <div className="space-x-2">
                <button
                  onClick={exportToCSV}
                  className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                >
                  <i className="bx bx-download"></i> Export CSV
                </button>
                <button
                  onClick={refreshData}
                  className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  <i className="bx bx-refresh"></i> Refresh
                </button>
              </div>
            )}
          </div>
          {showForm ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  className="mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  disabled={loading}
                >
                  <option value="Nigeria">Nigeria</option>
                  <option value="United Kingdom">UK</option>
                </select>
              </div>
              {formData.country === 'Nigeria' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <select
                      name="bankCode"
                      value={formData.bankCode}
                      onChange={handleChange}
                      className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.bankCode ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                      disabled={loading}
                    >
                      <option value="">Select a bank</option>
                      {banks.map((bank) => (
                        <option key={bank.code} value={bank.code}>
                          {bank.name}
                        </option>
                      ))}
                    </select>
                    {errors.bankCode && <p className="text-red-600 text-xs mt-1">{errors.bankCode}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Account Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="accountNumber"
                      value={formData.accountNumber}
                      onChange={handleChange}
                      placeholder="e.g., 0123456789"
                      className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.accountNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                      disabled={loading}
                    />
                    {errors.accountNumber && <p className="text-red-600 text-xs mt-1">{errors.accountNumber}</p>}
                  </div>
                </>
              )}
              {formData.country === 'United Kingdom' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Bank Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="bankName"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder="e.g., Barclays"
                      className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.bankName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                      disabled={loading}
                    />
                    {errors.bankName && <p className="text-red-600 text-xs mt-1">{errors.bankName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      IBAN <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="iban"
                      value={formData.iban}
                      onChange={handleChange}
                      placeholder="e.g., GB33BUKB20201555555555"
                      className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.iban ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                      disabled={loading}
                    />
                    {errors.iban && <p className="text-red-600 text-xs mt-1">{errors.iban}</p>}
                  </div>
                </>
              )}
              <button
                type="submit"
                className={`w-full py-2 px-4 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 flex items-center justify-center gap-2 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={loading}
              >
                <i className="bx bx-check"></i>
                Save Bank Details
              </button>
            </form>
          ) : (
            <div>
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Wallet Overview</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg shadow-sm">
                    <p className="text-gray-700 dark:text-gray-300">Total Earnings</p>
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">₦{totalEarnings.toFixed(2)}</p>
                  </div>
                  <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg shadow-sm">
                    <p className="text-gray-700 dark:text-gray-300">Pending Payouts</p>
                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">₦0.00</p>
                  </div>
                  <div className="p-4 bg-yellow-100 dark:bg-yellow-900 rounded-lg shadow-sm">
                    <p className="text-gray-700 dark:text-gray-300">Fee Breakdown</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Tax: ₦{transactions.reduce((sum, txn) => sum + (txn.taxFee || 0), 0).toFixed(2)} |
                      Handling: ₦{transactions.reduce((sum, txn) => sum + (txn.handlingFee || 0), 0).toFixed(2)} |
                      Buyer Protection: ₦{transactions.reduce((sum, txn) => sum + (txn.buyerProtectionFee || 0), 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Bank Details</h3>
                <div className="space-y-2 mb-6">
                  {bankDetails.country === 'Nigeria' ? (
                    <>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Bank:</span>{' '}
                        {banks.find((bank) => bank.code === bankDetails.bankCode)?.name || 'Unknown'}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Account Number:</span> {bankDetails.accountNumber}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Bank:</span> {bankDetails.bankName}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">IBAN:</span> {bankDetails.iban}
                      </p>
                    </>
                  )}
                  <p className="text-gray-700 dark:text-gray-300">
                    <span className="font-medium">Country:</span> {bankDetails.country}
                  </p>
                  <button
                    onClick={handleEdit}
                    className="mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 flex items-center gap-2"
                  >
                    <i className="bx bx-edit"></i>
                    Edit Bank Details
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mb-4">Transaction History</h3>
              {transactions.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400">No transactions yet.</p>
              ) : (
                <div className="space-y-4">
                  {transactions.map((txn) => (
                    <div
                      key={txn.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600"
                    >
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Transaction ID:</span> {txn.id}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Date:</span> {new Date(txn.createdAt?.toDate()).toLocaleString()}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Total Fees:</span> ₦{(txn.adminFees || 0).toFixed(2)}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Tax Fee:</span> ₦{(txn.taxFee || 0).toFixed(2)}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Handling Fee:</span> ₦{(txn.handlingFee || 0).toFixed(2)}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Buyer Protection Fee:</span> ₦{(txn.buyerProtectionFee || 0).toFixed(2)}
                      </p>
                      <p className="text-gray-700 dark:text-gray-300">
                        <span className="font-medium">Description:</span> {txn.description || 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
      </div>
    </div>
  );
}