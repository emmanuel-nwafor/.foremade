import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

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
    <div className="relative overflow-hidden my-4 mx-4 rounded-xl border border-blue-900/30 h-[300px]">
      {/* Background with overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-all duration-500"
        style={{ backgroundImage: `url(${slides[current].image})` }}
      >
        <div className="absolute inset-0 bg-gradient-to-l from-blue-900 via-blue-900/95 to-blue-900/50"></div>
        <div className="absolute inset-0 backdrop-blur-sm"></div>
      </div>

      <motion.div className="relative z-10 h-full flex items-center">
        <div className="container mx-auto px-8">
          <div className="max-w-xl ml-auto space-y-5">
            {/* Tag and Heading group */}
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="inline-block px-3 py-1 rounded-full bg-blue-600/10 
                  text-xs font-medium text-blue-400"
              >
                {slides[current].tagline}
              </motion.div>

              <motion.h2 
                className="text-3xl font-bold text-white leading-tight"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {slides[current].text}
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
                    <i className={`${feature.icon} text-xl text-blue-400`}></i>
                    <div>
                      <span className="text-sm text-gray-300">{feature.text}</span>
                      <div className="text-xs text-gray-500">{feature.desc}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3 pt-2">
              <Link 
                to={slides[current].link}
                className={`px-4 py-1.5 text-sm rounded-lg font-semibold ${slides[current].accentColor}`}
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
              current === index ? 'bg-blue-500 scale-110' : 'bg-white/30 group-hover:bg-white/50'
            }`} />
          </button>
        ))}
      </div>
    </div>
  );
}