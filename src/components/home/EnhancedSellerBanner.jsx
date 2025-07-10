import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

const TRUST_BADGES = [
  { icon: 'bx bx-shield', label: 'Seller Protection' },
  { icon: 'bx bx-credit-card', label: 'Secure Payments' },
  { icon: 'bx bx-rocket', label: 'Fast Payouts' },
];

const TESTIMONIAL = {
  quote: '“Foremade helped me turn my side hustle into a real business. The dashboard and support are world-class!”',
  name: 'Sarah M., London',
  avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
};

export default function EnhancedSellerBanner() {
  const slides = [
    {
      image: 'https://pngimg.com/uploads/fan/fan_PNG14457.png',
      text: 'Start Your Business Journey',
      tagline: 'Empowering Entrepreneurs',
      description: 'Join our marketplace and transform your passion into profit',
      features: [
        { icon: 'bx bx-chart', text: 'Analytics Dashboard', desc: 'Track your growth' },
        { icon: 'bx bx-shield-plus', text: 'Secure Payments', desc: 'Protected transactions' }
      ],
      button: 'Start Selling',
      secondaryButton: 'Learn More',
      link: '/sell',
    },
    {
      image: 'https://pngimg.com/uploads/laptop/laptop_PNG101773.png',
      text: 'Grow Your Business',
      tagline: 'Scale Globally',
      description: 'Reach millions of potential customers worldwide',
      features: [
        { icon: 'bx bx-globe', text: 'Global Reach', desc: 'Worldwide audience' },
        { icon: 'bx bx-trending-up', text: 'Growth Tools', desc: 'Marketing suite' }
      ],
      button: 'Learn More',
      secondaryButton: 'View Features',
      link: '/pro-seller-guide',
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
    <div className="relative overflow-hidden my-4 mx-2 sm:mx-4 lg:mx-6 rounded-2xl border border-neutral-800/30 h-[240px] xs:h-[260px] sm:h-[320px] lg:h-[440px] shadow-xl">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-amber-600 via-orange-400/60 to-blue-900 animate-gradient-x"
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
              className="inline-flex items-center h-7 px-4 rounded-full bg-gradient-to-r from-amber-600/30 to-orange-400/20 border border-amber-500/30 mb-1"
            >
              <span className="text-xs font-medium text-amber-100 tracking-wide">
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
              <Link to={slides[current].link} className="px-6 py-2 rounded-lg font-bold bg-gradient-to-r from-amber-500 to-orange-400 text-white shadow-lg hover:from-orange-400 hover:to-amber-500 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-amber-400 animate-pulse">
                {slides[current].button}
              </Link>
            </div>
          </div>
          {/* Right: Testimonial */}
          <motion.div
            className="hidden sm:flex flex-col items-center justify-center bg-white/30 backdrop-blur-lg rounded-2xl p-6 shadow-lg max-w-xs ml-0 sm:ml-8 mt-8 sm:mt-0 border border-amber-100/30"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <img src={TESTIMONIAL.avatar} alt={TESTIMONIAL.name} className="w-16 h-16 rounded-full border-4 border-amber-300 shadow mb-3" />
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
                ? 'bg-amber-400 scale-125 shadow-lg shadow-amber-400/50'
                : 'bg-white/40 group-hover:bg-white/60 group-hover:scale-105'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
}