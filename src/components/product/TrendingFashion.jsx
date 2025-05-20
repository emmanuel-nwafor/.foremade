import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';

export default function TrendingFashion() {
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const category = 'Foremade Fashion';
  const categoryId = 2;

  useEffect(() => {
    const fetchTrendingFashion = async () => {
      try {
        setLoading(true);
        setError(null);
        const q = query(collection(db, 'products'), where('category', '==', 'foremade fashion'));
        const querySnapshot = await getDocs(q);
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
              category: data.category || 'foremade fashion',
              categoryId: data.category?.trim().toLowerCase() === 'foremade fashion' ? categoryId : 2,
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

        console.log(`Fetched ${category} products:`, productsData);
        setTrendingProducts(productsData);
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

    fetchTrendingFashion();
  }, []);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-lg md:text-xl font-bold mt-4 text-gray-800 mb-4">
          Trending in {category}
        </h2>
        <Link to={`/products?category=${categoryId}`} className="text-blue-600 hover:underline text-sm">
          See All
        </Link>
      </div>
      {error ? (
        <p className="text-red-600 col-span-full text-center">{error}</p>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="min-w-[200px] h-56 sm:h-60 md:h-64 lg:h-72 bg-gray-200 animate-pulse rounded-lg">
              <div className="w-full h-40 sm:h-44 md:h-48 lg:h-52 bg-gray-300 rounded-t-lg"></div>
              <div className="p-2 sm:p-3">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : trendingProducts.length === 0 ? (
        <p className="text-gray-600 col-span-full text-center">No {category} products found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-5 lg:gap-6">
          {trendingProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}