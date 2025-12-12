import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, updateDoc, setDoc, collection, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import SellerSidebar from './SellerSidebar';

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
    isDailyDeal: false,
    discountPercentage: 0,
    variants: [],
  });
  const [loading, setLoading] = useState(true);
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState('');
  const [newColor, setNewColor] = useState('');
  const [newVariant, setNewVariant] = useState({ price: '', stock: 0, imageUrls: [] });
  const [pendingImages, setPendingImages] = useState([]); // For image previews
  const [pendingVideos, setPendingVideos] = useState([]); // For video previews
  const [uploadProgress, setUploadProgress] = useState({}); // Track upload status

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
            isDailyDeal: data.isDailyDeal || false,
            discountPercentage: data.discountPercentage || 0,
            variants: Array.isArray(data.variants) ? data.variants : [],
          });
        } else {
          throw new Error('Product not found or unauthorized');
        }
      } catch (err) {
        console.error('Error fetching product:', { message: err.message, code: err.code });
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
    if (product.isDailyDeal && (!product.discountPercentage || product.discountPercentage < 0 || product.discountPercentage > 100)) {
      newErrors.discountPercentage = 'Discount must be between 0 and 100%';
    }
    product.variants.forEach((variant, idx) => {
      if (!variant.price || isNaN(variant.price) || Number(variant.price) <= 0) {
        newErrors[`variantPrice${idx}`] = `Valid price for variant ${idx + 1} is required`;
      }
      if (variant.stock < 0) {
        newErrors[`variantStock${idx}`] = `Stock for variant ${idx + 1} cannot be negative`;
      }
    });
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
    const value = e.target.value.trim();
    if (value && !product.colors.includes(value)) {
      setProduct((prev) => ({ ...prev, colors: [...prev.colors, value] }));
      setNewColor('');
    }
  };

  const removeColor = (color) => {
    if (window.confirm(`Remove color ${color}?`)) {
      setProduct((prev) => ({ ...prev, colors: prev.colors.filter((c) => c !== color) }));
    }
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageDataUrl = reader.result;
        const fileId = Date.now().toString();
        setPendingImages((prev) => [...prev, { id: fileId, url: imageDataUrl }]);
        setUploadProgress((prev) => ({ ...prev, [fileId]: 'uploading' }));
        try {
          const storageRef = ref(storage, `products/${productId}/images/${fileId}`);
          await uploadString(storageRef, imageDataUrl, 'data_url');
          const url = await getDownloadURL(storageRef);
          setProduct((prev) => ({ ...prev, imageUrls: [...prev.imageUrls, url] }));
          setPendingImages((prev) => prev.filter((img) => img.id !== fileId));
          setUploadProgress((prev) => ({ ...prev, [fileId]: 'success' }));
          setTimeout(() => setUploadProgress((prev) => ({ ...prev, [fileId]: undefined })), 2000);
        } catch (err) {
          console.error('Error uploading image:', err);
          setErrors((prev) => ({ ...prev, image: 'Failed to upload image' }));
          setUploadProgress((prev) => ({ ...prev, [fileId]: 'error' }));
          setTimeout(() => setUploadProgress((prev) => ({ ...prev, [fileId]: undefined })), 2000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (url) => {
    if (window.confirm('Remove this image?')) {
      setProduct((prev) => ({ ...prev, imageUrls: prev.imageUrls.filter((u) => u !== url) }));
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const videoDataUrl = reader.result;
        const fileId = Date.now().toString();
        setPendingVideos((prev) => [...prev, { id: fileId, url: videoDataUrl }]);
        setUploadProgress((prev) => ({ ...prev, [fileId]: 'uploading' }));
        try {
          const storageRef = ref(storage, `products/${productId}/videos/${fileId}`);
          await uploadString(storageRef, videoDataUrl, 'data_url');
          const url = await getDownloadURL(storageRef);
          setProduct((prev) => ({ ...prev, videoUrls: [...prev.videoUrls, url] }));
          setPendingVideos((prev) => prev.filter((vid) => vid.id !== fileId));
          setUploadProgress((prev) => ({ ...prev, [fileId]: 'success' }));
          setTimeout(() => setUploadProgress((prev) => ({ ...prev, [fileId]: undefined })), 2000);
        } catch (err) {
          console.error('Error uploading video:', err);
          setErrors((prev) => ({ ...prev, video: 'Failed to upload video' }));
          setUploadProgress((prev) => ({ ...prev, [fileId]: 'error' }));
          setTimeout(() => setUploadProgress((prev) => ({ ...prev, [fileId]: undefined })), 2000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeVideo = (url) => {
    if (window.confirm('Remove this video?')) {
      setProduct((prev) => ({ ...prev, videoUrls: prev.videoUrls.filter((u) => u !== url) }));
    }
  };

  const handleVariantChange = (index, field, value) => {
    setProduct((prev) => {
      const updatedVariants = [...prev.variants];
      updatedVariants[index] = { ...updatedVariants[index], [field]: value };
      return { ...prev, variants: updatedVariants };
    });
  };

  const handleVariantImageUpload = async (e, index) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const imageDataUrl = reader.result;
        const fileId = Date.now().toString();
        setProduct((prev) => {
          const updatedVariants = [...prev.variants];
          updatedVariants[index] = {
            ...updatedVariants[index],
            imageUrls: [...(updatedVariants[index].imageUrls || []), { id: fileId, url: imageDataUrl }],
          };
          return { ...prev, variants: updatedVariants };
        });
        setUploadProgress((prev) => ({ ...prev, [fileId]: 'uploading' }));
        try {
          const storageRef = ref(storage, `products/${productId}/variants/${index}/images/${fileId}`);
          await uploadString(storageRef, imageDataUrl, 'data_url');
          const url = await getDownloadURL(storageRef);
          setProduct((prev) => {
            const updatedVariants = [...prev.variants];
            updatedVariants[index] = {
              ...updatedVariants[index],
              imageUrls: updatedVariants[index].imageUrls.map((img) =>
                img.id === fileId ? url : img.url
              ).filter((img) => typeof img === 'string'),
            };
            return { ...prev, variants: updatedVariants };
          });
          setUploadProgress((prev) => ({ ...prev, [fileId]: 'success' }));
          setTimeout(() => setUploadProgress((prev) => ({ ...prev, [fileId]: undefined })), 2000);
        } catch (err) {
          console.error('Error uploading variant image:', err);
          setErrors((prev) => ({ ...prev, [`variantImage${index}`]: 'Failed to upload variant image' }));
          setUploadProgress((prev) => ({ ...prev, [fileId]: 'error' }));
          setTimeout(() => setUploadProgress((prev) => ({ ...prev, [fileId]: undefined })), 2000);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeVariantImage = (index, url) => {
    if (window.confirm('Remove this variant image?')) {
      setProduct((prev) => {
        const updatedVariants = [...prev.variants];
        updatedVariants[index] = {
          ...updatedVariants[index],
          imageUrls: updatedVariants[index].imageUrls.filter((u) => u !== url),
        };
        return { ...prev, variants: updatedVariants };
      });
    }
  };

  const addVariant = () => {
    setProduct((prev) => ({
      ...prev,
      variants: [...prev.variants, { price: '', stock: 0, imageUrls: [] }],
    }));
  };

  const removeVariant = (index) => {
    if (window.confirm(`Remove variant ${index + 1}?`)) {
      setProduct((prev) => ({
        ...prev,
        variants: prev.variants.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSave = async () => {
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      const userId = auth.currentUser?.uid;
      const productRef = doc(db, 'products', productId);
      await updateDoc(productRef, {
        name: product.name,
        price: Number(product.price),
        quantity: product.quantity,
        description: product.description,
        imageUrls: product.imageUrls,
        videoUrls: product.videoUrls,
        colors: product.colors,
        variants: product.variants,
        isDailyDeal: product.isDailyDeal,
        discountPercentage: Number(product.discountPercentage),
        updatedAt: serverTimestamp(),
      });

      const adminNotificationRef = doc(collection(db, 'adminNotifications'));
      await setDoc(adminNotificationRef, {
        message: `Product "${product.name}" (ID: ${productId}) edited by seller ${userId}`,
        type: 'product_edit',
        sellerId: userId,
        productId,
        timestamp: serverTimestamp(),
        read: false,
      });

      setSuccess('Product updated successfully!');
      setTimeout(() => navigate('/sellers/products'), 2000);
    } catch (err) {
      console.error('Error saving product:', { message: err.message, code: err.code });
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
                  value={newColor}
                  onChange={(e) => setNewColor(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleColorChange(e)}
                  placeholder="Enter a color (e.g., #FF0000) and press Enter"
                  className="mt-1 w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
                />
                <div className="mt-2 flex flex-wrap gap-2">
                  {product.colors.map((color, idx) => (
                    <div key={idx} className="flex items-center">
                      <span className="inline-block w-6 h-6 rounded-full" style={{ backgroundColor: color }}></span>
                      <button
                        type="button"
                        onClick={() => removeColor(color)}
                        className="ml-1 text-red-600 hover:text-red-800"
                      >
                        <i className="bx bx-x"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative group">
                <label htmlFor="isDailyDeal" className="block text-sm font-medium text-gray-700">
                  Daily Deal
                </label>
                <input
                  type="checkbox"
                  id="isDailyDeal"
                  name="isDailyDeal"
                  checked={product.isDailyDeal}
                  onChange={handleChange}
                  className="mt-1"
                />
              </div>
              {product.isDailyDeal && (
                <div className="relative group">
                  <label htmlFor="discountPercentage" className="block text-sm font-medium text-gray-700">
                    Discount Percentage
                  </label>
                  <input
                    type="number"
                    id="discountPercentage"
                    name="discountPercentage"
                    value={product.discountPercentage}
                    onChange={handleChange}
                    className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                      errors.discountPercentage ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                    }`}
                  />
                  {errors.discountPercentage && <p className="text-red-600 text-xs mt-1">{errors.discountPercentage}</p>}
                </div>
              )}
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
                {errors.image && <p className="text-red-600 text-xs mt-1">{errors.image}</p>}
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {pendingImages.map((img) => (
                    <div key={img.id} className="relative">
                      <img src={img.url} alt="Pending" className="w-24 h-24 object-cover rounded-lg" />
                      {uploadProgress[img.id] === 'uploading' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                          <i className="bx bx-loader bx-spin text-white text-xl"></i>
                        </div>
                      )}
                      {uploadProgress[img.id] === 'success' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-75 rounded-lg">
                          <i className="bx bx-check text-white text-xl"></i>
                        </div>
                      )}
                      {uploadProgress[img.id] === 'error' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-75 rounded-lg">
                          <i className="bx bx-x text-white text-xl"></i>
                        </div>
                      )}
                    </div>
                  ))}
                  {product.imageUrls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <img src={url} alt="Product" className="w-24 h-24 object-cover rounded-lg" />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        className="absolute top-0 right-0 text-red-600 hover:text-red-800 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <i className="bx bx-x"></i>
                      </button>
                    </div>
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
                {errors.video && <p className="text-red-600 text-xs mt-1">{errors.video}</p>}
                <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {pendingVideos.map((vid) => (
                    <div key={vid.id} className="relative">
                      <video controls className="w-32 h-20 object-cover rounded-lg">
                        <source src={vid.url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      {uploadProgress[vid.id] === 'uploading' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                          <i className="bx bx-loader bx-spin text-white text-xl"></i>
                        </div>
                      )}
                      {uploadProgress[vid.id] === 'success' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-75 rounded-lg">
                          <i className="bx bx-check text-white text-xl"></i>
                        </div>
                      )}
                      {uploadProgress[vid.id] === 'error' && (
                        <div className="absolute inset-0 flex items-center justify-center bg-red-500 bg-opacity-75 rounded-lg">
                          <i className="bx bx-x text-white text-xl"></i>
                        </div>
                      )}
                    </div>
                  ))}
                  {product.videoUrls.map((url, idx) => (
                    <div key={idx} className="relative group">
                      <video controls className="w-32 h-20 object-cover rounded-lg">
                        <source src={url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                      <button
                        type="button"
                        onClick={() => removeVideo(url)}
                        className="absolute top-0 right-0 text-red-600 hover:text-red-800 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                      >
                        <i className="bx bx-x"></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Variants</label>
                <button
                  type="button"
                  onClick={addVariant}
                  className="mt-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  Add Variant
                </button>
                {product.variants.map((variant, idx) => (
                  <div key={idx} className="mt-4 p-4 border rounded-lg">
                    <h4 className="text-sm font-medium text-gray-700">Variant {idx + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Price (₦) <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={variant.price}
                          onChange={(e) => handleVariantChange(idx, 'price', Number(e.target.value))}
                          className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                            errors[`variantPrice${idx}`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {errors[`variantPrice${idx}`] && (
                          <p className="text-red-600 text-xs mt-1">{errors[`variantPrice${idx}`]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Stock <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={variant.stock}
                          onChange={(e) => handleVariantChange(idx, 'stock', Number(e.target.value))}
                          className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 ${
                            errors[`variantStock${idx}`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-blue-500'
                          }`}
                        />
                        {errors[`variantStock${idx}`] && (
                          <p className="text-red-600 text-xs mt-1">{errors[`variantStock${idx}`]}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Variant Images</label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleVariantImageUpload(e, idx)}
                          className="mt-1 w-full py-2 px-3 border rounded-lg shadow-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
                        />
                        {errors[`variantImage${idx}`] && (
                          <p className="text-red-600 text-xs mt-1">{errors[`variantImage${idx}`]}</p>
                        )}
                        <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {(variant.imageUrls || []).map((url, imgIdx) => (
                            <div key={imgIdx} className="relative group">
                              <img src={url} alt={`Variant ${idx + 1}`} className="w-24 h-24 object-cover rounded-lg" />
                              <button
                                type="button"
                                onClick={() => removeVariantImage(idx, url)}
                                className="absolute top-0 right-0 text-red-600 hover:text-red-800 bg-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
                              >
                                <i className="bx bx-x"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeVariant(idx)}
                      className="mt-2 text-red-600 hover:text-red-800"
                    >
                      Remove Variant
                    </button>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSave}
                className="w-full sm:w-auto px-6 py-3 rounded-lg bg-gray-800 text-white hover:bg-gray-700 font-bold shadow-md transition focus:outline-blue-400 focus:ring-4 focus:ring-blue-300 mt-4 sm:mt-0"
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