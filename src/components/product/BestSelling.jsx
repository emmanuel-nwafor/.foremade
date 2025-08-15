import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';

// Define the functional component BestSelling
function BestSelling() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyDeals, setDailyDeals] = useState([]);

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
    const fetchBestSellingProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const q = query(collection(db, 'products'), where('status', '==', 'approved'));
        const querySnapshot = await getDocs(q);
        const allProducts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('All fetched products (Best Selling - Raw Firestore Data):', allProducts);

        // Filter products with valid stock and sort by rating
        const filteredProducts = allProducts
          .filter((product) => {
            // Check if product.variants exists and if any variant has stock < 10,
            // or if it's a non-variant product and its overall stock is < 10.
            if (product.variants && product.variants.length > 0) {
              const totalStock = product.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0);
              if (totalStock < 10) {
                console.warn('Filtered out variant product with low total stock:', {
                  id: product.id,
                  name: product.name,
                  totalStock: totalStock,
                });
                return false;
              }
            } else if ((product.stock || 0) < 10) {
              console.warn('Filtered out single-variant product with low stock:', {
                id: product.id,
                name: product.name,
                stock: product.stock,
              });
              return false;
            }
            return true;
          })
          .sort((a, b) => (b.rating || 0) - (a.rating || 0));

        console.log('Fetched products (Best Selling - After Filter):', filteredProducts);

        if (filteredProducts.length === 0) {
          console.warn('No products passed the filters (Best Selling). Relaxing stock filter...');
          const relaxedProducts = allProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0));
          console.log('Products with relaxed stock filter (Best Selling):', relaxedProducts);
          setProducts(relaxedProducts.slice(0, 8));
        } else {
          setProducts(filteredProducts.slice(0, 8));
        }
      } catch (err) {
        console.error('Error loading best-selling products:', {
          message: err.message,
          code: err.code,
        });
        setError('Failed to load best-selling products.');
      } finally {
        setLoading(false);
      }
    };

    fetchBestSellingProducts();
  }, []);

  useEffect(() => {
    if (!loading && products.length > 0) {
      const interval = setInterval(() => {
        setProducts(prev => shuffleArray(prev));
      }, 240000); // Shuffle every 3 mins
      return () => clearInterval(interval);
    }
  }, [loading]);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-1">
      {error ? (
        <p className="text-red-600 col-span-full text-center">{error}</p>
      ) : loading ? (
        <>
          {[...Array(5)].map((_, index) => (
            <div key={index} className="min-w-[200px] h-[300px] bg-gray-200 animate-pulse rounded-lg"></div>
          ))}
        </>
      ) : products.length === 0 ? (
        <p className="text-gray-600 col-span-full text-center">No best-selling products found.</p>
      ) : (
        products.map((product) => (
          // Remove the extra <div> wrapper around ProductCard
          <ProductCard key={product.id} product={product} dailyDeals={dailyDeals} />
        ))
      )}
    </div>
  );
}

export default BestSelling; // Export the component