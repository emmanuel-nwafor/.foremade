import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';

export default function BestSelling() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        <p className="text-gray-600 col-span-full text-center">No best-selling products found. Check your database for products.</p>
      ) : (
        products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))
      )}
    </div>
  );
}