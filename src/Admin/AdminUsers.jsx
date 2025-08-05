import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail, getIdToken } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import AdminSidebar from '/src/Admin/AdminSidebar.jsx';

// Custom Alert Component
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
          className={`p-3 rounded-lg shadow-md transform transition-all duration-300 ease-in-out animate-slide-in ${
            alert.type === 'error' ? 'bg-red-600 text-white' : 'bg-green-600 text-white'
          } flex items-center gap-2`}
        >
          <i className={`bx ${alert.type === 'error' ? 'bx-error-circle' : 'bx-check-circle'} text-lg`}></i>
          <span className="text-sm">{alert.message}</span>
          <button onClick={() => removeAlert(alert.id)} className="ml-auto text-lg font-bold hover:text-gray-200">
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}

// Local hook for managing alerts
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

// Generate username
const generateUsername = (firstName, lastName) => {
  const nameParts = [firstName, lastName].filter(part => part && part.trim());
  const firstPart = nameParts[0] ? nameParts[0].slice(0, 4).toLowerCase() : 'user';
  const secondPart = nameParts[1] ? nameParts[1].slice(0, 3).toLowerCase() : '';
  const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return (firstPart + secondPart).replace(/[^a-z0-9]/g, '') + randomNum;
};

// Get initials from email or name
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
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    password: '',
    role: 'buyer',
  });
  const [addAdminData, setAddAdminData] = useState({ email: '', password: '' });
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUser, setEditUser] = useState(null);
  const [errors, setErrors] = useState({});
  const [showUserModal, setShowUserModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAddAdminOpen, setIsAddAdminOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Check admin authentication and fetch users
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          addAlert('Unauthorized access.', 'error');
          // navigate('/login');
        }
      } else {
        addAlert('Please log in as an admin.', 'error');
        // navigate('/login');
      }
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          role: data.role || 'buyer',
          status: data.status || 'active',
          profileImage: data.profileImage || null,
        };
      });
      setUsers(userList);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
    };
  }, [navigate]);

  // Fetch products for selected user with images and info
  const fetchUserProducts = async (userId) => {
    const productsRef = collection(db, 'products');
    const q = query(productsRef, where('sellerId', '==', userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          name: data.name || 'Unnamed Product',
          imageUrl: data.imageUrl || null,
          price: data.price || 0,
          description: data.description || 'No description available',
          category: data.category || 'Uncategorized',
        };
      });
      setSelectedUser((prev) => prev ? { ...prev, products } : null);
    });
    return unsubscribe;
  };

  // Close modal with ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && (showUserModal || showEditModal)) {
        setShowUserModal(false);
        setShowEditModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showUserModal, showEditModal]);

  // Validate email
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // Validate password
  const validatePassword = (password) => (password && password.length < 6 ? 'Password must be at least 6 characters.' : '');

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Handle add admin input changes
  const handleAddAdminChange = (field, value) => {
    setAddAdminData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Handle edit input changes
  const handleEditChange = (field, value) => {
    setEditUser((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Validate form
  const validateForm = (data) => {
    const newErrors = {};
    if (!data.firstName?.trim()) newErrors.firstName = 'First name is required.';
    if (!data.lastName?.trim()) newErrors.lastName = 'Last name is required.';
    if (!data.email) newErrors.email = 'Email is required.';
    else if (!validateEmail(data.email)) newErrors.email = 'Please enter a valid email address.';
    if (data.password) {
      const passwordError = validatePassword(data.password);
      if (passwordError) newErrors.password = passwordError;
    }
    if (!['buyer', 'seller', 'pro seller', 'admin'].includes(data.role)) newErrors.role = 'Invalid role selected.';
    return newErrors;
  };

  // Validate add admin form
  const validateAddAdmin = (data) => {
    const newErrors = {};
    if (!data.email) newErrors.email = 'Email is required.';
    else if (!validateEmail(data.email)) newErrors.email = 'Please enter a valid email address.';
    if (!data.password) newErrors.password = 'Password is required.';
    else if (validatePassword(data.password)) newErrors.password = validatePassword(data.password);
    return newErrors;
  };

  // Handle add user submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const newErrors = validateForm(formData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      addAlert('Please fix the form errors.', 'error');
      return;
    }

    try {
      const username = generateUsername(formData.firstName, formData.lastName);
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const newUser = userCredential.user;

      await updateProfile(newUser, { displayName: username });

      const userData = {
        email: formData.email,
        name: `${formData.firstName} ${formData.lastName}`,
        username,
        role: formData.role || 'buyer',
        status: 'active',
        preRegistered: true,
        createdAt: new Date().toISOString(),
        uid: newUser.uid,
        profileImage: null,
      };
      await setDoc(doc(db, 'users', newUser.uid), userData);

      addAlert(`User ${formData.email} added successfully! 🎉`, 'success');
      setFormData({ email: '', firstName: '', lastName: '', password: '', role: 'buyer' });
      setIsFormOpen(false);
    } catch (err) {
      console.error('Error adding user:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrors({ email: 'This email is already in use.' });
      } else if (err.code === 'auth/invalid-email') {
        setErrors({ email: 'Invalid email format.' });
      } else if (err.code === 'auth/wrong-password') {
        setErrors({ password: 'Invalid password.' });
      } else {
        addAlert('Failed to add user.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle add admin submission
  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const newErrors = validateAddAdmin(addAdminData);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      addAlert('Please fix the form errors.', 'error');
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

      await setDoc(doc(collection(db, 'admins'), newAdmin.uid), {
        email: addAdminData.email,
        uid: newAdmin.uid,
        createdAt: new Date().toISOString(),
      });

      addAlert(`Admin ${addAdminData.email} added successfully! 🎉`, 'success');
      setAddAdminData({ email: '', password: '' });
      setIsAddAdminOpen(false);
    } catch (err) {
      console.error('Error adding admin:', err);
      if (err.code === 'auth/email-already-in-use') {
        setErrors({ email: 'This email is already in use.' });
      } else {
        addAlert('Failed to add admin.', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  // Handle edit user submission
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    const newErrors = validateForm(editUser);
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      addAlert('Please fix the form errors.', 'error');
      return;
    }

    try {
      const username = editUser.username || generateUsername(editUser.firstName, editUser.lastName);
      const userDoc = doc(db, 'users', editUser.id);
      await updateDoc(userDoc, {
        email: editUser.email,
        name: `${editUser.firstName} ${editUser.lastName}`,
        username,
        role: editUser.role,
        updatedAt: new Date().toISOString(),
      });

      if (editUser.password) {
        await sendPasswordResetEmail(auth, editUser.email);
        addAlert(`Password reset email sent to ${editUser.email}! 🔒`, 'success');
      }

      addAlert(`User ${editUser.email} updated successfully! ✏️`, 'success');
      setShowEditModal(false);
      setEditUser(null);
    } catch (err) {
      console.error('Error updating user:', err);
      addAlert('Failed to update user.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Handle suspend/unsuspend user
  const handleSuspend = async (userId, email, currentStatus) => {
    if (!window.confirm(`Are you sure you want to ${currentStatus === 'suspended' ? 'unsuspend' : 'suspend'} ${email}?`)) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        status: currentStatus === 'suspended' ? 'active' : 'suspended',
        updatedAt: new Date().toISOString(),
      });
      addAlert(`User ${email} ${currentStatus === 'suspended' ? 'unsuspended' : 'suspended'} successfully!`, 'success');
    } catch (error) {
      console.error('Error suspending/unsuspending user:', error);
      addAlert('Failed to update user status.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Modified handleDelete function to include sending membership revoked email
  const handleDelete = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to delete ${email}? This cannot be undone.`)) return;
    setLoading(true);
    try {
      // Send membership revoked email
      await fetch('/send-membership-revoked-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const userRef = doc(db, 'users', userId);
      await deleteDoc(userRef);
      addAlert(`User ${email} deleted successfully!`, 'success');
    } catch (error) {
      console.error('Error deleting user or sending email:', error);
      addAlert('Failed to delete user or send email.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open user info modal
  const openUserModal = async (user) => {
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, 'users', user.id));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const unsubscribe = await fetchUserProducts(user.id);
        setSelectedUser({ ...user, ...userData, unsubscribe });
      }
      setShowUserModal(true);
    } catch (err) {
      console.error('Error fetching user details:', err);
      addAlert('Failed to fetch user details.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal
  const openEditModal = (user) => {
    setEditUser({
      id: user.id,
      email: user.email,
      firstName: user.name.split(' ')[0],
      lastName: user.name.split(' ').slice(1).join(' ') || '',
      username: user.username,
      role: user.role,
      password: '',
    });
    setShowEditModal(true);
  };

  // Filter users by search query
  const filteredUsers = users.filter((user) =>
    (user.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
    (user.name?.toLowerCase() || '').includes(searchQuery.toLowerCase())
  );

  if (!user) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <AdminSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-4 sm:p-6 flex justify-center items-center">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <i className="bx bx-loader bx-spin text-xl sm:text-2xl"></i>
            <span className="text-sm sm:text-base">Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-4 sm:p-6">
        <div className="w-full max-w-5xl mx-auto">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-4 sm:mb-6 border-b-2 border-blue-500 pb-2 sm:pb-3 flex items-center gap-2">
            <i className="bx bx-user text-blue-500 text-lg sm:text-xl"></i>
            Manage Users
          </h2>

          {/* Search Bar */}
          <div className="mb-4 sm:mb-6">
            <div className="relative group">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                Search Users
                <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help text-xs sm:text-sm" title="Search by email or name"></i>
              </label>
              <div className="relative">
                <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm sm:text-base"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email or name..."
                  className="w-full py-2 pl-10 pr-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200"
                />
              </div>
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
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
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
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
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
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
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
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
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
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
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

          {/* Add Admin Form */}
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
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
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
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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

          {/* User Info Modal */}
          {showUserModal && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg shadow-md w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200">User Details</h3>
                  <button
                    onClick={() => { setShowUserModal(false); selectedUser.unsubscribe && selectedUser.unsubscribe(); }}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
                  >
                    <i className="bx bx-x"></i>
                  </button>
                </div>
                <div className="space-y-3">
                  <p><strong>Name:</strong> {selectedUser.name}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Username:</strong> {selectedUser.username}</p>
                  <p><strong>Role:</strong> {selectedUser.role}</p>
                  <div>
                    <strong>Products:</strong>
                    {selectedUser.products && selectedUser.products.length > 0 ? (
                      <ul className="mt-2 space-y-4">
                        {selectedUser.products.map((product) => (
                          <li key={product.id} className="border-b border-gray-200 dark:border-gray-700 pb-2">
                            <div className="flex items-start gap-3">
                              {product.imageUrl ? (
                                <img src={product.imageUrl} alt={product.name} className="w-16 h-16 object-cover rounded" />
                              ) : (
                                <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-400">
                                  No Image
                                </div>
                              )}
                              <div>
                                <p className="font-medium text-gray-700 dark:text-gray-200">{product.name}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Price: ₦{product.price?.toLocaleString('en-NG') || 'N/A'}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Category: {product.category}</p>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400">No products uploaded.</p>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={() => { setShowUserModal(false); openEditModal(selectedUser); selectedUser.unsubscribe && selectedUser.unsubscribe(); }}
                    className="py-2 px-3 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => { setShowUserModal(false); selectedUser.unsubscribe && selectedUser.unsubscribe(); }}
                    className="py-2 px-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Edit User Modal */}
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