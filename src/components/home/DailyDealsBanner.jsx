import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';

export default function DailyDealsBanner() {
  const slides = [
    {
      image: 'https://res.cloudinary.com/dbczfoqnc/image/upload/v1751541163/products/kdcrrjozm0dq2r8a74zk.jpg',
      text: 'Daily Deals Await!',
      tagline: 'Limited Time Offers',
      description: 'Grab exclusive discounts on top products before they’re gone.',
      link: '/daily-deals',
    },
    {
      image: 'https://res.cloudinary.com/dbczfoqnc/image/upload/v1748369792/products/d3mt7oyewtwsswr9b9li.jpg',
      text: 'Hot Deals Today',
      tagline: 'Save Big Today',
      description: 'Explore the best deals available only for a short time.',
      link: '/daily-deals',
    },
  ];

  const [current, setCurrent] = useState(0);
  const [autoplay, setAutoplay] = useState(true);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    if (!autoplay) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [current, slides.length, autoplay]);

  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const endOfDay = new Date(now);
      endOfDay.setHours(23, 59, 59, 999); // End of the current day
      const diff = endOfDay - now;
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeRemaining({ hours, minutes, seconds });
    };
    calculateTimeRemaining();
    const timer = setInterval(calculateTimeRemaining, 1000);
    return () => clearInterval(timer);
  }, []);

  const goToSlide = (index) => {
    setCurrent(index);
    setAutoplay(false);
    setTimeout(() => setAutoplay(true), 10000);
  };

  return (
    <div className="relative overflow-hidden my-4 mx-2 sm:mx-4 lg:mx-6 rounded-2xl border border-neutral-800/30 h-[200px] xs:h-[220px] sm:h-[260px] lg:h-[300px]">
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
        <div className="w-full mx-auto px-3 xs:px-4 sm:px-8 lg:px-16 flex flex-col items-center justify-center gap-4 sm:gap-6 py-4 sm:py-6 flex-wrap">
          {/* Main Content */}
          <div className="text-center space-y-3 sm:space-y-4">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center h-6 px-3 rounded-full bg-gradient-to-r from-amber-600/30 to-orange-400/20 border border-amber-500/30"
            >
              <span className="text-xs font-medium text-amber-100 tracking-wide">
                {slides[current].tagline}
              </span>
            </motion.div>
            <motion.h2
              className="text-xl sm:text-2xl lg:text-3xl font-extrabold leading-tight text-white drop-shadow-lg"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {slides[current].text}
            </motion.h2>
            {/* Description only on sm screens and above */}
            <motion.p
              className="hidden sm:block text-sm sm:text-base text-white/90 max-w-md"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              {slides[current].description}
            </motion.p>
            {/* Timer for all screens */}
            <motion.div
              className="flex items-center justify-center space-x-2 sm:space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="bg-white/30 backdrop-blur-lg rounded-lg p-2 sm:p-3 border border-amber-100/30">
                <span className="text-lg sm:text-xl font-bold text-amber-600">{String(timeRemaining.hours).padStart(2, '0')}</span>
                <span className="text-xs sm:text-sm text-white/80 ml-1">Hours</span>
              </div>
              <span className="text-lg sm:text-xl text-white/80 font-bold">:</span>
              <div className="bg-white/30 backdrop-blur-lg rounded-lg p-2 sm:p-3 border border-amber-100/30">
                <span className="text-lg sm:text-xl font-bold text-amber-600">{String(timeRemaining.minutes).padStart(2, '0')}</span>
                <span className="text-xs sm:text-sm text-white/80 ml-1">Minutes</span>
              </div>
              <span className="text-lg sm:text-xl text-white/80 font-bold">:</span>
              <div className="bg-white/30 backdrop-blur-lg rounded-lg p-2 sm:p-3 border border-amber-100/30">
                <span className="text-lg sm:text-xl font-bold text-amber-600">{String(timeRemaining.seconds).padStart(2, '0')}</span>
                <span className="text-xs sm:text-sm text-white/80 ml-1">Seconds</span>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
      {/* Navigation dots */}
      <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 z-20">
        {slides.map((slide, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className="group"
            aria-label={`Go to slide ${index + 1}`}
          >
            <span className={`block w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
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