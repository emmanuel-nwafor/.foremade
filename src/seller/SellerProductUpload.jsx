import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { collection, addDoc } from 'firebase/firestore';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import SellerSidebar from './SellerSidebar';

export default function SellerProductUpload() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    sellerName: '',
    name: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    colors: [],
    sizes: [],
    condition: 'New',
    productUrl: '',
    images: [],
    tags: [],
  });
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [customColor, setCustomColor] = useState('');
  const [colorSuggestions, setColorSuggestions] = useState([]);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const categories = [
    'Tablet & Phones',
    'Health & Beauty',
    'Foremade Fashion',
    'Electronics',
    'Baby Products',
    'Computers & Accessories',
    'Game & Fun',
    'Drinks & Categories',
    'Home & Kitchen',
    'Smart Watches',
  ];
  const availableColors = [
    { name: 'Red', hex: '#ff0000' },
    { name: 'Orange', hex: '#FFA500' },
    { name: 'Blue', hex: '#0000ff' },
    { name: 'Green', hex: '#008000' },
    { name: 'Brown', hex: '#8b4513' },
    { name: 'Black', hex: '#000000' },
    { name: 'White', hex: '#ffffff' },
    { name: 'Purple', hex: '#800080' },
    { name: 'Pink', hex: '#ffc1cc' },
    { name: 'Gray', hex: '#808080' },
    { name: 'Yellow', hex: '#FFFF00' },
    { name: 'Gold', hex: '#ff9a1d' },
    { name: 'Silver', hex: '#e2f2ec' },
  ];
  const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const conditions = ['New', 'Used', 'Refurbished'];
  const authenticityTags = ['Verified', 'Original', 'Brand New', 'Authentic'];
  const MAX_IMAGES = 4;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          let sellerName = currentUser.displayName || '';
          if (sellerName && sellerName.startsWith('{')) {
            const parsed = JSON.parse(sellerName);
            sellerName = parsed.name || '';
          }
          setFormData((prev) => ({ ...prev, sellerName }));
        } catch (err) {
          console.error('Error parsing displayName:', err);
          toast.error('Failed to load seller profile');
        }
      } else {
        toast.error('Please log in to add products.');
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (files) => {
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(
      (file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );

    if (validFiles.length + imageFiles.length > MAX_IMAGES) {
      toast.error(`You can upload a maximum of ${MAX_IMAGES} images.`);
      return;
    }

    setImageFiles((prev) => [...prev, ...validFiles]);
    const previews = validFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...previews]);
    setErrors((prev) => ({ ...prev, images: '' }));

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileInputChange = (e) => {
    handleImageChange(e.target.files);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current.classList.remove('border-blue-500');
    handleImageChange(e.dataTransfer.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current.classList.add('border-blue-500');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current.classList.remove('border-blue-500');
  };

  const handleRemoveImage = (index) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
    if (imageFiles.length <= 1) {
      fileInputRef.current.value = '';
    }
  };

  const handleColorToggle = (color) => {
    setFormData((prev) => {
      const newColors = prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color];
      return { ...prev, colors: newColors };
    });
    setCustomColor('');
    setShowColorDropdown(false);
  };

  const handleColorInputChange = (e) => {
    const value = e.target.value;
    setCustomColor(value);
    if (value.trim() === '') {
      setColorSuggestions([]);
      setShowColorDropdown(false);
      return;
    }
    const filtered = availableColors.filter((color) =>
      color.name.toLowerCase().includes(value.toLowerCase())
    );
    setColorSuggestions(filtered);
    setShowColorDropdown(true);
  };

  const handleCustomColorAdd = (e) => {
    if (e.key === 'Enter' && customColor.trim()) {
      const trimmedColor = customColor.trim();
      if (trimmedColor.length > 20) {
        toast.error('Color name must be 20 characters or less.');
        return;
      }
      setFormData((prev) => {
        const newColors = prev.colors.includes(trimmedColor)
          ? prev.colors
          : [...prev.colors, trimmedColor];
        return { ...prev, colors: newColors };
      });
      setCustomColor('');
      setColorSuggestions([]);
      setShowColorDropdown(false);
    }
  };

  const handleRemoveColor = (color) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c !== color),
    }));
  };

  const handleSizeToggle = (size) => {
    setFormData((prev) => {
      const newSizes = prev.sizes.includes(size)
        ? prev.sizes.filter((s) => s !== size)
        : [...prev.sizes, size];
      return { ...prev, sizes: newSizes };
    });
  };

  const handleTagToggle = (tag) => {
    setFormData((prev) => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.sellerName.trim()) newErrors.sellerName = 'Please enter your full name.';
    if (!formData.name.trim()) newErrors.name = 'Product name is required.';
    if (!formData.price || isNaN(formData.price) || formData.price <= 0)
      newErrors.price = 'Enter a valid price greater than 0.';
    if (!formData.stock || isNaN(formData.stock) || formData.stock < 0)
      newErrors.stock = 'Enter a valid stock quantity (0 or more).';
    if (!formData.category) newErrors.category = 'Select a category.';
    if (imageFiles.length === 0) newErrors.images = 'At least one image is required.';
    if (imageFiles.length > MAX_IMAGES) newErrors.images = `Maximum ${MAX_IMAGES} images allowed.`;
    if (formData.colors.length === 0) newErrors.colors = 'Select at least one color.';
    if (formData.category.toLowerCase() === 'foremade fashion' && formData.sizes.length === 0)
      newErrors.sizes = 'Select at least one size for fashion products.';
    return newErrors;
  };

  const uploadImage = async (file, retries = 3, delay = 2000) => {
    const uploadData = new FormData();
    uploadData.append('image', file);

    for (let attempt = retries; attempt > 0; attempt--) {
      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        const response = await axios.post(`${backendUrl}/upload`, uploadData, {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 10000,
        });

        if (response.status !== 200 || !response.data.imageUrl) {
          throw new Error('Failed to upload image to Cloudinary.');
        }

        return response.data.imageUrl;
      } catch (error) {
        console.error('Image upload error:', error);
        if (attempt === 1 || error.code !== 'ERR_NETWORK') {
          throw new Error(
            error.code === 'ERR_NETWORK'
              ? 'Cannot connect to server. Ensure backend is running on port 5000.'
              : error.response?.data?.error || error.message || 'Failed to upload image.'
          );
        }
        toast.warn(`Retrying image upload (${attempt - 1} attempts left)...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    if (!user) {
      toast.error('You must be logged in to add products.');
      setLoading(false);
      navigate('/login');
      return;
    }

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      toast.error('Please fix the form errors.');
      return;
    }

    try {
      const imageUrls = await Promise.all(imageFiles.map((file) => uploadImage(file)));

      if (imageUrls.length === 0) {
        throw new Error('At least one image URL is required.');
      }

      const productData = {
        sellerName: formData.sellerName,
        name: formData.name,
        description: formData.description || '',
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        category: formData.category.toLowerCase(),
        colors: formData.colors,
        sizes: formData.sizes,
        condition: formData.condition || 'New',
        productUrl: formData.productUrl || '',
        imageUrls,
        tags: formData.tags,
        sellerId: user.uid,
        seller: { name: formData.sellerName, id: user.uid },
        createdAt: new Date().toISOString(),
        reviews: [],
      };

      const docRef = await addDoc(collection(db, 'products'), productData);
      console.log('Product saved to Firestore:', { id: docRef.id, ...productData });

      toast.success('Product uploaded successfully!');
      setFormData({
        sellerName: formData.sellerName,
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        colors: [],
        sizes: [],
        condition: 'New',
        productUrl: '',
        images: [],
        tags: [],
      });
      setImageFiles([]);
      setImagePreviews([]);
      fileInputRef.current.value = '';
      setColorSuggestions([]);
      setShowColorDropdown(false);
      // navigate('/my-products');
    } catch (error) {
      console.error('Error uploading product:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
      });
      toast.error(error.message || 'Failed to upload product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <SellerSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-start">
        <div className="w-full max-w-3xl bg-white p-6 md:p-8 rounded-lg">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
            Add a New Product
          </h2>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Image upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Images (up to {MAX_IMAGES}) <span className="text-red-500">*</span>
              </label>
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`mt-1 w-full p-4 border-2 border-dashed rounded-md flex flex-col items-center justify-center min-h-[400px] transition-colors ${
                  errors.images ? 'border-red-500' : 'border-gray-300 hover:border-blue-500'
                } ${loading ? 'opacity-50' : ''}`}
              >
                {imagePreviews.length === 0 ? (
                  <div className="text-center">
                    <i className='bx bx-cloud-upload text-9xl text-gray-600'></i>
                    <p className="text-sm text-gray-600 mt-1">
                      Drag and drop up to {MAX_IMAGES} images (desktop) or{' '}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current.click()}
                        className="text-blue-600 hover:underline"
                        disabled={loading}
                      >
                        select images
                      </button>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      (JPEG, PNG, GIF, max 5MB each, multiple images allowed)
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-full object-cover rounded-md border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600"
                          disabled={loading}
                        >
                          <i className="bx bx-x text-sm"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={loading}
                  multiple
                />
              </div>
              {errors.images && (
                <p className="text-red-600 text-xs mt-1">{errors.images}</p>
              )}
            </div>

            {/* Product Details Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Product Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Seller Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="sellerName"
                    value={formData.sellerName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.sellerName
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={loading}
                  />
                  {errors.sellerName && (
                    <p className="text-red-600 text-xs mt-1">{errors.sellerName}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter product name"
                    className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.name
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={loading}
                  />
                  {errors.name && (
                    <p className="text-red-600 text-xs mt-1">{errors.name}</p>
                  )}
                </div>
              </div>
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe your product"
                  className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                    errors.description
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  rows="4"
                  disabled={loading}
                />
                {errors.description && (
                  <p className="text-red-600 text-xs mt-1">{errors.description}</p>
                )}
              </div>
            </div>

            {/* Pricing & Stock Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Pricing & Stock</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Price (₦) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="Enter price"
                    className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.price
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={loading}
                  />
                  {errors.price && (
                    <p className="text-red-600 text-xs mt-1">{errors.price}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    placeholder="Enter stock quantity"
                    className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.stock
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={loading}
                  />
                  {errors.stock && (
                    <p className="text-red-600 text-xs mt-1">{errors.stock}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Category & Condition Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Category & Condition</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-md py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                      errors.category
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={loading}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <p className="text-red-600 text-xs mt-1">{errors.category}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Condition</label>
                  <select
                    name="condition"
                    value={formData.condition}
                    onChange={handleChange}
                    className={`mt-1 block w-full border rounded-md py-2 px-3 text-sm shadow-sm focus:outline-none focus:ring-2 ${
                      errors.condition
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={loading}
                  >
                    <option value="">Select a condition</option>
                    {conditions.map((condition) => (
                      <option key={condition} value={condition}>
                        {condition}
                      </option>
                    ))}
                  </select>
                  {errors.condition && (
                    <p className="text-red-600 text-xs mt-1">{errors.condition}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Colors Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Colors</h3>
              <label className="block text-sm font-medium text-gray-700">
                Colors <span className="text-red-500">*</span>
              </label>
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {formData.colors.map((color) => {
                  const predefinedColor = availableColors.find(
                    (c) => c.name.toLowerCase() === color.toLowerCase()
                  );
                  return (
                    <div
                      key={color}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
                    >
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: predefinedColor ? predefinedColor.hex : '#ccc' }}
                      />
                      <span>{color}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(color)}
                        className="text-red-500 hover:text-red-700"
                        disabled={loading}
                      >
                        <i className="bx bx-x"></i>
                      </button>
                    </div>
                  );
                })}
              </div>
              <div className="relative">
                <input
                  type="text"
                  value={customColor}
                  onChange={handleColorInputChange}
                  onKeyDown={handleCustomColorAdd}
                  onFocus={() => customColor.trim() && setShowColorDropdown(true)}
                  onBlur={() => setTimeout(() => setShowColorDropdown(false), 200)}
                  placeholder="Type a color and press Enter"
                  className={`w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                    errors.colors
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
                  disabled={loading}
                />
                {showColorDropdown && colorSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-40 overflow-y-auto">
                    {colorSuggestions.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onMouseDown={() => handleColorToggle(color.name)}
                        className="flex items-center w-full p-2 hover:bg-gray-100 text-sm text-gray-800"
                        disabled={loading}
                      >
                        <span
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: color.hex }}
                        />
                        {color.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.colors && (
                <p className="text-red-600 text-xs mt-1">{errors.colors}</p>
              )}
            </div>

            {/* Sizes Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Sizes</h3>
              <label className="block text-sm font-medium text-gray-700">
                Sizes {formData.category.toLowerCase() === 'foremade fashion' && <span className="text-red-500">*</span>}
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => handleSizeToggle(size)}
                    className={`px-3 py-1 rounded-md border text-sm transition-colors ${
                      formData.sizes.includes(size)
                        ? 'border-blue-500 bg-blue-100 text-blue-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading}
                  >
                    {size}
                  </button>
                ))}
              </div>
              {errors.sizes && (
                <p className="text-red-600 text-xs mt-1">{errors.sizes}</p>
              )}
            </div>

            {/* Authenticity Tags Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Authenticity Tags</h3>
              <label className="block text-sm font-medium text-gray-700">Authenticity Tags</label>
              <div className="flex flex-wrap gap-2 mt-2">
                {authenticityTags.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-md border text-sm transition-colors ${
                      formData.tags.includes(tag)
                        ? 'border-green-500 bg-green-100 text-green-700'
                        : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              {errors.tags && (
                <p className="text-red-600 text-xs mt-1">{errors.tags}</p>
              )}
            </div>

            {/* Additional Information Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Additional Information</h3>
              <div className="grid grid-cols-1 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Product URL
                  </label>
                  <input
                    type="url"
                    name="productUrl"
                    value={formData.productUrl}
                    onChange={handleChange}
                    placeholder="Enter product URL (optional)"
                    className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.productUrl
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={loading}
                  />
                  {errors.productUrl && (
                    <p className="text-red-600 text-xs mt-1">{errors.productUrl}</p>
                  )}
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={loading}
                className={`py-2 px-6 rounded-md text-white text-sm font-medium transition duration-200 shadow ${
                  loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-900 hover:bg-blue-800'
                }`}
              >
                {loading ? 'Uploading...' : 'Add Product'}
              </button>
            </div>
          </form>
        </div>
        <ToastContainer position="top-right" autoClose={5000} />
      </div>
    </div>
  );
}