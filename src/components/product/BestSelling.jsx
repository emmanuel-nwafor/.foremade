import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';

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
        console.log('All fetched approved products (Best Selling):', allProducts);

        // Filter products with valid stock
        const filteredProducts = allProducts.filter((product) => {
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
        }).sort((a, b) => (b.rating || 0) - (a.rating || 0));

        console.log('Fetched products (Best Selling - After Filter):', filteredProducts);

        if (filteredProducts.length === 0) {
          console.warn('No approved products passed the filters (Best Selling). Relaxing stock filter...');
          const relaxedProducts = shuffleArray(allProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0))).slice(0, 8);
          console.log('Products with relaxed stock filter (Best Selling):', relaxedProducts);
          setProducts(relaxedProducts);
        } else {
          const shuffledProducts = shuffleArray(filteredProducts).slice(0, 8);
          setProducts(shuffledProducts);
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
          <ProductCard key={product.id} product={product} dailyDeals={dailyDeals} />
        ))
      )}
    </div>
  );
}

export default BestSelling;