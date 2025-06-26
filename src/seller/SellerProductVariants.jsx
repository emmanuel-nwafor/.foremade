export default function SellerProductVariants({
  formData,
  setFormData,
  errors,
  setErrors,
  variantImageFiles,
  setVariantImageFiles,
  variantImagePreviews,
  setVariantImagePreviews,
  loading,
  isMobile,
  variantDropZoneRefs,
  variantFileInputRefs,
}) {
  const MAX_VARIANT_IMAGES = 4;

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

  const handleVariantImageChange = (index, files, isSingleUpload = false) => {
    const newFiles = Array.from(files);
    const validFiles = newFiles.filter(
      (file) => file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024
    );
    const totalImages = (variantImageFiles[index]?.length || 0) + validFiles.length;
    if (totalImages > MAX_VARIANT_IMAGES) {
      window.alert(`You can upload a maximum of ${MAX_VARIANT_IMAGES} images per variant.`);
      return;
    }
    if (isSingleUpload && validFiles.length > 1) {
      window.alert('Please upload one image at a time.');
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
    if (variantFileInputRefs.current[index]?.current) {
      variantFileInputRefs.current[index].current.value = '';
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
    if (variantImageFiles[variantIndex].length <= 1 && variantFileInputRefs.current[variantIndex]?.current) {
      variantFileInputRefs.current[variantIndex].current.value = '';
    }
  };

  const handleVariantDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (variantDropZoneRefs.current[index]?.current) {
      variantDropZoneRefs.current[index].current.classList.remove('border-blue-500');
    }
    handleVariantImageChange(index, e.dataTransfer.files);
  };

  const handleVariantDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (variantDropZoneRefs.current[index]?.current) {
      variantDropZoneRefs.current[index].current.classList.add('border-blue-500');
    }
  };

  const handleVariantDragLeave = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    if (variantDropZoneRefs.current[index]?.current) {
      variantDropZoneRefs.current[index].current.classList.remove('border-blue-500');
    }
  };

  return (
    <div>
      <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-4 flex items-center gap-2">
        <i className="bx bx-copy-alt text-blue-600"></i>
        Product Variants
      </h3>
      {formData.variants.map((variant, index) => (
        <div key={index} className="mb-6 p-5 border border-gray-200 dark:border-gray-600 rounded-xl shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-200">Variant {index + 1}</h4>
            {formData.variants.length > 1 && (
              <button
                type="button"
                onClick={() => handleRemoveVariant(index)}
                className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 text-sm transition-colors duration-200"
                disabled={loading}
              >
                Remove Variant
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="relative">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Color <span className="text-red-500">*</span>
              </label>
              <select
                value={variant.color}
                onChange={(e) => handleVariantChange(index, 'color', e.target.value)}
                className={`mt-2 w-full px-3 py-2 border rounded-md text-gray-800 dark:text-gray-200 focus:ring-2 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200 ${
                  errors[`variant${index}_color`]
                    ? 'border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-500'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
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
                <p className="text-red-600 dark:text-red-500 text-xs mt-1 flex items-center gap-1">
                  <i className="bx bx-error-circle"></i>
                  {errors[`variant${index}_color`]}
                </p>
              )}
            </div>
            <div className="relative">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Size <span className="text-red-500">*</span>
              </label>
              <select
                value={variant.size}
                onChange={(e) => handleVariantChange(index, 'size', e.target.value)}
                className={`mt-2 w-full px-3 py-2 border rounded-md text-gray-800 dark:text-gray-200 focus:ring-2 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200 ${
                  errors[`variant${index}_size`]
                    ? 'border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-500'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
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
                <p className="text-red-600 dark:text-red-500 text-xs mt-1 flex items-center gap-1">
                  <i className="bx bx-error-circle"></i>
                  {errors[`variant${index}_size`]}
                </p>
              )}
            </div>
            <div className="relative">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Price (₦) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={variant.price}
                onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                step="0.01"
                min="0"
                placeholder="e.g., 5000.00"
                className={`mt-2 w-full px-3 py-2 border rounded-md text-gray-800 dark:text-gray-200 focus:ring-2 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200 ${
                  errors[`variant${index}_price`]
                    ? 'border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-500'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                disabled={loading}
              />
              {errors[`variant${index}_price`] && (
                <p className="text-red-600 dark:text-red-500 text-xs mt-1 flex items-center gap-1">
                  <i className="bx bx-error-circle"></i>
                  {errors[`variant${index}_price`]}
                </p>
              )}
            </div>
            <div className="relative">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-200">
                Stock Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={variant.stock}
                onChange={(e) => handleVariantChange(index, 'stock', e.target.value)}
                min="0"
                placeholder="e.g., 10"
                className={`mt-2 w-full px-3 py-2 border rounded-md text-gray-800 dark:text-gray-200 focus:ring-2 focus:border-blue-500 dark:focus:ring-blue-400 dark:focus:border-blue-400 transition-all duration-200 ${
                  errors[`variant${index}_stock`]
                    ? 'border-red-500 focus:ring-red-500 dark:border-red-500 dark:focus:ring-red-500'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
                disabled={loading}
              />
              {errors[`variant${index}_stock`] && (
                <p className="text-red-600 dark:text-red-500 text-xs mt-1 flex items-center gap-1">
                  <i className="bx bx-error-circle"></i>
                  {errors[`variant${index}_stock`]}
                </p>
              )}
            </div>
          </div>
          <div className="mt-6 relative group">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-200 flex items-center gap-1">
              Variant Images (up to {MAX_VARIANT_IMAGES}) <span className="text-red-500">*</span>
              <i className="bx bx-info-circle text-blue-400 group-hover:text-blue-500 dark:text-blue-300 dark:group-hover:text-blue-400 cursor-pointer" title={`Upload up to ${MAX_VARIANT_IMAGES} images for this variant (JPEG, PNG, etc.)`} />
            </label>
            <div
              ref={variantDropZoneRefs.current[index]}
              onDrop={(e) => handleVariantDrop(e, index)}
              onDragOver={(e) => handleVariantDragOver(e, index)}
              onDragLeave={(e) => handleVariantDragLeave(e, index)}
              className={`mt-2 w-full p-6 border-2 border-dashed rounded-lg flex flex-col items-center justify-center min-h-[200px] transition-all duration-200 ${
                errors[`variant${index}_images`]
                  ? 'border-red-500'
                  : 'border-gray-300 hover:border-blue-600 dark:border-gray-600 dark:hover:border-blue-400'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {variantImagePreviews[index]?.length === 0 ? (
                <div className="text-center">
                  <i className="bx bx-cloud-upload text-5xl text-blue-500 dark:text-blue-400"></i>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {isMobile ? (
                      <>
                        <button
                          type="button"
                          onClick={() => variantFileInputRefs.current[index]?.current.click()}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                          disabled={loading}
                        >
                          Upload one image
                        </button>
                        {' or '}
                        <button
                          type="button"
                          onClick={() => variantFileInputRefs.current[index]?.current.click()}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
                          disabled={loading}
                        >
                          select up to {MAX_VARIANT_IMAGES} images
                        </button>
                      </>
                    ) : (
                      <>
                        Drag and drop up to {MAX_VARIANT_IMAGES} images or{' '}
                        <button
                          type="button"
                          onClick={() => variantFileInputRefs.current[index]?.current.click()}
                          className="text-blue-600 dark:text-blue-400 hover:underline"
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
                <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 w-full">
                  {variantImagePreviews[index].map((preview, imgIndex) => (
                    <div key={imgIndex} className="relative group">
                      <img
                        src={preview}
                        alt={`Variant ${index + 1} Preview ${imgIndex + 1}`}
                        className="w-full h-24 object-cover rounded-md border border-gray-200 dark:border-gray-600 cursor-pointer shadow-sm group-hover:opacity-90 transition-opacity duration-200"
                        onClick={() => window.setZoomedMedia({ type: 'image', src: preview })}
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveVariantImage(index, imgIndex)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"
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
                ref={variantFileInputRefs.current[index]}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,image/gif"
                onChange={(e) => handleVariantImageChange(index, e.target.files, isMobile)}
                className="hidden"
                disabled={loading}
                multiple={!isMobile}
              />
            </div>
            {errors[`variant${index}_images`] && (
              <p className="text-red-600 dark:text-red-500 text-xs mt-2 flex items-center gap-1">
                <i className="bx bx-error-circle"></i>
                {errors[`variant${index}_images`]}
              </p>
            )}
            {isMobile && variantImagePreviews[index]?.length > 0 && variantImagePreviews[index].length < MAX_VARIANT_IMAGES && (
              <button
                type="button"
                onClick={() => variantFileInputRefs.current[index]?.current.click()}
                className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                disabled={loading}
              >
                Add another image
              </button>
            )}
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={handleAddVariant}
        className="mt-4 text-sm text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
        disabled={loading}
      >
        <i className="bx bx-plus-circle"></i>
        Add Another Variant
      </button>
    </div>
  );
}
