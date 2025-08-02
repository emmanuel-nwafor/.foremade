import React, { useState, useRef, useEffect } from 'react';
import { auth, db } from '../firebase';
import { toast } from 'react-toastify';
import CustomAlert, { useAlerts } from '../components/common/CustomAlert';
import { useAuth } from '../contexts/AuthContext';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import axios from 'axios';
import SellerSidebar from './SellerSidebar';

const CSV_FIELDS = [
  'name', 'description', 'price', 'stock', 'category', 'subcategory', 'colors', 'sizes', 'condition', 'tags', 'manualSize', 'imageUrls', 'videoUrl', 'country', 'state', 'city', 'address', 'specifications'
];

const BulkUpload = () => {
  const [products, setProducts] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [subcategories, setSubcategories] = useState({});
  const [sampleCSV, setSampleCSV] = useState('');
  const fileInputRef = useRef(null);
  const { alerts, addAlert, removeAlert } = useAlerts();
  const { userProfile } = useAuth();

  // Fetch categories and subcategories from Firestore
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catSnap = await getDocs(collection(db, 'categories'));
        const cats = catSnap.docs.map(doc => doc.data().name);
        setCategories(cats);
        const subcatSnap = await getDocs(collection(db, 'customSubcategories'));
        const subcatData = {};
        subcatSnap.forEach(doc => {
          subcatData[doc.id] = doc.data().subcategories || [];
        });
        setSubcategories(subcatData);
        // Generate CSV header with valid categories/subcategories
        let catSection = ['# VALID CATEGORIES & SUBCATEGORIES:'];
        cats.forEach(cat => {
          catSection.push(`# ${cat}: ${subcatData[cat]?.join(', ') || ''}`);
        });
        // Dynamically generate sample rows using valid categories/subcategories
        const sampleRows = [];
        let sampleCount = 0;
        for (const cat of cats) {
          const subcats = subcatData[cat] || [];
          if (subcats.length === 0) continue;
          for (const subcat of subcats) {
            if (sampleCount >= 5) break;
            sampleRows.push([
              `Sample Product ${sampleCount + 1}`,
              `Description for sample product ${sampleCount + 1}`,
              10000 + sampleCount * 1000,
              10 + sampleCount,
              cat,
              subcat,
              'Red|blue',
              'M|L',
              'New',
              'Sample|Demo',
              'Medium',
              'https://dummyphotos.com/sample1.jpg|https://dummyphotos.com/sample2.jpg',
              '',
              'Nigeria',
              'Lagos',
              'Ikeja',
              `${10 + sampleCount} Sample Address St`,
              '{"brand":"SampleBrand"}'
            ].join(','));
            sampleCount++;
            if (sampleCount >= 5) break;
          }
          if (sampleCount >= 5) break;
        }
        const csvLines = [
          '# INSTRUCTIONS:',
          ...catSection,
          '# - Do NOT change the column headers.',
          '# - Use only valid categories and subcategories as listed above.',
          '# - For multiple values (colors, sizes, tags, imageUrls), separate with | (pipe).',
          '# - Specifications must be valid JSON.',
          '# - Do not add extra columns or change the order.',
          '# - If unsure, download the latest template or check the category list in the product upload form.',
          CSV_FIELDS.join(','),
          ...sampleRows
        ];
        setSampleCSV(csvLines.join('\n'));
      } catch (err) {
        setSampleCSV('');
      }
    };
    fetchCategories();
  }, []);

  if (!userProfile && !userProfile.isProSeller) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow text-center max-w-md mx-auto">
          <h2 className="text-2xl font-bold mb-4 text-orange-600">Pro Seller Feature</h2>
          <p className="mb-4 text-gray-700">Bulk product upload is only available to Pro Sellers. Upgrade now to manage your inventory more efficiently!</p>
          <a href="/pro-seller-guide-full" className="inline-block px-6 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 font-semibold">Upgrade to Pro Seller</a>
          <div className="mt-6">
            <a href="/sell" className="inline-block px-5 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Return to Dashboard</a>
          </div>
        </div>
      </div>
    );
  }

  const downloadTemplate = () => {
    if (!sampleCSV) {
      toast.error('Categories are still loading. Please try again in a moment.');
      return;
    }
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    toast.success('Template downloaded successfully!');
  };

  const parseCSV = (csv) => {
    const lines = csv.split(/\r?\n/).filter(Boolean);
    const headers = lines[0].split(',');
    const products = [];
    for (let i = 1; i < lines.length; i++) {
      const values = [];
      let current = '';
      let inQuotes = false;
      for (let char of lines[i]) {
        if (char === '"') inQuotes = !inQuotes;
        else if (char === ',' && !inQuotes) { values.push(current); current = ''; }
        else current += char;
      }
      values.push(current);
      const product = {};
      headers.forEach((header, idx) => {
        let value = values[idx] || '';
        if (header === 'price' || header === 'stock') value = parseFloat(value) || 0;
        else if ([ 'colors', 'sizes', 'tags', 'imageUrls' ].includes(header)) value = value ? value.split('|').map(v => v.trim()).filter(Boolean) : [];
        else if (header === 'specifications') {
          try { value = value ? JSON.parse(value) : {}; } catch { value = {}; }
        } else value = value.trim();
        product[header] = value;
      });
      products.push(product);
    }
    return products;
  };

  // Helper to normalize for matching
  function normalize(str) {
    return (str || '').replace(/\s+/g, ' ').trim().toLowerCase();
  }
  // Helper to autofix case/spacing for categories and subcategories
  function findCaseInsensitiveMatch(value, validList) {
    const norm = normalize(value);
    return validList.find(v => normalize(v) === norm) || value;
  }
  // Helper to validate case-insensitive match
  function isValidMatch(value, validList) {
    const norm = normalize(value);
    return validList.some(v => normalize(v) === norm);
  }

  const handleFileUpload = (event) => {
    if (!categories.length || !Object.keys(subcategories).length) {
      toast.error('Categories are still loading. Please wait a moment and try again.');
      return;
    }
    const file = event.target.files[0];
    if (!file) return;
    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      toast.error('Please upload a CSV file');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = parseCSV(e.target.result);
        // Autofix category/subcategory case for each product
        const fixed = parsed.map(product => {
          const fixedCategory = findCaseInsensitiveMatch(product.category, categories);
          const validSubcats = subcategories[fixedCategory] || [];
          if (!subcategories[fixedCategory]) {
            console.warn(`Category "${fixedCategory}" not found in subcategories object`, subcategories);
          }
          const fixedSubcategory = findCaseInsensitiveMatch(product.subcategory, validSubcats);
          // Debug logs
          console.log('Categories:', categories);
          console.log('Subcategories:', subcategories);
          console.log('Product category:', product.category, '->', fixedCategory, 'subcategory:', product.subcategory, '->', fixedSubcategory);
          return { ...product, category: fixedCategory, subcategory: fixedSubcategory };
        });
        setProducts(fixed);
        toast.success(`${fixed.length} products loaded successfully!`);
      } catch (error) {
        toast.error('Error parsing CSV file. Please check the format.');
      }
    };
    reader.readAsText(file);
  };

  const validateProduct = (product) => {
    const errors = {};
    if (!product.name) errors.name = 'Name is required';
    if (!product.description) errors.description = 'Description is required';
    if (!product.price || product.price <= 0) errors.price = 'Valid price is required';
    if (!product.stock || product.stock < 0) errors.stock = 'Stock is required';
    if (!product.category) errors.category = 'Category is required';
    else if (!isValidMatch(product.category, categories)) errors.category = `Invalid category: "${product.category}". Valid: ${categories.join(', ')}`;
    if (!product.subcategory) errors.subcategory = 'Subcategory is required';
    else if (!isValidMatch(product.subcategory, subcategories[product.category] || [])) errors.subcategory = `Invalid subcategory: "${product.subcategory}". Valid: ${(subcategories[product.category] || []).join(', ')}`;
    if (!product.colors || product.colors.length === 0) errors.colors = 'At least one color is required';
    if (!product.imageUrls || product.imageUrls.length === 0) errors.imageUrls = 'At least one image is required';
    if (!product.country) errors.country = 'Country is required';
    if (!product.state) errors.state = 'State is required';
    return errors;
  };

  const [productErrors, setProductErrors] = useState([]);

  const handleFieldChange = (idx, field, value) => {
    setProducts((prev) => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  // Use the same uploadFile logic as single product upload
  const uploadFile = async (file, isVideo = false, setProgress) => {
    const uploadData = new FormData();
    uploadData.append('file', file);
    uploadData.append('isVideo', isVideo);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const response = await axios.post(`${backendUrl}/upload`, uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 60000,
        onUploadProgress: (progressEvent) => {
          if (setProgress) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setProgress(percentCompleted);
          }
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
      if (setProgress) setProgress(0);
    }
  };

  // Update handleImageChange to support files and URLs
  const handleImageChange = (idx, files) => {
    const fileArr = Array.from(files);
    setProducts((prev) => prev.map((p, i) => i === idx ? { ...p, imageFiles: fileArr, imageUrls: [] } : p));
  };
  // Add handleVideoChange
  const handleVideoChange = (idx, files) => {
    const file = files[0];
    setProducts((prev) => prev.map((p, i) => i === idx ? { ...p, videoFile: file, videoUrl: '' } : p));
  };

  const handleRemoveProduct = (idx) => {
    setProducts((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleBulkUpload = async () => {
    if (!categories.length || !Object.keys(subcategories).length) {
      toast.error('Categories are still loading. Please wait a moment and try again.');
      return;
    }
    // Autofix category/subcategory for all products before validation/upload
    const fixedProducts = products.map(product => {
      const fixedCategory = findCaseInsensitiveMatch(product.category, categories);
      const validSubcats = subcategories[fixedCategory] || [];
      if (!subcategories[fixedCategory]) {
        console.warn(`Category "${fixedCategory}" not found in subcategories object`, subcategories);
      }
      const fixedSubcategory = findCaseInsensitiveMatch(product.subcategory, validSubcats);
      // Debug logs
      console.log('Categories:', categories);
      console.log('Subcategories:', subcategories);
      console.log('Product category:', product.category, '->', fixedCategory, 'subcategory:', product.subcategory, '->', fixedSubcategory);
      return { ...product, category: fixedCategory, subcategory: fixedSubcategory };
    });
    // Validate all products
    const errorsArr = fixedProducts.map(validateProduct);
    setProductErrors(errorsArr);
    if (errorsArr.some(e => Object.keys(e).length > 0)) {
      toast.error('Please fix errors before submitting.');
      return;
    }
    setUploading(true);
    let successCount = 0;
    let errorCount = 0;
    let errorMessages = [];
    const user = auth.currentUser;
    const sellerId = user?.uid || userProfile?.uid || '';
    const sellerName = user?.displayName || userProfile?.displayName || userProfile?.name || '';
    try {
      // Upload images/videos for each product
      const productsWithUrls = await Promise.all(fixedProducts.map(async (product) => {
        let imageUrls = [];
        if (product.imageFiles && product.imageFiles.length > 0) {
          imageUrls = await Promise.all(product.imageFiles.map(file => uploadFile(file, false)));
        } else if (product.imageUrls && product.imageUrls.length > 0) {
          imageUrls = product.imageUrls;
        }
        let videoUrl = '';
        if (product.videoFile) {
          videoUrl = await uploadFile(product.videoFile, true);
        } else if (product.videoUrl) {
          videoUrl = product.videoUrl;
        }
        const cleanProduct = {
          ...product,
          imageUrls,
          videoUrl,
          sellerId,
          seller: { name: sellerName, id: sellerId },
          sellerName,
        };
        delete cleanProduct.imageFiles;
        delete cleanProduct.videoFile;
        return cleanProduct;
      }));
      // Add each product to Firestore
      for (const product of productsWithUrls) {
        try {
          await addDoc(collection(db, 'products'), product);
          successCount++;
        } catch (err) {
          errorCount++;
          errorMessages.push(product.name || 'Unnamed product');
          console.error('Failed to upload product:', product, err);
        }
      }
      if (successCount > 0) {
        toast.success(`${successCount} products uploaded successfully!`);
        setProducts([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
      if (errorCount > 0) {
        toast.error(`Failed to upload ${errorCount} products: ${errorMessages.join(', ')}`);
      }
    } catch (error) {
      toast.error(error.message || 'Failed to upload products');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-gray-50">
      <SellerSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-4 md:p-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row justify-between items-center gap-2">
            <a href="/sell" className="inline-block px-5 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 font-semibold">Return to Dashboard</a>
          </div>
          <CustomAlert alerts={alerts} removeAlert={removeAlert} />
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Bulk Product Upload</h1>
            <p className="text-gray-600 mt-2">Upload multiple products at once for faster inventory management</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Download Template Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-[#112d4e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-blue-900">Download Template</h3>
                  <p className="text-sm text-[#112d4e]">Get the CSV template to format your data correctly</p>
                </div>
              </div>
              <button
                onClick={downloadTemplate}
                className="mt-4 w-full px-4 py-2 bg-[#112d4e] text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Download Template
              </button>
            </div>
            {/* Upload CSV Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-blue-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-[#112d4e]">Upload CSV</h3>
                  <p className="text-sm text-[#112d4e]">Upload your formatted CSV file with product data</p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="mt-4 w-full px-4 py-2 border border-blue-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            {/* Submit for Review Card */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <svg className="w-6 h-6 text-[#112d4e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h3 className="text-lg font-semibold text-[#112d4e]">Submit for Review</h3>
                  <p className="text-sm text-[#112d4e]">Submit your products for admin approval</p>
                </div>
              </div>
              <button
                onClick={handleBulkUpload}
                disabled={uploading || products.length === 0}
                className="mt-4 w-full px-4 py-2 bg-[#112d4e] text-white rounded-md hover:bg-[#112d4e] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? 'Submitting...' : `Submit ${products.length} Products`}
              </button>
            </div>
          </div>
          {/* Products Preview & Edit */}
          {products.length > 0 && (
            <div className="space-y-6">
              {products.map((product, idx) => (
                <div key={idx} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row gap-4">
                  <div className="flex-1 space-y-2">
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700">Name *</label>
                        <input type="text" value={product.name || ''} onChange={e => handleFieldChange(idx, 'name', e.target.value)} className={`w-full border rounded px-2 py-1 text-sm ${productErrors[idx]?.name ? 'border-red-500' : 'border-gray-300'}`} />
                        {productErrors[idx]?.name && <div className="text-xs text-red-600">{productErrors[idx].name}</div>}
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700">Category *</label>
                        <input type="text" value={product.category || ''} onChange={e => handleFieldChange(idx, 'category', e.target.value)} className={`w-full border rounded px-2 py-1 text-sm ${productErrors[idx]?.category ? 'border-red-500' : 'border-gray-300'}`} />
                        {productErrors[idx]?.category && <div className="text-xs text-red-600">{productErrors[idx].category}</div>}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700">Description *</label>
                        <textarea value={product.description || ''} onChange={e => handleFieldChange(idx, 'description', e.target.value)} className={`w-full border rounded px-2 py-1 text-sm ${productErrors[idx]?.description ? 'border-red-500' : 'border-gray-300'}`} rows={2} />
                        {productErrors[idx]?.description && <div className="text-xs text-red-600">{productErrors[idx].description}</div>}
                      </div>
                      <div className="flex-1 flex flex-col gap-2">
                        <div>
                          <label className="block text-xs font-semibold text-gray-700">Price *</label>
                          <input type="number" value={product.price || ''} onChange={e => handleFieldChange(idx, 'price', e.target.value)} className={`w-full border rounded px-2 py-1 text-sm ${productErrors[idx]?.price ? 'border-red-500' : 'border-gray-300'}`} />
                          {productErrors[idx]?.price && <div className="text-xs text-red-600">{productErrors[idx].price}</div>}
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-700">Stock *</label>
                          <input type="number" value={product.stock || ''} onChange={e => handleFieldChange(idx, 'stock', e.target.value)} className={`w-full border rounded px-2 py-1 text-sm ${productErrors[idx]?.stock ? 'border-red-500' : 'border-gray-300'}`} />
                          {productErrors[idx]?.stock && <div className="text-xs text-red-600">{productErrors[idx].stock}</div>}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700">Colors *</label>
                        <input type="text" value={product.colors?.join(' | ') || ''} onChange={e => handleFieldChange(idx, 'colors', e.target.value.split('|').map(v => v.trim()).filter(Boolean))} className={`w-full border rounded px-2 py-1 text-sm ${productErrors[idx]?.colors ? 'border-red-500' : 'border-gray-300'}`} placeholder="e.g. Red | blue" />
                        {productErrors[idx]?.colors && <div className="text-xs text-red-600">{productErrors[idx].colors}</div>}
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700">Sizes</label>
                        <input type="text" value={product.sizes?.join(' | ') || ''} onChange={e => handleFieldChange(idx, 'sizes', e.target.value.split('|').map(v => v.trim()).filter(Boolean))} className="w-full border rounded px-2 py-1 text-sm" placeholder="e.g. S | M | L" />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700">Tags</label>
                        <input type="text" value={product.tags?.join(' | ') || ''} onChange={e => handleFieldChange(idx, 'tags', e.target.value.split('|').map(v => v.trim()).filter(Boolean))} className="w-full border rounded px-2 py-1 text-sm" placeholder="e.g. Audio | Portable" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700">Manual Size</label>
                        <input type="text" value={product.manualSize || ''} onChange={e => handleFieldChange(idx, 'manualSize', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700">Condition</label>
                        <input type="text" value={product.condition || ''} onChange={e => handleFieldChange(idx, 'condition', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" placeholder="e.g. New" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700">Subcategory</label>
                        <input type="text" value={product.subcategory || ''} onChange={e => handleFieldChange(idx, 'subcategory', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
                        {productErrors[idx]?.subcategory && <div className="text-xs text-red-600">{productErrors[idx].subcategory}</div>}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700">Country *</label>
                        <input type="text" value={product.country || ''} onChange={e => handleFieldChange(idx, 'country', e.target.value)} className={`w-full border rounded px-2 py-1 text-sm ${productErrors[idx]?.country ? 'border-red-500' : 'border-gray-300'}`} />
                        {productErrors[idx]?.country && <div className="text-xs text-red-600">{productErrors[idx].country}</div>}
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700">State *</label>
                        <input type="text" value={product.state || ''} onChange={e => handleFieldChange(idx, 'state', e.target.value)} className={`w-full border rounded px-2 py-1 text-sm ${productErrors[idx]?.state ? 'border-red-500' : 'border-gray-300'}`} />
                        {productErrors[idx]?.state && <div className="text-xs text-red-600">{productErrors[idx].state}</div>}
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700">City</label>
                        <input type="text" value={product.city || ''} onChange={e => handleFieldChange(idx, 'city', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
                      </div>
                      <div className="flex-1">
                        <label className="block text-xs font-semibold text-gray-700">Address</label>
                        <input type="text" value={product.address || ''} onChange={e => handleFieldChange(idx, 'address', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700">Specifications (JSON)</label>
                      <textarea value={typeof product.specifications === 'string' ? product.specifications : JSON.stringify(product.specifications || {})} onChange={e => handleFieldChange(idx, 'specifications', e.target.value)} className="w-full border rounded px-2 py-1 text-sm" rows={2} />
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 w-full md:w-64">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700">Images *</label>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {/* Show previews for uploaded files or URLs */}
                        {(product.imageFiles && product.imageFiles.length > 0
                          ? product.imageFiles.map((file, i) => (
                              file instanceof File
                                ? <img key={i} src={URL.createObjectURL(file)} alt="preview" className="w-16 h-16 object-cover rounded border" />
                                : null
                            ))
                          : product.imageUrls?.map((url, i) => (
                              typeof url === 'string' && url
                                ? <img key={i} src={url} alt="preview" className="w-16 h-16 object-cover rounded border" />
                                : null
                            ))
                        )}
                      </div>
                      <input type="file" accept="image/*" multiple onChange={e => handleImageChange(idx, e.target.files)} className="w-full" />
                      <input type="text" placeholder="Or paste image URLs separated by |" value={product.imageUrls?.join(' | ') || ''} onChange={e => handleFieldChange(idx, 'imageUrls', e.target.value.split('|').map(v => v.trim()).filter(Boolean))} className="w-full mt-1 text-xs border rounded px-2 py-1" />
                      {productErrors[idx]?.imageUrls && <div className="text-xs text-red-600">{productErrors[idx].imageUrls}</div>}
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700">Video</label>
                      {product.videoFile && <video src={URL.createObjectURL(product.videoFile)} controls className="w-full h-24 object-cover rounded mb-1" />}
                      {!product.videoFile && product.videoUrl && <video src={product.videoUrl} controls className="w-full h-24 object-cover rounded mb-1" />}
                      <input type="file" accept="video/*" onChange={e => handleVideoChange(idx, e.target.files)} className="w-full" />
                      <input type="text" placeholder="Or paste video URL" value={product.videoUrl || ''} onChange={e => handleFieldChange(idx, 'videoUrl', e.target.value)} className="w-full mt-1 text-xs border rounded px-2 py-1" />
                    </div>
                    <button onClick={() => handleRemoveProduct(idx)} type="button" className="mt-2 w-full px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-xs">Remove Product</button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {/* Instructions */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-4">Instructions</h3>
            <div className="text-sm text-blue-900 space-y-2">
              <p>• Download the CSV template and fill in your product data. Use <b>|</b> to separate multiple values (e.g. Red|blue for colors).</p>
              <p>• Ensure all required fields are filled (name, description, price, stock, category, colors, imageUrls, country, state).</p>
              <p>• Maximum 100 products per upload.</p>
              <p>• All products will be reviewed by admin before approval.</p>
              <p>• Image URLs should be publicly accessible, or you can upload images after CSV upload.</p>
              <p>• Specifications should be in valid JSON format.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload;