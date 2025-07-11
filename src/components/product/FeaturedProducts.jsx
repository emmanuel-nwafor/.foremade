import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const categories = [
    'foremade fashion',
    'smart watches',
    'drinks & categories',
    'health & beauty',
    'game & fun',
    'computers & accessories',
  ];

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

        // Filter products with valid stock and randomize
        const filteredProducts = allProducts
          .filter((product) => {
            if ((product.stock || 0) < 10) {
              console.warn('Filtered out product with low stock:', {
                id: product.id,
                name: product.name,
                stock: product.stock,
              });
              return false;
            }
            return true;
          })
          .sort(() => Math.random() - 0.5);

        console.log('Fetched products (Featured - After Filter):', filteredProducts);

        if (filteredProducts.length === 0) {
          console.warn('No products passed the filters (Featured). Relaxing stock filter...');
          const relaxedProducts = allProducts.sort(() => Math.random() - 0.5);
          console.log('Products with relaxed stock filter (Featured):', relaxedProducts);
          setProducts(relaxedProducts.slice(0, 8));
        } else {
          setProducts(filteredProducts.slice(0, 8));
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
          <div className="">
            <ProductCard key={product.id} product={product} />
          </div>
        ))
      )}
    </div>
  );
}