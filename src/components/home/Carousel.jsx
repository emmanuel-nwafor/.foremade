import { useState, useEffect } from 'react';
// import bg from '/src/assets/images/sell.jpg'

const bg_1 = '/src/assets/images/hero1.jpg'
const bg_2 = 'src/assets/images/hero2.jpg'
const bg_3 = 'src/assets/images/hero3.jpg'

const Carousel = () => {
  const slides = [
    {
      image: bg_1,
      text: 'Discovered Supports Tailored For You',
      description: 'Explore solutions for shipping, returns, and more.',
      button: 'Shop Now',
    },
    {
      image: bg_2,
      text: 'Shop The Latest Deals',
      description: 'Find unique products at unbeatable prices.',
      button: 'Shop Now',
    },
    {
      image: bg_3,
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
    <div className="relative h-[300px] sm:h-[300px] md:h-[450px] lg:h-[340px] xl:h-[380px] max-w-full w-full md:max-w-full md:w-full lg:max-w-[90%] xl:max-w-[93%] lg:mx-auto overflow-hidden">
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
          <div className="absolute inset-0 flex items-center justify-start p-4 sm:p-6 md:p-8 lg:p-10 bg-black bg-opacity-30">
            <div className="text-white max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg text-left">
              <h2 className="text-base sm:text-lg md:text-xl lg:text-2xl xl:text-3xl font-bold mb-2">
                {slide.text}
              </h2>
              <p className="text-xs sm:text-sm md:text-base lg:text-lg mb-4">
                {slide.description}
              </p>
              <button className="bg-white border-none transition-all hover:text-white text-gray-800 px-4 sm:px-6 md:px-8 py-2 sm:py-2.5 md:py-3 rounded-full border border-gray-300 hover:bg-blue-300 text-xs sm:text-sm md:text-base">
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