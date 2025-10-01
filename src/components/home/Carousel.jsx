import React, { useState, useEffect } from 'react';
import { useWindowSize } from '../../hooks/useWindowSize';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { db } from '/src/firebase';

const Carousel = () => {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const [prevSlide, setPrevSlide] = useState(null);
  const { width } = useWindowSize();

  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const slidesCollection = collection(db, 'settings/carousel/slides');
        const querySnapshot = await getDocs(slidesCollection);
        const slideData = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data()
        }));
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
    if (width < 640) return slide.mobile;
    if (width < 1024) return slide.tablet;
    return slide.desktop;
  };

  const isVideo = (slide) => {
    if (slide.mediaType === 'video') return true;
    const url = getResponsiveMedia(slide);
    return url && (url.endsWith('.mp4') || url.endsWith('.webm'));
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
                src={getResponsiveMedia(slide)}
                alt={slide.alt || `Slide ${slide.id}`}
                className="w-full h-full object-cover object-center sm:object-[50%_50%]"
                style={{ objectPosition: 'center 35%' }}
                autoPlay
                loop
                muted
                playsInline
                onError={(e) => {
                  console.warn('Video load error:', { slideId: slide.id, url: getResponsiveMedia(slide) });
                }}
              />
            ) : (
              <img
                src={getResponsiveMedia(slide)}
                alt={slide.alt || `Slide ${slide.id}`}
                className="w-full h-full object-cover object-center sm:object-[50%_50%]"
                style={{ objectPosition: 'center 35%' }}
                loading="lazy"
                onError={(e) => {
                  console.warn('Image load error:', { slideId: slide.id, url: getResponsiveMedia(slide) });
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