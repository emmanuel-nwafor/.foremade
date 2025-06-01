// MediaPreview.jsx
import React from 'react';

function MediaPreview({ imageUrls, videoUrls }) {
  const firstImage = imageUrls?.[0];
  const firstVideo = videoUrls?.[0];

  return (
    <div className="mb-4">
      {firstImage && <img src={firstImage} alt="Product" className="w-full h-full object-cover rounded-md" />}
      {firstVideo && <video src={firstVideo} controls className="w-full h-32 object-cover rounded-md mt-2" />}
      {!firstImage && !firstVideo && <p className="text-gray-500">No media available</p>}
    </div>
  );
}

export default MediaPreview;