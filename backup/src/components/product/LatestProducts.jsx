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
    'computers & accessories'
  ];

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const q = query(collection(db, 'products'), where('category', 'in', categories));
        const querySnapshot = await getDocs(q);
        const allProducts = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return { id: doc.id, ...data };
        });
        console.log('All fetched products (Featured):', allProducts);

        const productsData = allProducts
          .map((doc) => {
            const data = doc;
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
              categoryId: 0,
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
          .sort(() => Math.random() - 0.5);

        console.log(`Fetched products (Featured):`, productsData);
        if (productsData.length === 0) {
          console.warn('No products passed the filters (Featured). Relaxing stock filter to debug...');
          const relaxedProductsData = allProducts
            .map((doc) => {
              const data = doc;
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
                categoryId: 0,
                colors: data.colors || [],
                sizes: data.sizes || [],
                condition: data.condition || '',
                imageUrl,
                sellerId: data.sellerId || '',
                rating: data.rating || Math.random() * 2 + 3,
              };
            })
            .filter((product) => {
              const isValidImage = product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('https://');
              if (!isValidImage && product.imageUrl !== '/images/placeholder.jpg') {
                console.warn('Filtered out product with invalid imageUrl (relaxed filter, Featured):', {
                  id: product.id,
                  name: product.name,
                  imageUrl: product.imageUrl,
                });
                return false;
              }
              return true;
            })
            .sort(() => Math.random() - 0.5);
          console.log('Products with relaxed stock filter (Featured):', relaxedProductsData);
          setProducts(relaxedProductsData.slice(0, 8));
        } else {
          setProducts(productsData.slice(0, 8));
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