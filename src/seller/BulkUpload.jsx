import React, { useState, useRef } from 'react';
import { auth } from '../firebase';
import { toast } from 'react-toastify';
import CustomAlert, { useAlerts } from '../components/common/CustomAlert';

const BulkUpload = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [templateDownloaded, setTemplateDownloaded] = useState(false);
  const fileInputRef = useRef(null);
  const { alerts, addAlert, removeAlert } = useAlerts();

  // Sample template structure
  const templateData = [
    {
      name: 'Sample Product 1',
      description: 'Product description here',
      price: 25000,
      category: 'Electronics',
      imageUrls: ['https://example.com/image1.jpg'],
      specifications: {
        brand: 'Brand Name',
        model: 'Model Number',
        color: 'Black'
      }
    }
  ];

  const downloadTemplate = () => {
    const csvContent = [
      'name,description,price,category,imageUrls,specifications',
      'Sample Product 1,Product description here,25000,Electronics,"https://example.com/image1.jpg","{""brand"":""Brand Name"",""model"":""Model Number"",""color"":""Black""}"'
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'bulk_upload_template.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setTemplateDownloaded(true);
    addAlert('Template downloaded successfully!', 'success');
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'text/csv' && file.type !== 'application/vnd.ms-excel') {
      addAlert('Please upload a CSV file', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csv = e.target.result;
        const lines = csv.split('\n');
        const headers = lines[0].split(',');
        
        const parsedProducts = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim()) {
            const values = lines[i].split(',');
            const product = {};
            
            headers.forEach((header, index) => {
              let value = values[index] || '';
              
              // Handle quoted values
              if (value.startsWith('"') && value.endsWith('"')) {
                value = value.slice(1, -1);
              }
              
              // Parse special fields
              if (header === 'price') {
                value = parseFloat(value) || 0;
              } else if (header === 'imageUrls') {
                value = value ? [value] : [];
              } else if (header === 'specifications') {
                try {
                  value = JSON.parse(value);
                } catch {
                  value = {};
                }
              }
              
              product[header] = value;
            });
            
            parsedProducts.push(product);
          }
        }
        
        setProducts(parsedProducts);
        addAlert(`${parsedProducts.length} products loaded successfully!`, 'success');
      } catch (error) {
        console.error('CSV parsing error:', error);
        addAlert('Error parsing CSV file. Please check the format.', 'error');
      }
    };
    
    reader.readAsText(file);
  };

  const validateProducts = () => {
    const errors = [];
    
    products.forEach((product, index) => {
      if (!product.name) {
        errors.push(`Product ${index + 1}: Name is required`);
      }
      if (!product.description) {
        errors.push(`Product ${index + 1}: Description is required`);
      }
      if (!product.price || product.price <= 0) {
        errors.push(`Product ${index + 1}: Valid price is required`);
      }
      if (!product.category) {
        errors.push(`Product ${index + 1}: Category is required`);
      }
    });
    
    return errors;
  };

  const handleBulkUpload = async () => {
    if (products.length === 0) {
      addAlert('Please upload products first', 'error');
      return;
    }

    if (products.length > 100) {
      addAlert('Maximum 100 products allowed per upload', 'error');
      return;
    }

    const validationErrors = validateProducts();
    if (validationErrors.length > 0) {
      addAlert(`Validation errors: ${validationErrors.join(', ')}`, 'error');
      return;
    }

    setUploading(true);
    try {
      const firebaseToken = await auth.currentUser?.getIdToken();
      if (!firebaseToken) {
        throw new Error('Authentication required');
      }

      const response = await fetch('/api/bulk-upload-products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${firebaseToken}`
        },
        body: JSON.stringify({ products })
      });

      const data = await response.json();
      
      if (response.ok) {
        addAlert(data.message || 'Bulk upload request submitted successfully!', 'success');
        setProducts([]);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } else {
        throw new Error(data.error || 'Failed to submit bulk upload');
      }
    } catch (error) {
      console.error('Bulk upload error:', error);
      addAlert(error.message || 'Failed to submit bulk upload', 'error');
    } finally {
      setUploading(false);
    }
  };

  const removeProduct = (index) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const updateProduct = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    setProducts(updatedProducts);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <CustomAlert alerts={alerts} removeAlert={removeAlert} />
        
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Bulk Product Upload</h1>
          <p className="text-gray-600 mt-2">Upload multiple products at once for faster inventory management</p>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-blue-900">Download Template</h3>
                <p className="text-sm text-blue-700">Get the CSV template to format your data correctly</p>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="mt-4 w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Download Template
            </button>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-green-900">Upload CSV</h3>
                <p className="text-sm text-green-700">Upload your formatted CSV file with product data</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="mt-4 w-full px-4 py-2 border border-green-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-purple-900">Submit for Review</h3>
                <p className="text-sm text-purple-700">Submit your products for admin approval</p>
              </div>
            </div>
            <button
              onClick={handleBulkUpload}
              disabled={uploading || products.length === 0}
              className="mt-4 w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {uploading ? 'Submitting...' : `Submit ${products.length} Products`}
            </button>
          </div>
        </div>

        {/* Products Preview */}
        {products.length > 0 && (
          <div className="bg-white rounded-lg shadow">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Products Preview ({products.length} products)
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {products.map((product, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={product.name || ''}
                          onChange={(e) => updateProduct(index, 'name', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Product name"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <textarea
                          value={product.description || ''}
                          onChange={(e) => updateProduct(index, 'description', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Product description"
                          rows="2"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="number"
                          value={product.price || ''}
                          onChange={(e) => updateProduct(index, 'price', parseFloat(e.target.value) || 0)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Price"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <input
                          type="text"
                          value={product.category || ''}
                          onChange={(e) => updateProduct(index, 'category', e.target.value)}
                          className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                          placeholder="Category"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => removeProduct(index)}
                          className="text-red-600 hover:text-red-900 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="mt-8 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-900 mb-4">Instructions</h3>
          <div className="text-sm text-yellow-800 space-y-2">
            <p>• Download the CSV template and fill in your product data</p>
            <p>• Ensure all required fields are filled (name, description, price, category)</p>
            <p>• Maximum 100 products per upload</p>
            <p>• All products will be reviewed by admin before approval</p>
            <p>• Image URLs should be publicly accessible</p>
            <p>• Specifications should be in valid JSON format</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkUpload; 