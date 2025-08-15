import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
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
  const addAlert = useCallback((message, type = 'info') => {
    const id = Date.now();
    setAlerts((prev) => [...prev, { id, message, type }]);
  }, []);
  const removeAlert = useCallback((id) => {
    setAlerts((prev) => prev.filter((alert) => alert.id !== id));
  }, []);
  return { alerts, addAlert, removeAlert };
}

export default function SellerProductVariants() {
  const navigate = useNavigate();
  const { alerts, addAlert, removeAlert } = useAlerts();

  // State for form data
  const [formData, setFormData] = useState({
    sellerName: '',
    name: '',
    description: '',
    category: '',
    subcategory: '',
    subSubcategory: '',
    colors: [],
    condition: 'New',
    productUrl: '',
    tags: [],
    manualSize: '',
  });

  // State for location data
  const [locationData, setLocationData] = useState({
    country: '',
    state: '',
    city: '',
    address: '',
  });

  // State for variants
  const [variants, setVariants] = useState([
    { color: '', size: '', price: '', stock: '', images: [] },
  ]);

  // State for media
  const [variantImageFiles, setVariantImageFiles] = useState([[]]);
  const [variantImagePreviews, setVariantImagePreviews] = useState([[]]);

  // Other states
  const [locationErrors, setLocationErrors] = useState({});
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
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const [customSubcategories, setCustomSubcategories] = useState({});
  const [customSubSubcategories, setCustomSubSubcategories] = useState({});
  const [suggestedTags, setSuggestedTags] = useState([]);
  const [zoomedMedia, setZoomedMedia] = useState(null);
  const [feeConfig, setFeeConfig] = useState(null);
  const [descriptionPreview, setDescriptionPreview] = useState('');

  // Refs
  const dropZoneRefs = useRef([]);
  const fileInputRefs = useRef([]);
  const descriptionRef = useRef(null);

  const MAX_VARIANT_IMAGES = 4;
  const availableColors = useMemo(
    () => [
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
    ],
    []
  );
  const menClothingSizes = useMemo(() => ['S', 'M', 'L', 'XL', 'XXL'], []);
  const womenClothingSizes = useMemo(() => ['3', '4', '6', '8', '10', '12', '14', '16', '18', '20'], []);
  const footwearSizes = useMemo(
    () => [
      '3"', '5"', '5.5"', '6"', '6.5"', '7"', '7.5"',
      '8"', '8.5"', '9"', '9.5"', '10"', '10.5"', '11"', '11.5"', '12"', '12.5"',
    ],
    []
  );
  const perfumeSizes = useMemo(() => ['30ml', '50ml', '60ml', '75ml', '100ml'], []);
  const manualSizes = useMemo(() => ['Small', 'Medium', 'Large', 'X-Large'], []);

  // Initialize refs for variants
  useEffect(() => {
    dropZoneRefs.current = Array(variants.length)
      .fill()
      .map(() => ({ current: null }));
    fileInputRefs.current = Array(variants.length)
      .fill()
      .map(() => ({ current: null }));
  }, [variants.length]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      variantImagePreviews.forEach((previews) =>
        previews.forEach((url) => URL.revokeObjectURL(url))
      );
    };
  }, [variantImagePreviews]);

  // Fetch categories and fees
  useEffect(() => {
    const unsubscribeCategories = onSnapshot(
      collection(db, 'categories'),
      (snapshot) => {
        const categoryList = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        setCategories(categoryList.map((cat) => cat.name));
      },
      (error) => {
        console.error('Error fetching categories:', error);
        addAlert('Failed to load categories.', 'error');
      }
    );

    const unsubscribeSubcategories = onSnapshot(
      collection(db, 'customSubcategories'),
      (snapshot) => {
        const subcatData = {};
        snapshot.forEach((doc) => {
          subcatData[doc.id] = doc.data().subcategories || [];
        });
        setCustomSubcategories(subcatData);
      },
      (error) => {
        console.error('Error fetching subcategories:', error);
        addAlert('Failed to load subcategories.', 'error');
      }
    );

    const unsubscribeSubSubcategories = onSnapshot(
      collection(db, 'customSubSubcategories'),
      (snapshot) => {
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
      },
      (error) => {
        console.error('Error fetching sub-subcategories:', error);
        addAlert('Failed to load sub-subcategories.', 'error');
      }
    );

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
  }, [addAlert]);

  // Validate category and subcategory selections
  useEffect(() => {
    if (formData.category && !categories.includes(formData.category)) {
      setFormData((prev) => ({ ...prev, category: '', subcategory: '', subSubcategory: '' }));
      addAlert('Selected category was removed by admin.', 'error');
    }
    if (formData.subcategory && !customSubcategories[formData.category]?.includes(formData.subcategory)) {
      setFormData((prev) => ({ ...prev, subcategory: '', subSubcategory: '' }));
      addAlert('Selected subcategory was removed by admin.', 'error');
    }
    if (
      formData.subSubcategory &&
      !customSubSubcategories[formData.category]?.[formData.subcategory]?.includes(formData.subSubcategory)
    ) {
      setFormData((prev) => ({ ...prev, subSubcategory: '' }));
      addAlert('Selected sub-subcategory was removed by admin.', 'error');
    }
  }, [categories, customSubcategories, customSubSubcategories, formData, addAlert]);

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

  const addVariant = useCallback(() => {
    const defaultSize = getSizeOptions().length > 0 ? getSizeOptions()[0] : '';
    setVariants((prev) => [
      ...prev,
      { color: '', size: defaultSize, price: '', stock: '', images: [] },
    ]);
    setVariantImageFiles((prev) => [...prev, []]);
    setVariantImagePreviews((prev) => [...prev, []]);
    dropZoneRefs.current.push({ current: null });
    fileInputRefs.current.push({ current: null });
  }, []);

  const removeVariant = useCallback((index) => {
    setVariants((prev) => prev.filter((_, i) => i !== index));
    setVariantImageFiles((prev) => prev.filter((_, i) => i !== index));
    setVariantImagePreviews((prev) => {
      const oldPreviews = prev[index] || [];
      oldPreviews.forEach((url) => URL.revokeObjectURL(url));
      return prev.filter((_, i) => i !== index);
    });
    dropZoneRefs.current.splice(index, 1);
    fileInputRefs.current.splice(index, 1);
  }, []);

  const handleVariantChange = useCallback((index, field, value) => {
    setVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      )
    );
  }, []);

  const handleImageChange = useCallback((index, files) => {
    const newFiles = Array.from(files).filter(
      (file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );
    if ((variantImageFiles[index]?.length || 0) + newFiles.length > MAX_VARIANT_IMAGES) {
      addAlert(`Maximum ${MAX_VARIANT_IMAGES} images allowed per variant.`, 'error');
      return;
    }
    setVariantImageFiles((prev) => {
      const newFilesArray = [...prev];
      newFilesArray[index] = [...(newFilesArray[index] || []), ...newFiles];
      return newFilesArray;
    });
    setVariantImagePreviews((prev) => {
      const newPreviews = [...prev];
      newPreviews[index] = [
        ...(newPreviews[index] || []),
        ...newFiles.map((file) => URL.createObjectURL(file)),
      ];
      return newPreviews;
    });
    if (fileInputRefs.current[index]?.current) {
      fileInputRefs.current[index].current.value = '';
    }
  }, [variantImageFiles, addAlert]);

  const handleRemoveImage = useCallback((variantIndex, imageIndex) => {
    setVariantImageFiles((prev) => {
      const newFiles = [...prev];
      newFiles[variantIndex] = newFiles[variantIndex].filter((_, i) => i !== imageIndex);
      return newFiles;
    });
    setVariantImagePreviews((prev) => {
      const newPreviews = [...prev];
      const oldUrl = newPreviews[variantIndex][imageIndex];
      newPreviews[variantIndex] = newPreviews[variantIndex].filter((_, i) => i !== imageIndex);
      URL.revokeObjectURL(oldUrl);
      return newPreviews;
    });
  }, []);

  const handleDrop = useCallback((e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRefs.current[index]?.current) {
      dropZoneRefs.current[index].current.classList.remove('border-blue-500');
    }
    handleImageChange(index, e.dataTransfer.files);
  }, [handleImageChange]);

  const handleDragOver = useCallback((e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRefs.current[index]?.current) {
      dropZoneRefs.current[index].current.classList.add('border-blue-500');
    }
  }, []);

  const handleDragLeave = useCallback((e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRefs.current[index]?.current) {
      dropZoneRefs.current[index].current.classList.remove('border-blue-500');
    }
  }, []);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'category' ? { subcategory: '', subSubcategory: '' } : {}),
      ...(name === 'subcategory' ? { subSubcategory: '' } : {}),
    }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  }, []);

  const handleColorToggle = useCallback((color) => {
    setFormData((prev) => {
      const newColors = prev.colors.includes(color)
        ? prev.colors.filter((c) => c !== color)
        : [...prev.colors, color];
      return { ...prev, colors: newColors };
    });
    setCustomColor('');
    setShowColorDropdown(false);
  }, []);

  const handleColorInputChange = useCallback((e) => {
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
  }, [availableColors]);

  const handleCustomColorAdd = useCallback((e) => {
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
  }, [customColor, addAlert]);

  const handleRemoveColor = useCallback((color) => {
    setFormData((prev) => ({
      ...prev,
      colors: prev.colors.filter((c) => c !== color),
    }));
  }, []);

  const handleTagToggle = useCallback((tag) => {
    setFormData((prev) => {
      const newTags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags: newTags };
    });
  }, []);

  const applyFormatting = useCallback((style) => {
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
  }, [formData.description]);

  const getSizeOptions = useMemo(() => {
    return () => {
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
  }, [formData.category, formData.subcategory, formData.subSubcategory]);


  // ============== Form validation ============== //
  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.sellerName.trim()) newErrors.sellerName = 'Please enter your full name.';
    if (!formData.name.trim()) newErrors.name = 'Product name is required.';
    if (!formData.category || !categories.includes(formData.category))
      newErrors.category = 'Select a valid category.';
    if (!formData.subcategory || !customSubcategories[formData.category]?.includes(formData.subcategory))
      newErrors.subcategory = 'You are free man.';
    if (
      customSubSubcategories[formData.category]?.[formData.subcategory]?.length > 0 &&
      !formData.subSubcategory
    )
      newErrors.subSubcategory = 'Select a sub-subcategory.';
    if (formData.colors.length === 0) newErrors.colors = 'Select at least one color.';
    if (!formData.manualSize) newErrors.manualSize = 'Please select a product size.';
    if (variants.length === 0) newErrors.variants = 'At least one variant is required.';

    variants.forEach((variant, index) => {
      if (!variant.color.trim()) {
        newErrors[`variant${index}_color`] = 'Color is required.';
      }
      if (!variant.size && getSizeOptions().length > 0) {
        newErrors[`variant${index}_size`] = 'Size is required.';
      }
      if (!variant.price || isNaN(variant.price) || parseFloat(variant.price) <= 0) {
        newErrors[`variant${index}_price`] = 'Enter a valid price greater than 0.';
      }
      if (!variant.stock || isNaN(variant.stock) || parseInt(variant.stock, 10) < 0) {
        newErrors[`variant${index}_stock`] = 'Enter a valid stock quantity (0 or more).';
      }
      if ((variantImageFiles[index]?.length || 0) === 0) {
        newErrors[`variant${index}_images`] = 'At least one image is required per variant.';
      }
    });

    return newErrors;
  }, [formData, variants, categories, customSubcategories, customSubSubcategories, variantImageFiles, getSizeOptions]);

  const validateLocationForm = useCallback(() => {
    const newLocationErrors = {};
    if (!locationData.country.trim()) newLocationErrors.country = 'Country is required.';
    if (!locationData.state.trim()) newLocationErrors.state = 'State is required.';
    return newLocationErrors;
  }, [locationData]);

  // ================ Closed form validation ================ //

  const uploadFile = useCallback(async (file) => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('isVideo', false);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/upload`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        },
      });
      if (response.status !== 200 || !response.data.url) {
        throw new Error('Failed to upload image to Cloudinary.');
      }
      return response.data.url;
    } catch (error) {
      throw new Error(
        error.code === 'ECONNABORTED'
          ? 'Request timed out. Please check your network or try again later.'
          : error.code === 'ERR_NETWORK'
          ? 'Cannot connect to server. Please check your network or server status.'
          : error.response?.data?.error || 'Failed to upload image.'
      );
    } finally {
      setUploadProgress(0);
    }
  }, []);

  const handleSubmit = useCallback(async (e) => {
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
      Object.entries(newErrors).forEach(([_, value]) => addAlert(value, 'error'));
      Object.entries(newLocationErrors).forEach(([_, value]) => addAlert(value, 'error'));
      return;
    }

    try {
      const variantImageUrls = await Promise.all(
        variantImageFiles.map(async (files) =>
          Promise.all(files.map((file) => uploadFile(file)))
        )
      );

      const basePrice = variants.reduce((min, variant) => {
        const price = parseFloat(variant.price);
        return isNaN(price) ? min : Math.min(min, price);
      }, Infinity);

      const productData = {
        sellerName: formData.sellerName,
        name: formData.name,
        description: formData.description || '',
        category: formData.category.toLowerCase(),
        subcategory: formData.subcategory || '',
        subSubcategory: formData.subSubcategory || '',
        colors: formData.colors,
        condition: formData.condition || 'New',
        productUrl: formData.productUrl || '',
        tags: formData.tags,
        sellerId: user.uid,
        seller: { name: formData.sellerName, id: user.uid },
        createdAt: new Date().toISOString(),
        reviews: [],
        variants: variants.map((variant, index) => ({
          ...variant,
          price: parseFloat(variant.price),
          stock: parseInt(variant.stock, 10),
          imageUrls: variantImageUrls[index] || [],
        })),
        location: {
          country: locationData.country,
          state: locationData.state,
          city: locationData.city || '',
          address: locationData.address || '',
        },
        buyerProtectionFee: feeConfig?.[formData.category]?.buyerProtectionRate * basePrice || 0,
        handlingFee: feeConfig?.[formData.category]?.handlingRate * basePrice || 0,
        totalEstimatedPrice:
          basePrice +
          (feeConfig?.[formData.category]?.buyerProtectionRate * basePrice || 0) +
          (feeConfig?.[formData.category]?.handlingRate * basePrice || 0),
        sellerEarnings: basePrice,
        manualSize: formData.manualSize,
      };

      const docRef = await addDoc(collection(db, 'products'), productData);
      console.log('Product with variants uploaded with ID:', docRef.id);
      setIsPopupOpen(true);
      setFormData({
        sellerName: '',
        name: '',
        description: '',
        category: '',
        subcategory: '',
        subSubcategory: '',
        colors: [],
        condition: 'New',
        productUrl: '',
        tags: [],
        manualSize: '',
      });
      setLocationData({
        country: '',
        state: '',
        city: '',
        address: '',
      });
      setVariants([{ color: '', size: '', price: '', stock: '', images: [] }]);
      setVariantImageFiles([[]]);
      setVariantImagePreviews([[]]);
      dropZoneRefs.current = [{ current: null }];
      fileInputRefs.current = [{ current: null }];
      setColorSuggestions([]);
      setShowColorDropdown(false);
      setShowCategoryDropdown(false);
      setShowSubcategoryDropdown(false);
      setShowSubSubcategoryDropdown(false);
    } catch (error) {
      console.error('Error uploading product:', error);
      addAlert(error.message || 'Failed to upload product variants.', 'error');
    } finally {
      setLoading(false);
    }
  }, [
    user,
    formData,
    locationData,
    variants,
    variantImageFiles,
    feeConfig,
    validateForm,
    validateLocationForm,
    uploadFile,
    addAlert,
    navigate,
  ]);

  const memoizedCategories = useMemo(() => categories, [categories]);
  const memoizedSubcategories = useMemo(
    () => customSubcategories[formData.category] || [],
    [customSubcategories, formData.category]
  );
  const memoizedSubSubcategories = useMemo(
    () => customSubSubcategories[formData.category]?.[formData.subcategory] || [],
    [customSubSubcategories, formData.category, formData.subcategory]
  );

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
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6 border-b-2 border-blue-500 pb-3 flex items-center gap-2">
            <i className="bx bx-package text-blue-500"></i>
            Add Product with Variants
          </h2>
          <form onSubmit={handleSubmit} className="space-y-8">
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
                    placeholder="e.g., Premium leather jacket with stylish stitching"
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

            {/* Category, Subcategory & Sub-Subcategory Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-category text-blue-500"></i>
                Category & Subcategory
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="relative group">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
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
                      disabled={loading || memoizedCategories.length === 0}
                    >
                      <span>{formData.category || 'Select a category'}</span>
                      <i className="bx bx-chevron-down text-gray-500 dark:text-gray-400"></i>
                    </button>
                    {showCategoryDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md max-h-40 overflow-y-auto">
                        {memoizedCategories.length === 0 ? (
                          <div className="p-2 text-sm text-gray-500 dark:text-gray-400">No categories available</div>
                        ) : (
                          memoizedCategories.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setFormData((prev) => ({ ...prev, category: cat, subcategory: '', subSubcategory: '' }));
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
                  {memoizedCategories.length === 0 && (
                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                      <i className="bx bx-error-circle"></i>
                      Loading categories...
                    </p>
                  )}
                </div>
                {formData.category && (
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Subcategory <span className="text-red-500">*</span>
                      <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select or type a subcategory"></i>
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={formData.subcategory}
                        onChange={(e) => {
                          setFormData((prev) => ({ ...prev, subcategory: e.target.value, subSubcategory: '' }));
                          setShowSubcategoryDropdown(true);
                        }}
                        onFocus={() => setShowSubcategoryDropdown(true)}
                        onBlur={() => setTimeout(() => setShowSubcategoryDropdown(false), 200)}
                        placeholder="Select or type a subcategory"
                        className={`w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                          errors.subcategory ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                        disabled={loading || !memoizedSubcategories.length}
                      />
                      {showSubcategoryDropdown && memoizedSubcategories.length > 0 && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md max-h-40 overflow-y-auto">
                          {memoizedSubcategories
                            .filter((subcat) => subcat.toLowerCase().includes(formData.subcategory.toLowerCase()))
                            .map((subcat) => (
                              <button
                                key={subcat}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, subcategory: subcat, subSubcategory: '' }));
                                  setShowSubcategoryDropdown(false);
                                }}
                                className="w-full text-left p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-100"
                              >
                                {subcat}
                              </button>
                            ))}
                        </div>
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
                {formData.subcategory && memoizedSubSubcategories.length > 0 && (
                  <div className="relative group">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Sub-Subcategory <span className="text-red-500">*</span>
                      <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select or type a sub-subcategory"></i>
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="text"
                        value={formData.subSubcategory}
                        onChange={(e) => setFormData((prev) => ({ ...prev, subSubcategory: e.target.value }))}
                        onFocus={() => setShowSubSubcategoryDropdown(true)}
                        onBlur={() => setTimeout(() => setShowSubSubcategoryDropdown(false), 200)}
                        placeholder="Select or type a sub-subcategory"
                        className={`w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                          errors.subSubcategory ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                        disabled={loading}
                      />
                      {showSubSubcategoryDropdown && (
                        <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md max-h-40 overflow-y-auto">
                          {memoizedSubSubcategories
                            .filter((subSubcat) => subSubcat.toLowerCase().includes(formData.subSubcategory.toLowerCase()))
                            .map((subSubcat) => (
                              <button
                                key={subSubcat}
                                type="button"
                                onClick={() => {
                                  setFormData((prev) => ({ ...prev, subSubcategory: subSubcat }));
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

            {/* Colors Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-color-fill text-blue-500"></i>
                Colors
              </h3>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                Colors <span className="text-red-500">*</span>
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
                        style={{ backgroundColor: predefinedColor ? predefinedColor.hex : '#ccc' }}
                      />
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
                  onFocus={() => customColor.trim() && setShowColorDropdown(true)}
                  onBlur={() => setTimeout(() => setShowColorDropdown(false), 200)}
                  placeholder="Type a color and press Enter (e.g., Navy)"
                  className={`w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                    errors.colors ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                  } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                  disabled={loading}
                />
                {showColorDropdown && colorSuggestions.length > 0 && (
                  <div className="absolute top-full left-0 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-md z-10 max-h-40 overflow-y-auto">
                    {colorSuggestions.map((color) => (
                      <button
                        key={color.name}
                        type="button"
                        onMouseDown={() => handleColorToggle(color.name)}
                        className="flex items-center w-full p-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm text-gray-800 dark:text-gray-100"
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                Tags (Optional)
                <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Add tags to improve product discoverability"></i>
              </label>
              <div className="relative mt-1">
                <input
                  type="text"
                  value={formData.tags.join(', ')}
                  onChange={(e) => {
                    const tags = e.target.value.split(',').map((tag) => tag.trim()).filter((tag) => tag);
                    setFormData((prev) => ({ ...prev, tags }));
                  }}
                  placeholder="e.g., Vintage, Leather, Smartphone"
                  className={`w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 border-gray-300 dark:border-gray-600 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                  disabled={loading}
                />
                {suggestedTags.length > 0 && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Suggested Tags:</p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {suggestedTags.map((tag) => (
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
                  </div>
                )}
              </div>
            </div>

            {/* Condition Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-star text-blue-500"></i>
                Condition
              </h3>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                Product Condition <span className="text-red-500">*</span>
                <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title="Select the condition of the product"></i>
              </label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['New', 'Used - Like New', 'Used - Good', 'Used - Fair'].map((condition) => (
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

            {/* Product Size Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-ruler text-blue-500"></i>
                Product Size
              </h3>
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

            {/* Variants Section */}
            <div>
              <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 mb-4 flex items-center gap-2">
                <i className="bx bx-list-plus text-blue-500"></i>
                Variants
              </h3>
              {errors.variants && (
                <p className="text-red-600 text-xs mb-2 flex items-center gap-1">
                  <i className="bx bx-error-circle"></i>
                  {errors.variants}
                </p>
              )}
              {variants.map((variant, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600 mb-4"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">
                      Variant {index + 1}
                    </h4>
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-500 hover:text-red-700"
                      disabled={loading}
                      aria-label={`Remove variant ${index + 1}`}
                    >
                      <i className="bx bx-trash text-lg"></i>
                    </button>
                  </div>

                  {/* Variant Image Upload */}
                  <div className="relative group mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-1">
                      Variant Images (up to {MAX_VARIANT_IMAGES}) <span className="text-red-500">*</span>
                      <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title={`Upload up to ${MAX_VARIANT_IMAGES} images (max 5MB each)`}></i>
                    </label>
                    <div
                      ref={(el) => (dropZoneRefs.current[index] = { current: el })}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDragLeave={(e) => handleDragLeave(e, index)}
                      className={`mt-1 w-full p-4 border-2 border-dashed rounded-lg flex flex-col items-center justify-center min-h-[150px] transition-colors ${
                        errors[`variant${index}_images`]
                          ? 'border-red-500'
                          : 'border-gray-300 hover:border-blue-500 dark:border-gray-600'
                      } ${loading ? 'opacity-50' : ''}`}
                    >
                      {(variantImagePreviews[index]?.length || 0) === 0 ? (
                        <div className="text-center">
                          <i className="bx bx-cloud-upload text-4xl text-gray-600 dark:text-gray-400"></i>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Drag and drop images or{' '}
                            <button
                              type="button"
                              onClick={() => fileInputRefs.current[index]?.current.click()}
                              className="text-blue-600 hover:underline"
                              disabled={loading}
                            >
                              select images
                            </button>
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                            (JPEG, JPG, PNG, WEBP, GIF, max 5MB each)
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3 w-full">
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
                                onClick={() => handleRemoveImage(index, imgIndex)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm"
                                disabled={loading}
                                title="Remove image"
                                aria-label={`Remove image ${imgIndex + 1} from variant ${index + 1}`}
                              >
                                <i className="bx bx-x text-sm"></i>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                      <input
                        ref={(el) => (fileInputRefs.current[index] = { current: el })}
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                        onChange={(e) => handleImageChange(index, e.target.files)}
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
                    {uploadProgress > 0 && (
                      <div className="mt-2 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className="bg-blue-600 h-2.5 rounded-full"
                          style={{ width: `${uploadProgress}%` }}
                        ></div>
                      </div>
                    )}
                  </div>

                  {/* Variant Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Color <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={variant.color}
                        onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                        placeholder="Type a color (e.g., Navy blue)"
                        className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                          errors[`variant${index}_color`]
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                        disabled={loading}
                      />
                      {errors[`variant${index}_color`] && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <i className="bx bx-error-circle"></i>
                          {errors[`variant${index}_color`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Size {getSizeOptions().length > 0 && <span className="text-red-500">*</span>}
                      </label>
                      <select
                        value={variant.size}
                        onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                        className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                          errors[`variant${index}_size`]
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                        disabled={loading}
                      >
                        <option value="">Select a size</option>
                        {getSizeOptions().map((size) => (
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
                    <div>
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
                          errors[`variant${index}_price`]
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
                        disabled={loading}
                      />
                      {errors[`variant${index}_price`] && (
                        <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                          <i className="bx bx-error-circle"></i>
                          {errors[`variant${index}_price`]}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                        Stock <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        value={variant.stock}
                        onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                        min="0"
                        placeholder="e.g., 10"
                        className={`mt-1 w-full py-2 px-3 border rounded-lg shadow-sm text-sm focus:outline-none focus:ring-2 ${
                          errors[`variant${index}_stock`]
                            ? 'border-red-500 focus:ring-red-500'
                            : 'border-gray-300 dark:border-gray-600 focus:ring-blue-500'
                        } bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 transition-all duration-200`}
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
                </div>
              ))}
              <button
                type="button"
                onClick={addVariant}
                className={`mt-4 py-2 px-4 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200 flex items-center gap-2 ${
                  loading ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                disabled={loading}
                aria-label="Add new variant"
              >
                <i className="bx bx-plus"></i>
                Add Variant
              </button>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-8">
              <button
                type="submit"
                className={`flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 transition-colors text-sm font-medium ${
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
                    <i className="bx bx-upload"></i>
                    Add Product with Variants
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Custom Alerts */}
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />

          {/* Success Popup */}
          <SellerProductUploadPopup
            isOpen={isPopupOpen}
            onClose={() => {
              setIsPopupOpen(false);
            }}
            message="Product variants uploaded successfully!"
            icon="bx-check-circle"
            type="success"
            showYesNoButtons={false}
          />

          {/* Zoomed Media Modal */}
          {zoomedMedia && (
            <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
              <div className="relative max-w-4xl w-full">
                <img
                  src={zoomedMedia.src}
                  alt="Zoomed media"
                  className="w-full h-auto max-h-[80vh] object-contain rounded-lg"
                />
                <button
                  onClick={() => setZoomedMedia(null)}
                  className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-md"
                  title="Close"
                >
                  <i className="bx bx-x text-xl"></i>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}