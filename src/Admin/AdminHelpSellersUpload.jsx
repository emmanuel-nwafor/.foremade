import { useState, useEffect, useRef } from 'react';
import { auth, db } from '/src/firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, getDoc, doc, onSnapshot } from 'firebase/firestore';
import axios from 'axios';
import { marked } from 'marked';
import SellerSidebar from './AdminSidebar';
import SellerLocationForm from '/src/seller/SellerLocationForm';

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
    if (alerts.some((alert) => alert.message === message)) return; // Prevent duplicates
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
  };
  const removeAlert = (id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  };
  return { alerts, addAlert, removeAlert };
}

export default function AdminHelpSellersUpload() {
  const navigate = useNavigate();
  const { sellerId } = useParams(); // Get sellerId from URL
  const { alerts, addAlert, removeAlert } = useAlerts();

  // State for form data (persisted in localStorage)
  const [formData, setFormData] = useState(() => {
    const savedData = localStorage.getItem('adminProductForm');
    return savedData ? JSON.parse(savedData) : {
      sellerName: '',
      sellerId: '',
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
    };
  });

  // State for location data
  const [locationData, setLocationData] = useState(() => {
    const savedLocation = localStorage.getItem('adminLocationForm');
    return savedLocation ? JSON.parse(savedLocation) : {
      country: '',
      state: '',
      city: '',
      address: '',
    };
  });

  // State for location errors
  const [locationErrors, setLocationErrors] = useState({});

  // State for popups
  const [isSuccessPopupOpen, setIsSuccessPopupOpen] = useState(false);

  // State for media files and previews
  const [imageFiles, setImageFiles] = useState(() => {
    const savedImages = localStorage.getItem('adminProductImages');
    return savedImages ? JSON.parse(savedImages) : [];
  });
  const [imagePreviews, setImagePreviews] = useState(() => {
    const savedPreviews = localStorage.getItem('adminProductPreviews');
    return savedPreviews ? JSON.parse(savedPreviews) : [];
  });
  const [videoFiles, setVideoFiles] = useState(() => {
    const savedVideos = localStorage.getItem('adminProductVideos');
    return savedVideos ? JSON.parse(savedVideos) : [];
  });
  const [videoPreviews, setVideoPreviews] = useState(() => {
    const savedVideoPreviews = localStorage.getItem('adminProductVideoPreviews');
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
    if (stepKey === 2) return formData.name && formData.description && formData.sellerName && formData.sellerId;
    if (stepKey === 3) return formData.price && formData.stock;
    if (stepKey === 4) return locationData.country && locationData.state;
    return false;
  };

  // Auto-advance stepper as user completes sections
  useEffect(() => {
    if (isSectionComplete(1) && currentStep < 2) setCurrentStep(2);
    if (isSectionComplete(2) && currentStep < 3) setCurrentStep(3);
    if (isSectionComplete(3) && currentStep < 4) setCurrentStep(4);
  }, [imageFiles, formData.name, formData.description, formData.sellerName, formData.sellerId, formData.price, formData.stock, locationData.country, locationData.state]);

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
    { name: 'blue', hex: '#0000ff' },
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
  const authenticityTags = ['Verified', 'Original', 'Brand New', 'Authentic'];
  const MAX_IMAGES = 8;
  const MAX_VIDEOS = 1;
  const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_DURATION = 30; // 30 seconds

  // Persist location data to localStorage
  useEffect(() => {
    localStorage.setItem('adminLocationForm', JSON.stringify(locationData));
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
  }, [formData.category, formData.subcategory, formData.subSubcategory, addAlert]);

  // Handle admin authentication and seller selection from URL
  // Handle seller selection from URL (replacing lines 347–384)
useEffect(() => {
  let isMounted = true;
  const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
    if (!isMounted) return;
    setUser(currentUser); // Set user without admin check
    if (sellerId) {
      try {
        const sellerDoc = await getDoc(doc(db, 'users', sellerId));
        const sellerName = sellerDoc.exists() ? sellerDoc.data().name || 'Unknown Seller' : 'Unknown Seller';
        console.log(`Seller fetched: ID=${sellerId}, Name=${sellerName}`);
        setFormData((prev) => ({
          ...prev,
          sellerId,
          sellerName,
        }));
        localStorage.setItem('adminProductForm', JSON.stringify({
          ...formData,
          sellerId,
          sellerName,
        }));
      } catch (err) {
        console.error('Error fetching seller:', err);
        // Fallback to keep sellerId and use a default name
        setFormData((prev) => ({
          ...prev,
          sellerId,
          sellerName: 'Unknown Seller',
        }));
        addAlert(`Failed to load seller details for ID ${sellerId}. Using default name.`, 'warning');
        localStorage.setItem('adminProductForm', JSON.stringify({
          ...formData,
          sellerId,
          sellerName: 'Unknown Seller',
        }));
      }
    } else {
      addAlert('No seller ID provided in URL.', 'error');
      setFormData((prev) => ({ ...prev, sellerId: '', sellerName: '' }));
      navigate('/admin/users');
    }
  });

  return () => {
    isMounted = false;
    unsubscribe();
  };
}, [sellerId, navigate, addAlert, formData]);

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
    localStorage.setItem('adminProductForm', JSON.stringify(formData));
  }, [formData.price, formData.category, feeConfig]);

  // Persist form data and media to localStorage
  useEffect(() => {
    localStorage.setItem('adminProductForm', JSON.stringify(formData));
    localStorage.setItem('adminProductImages', JSON.stringify(imageFiles));
    localStorage.setItem('adminProductPreviews', JSON.stringify(imagePreviews));
    localStorage.setItem('adminProductVideos', JSON.stringify(videoFiles));
    localStorage.setItem('adminProductVideoPreviews', JSON.stringify(videoPreviews));
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

  // Form Validation
  const validateForm = () => {
    const newErrors = {};
    if (!formData.sellerName.trim()) newErrors.sellerName = 'Seller name is required.';
    if (!formData.sellerId) newErrors.sellerId = 'Seller ID is required.';
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
    return newErrors;
  };

  const validateLocationForm = () => {
    const newLocationErrors = {};
    if (!locationData.country) newLocationErrors.country = 'Country is required.';
    if (!locationData.state) newLocationErrors.state = 'State is required.';
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
      if (imageUrls.length === 0) {
        throw new Error('At least one image URL is required.');
      }
      const productData = {
        sellerName: formData.sellerName,
        sellerId: formData.sellerId,
        seller: { name: formData.sellerName, id: formData.sellerId },
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
        createdAt: new Date().toISOString(),
        reviews: [],
        buyerProtectionFee: fees.buyerProtectionFee,
        handlingFee: fees.handlingFee,
        totalEstimatedPrice: fees.totalEstimatedPrice,
        sellerEarnings: fees.sellerEarnings,
        manualSize: formData.manualSize || '',
        location: {
          country: locationData.country,
          state: locationData.state,
          city: locationData.city || '',
          address: locationData.address || '',
        },
        status: 'approved',
      };
      const docRef = await addDoc(collection(db, 'products'), productData);
      console.log('Product uploaded with ID:', docRef.id);
      setIsSuccessPopupOpen(true);
      setFormData({
        sellerName: '',
        sellerId: '',
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
      localStorage.removeItem('adminProductForm');
      localStorage.removeItem('adminLocationForm');
      localStorage.removeItem('adminProductImages');
      localStorage.removeItem('adminProductPreviews');
      localStorage.removeItem('adminProductVideos');
      localStorage.removeItem('adminProductVideoPreviews');
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
      <div className="flex-1 ml-0 md:ml-64 p-6">
        <div className="max-w-8xl rounded-xl mx-auto bg-white p-8">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
            Upload Product for Seller
          </h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Seller Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-user text-blue-500"></i>
                Seller Information
              </h3>
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Seller Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.sellerName || 'No seller selected'}
                  readOnly
                  className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100 ${
                    errors.sellerId ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.sellerId && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <i className="bx bx-error-circle"></i>
                    {errors.sellerId}
                  </p>
                )}
              </div>
            </div>
            {/* Media Upload Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-image-add text-blue-500"></i>
                Product Media
              </h3>
              <div
                ref={dropZoneRef}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                // className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg text-center mb-4"
              >
                <p className="text-gray-600 text-sm dark:text-gray-300">
                  Drag and drop images here or click to upload (Max {MAX_IMAGES} images, 5MB each)
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileInputChange}
                  accept="image/*"
                  multiple
                  className="hidden"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-2 px-4 mt-4 m-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  Select Images
                </button>
                <input
                  type="file"
                  ref={singleImageInputRef}
                  onChange={handleSingleImageInputChange}
                  accept="image/*"
                  className="hidden"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => singleImageInputRef.current?.click()}
                  className="py-2 px-4 mt-4 m-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  Upload Single Image
                </button>
              </div>
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index}`}
                        className="w-full h-32 object-cover rounded-lg shadow-sm cursor-pointer"
                        onClick={() => setZoomedMedia({ src: preview, type: 'image' })}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={loading}
                      >
                        <i className="bx bx-x"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {errors.images && (
                <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                  <i className="bx bx-error-circle"></i>
                  {errors.images}
                </p>
              )}
              <div className="mt-4">
                <p className="text-gray-600 dark:text-gray-300">
                  Upload a video (Max {MAX_VIDEOS}, 10MB, 30s, no audio)
                </p>
                <input
                  type="file"
                  ref={videoInputRef}
                  onChange={handleVideoChange}
                  accept="video/*"
                  className="hidden"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className="mt-2 m-2 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  Select Video
                </button>
              </div>
              {videoPreviews.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                  {videoPreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <video
                        src={preview}
                        className="w-full h-32 object-cover rounded-lg shadow-sm cursor-pointer"
                        onClick={() => setZoomedMedia({ src: preview, type: 'video' })}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(index)}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                        disabled={loading}
                      >
                        <i className="bx bx-x"></i>
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {errors.videos && (
                <p className="text-red-600 text-xs mt-2 flex items-center gap-1">
                  <i className="bx bx-error-circle"></i>
                  {errors.videos}
                </p>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-detail text-blue-500"></i>
                Product Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Product Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g., GINSENG COFFEE"
                    className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                    disabled={loading}
                  />
                  {errors.name && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.name}
                    </p>
                  )}
                </div>
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Category <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                    className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.category ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex justify-between items-center`}
                    disabled={loading}
                  >
                    <span>{formData.category || 'Select a category'}</span>
                    <i className="bx bx-chevron-down text-gray-500 dark:text-gray-400"></i>
                  </button>
                  {showCategoryDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md max-h-40 overflow-y-auto">
                      {categories.map((category) => (
                        <button
                          key={category}
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              category,
                              subcategory: '',
                              subSubcategory: '',
                              sizes: [],
                            }));
                            setShowCategoryDropdown(false);
                          }}
                          className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-100"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  )}
                  {errors.category && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.category}
                    </p>
                  )}
                </div>
                {formData.category && customSubcategories[formData.category]?.length > 0 && (
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Subcategory
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowSubcategoryDropdown(!showSubcategoryDropdown)}
                      className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.subcategory ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex justify-between items-center`}
                      disabled={loading}
                    >
                      <span>{formData.subcategory || 'Select a subcategory'}</span>
                      <i className="bx bx-chevron-down text-gray-500 dark:text-gray-400"></i>
                    </button>
                    {showSubcategoryDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md max-h-40 overflow-y-auto">
                        {customSubcategories[formData.category].map((subcategory) => (
                          <button
                            key={subcategory}
                            type="button"
                            onClick={() => {
                              setFormData((prev) => ({
                                ...prev,
                                subcategory,
                                subSubcategory: '',
                                sizes: [],
                              }));
                              setShowSubcategoryDropdown(false);
                            }}
                            className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-100"
                          >
                            {subcategory}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                {formData.subcategory &&
                  customSubSubcategories[formData.category]?.[formData.subcategory]?.length > 0 && (
                    <div className="relative group">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Sub-subcategory
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowSubSubcategoryDropdown(!showSubSubcategoryDropdown)}
                        className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                          errors.subSubcategory ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 flex justify-between items-center`}
                        disabled={loading}
                      >
                        <span>{formData.subSubcategory || 'Select a sub-subcategory'}</span>
                        <i className="bx bx-chevron-down text-gray-500 dark:text-gray-400"></i>
                      </button>
                      {showSubSubcategoryDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md max-h-40 overflow-y-auto">
                          {customSubSubcategories[formData.category][formData.subcategory].map(
                            (subSubcategory) => (
                              <button
                                key={subSubcategory}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({
                                    ...prev,
                                    subSubcategory,
                                    sizes: [],
                                  }));
                                  setShowSubSubcategoryDropdown(false);
                                }}
                                className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-100"
                              >
                                {subSubcategory}
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>
                  )}
              </div>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Description <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <button
                    type="button"
                    onClick={() => applyFormatting('bold')}
                    className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    title="Bold"
                    disabled={loading}
                  >
                    <i className="bx bx-bold"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('italic')}
                    className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    title="Italic"
                    disabled={loading}
                  >
                    <i className="bx bx-italic"></i>
                  </button>
                  <button
                    type="button"
                    onClick={() => applyFormatting('code')}
                    className="p-2 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600"
                    title="Code"
                    disabled={loading}
                  >
                    <i className="bx bx-code"></i>
                  </button>
                </div>
                <textarea
                  ref={descriptionRef}
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Describe the product..."
                  className={`w-full h-32 py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                    errors.description ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                  disabled={loading}
                />
                {formData.description && (
                  <div
                    className="mt-2 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg text-gray-800 dark:text-gray-100 prose dark:prose-invert max-w-none"
                    dangerouslySetInnerHTML={{ __html: descriptionPreview }}
                  />
                )}
                {errors.description && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <i className="bx bx-error-circle"></i>
                    {errors.description}
                  </p>
                )}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-money text-blue-500"></i>
                Pricing & Stock
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Price (NGN) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price}
                    onChange={handleChange}
                    placeholder="e.g., 29500"
                    className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.price ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Stock Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    placeholder="e.g., 46"
                    className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.stock ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                    } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                    disabled={loading}
                  />
                  {errors.stock && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      {errors.stock}
                    </p>
                  )}
                </div>
              </div>
              {fees.totalEstimatedPrice > 0 && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Buyer Protection Fee: ₦{fees.buyerProtectionFee.toFixed(2)}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Handling Fee: ₦{fees.handlingFee.toFixed(2)}
                  </p>
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
                    Total Estimated Price: ₦{fees.totalEstimatedPrice.toFixed(2)}
                  </p>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    Seller Earnings: ₦{fees.sellerEarnings.toFixed(2)}
                  </p>
                </div>
              )}
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-palette text-blue-500"></i>
                Colors
              </h3>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Colors <span className="text-red-500">*</span>
              </label>
              <div className="relative mt-2">
                <input
                  type="text"
                  value={customColor}
                  onChange={handleColorInputChange}
                  onKeyDown={handleCustomColorAdd}
                  placeholder="Type a color (e.g., Brown) and press Enter"
                  className={`w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                    errors.colors ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
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
                          className="inline-block w-4 h-4 rounded-full"
                          style={{ backgroundColor: color.hex }}
                        ></span>
                        {color.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* <div className="flex flex-wrap gap-2 mt-2">
                {availableColors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    onClick={() => handleColorToggle(color.name)}
                    className={`px-3 py-1 rounded-lg border text-sm transition-colors shadow-sm ${
                      formData.colors.includes(color.name)
                        ? 'border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading}
                  >
                    <span
                      className="inline-block w-4 h-4 rounded-full mr-2"
                      style={{ backgroundColor: color.hex }}
                    ></span>
                    {color.name}
                  </button>
                ))}
              </div> */}
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.colors.map((color) => (
                  <div
                    key={color}
                    className="flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs shadow-sm"
                  >
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
                ))}
              </div>
              {errors.colors && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <i className="bx bx-error-circle"></i>
                  {errors.colors}
                </p>
              )}
            </div>
            {(formData.category === 'Clothing' || formData.category === 'Footwear' || formData.category === 'Perfumes') &&
              formData.subcategory && (
                <div>
                  <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                    <i className="bx bx-ruler text-blue-500"></i>
                    Sizes
                  </h3>
                  <div className="relative mt-2">
                    <input
                      type="text"
                      onKeyDown={handleCustomSizeAdd}
                      placeholder="Type a size and press Enter"
                      className={`w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                        errors.sizes ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                      } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
                      disabled={loading}
                    />
                  </div>
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
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-package text-blue-500"></i>
                Product Size
              </h3>
              <div className="relative group">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Manual Size
                </label>
                <select
                  name="manualSize"
                  value={formData.manualSize}
                  onChange={handleChange}
                  className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                    errors.manualSize ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100`}
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
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-purchase-tag text-blue-500"></i>
                Tags
              </h3>
              <div className="flex flex-wrap gap-2 mt-2">
                {authenticityTags.concat(suggestedTags).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleTagToggle(tag)}
                    className={`px-3 py-1 rounded-lg border text-sm transition-colors shadow-sm ${
                      formData.tags.includes(tag)
                        ? 'border-blue-500 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={loading}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
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
                    >
                      <i className="bx bx-x"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
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
            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/admin/users')}
                className="py-2 px-4 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <i className="bx bx-loader bx-spin"></i>
                    Uploading...
                  </>
                ) : (
                  <>
                    <i className="bx bx-upload"></i>
                    Upload Product
                  </>
                )}
              </button>
            </div>
          </form>
          {uploadProgress > 0 && (
            <div className="mt-4">
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Upload Progress: {uploadProgress}%
              </p>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${uploadProgress}%` }}
                ></div>
              </div>
            </div>
          )}
          {isSuccessPopupOpen && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
              <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
                  <i className="bx bx-check-circle text-green-500"></i>
                  Success
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  Product has been successfully uploaded for {formData.sellerName}.
                </p>
                <div className="flex justify-end gap-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsSuccessPopupOpen(false);
                      navigate('/admin/users');
                    }}
                    className="py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Back to Users
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSuccessPopupOpen(false);
                      setCurrentStep(1);
                    }}
                    className="py-2 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Upload Another Product
                  </button>
                </div>
              </div>
            </div>
          )}
          {zoomedMedia && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
              <div className="relative max-w-4xl w-full">
                {zoomedMedia.type === 'image' ? (
                  <img
                    src={zoomedMedia.src}
                    alt="Zoomed media"
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
                  type="button"
                  onClick={() => setZoomedMedia(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                >
                  <i className="bx bx-x text-xl"></i>
                </button>
              </div>
            </div>
          )}
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        </div>
        {/* Stepper */}
        <div className="fixed top-4 right-4 md:static md:mt-6 max-w-4xl mx-auto">
          <div className="flex items-center gap-2 md:gap-4 bg-white dark:bg-gray-800 p-2 rounded-lg shadow-md">
            {steps.map((step) => (
              <div key={step.key} className="flex items-center">
                <button
                  type="button"
                  onClick={() => handleStepClick(step.key)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                    currentStep === step.key
                      ? 'bg-blue-600 text-white'
                      : isSectionComplete(step.key)
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                  } ${currentStep < step.key ? 'cursor-not-allowed' : ''}`}
                  disabled={currentStep < step.key || loading}
                >
                  {isSectionComplete(step.key) ? (
                    <i className="bx bx-check"></i>
                  ) : (
                    step.key
                  )}
                </button>
                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300 hidden md:block">
                  {step.label}
                </span>
                {step.key < steps.length && (
                  <div
                    className={`h-1 w-6 md:w-12 ${
                      isSectionComplete(step.key) ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                  ></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}