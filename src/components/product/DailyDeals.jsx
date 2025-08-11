import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';

const retryWithBackoff = async (fn, maxRetries = 3, baseDelay = 1000) => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxRetries) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.warn(`Retry ${attempt}/${maxRetries} after ${delay}ms due to: ${err.message}`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
};

const FALLBACK_IMAGE = 'https://via.placeholder.com/200?text=No+Image';

const DailyDeals = () => {
  const [dealProducts, setDealProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);
  const [timeRemaining, setTimeRemaining] = useState({ hours: 0, minutes: 0, seconds: 0 });

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

        const dealSnapshot = await retryWithBackoff(() =>
          getDocs(collection(db, 'dailyDeals'))
        );
        const dealData = dealSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('Raw deals:', dealData);

        const validDeals = dealData.filter((deal) => new Date(deal.endDate) > new Date());
        console.log('Valid deals:', validDeals);

        const dealsWithDetails = await Promise.all(
          validDeals.map(async (deal) => {
            const productDoc = await retryWithBackoff(() =>
              getDoc(doc(db, 'products', deal.productId))
            );
            const productData = productDoc.exists() ? productDoc.data() : {};
            console.log(`Product for deal ${deal.id}:`, productData);

            const imageUrl = Array.isArray(productData.imageUrls) && productData.imageUrls.length > 0
              ? productData.imageUrls[0]
              : FALLBACK_IMAGE;
            console.log(`Image for deal ${deal.id}:`, imageUrl);

            // Update or create document with isDailyDeal flag
            const dealRef = doc(db, 'dailyDeals', deal.id);
            await setDoc(dealRef, { isDailyDeal: true }, { merge: true });

            return {
              id: deal.id,
              productId: deal.productId,
              productName: productData.name || 'Unnamed Product',
              originalPrice: productData.price || 0,
              discountPercent: (deal.discount * 100).toFixed(2),
              imageUrl,
              description: productData.description || 'No description available',
              condition: productData.condition || '',
              startDate: deal.startDate,
              endDate: deal.endDate,
              isDailyDeal: true,
            };
          })
        );

        console.log('Final deal products:', dealsWithDetails);
        setDealProducts(dealsWithDetails);
      } catch (err) {
        console.error('Error loading daily deals:', {
          message: err.message,
          stack: err.stack,
        });
        setError('Failed to load daily deals. Please try again later.');
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
      <section className="py-4 xs:py-6 sm:py-8 bg-yellow-50">
        <div className="container mx-auto px-3 xs:px-4">
          <div className="flex justify-between items-center mb-4 xs:mb-5 sm:mb-6">
            <div className="flex items-center space-x-2 xs:space-x-3">
              <i className="bx bx-time text-yellow-600 text-xl xs:text-2xl"></i>
              <h2 className="text-base xs:text-lg sm:text-xl font-bold text-gray-800">Daily Deals</h2>
              <div className="flex ml-2 xs:ml-3 space-x-1 xs:space-x-2">
                <div className="h-5 xs:h-6 bg-gray-200 rounded w-8 xs:w-10 animate-pulse"></div>
                <span>:</span>
                <div className="h-5 xs:h-6 bg-gray-200 rounded w-8 xs:w-10 animate-pulse"></div>
                <span>:</span>
                <div className="h-5 xs:h-6 bg-gray-200 rounded w-8 xs:w-10 animate-pulse"></div>
              </div>
            </div>
            <div className="flex items-center gap-2 xs:gap-3">
              <div className="h-4 xs:h-5 bg-gray-200 rounded w-12 xs:w-16 animate-pulse"></div>
              <div className="bg-gray-200 rounded-full p-1 h-6 w-6 xs:h-8 xs:w-8 animate-pulse"></div>
              <div className="bg-gray-200 rounded-full p-1 h-6 w-6 xs:h-8 xs:w-8 animate-pulse"></div>
            </div>
          </div>
          <div className="flex overflow-x-auto scrollbar-hide gap-3 xs:gap-4">
            {[...Array(7)].map((_, index) => (
              <div key={index} className="flex-shrink-0 w-[140px] xs:w-[180px] sm:w-[200px] md:w-[220px]">
                <div className="bg-gray-200 rounded-lg h-[200px] xs:h-[240px] sm:h-[260px] w-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-4 xs:py-6 sm:py-8 bg-yellow-50">
        <div className="container mx-auto px-3 xs:px-4">
          <div className="flex justify-between items-center mb-4 xs:mb-5 sm:mb-6">
            <div className="flex items-center space-x-2 xs:space-x-3">
              <i className="bx bx-time text-yellow-600 text-xl xs:text-2xl"></i>
              <h2 className="text-base xs:text-lg sm:text-xl font-bold text-gray-800">Daily Deals</h2>
            </div>
          </div>
          <p className="text-red-600 text-sm xs:text-base p-3 xs:p-4 flex items-center gap-2">
            <i className="bx bx-error-circle"></i>
            {error}
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-4 xs:py-6 sm:py-8 bg-yellow-50">
      <div className="container mx-auto px-3 xs:px-4">
        <div className="flex justify-between items-center mb-4 xs:mb-5 sm:mb-6">
          <div className="flex items-center space-x-2 xs:space-x-3">
            <i className="bx bx-time text-yellow-600 text-xl xs:text-2xl"></i>
            <h2 className="text-base xs:text-lg sm:text-xl font-bold text-gray-800">Daily Deals</h2>
            <div className="ml-2 xs:ml-3 flex items-center space-x-1">
              <span className="bg-yellow-100 text-yellow-800 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded text-xs xs:text-sm font-mono">
                {String(timeRemaining.hours).padStart(2, '0')}
              </span>
              <span className="text-yellow-800">:</span>
              <span className="bg-yellow-100 text-yellow-800 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded text-xs xs:text-sm font-mono">
                {String(timeRemaining.minutes).padStart(2, '0')}
              </span>
              <span className="text-yellow-800">:</span>
              <span className="bg-yellow-100 text-yellow-800 px-1.5 xs:px-2 py-0.5 xs:py-1 rounded text-xs xs:text-sm font-mono">
                {String(timeRemaining.seconds).padStart(2, '0')}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 xs:gap-3">
            <Link to="/daily-deals" className="text-blue-600 text-xs xs:text-sm hover:text-blue-800">
              See All
            </Link>
            <button
              onClick={scrollLeft}
              className="bg-yellow-200 rounded-full p-1 hover:bg-yellow-300"
              aria-label="Scroll left"
            >
              <i className="bx bx-chevron-left text-lg xs:text-xl text-yellow-700"></i>
            </button>
            <button
              onClick={scrollRight}
              className="bg-yellow-200 rounded-full p-1 hover:bg-yellow-300"
              aria-label="Scroll right"
            >
              <i className="bx bx-chevron-right text-lg xs:text-xl text-yellow-700"></i>
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory gap-3 xs:gap-4"
        >
          {dealProducts.length === 0 ? (
            <p className="text-gray-600 text-sm xs:text-base p-3 xs:p-4 flex items-center gap-2">
              <i className="bx bx-info-circle"></i>
              No deals available right now. Check back later for hot offers! 🔥
            </p>
          ) : (
            dealProducts.slice(0, 8).map((deal) => (
              <div
                key={deal.id}
                className="flex-shrink-0 w-[200px] xs:w-[200px] sm:w-[200px] md:w-[220px] snap-start"
              >
                <div className="relative">
                  <ProductCard
                    product={{
                      id: deal.productId,
                      name: deal.productName,
                      price: deal.originalPrice * (1 - parseFloat(deal.discountPercent) / 100),
                      imageUrl: deal.imageUrl,
                      condition: deal.condition,
                      isDailyDeal: deal.isDailyDeal,
                      discountPercentage: parseFloat(deal.discountPercent),
                    }}
                  />
                  <div className="absolute top-2 left-2 bg-red-600 text-white px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full text-[10px] xs:text-xs font-bold">
                    {deal.discountPercent}% OFF
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default DailyDeals;