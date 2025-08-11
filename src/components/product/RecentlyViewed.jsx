import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db, auth } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';

export default function RecentlyViewed() {
  const [recentProducts, setRecentProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyDeals, setDailyDeals] = useState([]);
  const scrollRef = useRef(null);

  useEffect(() => {
    getDocs(collection(db, 'dailyDeals')).then(snapshot => {
      setDailyDeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  useEffect(() => {
    const fetchRecentlyViewed = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Check if user is logged in
        const userId = auth.currentUser?.uid;
        
        // Get recently viewed products from localStorage if not logged in
        // or as a fallback
        const localRecentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
        
        let productsToShow = [];
        
        if (userId) {
          try {
            // If logged in, try to get from user's profile
            const userRef = doc(db, 'users', userId);
            const userDoc = await getDoc(userRef);
            
            if (userDoc.exists() && userDoc.data().recentlyViewed) {
              // Get product IDs from user document
              const recentProductIds = userDoc.data().recentlyViewed.slice(0, 10);
              
              // Fetch each product
              const productPromises = recentProductIds.map(async (productId) => {
                const productRef = doc(db, 'products', productId);
                const productDoc = await getDoc(productRef);
                if (productDoc.exists() && productDoc.data().status === 'approved') {
                  return { id: productDoc.id, ...productDoc.data() };
                }
                return null;
              });
              
              const fetchedProducts = await Promise.all(productPromises);
              productsToShow = fetchedProducts.filter(p => p !== null);
            }
          } catch (err) {
            console.error('Error fetching user recently viewed:', err);
            // Fall back to local storage
            productsToShow = [];
          }
        }
        
        // If no products from user profile or not logged in, use localStorage
        if (productsToShow.length === 0 && localRecentlyViewed.length > 0) {
          // Fetch each product from local storage IDs
          const productPromises = localRecentlyViewed.map(async (productId) => {
            const productRef = doc(db, 'products', productId);
            const productDoc = await getDoc(productRef);
            if (productDoc.exists() && productDoc.data().status === 'approved') {
              return { id: productDoc.id, ...productDoc.data() };
            }
            return null;
          });
          
          const fetchedProducts = await Promise.all(productPromises);
          productsToShow = fetchedProducts.filter(p => p !== null);
        }
        
        // If still no products, show some recommended instead
        if (productsToShow.length === 0) {
          const q = query(
            collection(db, 'products'),
            where('status', '==', 'approved'),
            where('rating', '>=', 4)
          );
          
          const querySnapshot = await getDocs(q);
          productsToShow = querySnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .slice(0, 10);
          
          // We're showing recommendations instead of recently viewed
          console.log('No recently viewed products, showing recommendations instead');
        }
        
        setRecentProducts(productsToShow);
      } catch (err) {
        console.error('Error loading recently viewed products:', {
          message: err.message,
          code: err.code,
        });
        setError('Failed to load recently viewed products.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecentlyViewed();
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
  
  // Dynamically determine the section title based on content
  const sectionTitle = recentProducts.length > 0 ? 'Recently Viewed' : 'Recommended For You';

  if (loading) {
    return (
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-800">
              {sectionTitle}
            </h2>
            <div className="flex items-center gap-3">
              <div className="h-5 bg-gray-200 rounded w-16 animate-pulse"></div>
              <div className="bg-gray-200 rounded-full p-1 h-8 w-8 animate-pulse"></div>
              <div className="bg-gray-200 rounded-full p-1 h-8 w-8 animate-pulse"></div>
            </div>
          </div>
          <div className="flex overflow-x-auto scrollbar-hide">
            {[...Array(7)].map((_, index) => (
              <div key={index} className="flex-shrink-0 w-48 mr-4">
                <div className="bg-gray-200 rounded-lg h-48 w-full animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-3/4 mt-2 animate-pulse"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mt-1 animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <i className={`bx ${sectionTitle === 'Recently Viewed' ? 'bx-history' : 'bx-bulb'} text-blue-600 text-xl mr-2`}></i>
            <h2 className="text-lg md:text-xl font-bold text-gray-800">
              {sectionTitle}
            </h2>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/products" className="text-blue-600 text-sm hover:text-blue-800">
              See All
            </Link>
            <button
              onClick={scrollLeft}
              className="bg-gray-200 rounded-full p-1 hover:bg-gray-300"
              aria-label="Scroll left"
            >
              <i className="bx bx-chevron-left text-xl text-gray-600"></i>
            </button>
            <button
              onClick={scrollRight}
              className="bg-gray-200 rounded-full p-1 hover:bg-gray-300"
              aria-label="Scroll right"
            >
              <i className="bx bx-chevron-right text-xl text-gray-600"></i>
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-4"
        >
          {recentProducts.length === 0 ? (
            <p className="text-gray-600 p-4">No products to display.</p>
          ) : (
            recentProducts.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-48 mr-4 snap-start"
              >
            <ProductCard product={product} dailyDeals={dailyDeals} />
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}