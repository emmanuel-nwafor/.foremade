import { useState, useEffect, useRef } from 'react';
import { auth, db } from '/src/firebase';
import { useNavigate, Link } from 'react-router-dom';
import { collection, addDoc, getDoc, doc, onSnapshot } from 'firebase/firestore';
import axios from 'axios';
import { marked } from 'marked';
import SellerSidebar from './SellerSidebar';
import SellerLocationForm from './SellerLocationForm';

// Set global Axios timeout
axios.defaults.timeout = 80000; // 80 seconds

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
  // Checkbox state for guidelines
  const [hasReadGuidelines, setHasReadGuidelines] = useState(false);
  const navigate = useNavigate();
  const { alerts, addAlert, removeAlert } = useAlerts();

  // State for form data (persisted in localStorage)
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('sellerProductForm');
    return savedData
      ? JSON.parse(savedData)
      : {
          sellerName: '',
          name: '',
          description: '',
          price: '',
          stock: '',
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
          deliveryDays: '', // Added deliveryDays
        };
  });

  // State for location data
  const [locationData, setLocationData] = useState(() => {
    const savedLocation = localStorage.getItem('sellerLocationForm');
    return savedLocation
      ? JSON.parse(savedLocation)
      : {
          country: '',
          state: '',
          city: '',
          address: '',
        };
  });

  // State for location errors
  const [locationErrors, setLocationErrors] = useState({});

  // State for popups
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false); // Success popup after submission

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

  // Stepper state
  const [currentStep, setCurrentStep] = useState(1);
  const steps = [
    { label: 'Media', key: 1 },
    { label: 'Details', key: 2 },
    { label: 'Pricing', key: 3 },
    { label: 'Location', key: 4 },
  ];

  // Helper to determine if a section is complete
  const isSectionComplete = (stepKey) => {
    if (stepKey === 1) return imageFiles.length > 0;
    if (stepKey === 2) return formData.name && formData.description && formData.sellerName;
    if (stepKey === 3) return formData.price && formData.stock && formData.deliveryDays;
    if (stepKey === 4) return locationData.country && locationData.state;
    return false;
  };

  // Auto-advance stepper as user completes sections
  useEffect(() => {
    if (isSectionComplete(1) && currentStep < 2) setCurrentStep(2);
    if (isSectionComplete(2) && currentStep < 3) setCurrentStep(3);
    if (isSectionComplete(3) && currentStep < 4) setCurrentStep(4);
  }, [imageFiles, formData.name, formData.description, formData.sellerName, formData.price, formData.stock, formData.deliveryDays, locationData.country, locationData.state]);

  // Stepper click handler
  const handleStepClick = (stepKey) => {
    if (stepKey < currentStep) setCurrentStep(stepKey);
  };

  // Refs for file inputs
  const fileInputRef = useRef(null);
  const singleImageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const dropZoneRef = useRef(null);
  const descriptionRef = useRef(null);

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
  const manualSizes = ['1 to 5kg', '5 to 10kg ', '10 to 20kg', '20kg above'];
  const authenticityTags = ['Verified', 'Original', 'Hand Made', 'Authentic'];
  const MAX_IMAGES = 8;
  const MAX_VIDEOS = 1;
  const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_DURATION = 30; // 30 seconds

  // Persist location data to localStorage
  useEffect(() => {
    localStorage.setItem('sellerLocationForm', JSON.stringify(locationData));
  }, [locationData]);

  // Fetch categories, subcategories, sub-subcategories, and fees from Firestore
  useEffect(() => {
    const unsubscribeCategories = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const categoryList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setCategories(categoryList.map((cat) => cat.name));
      if (formData.category && !categoryList.some((cat) => cat.name === formData.category)) {
        setFormData((prev) => ({ ...prev, category: '', subcategory: '', subSubcategory: '', sizes: [] }));
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
        setFormData((prev) => ({ ...prev, subcategory: '', subSubcategory: '', sizes: [] }));
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
        setFormData((prev) => ({ ...prev, subSubcategory: '', sizes: [] }));
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
  }, [formData.category, formData.subcategory, formData.subSubcategory]);

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
  }, [navigate]);

  // Calculate fees
  useEffect(() => {
    if (!feeConfig || !formData.category) return;
    const price = parseFloat(formData.price);
    if (!price || isNaN(price)) {
      setFees({
        productSize: '',
        buyerProtectionFee: 0,
        handlingFee: 0,
        totalEstimatedPrice: 0,
        sellerEarnings: 0,
      });
      return;
    }
    const config = feeConfig[formData.category] || {
      minPrice: 1000,
      maxPrice: Infinity,
      buyerProtectionRate: 0.08,
      handlingRate: 0.20,
    };
    const buyerProtectionFee = price * config.buyerProtectionRate;
    const handlingFee = price * config.handlingRate;
    const totalEstimatedPrice = price + buyerProtectionFee + handlingFee;
    const sellerEarnings = price;
    setFees({
      productSize: formData.category,
      buyerProtectionFee,
      handlingFee,
      totalEstimatedPrice,
      sellerEarnings,
    });
    localStorage.setItem('sellerProductForm', JSON.stringify(formData));
  }, [formData.price, formData.category, feeConfig]);

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

  // Auto-suggest tags
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

  // Detect mobile
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
      ...(name === 'category' ? { subcategory: '', subSubcategory: '', sizes: [] } : {}),
      ...(name === 'subcategory' ? { subSubcategory: '', sizes: [] } : {}),
    }));
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

  // =========== Form Validation ============= //
  const validateForm = () => {
    const newErrors = {};
    if (!formData.sellerName.trim()) newErrors.sellerName = 'Please enter your full name.';
    if (!formData.name.trim()) newErrors.name = 'Product name is required.';
    if (!formData.price || isNaN(formData.price) || formData.price <= 0)
      newErrors.price = 'Enter a valid price greater than 0.';
    if (!formData.stock || isNaN(formData.stock) || formData.stock < 0)
      newErrors.stock = 'Enter a valid stock quantity (0 or more).';
    if (!formData.category || !categories.includes(formData.category))
      newErrors.category = 'Select a valid category.';
    if (imageFiles.length === 0) newErrors.images = 'At least one image is required.';
    if (imageFiles.length > MAX_IMAGES) newErrors.images = `Maximum ${MAX_IMAGES} images allowed.`;
    if (videoFiles.length > MAX_VIDEOS) newErrors.videos = `Maximum ${MAX_VIDEOS} video allowed.`;
    if (!formData.deliveryDays || isNaN(formData.deliveryDays) || formData.deliveryDays <= 0)
      newErrors.deliveryDays = 'Enter a valid number of delivery days (greater than 0).';
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
    return newErrors;
  };

  const validateLocationForm = () => {
    const newLocationErrors = {};
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
        timeout: 100000,
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
        manualSize: formData.manualSize || '',
        deliveryDays: parseInt(formData.deliveryDays, 10), // Added deliveryDays
        location: {
          country: locationData.country,
          state: locationData.state,
          city: locationData.city || '',
          address: locationData.address || '',
        },
      };
      const docRef = await addDoc(collection(db, 'products'), productData);
      console.log('Product uploaded with ID:', docRef.id);
      setIsSuccessPopupOpen(true); // Show success popup
      setFormData({
        sellerName: '',
        name: '',
        description: '',
        price: '',
        stock: '',
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
        deliveryDays: '', // Reset deliveryDays
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
      localStorage.removeItem('sellerProductForm');
      localStorage.removeItem('sellerLocationForm');
      localStorage.removeItem('sellerProductImages');
      localStorage.removeItem('sellerProductPreviews');
      localStorage.removeItem('sellerProductVideos');
      localStorage.removeItem('sellerProductVideoPreviews');
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (singleImageInputRef.current) singleImageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
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

  // Handle variant popup actions
  const handleVariantYes = () => {
    setIsVariantPopupOpen(false);
    navigate('/products-upload-variant');
  };

  const handleVariantNo = () => {
    setIsVariantPopupOpen(false);
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
        <div className="w-full max-w-7xl bg-white dark:bg-gray-800 p-6 md:p-8 rounded-lg shadow-md">
          <div className="flex justify-between items-center">
            <h2 className="text-xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b-2 border-blue-500 pb-3 flex items-center gap-2">
              <i className="bx bx-package text-blue-500"></i>
              Add a New Product
            </h2>
            <Link to="/bulk-upload" className="inline-block px-1 py-1 bg-[#112d4e] text-white rounded hover:bg-blue-700 font-semibold shadow">
              Bulk Upload
            </Link>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
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
                className={`mt-1 w-full p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center min-h-[200px] transition-colors ${
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-1">
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-1">
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
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
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

            {/* Pricing & Stock Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-money text-blue-500"></i>
                Pricing & Stock
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-1">
                    Price (₦) <span className="text-red-500">*</span>
                    <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Price in Naira"></i>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    placeholder="e.g., 5000.00"
                    className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                    disabled={loading}
                  />
                  {errors.price && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.price}
                    </p>
                  )}
                </div>
                <div className="relative group">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Stock Quantity <span className="text-red-500">*</span>
                    <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Available stock"></i>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    min="0"
                    placeholder="e.g., 10"
                    className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.stock ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                    disabled={loading}
                  />
                  {errors.stock && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.stock}
                    </p>
                  )}
                </div>
                <div className="relative group">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Delivery Days <span className="text-red-500">*</span>
                    <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Estimated delivery time in days"></i>
                  </label>
                  <input
                    type="number"
                    name="deliveryDays"
                    value={formData.deliveryDays}
                    onChange={handleChange}
                    min="1"
                    placeholder="e.g., 3"
                    className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.deliveryDays ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                    disabled={loading}
                  />
                  {errors.deliveryDays && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.deliveryDays}
                    </p>
                  )}
                </div>
              </div>
              <div className="mt-6 relative group">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                  Product Weight
                  <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select product weight"></i>
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
                    <p className="hidden">Buyer Protection Fee ({(feeConfig[fees.productSize]?.buyerProtectionRate * 100).toFixed(2)}%): ₦{fees.buyerProtectionFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                    <p className="hidden">Handling Fee ({(feeConfig[fees.productSize]?.handlingRate * 100).toFixed(2)}%): ₦{fees.handlingFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                    <p className="font-bold">
                      Total Estimated Price for Buyer: ₦{fees.totalEstimatedPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="font-bold text-green-600">
                      Your Estimated Earnings: ₦{fees.sellerEarnings.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                      Note: International shipping costs can be added separately.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Category, Subcategory & Sub-Subcategory Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-category text-blue-500"></i>
                Category & Subcategory
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative group">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                    Category <span className="text-red-500">*</span>
                    <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select product category"></i>
                  </label>
                  <div className="relative mt-1">
                    <button
                      type="button"
                      onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                      className={`w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.category ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex justify-between items-center transition-all duration-200`}
                      disabled={loading || categories.length === 0}
                    >
                      <span>{formData.category || 'Select a category'}</span>
                      <i className="bx bx-chevron-down text-gray-500 dark:text-gray-400"></i>
                    </button>
                    {showCategoryDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md max-h-40 overflow-y-auto">
                        {categories.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500 dark:text-gray-400">No categories available</div>
                        ) : (
                          categories.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, category: cat, subcategory: '', subSubcategory: '', sizes: [] }));
                                setShowCategoryDropdown(false);
                              }}
                              className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-100"
                            >
                              {cat}
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                  {errors.category && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.category}
                    </p>
                  )}
                  {categories.length === 0 && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      Loading categories...
                    </p>
                  )}
                  {formData.category && formData.category.toLowerCase().includes('food') && (
                    <p className="text-gray-500 text-xs mt-3 flex items-center gap-1">
                      <i className="bx bx-info-circle"></i>
                      All food-related categories must meet NAFDAC/FSA food safety standards.
                    </p>
                  )}
                </div>
                {formData.category && (
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-1">
                      Subcategory
                      <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select or type a subcategory"></i>
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={formData.subcategory}
                        onChange={(e) => setFormData((prev) => ({ ...prev, subcategory: e.target.value, subSubcategory: '', sizes: [] }))}
                        onFocus={() => setShowSubcategoryDropdown(true)}
                        onBlur={() => setTimeout(() => setShowSubcategoryDropdown(false), 200)}
                        placeholder="Select or type a subcategory"
                        className={`w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                          errors.subcategory ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                        disabled={loading || !customSubcategories[formData.category]}
                      />
                      {showSubcategoryDropdown && customSubcategories[formData.category] && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md max-h-40 overflow-y-auto">
                          {customSubcategories[formData.category]
                            .filter((subcat) => subcat.toLowerCase().includes(formData.subcategory.toLowerCase()))
                            .map((subcat) => (
                              <button
                                key={subcat}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, subcategory: subcat, subSubcategory: '', sizes: [] }));
                                  setShowSubcategoryDropdown(false);
                                }}
                                className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-100"
                              >
                                {subcat}
                              </button>
                            ))}
                        </div>
                      )}
                      {!customSubcategories[formData.category] && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <i className="bx bx-error-circle"></i>
                          Loading subcategories...
                        </p>
                      )}
                      {errors.subcategory && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <i className="bx bx-error-circle"></i>
                          {errors.subcategory}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {formData.subcategory && customSubSubcategories[formData.category]?.[formData.subcategory] && (
                  <div className="relative group">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Sub-Subcategory
                      <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select or type a sub-subcategory"></i>
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={formData.subSubcategory}
                        onChange={(e) => setFormData((prev) => ({ ...prev, subSubcategory: e.target.value, sizes: [] }))}
                        onFocus={() => setShowSubSubcategoryDropdown(true)}
                        onBlur={() => setTimeout(() => setShowSubSubcategoryDropdown(false), 200)}
                        placeholder="Select or type a sub-subcategory"
                        className={`w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                          errors.subSubcategory ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                        disabled={loading || !customSubSubcategories[formData.category]?.[formData.subcategory]}
                      />
                      {showSubSubcategoryDropdown && customSubSubcategories[formData.category]?.[formData.subcategory] && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md max-h-40 overflow-y-auto">
                          {customSubSubcategories[formData.category][formData.subcategory]
                            .filter((subSubcat) => subSubcat.toLowerCase().includes(formData.subSubcategory.toLowerCase()))
                            .map((subSubcat) => (
                              <button
                                key={subSubcat}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, subSubcategory: subSubcat, sizes: [] }));
                                  setShowSubSubcategoryDropdown(false);
                                }}
                                className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-100"
                              >
                                {subSubcat}
                              </button>
                            ))}
                        </div>
                      )}
                      {errors.subSubcategory && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <i className="bx bx-error-circle"></i>
                          {errors.subSubcategory}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sizes Section */}
            {(formData.category === 'Clothing' || formData.category === 'Footwear' || formData.category === 'Perfumes') && formData.subcategory && (
              <div>
                <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                  <i className="bx bx-ruler text-blue-500"></i>
                  Sizes
                </h3>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-1">
                  Sizes <span className="text-red-500">*</span>
                  <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select or enter sizes"></i>
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {getSizeOptions().map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => handleSizeToggle(size)}
                      className={`px-3 py-1 rounded-lg border text-sm transition-colors shadow-sm ${
                        formData.sizes.includes(size)
                          ? 'border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={loading}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                <div className="relative mt-2">
                  <input
                    type="text"
                    placeholder="Enter custom size (e.g., Size 35) and press Enter"
                    onKeyDown={handleCustomSizeAdd}
                    className={`w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.sizes ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                    disabled={loading}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.sizes.map((size) => (
                    <div
                      key={size}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs shadow-sm"
                    >
                      <span>{size}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveSize(size)}
                        className="text-red-500 hover:text-red-700"
                        disabled={loading}
                        title="Remove size"
                      >
                        <i className="bx bx-x"></i>
                      </button>
                    </div>
                  ))}
                </div>
                {errors.sizes && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <i className="bx bx-error-circle"></i>
                    {errors.sizes}
                  </p>
                )}
              </div>
            )}

            {/* Colors Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-color-fill text-blue-500"></i>
                Colors
              </h3>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-1">
                Colors
                <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select or enter colors"></i>
              </label>
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {formData.colors.map((color) => {
                  const predefinedColor = availableColors.find(
                    (c) => c.name.toLowerCase() === color.toLowerCase()
                  );
                  return (
                    <div
                      key={color}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs shadow-sm"
                    >
                      <span
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: predefinedColor ? predefinedColor.hex :                         predefinedColor ? predefinedColor.hex : '#000000' }}
                      ></span>
                      <span>{color}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(color)}
                        className="text-red-500 hover:text-red-700"
                        disabled={loading}
                        title="Remove color"
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
                  placeholder="Type a color and press Enter"
                  className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                    errors.colors ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                  disabled={loading}
                />
                {showColorDropdown && colorSuggestions.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md max-h-40 overflow-y-auto">
                    {colorSuggestions.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onClick={() => handleColorToggle(color.name)}
                        className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-100 flex items-center gap-2"
                      >
                        <span
                          className="w-4 h-4 rounded-full"
                          style={{ backgroundColor: color.hex }}
                        ></span>
                        {color.name}
                      </button>
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

            {/* Tags Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-purchase-tag text-blue-500"></i>
                Tags
              </h3>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-1">
                Tags
                <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select or enter tags to improve product visibility"></i>
              </label>
              <div className="flex flex-wrap gap-2 mt-2 mb-2">
                {suggestedTags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {suggestedTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleTagToggle(tag)}
                        className="px-3 py-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm shadow-sm"
                        disabled={loading}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
                {formData.tags.map((tag) => (
                  <div
                    key={tag}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs shadow-sm"
                  >
                    <span>{tag}</span>
                    <button
                      type="button"
                      onClick={() => handleTagToggle(tag)}
                      className="text-red-500 hover:text-red-700"
                      disabled={loading}
                      title="Remove tag"
                    >
                      <i className="bx bx-x"></i>
                    </button>
                  </div>
                ))}
              </div>
              <input
                type="text"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.target.value.trim()) {
                    const tag = e.target.value.trim();
                    if (formData.tags.length >= 10) {
                      addAlert('Maximum 10 tags allowed.', 'error');
                      return;
                    }
                    if (tag.length > 20) {
                      addAlert('Tag must be 20 characters or less.', 'error');
                      return;
                    }
                    setFormData((prev) => ({
                      ...prev,
                      tags: prev.tags.includes(tag) ? prev.tags : [...prev.tags, tag],
                    }));
                    e.target.value = '';
                  }
                }}
                placeholder="Type a tag and press Enter"
                className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                  errors.tags ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                disabled={loading}
              />
              <div className="mt-4">
                 <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 items-center gap-1">
                  Authenticity tags
                 </label>
                  {/* const authenticityTags = ['Verified', 'Original', 'Hand Made', 'Authentic']; */}
                    <div className="flex flex-wrap gap-2">
                  {['Verified', 'Original', 'Hand Made', 'Authentic'].map((condition) => (
                    <button
                      key={condition}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, condition }))}
                      className={`px-3 py-1 rounded-lg border text-sm transition-colors shadow-sm ${
                        formData.condition === condition
                          ? 'border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                      } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      disabled={loading}
                    >
                      {condition}
                    </button>
                  ))}
              </div>

              </div>
              {errors.tags && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <i className="bx bx-error-circle"></i>
                  {errors.tags}
                </p>
              )}
            </div>

            {/* Condition Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-check-shield text-blue-500"></i>
                Condition
              </h3>
              <div className="flex flex-wrap gap-2">
                {['New', 'Used', 'Refurbished'].map((condition) => (
                  <button
                    key={condition}
                    type="button"
                    onClick={() => setFormData((prev) => ({ ...prev, condition }))}
                    className={`px-3 py-1 rounded-lg border text-sm transition-colors shadow-sm ${
                      formData.condition === condition
                        ? 'border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading}
                  >
                    {condition}
                  </button>
                ))}
              </div>
              {errors.condition && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <i className="bx bx-error-circle"></i>
                  {errors.condition}
                </p>
              )}
            </div>

            
              <Link to="/products-upload-variant" className='text-white hover:underline'>
                <button className="p-2 mt-5 rounded-lg bg-blue-500">
                    Variants Upload?
                </button>
              </Link>

            {/* Location Section */}
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
              {/* Guidelines Checkbox Section */}
              <div className="mt-8 flex items-center justify-start">
                <label className="flex items-center gap-2 text-blue-900 font-semibold">
                  <input
                    type="checkbox"
                    checked={hasReadGuidelines}
                    onChange={e => setHasReadGuidelines(e.target.checked)}
                    className="accent-blue-600 w-4 h-4"
                  />
                  I have read and understood the <a href="/guidelines" className="underline text-blue-700" target="_blank" rel="noopener noreferrer">Product Upload Guidelines</a>
                </label>
              </div>
              <div className="mt-8 flex justify-end">
                <button
                  type="submit"
                  className={`px-6 py-2 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors flex items-center gap-2 ${
                    loading || !hasReadGuidelines ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                  disabled={loading || !hasReadGuidelines}
                  title={!hasReadGuidelines ? 'Please read the guidelines before proceeding.' : ''}
                >
                  {loading ? (
                    <>
                      <i className="bx bx-loader bx-spin"></i>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <i className="bx bx-upload"></i>
                      Add Product
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Alerts */}
            <CustomAlert alerts={alerts} removeAlert={removeAlert} />

          {/* Success Popup */}
          {isSuccessPopupOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full text-center">
                <i className="bx bx-check-circle text-5xl text-green-500 mb-4"></i>
                <h3 className="text-lg font-medium text-gray-800 dark:text-gray-100 mb-4">
                  Product Added Successfully!
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Your product has been uploaded and is now awaiting admin approval.
                </p>
                <div className="flex justify-center gap-4">
                  <button
                    onClick={() => navigate('/seller/products')}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500"
                  >
                    View Products
                  </button>
                  <button
                    onClick={() => setIsSuccessPopupOpen(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Another
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Zoomed Media Modal */}
          {zoomedMedia && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="relative max-w-4xl w-full">
                <button
                  onClick={() => setZoomedMedia(null)}
                  className="absolute top-4 right-4 text-white text-2xl hover:text-gray-300"
                >
                  <i className="bx bx-x"></i>
                </button>
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
              </div>
            </div>
          )}

          {/* Alerts */}
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
      </div>
    </div>
  );
}