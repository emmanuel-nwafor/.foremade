import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';

export default function DailyDeals() {
  const [dealProducts, setDealProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  
  // Calculate time remaining for deals
  const [timeRemaining, setTimeRemaining] = useState({
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  // Set end time for deals (end of current day)
  useEffect(() => {
    const calculateTimeRemaining = () => {
      const now = new Date();
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);
      
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

  useEffect(() => {
    const fetchDailyDeals = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // In a real application, you would have a 'deal' or 'discount' field to query
        // For now, we'll just get products with price lower than a threshold
        const q = query(
          collection(db, 'products'),
          where('status', '==', 'approved'),
          orderBy('price', 'asc'),
          limit(10)
        );
        
        const querySnapshot = await getDocs(q);
        const allProducts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          // Add a fake discount percentage for demo purposes
          discountPercent: Math.floor(Math.random() * 30) + 10, // Random discount between 10% and 40%
          originalPrice: doc.data().price * (1 + (Math.floor(Math.random() * 30) + 10)/100)
        }));
        
        console.log('Daily Deals products:', allProducts);
        
        if (allProducts.length === 0) {
          console.warn('No deal products found.');
        }
        
        setDealProducts(allProducts);
      } catch (err) {
        console.error('Error loading daily deals:', {
          message: err.message,
          code: err.code,
        });
        setError('Failed to load daily deals.');
      } finally {
        setLoading(false);
      }
    };

    fetchDailyDeals();
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <section className="py-8 bg-yellow-50">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center">
              <i className="bx bx-time text-yellow-600 text-2xl mr-2"></i>
              <h2 className="text-lg md:text-xl font-bold text-gray-800">
                Daily Deals
              </h2>
              <div className="flex ml-4 space-x-2">
                <div className="h-6 bg-gray-200 rounded w-10 animate-pulse"></div>
                <span>:</span>
                <div className="h-6 bg-gray-200 rounded w-10 animate-pulse"></div>
                <span>:</span>
                <div className="h-6 bg-gray-200 rounded w-10 animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="bg-gray-200 rounded-full p-1 h-8 w-8 animate-pulse"></div>
              <div className="bg-gray-200 rounded-full p-1 h-8 w-8 animate-pulse"></div>
            </div>
          </div>
          <div className="flex overflow-x-auto scrollbar-hide">
            {[...Array(7)].map((_, index) => (
              <div key={index} className="flex-shrink-0 w-60 mr-4">
                <div className="bg-gray-200 rounded-lg h-72 w-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-yellow-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <i className="bx bx-time text-yellow-600 text-2xl mr-2"></i>
            <h2 className="text-lg md:text-xl font-bold text-gray-800">
              Daily Deals
            </h2>
            <div className="ml-4 flex items-center space-x-1">
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-mono">
                {String(timeRemaining.hours).padStart(2, '0')}
              </span>
              <span className="text-yellow-800">:</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-mono">
                {String(timeRemaining.minutes).padStart(2, '0')}
              </span>
              <span className="text-yellow-800">:</span>
              <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded font-mono">
                {String(timeRemaining.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/products?deals=true" className="text-blue-600 text-sm hover:text-blue-800">
              See All
            </Link>
            <button
              onClick={scrollLeft}
              className="bg-yellow-200 rounded-full p-1 hover:bg-yellow-300"
              aria-label="Scroll left"
            >
              <i className="bx bx-chevron-left text-xl text-yellow-700"></i>
            </button>
            <button
              onClick={scrollRight}
              className="bg-yellow-200 rounded-full p-1 hover:bg-yellow-300"
              aria-label="Scroll right"
            >
              <i className="bx bx-chevron-right text-xl text-yellow-700"></i>
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        >
          {dealProducts.length === 0 ? (
            <p className="text-gray-600 p-4">No deals available at the moment.</p>
          ) : (
            dealProducts.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-60 mr-4 snap-start"
              >
                <div className="relative">
                  <ProductCard product={product} />
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs font-bold">
                    {product.discountPercent}% OFF
                  </div>
                  <div className="mt-1">
                    <span className="text-gray-500 line-through text-xs">
                      ₦{(product.originalPrice || 0).toLocaleString('en-NG')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}