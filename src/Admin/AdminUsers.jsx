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
          className={`p-3 rounded-md shadow-md ${
            alert.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}
        >
          {alert.message}
          <button onClick={() => removeAlert(alert.id)} className="ml-2 text-sm font-bold">✕</button>
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
      // Delete Firestore document
      await deleteDoc(doc(db, 'users', userId));

      // Call Cloud Function to delete Firebase Auth user
      const response = await fetch('https://your-region-your-project-id.cloudfunctions.net/deleteUser', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to delete Firebase Auth user.');
      }

      addAlert(`User ${email} deleted successfully! 🗑️`, 'success');
    } catch (err) {
      console.error('Error deleting user:', err);
      addAlert('Failed to delete user. Please try again.', 'error');
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

  if (!user) {
    return (
      <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
        <AdminSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <p className="text-gray-600 dark:text-gray-300">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-900">
      <AdminSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-6">
        <div className="w-full max-w-6xl mx-auto">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 dark:text-gray-200 mb-6 border-b pb-3">
            Manage Users 👥
          </h2>

          {/* Add User Form */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg mb-8">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4">Add New User ➕</h3>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                    />
                    {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                    />
                    {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange('email', e.target.value)}
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                    />
                    {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                    />
                    {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formData.role}
                      onChange={(e) => handleChange('role', e.target.value)}
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.role ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                    >
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                    {errors.role && <p className="text-red-600 text-xs mt-1">{errors.role}</p>}
                  </div>
                </div>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading}
                  className={`py-2 px-6 rounded-md text-white text-sm font-medium transition duration-200 shadow ${
                    loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800'
                  }`}
                >
                  {loading ? 'Adding...' : 'Add User ➕'}
                </button>
              </div>
            </form>
          </div>

          {/* Users Table */}
          <div className="bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-lg">
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4">All Users 📋</h3>
            {users.length === 0 ? (
              <p className="text-gray-600 dark:text-gray-300">No users found.</p>
            ) : (
              <>
                {/* Desktop/Tablets Table (sm and up) */}
                <div className="hidden sm:block">
                  <table className="w-full text-sm text-left text-gray-700 dark:text-gray-200">
                    <thead className="text-xs uppercase bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th className="px-4 py-3 min-w-[150px] sm:min-w-[120px]">Email</th>
                        <th className="px-4 py-3 min-w-[120px] sm:min-w-[100px]">Name</th>
                        <th className="px-4 py-3 min-w-[100px] hidden md:table-cell">Username</th>
                        <th className="px-4 py-3 min-w-[80px] sm:min-w-[60px]">Role</th>
                        <th className="px-4 py-3 min-w-[120px] hidden lg:table-cell">Created At</th>
                        <th className="px-4 py-3 min-w-[100px] sm:min-w-[80px]">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((user) => (
                        <tr key={user.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-4 py-3 break-words">{user.email}</td>
                          <td className="px-4 py-3 break-words">{user.name}</td>
                          <td className="px-4 py-3 break-words hidden md:table-cell">{user.username}</td>
                          <td className="px-4 py-3 capitalize">{user.role}</td>
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
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                              disabled={loading}
                            >
                              Edit ✏️
                            </button>
                            <button
                              onClick={() => handleDelete(user.id, user.email)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                              disabled={loading}
                            >
                              Delete 🗑️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Card Layout (below sm) */}
                <div className="block sm:hidden space-y-4">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg shadow border border-gray-200 dark:border-gray-600"
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
                          <p className="text-gray-600 dark:text-gray-400 capitalize">{user.role}</p>
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
                          className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-sm"
                          disabled={loading}
                        >
                          Edit ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.email)}
                          className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-sm"
                          disabled={loading}
                        >
                          Delete 🗑️
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
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg w-full max-w-md">
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4">Edit User ✏️</h3>
                <form onSubmit={handleEditSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editUser.firstName}
                      onChange={(e) => handleEditChange('firstName', e.target.value)}
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.firstName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                    />
                    {errors.firstName && <p className="text-red-600 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Last Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={editUser.lastName}
                      onChange={(e) => handleEditChange('lastName', e.target.value)}
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.lastName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                    />
                    {errors.lastName && <p className="text-red-600 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={editUser.email}
                      onChange={(e) => handleEditChange('email', e.target.value)}
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.email ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                    />
                    {errors.email && <p className="text-red-600 text-xs mt-1">{errors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Username
                    </label>
                    <input
                      type="text"
                      value={editUser.username}
                      onChange={(e) => handleEditChange('username', e.target.value)}
                      className="mt-1 w-full py-2 px-3 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={loading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      New Password (optional)
                    </label>
                    <input
                      type="password"
                      value={editUser.password}
                      onChange={(e) => handleEditChange('password', e.target.value)}
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.password ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                      placeholder="Leave blank to keep current password"
                    />
                    {errors.password && <p className="text-red-600 text-xs mt-1">{errors.password}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={editUser.role}
                      onChange={(e) => handleEditChange('role', e.target.value)}
                      className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.role ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      }`}
                      disabled={loading}
                    >
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                      <option value="admin">Admin</option>
                    </select>
                    {errors.role && <p className="text-red-600 text-xs mt-1">{errors.role}</p>}
                  </div>
                  <div className="flex justify-end gap-4">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="py-2 px-4 rounded-md text-gray-700 dark:text-gray-200 bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 text-sm"
                      disabled={loading}
                    >
                      Cancel ❌
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`py-2 px-4 rounded-md text-white text-sm font-medium transition duration-200 ${
                        loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800'
                      }`}
                    >
                      {loading ? 'Updating...' : 'Update User 💾'}
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