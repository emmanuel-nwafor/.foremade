// Refactored AdminUsers.jsx
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import AdminSidebar from './AdminSidebar';

// Custom Alert Component (optimized with single timer)
function CustomAlert({ alerts, removeAlert }) {
  useEffect(() => {
    if (alerts.length === 0) return;
    const timer = setTimeout(() => alerts.forEach(alert => removeAlert(alert.id)), 5000);
    return () => clearTimeout(timer);
  }, [alerts]);

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {alerts.map(alert => (
        <div
          key={alert.id}
          className={`p-3 rounded-lg shadow-md animate-slide-in ${alert.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'} flex items-center gap-2`}
        >
          <i className={`bx ${alert.type === 'error' ? 'bx-error-circle' : 'bx-check-circle'} text-lg`}></i>
          <span className="text-sm">{alert.message}</span>
          <button onClick={() => removeAlert(alert.id)} className="ml-auto text-lg font-bold hover:text-gray-200">✕</button>
        </div>
      ))}
    </div>
  );
}

// Alerts hook
function useAlerts() {
  const [alerts, setAlerts] = useState([]);
  const addAlert = (message, type = 'info') => setAlerts(prev => [...prev, { id: Date.now(), message, type }]);
  const removeAlert = id => setAlerts(prev => prev.filter(alert => alert.id !== id));
  return { alerts, addAlert, removeAlert };
}

// Utility functions
const generateUsername = (firstName, lastName) => {
  const nameParts = [firstName, lastName].filter(part => part?.trim());
  const firstPart = nameParts[0]?.slice(0, 4).toLowerCase() || 'user';
  const secondPart = nameParts[1]?.slice(0, 3).toLowerCase() || '';
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return (firstPart + secondPart).replace(/[^a-z0-9]/g, '') + randomNum;
};

const getInitials = (email, name) => {
  if (name) return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  if (email) return email.split('@')[0].slice(0, 2).toUpperCase();
  return '??';
};

