import React, { useState, useEffect } from 'react';
import { useWindowSize } from '../../hooks/useWindowSize';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '/src/firebase';

const Carousel = () => {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);
  const { width, isDesktop, isMobile, isTablet } = useWindowSize();

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
          console.log('Raw slide data:', rawData);
          
          const data = {
            id: doc.id,
            mediaType: rawData.mediaType || (rawData.desktop?.toLowerCase().match(/\.(mp4|webm)$/i) ? 'video' : 'image'),
            desktopMedia: rawData.desktop,
            tabletMedia: rawData.tablet,
            mobileMedia: rawData.mobile,
            buttonText: rawData.buttonText || '',
            buttonUrl: rawData.buttonUrl || '',
            buttonStyle: rawData.buttonStyle || 'primary',
            alt: rawData.alt || `Slide ${doc.id}`,
            createdAt: rawData.createdAt
          };
          
          slideMap.set(doc.id, data);
          
          console.log('Slide data:', {
            id: data.id,
            hasDesktop: !!data.desktopMedia,
            hasTablet: !!data.tabletMedia,
            hasMobile: !!data.mobileMedia,
            mediaType: data.mediaType,
            mediaUrls: {
              desktop: data.desktopMedia,
              tablet: data.tabletMedia,
              mobile: data.mobileMedia
            }
          });
        });
        
        const slideData = Array.from(slideMap.values())
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
          
        console.log('Total slides fetched:', slideData.length);
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
      console.warn('Attempt to get media for undefined slide');
      return null;
    }

    // For videos, prioritize desktop version as fallback
    if (slide.mediaType === 'video') {
      const media = slide.desktopMedia || slide.tabletMedia || slide.mobileMedia;
      if (!media) {
        console.warn('No media found for video slide:', slide.id);
      }
      return media;
    }

    // For images, use responsive selection
    let media = null;
    if (isDesktop) media = slide.desktopMedia;
    else if (isTablet) media = slide.tabletMedia;
    else if (isMobile) media = slide.mobileMedia;

    // Fallback chain
    if (!media) {
      media = slide.desktopMedia || slide.tabletMedia || slide.mobileMedia;
      if (!media) {
        console.warn('No media found for slide:', slide.id);
      }
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
              ? 'opacity-100 transform translate-x-0'
              : index === prevSlide
              ? 'opacity-0 transform -translate-x-10'
              : 'opacity-0 transform translate-x-10'
          }`}
        >
          <div className="relative w-full h-full">
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
                preload="auto"
                onLoadStart={() => {
                  console.log('Video load started:', { slideId: slide.id, url: getResponsiveMedia(slide) });
                }}
                onError={(e) => {
                  console.error('Video load error:', { 
                    slideId: slide.id, 
                    url: getResponsiveMedia(slide),
                    error: e.target.error
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
            {slide.buttonText && slide.buttonUrl && (
              <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2">
                <a
                  href={slide.buttonUrl}
                  className={`
                    inline-flex items-center justify-center
                    px-6 py-3 min-w-[140px]
                    rounded-lg font-medium text-base
                    transition-colors duration-200 ease-in-out
                    ${slide.buttonStyle === 'primary' 
                      ? 'bg-[#112d4e] hover:bg-[#0f2a44] text-white shadow-md' 
                      : slide.buttonStyle === 'secondary'
                      ? 'bg-[#FF5722] hover:bg-[#FF8A65] text-white shadow-md'
                      : 'bg-white hover:bg-gray-100 text-gray-900 shadow-md'
                    }
                  `}
                >
                  {slide.buttonText}
                </a>
              </div>
            )}
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