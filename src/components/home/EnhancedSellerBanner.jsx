import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function SellerBanner() {
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
      bgClass: 'bg-gradient-to-br from-neutral-900 via-neutral-950 to-neutral-900',
      accentColor: 'bg-amber-600 text-white hover:bg-amber-700'
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
      link: '/products',
      bgClass: 'bg-gradient-to-br from-neutral-900 to-neutral-950',
      accentColor: 'bg-amber-600 text-white hover:bg-amber-700'
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
      {/* Background image with overlay */}
      <div className="absolute inset-0">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500 opacity-20 sm:opacity-30"
          style={{ backgroundImage: `url(${slides[current].image})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#112d4e] via-[#112d4e]/95 to-[#112d4e]/80 sm:to-[#112d4e]/50" />
        <div className="absolute inset-0 backdrop-blur-sm" />
      </div>

      <motion.div className="relative z-10 h-full flex items-center w-full">
        <div className="w-full mx-auto px-3 xs:px-4 sm:px-6 lg:px-12 xl:px-16">
          <div className="max-w-4xl lg:max-w-5xl space-y-2 xs:space-y-3 sm:space-y-4 lg:space-y-6">
            {/* Tag and Heading group */}
            <div className="space-y-1 xs:space-y-2 sm:space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="hidden sm:inline-flex items-center h-6 lg:h-7 px-3 lg:px-4 rounded-full 
                  bg-gradient-to-r from-amber-600/20 to-orange-600/20 
                  border border-amber-500/30"
              >
                <span className="text-xs lg:text-sm font-medium text-amber-300">
                  {slides[current].tagline}
                </span>
              </motion.div>

              <motion.h2 
                className="text-lg xs:text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r 
                  from-white via-slate-200 to-indigo-300">
                  {slides[current].text}
                </span>
              </motion.h2>

              <motion.p 
                className="text-xs xs:text-sm sm:hidden text-slate-300 max-w-xs"
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
                    <i className={`${feature.icon} text-sm xs:text-base text-amber-400`} />
                    <span className="text-xs xs:text-sm text-gray-200">{feature.text}</span>
                  </motion.div>
                ))}
              </div>

              {/* Desktop description */}
              <motion.p 
                className="hidden sm:block text-sm lg:text-base text-gray-300 max-w-2xl"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {slides[current].description}
              </motion.p>

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
                    <i className={`${feature.icon} text-xl lg:text-2xl text-indigo-400`} />
                    <div>
                      <div className="text-sm lg:text-base font-medium text-white">{feature.text}</div>
                      <div className="text-xs lg:text-sm text-gray-400">{feature.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-2 xs:gap-3 sm:gap-4 pt-1 xs:pt-2">
              <Link to={slides[current].link} className="px-3 xs:px-4 sm:px-5 lg:px-6 py-1.5 xs:py-2 sm:py-2.5 text-xs xs:text-sm sm:text-base rounded-lg font-semibold bg-gradient-to-r 
                from-amber-600 to-amber-500 text-white hover:from-amber-500 
                hover:to-amber-600 transition-all duration-300 shadow-lg flex items-center justify-center">
                {slides[current].button}
              </Link>
              <Link to={current === 0 ? "/seller/guide" : "/seller/features"} className="hidden xs:block px-3 xs:px-4 sm:px-5 lg:px-6 py-1.5 xs:py-2 sm:py-2.5 text-xs xs:text-sm sm:text-base rounded-lg font-semibold border 
                border-gray-600 text-gray-200 hover:bg-white/10 transition-all duration-200 flex items-center justify-center">
                {slides[current].secondaryButton}
              </Link>
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
                ? 'bg-amber-400 scale-110 shadow-lg shadow-amber-400/50' 
                : 'bg-white/40 group-hover:bg-white/60 group-hover:scale-105'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
}