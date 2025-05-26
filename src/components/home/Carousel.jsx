import { useState, useEffect } from 'react';

const Carousel = () => {
  const slides = [
    {
      image: '/src/assets/images/hero1.jpg',
      text: 'Your marketplace for everything that matters.',
      description: 'From everyday essentials to hidden gems, this is where smart buyers meet trusted sellers.',
      button: 'Shop Now',
    },
    {
      image: '/src/assets/images/hero2.jpg',
      text: 'Shop The Latest Deals',
      description: 'Find unique products at unbeatable prices.',
      button: 'Shop Now',
    },
    {
      image: '/src/assets/images/hero3.jpg',
      text: 'Top Notch Findings.',
      description: 'Quality and refinable products.',
      button: 'Shop Now',
    },
  ];
  const [current, setCurrent] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setPrevSlide(current);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [current, slides.length]);

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
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl xl:text-2xl font-bold mb-1 sm:mb-2">
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