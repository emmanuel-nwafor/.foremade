import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '/src/firebase';
import BuyerBanner from '../components/home/EnhancedBuyerBanner';
import Carousel from '../components/home/Carousel';
import Category from '../components/home/Category';
import SellerBanner from '../components/home/EnhancedSellerBanner';
import RecommendedForYou from '../components/product/RecommendedForYou';
import TrendingFashion from '../components/product/TrendingFashion';
import TrendingGadgets from '../components/product/TrendingGadgets';
import EmpowermentHubPreview from '../components/home/EmpowermentHubPreview';
import DailyDeals from '../components/product/DailyDeals';
import RecentlyViewed from '../components/product/RecentlyViewed';
import NewsletterSignup from '../components/home/NewsletterSignup';
import CategoryGrid from '../components/home/CategoryGrid';
import ForemadeInvestorDeck from '../components/home/ForemadeInvestorDeck';

const Home = () => {
  // Track if user is new visitor
  const [isNewVisitor, setIsNewVisitor] = useState(false);
  const [categories, setCategories] = useState([]);
  const [customSubcategories, setCustomSubcategories] = useState({});
  const [customSubSubcategories, setCustomSubSubcategories] = useState({});
  const [selectedCategory, setSelectedCategory] = useState('');

  // Check if user has visited before
  useEffect(() => {
    const hasVisitedBefore = localStorage.getItem('hasVisitedBefore');
    if (!hasVisitedBefore) {
      setIsNewVisitor(true);
      localStorage.setItem('hasVisitedBefore', 'true');
    }
  }, []);

  // Fetch categories, subcategories, sub-subcategories (real-time)
  useEffect(() => {
    const unsubCats = onSnapshot(collection(db, 'categories'), (snapshot) => {
      const categoryList = snapshot.docs.map(doc => doc.data().name);
      setCategories(categoryList);
    });

    const unsubSubcats = onSnapshot(collection(db, 'customSubcategories'), (snapshot) => {
      const subcatData = {};
      snapshot.forEach(doc => {
        subcatData[doc.id] = doc.data().subcategories || [];
      });
      setCustomSubcategories(subcatData);
    });

    const unsubSubSubcats = onSnapshot(collection(db, 'customSubSubcategories'), (snapshot) => {
      const subSubcatData = {};
      snapshot.forEach(doc => {
        const category = doc.id;
        subSubcatData[category] = {};
        Object.entries(doc.data()).forEach(([subcat, subSubcatList]) => {
          subSubcatData[category][subcat] = subSubcatList;
        });
      });
      setCustomSubSubcategories(subSubcatData);
    });

    return () => {
      unsubCats();
      unsubSubcats();
      unsubSubSubcats();
    };
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
      
      {/* Newsletter signup - eBay inspired */}
      <NewsletterSignup />

      {/* Display all categories and their subcategories at the bottom */}
      <div className="w-full max-w-4xl mx-auto mb-10">
        <h4 className="font-semibold text-gray-700 mb-2">All Categories & Subcategories</h4>
        {categories.length === 0 ? (
          <p className="text-gray-500 text-sm">No categories found.</p>
        ) : (
          <div>
            <select
              className="border rounded px-3 py-2 mb-4"
              value={selectedCategory}
              onChange={e => setSelectedCategory(e.target.value)}
            >
              <option value="">Select a category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {selectedCategory && (
              <div className="mt-2">
                <h5 className="font-medium text-gray-800 mb-1">
                  {selectedCategory} Subcategories:
                </h5>
                <div className="ml-2">
                  {customSubcategories[selectedCategory]?.length > 0 ? (
                    <ul className="list-disc ml-4 text-gray-700 text-sm">
                      {customSubcategories[selectedCategory].map((sub, idx) => (
                        <li key={idx}>
                          {sub}
                          {/* Optionally show sub-subcategories */}
                          {customSubSubcategories[selectedCategory]?.[sub]?.length > 0 && (
                            <ul className="list-circle ml-4 text-gray-500 text-xs">
                              {customSubSubcategories[selectedCategory][sub].map((subsub, i) => (
                                <li key={i}>{subsub}</li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-gray-400 text-sm">No subcategories</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Investor Deck section - only for new users */}
      {isNewVisitor && <ForemadeInvestorDeck />}

      {/* This is for spacing the nav on mobile */}
      <div className="h-20"></div>
    </div>
  );
};

export default Home;