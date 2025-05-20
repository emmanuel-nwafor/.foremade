import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';

export default function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const querySnapshot = await getDocs(collection(db, 'products'));
        const productsData = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            let imageUrl = data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('https://')
              ? data.imageUrl
              : Array.isArray(data.imageUrls) && data.imageUrls[0] && typeof data.imageUrls[0] === 'string' && data.imageUrls[0].startsWith('https://')
              ? data.imageUrls[0]
              : '/images/placeholder.jpg';
            return {
              id: doc.id,
              name: data.name || 'Unnamed Product',
              description: data.description || '',
              price: data.price || 0,
              stock: data.stock || 0,
              category: data.category || 'Uncategorized',
              categoryId: data.category === 'Electronics' ? 1 : data.category === 'Clothing' ? 2 : 6,
              colors: data.colors || [],
              sizes: data.sizes || [],
              condition: data.condition || '',
              imageUrl,
              sellerId: data.sellerId || '',
              rating: data.rating || Math.random() * 2 + 3,
            };
          })
          .filter((product) => {
            if (product.stock < 10) {
              console.warn('Filtered out product with low stock:', {
                id: product.id,
                name: product.name,
                stock: product.stock,
              });
              return false;
            }
            const isValidImage = product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('https://');
            if (!isValidImage && product.imageUrl !== '/images/placeholder.jpg') {
              console.warn('Filtered out product with invalid imageUrl:', {
                id: product.id,
                name: product.name,
                imageUrl: product.imageUrl,
              });
              return false;
            }
            return true;
          })
          .sort((a, b) => b.rating - a.rating);

        console.log('Fetched featured products:', productsData);
        setProducts(productsData);
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
    <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 xs:gap-4 sm:gap-5 lg:gap-6">
      {error ? (
        <p className="text-red-600 col-span-full text-center">{error}</p>
      ) : loading ? (
        <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 xs:gap-4 sm:gap-5 lg:gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="min-w-[200px] h-56 xs:h-60 sm:h-64 md:h-72 lg:h-80 bg-gray-200 animate-pulse rounded-lg">
              <div className="w-full h-40 xs:h-44 sm:h-48 md:h-52 lg:h-56 bg-gray-300 rounded-t-lg"></div>
              <div className="p-2 sm:p-3">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <p className="text-gray-600 col-span-full text-center">No featured products found.</p>
      ) : (
        products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))
      )}
    </div>
  );
}