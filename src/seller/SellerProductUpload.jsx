import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { collection, addDoc, getDocs, setDoc, doc, getDoc } from 'firebase/firestore';
import axios from 'axios';
import SellerSidebar from './SellerSidebar';

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
          className={`p-3 rounded-md shadow-md ${
            alert.type === 'error' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
          }`}
        >
          {alert.message}
          <button
            onClick={() => removeAlert(alert.id)}
            className="ml-2 text-sm font-bold"
          >
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

  // State for form data (persisted in localStorage)
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

  // State for media files and previews (persisted in localStorage)
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
  const [customSubcategories, setCustomSubcategories] = useState({});
  const [customSubSubcategories, setCustomSubSubcategories] = useState({});
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [zoomedMedia, setZoomedMedia] = useState(null);
  const [feeConfig, setFeeConfig] = useState(null); // State for category-based fee configurations

  // Refs for file inputs
  const fileInputRef = useRef(null);
  const singleImageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Alert management
  const { alerts, addAlert, removeAlert } = useAlerts();

  // Categories from PDF
  const categories = [
    'Clothing',
    'Health & Beauty',
    'Perfumes',
    'Footwear',
    'Computers',
    'Phone & Tablet',
    'Watches',
    'Home & Garden',
    'Game & Fun',
    'Drinks & Containers',
    'Television & Sound',
    'Gadget & Accessories',
    'Children',
    'Power & Cables',
    'Refrigerator & Air Conditioning',
    'Car & Circle',
    'Jewellery & Accessories',
    'Sports & Outdoor',
  ];

  // Subcategories and Sub-Subcategories from PDF
  const defaultSubcategories = {
    'Clothing': ['Men', 'Women'],
    'Health & Beauty': ['General Use'],
    'Perfumes': ['Men', 'Women'],
    'Footwear': ['Men', 'Women'],
    'Computers': ['Desktop', 'Laptop', 'Handheld'],
    'Phone & Tablet': ['All Brands'],
    'Watches': ['Men', 'Women'],
    'Home & Garden': ['Indoor', 'Outdoor'],
    'Game & Fun': ['Console', 'Digital', 'Physical'],
    'Drinks & Containers': ['Empty Bottles', 'Alcoholic', 'Non-Alcoholic'],
    'Television & Sound': ['Flat Screen', 'Sound Systems'],
    'Gadget & Accessories': ['Air', 'Land'],
    'Children': ['Girls', 'Boys'],
    'Power & Cables': ['Power Generators', 'Cables'],
    'Refrigerator & Air Conditioning': ['Standing', 'Laying Units'],
    'Car & Circle': ['New', 'Used', 'Faulty'],
    'Jewellery & Accessories': ['Men', 'Women', 'New', 'Used', 'Refurbished'],
    'Sports & Outdoor': ['Men', 'Women', 'New', 'Used'],
  };

  const subSubcategories = {
    'Clothing': {
      'Men': ['New', 'Used', 'Vintage'],
      'Women': ['New', 'Used', 'Vintage'],
    },
    'Health & Beauty': {
      'General Use': ['Supplements', 'Creams', 'Body Wash - New', 'Body Wash - Used'],
    },
    'Perfumes': {
      'Men': ['Floral', 'Oriental', 'Woody', 'Fresh', 'Oil - 30ml', 'Oil - 50ml', 'Oil - 60ml', 'Oil - 75ml', 'Oil - 100ml'],
      'Women': ['Floral', 'Oriental', 'Woody', 'Fresh', 'Oil - 30ml', 'Oil - 50ml', 'Oil - 60ml', 'Oil - 75ml', 'Oil - 100ml'],
    },
    'Footwear': {
      'Men': ['New', 'Used', 'Vintage - Trainers', 'Boots', 'Shoes', 'Slippers'],
      'Women': ['New', 'Used', 'Vintage - Trainers', 'Boots', 'Shoes', 'Heels', 'Slippers'],
    },
    'Computers': {
      'Desktop': ['New', 'Used', 'Faulty'],
      'Laptop': ['New', 'Used', 'Faulty'],
      'Handheld': ['New', 'Used', 'Faulty'],
    },
    'Phone & Tablet': {
      'All Brands': ['New', 'Used', 'Refurbished', 'Faulty'],
    },
    'Watches': {
      'Men': ['Smart', 'Non-Smart - New', 'Used', 'Refurbished', 'Faulty'],
      'Women': ['Smart', 'Non-Smart - New', 'Used', 'Refurbished', 'Faulty'],
    },
    'Home & Garden': {
      'Indoor': ['Furniture', 'Kitchenware - New', 'Used', 'Refurbished', 'Faulty'],
      'Outdoor': ['Furniture', 'Gardening - New', 'Used', 'Refurbished', 'Faulty'],
    },
    'Game & Fun': {
      'Console': ['Standard', 'Mini - New', 'Used', 'Refurbished', 'Faulty'],
      'Digital': ['Standard', 'Mini - New', 'Used', 'Refurbished', 'Faulty'],
      'Physical': ['Snooker', 'Pool', 'Tennis', 'Ludo', 'Cards - New', 'Used', 'Refurbished', 'Faulty'],
    },
    'Drinks & Containers': {
      'Empty Bottles': ['Plastic', 'Carton', 'Glass - 6 Pack', '10 Pack', '12 Pack', '16 Pack', '18 Pack', '24 Pack'],
      'Alcoholic': ['Plastic', 'Carton', 'Glass - 6 Pack', '10 Pack', '12 Pack', '16 Pack', '18 Pack', '24 Pack'],
      'Non-Alcoholic': ['Plastic', 'Carton', 'Glass - 6 Pack', '10 Pack', '12 Pack', '16 Pack', '18 Pack', '24 Pack'],
    },
    'Television & Sound': {
      'Flat Screen': ['20-40"', '42-55"', '57-75"'],
      'Sound Systems': ['Sound Bar', 'Subwoofer', '3 or 5 Speakers', 'Mixers', 'BT Players'],
    },
    'Gadget & Accessories': {
      'Air': ['Audio Devices', 'Visual Gear', 'Tools'],
      'Land': ['Audio Devices', 'Visual Gear', 'Tools'],
    },
    'Children': {
      'Girls': ['Clothing', 'Footwear', 'Hair & Skin', 'Toys', 'Accessories'],
      'Boys': ['Clothing', 'Footwear', 'Hair & Skin', 'Toys', 'Accessories'],
    },
    'Power & Cables': {
      'Power Generators': ['5-10kW Generators'],
      'Cables': ['Cables up to 100m Reels'],
    },
    'Refrigerator & Air Conditioning': {
      'Standing': ['Fridge & Freezer', 'Fridge', 'Freezer', 'Standing AC', 'Split AC'],
      'Laying Units': ['Fridge & Freezer', 'Fridge', 'Freezer', 'Window AC', 'Split AC'],
    },
    'Car & Circle': {
      'New': ['Truck', 'Trailer', 'SUV', '4x4', 'Saloon', 'Bus', 'Coach', 'Tricycle', 'Moped', 'Power Bike', 'EV', 'Scooter', 'Motorcycle'],
      'Used': ['Truck', 'Trailer', 'SUV', '4x4', 'Saloon', 'Bus', 'Coach', 'Tricycle', 'Moped', 'Power Bike', 'EV', 'Scooter', 'Motorcycle'],
      'Faulty': ['Truck', 'Trailer', 'SUV', '4x4', 'Saloon', 'Bus', 'Coach', 'Tricycle', 'Moped', 'Power Bike', 'EV', 'Scooter', 'Motorcycle'],
    },
    'Jewellery & Accessories': {
      'Men': ['Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold', 'Bronze', 'Non-Metallic', 'Diamond', 'Emerald', 'Ruby', 'Amber', 'Jade'],
      'Women': ['Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold', 'Bronze', 'Non-Metallic', 'Diamond', 'Emerald', 'Ruby', 'Amber', 'Jade'],
      'New': ['Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold', 'Bronze', 'Non-Metallic', 'Diamond', 'Emerald', 'Ruby', 'Amber', 'Jade'],
      'Used': ['Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold', 'Bronze', 'Non-Metallic', 'Diamond', 'Emerald', 'Ruby', 'Amber', 'Jade'],
      'Refurbished': ['Gold', 'Silver', 'Platinum', 'Rose Gold', 'White Gold', 'Bronze', 'Non-Metallic', 'Diamond', 'Emerald', 'Ruby', 'Amber', 'Jade'],
    },
    'Sports & Outdoor': {
      'Men': ['Basketball', 'Speed Ball', 'Football Shoes', 'Swim Suits', 'Gym'],
      'Women': ['Basketball', 'Speed Ball', 'Football Shoes', 'Swim Suits', 'Gym'],
      'New': ['Basketball', 'Speed Ball', 'Football Shoes', 'Swim Suits', 'Gym'],
      'Used': ['Basketball', 'Speed Ball', 'Football Shoes', 'Swim Suits', 'Gym'],
    },
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

  const menClothingSizes = ['S', 'M', 'L', 'XL', 'XXL'];
  const womenClothingSizes = ['3', '4', '6', '8', '10', '12', '14', '16', '18', '20'];
  const footwearSizes = [
    '3"', '5"', '5.5"', '6"', '6.5"', '7"', '7.5"',
    '8"', '8.5"', '9"', '9.5"', '10"', '10.5"', '11"', '11.5"', '12"', '12.5"'
  ];
  const perfumeSizes = ['30ml', '50ml', '60ml', '75ml', '100ml'];
  const manualSizes = ['Small', 'Medium', 'Large', 'X-Large'];
  const authenticityTags = ['Verified', 'Original', 'Brand New', 'Authentic'];
  const MAX_IMAGES = 4;
  const MAX_VIDEOS = 1;
  const MAX_VIDEO_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_VIDEO_DURATION = 30; // 30 seconds

  // Fetch fee configurations from Firestore (category-based)
  useEffect(() => {
    const fetchFeeConfig = async () => {
      try {
        const docRef = doc(db, 'feeConfigurations', 'categoryFees');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFeeConfig(docSnap.data());
        } else {
          // Fallback to default fees if none exist in Firestore
          const defaultFees = categories.reduce((acc, cat) => ({
            ...acc,
            [cat]: { minPrice: 1000, maxPrice: Infinity, buyerProtectionRate: 0.08, handlingRate: 0.20 },
          }), {});
          await setDoc(docRef, defaultFees);
          setFeeConfig(defaultFees);
        }
      } catch (err) {
        console.error('Error fetching fee configurations:', err);
        addAlert('Failed to load fee configurations.', 'error');
      }
    };
    fetchFeeConfig();
  }, []);

  // Fetch and initialize subcategories and sub-subcategories from Firestore
  useEffect(() => {
    const fetchCustomCategories = async () => {
      try {
        const subcatSnapshot = await getDocs(collection(db, 'customSubcategories'));
        const subSubcatSnapshot = await getDocs(collection(db, 'customSubSubcategories'));
        const customSubs = {};
        const customSubSubcats = {};
        let hasSubcatData = false;
        let hasSubSubcatData = false;

        subcatSnapshot.forEach((doc) => {
          customSubs[doc.id] = doc.data().subcategories || [];
          if (doc.data().subcategories?.length > 0) hasSubcatData = true;
        });

        subSubcatSnapshot.forEach((doc) => {
          customSubSubcats[doc.id] = doc.data().subSubcategories || {};
          if (Object.keys(doc.data().subSubcategories || {}).length > 0) hasSubSubcatData = true;
        });

        // Initialize default subcategories and sub-subcategories if no data exists
        if (!hasSubcatData) {
          for (const [category, subcats] of Object.entries(defaultSubcategories)) {
            const subcatRef = doc(db, 'customSubcategories', category);
            await setDoc(subcatRef, { subcategories: subcats }, { merge: true });
            customSubs[category] = subcats;
          }
        }

        if (!hasSubSubcatData) {
          for (const [category, subcats] of Object.entries(subSubcategories)) {
            const subSubcatRef = doc(db, 'customSubSubcategories', category);
            await setDoc(subSubcatRef, { subSubcategories: subcats }, { merge: true });
            customSubSubcats[category] = subcats;
          }
        }

        setCustomSubcategories(customSubs);
        setCustomSubSubcategories(customSubSubcats);
      } catch (error) {
        console.error('Error fetching or initializing custom categories:', error);
        addAlert('Failed to load or initialize categories.', 'error');
      }
    };
    fetchCustomCategories();
  }, []);

  // Auto-suggest tags based on product name, description, and sub-subcategory
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

  // Detect if user is on mobile
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor || window.opera;
    const mobileRegex = /android|iphone|ipad|ipod|opera mini|mobile/i;
    setIsMobile(mobileRegex.test(userAgent));
  }, []);

  // Handle user authentication state
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

  // Calculate fees based on price and category-based fee configurations
  useEffect(() => {
    if (!feeConfig || !formData.category) return; // Wait until feeConfig and category are loaded

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
    const sellerEarnings = price; // Seller earnings are the original price

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

  const validateForm = () => {
    const newErrors = {};
    if (!formData.sellerName.trim()) newErrors.sellerName = 'Please enter your full name.';
    if (!formData.name.trim()) newErrors.name = 'Product name is required.';
    if (!formData.price || isNaN(formData.price) || formData.price <= 0)
      newErrors.price = 'Enter a valid price greater than 0.';
    if (!formData.stock || isNaN(formData.stock) || formData.stock < 0)
      newErrors.stock = 'Enter a valid stock quantity (0 or more).';
    if (!formData.category) newErrors.category = 'Select a category.';
    if (!formData.subcategory) newErrors.subcategory = 'Select a subcategory.';
    if (subSubcategories[formData.category]?.[formData.subcategory] && !formData.subSubcategory)
      newErrors.subSubcategory = 'Select a sub-subcategory.';
    if (imageFiles.length === 0) newErrors.images = 'At least one image is required.';
    if (imageFiles.length > MAX_IMAGES) newErrors.images = `Maximum ${MAX_IMAGES} images allowed.`;
    if (videoFiles.length > MAX_VIDEOS) newErrors.videos = `Maximum ${MAX_VIDEOS} video allowed.`;
    if (formData.colors.length === 0) newErrors.colors = 'Select at least one color.';
    if (
      formData.category === 'Clothing' && formData.subcategory && formData.sizes.length === 0
    ) {
      newErrors.sizes = 'Select or enter at least one size for clothing products.';
    }
    if (
      formData.category === 'Footwear' && formData.subcategory && formData.sizes.length === 0
    ) {
      newErrors.sizes = 'Select or enter at least one size for footwear products.';
    }
    if (
      formData.category === 'Perfumes' && formData.subcategory && formData.sizes.length === 0
    ) {
      newErrors.sizes = 'Select or enter at least one size for perfume products.';
    }
    if (!formData.manualSize) newErrors.manualSize = 'Please select a product size.';
    return newErrors;
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

  const saveCustomSubcategory = async (category, subcategory) => {
    try {
      const subcatRef = doc(db, 'customSubcategories', category);
      const existingSubs = customSubcategories[category] || [];
      if (!existingSubs.includes(subcategory)) {
        const updatedSubs = [...existingSubs, subcategory];
        await setDoc(subcatRef, { subcategories: updatedSubs }, { merge: true });
        setCustomSubcategories((prev) => ({
          ...prev,
          [category]: updatedSubs,
        }));
      }
    } catch (error) {
      console.error('Error saving custom subcategory:', error);
      addAlert('Failed to save custom subcategory.', 'error');
    }
  };

  const saveCustomSubSubcategory = async (category, subcategory, subSubcategory) => {
    try {
      const subSubcatRef = doc(db, 'customSubSubcategories', category);
      const existingSubSubcats = customSubSubcategories[category] || {};
      const existingSubs = existingSubSubcats[subcategory] || [];
      if (!existingSubs.includes(subSubcategory)) {
        const updatedSubSubcats = {
          ...existingSubSubcats,
          [subcategory]: [...existingSubs, subSubcategory],
        };
        await setDoc(subSubcatRef, { subSubcategories: updatedSubSubcats }, { merge: true });
        setCustomSubSubcategories((prev) => ({
          ...prev,
          [category]: updatedSubSubcats,
        }));
      }
    } catch (error) {
      console.error('Error saving custom sub-subcategory:', error);
      addAlert('Failed to save custom sub-subcategory.', 'error');
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

    const isExistingSubcategory = (customSubcategories[formData.category] || []).includes(formData.subcategory);
    if (!isExistingSubcategory) {
      await saveCustomSubcategory(formData.category, formData.subcategory);
    }

    const isExistingSubSubcategory = (customSubSubcategories[formData.category]?.[formData.subcategory] || []).includes(formData.subSubcategory);
    if (formData.subSubcategory && !isExistingSubSubcategory) {
      await saveCustomSubSubcategory(formData.category, formData.subcategory, formData.subSubcategory);
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
        manualSize: formData.manualSize,
      };

      const docRef = await addDoc(collection(db, 'products'), productData);
      console.log('Product saved to Firestore:', { id: docRef.id, ...productData });

      addAlert('Product uploaded successfully!', 'success');
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

  // Dynamic size options based on category and subcategory
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
                className={`mt-1 w-full h-full p-4 border-2 border-dashed rounded-md flex flex-col items-center justify-center min-h-[200px] transition-colors ${
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
                    <p className="text-xs text-gray-500 mt-1">
                      (JPEG, JPG, PNG, WEBP, GIF etc)
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full">
                    {imagePreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img
                          src={preview}
                          alt={`Preview ${index + 1}`}
                          className="w-full h-48 object-cover rounded-md border border-gray-200 cursor-pointer"
                          onClick={() => setZoomedMedia({ type: 'image', src: preview })}
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
                <p className="text-red-600 text-xs mt-1">{errors.images}</p>
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
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}
            </div>

            {/* Video Upload Section */}
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Product Video (1 video, Optional)
              </label>
              <div className="mt-1 w-full h-[300px] p-4 border-2 border-dashed rounded-md flex flex-col items-center justify-center min-h-[200px] border-gray-300 hover:border-blue-500 transition-colors">
                {videoPreviews.length === 0 ? (
                  <div className="text-center">
                    <i className="bx bx-video-plus text-5xl text-gray-600"></i>
                    <p className="text-sm text-gray-600 mt-1">
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
                    <p className="text-xs text-gray-500 mt-1">
                      (Supports multiple formats, max 10MB, under 30 seconds, no audio)
                    </p>
                  </div>
                ) : (
                  <div className="w-full">
                    {videoPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <video
                          src={preview}
                          controls
                          className="w-full h-[255px] object-cover rounded-md border border-gray-200 cursor-pointer md:w-full md:h-auto"
                          onClick={() => setZoomedMedia({ type: 'video', src: preview })}
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
                  accept="video/mp4,video/mkv,video/webm"
                  onChange={handleVideoChange}
                  className="hidden"
                  disabled={loading}
                />
              </div>
              {errors.videos && (
                <p className="text-red-600 text-xs mt-1">{errors.videos}</p>
              )}
              {uploadProgress > 0 && (
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2.5">
                  <div
                    className="bg-blue-600 h-2.5 rounded-full"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
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
                    placeholder="Enter your full name"
                    className="mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 border-gray-300 focus:ring-blue-500"
                    disabled
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
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">
                  Product Size <span className="text-red-500">*</span>
                </label>
                <select
                  name="manualSize"
                  value={formData.manualSize}
                  onChange={handleChange}
                  className={`mt-1 w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                    errors.manualSize
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-300 focus:ring-blue-500'
                  }`}
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
                  <p className="text-red-600 text-xs mt-1">{errors.manualSize}</p>
                )}
              </div>
              {fees.productSize && feeConfig && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Foremade Fees</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>Category: <span className="font-semibold">{fees.productSize}</span></p>
                    <p>Buyer Protection Fee ({(feeConfig[fees.productSize]?.buyerProtectionRate * 100).toFixed(2)}%): ₦{fees.buyerProtectionFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                    <p>Handling Fee ({(feeConfig[fees.productSize]?.handlingRate * 100).toFixed(2)}%): ₦{fees.handlingFee.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                    <p className="font-bold">
                      Total Estimated Price for Buyer: ₦{fees.totalEstimatedPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="font-bold text-green-600">
                      Your Estimated Earnings: ₦{fees.sellerEarnings.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-xs text-gray-500 mt-2">
                      Note: If shipping internationally (e.g., to the UK), you can add shipping costs.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Category, Subcategory & Sub-Subcategory Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 mb-4">Category & Subcategory</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                                setFormData((prev) => ({ ...prev, category: cat, subcategory: '', subSubcategory: '', sizes: [] }));
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
                      <input
                        type="text"
                        value={formData.subcategory}
                        onChange={(e) => setFormData((prev) => ({ ...prev, subcategory: e.target.value, subSubcategory: '', sizes: [] }))}
                        onFocus={() => setShowSubcategoryDropdown(true)}
                        onBlur={() => setTimeout(() => setShowSubcategoryDropdown(false), 200)}
                        placeholder="Select or type a subcategory"
                        className={`w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                          errors.subcategory
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        disabled={loading || Object.keys(customSubcategories).length === 0}
                      />
                      {showSubcategoryDropdown && customSubcategories[formData.category] && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                          {customSubcategories[formData.category]
                            .filter((subcat) =>
                              subcat.toLowerCase().includes(formData.subcategory.toLowerCase())
                            )
                            .map((subcat) => (
                              <div key={subcat} className="p-2 hover:bg-gray-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, subcategory: subcat, subSubcategory: '', sizes: [] }));
                                    setShowSubcategoryDropdown(false);
                                  }}
                                  className="w-full text-left"
                                >
                                  {subcat}
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                      {!customSubcategories[formData.category] && (
                        <p className="text-red-600 text-xs mt-1">Loading subcategories...</p>
                      )}
                      {errors.subcategory && (
                        <p className="text-red-600 text-xs mt-1">{errors.subcategory}</p>
                      )}
                    </div>
                  </div>
                )}
                {formData.subcategory && subSubcategories[formData.category]?.[formData.subcategory] && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Sub-Subcategory <span className="text-red-500">*</span>
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={formData.subSubcategory}
                        onChange={(e) => setFormData((prev) => ({ ...prev, subSubcategory: e.target.value, sizes: [] }))}
                        onFocus={() => setShowSubSubcategoryDropdown(true)}
                        onBlur={() => setTimeout(() => setShowSubSubcategoryDropdown(false), 200)}
                        placeholder="Select or type a sub-subcategory"
                        className={`w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                          errors.subSubcategory
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 focus:ring-blue-500'
                        }`}
                        disabled={loading || Object.keys(customSubSubcategories).length === 0}
                      />
                      {showSubSubcategoryDropdown && customSubSubcategories[formData.category]?.[formData.subcategory] && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                          {customSubSubcategories[formData.category][formData.subcategory]
                            .filter((subSubcat) =>
                              subSubcat.toLowerCase().includes(formData.subSubcategory.toLowerCase())
                            )
                            .map((subSubcat) => (
                              <div key={subSubcat} className="p-2 hover:bg-gray-100">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, subSubcategory: subSubcat, sizes: [] }));
                                    setShowSubSubcategoryDropdown(false);
                                  }}
                                  className="w-full text-left"
                                >
                                  {subSubcat}
                                </button>
                              </div>
                            ))}
                        </div>
                      )}
                      {!customSubSubcategories[formData.category]?.[formData.subcategory] && (
                        <p className="text-red-600 text-xs mt-1">Loading sub-subcategories...</p>
                      )}
                      {errors.subSubcategory && (
                        <p className="text-red-600 text-xs mt-1">{errors.subSubcategory}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sizes Section */}
            {(formData.category === 'Clothing' || formData.category === 'Footwear' || formData.category === 'Perfumes') && formData.subcategory && (
              <div>
                <h3 className="text-lg font-medium text-gray-700 mb-4">Sizes</h3>
                <label className="block text-sm font-medium text-gray-700">
                  Sizes <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {getSizeOptions().map((size) => (
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
                <div className="relative mt-2">
                  <input
                    type="text"
                    placeholder="Enter custom size (e.g., Size 35) and press Enter"
                    onKeyDown={handleCustomSizeAdd}
                    className={`w-full py-2 px-3 border rounded-md shadow-sm text-sm focus:outline-none focus:ring-2 ${
                      errors.sizes
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 focus:ring-blue-500'
                    }`}
                    disabled={loading}
                  />
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.sizes.map((size) => (
                    <div
                      key={size}
                      className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-full text-xs"
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
                  <p className="text-red-600 text-xs mt-1">{errors.sizes}</p>
                )}
              </div>
            )}

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
              {suggestedTags.length > 0 && (
                <div className="mt-2">
                  <p className="text-sm text-gray-600">Suggested Tags:</p>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {suggestedTags.map((tag) => (
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
                </div>
              )}
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

      {/* Zoomed Media Modal */}
      {zoomedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
          <div className="relative max-w-3xl max-h-[90vh] p-4 bg-white rounded-lg">
            {zoomedMedia.type === 'image' ? (
              <img
                src={zoomedMedia.src}
                alt="Zoomed"
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            ) : (
              <video
                src={zoomedMedia.src}
                controls
                className="w-full h-auto max-h-[80vh] object-contain"
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
  );
}