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
      console.log('🏷️ CATEGORIES SNAPSHOT:');
      console.log('Categories docs count:', snapshot.docs.length);
      
      // Log individual category documents
      snapshot.docs.forEach((doc, index) => {
        console.log(`Category ${index + 1}:`, {
          id: doc.id,
          data: doc.data()
        });
      });
      
      const categoryList = snapshot.docs.map(doc => doc.data().name);
      console.log('Extracted category names:', categoryList);
      setCategories(categoryList);
    });

    const unsubSubcats = onSnapshot(collection(db, 'customSubcategories'), (snapshot) => {
      console.log('🔖 CUSTOM SUBCATEGORIES SNAPSHOT:');
      console.log('CustomSubcategories docs count:', snapshot.docs.length);
      
      const subcatData = {};
      snapshot.forEach((doc, index) => {
        console.log(`CustomSubcategory ${index + 1}:`, {
          id: doc.id,
          data: doc.data(),
          subcategories: doc.data().subcategories || []
        });
        subcatData[doc.id] = doc.data().subcategories || [];
      });
      
      console.log('Final customSubcategories structure:', subcatData);
      setCustomSubcategories(subcatData);
    });

    const unsubSubSubcats = onSnapshot(collection(db, 'customSubSubcategories'), (snapshot) => {
      console.log('🏗️ CUSTOM SUB-SUBCATEGORIES SNAPSHOT:');
      console.log('CustomSubSubcategories docs count:', snapshot.docs.length);
      
      const subSubcatData = {};
      snapshot.forEach((doc, index) => {
        console.log(`CustomSubSubcategory ${index + 1}:`, {
          id: doc.id,
          data: doc.data()
        });
        
        const category = doc.id;
        subSubcatData[category] = {};
        Object.entries(doc.data()).forEach(([subcat, subSubcatList]) => {
          console.log(`  └─ ${subcat}:`, subSubcatList);
          subSubcatData[category][subcat] = subSubcatList;
        });
      });
      
      console.log('Final customSubSubcategories structure:', subSubcatData);
      setCustomSubSubcategories(subSubcatData);
    });

    return () => {
      unsubCats();
      unsubSubcats();
      unsubSubSubcats();
    };
  }, []);

  // Log state changes
  useEffect(() => {
    console.log('📊 STATE UPDATE - Categories:', categories);
  }, [categories]);

  useEffect(() => {
    console.log('📊 STATE UPDATE - CustomSubcategories:', customSubcategories);
  }, [customSubcategories]);

  useEffect(() => {
    console.log('📊 STATE UPDATE - CustomSubSubcategories:', customSubSubcategories);
  }, [customSubSubcategories]);

  // Log when category is selected
  const handleCategoryChange = (e) => {
    const selectedCat = e.target.value;
    setSelectedCategory(selectedCat);
    
    if (selectedCat) {
      console.log('🎯 SELECTED CATEGORY:', selectedCat);
      console.log('Available subcategories for', selectedCat + ':', customSubcategories[selectedCat]);
      console.log('Available sub-subcategories for', selectedCat + ':', customSubSubcategories[selectedCat]);
    }
  };

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

  

      {/* This is for spacing the nav on mobile */}
      <div className="h-20"></div>
    </div>
  );
};

export default Home;