import { useState, useEffect } from 'react';

const Carousel = () => {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);

  // Updated slide data with four custom images
  const slideData = [
    {
      text: 'Your marketplace for everything that matters.',
      description: 'From everyday essentials to hidden gems, this is where smart buyers meet trusted sellers.',
      button: 'Shop Now',
      image: 'https://res.cloudinary.com/dbczfoqnc/image/upload/v1748298184/WhatsApp_Image_2025-05-26_at_2.22.03_PM_1_nf5aby.jpg',
    },
    {
      text: 'Shop The Latest Deals',
      description: 'Find unique products at unbeatable prices.',
      button: 'Shop Now',
      image: 'https://res.cloudinary.com/dbczfoqnc/image/upload/v1748298181/WhatsApp_Image_2025-05-26_at_2.22.03_PM_t6903n.jpg',
    },
    {
      text: 'Top Notch Findings.',
      description: 'Quality and refinable products.',
      button: 'Shop Now',
      image: 'https://res.cloudinary.com/dbczfoqnc/image/upload/v1748298175/WhatsApp_Image_2025-05-26_at_2.22.03_PM_3_mnnp3s.jpg',
    },
    {
      text: 'Exclusive Offers Await!',
      description: 'Discover exclusive deals just for you.',
      button: 'Shop Now',
      image: 'https://res.cloudinary.com/dbczfoqnc/image/upload/v1748298182/WhatsApp_Image_2025-05-26_at_2.22.03_PM_2_xnyfai.jpg',
    },
  ];

  // Set slides with static data on mount
  useEffect(() => {
    setSlides(slideData);
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

  // Skeleton loader while slides are not loaded
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
            className="w-full h-48 sm:h-full object-cover"
          />
        </div>
      ))}
    </div>
  );
};

export default Carousel;