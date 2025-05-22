import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';

export default function TrendingFashion() {
  const [trendingProducts, setTrendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  const category = 'Fashion';
  const categoryId = 2;
  const firestoreCategories = [
    'foremade fashion',
    'clothing',
    'accessories',
    'footwear',
    'jewelry',
    'bags & wallets'
  ];

  useEffect(() => {
    const fetchTrendingFashion = async () => {
      try {
        setLoading(true);
        setError(null);
        const q = query(collection(db, 'products'), where('category', 'in', firestoreCategories));
        const querySnapshot = await getDocs(q);
        const allProducts = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return { id: doc.id, ...data };
        });
        console.log('All fetched products (Fashion):', allProducts);

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
              category: data.category || 'foremade fashion',
              categoryId: firestoreCategories.map(c => c.toLowerCase()).includes(data.category?.trim().toLowerCase()) ? categoryId : 2,
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
              console.warn('Filtered out product with low stock (Fashion):', {
                id: product.id,
                name: product.name,
                stock: product.stock,
              });
              return false;
            }
            const isValidImage = product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('https://');
            if (!isValidImage && product.imageUrl !== '/images/placeholder.jpg') {
              console.warn('Filtered out product with invalid imageUrl (Fashion):', {
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
        if (productsData.length === 0) {
          console.warn('No products passed the filters (Fashion). Relaxing stock filter to debug...');
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
                category: data.category || 'foremade fashion',
                categoryId: firestoreCategories.map(c => c.toLowerCase()).includes(data.category?.trim().toLowerCase()) ? categoryId : 2,
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
                console.warn('Filtered out product with invalid imageUrl (relaxed filter, Fashion):', {
                  id: product.id,
                  name: product.name,
                  imageUrl: product.imageUrl,
                });
                return false;
              }
              return true;
            });
          console.log('Products with relaxed stock filter (Fashion):', relaxedProductsData);
          setTrendingProducts(relaxedProductsData.sort((a, b) => b.rating - a.rating));
        } else {
          setTrendingProducts(productsData);
        }
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

  const scrollLeft = () => {
    if (containerRef.current) {
      containerRef.current.scrollLeft -= 240;
    }
  };

  const scrollRight = () => {
    if (containerRef.current) {
      containerRef.current.scrollLeft += 240;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 relative">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg sm:text-lg md:text-xl font-bold text-gray-800">
          Trending in {category}
        </h2>
        <Link to={`/products?category=${categoryId}`} className="text-blue-600 hover:underline text-sm">
          See All
        </Link>
      </div>
      {error ? (
        <p className="text-red-600">{error}</p>
      ) : loading ? (
        <div className="flex flex-row overflow-x-hidden gap-3 px-2">
          {[...Array(4)].map((_, index) => (
            <div key={index} className="min-w-[240px] h-72 bg-gray-200 animate-pulse rounded-lg">
              <div className="w-full h-48 bg-gray-300 rounded-t-lg"></div>
              <div className="p-2">
                <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      ) : trendingProducts.length === 0 ? (
        <p className="text-gray-600">No {category} products found.</p>
      ) : (
        <div>
          <button
            onClick={scrollLeft}
            className="m-3 absolute left-0 top-1/2 transform -translate-y-1/2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center z-10 transition-all duration-200 active:bg-blue-400 active:scale-110"
          >
            ‹
          </button>
          <div className="flex flex-row overflow-x-hidden gap-3 px-2" ref={containerRef}>
            {trendingProducts.map((product) => (
              <div key={product.id} className="min-w-[240px]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
          <button
            onClick={scrollRight}
            className="m-3 absolute right-0 top-1/2 transform -translate-y-1/2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-full w-8 h-8 flex items-center justify-center z-10 transition-all duration-200 active:bg-blue-400 active:scale-110"
          >
            ›
          </button>
        </div>
      )}
      <style>
        {`
          /* Hide scrollbar completely on all devices */
          .overflow-x-hidden::-webkit-scrollbar {
            display: none;
          }
          .overflow-x-hidden {
            -ms-overflow-style: none;
            scrollbar-width: none;
          }

          /* Button styling */
          button {
            cursor: pointer;
          }
          button:disabled {
            background: #e5e7eb;
            cursor: not-allowed;
          }
        `}
      </style>
    </div>
  );
}