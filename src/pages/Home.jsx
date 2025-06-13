import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import BuyerBanner from '../components/home/EnhancedBuyerBanner';
import Carousel from '../components/home/Carousel';
import Category from '../components/home/Category';
import SellerBanner from '../components/home/EnhancedSellerBanner';
import RecommendedForYou from '../components/product/RecommendedForYou';
import TrendingFashion from '../components/product/TrendingFashion';
import TrendingGadgets from '../components/product/TrendingGadgets';
import TopStores from '../components/store/TopStore';
import EmpowermentHubPreview from '../components/home/EmpowermentHubPreview';
import DailyDeals from '../components/product/DailyDeals';
import RecentlyViewed from '../components/product/RecentlyViewed';
import NewsletterSignup from '../components/home/NewsletterSignup';
import CategoryGrid from '../components/home/CategoryGrid';

const Home = () => {
  // Track if user is new visitor
  const [isNewVisitor, setIsNewVisitor] = useState(false);
  
  useEffect(() => {
    // Check if user has visited before
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    if (!hasVisitedBefore) {
      setIsNewVisitor(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, []);

  return (
    <div>
      {/* Welcome banner for new visitors (eBay-inspired) */}
      {isNewVisitor && (
        <div className="bg-blue-50 p-4 mb-4">
          <div className="container mx-auto flex items-center justify-between">
            <div>
              <h3 className="font-bold text-blue-800">Welcome to Foremade!</h3>
              <p className="text-sm text-blue-600">Discover amazing deals from trusted sellers</p>
            </div>
            <button 
              onClick={() => setIsNewVisitor(false)}
              className="text-blue-600 hover:text-blue-800"
            >
              <i className="bx bx-x text-xl"></i>
            </button>
          </div>
        </div>
      )}

      {/* Main carousel */}
      <Carousel />
      
      {/* Quick shopping categories with transparent images */}
      <CategoryGrid />

      {/* Recommendations */}
      <RecommendedForYou />
      
      {/* Daily Deals - eBay inspired */}
      <DailyDeals />

      {/* Trending gadgets */}
      <TrendingGadgets />
      
      {/* Trending fashion */}
      <TrendingFashion />
      
      {/* Category promotions */}
      <Category />

      {/* Recently viewed section */}
      <RecentlyViewed />
      
      {/* Empowerment hub */}
      <EmpowermentHubPreview />
      
      {/* Enhanced Buyer Banner - showing products to buy */}
      <BuyerBanner />
      {/* <TopStores /> */}
      
      {/* Enhanced Seller Banner - encouraging selling */}
      <SellerBanner />
      
      {/* Top stores */}
      <TopStores />
      
      {/* Newsletter signup - eBay inspired */}
      <NewsletterSignup />
    </div>
  );
};

export default Home;