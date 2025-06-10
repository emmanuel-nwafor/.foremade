import { useState, useEffect } from 'react';
import { useWindowSize } from '../../hooks/useWindowSize';

const Carousel = () => {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);
  const { width } = useWindowSize();

  // Numbered image collection for easy reference
  const imageCollection = {
    1: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496540/photo_2025-06-09_20-11-10_otggjq.jpg',
    2: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496536/photo_2025-06-09_20-11-11_fwhymh.jpg',
    3: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496535/photo_2025-06-09_20-11-12_tvpk7u.jpg',
    4: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496527/photo_2025-06-09_20-11-14_rpyhc1.jpg',
    5: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496526/photo_2025-06-09_20-11-15_bi7q13.jpg',
    6: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496518/photo_2025-06-09_20-11-18_hxjh9l.jpg',
    7: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496517/photo_2025-06-09_20-11-19_svrk7m.jpg',
    8: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496511/photo_2025-06-09_20-11-20_qhwlwa.jpg',
    9: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496495/photo_2025-06-09_20-11-23_zmkx96.jpg',
    10: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496494/photo_2025-06-09_20-11-24_j2hmu5.jpg',
    11: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496427/photo_2025-06-09_20-10-53_xshcur.jpg',
    12: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496462/photo_2025-06-09_20-10-40_h51bpj.jpg',
    13: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496454/photo_2025-06-09_20-10-47_zfnqcw.jpg',
    14: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496449/photo_2025-06-09_20-10-49_coiyg1.jpg',
    15: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496443/photo_2025-06-09_20-10-50_2_amozqn.jpg',
    16: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496442/photo_2025-06-09_20-10-50_atkayi.jpg',
    17: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496435/photo_2025-06-09_20-10-51_zebgob.jpg',
    18: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496435/photo_2025-06-09_20-10-51_zebgob.jpg',
    19: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496429/photo_2025-06-09_20-10-53_2_dpojtg.jpg',
    20: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496427/photo_2025-06-09_20-10-53_xshcur.jpg',
    21: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496421/photo_2025-06-09_20-10-54_gkutwi.jpg',
    22: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496420/photo_2025-06-09_20-10-55_mjxavl.jpg',
    23: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496415/photo_2025-06-09_20-10-56_2_j3d8is.jpg',
    24: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496414/photo_2025-06-09_20-10-56_cjh0ez.jpg',
    25: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496409/photo_2025-06-09_20-10-57_nseu98.jpg',
    26: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496408/photo_2025-06-09_20-10-59_2_nnlmau.jpg',
    27: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496403/photo_2025-06-09_20-10-59_kdyish.jpg',
    28: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496402/photo_2025-06-09_20-11-00_owzeu7.jpg',
    29: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496392/photo_2025-06-09_20-11-01_aqm2qt.jpg',
    30: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496392/photo_2025-06-09_20-11-07_t6holh.jpg',
    31: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1749496391/photo_2025-06-09_20-11-09_bps7wl.jpg'
  };

  // Helper function to get image by number
  const getImageByNumber = (num) => imageCollection[num];

  const slideData = [
    {
      id: 1,
      text: 'Premium Furniture Collection',
      description: 'Discover elegant and modern furniture pieces for your home.',
      button: 'Shop Now',
      desktop: getImageByNumber(1),    // Image #1 for desktop
      tablet: getImageByNumber(2),     // Image #2 for tablet
      mobile: getImageByNumber(3)      // Image #3 for mobile
    },
    {
      id: 2,
      text: 'Modern Living Solutions',
      description: 'Transform your space with our contemporary furniture designs.',
      button: 'Explore',
      desktop: getImageByNumber(4),    // Image #4 for desktop
      tablet: getImageByNumber(5),     // Image #5 for tablet
      mobile: getImageByNumber(6)      // Image #6 for mobile
    },
    {
      id: 3,
      text: 'Luxury Bedroom Sets',
      description: 'Create your perfect sanctuary with our luxury bedroom collections.',
      button: 'View Collection',
      desktop: getImageByNumber(7),    // Image #7 for desktop
      tablet: getImageByNumber(8),     // Image #8 for tablet
      mobile: getImageByNumber(9)      // Image #9 for mobile
    },
    {
      id: 4,
      text: 'Kitchen & Dining',
      description: 'Stylish furniture for your kitchen and dining area.',
      button: 'Browse Now',
      desktop: getImageByNumber(10),   // Image #10 for desktop
      tablet: getImageByNumber(11),    // Image #11 for tablet
      mobile: getImageByNumber(12)     // Image #12 for mobile
    },
    {
      id: 5,
      text: 'Office Solutions',
      description: 'Professional furniture for your workspace.',
      button: 'Shop Office',
      desktop: getImageByNumber(13),   // Image #13 for desktop
      tablet: getImageByNumber(14),    // Image #14 for tablet
      mobile: getImageByNumber(15)     // Image #15 for mobile
    },
    {
      id: 6,
      text: 'Outdoor Furniture',
      description: 'Weather-resistant furniture for your outdoor space.',
      button: 'Explore Outdoor',
      desktop: getImageByNumber(16),   // Image #16 for desktop
      tablet: getImageByNumber(17),    // Image #17 for tablet
      mobile: getImageByNumber(18)     // Image #18 for mobile
    },
    {
      id: 7,
      text: 'Storage & Organization',
      description: 'Smart storage solutions for every room.',
      button: 'Get Organized',
      desktop: getImageByNumber(19),   // Image #19 for desktop
      tablet: getImageByNumber(20),    // Image #20 for tablet
      mobile: getImageByNumber(21)     // Image #21 for mobile
    },
    {
      id: 8,
      text: 'Designer Lighting',
      description: 'Illuminate your space with our designer lighting collection.',
      button: 'Light Up',
      desktop: getImageByNumber(22),   // Image #22 for desktop
      tablet: getImageByNumber(23),    // Image #23 for tablet
      mobile: getImageByNumber(24)     // Image #24 for mobile
    },
    {
      id: 9,
      text: 'Home Decor',
      description: 'Beautiful accessories to complete your home.',
      button: 'Decorate',
      desktop: getImageByNumber(25),   // Image #25 for desktop
      tablet: getImageByNumber(26),    // Image #26 for tablet
      mobile: getImageByNumber(27)     // Image #27 for mobile
    },
    {
      id: 10,
      text: 'Special Offers',
      description: 'Limited time deals on selected furniture pieces.',
      button: 'Save Now',
      desktop: getImageByNumber(28),   // Image #28 for desktop
      tablet: getImageByNumber(29),    // Image #29 for tablet
      mobile: getImageByNumber(30)     // Image #30 for mobile
    }
    // You can add more slides here and assign different image numbers
    // For example:
    // {
    //   id: 11,
    //   text: 'New Collection',
    //   description: 'Check out our latest arrivals.',
    //   button: 'Discover',
    //   desktop: getImageByNumber(31),   // Image #31 for desktop
    //   tablet: getImageByNumber(1),     // Reuse Image #1 for tablet
    //   mobile: getImageByNumber(15)     // Reuse Image #15 for mobile
    // }
  ];

  const getResponsiveImage = (slide) => {
    if (width < 640) return slide.mobile;
    if (width < 1024) return slide.tablet;
    return slide.desktop;
  };

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
            src={getResponsiveImage(slide)}
            alt={`Slide ${slide.id}`}
            className="w-full h-full object-cover object-center sm:object-[50%_50%]"
            style={{
              objectPosition: 'center 35%'
            }}
          />

        </div>
      ))}
      
      {/* Optional: Add slide indicators */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === current ? 'bg-white' : 'bg-white bg-opacity-50'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default Carousel;