export default function AdminUsers() {
  const navigate = useNavigate();
  const { alerts, addAlert, removeAlert } = useAlerts();
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({ email: '', firstName: '', lastName: '', password: '', role: 'buyer' });
  const [addAdminData, setAddAdminData] = useState({ email: '', password: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [errors, setErrors] = useState({});
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Auth and users fetch (combined useEffect)
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async currentUser => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          addAlert('Unauthorized access.', 'error');
          navigate('/login');
        }
      } else {
        addAlert('Please log in as an admin.', 'error');
        navigate('/login');
      }
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), snapshot => {
      const userList = snapshot.docs.map(d => ({
        id: d.id,
        ...d.data(),
        role: d.data().role || 'buyer',
        status: d.data().status || 'active',
        profileImage: d.data().profileImage || null,
      }));
      setUsers(userList);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
    };
  }, [navigate]);

  // Fetch products (fixed imageUrl to imageUrls[0])
  const fetchUserProducts = userId => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('sellerId', '==', userId));
    return onSnapshot(q, snapshot => {
      const products = snapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id,
          name: data.name || 'Unnamed Product',
          imageUrl: data.imageUrls?.[0] || null,  // Fixed: Use first image from array
          price: data.price || 0,
          description: data.description || 'No description',
          category: data.category || 'Uncategorized',
        };
      });
      setSelectedUser(prev => prev ? { ...prev, products } : null);
    });
  };

  // Modal close on ESC
  useEffect(() => {
    const handleKeyDown = e => {
      if (e.key === 'Escape' && (showUserModal || showEditModal)) {
        setShowUserModal(false);
        setShowEditModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUserModal, showEditModal]);

  // Validation functions
  const validateEmail = email => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePassword = password => password?.length < 6 ? 'Password must be at least 6 characters.' : '';
  const validateForm = data => {
    const newErrors = {};
    if (!data.firstName?.trim()) newErrors.firstName = 'First name required.';
    if (!data.lastName?.trim()) newErrors.lastName = 'Last name required.';
    if (!data.email) newErrors.email = 'Email required.';
    else if (!validateEmail(data.email)) newErrors.email = 'Invalid email.';
    if (data.password) {
      const err = validatePassword(data.password);
      if (err) newErrors.password = err;
    }
    if (!['buyer', 'seller', 'pro seller', 'admin'].includes(data.role)) newErrors.role = 'Invalid role.';
    return newErrors;
  };
  const validateAddAdmin = data => {
    const newErrors = {};
    if (!data.email) newErrors.email = 'Email required.';
    else if (!validateEmail(data.email)) newErrors.email = 'Invalid email.';
    if (!data.password) newErrors.password = 'Password required.';
    else {
      const err = validatePassword(data.password);
      if (err) newErrors.password = err;
    }
    return newErrors;
  };

  // Handlers (refactored for reusability)
  const handleChange = (setFn, field, value) => {
    setFn(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    const newErrors = validateForm(formData);
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setLoading(false);
      addAlert('Fix form errors.', 'error');
      return;
    }
    try {
      const username = generateUsername(formData.firstName, formData.lastName);
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const newUser = userCredential.user;
      await updateProfile(newUser, { displayName: username });
      await setDoc(doc(db, 'users', newUser.uid), {
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`,
        username,
        role: formData.role,
        status: 'active',
        preRegistered: true,
        createdAt: new Date().toISOString(),
        uid: newUser.uid,
        profileImage: null,
      });
      addAlert(`User ${formData.email} added! 🎉`, 'success');
      setFormData({ email: '', firstName: '', lastName: '', password: '', role: 'buyer' });
      setIsFormOpen(false);
    } catch (err) {
      console.error('Add user error:', err);
      if (err.code === 'auth/email-already-in-use') setErrors({ email: 'Email in use.' });
      else if (err.code === 'auth/invalid-email') setErrors({ email: 'Invalid email.' });
      else addAlert('Failed to add user.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAdmin = async e => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    const newErrors = validateAddAdmin(addAdminData);
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setLoading(false);
      addAlert('Fix form errors.', 'error');
      return;
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, addAdminData.email, addAdminData.password);
      const newAdmin = userCredential.user;
      const username = addAdminData.email.split('@')[0];
      await updateProfile(newAdmin, { displayName: username });
      await setDoc(doc(db, 'users', newAdmin.uid), {
        email: addAdminData.email,
        name: username,
        username,
        role: 'admin',
        status: 'active',
        preRegistered: true,
        createdAt: new Date().toISOString(),
        uid: newAdmin.uid,
        profileImage: null,
      });
      await setDoc(doc(db, 'admins', newAdmin.uid), {
        email: addAdminData.email,
        uid: newAdmin.uid,
        createdAt: new Date().toISOString(),
      });
      addAlert(`Admin ${addAdminData.email} added! 🎉`, 'success');
      setAddAdminData({ email: '', password: '' });
      setIsAddAdminOpen(false);
    } catch (err) {
      console.error('Add admin error:', err);
      if (err.code === 'auth/email-already-in-use') setErrors({ email: 'Email in use.' });
      else addAlert('Failed to add admin.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = async e => {
    e.preventDefault();
    setErrors({});
    setLoading(true);
    const newErrors = validateForm(editUser);
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      setLoading(false);
      addAlert('Fix form errors.', 'error');
      return;
    }
    try {
      const username = editUser.username || generateUsername(editUser.firstName, editUser.lastName);
      await updateDoc(doc(db, 'users', editUser.id), {
        email: editUser.email,
        name: `${editUser.firstName} ${editUser.lastName}`,
        username,
        role: editUser.role,
        updatedAt: new Date().toISOString(),
      });
      if (editUser.password) {
        await sendPasswordResetEmail(auth, editUser.email);
        addAlert(`Password reset sent to ${editUser.email}! 🔒`, 'success');
      }
      addAlert(`User ${editUser.email} updated! ✏️`, 'success');
      setShowEditModal(false);
      setEditUser(null);
    } catch (err) {
      console.error('Update user error:', err);
      addAlert('Failed to update user.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSuspend = async (userId, email, currentStatus) => {
    if (!window.confirm(`Confirm ${currentStatus === 'suspended' ? 'unsuspend' : 'suspend'} ${email}?`)) return;
    setLoading(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: currentStatus === 'suspended' ? 'active' : 'suspended',
        updatedAt: new Date().toISOString(),
      });
      addAlert(`User ${email} ${currentStatus === 'suspended' ? 'unsuspended' : 'suspended'}!`, 'success');
    } catch (error) {
      console.error('Suspend error:', error);
      addAlert('Failed to update status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId, email) => {
    if (!window.confirm(`Confirm delete ${email}?`)) return;
    setLoading(true);
    try {
      await fetch('/send-membership-revoked-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      await deleteDoc(doc(db, 'users', userId));
      addAlert(`User ${email} deleted!`, 'success');
    } catch (error) {
      console.error('Delete error:', error);
      addAlert('Failed to delete or send email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openUserModal = async user => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        const unsubscribe = fetchUserProducts(user.id);
        setSelectedUser({ ...user, ...userDoc.data(), unsubscribe });
      }
      setShowUserModal(true);
    } catch (err) {
      console.error('Fetch user error:', err);
      addAlert('Failed to fetch details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = user => {
    setEditUser({
      id: user.id,
      email: user.email,
      firstName: user.name.split(' ')[0],
      lastName: user.name.split(' ').slice(1).join(' '),
      username: user.username,
      role: user.role,
      password: '',
    });
    setShowEditModal(true);
  };

  const filteredUsers = users.filter(u =>
    u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
        <i className="bx bx-loader bx-spin text-2xl text-gray-600 dark:text-gray-300"></i>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-6">
        <div className="w-full max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b-2 border-blue-500 pb-3 flex items-center gap-2">
              <i className="bx bx-user text-blue-500 text-xl"></i> Manage Users
            </h2>

            <Link to="/help-sellers-upload">
              <button className="bg-amber-500 py-2 px-3 text-white rounded-2xl">
                Upload Products for users
              </button>
            </Link>
          </div>

          {/* Search */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search Users</label>
            <div className="relative">
              <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"></i>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by email or name..."
                className="w-full py-2 pl-10 pr-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Add User Form */}
           <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md mb-4 sm:mb-8">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsFormOpen(!isFormOpen)}>
              <h3 className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <i className={`bx bx-chevron-${isFormOpen ? 'up' : 'down'} text-blue-500 text-lg sm:text-xl`}></i>
                Add New User
              </h3>
            </div>
            {isFormOpen && (
                
              <div className="mt-4 animate-slide-down">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative group">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-1">
                          First Name <span className="text-red-500">*</span>
                          <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help text-xs sm:text-sm" title="User's first name"></i>
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleChange('firstName', e.target.value)}
                          placeholder="John"
                          className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                            errors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                          disabled={loading}
                        />
                        {errors.firstName && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><i className="bx bx-error-circle"></i>{errors.firstName}</p>}
                      </div>
                      <div className="relative group">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-1">
                          Last Name <span className="text-red-500">*</span>
                          <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help text-xs sm:text-sm" title="User's last name"></i>
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleChange('lastName', e.target.value)}
                          placeholder="Doe"
                          className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                            errors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                          disabled={loading}
                        />
                        {errors.lastName && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><i className="bx bx-error-circle"></i>{errors.lastName}</p>}
                      </div>
                      <div className="relative group">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-1">
                          Email <span className="text-red-500">*</span>
                          <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help text-xs sm:text-sm" title="User's email address"></i>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="john.doe@example.com"
                          className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                            errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                          disabled={loading}
                        />
                        {errors.email && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><i className="bx bx-error-circle"></i>{errors.email}</p>}
                      </div>
                      <div className="relative group">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-1">
                          Password <span className="text-red-500">*</span>
                          <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help text-xs sm:text-sm" title="Password (min 6 characters)"></i>
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleChange('password', e.target.value)}
                          placeholder="Enter password"
                          className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                            errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                          disabled={loading}
                        />
                        {errors.password && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><i className="bx bx-error-circle"></i>{errors.password}</p>}
                      </div>
                      <div className="relative group sm:col-span-2">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-1">
                          Role <span className="text-red-500">*</span>
                          <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help text-xs sm:text-sm" title="Select user role"></i>
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => handleChange('role', e.target.value)}
                          className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                            errors.role ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                          disabled={loading}
                        >
                          <option value="buyer">Buyer</option>
                          <option value="seller">Seller</option>
                          <option value="pro seller">Pro Seller</option>
                          <option value="admin">Admin</option>
                        </select>
                        {errors.role && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><i className="bx bx-error-circle"></i>{errors.role}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="py-2 px-4 rounded-lg text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-sm"
                    >
                      {loading ? <i className="bx bx-loader bx-spin"></i> : <i className="bx bx-plus"></i>}
                      {loading ? 'Adding...' : 'Add User'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Add Admin Form (similar) */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md mb-4 sm:mb-8">
            <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsAddAdminOpen(!isAddAdminOpen)}>
              <h3 className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <i className={`bx bx-chevron-${isAddAdminOpen ? 'up' : 'down'} text-blue-500 text-lg sm:text-xl`}></i>
                Add New Admin
              </h3>
            </div>
            {isAddAdminOpen && (
              <div className="mt-4 animate-slide-down">
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative group">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-1">
                          Email <span className="text-red-500">*</span>
                          <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help text-xs sm:text-sm" title="Admin's email address"></i>
                        </label>
                        <input
                          type="email"
                          value={addAdminData.email}
                          onChange={(e) => handleAddAdminChange('email', e.target.value)}
                          placeholder="admin@example.com"
                          className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                            errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                          disabled={loading}
                        />
                        {errors.email && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><i className="bx bx-error-circle"></i>{errors.email}</p>}
                      </div>
                      <div className="relative group">
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-1">
                          Password <span className="text-red-500">*</span>
                          <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help text-xs sm:text-sm" title="Password (min 6 characters)"></i>
                        </label>
                        <input
                          type="password"
                          value={addAdminData.password}
                          onChange={(e) => handleAddAdminChange('password', e.target.value)}
                          placeholder="Enter password"
                          className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-xs sm:text-sm focus:outline-none focus:ring-2 ${
                            errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                          disabled={loading}
                        />
                        {errors.password && <p className="text-red-600 text-xs mt-1 flex items-center gap-1"><i className="bx bx-error-circle"></i>{errors.password}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="py-2 px-4 rounded-lg text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-sm"
                    >
                      {loading ? <i className="bx bx-loader bx-spin"></i> : <i className="bx bx-plus"></i>}
                      {loading ? 'Adding...' : 'Add Admin'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Users Grid */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md">
            <h3 className="text-base sm:text-lg font-medium text-gray-700 dark:text-gray-200 mb-2 sm:mb-4 flex items-center gap-2">
              <i className="bx bx-list-ul text-blue-500 text-lg sm:text-xl"></i>
              All Users
            </h3>
            {filteredUsers.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300 italic text-sm">No users found.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredUsers.map((user) => {
                  const roleColor = user.role === 'buyer' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' :
                    user.role === 'seller' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                    user.role === 'pro seller' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300' :
                    user.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-gray-100 text-gray-700';
                  const imageUrl = user.profileImage || null;
                  const initials = getInitials(user.email, user.name);

                  return (
                    <div
                      key={user.id}
                      className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => openUserModal(user)}
                    >
                      <div className="flex items-center gap-3 mb-3">
                        {imageUrl ? (
                          <img src={imageUrl} alt={user.name} className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                            {initials}
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">{user.name}</h4>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">Email: {user.email}</p>
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full ${roleColor}`}>
                        {user.role}
                      </span>
                      <div className="mt-3 flex justify-end gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSuspend(user.id, user.email, user.status); }}
                          className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400 dark:hover:text-yellow-300 flex items-center gap-1 text-xs"
                          disabled={loading || user.status === 'suspended'}
                        >
                          <i className="bx bx-block"></i>
                          {user.status === 'suspended' ? 'Unsuspend' : 'Suspend'}
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(user.id, user.email); }}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1 text-xs"
                          disabled={loading}
                        >
                          <i className="bx bx-trash"></i>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Improved User Modal (better UI/UX: larger, scrollable products grid, larger images) */}
          {showUserModal && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 p-10 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-4xl max-h-[80vh] overflow-y-auto">
                <div className="flex justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">User Details</h3>
                  <button onClick={() => { setShowUserModal(false); selectedUser.unsubscribe?.(); }} className="text-gray-500 hover:text-gray-700 text-xl">
                    <i className="bx bx-x"></i>
                  </button>
                </div>
                <div className="space-y-3">
                  {/* User info */}
                  {/* ... */}
                  <div>
                    <strong>Products:</strong>
                    {selectedUser.products?.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-2">
                        {selectedUser.products.map(product => (
                          <div key={product.id} className="border border-gray-200 dark:border-gray-700 p-4 rounded-lg shadow-sm hover:shadow-md">
                            <div className="flex flex-col gap-2">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-full h-32 object-cover rounded-md" />  // Larger images
                              ) : (
                                <div className="w-full h-32 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm">
                                  No Image
                                </div>
                              )}
                              <p className="font-medium text-gray-700 dark:text-gray-200">{product.name}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Price: ₦{product.price.toLocaleString()}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">Category: {product.category}</p>
                              <p className="text-sm text-gray-600 dark:text-gray-400 truncate">{product.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400">No products.</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button onClick={() => { setShowUserModal(false); openEditModal(selectedUser); selectedUser.unsubscribe?.(); }} className="py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                    Edit
                  </button>
                  {['seller', 'pro seller'].includes(selectedUser.role) && (
                    <button onClick={() => navigate(`/admin-upload-product/${selectedUser.id}`)} className="py-2 px-3 bg-green-600 text-white rounded-lg hover:bg-green-700">
                      Upload Product for Seller
                    </button>
                  )}
                  <button onClick={() => { setShowUserModal(false); selectedUser.unsubscribe?.(); }} className="py-2 px-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit Modal (similar) */}
          {showEditModal && editUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">Edit User</h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
                  >
                    <i className="bx bx-x"></i>
                  </button>
                </div>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">First Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={editUser.firstName}
                      onChange={(e) => handleEditChange('firstName', e.target.value)}
                      className={`mt-1 w-full py-2 px-3 border rounded-lg focus:ring-2 ${
                        errors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                      disabled={loading}
                    />
                    {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
                  </div>
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Last Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      value={editUser.lastName}
                      onChange={(e) => handleEditChange('lastName', e.target.value)}
                      className={`mt-1 w-full py-2 px-3 border rounded-lg focus:ring-2 ${
                        errors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                      disabled={loading}
                    />
                    {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
                  </div>
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email <span className="text-red-500">*</span></label>
                    <input
                      type="email"
                      value={editUser.email}
                      onChange={(e) => handleEditChange('email', e.target.value)}
                      className={`mt-1 w-full py-2 px-3 border rounded-lg focus:ring-2 ${
                        errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                      disabled={loading}
                    />
                    {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                  </div>
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Username</label>
                    <input
                      type="text"
                      value={editUser.username}
                      onChange={(e) => handleEditChange('username', e.target.value)}
                      className="mt-1 w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      disabled={loading}
                    />
                  </div>
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password (optional)</label>
                    <input
                      type="password"
                      value={editUser.password}
                      onChange={(e) => handleEditChange('password', e.target.value)}
                      className={`mt-1 w-full py-2 px-3 border rounded-lg focus:ring-2 ${
                        errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                      disabled={loading}
                    />
                    {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
                  </div>
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role <span className="text-red-500">*</span></label>
                    <select
                      value={editUser.role}
                      onChange={(e) => handleEditChange('role', e.target.value)}
                      className={`mt-1 w-full py-2 px-3 border rounded-lg focus:ring-2 ${
                        errors.role ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                      disabled={loading}
                    >
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                      <option value="pro seller">Pro Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                    {errors.role && <p className="text-red-600 text-sm mt-1">{errors.role}</p>}
                  </div>
                  <div className="mt-4 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="py-2 px-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="py-2 px-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      {loading ? 'Updating...' : 'Update User'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
      </div>
    </div>
  );
}