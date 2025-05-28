import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const CategoriesCarousel = ({ category }) => {
  const [slides, setSlides] = useState([]);
  const [current, setCurrent] = useState(0);
  const location = useLocation();

  // Determine the search query based on the category
  const getSearchQuery = () => {
    if (!category) {
      return 'ecommerce'; // Default fallback query
    }
    const categoryMap = {
      'Drinks & Categories': 'drinks',
      'Electronics': 'electronics',
      'Games & Fun': 'games',
      'Health & Beauty': 'health beauty',
      'Home & Kitchen': 'home kitchen',
      'Smart Watches': 'smart watches',
      'Tablet & Phones': 'phones',
      'Computers & Accessories': 'computer accessories',
      'Baby Products': 'baby products',
    };
    return categoryMap[category] || category.toLowerCase().replace('&', '').replace(/\s+/g, ' ').trim();
  };

  // Function to fetch images from Pexels API based on category
  const fetchImages = async () => {
    try {
      const searchQuery = getSearchQuery();
      const randomPage = Math.floor(Math.random() * 100) + 1;
      const response = await fetch(
        `https://api.pexels.com/v1/search?query=${encodeURIComponent(searchQuery)}&per_page=3&page=${randomPage}`,
        {
          headers: {
            Authorization: '51SPMrbmugFd8lKtgNuHKLUvegqD5d7cO0YF8fWYJ6ZySEFmi3MdBz0N',
          },
        }
      );
      const data = await response.json();
      const fetchedImages = data.photos.map((photo) => photo.src.landscape);

      // Slide data with only category name
      const slideData = [
        { text: category },
        { text: category },
        { text: category },
      ];

      // Combine fetched images with slide data
      const updatedSlides = slideData.map((slide, index) => ({
        ...slide,
        image: fetchedImages[index] || 'https://via.placeholder.com/1200x400?text=Image+Not+Found',
      }));
      setSlides(updatedSlides);
    } catch (error) {
      console.error('Error fetching images:', error);
      const fallbackSlideData = [
        { text: category || 'Marketplace' },
        { text: category || 'Marketplace' },
        { text: category || 'Marketplace' },
      ];
      setSlides(
        fallbackSlideData.map((slide) => ({
          ...slide,
          image: 'https://via.placeholder.com/1200x400?text=Image+Not+Found',
        }))
      );
    }
  };

  // Fetch images when the category changes and auto-slide
  useEffect(() => {
    fetchImages();

    const imageRefreshInterval = setInterval(() => {
      fetchImages();
    }, 30 * 60 * 1000); // 30 minutes

    const autoSlideInterval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 5000); // Change image every 5 seconds

    return () => {
      clearInterval(imageRefreshInterval);
      clearInterval(autoSlideInterval);
    };
  }, [category, slides.length]);

  // Skeleton loader while fetching images
  if (slides.length === 0) {
    return (
      <div className="relative h-[180px] sm:h-[180px] md:h-[200px] lg:h-[250px] xl:h-[300px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <div className="w-full h-full bg-gray-200 animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-[180px] sm:h-[180px] md:h-[200px] lg:h-[250px] xl:h-[300px] w-full overflow-hidden">
      {slides.map((slide, index) => (
        <div
          key={index}
          className={index === current ? 'block' : 'hidden'}
        >
          <img
            src={slide.image}
            alt={`Category ${category}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center p-2 sm:p-4 md:p-6 lg:p-8 bg-black bg-opacity-30">
            <h2 className="text-md text-center text-white md:text-lg lg:text-xl xl:text-2xl font-bold">
              {slide.text}
            </h2>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoriesCarousel;