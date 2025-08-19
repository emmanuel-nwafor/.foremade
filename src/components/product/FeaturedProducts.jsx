import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';

function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyDeals, setDailyDeals] = useState([]);

  const categories = [
    'foremade fashion',
    'smart watches',
    'drinks & categories',
    'health & beauty',
    'game & fun',
    'computers & accessories',
  ];

  const shuffleArray = (array) => {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    getDocs(collection(db, 'dailyDeals')).then(snapshot => {
      setDailyDeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const q = query(
          collection(db, 'products'),
          where('status', '==', 'approved'),
          where('category', 'in', categories)
        );
        const querySnapshot = await getDocs(q);
        const allProducts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('All fetched products (Featured):', allProducts);

        // Filter products with valid stock
        const filteredProducts = allProducts.filter((product) => {
          if ((product.stock || 0) < 10) {
            console.warn('Filtered out product with low stock:', {
              id: product.id,
              name: product.name,
              stock: product.stock,
            });
            return false;
          }
          return true;
        });

        console.log('Fetched products (Featured - After Filter):', filteredProducts);

        if (filteredProducts.length === 0) {
          console.warn('No products passed the filters (Featured). Relaxing stock filter...');
          const relaxedProducts = shuffleArray(allProducts).slice(0, 8);
          console.log('Products with relaxed stock filter (Featured):', relaxedProducts);
          setProducts(relaxedProducts);
        } else {
          // Shuffle filtered products and take up to 8
          const shuffledProducts = shuffleArray(filteredProducts).slice(0, 8);
          setProducts(shuffledProducts);
        }
      } catch (err) {
        console.error('Error loading featured products:', {
          message: err.message,
          code: err.code,
        });
        setError('Failed to load featured products.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-1">
      {error ? (
        <p className="text-red-600 col-span-full text-center">{error}</p>
      ) : loading ? (
        <>
          {[...Array(5)].map((_, index) => (
            <div key={index} className="min-w-[200px] h-[300px] bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </>
      ) : products.length === 0 ? (
        <p className="text-gray-600 col-span-full text-center">No Product Found</p>
      ) : (
        products.map((product) => (
          <ProductCard key={product.id} product={product} dailyDeals={dailyDeals} />
        ))
      )}
    </div>
  );
}

export default FeaturedProducts;