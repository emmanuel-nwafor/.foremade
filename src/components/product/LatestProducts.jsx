import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';

export default function LatestProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLatestProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        // Query products, sort by createdAt in descending order to get the latest
        const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        const allProducts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log('All fetched products (Latest):', allProducts);

        // Filter products with valid stock
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
          });

        console.log('Fetched products (Latest - After Filter):', filteredProducts);

        if (filteredProducts.length === 0) {
          console.warn('No products passed the filters (Latest). Relaxing stock filter...');
          const relaxedProducts = allProducts;
          console.log('Products with relaxed stock filter (Latest):', relaxedProducts);
          setProducts(relaxedProducts.slice(0, 8));
        } else {
          setProducts(filteredProducts.slice(0, 8));
        }
      } catch (err) {
        console.error('Error loading latest products:', {
          message: err.message,
          code: err.code,
        });
        setError('Failed to load latest products.');
      } finally {
        setLoading(false);
      }
    };

    fetchLatestProducts();
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
        <p className="text-gray-600 col-span-full text-center">No Latest Products Found</p>
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