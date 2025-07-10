import { useRef, useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import db from '../../db.json';
import SkeletonLoader from '../common/SkeletonLoader';

const TopStores = () => {
  const scrollRef = useRef(null);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [isPaused, setIsPaused] = useState(false);
  const navigate = useNavigate();

  // Load favorites from localStorage on mount
  useEffect(() => {
    const storedFavorites = localStorage.getItem('favorites');
    if (storedFavorites) {
      setFavorites(JSON.parse(storedFavorites));
    }
  }, []);

  // Save favorites to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  // Fetch stores from db.json
  useEffect(() => {
    const fetchStores = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 1500)); // 1.5-second delay
        const storeData = Array.isArray(db.stores) ? db.stores : [];
        setStores(storeData);
      } catch (err) {
        console.error('Error loading stores from db.json:', err);
        setStores([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStores();
  }, []);

  // Auto-scrolling logic
  useEffect(() => {
    if (loading || !scrollRef.current || isPaused) return;

    const scrollInterval = setInterval(() => {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      const maxScroll = scrollWidth - clientWidth;

      if (scrollLeft >= maxScroll - 1) {
        scrollRef.current.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
      }
    }, 10000); // Every 10 seconds

    return () => clearInterval(scrollInterval);
  }, [loading, isPaused]);

  // Pause auto-scrolling on user interaction
  const handleInteractionStart = () => {
    setIsPaused(true);
  };

  // Resume auto-scrolling when interaction ends
  const handleInteractionEnd = () => {
    setIsPaused(false);
  };

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const formatPrice = (price) => {
    return `₦${price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const handleStoreClick = (storeId) => {
    navigate(`/store/${storeId}`);
  };

  const toggleFavorite = (productId) => {
    setFavorites((prevFavorites) => {
      if (prevFavorites.includes(productId)) {
        return prevFavorites.filter((id) => id !== productId);
      }
      return [...prevFavorites, productId];
    });
  };

  if (loading) {
    return (
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-800">Top Stores</h2>
            <div className="flex items-center gap-3">
              <div className="h-5 bg-gray-200 rounded w-16"></div>
              <div className="bg-gray-200 rounded-full p-1 h-8 w-8 sm:hidden"></div>
              <div className="bg-gray-200 rounded-full p-1 h-8 w-8 sm:hidden"></div>
            </div>
          </div>
          <div className="sm:grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 sm:gap-4 flex overflow-x-auto scrollbar-hide">
            <SkeletonLoader type="default" count={4} />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">Top Stores</h2>
          <div className="flex items-center gap-3">
            <Link to="/stores" className="text-blue-600 text-sm hover:text-blue-400">
              View All
            </Link>
            <button
              onClick={scrollLeft}
              className="bg-gray-200 rounded-full p-1 hover:bg-gray-300 sm:hidden"
            >
              <i className="bx bx-chevron-left text-xl text-gray-600"></i>
            </button>
            <button
              onClick={scrollRight}
              className="bg-gray-200 rounded-full p-1 hover:bg-gray-300 sm:hidden"
            >
              <i className="bx bx-chevron-right text-xl text-gray-600"></i>
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="sm:grid sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 sm:gap-4 flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
          onTouchStart={handleInteractionStart}
          onTouchEnd={handleInteractionEnd}
          onMouseDown={handleInteractionStart}
          onMouseUp={handleInteractionEnd}
          onMouseLeave={handleInteractionEnd}
        >
          {stores.length === 0 ? (
            <p className="text-gray-600 p-4">No stores available.</p>
          ) : (
            stores.map((store) => (
              <div
                key={store.id}
                className="flex-shrink-0 w-80 sm:w-auto mr-4 sm:mr-0 bg-gray-100 border border-gray-200 rounded-lg p-4 hover:bg-gray-200 cursor-pointer snap-start transition-all duration-300"
                onClick={() => handleStoreClick(store.id)}
              >
                <div className="flex justify-between items-center mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">{store.name}</h3>
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <i
                        key={i}
                        className={`bx bx-star text-yellow-400 text-sm ${
                          i < Math.floor(store.rating) ? 'bx-star-filled' : ''
                        }`}
                      ></i>
                    ))}
                    <span className="text-xs text-gray-600 ml-1">({store.reviews?.length || 0})</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {store.products.map((product, index) => (
                    <div key={index} className="flex flex-col items-center relative">
                      <Link
                        to={`/product/${product.id}`}
                        className="flex flex-col items-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-md"
                          onError={(e) => (e.target.src = 'https://via.placeholder.com/80?text=Image+Not+Found')}
                        />
                        <p className="text-xs text-gray-600 mt-1">{formatPrice(product.price)}</p>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(product.id);
                        }}
                        className="absolute top-1 right-1 text-xl"
                      >
                        <i
                          className={`bx bx-heart ${
                            favorites.includes(product.id) ? 'text-red-500' : 'text-gray-400'
                          } hover:text-red-400`}
                        ></i>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default TopStores;