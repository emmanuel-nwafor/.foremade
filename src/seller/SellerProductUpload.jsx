import { useState, useEffect, useRef, createRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { collection, addDoc, getDoc, doc, onSnapshot } from 'firebase/firestore';
import axios from 'axios';
import { marked } from 'marked';
import SellerSidebar from './SellerSidebar';
import SellerLocationForm from './SellerLocationForm';
import SellerProductUploadPopup from './SellerProductUploadPopup';

// Set global Axios timeout
axios.defaults.timeout = 60000; // 60 seconds

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

export default function SellerProductUpload() {
  const navigate = useNavigate();
  const { alerts, addAlert, removeAlert } = useAlerts();

  // State for form data (persisted in localStorage)
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('sellerProductForm');
    let initialData = {
      sellerName: '',
      name: '',
      description: '',
      category: '',
      subcategory: '',
      subSubcategory: '',
      colors: [],
      sizes: [],
      condition: 'New',
      productUrl: '',
      images: [],
      videos: [],
      tags: [],
      manualSize: '',
      variants: [{ color: '', size: '', price: '', stock: '', images: [] }],
    };

    if (savedData) {
      try {
        const parsedData = JSON.parse(savedData);
        initialData = {
          ...initialData,
          ...parsedData,
          variants: Array.isArray(parsedData.variants)
            ? parsedData.variants
            : initialData.variants,
        };
      } catch (error) {
        console.error('Error parsing saved form data:', error);
        addAlert('Failed to load saved form data. Starting fresh.', 'error');
      }
    }

    return initialData;
  });

  // State for location data
  const [locationData, setLocationData] = useState(() => {
    const savedLocation = localStorage.getItem('sellerLocationForm');
    return savedLocation ? JSON.parse(savedLocation) : {
      country: '',
      state: '',
      city: '',
      address: '',
    };
  });

  // State for location errors
  const [locationErrors, setLocationErrors] = useState({});

  // State for popup visibility
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // State for media files and previews
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

  // State for variant-specific image files and previews
  const [variantImageFiles, setVariantImageFiles] = useState(() => {
    const savedVariantImages = localStorage.getItem('sellerVariantImages');
    return savedVariantImages ? JSON.parse(savedVariantImages) : formData.variants.map(() => []);
  });
  const [variantImagePreviews, setVariantImagePreviews] = useState(() => {
    const savedVariantPreviews = localStorage.getItem('sellerVariantPreviews');
    return savedVariantPreviews ? JSON.parse(savedVariantPreviews) : formData.variants.map(() => []);
  });

  // Other states
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [user, setUser] = useState(null);
  const [customColor, setCustomColor] = useState('');
  const [colorSuggestions, setColorSuggestions] = useState([]);
  const [showColorDropdown, setShowColorDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSubcategoryDropdown, setShowSubcategoryDropdown] = useState(false);
  const [showSubSubcategoryDropdown, setShowSubSubcategoryDropdown] = useState(false);
  const [showSizeWarning, setShowSizeWarning] = useState(false);
  const [fees, setFees] = useState({
    productSize: '',
    buyerProtectionFee: 0,
    handlingFee: 0,
    totalEstimatedPrice: 0,
    sellerEarnings: 0,
  });
  const [isMobile, setIsMobile] = useState(false);
  const [categories, setCategories] = useState([]);
  const [customSubcategories, setCustomSubcategories] = useState({});
  const [customSubSubcategories, setCustomSubSubcategories] = useState({});
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [zoomedMedia, setZoomedMedia] = useState(null);
  const [feeConfig, setFeeConfig] = useState(null);
  const [descriptionPreview, setDescriptionPreview] = useState('');

  // Refs for file inputs
  const fileInputRef = useRef(null);
  const singleImageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const descriptionRef = useRef(null);
  const variantImageInputRefs = useRef([]);

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

  const menClothingSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const womenClothingSizes = ['3', '4', '6', '8', '10', '12', '14', '16', '18', '20'];
  const footwearSizes = [
    '3"', '5"', '5.5"', '6"', '6.5"', '7"', '7.5"',
    '8"', '8.5"', '9"', '9.5"', '10"', '10.5"', '11"', '11.5"', '12"', '12.5"'
  ];
  const perfumeSizes = ['30ml', '50ml', '60ml', '75ml', '100ml'];
  const manualSizes = ['Small', 'Medium', 'Large', 'X-Large'];
  const authenticityTags = ['Verified', 'Original', 'Brand New', 'Authentic'];
  const MAX_IMAGES = 8;
  const MAX_VIDEOS = 1;
  const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_DURATION = 30; // 30 seconds
  const MAX_VARIANT_IMAGES = 4;

  // Persist location data to localStorage
  useEffect(() => {
    localStorage.setItem('sellerLocationForm', JSON.stringify(locationData));
  }, [locationData]);

  // Persist variant image files and previews to localStorage
  useEffect(() => {
    localStorage.setItem('sellerVariantImages', JSON.stringify(variantImageFiles));
    localStorage.setItem('sellerVariantPreviews', JSON.stringify(variantImagePreviews));
  }, [variantImageFiles, variantImagePreviews]);

  // Sync variant image input refs with variants
  useEffect(() => {
    variantImageInputRefs.current = formData.variants.map((_, i) =>
      variantImageInputRefs.current[i] || createRef()
    );
  }, [formData.variants.length]);

  // Fetch categories, subcategories, sub-subcategories, and fees from Firestore
  useEffect(() => {
    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const categoryList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategories(categoryList.map((cat) => cat.name));
      if (formData.category && !categoryList.some((cat) => cat.name === formData.category)) {
        setFormData((prev) => ({ ...prev, category: '', subcategory: '', subSubcategory: '', sizes: [], variants: [{ color: '', size: '', price: '', stock: '', images: [] }] }));
        addAlert('Selected category was removed by admin.', 'error');
      }
    }, (error) => {
      console.error('Error fetching categories:', error);
      addAlert('Failed to load categories.', 'error');
    });

    const unsubscribeSubcategories = onSnapshot(collection(db, 'customSubcategories'), (snapshot) => {
      const subcatData = {};
      snapshot.forEach((doc) => {
        subcatData[doc.id] = doc.data().subcategories || [];
      });
      setCustomSubcategories(subcatData);
      if (formData.category && formData.subcategory && !subcatData[formData.category]?.includes(formData.subcategory)) {
        setFormData((prev) => ({ ...prev, subcategory: '', subSubcategory: '', sizes: [], variants: [{ color: '', size: '', price: '', stock: '', images: [] }] }));
        addAlert('Selected subcategory was removed by admin.', 'error');
      }
    }, (error) => {
      console.error('Error fetching subcategories:', error);
      addAlert('Failed to load subcategories.', 'error');
    });

    const unsubscribeSubSubcategories = onSnapshot(collection(db, 'customSubSubcategories'), (snapshot) => {
      const subSubcatData = {};
      snapshot.forEach((doc) => {
        const category = doc.id;
        const subSubcats = doc.data();
        subSubcatData[category] = {};
        Object.entries(subSubcats).forEach(([subcat, subSubcatList]) => {
          subSubcatData[category][subcat] = Array.isArray(subSubcatList) ? subSubcatList : [];
        });
      });
      setCustomSubSubcategories(subSubcatData);
      if (
        formData.category &&
        formData.subcategory &&
        formData.subSubcategory &&
        !subSubcatData[formData.category]?.[formData.subcategory]?.includes(formData.subSubcategory)
      ) {
        setFormData((prev) => ({ ...prev, subSubcategory: '', sizes: [], variants: [{ color: '', size: '', price: '', stock: '', images: [] }] }));
        addAlert('Selected sub-subcategory was removed by admin.', 'error');
      }
    }, (error) => {
      console.error('Error fetching sub-subcategories:', error);
      addAlert('Failed to load sub-subcategories.', 'error');
    });

    const fetchFeeConfig = async () => {
      try {
        const docRef = doc(db, 'feeConfigurations', 'categoryFees');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFeeConfig(docSnap.data());
        } else {
          addAlert('No fee configurations found.', 'error');
        }
      } catch (err) {
        console.error('Error fetching fee configurations:', err);
        addAlert('Failed to load fee configurations.', 'error');
      }
    };
    fetchFeeConfig();

    return () => {
      unsubscribeCategories();
      unsubscribeSubcategories();
      unsubscribeSubSubcategories();
    };
  }, [formData.category, formData.subcategory, formData.subSubcategory, addAlert]);

  // Handle user authentication
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
          addAlert('Failed to load seller profile.', 'error');
        }
      } else {
        addAlert('Please log in to add products.', 'error');
        navigate('/login');
      }
    });
    return () => unsubscribe();
  }, [navigate, addAlert]);

  // Calculate fees based on variant prices
  useEffect(() => {
    if (!feeConfig || !formData.category || !formData.variants || formData.variants.length === 0) {
      setFees({
        productSize: '',
        buyerProtectionFee: 0,
        handlingFee: 0,
        totalEstimatedPrice: 0,
        sellerEarnings: 0,
      });
      return;
    }

    // Use the minimum variant price for fee calculations to align with typical e-commerce practices
    const validPrices = formData.variants
      .map((variant) => parseFloat(variant.price))
      .filter((price) => !isNaN(price) && price > 0);
    
    if (validPrices.length === 0) {
      setFees({
        productSize: formData.category,
        buyerProtectionFee: 0,
        handlingFee: 0,
        totalEstimatedPrice: 0,
        sellerEarnings: 0,
      });
      return;
    }

    const price = Math.min(...validPrices); // Use minimum price for consistency
    const config = feeConfig[formData.category] || {
      minPrice: 1000,
      maxPrice: Infinity,
      buyerProtectionRate: 0.08,
      handlingRate: 0.20,
    };

    if (price < config.minPrice) {
      setShowSizeWarning(true);
    } else {
      setShowSizeWarning(false);
    }

    const buyerProtectionFee = price * config.buyerProtectionRate;
    const handlingFee = price * config.handlingRate;
    const totalEstimatedPrice = price + buyerProtectionFee + handlingFee;
    const sellerEarnings = price; // Seller earns the base price

    setFees({
      productSize: formData.category,
      buyerProtectionFee,
      handlingFee,
      totalEstimatedPrice,
      sellerEarnings,
    });
  }, [formData.variants, formData.category, feeConfig]);

  // Persist form data and media to localStorage
  useEffect(() => {
    localStorage.setItem('sellerProductForm', JSON.stringify(formData));
    localStorage.setItem('sellerProductImages', JSON.stringify(imageFiles));
    localStorage.setItem('sellerProductPreviews', JSON.stringify(imagePreviews));
    localStorage.setItem('sellerProductVideos', JSON.stringify(videoFiles));
    localStorage.setItem('sellerProductVideoPreviews', JSON.stringify(videoPreviews));
  }, [formData, imageFiles, imagePreviews, videoFiles, videoPreviews]);

  // Update description preview
  useEffect(() => {
    setDescriptionPreview(marked(formData.description || '', { gfm: true, breaks: true }));
  }, [formData.description]);

  // Suggest tags based on product details
  useEffect(() => {
    const suggestTags = () => {
      const text = `${formData.name} ${formData.description} ${formData.subSubcategory}`.toLowerCase();
      const possibleTags = [];
      if (text.includes('leather')) possibleTags.push('Leather');
      if (text.includes('shoe') || text.includes('footwear')) possibleTags.push('Footwear');
      if (text.includes('phone') || text.includes('mobile')) possibleTags.push('Smartphone');
      if (text.includes('fashion')) possibleTags.push('Fashion');
      if (text.includes('vintage')) possibleTags.push('Vintage');
      if (text.includes('smart')) possibleTags.push('Smart');
      setSuggestedTags(possibleTags.filter((tag) => !formData.tags.includes(tag)));
    };
    suggestTags();
  }, [formData.name, formData.description, formData.subSubcategory]);

  // Detect mobile device
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|iphone|ipad|ipod|opera mini|mobile/i;
    setIsMobile(mobileRegex.test(userAgent));
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'category' ? { subcategory: '', subSubcategory: '', sizes: [], variants: [{ color: '', size: '', price: '', stock: '', images: [] }] } : {}),
      ...(name === 'subcategory' ? { subSubcategory: '', sizes: [], variants: [{ color: '', size: '', price: '', stock: '', images: [] }] } : {}),
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleVariantChange = (index, field, value) => {
    setFormData((prev) => {
      const newVariants = [...prev.variants];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return { ...prev, variants: newVariants };
    });
    setErrors((prev) => ({ ...prev, [`variant${index}_${field}`]: '' }));
  };

  const handleAddVariant = () => {
    setFormData((prev) => ({
      ...prev,
      variants: [...prev.variants, { color: '', size: '', price: '', stock: '', images: [] }],
    }));
    setVariantImageFiles((prev) => [...prev, []]);
    setVariantImagePreviews((prev) => [...prev, []]);
  };

  const handleRemoveVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
    setVariantImageFiles((prev) => prev.filter((_, i) => i !== index));
    setVariantImagePreviews((prev) => prev.filter((_, i) => i !== index));
    setErrors((prev) => {
      const newErrors = { ...prev };
      Object.keys(newErrors).forEach((key) => {
        if (key.startsWith(`variant${index}_`)) {
          delete newErrors[key];
        }
      });
      return newErrors;
    });
  };

  const handleVariantImageChange = (index, files) => {
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(
      (file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );
    const totalImages = variantImageFiles[index]?.length + validFiles.length;
    if (totalImages > MAX_VARIANT_IMAGES) {
      addAlert(`You can upload a maximum of ${MAX_VARIANT_IMAGES} images per variant.`, 'error');
      return;
    }
    setVariantImageFiles((prev) => {
      const newFilesArray = [...prev];
      newFilesArray[index] = [...(newFilesArray[index] || []), ...validFiles];
      return newFilesArray;
    });
    setVariantImagePreviews((prev) => {
      const newPreviews = [...prev];
      const previews = validFiles.map((file) => URL.createObjectURL(file));
      newPreviews[index] = [...(newPreviews[index] || []), ...previews];
      return newPreviews;
    });
    setFormData((prev) => {
      const newVariants = [...prev.variants];
      newVariants[index] = {
        ...newVariants[index],
        images: [...(newVariants[index].images || []), ...validFiles],
      };
      return { ...prev, variants: newVariants };
    });
    setErrors((prev) => ({ ...prev, [`variant${index}_images`]: '' }));
    if (variantImageInputRefs.current[index]?.current) {
      variantImageInputRefs.current[index].current.value = '';
    }
  };

  const handleRemoveVariantImage = (variantIndex, imageIndex) => {
    setVariantImageFiles((prev) => {
      const newFiles = [...prev];
      newFiles[variantIndex] = newFiles[variantIndex].filter((_, i) => i !== imageIndex);
      return newFiles;
    });
    setVariantImagePreviews((prev) => {
      const newPreviews = [...prev];
      newPreviews[variantIndex] = newPreviews[variantIndex].filter((_, i) => i !== imageIndex);
      return newPreviews;
    });
    setFormData((prev) => {
      const newVariants = [...prev.variants];
      newVariants[variantIndex] = {
        ...newVariants[variantIndex],
        images: newVariants[variantIndex].images.filter((_, i) => i !== imageIndex),
      };
      return { ...prev, variants: newVariants };
    });
    if (variantImageFiles[variantIndex].length <= 1 && variantImageInputRefs.current[variantIndex]?.current) {
      variantImageInputRefs.current[variantIndex].current.value = '';
    }
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
    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...validFiles],
    }));
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
      addAlert(`You can upload a maximum of ${MAX_VIDEOS} video.`, 'error');
      return;
    }
    const validateVideo = (file) => {
      return new Promise((resolve, reject) => {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          if (video.duration > MAX_VIDEO_DURATION) {
            reject(new Error(`Video must be under ${MAX_VIDEO_DURATION} seconds.`));
          }
          const audioTracks = video.audioTracks || [];
          if (audioTracks.length > 0) {
            reject(new Error('Please upload a video without audio.'));
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
        setFormData((prev) => ({
          ...prev,
          videos: [...prev.videos, ...validatedFiles],
        }));
        setErrors((prev) => ({ ...prev, videos: '' }));
      })
      .catch((error) => {
        addAlert(error.message, 'error');
      });
    if (videoInputRef.current) videoInputRef.current.value = '';
  };

  const handleFileInputChange = (e) => handleImageChange(e.target.files);
  const handleSingleImageInputChange = (e) => handleImageChange(e.target.files, true);

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
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
    if (imageFiles.length <= 1) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (singleImageInputRef.current) singleImageInputRef.current.value = '';
    }
  };

  const handleRemoveVideo = (index) => {
    setVideoFiles((prev) => prev.filter((_, i) => i !== index));
    setVideoPreviews((prev) => prev.filter((_, i) => i !== index));
    setFormData((prev) => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index),
    }));
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

  const handleCustomSizeAdd = (e) => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      const size = e.target.value.trim();
      setFormData((prev) => {
        const newSizes = prev.sizes.includes(size)
          ? prev.sizes
          : [...prev.sizes, size];
        return { ...prev, sizes: newSizes };
      });
      e.target.value = '';
    }
  };

  const handleRemoveSize = (size) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((s) => s !== size),
    }));
  };

  const handleTagToggle = (tag) => {
    setFormData((prev) => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
  };

  // Text formatter functions
  const applyFormatting = (style) => {
    const textarea = descriptionRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = formData.description.substring(start, end);
    let newText = formData.description;
    let newSelectionStart = start;
    let newSelectionEnd = end;

    if (style === 'bold') {
      if (selectedText) {
        newText = newText.substring(0, start) + `**${selectedText}**` + newText.substring(end);
        newSelectionStart = start + 2;
        newSelectionEnd = end + 2;
      } else {
        newText = newText.substring(0, start) + `****` + newText.substring(start);
        newSelectionStart = start + 2;
        newSelectionEnd = start + 2;
      }
    } else if (style === 'italic') {
      if (selectedText) {
        newText = newText.substring(0, start) + `*${selectedText}*` + newText.substring(end);
        newSelectionStart = start + 1;
        newSelectionEnd = end + 1;
      } else {
        newText = newText.substring(0, start) + `**` + newText.substring(start);
        newSelectionStart = start + 1;
        newSelectionEnd = start + 1;
      }
    } else if (style === 'code') {
      if (selectedText) {
        newText = newText.substring(0, start) + `\`${selectedText}\`` + newText.substring(end);
        newSelectionStart = start + 1;
        newSelectionEnd = end + 1;
      } else {
        newText = newText.substring(0, start) + '``' + newText.substring(start);
        newSelectionStart = start + 1;
        newSelectionEnd = start + 1;
      }
    }

    setFormData((prev) => ({ ...prev, description: newText }));
    setTimeout(() => {
      textarea.selectionStart = newSelectionStart;
      textarea.selectionEnd = newSelectionEnd;
      textarea.focus();
    }, 0);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.sellerName.trim()) newErrors.sellerName = 'Please enter your full name.';
    if (!formData.name.trim()) newErrors.name = 'Product name is required.';
    if (!formData.category || !categories.includes(formData.category))
      newErrors.category = 'Select a valid category.';
    if (!formData.subcategory || !customSubcategories[formData.category]?.includes(formData.subcategory))
      newErrors.subcategory = 'Select a valid subcategory.';
    if (
      customSubSubcategories[formData.category]?.[formData.subcategory]?.length > 0 &&
      !formData.subSubcategory
    )
      newErrors.subSubcategory = 'Select a sub-subcategory.';
    if (imageFiles.length === 0) newErrors.images = 'At least one image is required.';
    if (imageFiles.length > MAX_IMAGES) newErrors.images = `Maximum ${MAX_IMAGES} images allowed.`;
    if (videoFiles.length > MAX_VIDEOS) newErrors.videos = `Maximum ${MAX_VIDEOS} video allowed.`;
    if (formData.colors.length === 0) newErrors.colors = 'Select at least one color.';
    if (
      formData.category === 'Clothing' &&
      formData.subcategory &&
      formData.sizes.length === 0
    ) {
      newErrors.sizes = 'Select or enter at least one size for clothing products.';
    }
    if (
      formData.category === 'Footwear' &&
      formData.subcategory &&
      formData.sizes.length === 0
    ) {
      newErrors.sizes = 'Select or enter at least one size for footwear products.';
    }
    if (
      formData.category === 'Perfumes' &&
      formData.subcategory &&
      formData.sizes.length === 0
    ) {
      newErrors.sizes = 'Select or enter at least one size for perfume products.';
    }
    if (!formData.manualSize) newErrors.manualSize = 'Please select a product size.';

    // Validate variants
    formData.variants.forEach((variant, index) => {
      if (!variant.color) newErrors[`variant${index}_color`] = 'Color is required.';
      if (!variant.size) newErrors[`variant${index}_size`] = 'Size is required.';
      if (!variant.price || isNaN(variant.price) || parseFloat(variant.price) <= 0)
        newErrors[`variant${index}_price`] = 'Enter a valid price greater than 0.';
      if (!variant.stock || isNaN(variant.stock) || parseInt(variant.stock, 10) < 0)
        newErrors[`variant${index}_stock`] = 'Enter a valid stock quantity (0 or more).';
      if (variant.images.length === 0)
        newErrors[`variant${index}_images`] = 'At least one image is required for each variant.';
      if (variant.images.length > MAX_VARIANT_IMAGES)
        newErrors[`variant${index}_images`] = `Maximum ${MAX_VARIANT_IMAGES} images allowed per variant.`;
    });

    return newErrors;
  };

  const validateLocationForm = () => {
    const newLocationErrors = {};
    if (!locationData.country.trim()) newLocationErrors.country = 'Country is required.';
    if (!locationData.state.trim()) newLocationErrors.state = 'State is required.';
    return newLocationErrors;
  };

  const uploadFile = async (file, isVideo = false) => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('isVideo', isVideo);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/upload`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });
      if (response.status !== 200 || !response.data.url) {
        throw new Error(`Failed to upload ${isVideo ? 'video' : 'image'} to Cloudinary.`);
      }
      return response.data.url;
    } catch (error) {
      console.error(`${isVideo ? 'Video' : 'Image'} upload error:`, {
        message: error.message,
        code: error.code,
        response: error.response?.data,
      });
      throw new Error(
        error.code === 'ECONNABORTED'
          ? 'Request timed out. Please check your network or try again later.'
          : error.code === 'ERR_NETWORK'
          ? 'Cannot connect to server. Please check your network or server status.'
          : error.response?.data?.error || `Failed to upload ${isVideo ? 'video' : 'image'}.`
      );
    } finally {
      setUploadProgress(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setLocationErrors({});
    setLoading(true);
    if (!user) {
      addAlert('You must be logged in to add products.', 'error');
      setLoading(false);
      navigate('/login');
      return;
    }
    const newErrors = validateForm();
    const newLocationErrors = validateLocationForm();
    if (Object.keys(newErrors).length > 0 || Object.keys(newLocationErrors).length > 0) {
      setErrors(newErrors);
      setLocationErrors(newLocationErrors);
      setLoading(false);
      addAlert('Please fix the form errors.', 'error');
      return;
    }
    try {
      const imageUrls = await Promise.all(imageFiles.map((file) => uploadFile(file)));
      const videoUrls = videoFiles.length > 0
        ? await Promise.all(videoFiles.map((file) => uploadFile(file, true)))
        : [];
      const variantImageUrls = await Promise.all(
        formData.variants.map((variant, index) =>
          Promise.all(variant.images.map((file) => uploadFile(file)))
        )
      );
      if (imageUrls.length === 0) {
        throw new Error('At least one image URL is required.');
      }
      const productData = {
        sellerName: formData.sellerName,
        name: formData.name,
        description: formData.description || '',
        category: formData.category.toLowerCase(),
        subcategory: formData.subcategory || '',
        subSubcategory: formData.subSubcategory || '',
        colors: formData.colors,
        sizes: formData.sizes,
        condition: formData.condition || 'New',
        productUrl: formData.productUrl || '',
        imageUrls,
        videoUrls,
        tags: formData.tags,
        sellerId: user.uid,
        seller: { name: formData.sellerName, id: user.uid },
        createdAt: new Date().toISOString(),
        reviews: [],
        buyerProtectionFee: fees.buyerProtectionFee,
        handlingFee: fees.handlingFee,
        totalEstimatedPrice: fees.totalEstimatedPrice,
        sellerEarnings: fees.sellerEarnings,
        manualSize: formData.manualSize,
        location: {
          country: locationData.country,
          state: locationData.state,
          city: locationData.city || '',
          address: locationData.address || '',
        },
        variants: formData.variants.map((variant, index) => ({
          color: variant.color,
          size: variant.size,
          price: parseFloat(variant.price),
          stock: parseInt(variant.stock, 10),
          imageUrls: variantImageUrls[index] || [],
        })),
      };
      const docRef = await addDoc(collection(db, 'products'), productData);
      console.log('Product uploaded with ID:', docRef.id);
      setIsPopupOpen(true);
      setFormData({
        sellerName: '',
        name: '',
        description: '',
        category: '',
        subcategory: '',
        subSubcategory: '',
        colors: [],
        sizes: [],
        condition: 'New',
        productUrl: '',
        images: [],
        videos: [],
        tags: [],
        manualSize: '',
        variants: [{ color: '', size: '', price: '', stock: '', images: [] }],
      });
      setLocationData({
        country: '',
        state: '',
        city: '',
        address: '',
      });
      setImageFiles([]);
      setImagePreviews([]);
      setVideoFiles([]);
      setVideoPreviews([]);
      setVariantImageFiles([]);
      setVariantImagePreviews([]);
      localStorage.removeItem('sellerProductForm');
      localStorage.removeItem('sellerLocationForm');
      localStorage.removeItem('sellerProductImages');
      localStorage.removeItem('sellerProductPreviews');
      localStorage.removeItem('sellerProductVideos');
      localStorage.removeItem('sellerProductVideoPreviews');
      localStorage.removeItem('sellerVariantImages');
      localStorage.removeItem('sellerVariantPreviews');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (singleImageInputRef.current) singleImageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      variantImageInputRefs.current.forEach((ref) => {
        if (ref.current) ref.current.value = '';
      });
      setColorSuggestions([]);
      setShowColorDropdown(false);
      setShowCategoryDropdown(false);
      setShowSubcategoryDropdown(false);
      setShowSubSubcategoryDropdown(false);
      setFees({
        productSize: '',
        buyerProtectionFee: 0,
        handlingFee: 0,
        totalEstimatedPrice: 0,
        sellerEarnings: 0,
      });
      setShowSizeWarning(false);
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

  // Dynamic size options
  const getSizeOptions = () => {
    if (formData.category === 'Clothing' && formData.subcategory) {
      return formData.subcategory === 'Men' ? menClothingSizes : womenClothingSizes;
    }
    if (formData.category === 'Footwear' && formData.subcategory) {
      return footwearSizes;
    }
    if (formData.category === 'Perfumes' && formData.subSubcategory?.startsWith('Oil -')) {
      return perfumeSizes;
    }
    return [];
  };

  if (!user) {
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
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <SellerSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-4 flex justify-center items-start">
        <div className="w-full max-w-5xl bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b-2 border-blue-500 pb-3 flex items-center gap-2">
            <i className="bx bx-package text-blue-500"></i>
            Add a New Product
          </h2>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Image Upload Section */}
            <div className="relative group">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                Product Images (up to {MAX_IMAGES}) <span className="text-red-500">*</span>
                <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Upload up to 8 images (JPEG, PNG, etc.)"></i>
              </label>
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`mt-1 w-full p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center min-h-[300px] transition-colors ${
                  errors.images ? 'border-red-500' : 'border-gray-300 hover:border-blue-500 dark:border-gray-600'
                } ${loading ? 'opacity-50' : ''}`}
              >
                {imagePreviews.length === 0 ? (
                  <div className="text-center">
                    <i className="bx bx-cloud-upload text-5xl text-gray-600 dark:text-gray-400"></i>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
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
                            select up to {MAX_IMAGES} images
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
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
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
                          className="w-full h-48 object-cover rounded-md border border-gray-200 dark:border-gray-600 cursor-pointer shadow-sm"
                          onClick={() => setZoomedMedia({ type: 'image', src: preview })}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm"
                          disabled={loading}
                          title="Remove image"
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
                  accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                  onChange={handleFileInputChange}
                  className="hidden"
                  disabled={loading}
                  multiple
                />
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
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <i className="bx bx-error-circle"></i>
                  {errors.images}
                </p>
              )}
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
              {uploadProgress > 0 && (
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Video Upload Section */}
            <div className="relative group">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                Product Video (1 video, Optional)
                <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Upload one video (MP4, MKV, WEBM, max 10MB, 30s, no audio)"></i>
              </label>
              <div
                className={`mt-1 w-full p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center min-h-[200px] transition-colors ${
                  errors.videos ? 'border-red-500' : 'border-gray-300 hover:border-blue-500 dark:border-gray-600'
                } ${loading ? 'opacity-50' : ''}`}
              >
                {videoPreviews.length === 0 ? (
                  <div className="text-center">
                    <i className="bx bx-video-plus text-5xl text-gray-600 dark:text-gray-400"></i>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Drag and drop a video or{' '}
                      <button
                        type="button"
                        onClick={() => videoInputRef.current.click()}
                        className="text-blue-600 hover:underline"
                        disabled={loading}
                      >
                        select a video
                      </button>
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      (MP4, MKV, WEBM, max 10MB, under 30 seconds, no audio)
                    </p>
                  </div>
                ) : (
                  <div className="w-full">
                    {videoPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <video
                          src={preview}
                          controls
                          className="w-full h-[255px] object-cover rounded-md border border-gray-200 dark:border-gray-600 cursor-pointer shadow-sm md:w-full md:h-auto"
                          onClick={() => setZoomedMedia({ type: 'video', src: preview })}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveVideo(index)}
                          className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm"
                          disabled={loading}
                          title="Remove video"
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
                  accept="video/mp4,video/mkv,video/webm"
                  onChange={handleVideoChange}
                  className="hidden"
                  disabled={loading}
                />
              </div>
              {errors.videos && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <i className="bx bx-error-circle"></i>
                  {errors.videos}
                </p>
              )}
              {uploadProgress > 0 && (
                <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Product Details Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-info-circle text-blue-500"></i>
                Product Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Seller Name <span className="text-red-500">*</span>
                    <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Your registered name"></i>
                  </label>
                  <input
                    type="text"
                    name="sellerName"
                    value={formData.sellerName}
                    placeholder="Enter your full name"
                    className="mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 border-gray-300 dark:border-gray-600 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200"
                    disabled
                  />
                  {errors.sellerName && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.sellerName}
                    </p>
                  )}
                </div>
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Product Name <span className="text-red-500">*</span>
                    <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Name of the product"></i>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., Men's Leather Jacket"
                    className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                    disabled={loading}
                  />
                  {errors.name && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.name}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-6 relative group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  Description
                  <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Describe your product with optional bold, italic, or code formatting"></i>
                </label>
                <div className="mt-1">
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => applyFormatting('bold')}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm group"
                      disabled={loading}
                      title="Bold text (**text**)"
                    >
                      <i className="bx bx-bold text-lg group-hover:text-blue-500"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('italic')}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm group"
                      disabled={loading}
                      title="Italic text (*text*)"
                    >
                      <i className="bx bx-italic text-lg group-hover:text-blue-500"></i>
                    </button>
                    <button
                      type="button"
                      onClick={() => applyFormatting('code')}
                      className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 shadow-sm group"
                      disabled={loading}
                      title="Code text (`text`)"
                    >
                      <i className="bx bx-code text-lg group-hover:text-blue-500"></i>
                    </button>
                  </div>
                  <textarea
                    ref={descriptionRef}
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="e.g., **Premium leather** jacket with *stylish stitching*"
                    className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                    rows="4"
                    disabled={loading}
                  />
                  {formData.description && (
                    <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300">
                      <h4 className="font-medium mb-2">Preview</h4>
                      <div
                        className="prose prose-sm dark:prose-invert"
                        dangerouslySetInnerHTML={{ __html: descriptionPreview }}
                      />
                    </div>
                  )}
                </div>
                {errors.description && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <i className="bx bx-error-circle"></i>
                    {errors.description}
                  </p>
                )}
              </div>
            </div>

            {/* Variants Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-copy-alt text-blue-500"></i>
                Product Variants
              </h3>
              {formData.variants.map((variant, index) => (
                <div key={index} className="mb-6 p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300">Variant {index + 1}</h4>
                    {formData.variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(index)}
                        className="text-red-500 hover:text-red-700 text-sm"
                        disabled={loading}
                      >
                        Remove Variant
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Color <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={variant.color}
                        onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                        className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                          errors[`variant${index}_color`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                        disabled={loading}
                      >
                        <option value="">Select a color</option>
                        {formData.colors.map((color) => (
                          <option key={color} value={color}>
                            {color}
                          </option>
                        ))}
                      </select>
                      {errors[`variant${index}_color`] && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <i className="bx bx-error-circle"></i>
                          {errors[`variant${index}_color`]}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Size <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={variant.size}
                        onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                        className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                          errors[`variant${index}_size`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                        disabled={loading}
                      >
                        <option value="">Select a size</option>
                        {formData.sizes.map((size) => (
                          <option key={size} value={size}>
                            {size}
                          </option>
                        ))}
                      </select>
                      {errors[`variant${index}_size`] && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <i className="bx bx-error-circle"></i>
                          {errors[`variant${index}_size`]}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Price (₦) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={variant.price}
                        onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                        step="0.01"
                        min="0"
                        placeholder="e.g., 5000.00"
                        className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                          errors[`variant${index}_price`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                        disabled={loading}
                      />
                      {errors[`variant${index}_price`] && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <i className="bx bx-error-circle"></i>
                          {errors[`variant${index}_price`]}
                        </p>
                      )}
                    </div>
                    <div className="relative">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Stock Quantity <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                        min="0"
                        placeholder="e.g., 10"
                        className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                          errors[`variant${index}_stock`] ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                        disabled={loading}
                      />
                      {errors[`variant${index}_stock`] && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <i className="bx bx-error-circle"></i>
                          {errors[`variant${index}_stock`]}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Variant Images (up to {MAX_VARIANT_IMAGES}) <span className="text-red-500">*</span>
                    </label>
                    <div
                      className={`mt-1 w-full p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center min-h-[150px] transition-colors ${
                        errors[`variant${index}_images`] ? 'border-red-500' : 'border-gray-300 hover:border-blue-500 dark:border-gray-600'
                      } ${loading ? 'opacity-50' : ''}`}
                    >
                      {variantImagePreviews[index]?.length === 0 ? (
                        <div className="text-center">
                          <i className="bx bx-cloud-upload text-4xl text-gray-600 dark:text-gray-400"></i>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            <button
                              type="button"
                              onClick={() => variantImageInputRefs.current[index]?.current.click()}
                              className="text-blue-600 hover:underline"
                              disabled={loading}
                            >
                              Select images
                            </button>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            (JPEG, JPG, PNG, WEBP, GIF, max 5MB each)
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                          {variantImagePreviews[index].map((preview, imgIndex) => (
                            <div key={imgIndex} className="relative">
                              <img
                                src={preview}
                                alt={`Variant ${index + 1} Preview ${imgIndex + 1}`}
                                className="w-full h-32 object-cover rounded-md border border-gray-200 dark:border-gray-600 cursor-pointer shadow-sm"
                                onClick={() => setZoomedMedia({ type: 'image', src: preview })}
                              />
                              <button
                                type="button"
                                onClick={() => handleRemoveVariantImage(index, imgIndex)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm"
                                disabled={loading}
                                title="Remove image"
                              >
                                <i className="bx bx-x text-sm"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <input
                        ref={(el) => {
                          if (el) variantImageInputRefs.current[index] = el;
                        }}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={(e) => handleVariantImageChange(index, e.target.files)}
                        className="hidden"
                        disabled={loading}
                        multiple
                      />
                    </div>
                    {errors[`variant${index}_images`] && (
                      <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                        <i className="bx bx-error-circle"></i>
                        {errors[`variant${index}_images`]}
                      </p>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddVariant}
                className="mt-2 text-blue-600 hover:underline text-sm"
                disabled={loading}
              >
                Add Another Variant
              </button>
            </div>

            {/* Product Size Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-money text-blue-500"></i>
                Pricing & Size
              </h3>
              <div className="mt-6 relative group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  Product Size <span className="text-red-500">*</span>
                  <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select product size"></i>
                </label>
                <select
                  name="manualSize"
                  value={formData.manualSize}
                  onChange={handleChange}
                  className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                    errors.manualSize ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                  disabled={loading}
                >
                  <option value="">Select a size</option>
                  {manualSizes.map((size) => (
                    <option key={size} value={size}>
                      {size}
                    </option>
                  ))}
                </select>
                {errors.manualSize && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <i className="bx bx-error-circle"></i>
                    {errors.manualSize}
                  </p>
                )}
              </div>
              {fees.productSize && feeConfig && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                  <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                    <i className="bx bx-calculator text-blue-500"></i>
                    Foremade Fees
                  </h4>
                  <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                    <p>Category: <span className="font-semibold">{fees.productSize}</span></p>
                    <p>Buyer Protection Fee ({(feeConfig[fees.productSize]?.buyerProtectionRate * 100).toFixed(2)}%): ₦{fees.buyerProtectionFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                    <p>Handling Fee ({(feeConfig[fees.productSize]?.handlingRate * 100).toFixed(2)}%): ₦{fees.handlingFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                    <p className="font-bold">
                      Total Estimated Price for Buyer: ₦{fees.totalEstimatedPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="font-bold text-green-600">
                      Your Estimated Earnings: ₦{fees.sellerEarnings.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Note: International shipping costs can be added separately.
                    </p>
                    {showSizeWarning && (
                      <p className="text-red-600 text-xs flex items-center gap-1">
                        <i className="bx bx-error-circle"></i>
                        Price is below the minimum for this category.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Category, Subcategory & Sub-Subcategory Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-list-ul text-blue-500"></i>
                Category & Subcategory
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm text-left focus:outline-none focus:ring-2 ${
                        errors.category ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex justify-between items-center transition-all duration-200`}
                      disabled={loading}
                    >
                      <span>{formData.category || 'Select a category'}</span>
                      <i className={`bx bx-chevron-${showCategoryDropdown ? 'up' : 'down'} text-gray-500`}></i>
                    </button>
                    {showCategoryDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {categories.map((category) => (
                          <div
                            key={category}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                category,
                                subcategory: '',
                                subSubcategory: '',
                                sizes: [],
                                variants: [{ color: '', size: '', price: '', stock: '', images: [] }],
                              }));
                              setShowCategoryDropdown(false);
                              setErrors((prev) => ({ ...prev, category: '' }));
                            }}
                            className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer"
                          >
                            {category}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.category && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.category}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Subcategory <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSubcategoryDropdown(!showSubcategoryDropdown)}
                      className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm text-left focus:outline-none focus:ring-2 ${
                        errors.subcategory ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex justify-between items-center transition-all duration-200`}
                      disabled={loading || !formData.category}
                    >
                      <span>{formData.subcategory || 'Select a subcategory'}</span>
                      <i className={`bx bx-chevron-${showSubcategoryDropdown ? 'up' : 'down'} text-gray-500`}></i>
                    </button>
                    {showSubcategoryDropdown && formData.category && customSubcategories[formData.category]?.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {customSubcategories[formData.category].map((subcat) => (
                          <div
                            key={subcat}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                subcategory: subcat,
                                subSubcategory: '',
                                sizes: [],
                                variants: [{ color: '', size: '', price: '', stock: '', images: [] }],
                              }));
                              setShowSubcategoryDropdown(false);
                              setErrors((prev) => ({ ...prev, subcategory: '' }));
                            }}
                            className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer"
                          >
                            {subcat}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.subcategory && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.subcategory}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Sub-Subcategory
                  </label>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setShowSubSubcategoryDropdown(!showSubSubcategoryDropdown)}
                      className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm text-left focus:outline-none focus:ring-2 ${
                        errors.subSubcategory ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex justify-between items-center transition-all duration-200`}
                      disabled={loading || !formData.subcategory || !customSubSubcategories[formData.category]?.[formData.subcategory]?.length}
                    >
                      <span>{formData.subSubcategory || 'Select a sub-subcategory'}</span>
                      <i className={`bx bx-chevron-${showSubSubcategoryDropdown ? 'up' : 'down'} text-gray-500`}></i>
                    </button>
                    {showSubSubcategoryDropdown && formData.category && formData.subcategory && customSubSubcategories[formData.category]?.[formData.subcategory]?.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {customSubSubcategories[formData.category][formData.subcategory].map((subSubcat) => (
                          <div
                            key={subSubcat}
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                subSubcategory: subSubcat,
                                sizes: [],
                                variants: [{ color: '', size: '', price: '', stock: '', images: [] }],
                              }));
                              setShowSubSubcategoryDropdown(false);
                              setErrors((prev) => ({ ...prev, subSubcategory: '' }));
                            }}
                            className="px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer"
                          >
                            {subSubcat}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {errors.subSubcategory && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.subSubcategory}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Colors Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-palette text-blue-500"></i>
                Colors <span className="text-red-500">*</span>
              </h3>
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  Select Colors
                  <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select or add custom colors for your product"></i>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={customColor}
                    onChange={handleColorInputChange}
                    onKeyDown={handleCustomColorAdd}
                    placeholder="Type a color or select below"
                    className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.colors ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                    disabled={loading}
                  />
                  {showColorDropdown && colorSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {colorSuggestions.map((color) => (
                        <div
                          key={color.name}
                          onClick={() => handleColorToggle(color.name)}
                          className="flex items-center px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900 cursor-pointer"
                        >
                          <span
                            className="inline-block w-4 h-4 mr-2 rounded-full"
                            style={{ backgroundColor: color.hex }}
                          ></span>
                          {color.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                {errors.colors && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <i className="bx bx-error-circle"></i>
                    {errors.colors}
                  </p>
                )}
              </div>
              {formData.colors.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.colors.map((color) => (
                    <div
                      key={color}
                      className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full"
                    >
                      {color}
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(color)}
                        className="ml-2 text-blue-800 dark:text-blue-200 hover:text-blue-900 dark:hover:text-blue-100"
                        disabled={loading}
                      >
                        <i className="bx bx-x"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Sizes Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-ruler text-blue-500"></i>
                Sizes {(formData.category === 'Clothing' || formData.category === 'Footwear' || formData.category === 'Perfumes') && <span className="text-red-500">*</span>}
              </h3>
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  Select Sizes
                  <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select or add custom sizes for your product"></i>
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {getSizeOptions().map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSizeToggle(size)}
                      className={`px-3 py-1 text-sm rounded-lg border transition-all duration-200 ${
                        formData.sizes.includes(size)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-blue-900'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={loading}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  onKeyDown={handleCustomSizeAdd}
                  placeholder="Add custom size (press Enter)"
                  className={`mt-2 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                    errors.sizes ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                  disabled={loading}
                />
                {errors.sizes && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <i className="bx bx-error-circle"></i>
                    {errors.sizes}
                  </p>
                )}
              </div>
              {formData.sizes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {formData.sizes.map((size) => (
                    <div
                      key={size}
                      className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full"
                    >
                      {size}
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(size)}
                        className="ml-2 text-blue-800 dark:text-blue-200 hover:text-blue-900 dark:hover:text-blue-100"
                        disabled={loading}
                      >
                        <i className="bx bx-x"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Condition Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-check-square text-blue-500"></i>
                Condition
              </h3>
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  Product Condition
                  <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select the condition of your product"></i>
                </label>
                <select
                  name="condition"
                  value={formData.condition}
                  onChange={handleChange}
                  className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                    errors.condition ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                  disabled={loading}
                >
                  <option value="New">New</option>
                  <option value="Used - Like New">Used - Like New</option>
                  <option value="Used - Good">Used - Good</option>
                  <option value="Refurbished">Refurbished</option>
                </select>
                {errors.condition && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <i className="bx bx-error-circle"></i>
                    {errors.condition}
                  </p>
                )}
              </div>
            </div>

            {/* Product URL Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-link text-blue-500"></i>
                Product URL (Optional)
              </h3>
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  Product URL
                  <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Add a link to an external product page (optional)"></i>
                </label>
                <input
                  type="url"
                  name="productUrl"
                  value={formData.productUrl}
                  onChange={handleChange}
                  placeholder="e.g., https://example.com/product"
                  className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                    errors.productUrl ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                  disabled={loading}
                />
                {errors.productUrl && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <i className="bx bx-error-circle"></i>
                    {errors.productUrl}
                  </p>
                )}
              </div>
            </div>

            {/* Tags Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-purchase-tag text-blue-500"></i>
                Tags
              </h3>
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  Select Tags
                  <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Add tags to improve product discoverability"></i>
                </label>
                <div className="mt-1 flex flex-wrap gap-2">
                  {[...authenticityTags, ...suggestedTags].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className={`px-3 py-1 text-sm rounded-lg border transition-all duration-200 ${
                        formData.tags.includes(tag)
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:bg-blue-100 dark:hover:bg-blue-900'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={loading}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                {formData.tags.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <div
                        key={tag}
                        className="flex items-center bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs font-medium px-2.5 py-0.5 rounded-full"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className="ml-2 text-blue-800 dark:text-blue-200 hover:text-blue-900 dark:hover:text-blue-100"
                          disabled={loading}
                        >
                          <i className="bx bx-x"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Location Form Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-map text-blue-500"></i>
                Location
              </h3>
              <SellerLocationForm
                locationData={locationData}
                setLocationData={setLocationData}
                errors={locationErrors}
                disabled={loading}
              />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-8">
              <button
                type="submit"
                className={`py-2 px-6 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 flex items-center gap-2 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="bx bx-loader bx-spin"></i>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="bx bx-check-circle"></i>
                    Add Product
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Custom Alert */}
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />

          {/* Popup for Successful Upload */}
          {isPopupOpen && (
            <SellerProductUploadPopup
              onClose={() => setIsPopupOpen(false)}
              onViewProducts={() => navigate('/seller/products')}
              onAddAnother={() => setIsPopupOpen(false)}
            />
          )}

          {/* Zoomed Media Modal */}
          {zoomedMedia && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="relative max-w-4xl w-full p-4">
                {zoomedMedia.type === 'image' ? (
                  <img
                    src={zoomedMedia.src}
                    alt="Zoomed"
                    className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                  />
                ) : (
                  <video
                    src={zoomedMedia.src}
                    controls
                    className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                  />
                )}
                <button
                  onClick={() => setZoomedMedia(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
                >
                  <i className="bx bx-x text-lg"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}