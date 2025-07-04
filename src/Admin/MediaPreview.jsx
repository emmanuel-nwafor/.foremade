import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Image as ImageIcon, Video as VideoIcon, Edit2, Check, X } from 'lucide-react';

function MediaPreview({ imageUrls = [], videoUrls = [], isModal, product = {}, onUpdateProduct }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProduct, setEditedProduct] = useState({
    ...product,
    imageUrls: product.imageUrls || [],
    videoUrls: product.videoUrls || [],
  });
  const allMedia = [
    ...editedProduct.imageUrls.map((url) => ({ type: 'image', url })),
    ...editedProduct.videoUrls.map((url) => ({ type: 'video', url })),
  ].filter((media) => media.url); // Filter out invalid URLs

  if (!allMedia.length) {
    return (
      <p className="text-gray-500 dark:text-gray-400 text-sm flex items-center gap-1">
        {/* <ImageIcon size={16} className="text-gray-500" /> No media available */}
      </p>
    );
  }

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
  };

  const handleEditToggle = () => {
    setIsEditing(!isEditing);
    if (!isEditing) {
      setEditedProduct({
        ...product,
        imageUrls: product.imageUrls || [],
        videoUrls: product.videoUrls || [],
      });
    }
  };

  const handleFieldChange = (field, value) => {
    setEditedProduct((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleUrlChange = (index, value, mediaType) => {
    const newUrls = [...(mediaType === 'image' ? editedProduct.imageUrls : editedProduct.videoUrls)];
    newUrls[index] = value;
    setEditedProduct((prev) => ({
      ...prev,
      [mediaType === 'image' ? 'imageUrls' : 'videoUrls']: newUrls,
    }));
  };

  const handleAddMedia = (mediaType) => {
    setEditedProduct((prev) => ({
      ...prev,
      [mediaType === 'image' ? 'imageUrls' : 'videoUrls']: [...prev[mediaType === 'image' ? 'imageUrls' : 'videoUrls'], ''],
    }));
  };

  const handleRemoveMedia = (index, mediaType) => {
    const newUrls = [...(mediaType === 'image' ? editedProduct.imageUrls : editedProduct.videoUrls)].filter((_, i) => i !== index);
    setEditedProduct((prev) => ({
      ...prev,
      [mediaType === 'image' ? 'imageUrls' : 'videoUrls']: newUrls,
    }));
    if (currentIndex >= allMedia.length - 1) setCurrentIndex(0);
  };

  const handleSaveEdits = () => {
    if (onUpdateProduct) {
      onUpdateProduct({
        ...editedProduct,
        imageUrls: editedProduct.imageUrls.filter((url) => url.trim()),
        videoUrls: editedProduct.videoUrls.filter((url) => url.trim()),
        price: parseFloat(editedProduct.price) || 0,
        stock: parseInt(editedProduct.stock) || 0,
      });
    }
    setIsEditing(false);
  };

  const currentMedia = allMedia[currentIndex];

  return (
    <div className={`relative ${isModal ? 'h-full' : 'h-64'} p-2 rounded-xl overflow-hidden shadow-md`}>
      <div className="w-full h-full relative">
        {currentMedia.type === 'image' && (
          <img
            src={currentMedia.url}
            alt={`${product.name || 'Product'} image`}
            className="w-full h-full object-cover rounded-xl transition-transform duration-300 hover:scale-105"
            onError={(e) => {
              e.target.src = 'https://via.placeholder.com/150'; // Fallback image
              console.error(`Failed to load image: ${currentMedia.url}`);
            }}
          />
        )}
        {currentMedia.type === 'video' && (
          <video
            src={currentMedia.url}
            controls
            className="w-full h-full object-cover rounded-xl"
            onError={(e) => {
              e.target.poster = 'https://via.placeholder.com/150'; // Fallback poster
              console.error(`Failed to load video: ${currentMedia.url}`);
            }}
          />
        )}
        {allMedia.length > 1 && isModal && (
          <>
            <button
              onClick={handlePrev}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-gray-900 bg-opacity-60 text-white p-2 rounded-full hover:bg-opacity-80 transition-all duration-200 focus:outline-none"
              title="Previous media"
              aria-label="Previous media"
            >
              <ChevronLeft size={20} />
            </button>
            <button
              onClick={handleNext}
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
                  onClick={() => setCurrentIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-200 ${
                    index === currentIndex ? 'bg-blue-500 w-3' : 'bg-gray-400 hover:bg-gray-500'
                  }`}
                  aria-label={`Go to media ${index + 1}`}
                ></button>
              ))}
            </div>
          </>
        )}
        <div className="absolute top-2 right-2 bg-gray-900 bg-opacity-70 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
          {currentMedia.type === 'image' ? <ImageIcon size={12} /> : <VideoIcon size={12} />}
          {currentIndex + 1}/{allMedia.length}
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
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Price (₦)</label>
              <input
                type="number"
                value={editedProduct.price || ''}
                onChange={(e) => handleFieldChange('price', e.target.value)}
                className="w-full p-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Stock</label>
              <input
                type="number"
                value={editedProduct.stock || ''}
                onChange={(e) => handleFieldChange('stock', e.target.value)}
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
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Colors (comma-separated)</label>
              <input
                type="text"
                value={Array.isArray(editedProduct.colors) ? editedProduct.colors.join(', ') : editedProduct.colors || ''}
                onChange={(e) => handleFieldChange('colors', e.target.value.split(', ').filter(Boolean))}
                className="w-full p-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Sizes (comma-separated)</label>
              <input
                type="text"
                value={Array.isArray(editedProduct.sizes) ? editedProduct.sizes.join(', ') : editedProduct.sizes || ''}
                onChange={(e) => handleFieldChange('sizes', e.target.value.split(', ').filter(Boolean))}
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
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Rating</label>
              <input
                type="number"
                value={editedProduct.rating || ''}
                onChange={(e) => handleFieldChange('rating', e.target.value)}
                className="w-full p-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                min="0"
                max="5"
                step="0.1"
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
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Images</label>
              {editedProduct.imageUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={url || ''}
                    onChange={(e) => handleUrlChange(index, e.target.value, 'image')}
                    className="w-full p-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter image URL"
                  />
                  <button
                    onClick={() => handleRemoveMedia(index, 'image')}
                    className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-all duration-200"
                    title="Remove image"
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddMedia('image')}
                className="mt-2 text-blue-600 hover:underline text-sm flex items-center gap-1"
              >
                <ImageIcon size={14} /> Add Image
              </button>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">Videos</label>
              {editedProduct.videoUrls.map((url, index) => (
                <div key={index} className="flex items-center gap-2 mt-1">
                  <input
                    type="text"
                    value={url || ''}
                    onChange={(e) => handleUrlChange(index, e.target.value, 'video')}
                    className="w-full p-1 border border-gray-300 rounded-lg text-sm bg-white dark:bg-gray-700 dark:border-gray-600 dark:text-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                    placeholder="Enter video URL"
                  />
                  <button
                    onClick={() => handleRemoveMedia(index, 'video')}
                    className="bg-red-600 text-white p-1 rounded-full hover:bg-red-700 transition-all duration-200"
                    title="Remove video"
                    aria-label="Remove video"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => handleAddMedia('video')}
                className="mt-2 text-blue-600 hover:underline text-sm flex items-center gap-1"
              >
                <VideoIcon size={14} /> Add Video
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MediaPreview;