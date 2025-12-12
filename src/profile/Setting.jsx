import React, { useState, useEffect } from 'react';
import { auth, db } from '/src/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { User, Upload, Lock, Settings, LogOut, X, Save, Bell, Moon, Sun, Eye, EyeOff } from 'lucide-react';
import Sidebar from '/src/profile/Sidebar';
import Spinner from '/src/components/common/Spinner';

export default function Setting() {
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
  const [previewImage, setPreviewImage] = useState(localStorage.getItem('profileImage') || null);
  const [uploadError, setUploadError] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');
  const navigate = useNavigate();
  const fallbackImage = 'https://via.placeholder.com/150?text=Profile';

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (!user) {
        setError('Please sign in to edit your profile.');
        setPreviewImage(null);
        setLoading(false);
        return;
      }

      try {
        const userDoc = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDoc);
        if (!docSnap.exists()) {
          setError('User profile not found.');
          setLoading(false);
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
          email: user.email || '',
          country: firestoreData.country || '',
          phone: firestoreData.phoneNumber || 'Not provided',
          address,
        });
      } catch (err) {
        setError('Failed to load profile data.');
        console.error('Error loading profile:', err);
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
    setLoading(true);

    try {
      const reader = new FileReader();
      reader.onload = () => {
        const imageUrl = reader.result;
        setPreviewImage(imageUrl);
        localStorage.setItem('profileImage', imageUrl);
        window.dispatchEvent(new Event('profileImageUpdated'));
        toast.success('Profile image updated successfully!');
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Error processing image:', err);
      setUploadError('Failed to process image. Please try again.');
    } finally {
      setLoading(false);
    }
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

    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setPasswordError('New password must contain at least one uppercase letter and one number.');
      return;
    }

    setLoading(true);
    try {
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);
      await updatePassword(user, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      toast.success('Password updated successfully!');
    } catch (err) {
      console.error('Error changing password:', err);
      if (err.code === 'auth/wrong-password') {
        setPasswordError('Current password is incorrect.');
      } else if (err.code === 'auth/requires-recent-login') {
        setPasswordError('Please log out and log in again to change your password.');
        navigate('/login');
      } else {
        setPasswordError('Failed to change password. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError('Please sign in to save changes.');
      return;
    }

    setLoading(true);
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
        phoneNumber: userData.phone === 'Not provided' ? '' : userData.phone,
        addresses: [addressObj],
      });

      localStorage.setItem('userData', JSON.stringify(userData));
      window.dispatchEvent(new Event('userDataUpdated'));
      toast.success('Profile updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await auth.signOut();
      localStorage.removeItem('userData');
      localStorage.removeItem('profileImage');
      setPreviewImage(null);
      window.dispatchEvent(new Event('profileImageUpdated'));
      navigate('/login');
      toast.success('Logged out successfully!');
    } catch (err) {
      console.error('Error logging out:', err);
      setError('Failed to log out. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  const getAvatar = () => {
    if (previewImage) {
      return (
        <img
          src={previewImage}
          alt="Profile"
          className="w-full h-full object-cover"
          onError={() => setPreviewImage(fallbackImage)}
        />
      );
    }
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-300 text-white text-2xl font-bold uppercase">
        {userData.email[0] || '?'}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Spinner />
        <p className="text-gray-600 dark:text-gray-300 mt-4">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={() => setError('')}
          className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto mb-10 px-4 py-8 text-gray-800 dark:text-gray-700">
      <div className="flex flex-col md:flex-row gap-6">
        <Sidebar />
        <div className="md:w-3/4">
          <h1 className="text-3xl font-bold mb-6 text-gray-800 dark:text-gray-200">Settings</h1>
          <div className="rounded-lg p-6 dark:bg-gray-800 shadow-md border border-gray-100 dark:border-black">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <User size={20} /> Profile Picture
            </h3>
            <div className="flex items-center gap-4 mb-6">
              <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden shadow hover:bg-gray-300 transition-colors duration-300">
                {getAvatar()}
              </div>
              <div className="flex flex-col gap-2">
                <label className="cursor-pointer text-blue-600 hover:text-blue-400 flex items-center gap-1">
                  <Upload size={16} /> Choose Image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                {uploadError && <p className="text-red-600 dark:text-red-400 text-sm mt-1">{uploadError}</p>}
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <User size={20} /> Personal Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-gray-500 dark:text-gray-300">Name</label>
                <input
                  type="text"
                  name="name"
                  value={userData.name}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-black rounded-lg dark:bg-gray-700 dark:text-gray-200"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="text-gray-500 dark:text-gray-300">Username</label>
                <input
                  type="text"
                  name="username"
                  value={userData.username}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-black rounded-lg dark:bg-gray-700 dark:text-gray-200"
                  placeholder="Enter your username"
                />
              </div>
              <div>
                <label className="text-gray-500 dark:text-gray-300">Email</label>
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-black rounded-lg dark:bg-gray-700 dark:text-gray-400"
                  disabled
                />
              </div>
              <div>
                <label className="text-gray-500 dark:text-gray-300">Country</label>
                <input
                  type="text"
                  name="country"
                  value={userData.country}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-black rounded-lg dark:bg-gray-700 dark:text-gray-200"
                  placeholder="Enter your country"
                />
              </div>
              <div>
                <label className="text-gray-500 dark:text-gray-300">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={userData.phone}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-black rounded-lg dark:bg-gray-700 dark:text-gray-200"
                  placeholder="Enter your phone number"
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-gray-500 dark:text-gray-300">Address</label>
                <input
                  type="text"
                  name="address"
                  value={userData.address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-black rounded-lg dark:bg-gray-700 dark:text-gray-200"
                  placeholder="Enter your address"
                />
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <Lock size={20} /> Security
            </h3>
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-gray-500 dark:text-gray-300">Current Password</label>
                  <div className="relative">
                    <input
                      type={showCurrentPassword ? 'text' : 'password'}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-black rounded-lg dark:bg-gray-700 dark:text-gray-200"
                      placeholder="Enter current password"
                    />
                    <button
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300"
                    >
                      {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-gray-500 dark:text-gray-300">New Password</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-black rounded-lg dark:bg-gray-700 dark:text-gray-200"
                      placeholder="Enter new password"
                    />
                    <button
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300"
                    >
                      {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              </div>
              {passwordError && <p className="text-red-600 dark:text-red-400 text-sm mt-2">{passwordError}</p>}
              <button
                onClick={handlePasswordChange}
                className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg shadow-md hover:bg-blue-600 transition-colors"
              >
                Change Password
              </button>
            </div>

            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
              <Settings size={20} /> Preferences
            </h3>
            <div className="mb-6">
              <div className="flex items-center justify-between">
                <label className="text-gray-500 dark:text-gray-300">Email Notifications</label>
                <input
                  type="checkbox"
                  checked={emailNotifications}
                  onChange={() => setEmailNotifications(!emailNotifications)}
                  className="h-5 w-5 text-blue-600 dark:bg-gray-700"
                />
              </div>
              <div className="flex items-center justify-between mt-4">
                <label className="text-gray-500 dark:text-gray-300">Theme</label>
                <button
                  onClick={toggleTheme}
                  className="px-6 py-2 bg-gray-200 dark:bg-gray-600 rounded-lg shadow hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  {theme === 'light' ? <Moon size={16} className="inline mr-1" /> : <Sun size={16} className="inline mr-1" />}
                  {theme === 'light' ? 'Switch to Dark' : 'Switch to Light'}
                </button>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-800 dark:text-gray-200">
            </h3>
            <div className="flex flex-wrap gap-4 mb-6">
              <button
                onClick={handleLogout}
                className="px-3 py-2 bg-gray-900 text-white rounded-lg shadow-md hover:bg-red-900 transition-colors flex items-center gap-1"
              >
                <LogOut size={16} /> Log Out
              </button>
              <Link
                to="/profile"
                className="px-6 py-2 bg-gray-300 text-gray-800 rounded-lg shadow-md hover:bg-gray-400 transition-colors dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500 flex items-center gap-1"
              >
                <X size={16} /> Cancel
              </Link>
              <button
                onClick={handleSave}
                className="px-3 py-2 bg-gray-700 text-white rounded-lg shadow-md hover:bg-gray-800 transition-colors flex items-center gap-1"
              >
                <Save size={16} /> Save Changes
              </button>
            </div>
            {error && <p className="text-red-600 dark:text-red-400 mt-2">{error}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}