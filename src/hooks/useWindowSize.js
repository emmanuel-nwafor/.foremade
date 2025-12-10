import { useState, useEffect } from 'react';

export const useWindowSize = () => {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Compute device type based on width breakpoints
  // Desktop >= 1024, Tablet >= 768, Mobile < 768
  const isDesktop = windowSize.width >= 1024;
  const isTablet = windowSize.width >= 768 && windowSize.width < 1024;
  const isMobile = windowSize.width < 768;

  return {
    ...windowSize,
    isDesktop,
    isTablet,
    isMobile,
  };
};
