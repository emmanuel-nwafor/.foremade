import { useState, useEffect, useRef } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';

function LatestProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyDeals, setDailyDeals] = useState([]);
  const scrollRef = useRef(null);

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
          const relaxedProducts = shuffleArray(allProducts.sort((a, b) => (b.rating || 0) - (a.rating || 0))).slice(0, 15);
          console.log('Products with relaxed stock filter (Best Selling):', relaxedProducts);
          setProducts(relaxedProducts);
        } else {
          const shuffledProducts = shuffleArray(filteredProducts).slice(0, 15);
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

  return (
    <section className="bg-white">
      <div className="container mx-auto px-4">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        >
          {error ? (
            <p className="text-red-600 p-4">Failed to load best-selling products.</p>
          ) : loading ? (
            <>
              {[...Array(7)].map((_, index) => (
                <div key={index} className="flex-shrink-0 w-60 mr-4">
                  <div className="bg-gray-200 rounded-lg h-72 w-full animate-pulse"></div>
                </div>
              ))}
            </>
          ) : products.length === 0 ? (
            <p className="text-gray-600 p-4">No best-selling products found.</p>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-60 mr-4 snap-start"
              >
                <ProductCard product={product} dailyDeals={dailyDeals} />
              </div>
            ))
          )}
        </div>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
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
      </div>
    </section>
  );
}

export default LatestProducts;