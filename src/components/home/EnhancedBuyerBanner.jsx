import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const TRUST_BADGES = [
  { icon: 'bx bx-shield', label: 'Buyer Protection' },
  { icon: 'bx bx-package', label: 'Fast Delivery' },
  { icon: 'bx bx-credit-card', label: 'Secure Payment' },
];

const TESTIMONIAL = {
  quote: '“I always find what I need on Foremade, and the delivery is super fast. Highly recommended!”',
  name: 'Michael S., New York',
  avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
};

export default function EnhancedBuyerBanner() {
  const slides = [
    {
      image: 'https://pngimg.com/uploads/vacuum_cleaner/vacuum_cleaner_PNG3.png',
      text: 'Smart Shopping, Better Living',
      tagline: 'Premium Products',
      description: 'Discover curated collections from verified sellers worldwide',
      features: [
        { icon: 'bx bx-certification', text: 'Quality Assured', desc: 'Verified products' },
        { icon: 'bx bx-package', text: 'Fast Delivery', desc: 'Global shipping' }
      ],
      button: 'Explore Now',
      secondaryButton: 'View Deals',
      link: '/products',
    },
    {
      image: 'https://pngimg.com/uploads/tv/tv_PNG39223.png',
      text: 'Premium Electronics',
      tagline: 'Tech Essentials',
      description: 'Find the latest tech from trusted sellers',
      features: [
        { icon: 'bx bx-check-shield', text: 'Warranty Assured', desc: 'Extended coverage' },
        { icon: 'bx bx-credit-card', text: 'Easy Payment', desc: 'Multiple options' }
      ],
      button: 'Browse Electronics',
      secondaryButton: 'View Brands',
      link: '/category/electronics',
    }
  ];

  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [current, slides.length, autoplay]);

  const goToSlide = (index) => {
    setCurrent(index);
    setAutoplay(false);
    setTimeout(() => setAutoplay(true), 10000);
  };

  return (
    <div className="relative overflow-hidden my-4 mx-2 sm:mx-4 lg:mx-6 rounded-2xl border border-blue-800/30 h-[240px] xs:h-[260px] sm:h-[320px] lg:h-[440px] shadow-xl">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-400/60 to-amber-200 animate-gradient-x"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.7 }}
          transition={{ duration: 1 }}
        />
        <div className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-20 sm:opacity-30 transition-all duration-700 scale-110"
          style={{ backgroundImage: `url(${slides[current].image})` }}
        />
        <div className="absolute inset-0 backdrop-blur-md" />
      </div>
      {/* Glass Card Overlay */}
      <motion.div className="relative z-10 h-full flex items-center w-full">
        <div className="w-full mx-auto px-3 xs:px-4 sm:px-8 lg:px-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8 sm:gap-10 py-6 sm:py-10 flex-wrap">
          {/* Left: Main Content */}
          <div className="max-w-2xl w-full space-y-4 sm:space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center h-7 px-4 rounded-full bg-gradient-to-r from-blue-600/30 to-blue-400/20 border border-blue-500/30 mb-1"
            >
              <span className="text-xs font-medium text-blue-100 tracking-wide">
                {slides[current].tagline}
              </span>
            </motion.div>
            <motion.h2
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold leading-tight text-white drop-shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {slides[current].text}
            </motion.h2>
            {/* Description only on larger screens */}
            <motion.p
              className="hidden sm:block text-base sm:text-lg text-white/90 max-w-lg mt-2"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {slides[current].description}
            </motion.p>
            <div className="flex gap-3 mt-4">
              <Link to={slides[current].link} className="px-6 py-2 rounded-lg font-bold bg-gradient-to-r from-blue-600 to-blue-400 text-white shadow-lg hover:from-blue-400 hover:to-blue-600 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 animate-pulse">
                {slides[current].button}
              </Link>
            </div>
          </div>
          {/* Right: Testimonial */}
          <motion.div
            className="hidden sm:flex flex-col items-center justify-center bg-white/30 backdrop-blur-lg rounded-2xl p-6 shadow-lg max-w-xs ml-0 sm:ml-8 mt-8 sm:mt-0 border border-blue-100/30"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <img src={TESTIMONIAL.avatar} alt={TESTIMONIAL.name} className="w-16 h-16 rounded-full border-4 border-blue-300 shadow mb-3" />
            <p className="text-base text-gray-900 font-medium italic mb-2 text-center">{TESTIMONIAL.quote}</p>
            <span className="text-xs text-gray-700 font-semibold">{TESTIMONIAL.name}</span>
          </motion.div>
        </div>
      </motion.div>
      {/* Navigation dots */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 z-20">
        {slides.map((slide, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="group"
            aria-label={`Go to slide ${index + 1}`}
          >
            <span className={`block w-3 h-3 rounded-full transition-all duration-200 ${
              current === index
                ? 'bg-blue-400 scale-125 shadow-lg shadow-blue-400/50'
                : 'bg-white/40 group-hover:bg-white/60 group-hover:scale-105'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
}