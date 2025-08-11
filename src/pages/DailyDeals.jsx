import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';
import DailyDealsBanner from '../components/home/DailyDealsBanner';

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

export default function DailyDeals() {
  const [dealProducts, setDealProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  if (loading) {
    return (
      <section className="py-4 xs:py-6 sm:py-8 bg-yellow-50 h-screen mb-10">
        <div className="container mx-auto px-3 xs:px-4">
          <div className="flex justify-between items-center mb-4 xs:mb-5 sm:mb-6">
            <div className="flex items-center space-x-2 xs:space-x-3">
              <i className="bx bx-time text-yellow-600 text-xl xs:text-2xl"></i>
              <h2 className="text-base xs:text-lg sm:text-xl font-bold text-gray-800">Daily Deals</h2>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="flex-shrink-0 w-full">
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
    <section className="py-4 xs:py-6 sm:py-8 bg-yellow-50 mb-16">
      <DailyDealsBanner />
      <div className="container mx-auto px-3 xs:px-4">
        <div className="flex justify-between items-center mb-4 xs:mb-5 sm:mb-6">
          <div className="flex items-center space-x-2 xs:space-x-3">
            <i className="bx bx-time text-yellow-600 text-3xl xs:text-3xl"></i>
            <h2 className="text-base xs:text-xl sm:text-2xl md:text-3xl lg:text-3xl font-bold text-gray-800">Daily Deals</h2>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {dealProducts.length === 0 ? (
            <p className="text-gray-600 text-sm xs:text-base p-3 xs:p-4 flex items-center gap-2">
              <i className="bx bx-info-circle"></i>
              No deals available right now. Check back later for hot offers! 🔥
            </p>
          ) : (
            dealProducts.map((deal) => (
              <div key={deal.id} className="w-full">
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
}