import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWindowSize } from '../../hooks/useWindowSize';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '/src/firebase';

const Carousel = () => {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);
  const { width, isDesktop, isMobile, isTablet } = useWindowSize();
  const navigate = useNavigate();

  // Helper to handle navigation for a slide click. Exported as a function inside the component
  // so it can use `navigate` and be reused from the wrapper handlers.
  const handleSlideClick = (slide, e) => {
  // navigation handler invoked
    if (!slide?.buttonUrl) {
      return;
    }
    if (e && typeof e.preventDefault === 'function') e.preventDefault();
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation();
    try {
      const url = slide.buttonUrl;
      let resolved;
      try {
        resolved = new URL(url, window.location.href);
      } catch (err) {
        // failed to parse URL; fall back to heuristics
      }

      if (resolved) {
  const isInternal = resolved.origin === window.location.origin && resolved.pathname.startsWith('/');
        if (isInternal) {
          // Use resolved.pathname to avoid accidental full-url navigation
          const path = resolved.pathname + (resolved.search || '') + (resolved.hash || '');
          // navigating internal
          navigate(path);
          return;
        }
        // External
  // external link handling
        const openInNewTab = window.confirm('You are leaving Foremade.\n\nPress OK to open the link in a new tab, or Cancel to open it in this tab.');
  if (openInNewTab) window.open(resolved.href, '_blank', 'noopener');
        else window.location.assign(resolved.href);
        return;
      }

      // If we couldn't parse, fall back to simple heuristics
      if (url.startsWith('/')) {
        navigate(url);
      } else if (/^https?:\/\//i.test(url)) {
  const openInNewTab = window.confirm('You are leaving Foremade.\n\nPress OK to open the link in a new tab, or Cancel to open it in this tab.');
  if (openInNewTab) window.open(url, '_blank', 'noopener');
        else window.location.assign(url);
      } else {
        // treat as relative path
        const path = url.startsWith('/') ? url : `/${url}`;
        navigate(path);
      }
    } catch (err) {
      console.error('Failed to navigate to banner URL', err);
      try { window.location.assign(slide.buttonUrl); } catch (e) { /* swallow */ }
    }
  };

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        // Get slides from new path with proper collection reference
        const slidesCollection = collection(db, 'settings', 'carousel', 'slides');
        const querySnapshot = await getDocs(slidesCollection);

        // Process slides and keep only unique ones using a Map for deduplication
        const slideMap = new Map();

        // Clear any cached slides
        sessionStorage.removeItem('carousel_slides');

        querySnapshot.docs.forEach((doc) => {
          const rawData = doc.data();
          

          // Normalize buttonUrl so relative paths become absolute internal paths starting with '/'
          const computedButtonUrl = rawData.buttonUrl
            ? /^https?:\/\//i.test(rawData.buttonUrl)
              ? rawData.buttonUrl
              : rawData.buttonUrl.startsWith('/')
              ? rawData.buttonUrl
              : `/${rawData.buttonUrl}`
            : '';

          const data = {
            id: doc.id,
            mediaType: rawData.mediaType || (rawData.desktop?.toLowerCase().match(/\.(mp4|webm)$/i) ? 'video' : 'image'),
            desktopMedia: rawData.desktop,
            tabletMedia: rawData.tablet,
            mobileMedia: rawData.mobile,
            buttonText: rawData.buttonText || '',
            buttonUrl: computedButtonUrl,
            buttonStyle: rawData.buttonStyle || 'primary',
            alt: rawData.alt || `Slide ${doc.id}`,
            createdAt: rawData.createdAt
          };

          slideMap.set(doc.id, data);

        });

        const slideData = Array.from(slideMap.values())
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        
        setSlides(slideData);
      } catch (err) {
        console.error('Error fetching slides:', err);
      }
    };
    fetchSlides();
  }, []);

  useEffect(() => {
    if (slides.length === 0) return;
    const timer = setInterval(() => {
      setPrevSlide(current);
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [current, slides.length]);

    const getResponsiveMedia = (slide) => {
    if (!slide) {
      return null;
    }

    // For videos, prioritize desktop version as fallback
    if (slide.mediaType === 'video') {
      const media = slide.desktopMedia || slide.tabletMedia || slide.mobileMedia;
      if (!media) {
        // no media for video slide
      }
      return media;
    }

      // For images, decide by actual window width breakpoints to avoid relying on possibly-buggy booleans
      // Use common Tailwind-like breakpoints: desktop >= 1024, tablet >= 768, mobile < 768
      let media = null;
      try {
        const w = typeof width === 'number' ? width : window.innerWidth;
        if (w >= 1024) {
          media = slide.desktopMedia;
        } else if (w >= 768) {
          media = slide.tabletMedia || slide.desktopMedia;
        } else {
          media = slide.mobileMedia || slide.tabletMedia || slide.desktopMedia;
        }
      } catch (err) {
        // Fallback to existing chain if width not available
        media = slide.desktopMedia || slide.tabletMedia || slide.mobileMedia;
      }

      if (!media) {
        // no media found
      }

      return media;
  };

  const isVideo = (slide) => {
    // First check the explicit mediaType
    if (slide.mediaType === 'video') return true;
    
    // Then check the URL extension
    const url = getResponsiveMedia(slide);
    const videoExtensions = ['.mp4', '.webm', '.mov'];
    return url && videoExtensions.some(ext => url.toLowerCase().endsWith(ext));
  };

  if (slides.length === 0) {
    return (
      <div className="relative h-[310px] sm:h-[310px] md:h-[310px] lg:h-[400px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gray-200 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[300px] sm:h-[400px] md:h-[300px] lg:h-[500px] w-full overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            index === current
              ? 'opacity-100 transform translate-x-0 z-20 pointer-events-auto'
              : index === prevSlide
              ? 'opacity-0 transform -translate-x-10 z-0 pointer-events-none'
              : 'opacity-0 transform translate-x-10 z-0 pointer-events-none'
          } cursor-pointer`}
          onClick={(e) => { handleSlideClick(slide, e); }}
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') ) { e.preventDefault(); handleSlideClick(slide, e); } }}
          role={slide.buttonUrl ? 'link' : undefined}
          tabIndex={slide.buttonUrl ? 0 : -1}
        >
          <div className="relative w-full h-full">
            <div className="w-full h-full">
            {isVideo(slide) ? (
              <video
                key={slide.id}
                src={getResponsiveMedia(slide)}
                className="w-full h-full object-cover object-center sm:object-[50%_50%]"
                style={{ objectPosition: 'center 35%' }}
                autoPlay
                loop
                muted
                playsInline
                controls={false}
                preload="metadata"
                crossOrigin="anonymous"
                onCanPlay={() => {}}
                onLoadStart={() => {}}
                onError={(e) => {
                  console.error('Video load error:', {
                    slideId: slide.id,
                    url: getResponsiveMedia(slide),
                    error: e.target.error,
                    networkState: e.target.networkState
                  });
                }}
              />
            ) : (
              <img
                key={slide.id}
                src={getResponsiveMedia(slide)}
                alt={slide.alt || `Slide ${slide.id}`}
                className="w-full h-full object-cover object-center sm:object-[50%_50%]"
                style={{ objectPosition: 'center 35%' }}
                crossOrigin="anonymous"
                loading="eager"
                onError={(e) => {
                  console.error('Image load error:', { 
                    slideId: slide.id, 
                    url: getResponsiveMedia(slide),
                    desktop: slide.desktopMedia,
                    tablet: slide.tabletMedia,
                    mobile: slide.mobileMedia
                  });
                  // Try to show a default placeholder if image fails
                  e.target.src = '/src/assets/placeholder.png';
                  e.target.onerror = null; // Prevent infinite loop if placeholder also fails
                }}
              />
            )}
            {slide.buttonUrl && (
              <div className="absolute top-3 right-3 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-md pointer-events-none">
                Open
              </div>
            )}
            {/* Banner click navigates to slide.buttonUrl; CTA button removed per design */}
            </div>
          </div>
        </div>
      ))}
      {/* <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-2 h-2 rounded-full transition-colors ${
              index === current ? 'bg-white' : 'bg-white bg-opacity-50'
            }`}
          />
        ))}
      </div> */}
    </div>
  );
};

export default Carousel;