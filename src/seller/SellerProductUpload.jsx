import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { collection, addDoc } from 'firebase/firestore';
import axios from 'axios';
import CustomAlert, { useAlerts } from '/src/components/common/CustomAlert';
import SellerSidebar from './SellerSidebar';

// Set global Axios default timeout
axios.defaults.timeout = 60000; // 60 seconds

export default function SellerProductUpload() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('sellerProductForm');
    return savedData ? JSON.parse(savedData) : {
      sellerName: '',
      name: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      subcategory: '',
      colors: [],
      sizes: [],
      condition: 'New',
      productUrl: '',
      images: [],
      videos: [], // Changed from video: null to videos: []
      tags: [],
    };
  });
  const [imageFiles, setImageFiles] = useState(() => {
    const savedImages = localStorage.getItem('sellerProductImages');
    return savedImages ? JSON.parse(savedImages) : [];
  });
  const [imagePreviews, setImagePreviews] = useState(() => {
    const savedPreviews = localStorage.getItem('sellerProductPreviews');
    return savedPreviews ? JSON.parse(savedPreviews) : [];
  });
  const [videoFiles, setVideoFiles] = useState(() => {
    const savedVideos = localStorage.getItem('sellerProductVideos');
    return savedVideos ? JSON.parse(savedVideos) : [];
  });
  const [videoPreviews, setVideoPreviews] = useState(() => {
    const savedVideoPreviews = localStorage.getItem('sellerProductVideoPreviews');
    return savedVideoPreviews ? JSON.parse(savedVideoPreviews) : [];
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [customColor, setCustomColor] = useState('');
  const [colorSuggestions, setColorSuggestions] = useState([]);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false);
  const [fees, setFees] = useState({
    productSize: '',
    buyerProtectionFee: 0,
    handlingFee: 0,
    totalEstimatedPrice: 0,
  });
  const [isMobile, setIsMobile] = useState(false); // New state for mobile detection
  const fileInputRef = useRef(null);
  const singleImageInputRef = useRef(null); // New ref for single image input
  const videoInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const { alerts, addAlert, removeAlert } = useAlerts();

  const categories = [
    'Foremade Fashion',
    'Electronics',
    'Baby Products',
    'Computers & Accessories',
    'Game & Fun',
    'Drinks & Categories',
    'Home & Kitchen',
    'Smart Watches',
    'Tablet & Phones',
    'Health & Beauty',
  ];

  const subcategories = {
    'Foremade Fashion': {
      Men: ['Shoes', 'Clothing'],
      Women: ['Shoes', 'Clothing'],
    },
    Electronics: ['Phones', 'Laptops', 'Accessories'],
    'Baby Products': ['Clothing', 'Toys', 'Feeding'],
    'Computers & Accessories': ['Laptops', 'Peripherals', 'Storage'],
    'Game & Fun': ['Consoles', 'Board Games', 'Toys'],
    'Drinks & Categories': ['Soft Drinks', 'Alcoholic', 'Juices'],
    'Home & Kitchen': ['Appliances', 'Furniture', 'Decor'],
    'Smart Watches': ['Fitness', 'Luxury', 'Budget'],
    'Tablet & Phones': ['Tablets', 'Smartphones'],
    'Health & Beauty': ['Skincare', 'Makeup', 'Supplements'],
  };

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
  const authenticityTags = ['Verified', 'Original', 'Brand New', 'Authentic'];
  const MAX_IMAGES = 4;
  const MAX_VIDEOS = 3; // New constant for max videos
  const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_DURATION = 30; // 30 seconds

  // Detect if the user is on a mobile device
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|iphone|ipad|ipod|opera mini|mobile/i;
    setIsMobile(mobileRegex.test(userAgent));
  }, []);

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
          localStorage.setItem('sellerProductForm', JSON.stringify({ ...formData, sellerName }));
        } catch (err) {
          console.error('Error parsing displayName:', err);
          addAlert('Failed to load seller profile', 'error');
        }
      } else {
        addAlert('Please log in to add products.', 'error');
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  useEffect(() => {
    const price = parseFloat(formData.price);
    if (!price || isNaN(price)) {
      setFees({
        productSize: '',
        buyerProtectionFee: 0,
        handlingFee: 0,
        totalEstimatedPrice: 0,
      });
      return;
    }

    let productSize = '';
    let buyerProtectionRate = 0;
    let handlingRate = 0;

    if (price >= 2000 && price <= 2999) {
      productSize = 'Small';
      buyerProtectionRate = 0.01;
      handlingRate = 0.20;
    } else if (price >= 3000 && price <= 4999) {
      productSize = 'Medium';
      buyerProtectionRate = 0.015;
      handlingRate = 0.12;
    } else if (price >= 5000 && price <= 9999) {
      productSize = 'Large';
      buyerProtectionRate = 0.017;
      handlingRate = 0.39;
    } else if (price >= 10000) {
      productSize = 'X-Large';
      buyerProtectionRate = 0.019;
      handlingRate = 0.30;
    }

    const buyerProtectionFee = price * buyerProtectionRate;
    const handlingFee = price * handlingRate;
    const totalEstimatedPrice = price + buyerProtectionFee + handlingFee;

    setFees({
      productSize,
      buyerProtectionFee,
      handlingFee,
      totalEstimatedPrice,
    });
    localStorage.setItem('sellerProductForm', JSON.stringify(formData));
  }, [formData.price]);

  useEffect(() => {
    localStorage.setItem('sellerProductForm', JSON.stringify(formData));
    localStorage.setItem('sellerProductImages', JSON.stringify(imageFiles));
    localStorage.setItem('sellerProductPreviews', JSON.stringify(imagePreviews));
    localStorage.setItem('sellerProductVideos', JSON.stringify(videoFiles));
    localStorage.setItem('sellerProductVideoPreviews', JSON.stringify(videoPreviews));
  }, [formData, imageFiles, imagePreviews, videoFiles, videoPreviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleImageChange = (files, isSingleUpload = false) => {
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(
      (file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );

    const totalImages = imageFiles.length + validFiles.length;
    if (totalImages > MAX_IMAGES) {
      addAlert(`You can upload a maximum of ${MAX_IMAGES} images.`, 'error');
      return;
    }

    if (isSingleUpload && validFiles.length > 1) {
      addAlert('Please upload one image at a time.', 'error');
      return;
    }

    setImageFiles((prev) => [...prev, ...validFiles]);
    const previews = validFiles.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...previews]);
    setErrors((prev) => ({ ...prev, images: '' }));

    if (fileInputRef.current) fileInputRef.current.value = '';
    if (singleImageInputRef.current) singleImageInputRef.current.value = '';
  };

  const handleVideoChange = (e) => {
    const newFiles = Array.from(e.target.files);
    const validFiles = newFiles.filter(
      (file) => file.type.startsWith('video/') && file.size <= MAX_VIDEO_SIZE
    );

    if (videoFiles.length + validFiles.length > MAX_VIDEOS) {
      addAlert(`You can upload a maximum of ${MAX_VIDEOS} videos.`, 'error');
      return;
    }

    const validateVideo = (file) => {
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          if (video.duration > MAX_VIDEO_DURATION) {
            reject(new Error(`Video must be under ${MAX_VIDEO_DURATION} seconds.`));
          } else {
            resolve(file);
          }
        };
        video.onerror = () => reject(new Error('Error loading video metadata.'));
        video.src = URL.createObjectURL(file);
      });
    };

    Promise.all(validFiles.map((file) => validateVideo(file)))
      .then((validatedFiles) => {
        setVideoFiles((prev) => [...prev, ...validatedFiles]);
        const newPreviews = validatedFiles.map((file) => URL.createObjectURL(file));
        setVideoPreviews((prev) => [...prev, ...newPreviews]);
        setErrors((prev) => ({ ...prev, videos: '' }));
      })
      .catch((error) => {
        addAlert(error.message, 'error');
      });

    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleFileInputChange = (e) => {
    handleImageChange(e.target.files);
  };

  const handleSingleImageInputChange = (e) => {
    handleImageChange(e.target.files, true);
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
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (singleImageInputRef.current) singleImageInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = (index) => {
    setVideoFiles((prev) => prev.filter((_, i) => i !== index));
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
    if (videoFiles.length <= 1 && videoInputRef.current) {
      videoInputRef.current.value = '';
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
        addAlert('Color name must be 20 characters or less.', 'error');
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
    if (videoFiles.length > MAX_VIDEOS) newErrors.videos = `Maximum ${MAX_VIDEOS} videos allowed.`;
    if (formData.colors.length === 0) newErrors.colors = 'Select at least one color.';
    if (formData.category.toLowerCase() === 'foremade fashion' && formData.sizes.length === 0)
      newErrors.sizes = 'Select at least one size for fashion products.';
    return newErrors;
  };

  const uploadFile = async (file, isVideo = false) => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('isVideo', isVideo);

    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      console.log(`Uploading ${isVideo ? 'video' : 'image'} to ${backendUrl}/upload`);
      const response = await axios.post(`${backendUrl}/upload`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000, // 60 seconds
      });

      if (response.status !== 200 || !response.data.url) {
        throw new Error(`Failed to upload ${isVideo ? 'video' : 'image'} to Cloudinary.`);
      }

      console.log(`${isVideo ? 'Video' : 'Image'} uploaded successfully:`, response.data.url);
      return response.data.url;
    } catch (error) {
      console.error(`${isVideo ? 'Video' : 'Image'} upload error:`, {
        message: error.message,
        code: error.code,
        response: error.response?.data,
        request: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      });
      throw new Error(
        error.code === 'ECONNABORTED'
          ? 'Request timed out. Please check your network or try again later.'
          : error.code === 'ERR_NETWORK'
          ? 'Cannot connect to server. Please check your network or server status.'
          : error.response?.data?.error || `Failed to upload ${isVideo ? 'video' : 'image'}.`
      );
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLoading(true);

    if (!user) {
      addAlert('You must be logged in to add products.', 'error');
      setLoading(false);
      navigate('/login');
      return;
    }

    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setLoading(false);
      addAlert('Please fix the form errors.', 'error');
      return;
    }

    try {
      const imageUrls = await Promise.all(imageFiles.map((file) => uploadFile(file)));
      const videoUrls = videoFiles.length > 0
        ? await Promise.all(videoFiles.map((file) => uploadFile(file, true)))
        : [];

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
        subcategory: formData.subcategory || '',
        colors: formData.colors,
        sizes: formData.sizes,
        condition: formData.condition || 'New',
        productUrl: formData.productUrl || '',
        imageUrls,
        videoUrls, // Changed from videoUrl to videoUrls
        tags: formData.tags,
        sellerId: user.uid,
        seller: { name: formData.sellerName, id: user.uid },
        createdAt: new Date().toISOString(),
        reviews: [],
        buyerProtectionFee: fees.buyerProtectionFee,
        handlingFee: fees.handlingFee,
        totalEstimatedPrice: fees.totalEstimatedPrice,
      };

      const docRef = await addDoc(collection(db, 'products'), productData);
      console.log('Product saved to Firestore:', { id: docRef.id, ...productData });

      addAlert('Product uploaded successfully!', 'success');
      setFormData({
        sellerName: formData.sellerName,
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        subcategory: '',
        colors: [],
        sizes: [],
        condition: 'New',
        productUrl: '',
        images: [],
        videos: [],
        tags: [],
      });
      setImageFiles([]);
      setImagePreviews([]);
      setVideoFiles([]);
      setVideoPreviews([]);
      localStorage.removeItem('sellerProductForm');
      localStorage.removeItem('sellerProductImages');
      localStorage.removeItem('sellerProductPreviews');
      localStorage.removeItem('sellerProductVideos');
      localStorage.removeItem('sellerProductVideoPreviews');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (singleImageInputRef.current) singleImageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      setColorSuggestions([]);
      setShowColorDropdown(false);
      setShowSubcategoryDropdown(false);
      setFees({
        productSize: '',
        buyerProtectionFee: 0,
        handlingFee: 0,
        totalEstimatedPrice: 0,
      });
    } catch (error) {
      console.error('Error uploading product:', {
        message: error.message,
        stack: error.stack,
        code: error.code,
      });
      addAlert(error.message || 'Failed to upload product.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <SellerSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-start">
        <div className="w-full max-w-4xl bg-white p-6 md:p-8 rounded-lg">
          <h2 className="text-xl md:text-2xl font-semibold text-gray-800 mb-6 border-b pb-3">
            Add a New Product
          </h2>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Image Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Images (up to {MAX_IMAGES}) <span className="text-red-500">*</span>
              </label>
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`mt-1 w-full p-4 border-2 border-dashed rounded-md flex flex-col items-center justify-center min-h-[200px] transition-colors ${
                  errors.images ? 'border-red-500' : 'border-gray-300 hover:border-blue-500'
                } ${loading ? 'opacity-50' : ''}`}
              >
                {imagePreviews.length === 0 ? (
                  <div className="text-center">
                    <i className="bx bx-cloud-upload text-5xl text-gray-600"></i>
                    <p className="text-sm text-gray-600 mt-1">
                      {isMobile ? (
                        <>
                          <button
                            type="button"
                            onClick={() => singleImageInputRef.current.click()}
                            className="text-blue-600 hover:underline"
                            disabled={loading}
                          >
                            Upload one image
                          </button>
                          {' or '}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="text-blue-600 hover:underline"
                            disabled={loading}
                          >
                            select multiple images
                          </button>
                        </>
                      ) : (
                        <>
                          Drag and drop up to {MAX_IMAGES} images or{' '}
                          <button
                            type="button"
                            onClick={() => fileInputRef.current.click()}
                            className="text-blue-600 hover:underline"
                            disabled={loading}
                          >
                            select images
                          </button>
                        </>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      (JPEG, JPG, PNG, WEBP, GIF, max 5MB each)
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-32 object-cover rounded-md border border-gray-200"
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
                {/* Input for multiple images (drag-and-drop or file picker) */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={loading}
                  multiple
                />
                {/* Input for single image upload (mobile) */}
                <input
                  ref={singleImageInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleSingleImageInputChange}
                  className="hidden"
                  disabled={loading}
                />
              </div>
              {errors.images && (
                <p className="text-red-600 text-xs mt-1">{errors.images}</p>
              )}
              {/* Additional button for adding more images on mobile */}
              {isMobile && imagePreviews.length > 0 && imagePreviews.length < MAX_IMAGES && (
                <button
                  type="button"
                  onClick={() => singleImageInputRef.current.click()}
                  className="mt-2 text-blue-600 hover:underline text-sm"
                  disabled={loading}
                >
                  Add another image
                </button>
              )}
            </div>

            {/* Video Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Videos (up to {MAX_VIDEOS}, Optional)
              </label>
              <div className="mt-1 w-full p-4 border-2 border-dashed rounded-md flex flex-col items-center justify-center min-h-[200px] border-gray-300 hover:border-blue-500 transition-colors">
                {videoPreviews.length === 0 ? (
                  <div className="text-center">
                    <i className="bx bx-video-plus text-5xl text-gray-600"></i>
                    <p className="text-sm text-gray-600 mt-1">
                      Drag and drop videos or{' '}
                      <button
                        type="button"
                        onClick={() => videoInputRef.current.click()}
                        className="text-blue-600 hover:underline"
                        disabled={loading}
                      >
                        select videos
                      </button>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      (MP4, max 10MB each, under 30 seconds)
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                    {videoPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <video
                          src={preview}
                          controls
                          className="w-full h-32 object-cover rounded-md border border-gray-200"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(index)}
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
                  ref={videoInputRef}
                  type="file"
                  accept="video/mp4"
                  onChange={handleVideoChange}
                  className="hidden"
                  disabled={loading}
                  multiple
                />
              </div>
              {videoPreviews.length > 0 && videoPreviews.length < MAX_VIDEOS && (
                <button
                  type="button"
                  onClick={() => videoInputRef.current.click()}
                  className="mt-2 text-blue-600 hover:underline text-sm"
                  disabled={loading}
                >
                  Add another video
                </button>
              )}
              {errors.videos && (
                <p className="text-red-600 text-xs mt-1">{errors.videos}</p>
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

              {fees.productSize && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Foremade Fees</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Product Size: <span className="font-semibold">{fees.productSize}</span></p>
                    <p>Buyer Protection Fee: ₦{fees.buyerProtectionFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                    <p>Handling Fee: ₦{fees.handlingFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                    <p className="font-bold">
                      Total Estimated Price: ₦{fees.totalEstimatedPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Note: If shipping internationally (e.g., to the UK), you can add shipping costs.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Category & Subcategory Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Category & Subcategory</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative mt-1">
                    <button
                      type="button"
                      onClick={() => setShowSubcategoryDropdown(!showSubcategoryDropdown)}
                      className="w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500 bg-white flex justify-between items-center"
                      disabled={loading}
                    >
                      <span>{formData.category || 'Select a category'}</span>
                      <i className="bx bx-chevron-down text-gray-500"></i>
                    </button>
                    {showSubcategoryDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                        {categories.map((cat) => (
                          <div key={cat} className="p-2 hover:bg-gray-100">
                            <button
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, category: cat, subcategory: '' }));
                                setShowSubcategoryDropdown(false);
                              }}
                              className="w-full text-left"
                            >
                              {cat}
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.category && (
                    <p className="text-red-600 text-xs mt-1">{errors.category}</p>
                  )}
                </div>
                {formData.category && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Subcategory <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <button
                        type="button"
                        onClick={() => setShowSubcategoryDropdown(!showSubcategoryDropdown)}
                        className="w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500 bg-white flex justify-between items-center"
                        disabled={loading}
                      >
                        <span>{formData.subcategory || 'Select a subcategory'}</span>
                        <i className="bx bx-chevron-down text-gray-500"></i>
                      </button>
                      {showSubcategoryDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                          {Array.isArray(subcategories[formData.category]) ? (
                            subcategories[formData.category].map((subcat) => (
                              <div key={subcat} className="p-2 hover:bg-gray-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, subcategory: subcat }));
                                    setShowSubcategoryDropdown(false);
                                  }}
                                  className="w-full text-left"
                                >
                                  {subcat}
                                </button>
                              </div>
                            ))
                          ) : (
                            Object.entries(subcategories[formData.category]).map(([group, subcats]) => (
                              <div key={group}>
                                <div className="p-2 font-medium text-gray-700">{group}</div>
                                {subcats.map((subcat) => (
                                  <div key={subcat} className="p-2 pl-4 hover:bg-gray-100">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setFormData((prev) => ({ ...prev, subcategory: subcat }));
                                        setShowSubcategoryDropdown(false);
                                      }}
                                      className="w-full text-left"
                                    >
                                      {subcat}
                                    </button>
                                  </div>
                                ))}
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {errors.subcategory && (
                      <p className="text-red-600 text-xs mt-1">{errors.subcategory}</p>
                    )}
                  </div>
                )}
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
        <CustomAlert alerts={alerts} removeAlert={removeAlert} />
      </div>
    </div>
  );
}