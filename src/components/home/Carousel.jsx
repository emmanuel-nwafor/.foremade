import { useState, useEffect } from 'react';

const Carousel = () => {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);

  const slideData = [
    {
      text: 'Premium Furniture Collection',
      description: 'Discover elegant and modern furniture pieces for your home.',
      button: 'Shop Now',
      image: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749425355/photo_2025-06-09_00-28-17_vebk0b.jpg',
    },
    {
      text: 'Modern Living Solutions',
      description: 'Transform your space with our contemporary furniture designs.',
      button: 'Explore',
      image: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749425344/photo_2025-06-09_00-28-08_fhpqmp.jpg',
    },
    // {
    //   text: 'Top Notch Findings.',
    //   description: 'Quality and refinable products.',
    //   button: 'Shop Now',
    //   image: 'https://res.cloudinary.com/dbczfoqnc/image/upload/v1748298175/WhatsApp_Image_2025-05-26_at_2.22.03_PM_3_mnnp3s.jpg',
    // },
    {
      text: 'Luxury Home Decor',
      description: 'Elevate your home with our exclusive collection.',
      button: 'View Collection',
      image: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749425341/photo_2025-06-09_00-28-09_ovgo6o.jpg',
    },
    {
      text: 'Stylish Office Furniture',
      description: 'Create a productive workspace with our office solutions.',
      button: 'Shop Office',
      image: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749425338/photo_2025-06-09_00-28-10_ah8ind.jpg',
    },
    {
      text: 'Exclusive Offers Await!',
      description: 'Just for you.',
      button: 'Shop Now',
      image: 'https://res.cloudinary.com/dbczfoqnc/image/upload/v1749269120/474724fd-05dd-426b-8038-5dbe08b8d257_ddxbqd.jpg',
    },
    {
      text: 'Exclusive Offers Await!',
      description: 'Just for you.',
      button: 'Shop Now',
      image: 'https://res.cloudinary.com/dbczfoqnc/image/upload/v1749269119/a586b6ab-eabe-4f59-921c-1176e593e05c_vgbb1j.jpg',
    },{
      text: 'Outdoor Living',
      description: 'Beautiful furniture for your outdoor spaces.',
      button: 'Shop Outdoor',
      image: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749425273/photo_2025-06-09_00-28-13_2_tyjjps.jpg',
    },
    {
      text: 'Designer Furniture',
      description: 'Exclusive designs for the discerning homeowner.',
      button: 'Shop Designer',
      image: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749425265/photo_2025-06-09_00-28-15_alsiwy.jpg',
    }
  ];

  useEffect(() => {
    setSlides(slideData);
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;

    const timer = setInterval(() => {
      setPrevSlide(current);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [current, slides.length]);

  if (slides.length === 0) {
    return (
      <div className="relative h-[200px] sm:h-[250px] md:h-[300px] lg:h-[400px] w-full overflow-hidden">
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
    <div className="relative h-[200px] sm:h-[250px] md:h-[300px] lg:h-[400px] w-full overflow-hidden">
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
            className="w-full h-full object-cover object-center sm:object-[50%_50%]"
            style={{
              objectPosition: 'center 35%'
            }}
          />
        </div>
      ))}
    </div>
  );
};

export default Carousel;