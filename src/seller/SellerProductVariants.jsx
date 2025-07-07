import { useState, useEffect, useRef, useCallback } from 'react';

const MAX_VARIANT_IMAGES = 4;

// Custom debounce function
const debounce = (func, wait) => {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export default function SellerProductVariants({
  variants = [],
  setVariants,
  sizes,
  errors,
  loading,
  variantImageFiles,
  setVariantImageFiles,
  variantImagePreviews,
  setVariantImagePreviews,
  dropZoneRefs,
  fileInputRefs,
  addAlert,
  maxVariantImages = MAX_VARIANT_IMAGES,
}) {
  const [localVariants, setLocalVariants] = useState(variants);
  const [zoomedMedia, setZoomedMedia] = useState(null);
  const isAddingRef = useRef(false); // Prevent multiple rapid addVariant calls

  // Sync localVariants with variants and initialize refs
  useEffect(() => {
    setLocalVariants(variants || []);
    // Ensure refs are initialized for each variant
    dropZoneRefs.current = Array(variants.length)
      .fill()
      .map((_, i) => dropZoneRefs.current[i] || { current: null });
    fileInputRefs.current = Array(variants.length)
      .fill()
      .map((_, i) => fileInputRefs.current[i] || { current: null });
  }, [variants, dropZoneRefs, fileInputRefs]);

  // Update parent state when localVariants change
  useEffect(() => {
    setVariants(localVariants);
  }, [localVariants, setVariants]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      variantImagePreviews.forEach((previews) =>
        previews.forEach((url) => URL.revokeObjectURL(url))
      );
    };
  }, [variantImagePreviews]);

  const addVariant = useCallback(
    debounce(() => {
      if (isAddingRef.current) return; // Prevent multiple executions
      isAddingRef.current = true;

      setLocalVariants((prev) => [
        ...prev,
        {
          color: '',
          size: sizes[0] || '', // Default to first size if available
          price: '',
          stock: '',
          images: [],
        },
      ]);
      setVariantImageFiles((prev) => [...prev, []]);
      setVariantImagePreviews((prev) => [...prev, []]);
      dropZoneRefs.current.push({ current: null });
      fileInputRefs.current.push({ current: null });

      setTimeout(() => {
        isAddingRef.current = false;
      }, 300); // Reset after debounce period
    }, 300),
    [sizes, setVariantImageFiles, setVariantImagePreviews]
  );

  const removeVariant = (index) => {
    setLocalVariants((prev) => prev.filter((_, i) => i !== index));
    setVariantImageFiles((prev) => prev.filter((_, i) => i !== index));
    setVariantImagePreviews((prev) => {
      const oldPreviews = prev[index] || [];
      oldPreviews.forEach((url) => URL.revokeObjectURL(url));
      return prev.filter((_, i) => i !== index);
    });
    dropZoneRefs.current.splice(index, 1);
    fileInputRefs.current.splice(index, 1);
  };

  const handleVariantChange = (index, field, value) => {
    setLocalVariants((prev) =>
      prev.map((variant, i) =>
        i === index ? { ...variant, [field]: value } : variant
      )
    );
  };

  const handleImageChange = (index, files) => {
    const newFiles = Array.from(files).filter(
      (file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );
    if ((variantImageFiles[index]?.length || 0) + newFiles.length > maxVariantImages) {
      addAlert(`Maximum ${maxVariantImages} images allowed per variant.`, 'error');
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
  };

  const handleRemoveImage = (variantIndex, imageIndex) => {
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
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRefs.current[index]?.current) {
      dropZoneRefs.current[index].current.classList.remove('border-blue-500');
    }
    handleImageChange(index, e.dataTransfer.files);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRefs.current[index]?.current) {
      dropZoneRefs.current[index].current.classList.add('border-blue-500');
    }
  };

  const handleDragLeave = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (dropZoneRefs.current[index]?.current) {
      dropZoneRefs.current[index].current.classList.remove('border-blue-500');
    }
  };

  return (
    <div className="mt-4 space-y-6">
      {localVariants.map((variant, index) => (
        <div
          key={index}
          className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg shadow-sm border border-gray-200 dark:border-gray-600"
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
              Variant Images (up to {maxVariantImages}) <span className="text-red-500">*</span>
              <i className="bx bx-info-circle text-gray-400 group-hover:text-blue-500 cursor-help" title={`Upload up to ${maxVariantImages} images (max 5MB each)`}></i>
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
                placeholder="Type a color (e.g., Navy Blue)"
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
                Size <span className="text-red-500">*</span>
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
                {sizes.map((size) => (
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

      {/* Zoomed Media Modal */}
      {zoomedMedia && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50">
          <div className="relative max-w-4xl w-full">
            <img
              src={zoomedMedia.src}
              alt="Zoomed"
              className="w-full h-auto rounded-lg shadow-lg max-h-[80vh] object-contain"
            />
            <button
              onClick={() => setZoomedMedia(null)}
              className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-md"
              title="Close"
              aria-label="Close zoomed image"
            >
              <i className="bx bx-x text-xl"></i>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}