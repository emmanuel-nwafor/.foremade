import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const FloatingElement = ({ children, delay = 0 }) => (
  <motion.div
    animate={{ 
      y: [0, -10, 0],
      rotate: [0, -2, 0] 
    }}
    transition={{ 
      repeat: Infinity,
      duration: 4,
      delay,
      ease: "easeInOut" 
    }}
  >
    {children}
  </motion.div>
);

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
      bgClass: 'bg-gradient-to-br from-slate-800 via-slate-900 to-slate-800',
      accentColor: 'bg-indigo-600 text-white hover:bg-indigo-700'
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
      bgClass: 'bg-gradient-to-br from-slate-800 to-slate-900',
      accentColor: 'bg-indigo-600 text-white hover:bg-indigo-700'
    }
  ];

  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);

  useEffect(() => {
    if (!autoplay) return;
    
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000); // Slide every 5 seconds
    
    return () => clearInterval(timer);
  }, [current, slides.length, autoplay]);

  const goToSlide = (index) => {
    setCurrent(index);
    setAutoplay(false);
    
    // Resume autoplay after a period of inactivity
    setTimeout(() => setAutoplay(true), 10000);
  };

  return (
    <div className="relative overflow-hidden my-4 mx-4 rounded-xl border border-slate-700/50 h-[300px]">
      {/* Background image with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
        style={{ backgroundImage: `url(${slides[current].image})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-900/50"></div>
        <div className="absolute inset-0 backdrop-blur-sm"></div>
      </div>

      <motion.div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-8">
          <div className="max-w-xl space-y-5">
            {/* Tag and Heading group */}
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="inline-flex items-center h-5 px-3 rounded-full 
                  bg-gradient-to-r from-indigo-600/20 to-purple-600/20 
                  border border-indigo-500/20"
              >
                <span className="text-xs font-medium text-indigo-400">
                  {slides[current].tagline}
                </span>
              </motion.div>

              <motion.h2 
                className="text-3xl font-bold leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <span className="text-transparent bg-clip-text bg-gradient-to-r 
                  from-white via-slate-200 to-indigo-300">
                  {slides[current].text}
                </span>
              </motion.h2>
            </div>

            {/* Description and Features group */}
            <div className="space-y-4">
              <motion.p 
                className="text-sm text-gray-300 max-w-md"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {slides[current].description}
              </motion.p>

              <div className="flex gap-6">
                {slides[current].features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center space-x-2"
                  >
                    <i className={`${feature.icon} text-xl text-indigo-400`}></i>
                    <div>
                      <div className="text-sm font-medium text-white">{feature.text}</div>
                      <div className="text-xs text-gray-400">{feature.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 pt-2">
              <Link 
                to={slides[current].link}
                className="px-4 py-1.5 text-sm rounded-lg font-semibold bg-gradient-to-r 
                  from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 
                  hover:to-indigo-600 transition-all duration-300"
              >
                {slides[current].button}
              </Link>
              <button className="px-4 py-1.5 text-sm rounded-lg font-semibold border 
                border-gray-700 text-gray-300 hover:bg-white/5">
                {slides[current].secondaryButton}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Navigation dots */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-4">
        {slides.map((slide, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="group flex items-center space-x-2"
          >
            <span className={`w-3 h-3 rounded-full transition-all ${
              current === index ? 'bg-indigo-500 scale-110' : 'bg-white/30 group-hover:bg-white/50'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
}