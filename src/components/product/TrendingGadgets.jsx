import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';

export default function TrendingGadgets() {
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  const category = 'Gadgets';
  const categoryId = 3;
  const firestoreCategories = [
    'tablet & phones',
    'computers & accessories',
    'electronics',
    'smart watches',
    'game & fun',
  ];

  useEffect(() => {
    const fetchTrendingGadgets = async () => {
      try {
        setLoading(true);
        setError(null);
        const q = query(
          collection(db, 'products'),
          where('status', '==', 'approved'),
          where('category', 'in', firestoreCategories)
        );
        const querySnapshot = await getDocs(q);
        const allProducts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('All fetched products (Gadgets):', allProducts);

        // Filter products with valid stock and sort by rating
        const filteredProducts = allProducts
          .filter((product) => {
            if ((product.stock || 0) < 10) {
              console.warn('Filtered out product with low stock (Gadgets):', {
                id: product.id,
                name: product.name,
                stock: product.stock,
              });
              return false;
            }
            return true;
          })
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));

        console.log(`Fetched ${category} products:`, filteredProducts);

        if (filteredProducts.length === 0) {
          console.warn('No products passed the filters (Gadgets). Relaxing stock filter...');
          const relaxedProducts = allProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          console.log('Products with relaxed stock filter (Gadgets):', relaxedProducts);
          setTrendingProducts(relaxedProducts);
        } else {
          setTrendingProducts(filteredProducts);
        }
      } catch (err) {
        console.error(`Error loading ${category} products:`, {
          message: err.message,
          code: err.code,
        });
        setError(`Failed to load ${category} products.`);
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingGadgets();
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
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-800">
              Trending in {category}
            </h2>
            <div className="flex items-center gap-3">
              <div className="h-5 bg-gray-200 rounded w-16"></div>
              <div className="bg-gray-200 rounded-full p-1 h-8 w-8 sm:hidden"></div>
              <div className="bg-gray-200 rounded-full p-1 h-8 w-8 sm:hidden"></div>
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
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">
            Trending in {category}
          </h2>
          <div className="flex items-center gap-3">
            <Link to={`/products?category=${categoryId}`} className="text-blue-600 text-sm hover:text-blue-400">
              See All
            </Link>
            <button
              onClick={scrollLeft}
              className="bg-gray-200 rounded-full p-1 hover:bg-gray-300"
            >
              <i className="bx bx-chevron-left text-xl text-gray-600"></i>
            </button>
            <button
              onClick={scrollRight}
              className="bg-gray-200 rounded-full p-1 hover:bg-gray-300"
            >
              <i className="bx bx-chevron-right text-xl text-gray-600"></i>
            </button>
          </div>
        </div>
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        >
          {trendingProducts.length === 0 ? (
            <p className="text-gray-600 p-4">No {category} products found.</p>
          ) : (
            trendingProducts.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-60 mr-4 snap-start"
              >
                <ProductCard product={product} />
              </div>
            ))
          )}
          {console.log(error)}
        </div>
      </div>
    </section>
  );
}