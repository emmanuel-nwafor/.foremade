import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import SellerSidebar from './SellerSidebar';
import SellerLocationForm from './SellerLocationForm';

export default function SellerEditProduct() {
  const { productId } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState({
    name: '',
    price: '',
    quantity: 0,
    description: '',
    imageUrls: [],
    videoUrls: [],
    colors: [],
    status: 'pending',
    locationData: { country: '', state: '', city: '', address: '' },
    isDailyDeal: false,
    discountPercentage: 0,
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [newImage, setNewImage] = useState('');
  const [newVideo, setNewVideo] = useState('');

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const userId = auth.currentUser?.uid;
        if (!userId) throw new Error('User not authenticated');
        const productRef = doc(db, 'products', productId);
        const docSnap = await getDoc(productRef);
        if (docSnap.exists() && docSnap.data().sellerId === userId) {
          const data = docSnap.data();
          setProduct({
            name: data.name || '',
            price: data.price || '',
            quantity: data.quantity || 0,
            description: data.description || '',
            imageUrls: Array.isArray(data.imageUrls) ? data.imageUrls : [],
            videoUrls: Array.isArray(data.videoUrls) ? data.videoUrls : [],
            colors: Array.isArray(data.colors) ? data.colors : [],
            status: data.status || 'pending',
            locationData: data.locationData || { country: '', state: '', city: '', address: '' },
            isDailyDeal: data.isDailyDeal || false,
            discountPercentage: data.discountPercentage || 0,
          });
        } else {
          throw new Error('Product not found or unauthorized');
        }
      } catch (err) {
        setErrors({ general: err.message });
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [productId]);

  const validateForm = () => {
    const newErrors = {};
    if (!product.name.trim()) newErrors.name = 'Product name is required';
    if (!product.price || isNaN(product.price) || Number(product.price) <= 0) newErrors.price = 'Valid price is required';
    if (product.quantity < 0) newErrors.quantity = 'Quantity cannot be negative';
    if (!product.locationData.country) newErrors.country = 'Country is required';
    if (!product.locationData.state) newErrors.state = 'State is required';
    if (product.isDailyDeal && (!product.discountPercentage || product.discountPercentage < 0 || product.discountPercentage > 100)) {
      newErrors.discountPercentage = 'Discount must be between 0 and 100%';
    }
    return newErrors;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setProduct((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleQuantityChange = (e) => {
    const value = Number(e.target.value);
    setProduct((prev) => ({ ...prev, quantity: value >= 0 ? value : 0 }));
  };

  const handleColorChange = (e) => {
    const value = e.target.value;
    setProduct((prev) => ({
      ...prev,
      colors: value ? [...new Set([...prev.colors, value])] : prev.colors,
    }));
  };

  const handleLocationChange = (newLocation) => {
    console.log('SellerEditProduct handleLocationChange:', newLocation);
    setProduct((prev) => ({ ...prev, locationData: newLocation }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageDataUrl = reader.result;
        const storageRef = ref(storage, `products/${productId}/images/${Date.now()}`);
        await uploadString(storageRef, imageDataUrl, 'data_url');
        const url = await getDownloadURL(storageRef);
        setProduct((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const videoDataUrl = reader.result;
        const storageRef = ref(storage, `products/${productId}/videos/${Date.now()}`);
        await uploadString(storageRef, videoDataUrl, 'data_url');
        const url = await getDownloadURL(storageRef);
        setProduct((prev) => ({ ...prev, videoUrls: [...prev.videoUrls, url] }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async () => {
    const newErrors = validateForm();
    console.log('handleSave called. Product:', product);
    if (Object.keys(newErrors).length > 0) {
      console.log('Validation errors:', newErrors);
      setErrors(newErrors);
      return;
    }

    try {
      const userId = auth.currentUser?.uid;
      console.log('User ID:', userId);
      const productRef = doc(db, 'products', productId);
      console.log('Updating productRef:', productRef.path);
      await updateDoc(productRef, {
        ...product,
        price: Number(product.price), // Ensure price is a number
        sellerId: userId, // Always include sellerId
        updatedAt: serverTimestamp(),
      });
      console.log('Product updated in Firestore');

      const adminNotificationRef = doc(collection(db, 'adminNotifications'));
      await setDoc(adminNotificationRef, {
        message: `Product "${product.name}" (ID: ${productId}) edited by seller ${userId}`,
        type: 'product_edit',
        sellerId: userId,
        productId,
        timestamp: serverTimestamp(),
        read: false,
      });
      console.log('Admin notification sent');

      setSuccess('Product updated successfully!');
      setTimeout(() => navigate('/seller/products'), 2000);
    } catch (err) {
      console.error('Error in handleSave:', err);
      setErrors({ general: 'Failed to save product: ' + err.message });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <SellerSidebar />
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
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-50">
      <SellerSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-4 flex justify-center items-start mb-14">
        <div className="w-full max-w-7xl bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-gray-800 mb-6 flex items-center">
            <i className="bx bx-edit-alt text-blue-500 mr-2"></i> Edit Product
          </h1>
          {errors.general && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg mb-6">
              <p className="text-red-700">{errors.general}</p>
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-lg mb-6">
              <p className="text-green-700">{success}</p>
            </div>
          )}
          <form className="space-y-6 sm:space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="relative group">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Product Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={product.name}
                  onChange={handleChange}
                  className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                    errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.name && <p className="text-red-600 text-xs mt-1">{errors.name}</p>}
              </div>
              <div className="relative group">
                <label htmlFor="price" className="block text-sm font-medium text-gray-700">
                  Price (₦) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={product.price}
                  onChange={handleChange}
                  className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                    errors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.price && <p className="text-red-600 text-xs mt-1">{errors.price}</p>}
              </div>
              <div className="relative group">
                <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
                  Quantity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  value={product.quantity}
                  onChange={handleQuantityChange}
                  className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                    errors.quantity ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                  }`}
                />
                {errors.quantity && <p className="text-red-600 text-xs mt-1">{errors.quantity}</p>}
              </div>
              <div className="relative group">
                <label htmlFor="colors" className="block text-sm font-medium text-gray-700">
                  Colors
                </label>
                <input
                  type="text"
                  id="colors"
                  name="colors"
                  value=""
                  onChange={handleColorChange}
                  placeholder="Enter a color (e.g., #FF0000)"
                  className="mt-1 w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.colors.map((color, idx) => (
                    <span key={idx} className="inline-block w-6 h-6 rounded-full" style={{ backgroundColor: color }}></span>
                  ))}
                </div>
              </div>
            </div>
            <div className="relative group">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={product.description}
                onChange={handleChange}
                className="mt-1 w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
                rows="4"
              />
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Images</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="mt-1 w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.imageUrls.map((url, idx) => (
                    <img key={idx} src={url} alt="Product" className="w-20 h-20 object-cover rounded-lg" />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Videos</label>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleVideoUpload}
                  className="mt-1 w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.videoUrls.map((url, idx) => (
                    <video key={idx} controls className="w-40 h-30 object-cover rounded-lg">
                      <source src={url} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ))}
                </div>
              </div>
            </div>
            <SellerLocationForm
              locationData={product.locationData}
              setLocationData={handleLocationChange}
              errors={errors}
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-gray-800 text-white hover:bg-gray-700 font-bold shadow-md hover:from-blue-700 hover:to-purple-700 transition focus:outline-blue-400 focus:ring-4 focus:ring-blue-300 mt-4 sm:mt-0"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}