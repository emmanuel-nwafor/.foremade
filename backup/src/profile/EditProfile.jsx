import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Link, useNavigate } from 'react-router-dom';

export default function EditProfile() {
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
  const [newProfileImage, setNewProfileImage] = useState(null);
  const [uploadError, setUploadError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      const user = auth.currentUser;
      if (!user) {
        setError('Please sign in to edit your profile.');
        setLoading(false);
        return;
      }

      try {
        const userDoc = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDoc);
        if (!docSnap.exists()) {
          console.warn('User document not found:', user.uid);
          setError('User profile not found.');
          return;
        }
        const firestoreData = docSnap.data();
        const storedUserData = localStorage.getItem('userData') ? JSON.parse(localStorage.getItem('userData')) : {};
        const addresses = firestoreData.addresses || [];
        const address = addresses[0]?.street
          ? `${addresses[0].street}, ${addresses[0].city}, ${addresses[0].state}, ${addresses[0].postalCode}, ${addresses[0].country}`
          : storedUserData.address || 'Not provided';

        setUserData({
          name: storedUserData.name || firestoreData.name || user.displayName || 'Emmanuel Chinecherem',
          username: storedUserData.username || firestoreData.username || 'emmaChi',
          email: user.email || 'test@example.com',
          country: storedUserData.country || firestoreData.country || 'Nigeria',
          phone: storedUserData.phone || firestoreData.phone || '+234-8052975966',
          address,
        });
      } catch (err) {
        console.error('Error fetching user data:', err);
        setError('Failed to load profile data.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

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

    setNewProfileImage(file);
    setUploadError('');
  };

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError('Please sign in to save changes.');
      return;
    }

    try {
      let imageUrl = userData.profileImage;
      if (newProfileImage) {
        const reader = new FileReader();
        reader.onload = async () => {
          imageUrl = reader.result;
          await updateDoc(doc(db, 'users', user.uid), {
            name: userData.name,
            username: userData.username,
            country: userData.country,
            phone: userData.phone,
            address: userData.address.split(', ')[0],
            profileImage: imageUrl,
          });
          const updatedData = { ...userData, profileImage: imageUrl };
          localStorage.setItem('userData', JSON.stringify(updatedData));
          navigate('/profile');
        };
        reader.readAsDataURL(newProfileImage);
      } else {
        await updateDoc(doc(db, 'users', user.uid), {
          name: userData.name,
          username: userData.username,
          country: userData.country,
          phone: userData.phone,
          address: userData.address.split(', ')[0],
        });
        localStorage.setItem('userData', JSON.stringify(userData));
        navigate('/profile');
      }
    } catch (err) {
      console.error('Error saving profile:', err);
      setError('Failed to save profile. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center bg-gray-100">
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
    <div className="container mx-auto px-4 py-8 text-gray-800 bg-gray-100">
      <h1 className="text-3xl font-bold mb-6">Edit Profile</h1>
      <div className="rounded-lg p-6 bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Profile Picture</h3>
        <div className="flex items-center gap-4 mb-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
            <span className="text-4xl font-bold text-gray-700">
              {userData.email.charAt(0).toUpperCase()}
            </span>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-slate-400">Name</label>
            <input
              type="text"
              name="name"
              value={userData.name}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg mt-1"
            />
          </div>
          <div>
            <label className="text-slate-400">Username</label>
            <input
              type="text"
              name="username"
              value={userData.username}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg mt-1"
            />
          </div>
          <div>
            <label className="text-slate-400">Email</label>
            <input
              type="email"
              name="email"
              value={userData.email}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg mt-1"
              disabled
            />
          </div>
          <div>
            <label className="text-slate-400">Country</label>
            <input
              type="text"
              name="country"
              value={userData.country}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg mt-1"
            />
          </div>
          <div>
            <label className="text-slate-400">Phone</label>
            <input
              type="tel"
              name="phone"
              value={userData.phone}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg mt-1"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-slate-400">Address</label>
            <input
              type="text"
              name="address"
              value={userData.address}
              onChange={handleChange}
              className="w-full p-2 border border-gray-300 rounded-lg mt-1"
            />
          </div>
        </div>
        <div className="mt-6 flex gap-4">
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Save Changes
          </button>
          <Link
            to="/profile"
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </Link>
        </div>
        {error && <p className="text-red-600 mt-2">{error}</p>}
      </div>
    </div>
  );
}