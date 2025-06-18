import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { createUserWithEmailAndPassword, updateProfile, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore';
import AdminSidebar from './AdminSidebar';

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
          className={`p-4 rounded-lg shadow-md transform transition-all duration-300 ease-in-out animate-slide-in ${
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
  const usernameBase = (firstPart + secondPart).replace(/[^a-z0-9]/g, '');
  return usernameBase + randomNum;
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
  const [editUser, setEditUser] = useState(null);
  const [errors, setErrors] = useState({});
  const [showEditModal, setShowEditModal] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Check admin authentication and fetch users
  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'admin') {
          addAlert('Unauthorized access.', 'error');
        }
      } else {
        addAlert('Please log in as an admin.', 'error');
      }
    });

    const unsubscribeUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const userList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setUsers(userList);
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUsers();
    };
  }, [navigate]);

  // Close modal with ESC key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && showEditModal) {
        setShowEditModal(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showEditModal]);

  // Validate email
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Validate password
  const validatePassword = (password) => {
    if (password && password.length < 6) {
      return 'Password must be at least 6 characters long.';
    }
    return '';
  };

  // Handle input changes
  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
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
    if (!data.firstName.trim()) newErrors.firstName = 'First name is required.';
    if (!data.lastName.trim()) newErrors.lastName = 'Last name is required.';
    if (!data.email) newErrors.email = 'Email is required.';
    else if (!validateEmail(data.email)) newErrors.email = 'Please enter a valid email address.';
    if (data.password) {
      const passwordError = validatePassword(data.password);
      if (passwordError) newErrors.password = passwordError;
    }
    if (!['buyer', 'seller', 'admin'].includes(data.role)) newErrors.role = 'Invalid role selected.';
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
        role: formData.role,
        preRegistered: true,
        createdAt: new Date().toISOString(),
        uid: newUser.uid,
        profileImage: null,
      };
      await setDoc(doc(db, 'users', newUser.uid), userData);

      addAlert(`User ${formData.email} added successfully! 🎉`, 'success');
      setFormData({ email: '', firstName: '', lastName: '', password: '', role: 'buyer' });
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

  // Handle delete user
  const handleDelete = async (userId, email) => {
    if (!window.confirm(`Are you sure you want to delete ${email}? This cannot be undone.`)) return;

    setLoading(true);
    try {
      await deleteDoc(doc(db, 'users', userId));
      addAlert(`User ${email} deleted successfully! 🗑️`, 'success');
    } catch (err) {
      console.error('Error deleting user:', err);
      addAlert('Failed to delete user.', 'error');
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
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) {
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
      <div className="flex-1 ml-0 md:ml-64 p-6">
        <div className="w-full max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b-2 border-blue-500 pb-3 flex items-center gap-2">
            <i className="bx bx-user text-blue-500"></i>
            Manage Users
          </h2>

          {/* Search Bar */}
          <div className="mb-6">
            <div className="relative group">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1 mb-1">
                Search Users
                <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Search by email or name"></i>
              </label>
              <div className="relative">
                <i className="bx bx-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by email or name..."
                  className="w-full py-2 pl-10 pr-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200"
                />
              </div>
            </div>
          </div>

          {/* Add User Form */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md mb-8">
            <div
              className="flex justify-between items-center cursor-pointer"
              onClick={() => setIsFormOpen(!isFormOpen)}
            >
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <i className={`bx bx-chevron-${isFormOpen ? 'up' : 'down'} text-blue-500`}></i>
                Add New User
              </h3>
            </div>
            {isFormOpen && (
              <div className="mt-4 animate-slide-down">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="relative group">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          First Name <span className="text-red-500">*</span>
                          <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="User's first name"></i>
                        </label>
                        <input
                          type="text"
                          value={formData.firstName}
                          onChange={(e) => handleChange('firstName', e.target.value)}
                          placeholder="John"
                          className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                            errors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                          disabled={loading}
                        />
                        {errors.firstName && (
                          <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                            <i className="bx bx-error-circle"></i>
                            {errors.firstName}
                          </p>
                        )}
                      </div>
                      <div className="relative group">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          Last Name <span className="text-red-500">*</span>
                          <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="User's last name"></i>
                        </label>
                        <input
                          type="text"
                          value={formData.lastName}
                          onChange={(e) => handleChange('lastName', e.target.value)}
                          placeholder="Doe"
                          className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                            errors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                          disabled={loading}
                        />
                        {errors.lastName && (
                          <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                            <i className="bx bx-error-circle"></i>
                            {errors.lastName}
                          </p>
                        )}
                      </div>
                      <div className="relative group">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          Email <span className="text-red-500">*</span>
                          <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="User's email address"></i>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => handleChange('email', e.target.value)}
                          placeholder="john.doe@example.com"
                          className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                            errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                          disabled={loading}
                        />
                        {errors.email && (
                          <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                            <i className="bx bx-error-circle"></i>
                            {errors.email}
                          </p>
                        )}
                      </div>
                      <div className="relative group">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          Password <span className="text-red-500">*</span>
                          <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Password (min 6 characters)"></i>
                        </label>
                        <input
                          type="password"
                          value={formData.password}
                          onChange={(e) => handleChange('password', e.target.value)}
                          placeholder="Enter password"
                          className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                            errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                          disabled={loading}
                        />
                        {errors.password && (
                          <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                            <i className="bx bx-error-circle"></i>
                            {errors.password}
                          </p>
                        )}
                      </div>
                      <div className="relative group">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                          Role <span className="text-red-500">*</span>
                          <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select user role"></i>
                        </label>
                        <select
                          value={formData.role}
                          onChange={(e) => handleChange('role', e.target.value)}
                          className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                            errors.role ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                          } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                          disabled={loading}
                        >
                          <option value="buyer">Buyer</option>
                          <option value="seller">Seller</option>
                          <option value="admin">Admin</option>
                        </select>
                        {errors.role && (
                          <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                            <i className="bx bx-error-circle"></i>
                            {errors.role}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`py-2 px-6 rounded-lg text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-sm`}
                    >
                      {loading ? <i className="bx bx-loader bx-spin"></i> : <i className="bx bx-plus"></i>}
                      {loading ? 'Adding...' : 'Add User'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
              <i className="bx bx-list-ul text-blue-500"></i>
              All Users
            </h3>
            {filteredUsers.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300 italic">No users found.</p>
            ) : (
              <>
                {/* Desktop/Tablets Table (sm and up) */}
                <div className="hidden sm:block overflow-x-auto">
                  <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200">
                    <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 min-w-[150px]">Email</th>
                        <th className="px-4 py-3 min-w-[120px]">Name</th>
                        <th className="px-4 py-3 min-w-[100px] hidden md:table-cell">Username</th>
                        <th className="px-4 py-3 min-w-[80px]">Role</th>
                        <th className="px-4 py-3 min-w-[120px] hidden lg:table-cell">Created At</th>
                        <th className="px-4 py-3 min-w-[100px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700 hover:shadow-sm transition-all duration-200">
                          <td className="px-4 py-3 break-words">{user.email}</td>
                          <td className="px-4 py-3 break-words">{user.name}</td>
                          <td className="px-4 py-3 break-words hidden md:table-cell">{user.username}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded-full ${
                                user.role === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                user.role === 'seller' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {user.role}
                            </span>
                          </td>
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </td>
                          <td className="px-4 py-3 flex gap-2">
                            <button
                              onClick={() => openEditModal(user)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1"
                              disabled={loading}
                              title="Edit user"
                            >
                              <i className="bx bx-edit"></i>
                              Edit
                            </button>
                            <button
                              onClick={() => handleDelete(user.id, user.email)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1"
                              disabled={loading}
                              title="Delete user"
                            >
                              <i className="bx bx-trash"></i>
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card Layout (below sm) */}
                <div className="block sm:hidden space-y-4">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600"
                    >
                      <div className="space-y-2">
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Email:</span>
                          <p className="text-gray-600 dark:text-gray-400 break-words">{user.email}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Name:</span>
                          <p className="text-gray-600 dark:text-gray-400 break-words">{user.name}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Username:</span>
                          <p className="text-gray-600 dark:text-gray-400 break-words">{user.username}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Role:</span>
                          <p className="text-gray-600 dark:text-gray-400 capitalize">
                            <span
                              className={`text-xs font-medium px-2 py-1 rounded-full ${
                                user.role === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' :
                                user.role === 'seller' ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' :
                                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {user.role}
                            </span>
                          </p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700 dark:text-gray-300">Created At:</span>
                          <p className="text-gray-600 dark:text-gray-400">
                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-4 mt-4">
                        <button
                          onClick={() => openEditModal(user)}
                          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-sm"
                          disabled={loading}
                        >
                          <i className="bx bx-edit"></i>
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.email)}
                          className="flex-1 py-2 px-4 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-sm"
                          disabled={loading}
                        >
                          <i className="bx bx-trash"></i>
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Edit User Modal */}
          {showEditModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md w-full max-w-md">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
                    <i className="bx bx-edit text-blue-500"></i>
                    Edit User
                  </h3>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xl"
                    title="Close"
                  >
                    <i className="bx bx-x"></i>
                  </button>
                </div>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      First Name <span className="text-red-500">*</span>
                      <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="User's first name"></i>
                    </label>
                    <input
                      type="text"
                      value={editUser.firstName}
                      onChange={(e) => handleEditChange('firstName', e.target.value)}
                      placeholder="John"
                      className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                      disabled={loading}
                    />
                    {errors.firstName && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <i className="bx bx-error-circle"></i>
                        {errors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Last Name <span className="text-red-500">*</span>
                      <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="User's last name"></i>
                    </label>
                    <input
                      type="text"
                      value={editUser.lastName}
                      onChange={(e) => handleEditChange('lastName', e.target.value)}
                      placeholder="Doe"
                      className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                      disabled={loading}
                    />
                    {errors.lastName && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <i className="bx bx-error-circle"></i>
                        {errors.lastName}
                      </p>
                    )}
                  </div>
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Email <span className="text-red-500">*</span>
                      <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="User's email address"></i>
                    </label>
                    <input
                      type="email"
                      value={editUser.email}
                      onChange={(e) => handleEditChange('email', e.target.value)}
                      placeholder="john.doe@example.com"
                      className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                      disabled={loading}
                    />
                    {errors.email && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <i className="bx bx-error-circle"></i>
                        {errors.email}
                      </p>
                    )}
                  </div>
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Username
                      <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Unique username (auto-generated if blank)"></i>
                    </label>
                    <input
                      type="text"
                      value={editUser.username}
                      onChange={(e) => handleEditChange('username', e.target.value)}
                      placeholder="Auto-generated if blank"
                      className="mt-1 w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200"
                      disabled={loading}
                    />
                  </div>
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      New Password (optional)
                      <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Enter new password to send reset email"></i>
                    </label>
                    <input
                      type="password"
                      value={editUser.password}
                      onChange={(e) => handleEditChange('password', e.target.value)}
                      placeholder="Leave blank to keep current password"
                      className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                      disabled={loading}
                    />
                    {errors.password && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <i className="bx bx-error-circle"></i>
                        {errors.password}
                      </p>
                    )}
                  </div>
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Role <span className="text-red-500">*</span>
                      <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select user role"></i>
                    </label>
                    <select
                      value={editUser.role}
                      onChange={(e) => handleEditChange('role', e.target.value)}
                      className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.role ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                      disabled={loading}
                    >
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                    {errors.role && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <i className="bx bx-error-circle"></i>
                        {errors.role}
                      </p>
                    )}
                  </div>
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="py-2 px-4 rounded-lg text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm flex items-center gap-2 transition-all duration-200 shadow-sm"
                      disabled={loading}
                    >
                      <i className="bx bx-x"></i>
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`py-2 px-4 rounded-lg text-white text-sm font-medium bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2 transition-all duration-200 shadow-sm`}
                    >
                      {loading ? <i className="bx bx-loader bx-spin"></i> : <i className="bx bx-save"></i>}
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