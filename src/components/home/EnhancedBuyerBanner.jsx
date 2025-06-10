import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function BuyerBanner() {
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
      bgClass: 'bg-gradient-to-br from-blue-900 via-blue-950 to-slate-900',
      accentColor: 'bg-blue-500 text-white hover:bg-blue-600'
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
      link: '/electronics',
      bgClass: 'bg-gradient-to-br from-gray-900 to-blue-900',
      accentColor: 'bg-blue-500 text-white hover:bg-blue-600'
    }
  ];

  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    
    return () => clearInterval(timer);
  }, [current, slides.length, autoplay]);

  const goToSlide = (index) => {
    setCurrent(index);
    setAutoplay(false);
    setTimeout(() => setAutoplay(true), 10000);
  };

  return (
    <div className="relative overflow-hidden my-2 sm:my-4 lg:my-6 mx-2 sm:mx-4 lg:mx-6 rounded-xl border border-neutral-700/50 h-[200px] xs:h-[220px] sm:h-[280px] lg:h-[400px]">
      {/* Background with overlay */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500 opacity-20 sm:opacity-30"
          style={{ backgroundImage: `url(${slides[current].image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-l from-[#112d4e] via-[#112d4e]/95 to-[#112d4e]/80 sm:to-[#112d4e]/50" />
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      <motion.div className="relative z-10 h-full flex items-center w-full">
        <div className="w-full mx-auto px-3 xs:px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="max-w-4xl lg:max-w-5xl ml-auto space-y-2 xs:space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Tag and Heading group */}
            <div className="space-y-1 xs:space-y-2 sm:space-y-3">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hidden sm:inline-block px-3 py-1 rounded-full bg-blue-600/20 
                  text-xs font-medium text-blue-300 border border-blue-500/30"
              >
                {slides[current].tagline}
              </motion.div>

              <motion.h2 
                className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-white leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {slides[current].text}
              </motion.h2>

              <motion.p 
                className="text-xs xs:text-sm sm:hidden text-blue-100/80 max-w-xs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {slides[current].description}
              </motion.p>
            </div>

            {/* Features - Mobile: simplified, Desktop: full */}
            <div className="space-y-3 sm:space-y-4 w-full">
              {/* Mobile features - simplified */}
              <div className="flex sm:hidden gap-4 xs:gap-6">
                {slides[current].features.slice(0, 2).map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-2"
                  >
                    <i className={`${feature.icon} text-sm xs:text-base text-blue-400`} />
                    <span className="text-xs xs:text-sm text-gray-200">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Desktop features - full */}
              <div className="hidden sm:flex gap-6 lg:gap-8 w-full">
                {slides[current].features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-3"
                  >
                    <i className={`${feature.icon} text-xl lg:text-2xl text-blue-400`} />
                    <div>
                      <div className="text-sm lg:text-base font-medium text-white">{feature.text}</div>
                      <div className="text-xs lg:text-sm text-gray-300">{feature.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Desktop description */}
              <motion.p 
                className="hidden sm:block text-sm lg:text-base text-blue-100/80 max-w-2xl"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {slides[current].description}
              </motion.p>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-2 xs:gap-3 sm:gap-4 pt-1 xs:pt-2">
              <button className="px-3 xs:px-4 sm:px-5 lg:px-6 py-1.5 xs:py-2 sm:py-2.5 text-xs xs:text-sm sm:text-base rounded-lg font-semibold bg-blue-500 text-white hover:bg-blue-600 transition-colors duration-200 shadow-lg">
                {slides[current].button}
              </button>
              <button className="hidden xs:block px-3 xs:px-4 sm:px-5 lg:px-6 py-1.5 xs:py-2 sm:py-2.5 text-xs xs:text-sm sm:text-base rounded-lg font-semibold border border-gray-600 text-gray-200 hover:bg-white/10 transition-all duration-200">
                {slides[current].secondaryButton}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation dots */}
      <div className="absolute bottom-2 xs:bottom-3 sm:bottom-4 left-0 right-0 flex justify-center gap-2 sm:gap-3">
        {slides.map((slide, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="group"
          >
            <span className={`block w-2 h-2 xs:w-2.5 xs:h-2.5 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
              current === index 
                ? 'bg-blue-400 scale-110 shadow-lg shadow-blue-400/50' 
                : 'bg-white/40 group-hover:bg-white/60 group-hover:scale-105'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
}