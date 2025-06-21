import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";

const CategoriesCarousel = ({ category }) => {
  const bannerImages = {
    "Tablet & Phones":
      "https://res.cloudinary.com/dvhogp27g/image/upload/v1749496510/photo_2025-06-09_20-11-21_vsojz8.jpg",
    "Health & Beauty":
      "https://res.cloudinary.com/dvhogp27g/image/upload/v1749496502/photo_2025-06-09_20-11-23_2_kwjqqr.jpg",
    "Electronics":
      "https://res.cloudinary.com/dvhogp27g/image/upload/v1749496477/photo_2025-06-09_20-11-29_tzs0vs.jpg",
    "Computers & Accessories":
      "https://res.cloudinary.com/dvhogp27g/image/upload/v1749496469/photo_2025-06-09_20-11-31_xtfepw.jpg",
    "Baby Products":
      "https://res.cloudinary.com/dvhogp27g/image/upload/v1749496470/photo_2025-06-09_20-11-30_ht9ms8.jpg",
    "Games & Fun":
      "https://res.cloudinary.com/dvhogp27g/image/upload/v1749425277/photo_2025-06-09_00-28-12_dt7sp3.jpg",
    "Drinks & Categories":
      "https://res.cloudinary.com/dvhogp27g/image/upload/v1749417059/photo_2025-06-08_22-10-17_inpwcf.jpg",
    "Home & Kitchen":
      "https://res.cloudinary.com/dvhogp27g/image/upload/v1749425370/photo_2025-06-09_00-28-16_mildb8.jpg",
    "Smart Watches":
      "https://res.cloudinary.com/dvhogp27g/image/upload/v1749425266/photo_2025-06-09_00-28-13_hai2go.jpg",
  };

  return (
    <div className="w-full h-[200px] relative overflow-hidden rounded-lg mb-6">
      <img
        src={bannerImages[category] || "default-banner-url.jpg"}
        alt={`${category} banner`}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent">
        <div className="flex items-center h-full px-6">
          <h1 className="hidden text-3xl font-bold text-white">{category}</h1>
        </div>
      </div>
    </div>
  );
};

export default CategoriesCarousel;
