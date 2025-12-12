import { useState, useEffect } from 'react';
import ProductCard from '../home/ProductCard';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '/src/firebase';
import placeholder from '/src/assets/placeholder.png';
import PriceFormatter from '/src/components/layout/PriceFormatter';
import { addToCart } from '/src/utils/cartUtils';

const ProductList = () => {
  const [products, setProducts] = useState([]);
  const [dailyDeals, setDailyDeals] = useState([]);
  const [shuffledProducts, setShuffledProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const shuffleArray = (array) => {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch products from Firebase
        const productsSnapshot = await getDocs(collection(db, 'products'));
        const productsData = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(productsData);
        setShuffledProducts(shuffleArray(productsData));

        // Fetch daily deals from Firebase
        const dailyDealsSnapshot = await getDocs(collection(db, 'dailyDeals'));
        const dailyDealsData = dailyDealsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setDailyDeals(dailyDealsData);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddToCart = async (product) => {
    try {
      const cartItem = {
        productId: product.id,
        quantity: 1,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          category: product.category || 'uncategorized',
          imageUrl: product.imageUrl,
        },
      };
      await addToCart(cartItem);
      window.dispatchEvent(new Event('cartUpdated'));
    } catch (err) {
      console.error('Error adding to cart:', err);
    }
  };

  const SkeletonLoader = ({ count }) => (
    <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="bg-white rounded-lg shadow-sm p-3 h-[300px] flex flex-col animate-pulse"
        >
          <div className="h-[200px] bg-gray-200 rounded-t-lg"></div>
          <div className="p-3 flex flex-col flex-grow">
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded mt-auto"></div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {loading ? (
        <SkeletonLoader count={8} />
      ) : shuffledProducts.length === 0 ? (
        <div
          className="text-center col-span-full py-12"
          role="alert"
          aria-label="No products found"
        >
          <p className="text-gray-600 text-lg">No products available.</p>
          <p className="text-gray-400 text-sm mt-2">Please check back later.</p>
        </div>
      ) : (
        <div>
          <div className="mb-4">
            From New to Pre-Loved
          </div>
          <div
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            role="grid"
            aria-label="Product list"
          >
            {shuffledProducts.map((product) => (
              <ProductCard key={product.id} product={product} dailyDeals={dailyDeals} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductList;