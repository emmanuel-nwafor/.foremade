import React from 'react';

export default function CategoryBanner({ title, imageUrl }) {
  return (
    <div className="relative h-64 md:h-96 overflow-hidden">
      {imageUrl ? (
        <img 
          src={imageUrl} 
          alt={title} 
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="bg-gray-200 border-2 border-dashed w-full h-full" />
      )}
      {title && (
        <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <h1 className="text-3xl md:text-5xl font-bold text-white text-center">
            {title}
          </h1>
        </div>
      )}
    </div>
  );
}
