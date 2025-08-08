import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, X, Edit2, Check } from 'lucide-react';

function MediaPreview({ variants = [], imageUrls = [], isModal, product = {}, onUpdateProduct }) {
  const [currentVariantIndex, setCurrentVariantIndex] = useState(0);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState({
    ...product,
    variants: variants.length
      ? variants.map((variant) => ({
          ...variant,
          imageUrls: variant.imageUrls || [],
          price: variant.price || 0,
          stock: variant.stock || 0,
          color: variant.color || '',
          size: variant.size || '',
        }))
      : [],
    imageUrls: product.imageUrls || imageUrls || [],
  });

  // Use variant images if variants exist, otherwise fall back to product-level imageUrls
  const currentVariant = variants.length ? editedProduct.variants[currentVariantIndex] || { imageUrls: [] } : null;
  const allMedia = variants.length
    ? currentVariant.imageUrls.map((url) => ({ type: 'image', url })).filter((media) => media.url)
    : editedProduct.imageUrls.map((url) => ({ type: 'image', url })).filter((media) => media.url);

  if (!allMedia.length && !isEditing) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1 bg-gray-100 dark:bg-gray-800 p-2 rounded-xl">
        No media available.
      </p>
    );
  }

  const handlePrevMedia = (e) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
  };

  const handleNextMedia = (e) => {
    e.stopPropagation();
    setCurrentMediaIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
  };

  const handlePrevVariant = (e) => {
    e.stopPropagation();
    setCurrentVariantIndex((prev) => (prev === 0 ? editedProduct.variants.length - 1 : prev - 1));
    setCurrentMediaIndex(0);
  };

  const handleNextVariant = (e) => {
    e.stopPropagation();
    setCurrentVariantIndex((prev) => (prev === editedProduct.variants.length - 1 ? 0 : prev + 1));
    setCurrentMediaIndex(0);
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditedProduct({
        ...product,
        variants: variants.length
          ? variants.map((variant) => ({
              ...variant,
              imageUrls: variant.imageUrls || [],
              price: variant.price || 0,
              stock: variant.stock || 0,
              color: variant.color || '',
              size: variant.size || '',
            }))
          : [],
        imageUrls: product.imageUrls || imageUrls || [],
      });
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleVariantFieldChange = (variantIndex, field, value) => {
    setEditedProduct((prev) => ({
      ...prev,
      variants: prev.variants.map((variant, index) =>
        index === variantIndex ? { ...variant, [field]: value } : variant
      ),
    }));
  };

  const handleUrlChange = (variantIndex, mediaIndex, value) => {
    if (!variants.length) {
      setEditedProduct((prev) => ({
        ...prev,
        imageUrls: prev.imageUrls.map((url, i) => (i === mediaIndex ? value : url)),
      }));
    } else {
      setEditedProduct((prev) => ({
        ...prev,
        variants: prev.variants.map((variant, index) =>
          index === variantIndex
            ? { ...variant, imageUrls: variant.imageUrls.map((url, i) => (i === mediaIndex ? value : url)) }
            : variant
        ),
      }));
    }
  };

  const handleAddMedia = (variantIndex) => {
    if (!variants.length) {
      setEditedProduct((prev) => ({
        ...prev,
        imageUrls: [...prev.imageUrls, ''],
      }));
    } else {
      setEditedProduct((prev) => ({
        ...prev,
        variants: prev.variants.map((variant, index) =>
          index === variantIndex ? { ...variant, imageUrls: [...variant.imageUrls, ''] } : variant
        ),
      }));
    }
  };

  const handleRemoveMedia = (variantIndex, mediaIndex) => {
    if (!variants.length) {
      setEditedProduct((prev) => ({
        ...prev,
        imageUrls: prev.imageUrls.filter((_, i) => i !== mediaIndex),
      }));
    } else {
      setEditedProduct((prev) => ({
        ...prev,
        variants: prev.variants.map((variant, index) =>
          index === variantIndex
            ? { ...variant, imageUrls: variant.imageUrls.filter((_, i) => i !== mediaIndex) }
            : variant
        ),
      }));
    }
    if (currentMediaIndex >= allMedia.length - 1) setCurrentMediaIndex(0);
  };

  const handleAddVariant = () => {
    setEditedProduct((prev) => ({
      ...prev,
      variants: [...prev.variants, { color: '', size: '', price: 0, stock: 0, imageUrls: [] }],
    }));
  };

  const handleRemoveVariant = (variantIndex) => {
    setEditedProduct((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, index) => index !== variantIndex),
    }));
    if (currentVariantIndex >= editedProduct.variants.length - 1) setCurrentVariantIndex(0);
  };

  const handleSaveEdits = () => {
    if (onUpdateProduct) {
      onUpdateProduct({
        ...editedProduct,
        variants: editedProduct.variants.map((variant) => ({
          ...variant,
          price: parseFloat(variant.price) || 0,
          stock: parseInt(variant.stock) || 0,
          imageUrls: variant.imageUrls.filter((url) => url.trim()),
        })),
        imageUrls: editedProduct.imageUrls.filter((url) => url.trim()),
      });
    }
    setIsEditing(false);
  };

  const currentMedia = allMedia[currentMediaIndex];

  return (
    <div className={`relative ${isModal ? 'h-full bg-white' : 'h-64'} bg-white p-2 rounded-xl overflow-hidden shadow-md`}>
      <div className="w-full h-full relative bg-gray-100 dark:bg-gray-800">
        {currentMedia && (
          <img
            src={currentMedia.url}
            alt={`${product.name || 'Product'} ${variants.length ? `variant ${currentVariantIndex + 1}` : ''} image`}
            className="w-full h-full object-cover rounded-xl transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/150';
              console.error(`Failed to load image: ${currentMedia.url}`);
            }}
          />
        )}
        {allMedia.length > 1 && isModal && (
          <>
            <button
              onClick={handlePrevMedia}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-900 bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all duration-200 focus:outline-none"
              title="Previous media"
              aria-label="Previous media"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextMedia}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-gray-900 bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all duration-200 focus:outline-none"
              title="Next media"
              aria-label="Next media"
            >
              <ChevronRight size={20} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 bg-gray-900 bg-opacity-70 p-1 rounded-full">
              {allMedia.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentMediaIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentMediaIndex ? 'bg-blue-500 w-3' : 'bg-gray-400 hover:bg-gray-500'
                  }`}
                  aria-label={`Go to media ${index + 1}`}
                ></button>
              ))}
            </div>
          </>
        )}
        {variants.length > 1 && isModal && (
          <>
            <button
              onClick={handlePrevVariant}
              className="absolute left-2 top-1/4 -translate-y-1/2 bg-gray-900 bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all duration-200 focus:outline-none"
              title="Previous variant"
              aria-label="Previous variant"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNextVariant}
              className="absolute right-2 top-1/4 -translate-y-1/2 bg-gray-900 bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all duration-200 focus:outline-none"
              title="Next variant"
              aria-label="Next variant"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
        <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
          <ImageIcon size={12} />
          {variants.length ? `Variant ${currentVariantIndex + 1}/${editedProduct.variants.length} | ` : ''}Image {currentMediaIndex + 1}/{allMedia.length}
        </div>
        {isModal && (
          <div className="absolute top-2 left-2">
            {!isEditing ? (
              <button
                onClick={handleEditToggle}
                className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-all duration-200 focus:outline-none"
                title="Edit product"
                aria-label="Edit product"
              >
                <Edit2 size={16} />
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={handleSaveEdits}
                  className="bg-emerald-600 text-white p-2 rounded-full hover:bg-emerald-700 transition-all duration-200 focus:outline-none"
                  title="Save edits"
                  aria-label="Save edits"
                >
                  <Check size={16} />
                </button>
                <button
                  onClick={handleEditToggle}
                  className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-all duration-200 focus:outline-none"
                  title="Cancel edits"
                  aria-label="Cancel edits"
                >
                  <X size={16} />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
      {isEditing && isModal && (
        <div className="mt-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-y-auto max-h-[40vh]">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Edit Product Details</h4>
          <div className="space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Name</label>
              <input
                type="text"
                value={editedProduct.name || ''}
                onChange={(e) => handleFieldChange('name', e.target.value)}
                className="w-full p-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Category</label>
              <input
                type="text"
                value={editedProduct.category || ''}
                onChange={(e) => handleFieldChange('category', e.target.value)}
                className="w-full p-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Condition</label>
              <input
                type="text"
                value={editedProduct.condition || ''}
                onChange={(e) => handleFieldChange('condition', e.target.value)}
                className="w-full p-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Tags (comma-separated)</label>
              <input
                type="text"
                value={Array.isArray(editedProduct.tags) ? editedProduct.tags.join(', ') : editedProduct.tags || ''}
                onChange={(e) => handleFieldChange('tags', e.target.value.split(', ').filter(Boolean))}
                className="w-full p-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            {variants.length ? (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Variants</h4>
                {editedProduct.variants.map((variant, variantIndex) => (
                  <div key={variantIndex} className="mb-4 p-2 border border-gray-300 dark:border-gray-600 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <h5 className="text-xs font-medium text-gray-600 dark:text-gray-400">Variant {variantIndex + 1}</h5>
                      <button
                        onClick={() => handleRemoveVariant(variantIndex)}
                        className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-all duration-200"
                        title="Remove variant"
                        aria-label="Remove variant"
                      >
                        <X size={14} />
                      </button>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Color</label>
                        <input
                          type="text"
                          value={variant.color || ''}
                          onChange={(e) => handleVariantFieldChange(variantIndex, 'color', e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Size</label>
                        <input
                          type="text"
                          value={variant.size || ''}
                          onChange={(e) => handleVariantFieldChange(variantIndex, 'size', e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Price (₦)</label>
                        <input
                          type="number"
                          value={variant.price || ''}
                          onChange={(e) => handleVariantFieldChange(variantIndex, 'price', e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Stock</label>
                        <input
                          type="number"
                          value={variant.stock || ''}
                          onChange={(e) => handleVariantFieldChange(variantIndex, 'stock', e.target.value)}
                          className="w-full p-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Images</label>
                        {variant.imageUrls.map((url, index) => (
                          <div key={index} className="flex items-center gap-2 mt-1">
                            <input
                              type="text"
                              value={url || ''}
                              onChange={(e) => handleUrlChange(variantIndex, index, e.target.value)}
                              className="w-full p-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                              placeholder="Enter image URL"
                            />
                            <button
                              onClick={() => handleRemoveMedia(variantIndex, index)}
                              className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-all duration-200"
                              title="Remove image"
                              aria-label="Remove image"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => handleAddMedia(variantIndex)}
                          className="mt-2 text-blue-600 hover:underline text-sm flex items-center gap-1"
                        >
                          <ImageIcon size={14} /> Add Image
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleAddVariant}
                  className="mt-2 text-blue-600 hover:underline text-sm flex items-center gap-1"
                >
                  <ImageIcon size={14} /> Add Variant
                </button>
              </div>
            ) : (
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Images</h4>
                {editedProduct.imageUrls.map((url, index) => (
                  <div key={index} className="flex items-center gap-2 mt-1">
                    <input
                      type="text"
                      value={url || ''}
                      onChange={(e) => handleUrlChange(0, index, e.target.value)}
                      className="w-full p-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      placeholder="Enter image URL"
                    />
                    <button
                      onClick={() => handleRemoveMedia(0, index)}
                      className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-all duration-200"
                      title="Remove image"
                      aria-label="Remove image"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => handleAddMedia(0)}
                  className="mt-2 text-blue-600 hover:underline text-sm flex items-center gap-1"
                >
                  <ImageIcon size={14} /> Add Image
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaPreview;