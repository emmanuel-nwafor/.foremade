import React, { useState } from 'react';

function MediaPreview({ imageUrls, videoUrls, isModal }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const allMedia = [
    ...(Array.isArray(imageUrls) ? imageUrls.map(url => ({ type: 'image', url })) : []),
    ...(Array.isArray(videoUrls) ? videoUrls.map(url => ({ type: 'video', url })) : []),
  ];

  if (!allMedia.length) {
    return <p className="text-gray-500 dark:text-gray-400 text-sm">No media available</p>;
  }

  const handlePrev = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === 0 ? allMedia.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    e.stopPropagation();
    setCurrentIndex((prev) => (prev === allMedia.length - 1 ? 0 : prev + 1));
  };

  const currentMedia = allMedia[currentIndex];

  return (
    <div className={`mb-4 relative ${isModal ? 'h-full' : 'h-64'} p-2`}>
      {currentMedia.type === 'image' && (
        <img
          src={currentMedia.url}
          alt="Product"
          className="w-full h-full object-cover rounded-md"
          onError={(e) => { e.target.src = 'https://via.placeholder.com/150'; }}
        />
      )}
      {currentMedia.type === 'video' && (
        <video
          src={currentMedia.url}
          controls
          className="w-full h-full object-cover rounded-md"
          onError={(e) => { e.target.poster = 'https://via.placeholder.com/150'; }}
        />
      )}
      {allMedia.length > 1 && isModal && (
        <>
          <button
            onClick={handlePrev}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all duration-200"
            title="Previous media"
          >
            <i className="bx bx-chevron-left"></i>
          </button>
          <button
            onClick={handleNext}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-gray-800 bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition-all duration-200"
            title="Next media"
          >
            <i className="bx bx-chevron-right"></i>
          </button>
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
            {allMedia.map((_, index) => (
              <span
                key={index}
                className={`w-2 h-2 rounded-full ${index === currentIndex ? 'bg-blue-500' : 'bg-gray-400'}`}
              ></span>
            ))}
          </div>
        </>
      )}
      <div className="absolute top-2 right-2 bg-gray-800 bg-opacity-50 text-white px-2 py-1 rounded-full text-xs">
        {currentIndex + 1}/{allMedia.length}
      </div>
    </div>
  );
}

export default MediaPreview;