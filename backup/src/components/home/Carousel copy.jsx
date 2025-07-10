import { useState, useEffect } from 'react';

const Carousel = () => {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);

  // Default slide data with text and descriptions
  const slideData = [
    {
      text: 'Your marketplace for everything that matters.',
      description: 'From everyday essentials to hidden gems, this is where smart buyers meet trusted sellers.',
      button: 'Shop Now',
    },
    {
      text: 'Shop The Latest Deals',
      description: 'Find unique products at unbeatable prices.',
      button: 'Shop Now',
    },
    {
      text: 'Top Notch Findings.',
      description: 'Quality and refinable products.',
      button: 'Shop Now',
    },
  ];

  // Function to fetch images from Pexels API
  const fetchImages = async () => {
    try {
      // Use a random page to get different images each time
      const randomPage = Math.floor(Math.random() * 100) + 1;
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=ecommerce&per_page=3&page=${randomPage}`,
        {
          headers: {
            Authorization: '51SPMrbmugFd8lKtgNuHKLUvegqD5d7cO0YF8fWYJ6ZySEFmi3MdBz0N',
          },
        }
      );
      const data = await response.json();
      const fetchedImages = data.photos.map((photo) => photo.src.landscape);

      // Combine fetched images with slide data
      const updatedSlides = slideData.map((slide, index) => ({
        ...slide,
        image: fetchedImages[index] || 'https://via.placeholder.com/1200x400?text=Image+Not+Found',
      }));
      setSlides(updatedSlides);
    } catch (error) {
      console.error('Error fetching images:', error);
      // Fallback to placeholder images if fetch fails
      setSlides(
        slideData.map((slide) => ({
          ...slide,
          image: 'https://via.placeholder.com/1200x400?text=Image+Not+Found',
        }))
      );
    }
  };

  // Fetch images initially and every 30 minutes
  useEffect(() => {
    fetchImages(); // Initial fetch

    const imageRefreshInterval = setInterval(() => {
      fetchImages();
    }, 30 * 60 * 1000); // 30 minutes

    return () => clearInterval(imageRefreshInterval);
  }, []);

  // Carousel auto-slide effect
  useEffect(() => {
    if (slides.length === 0) return; // Wait until slides are loaded

    const timer = setInterval(() => {
      setPrevSlide(current);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [current, slides.length]);

  // Skeleton loader while fetching images
  if (slides.length === 0) {
    return (
      <div className="relative h-[200px] sm:h-[250px] md:h-[300px] lg:h-[340px] xl:h-[380px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gray-200 animate-pulse"></div>
          <div className="absolute inset-0 flex items-center justify-start p-2 sm:p-4 md:p-6 lg:p-8 bg-black bg-opacity-30">
            <div className="text-white max-w-[180px] sm:max-w-xs md:max-w-sm lg:max-w-md text-left space-y-2 sm:space-y-3">
              <div className="h-4 sm:h-5 md:h-6 lg:h-7 xl:h-8 bg-gray-300 rounded w-3/4 animate-pulse"></div>
              <div className="h-3 sm:h-4 md:h-5 lg:h-6 bg-gray-300 rounded w-5/6 animate-pulse"></div>
              <div className="h-2 sm:h-3 md:h-4 lg:h-5 bg-gray-300 rounded w-4/5 animate-pulse"></div>
              <div className="h-6 sm:h-7 md:h-8 lg:h-9 bg-gray-300 rounded-full w-20 sm:w-24 md:w-28 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[200px] sm:h-[250px] md:h-[300px] lg:h-[340px] xl:h-[380px] w-full overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            index === current
              ? 'opacity-100 transform translate-x-0'
              : index === prevSlide
              ? 'opacity-0 transform -translate-x-10'
              : 'opacity-0 transform translate-x-10'
          }`}
        >
          <img
            src={slide.image}
            alt={`Slide ${index}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-start p-2 sm:p-4 md:p-6 lg:p-8 bg-black bg-opacity-30">
            <div className="text-white max-w-[180px] sm:max-w-xs md:max-w-sm lg:max-w-md text-left">
              <h2 className="text-md sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold mb-1 sm:mb-2">
                {slide.text}
              </h2>
              <p className="text-[10px] sm:text-xs md:text-sm lg:text-base mb-2 sm:mb-3">
                {slide.description}
              </p>
              <button className="bg-white text-gray-800 px-3 sm:px-4 md:px-5 py-1 sm:py-1.5 md:py-2 rounded-full hover:bg-blue-300 hover:text-white transition-all text-[10px] sm:text-xs md:text-sm">
                {slide.button}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default Carousel;