import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Spinner from '../components/common/Spinner';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState({
    name: '',
    username: '',
    email: '',
    country: '',
    phone: '',
    address: '',
  });
  const [previewImage, setPreviewImage] = useState(localStorage.getItem('profileImage') || 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg');
  const [uploadError, setUploadError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (!user) {
        setError('Please sign in to edit your profile.');
        setLoading(false);
        return;
      }

      try {
        const userDoc = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDoc);
        if (!docSnap.exists()) {
          setError('User profile not found.');
          return;
        }
        const firestoreData = docSnap.data();
        const addresses = firestoreData.addresses || [];
        const address = addresses[0]?.street
          ? `${addresses[0].street}, ${addresses[0].city}, ${addresses[0].state}, ${addresses[0].postalCode}, ${addresses[0].country}`
          : 'Not provided';

        setUserData({
          name: firestoreData.name || user.displayName || 'Emmanuel Chinecherem',
          username: firestoreData.username || 'emmachi789',
          email: user.email || 'test@example.com',
          country: firestoreData.country || 'Nigeria',
          phone: firestoreData.phone || '+234-8052975966',
          address,
        });
      } catch (err) {
        setError('Failed to load profile data.');
        console.log(err);
      } finally {
        setLoading(false);
      }
    });

    document.documentElement.classList.toggle('dark', theme === 'dark');
    return () => unsubscribe();
  }, [theme]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setUploadError('Please upload a valid image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image size must be less than 5MB.');
      return;
    }

    setUploadError('');
    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result;
      setPreviewImage(imageUrl);
      localStorage.setItem('profileImage', imageUrl);
      window.dispatchEvent(new Event('profileImageUpdated'));
    };
    reader.readAsDataURL(file);
  };

  const handlePasswordChange = async () => {
    setPasswordError('');
    const user = auth.currentUser;
    if (!user) {
      setPasswordError('Please sign in to change your password.');
      return;
    }

    if (!currentPassword || !newPassword) {
      setPasswordError('Please fill in both current and new password fields.');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long.');
      return;
    }

    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      alert('Password updated successfully!');
    } catch (err) {
      if (err.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect.');
      } else if (err.code === 'auth/requires-recent-login') {
        setPasswordError('Please log out and log in again to change your password.');
        navigate('/login');
      } else {
        setPasswordError('Failed to change password. Please try again.');
      }
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError('Please sign in to save changes.');
      return;
    }

    try {
      const addressParts = userData.address.split(', ');
      const addressObj = addressParts.length === 5
        ? {
            street: addressParts[0],
            city: addressParts[1],
            state: addressParts[2],
            postalCode: addressParts[3],
            country: addressParts[4],
          }
        : {
            street: userData.address,
            city: '',
            state: '',
            postalCode: '',
            country: userData.country,
          };

      await updateDoc(doc(db, 'users', user.uid), {
        name: userData.name,
        username: userData.username,
        country: userData.country,
        phone: userData.phone,
        addresses: [addressObj],
      });

      localStorage.setItem('userData', JSON.stringify(userData));
      window.dispatchEvent(new Event('userDataUpdated'));
      alert('Profile updated successfully!');
    } catch (err) {
      console.log(err);
      setError('Failed to save profile. Please try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      localStorage.removeItem('userData');
      localStorage.removeItem('profileImage');
      window.dispatchEvent(new Event('profileImageUpdated'));
      navigate('/login');
    } catch (err) {
      console.log(err);
      setError('Failed to log out. Please try again.');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) return;

    const user = auth.currentUser;
    if (!user) {
      setError('Please sign in to delete your account.');
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', user.uid));
      await user.delete();
      localStorage.removeItem('userData');
      localStorage.removeItem('profileImage');
      window.dispatchEvent(new Event('profileImageUpdated'));
      navigate('/login');
    } catch (err) {
      setError('Failed to delete account. Please try again.');
      console.log(err);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Spinner />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600">{error}</p>
        <button
          onClick={() => setError('')}
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800 dark:text-gray-200">
      <div className="flex flex-col md:flex-row gap-6">
        <Sidebar />
        <div className="md:w-3/4">
          <h1 className="text-3xl font-bold mb-6">Settings</h1>
          <div className="rounded-lg p-6 bg-gray-50 dark:bg-gray-700">
            <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                <img
                  src={previewImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.src = 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg';
                  }}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer text-blue-600 hover:underline flex items-center">
                  <i className="bx bx-upload mr-1"></i> Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {uploadError && <p className="text-red-600 text-sm mt-2">{uploadError}</p>}
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-slate-400 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="text-slate-400 dark:text-gray-300">Username</label>
                <input
                  type="text"
                  name="username"
                  value={userData.username}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="text-slate-400 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
                  disabled
                />
              </div>
              <div>
                <label className="text-slate-400 dark:text-gray-300">Country</label>
                <input
                  type="text"
                  name="country"
                  value={userData.country}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="text-slate-400 dark:text-gray-300">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={userData.phone}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-slate-400 dark:text-gray-300">Address</label>
                <input
                  type="text"
                  name="address"
                  value={userData.address}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded-lg mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
                />
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4">Security</h3>
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 dark:text-gray-300">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
                    />
                    <button
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300"
                    >
                      <i className={`bx ${showCurrentPassword ? 'bx-hide' : 'bx-show'} text-lg`}></i>
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 dark:text-gray-300">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg mt-1 dark:bg-gray-600 dark:border-gray-500 dark:text-gray-200"
                    />
                    <button
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300"
                    >
                      <i className={`bx ${showNewPassword ? 'bx-hide' : 'bx-show'} text-lg`}></i>
                    </button>
                  </div>
                </div>
              </div>
              {passwordError && <p className="text-red-600 text-sm mt-2">{passwordError}</p>}
              <button
                onClick={handlePasswordChange}
                className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Change Password
              </button>
            </div>

            <h3 className="text-lg font-semibold mb-4">Preferences</h3>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <label className="text-slate-400 dark:text-gray-300">Email Notifications</label>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={() => setEmailNotifications(!emailNotifications)}
                  className="h-5 w-5 text-blue-600 dark:bg-gray-600"
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                <label className="text-slate-400 dark:text-gray-300">Theme</label>
                <button
                  onClick={toggleTheme}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg"
                >
                  {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4">Account Actions</h3>
            <div className="flex gap-4 mb-6">
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
              >
                Log Out
              </button>
              <button
                onClick={handleDeleteAccount}
                className="px-4 py-2 bg-red-700 text-white rounded-lg hover:bg-red-800"
              >
                Delete Account
              </button>
            </div>

            <div className="flex gap-4">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
              >
                Save Changes
              </button>
              <Link
                to="/profile"
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 dark:border-gray-500 dark:text-gray-200 dark:hover:bg-gray-600"
              >
                Cancel
              </Link>
            </div>
            {error && <p className="text-red-600 mt-2">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}