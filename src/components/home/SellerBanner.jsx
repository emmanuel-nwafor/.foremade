import { useState, useEffect } from 'react';

export default function SellerBanner() {
  const slides = [
    {
      image: 'https://pngimg.com/uploads/fan/fan_PNG14457.png',
      text: 'Sell To Buy?',
      description: 'Join us and discover quality products from trusted sellers.',
      button: 'Sell Now',
    },
    {
      image: 'https://pngimg.com/uploads/laptop/laptop_PNG101773.png',
      text: 'Find Great Deals',
      description: 'Explore a wide range of products at the best prices.',
      button: 'Buy Now',
    },
    {
      image: 'https://pngimg.com/uploads/laptop/laptop_PNG101763.png',
      text: 'Shop Easily',
      description: 'Browse and buy your favorite items in minutes.',
      button: 'Buy Now',
    },
  ];

  const [current, setCurrent] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setPrevSlide(current);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000); // Slide every 5 seconds
    return () => clearInterval(timer);
  }, [current, slides.length]);

  return (
    <div className="w-full min-h-[200px] flex flex-row items-center justify-evenly bg-gradient-to-r from-orange-500 to-orange-700 mt-14">
      {/* Text Section */}
      <div className="flex-col m-2 sm:m-4 max-w-[150px] sm:max-w-md text-left">
        <h2 className="text-lg sm:text-xl md:text-2xl lg:text-2xl xl:text-2xl font-bold text-white mb-2 sm:mb-3">
          {slides[current].text}
        </h2>
        <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl text-gray-100 mb-2 sm:mb-4">
          {slides[current].description}
        </p>
        <button className="px-4 py-1 sm:px-6 sm:py-2 bg-blue-300 rounded-lg hover:bg-blue-600 transition-all hover:text-white text-xs sm:text-sm md:text-base lg:text-lg">
          {slides[current].button}
        </button>
      </div>
      {/* Image Carousel Section */}
      <div className="relative h-28 sm:h-36 md:h-40 lg:h-52 xl:h-64 max-w-[150px] sm:max-w-[200px] md:max-w-[250px] lg:max-w-[300px] xl:max-w-[350px] w-full">
        {slides.map((slide, index) => (
          <img
            key={index}
            src={slide.image}
            alt={`Seller product ${index}`}
            onError={(e) => (e.target.src = 'https://via.placeholder.com/800x600?text=Image+Failed+to+Load')}
            className={`absolute top-0 left-0 w-full h-28 sm:h-36 md:h-40 lg:h-52 xl:h-64 object-contain transition-all duration-1000 ease-in-out ${
              index === current ? 'opacity-100' : index === prevSlide ? 'opacity-0' : 'opacity-0'
            }`}
          />
        ))}
      </div>
    </div>
  );
}