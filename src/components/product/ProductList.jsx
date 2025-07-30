import { useState, useEffect } from 'react';
import ProductCard from '../home/ProductCard';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '/src/firebase';
import placeholder from '/src/assets/placeholder.png';
import PriceFormatter from '/src/components/layout/PriceFormatter';
import { addToCart } from '/src/utils/cartUtils';

const ProductList = ({ products = [] }) => {
  const [dailyDeals, setDailyDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  useEffect(() => {
    getDocs(collection(db, 'dailyDeals')).then((snapshot) => {
      setDailyDeals(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    }).catch((err) => {
      console.error('Error fetching daily deals:', err);
    });
  }, []);

  useEffect(() => {
    if (products.length > 0) {
      setLoading(false);
    } else {
      const timer = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [products]);

  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      try {
        if (products.length === 0) {
          setRecommendedProducts([]);
          return;
        }

        // Get unique categories from products
        const categories = [...new Set(products.map((product) => product.category).filter(Boolean))];
        if (categories.length === 0) {
          setRecommendedProducts([]);
          return;
        }

        // Fetch up to 4 products from the same categories, excluding listed products
        const productIds = products.map((product) => product.id);
        const recommended = [];
        for (const category of categories) {
          const q = query(
            collection(db, 'products'),
            where('category', '==', category),
            limit(4 - recommended.length)
          );
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            const productData = doc.data();
            if (!productIds.includes(doc.id)) {
              const imageUrl = Array.isArray(productData.imageUrls) && productData.imageUrls[0] && typeof productData.imageUrls[0] === 'string' && productData.imageUrls[0].startsWith('https://')
                ? productData.imageUrls[0]
                : productData.imageUrl && typeof productData.imageUrl === 'string' && productData.imageUrl.startsWith('https://')
                ? productData.imageUrl
                : placeholder;
              recommended.push({
                id: doc.id,
                name: productData.name || 'Unnamed Product',
                price: Number(productData.price) || 0,
                imageUrl,
                stock: Number(productData.stock) || 0,
              });
            }
          });
          if (recommended.length >= 4) break;
        }

        setRecommendedProducts(recommended.slice(0, 4));
      } catch (err) {
        console.error('Error fetching recommended products:', err);
        setRecommendedProducts([]);
      }
    };

    fetchRecommendedProducts();
  }, [products]);

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
      ) : products.length === 0 ? (
        <div
          className="text-center col-span-full py-12"
          role="alert"
          aria-label="No products found"
        >
          <p className="text-gray-600 text-lg">No products match your filters.</p>
          <p className="text-gray-400 text-sm mt-2">Try adjusting your search or filters.</p>
        </div>
      ) : (
        <div>
          <div
            className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4"
            role="grid"
            aria-label="Product list"
          >
            {products.map((product) => (
              <ProductCard key={product.id} product={product} dailyDeals={dailyDeals} />
            ))}
          </div>
          {recommendedProducts.length > 0 && (
            <div className="mt-8">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">Customers Also Viewed</h2>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {recommendedProducts.map((product) => (
                  <div
                    key={product.id}
                    className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
                  >
                    <a href={`/product/${product.id}`}>
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-40 object-cover rounded mb-2"
                        onError={(e) => {
                          console.warn('Failed to load recommended product image:', product.imageUrl);
                          e.target.src = placeholder;
                        }}
                      />
                      <h3 className="text-sm font-semibold text-gray-800 truncate">{product.name}</h3>
                    </a>
                    <p className="text-xs text-gray-600">
                      <PriceFormatter price={product.price} />
                    </p>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className={`mt-2 w-full px-4 py-2 text-sm text-white rounded-lg transition ${
                        product.stock === 0
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-[#112d4e] hover:bg-[#0f2a44]'
                      }`}
                      disabled={product.stock === 0}
                    >
                      {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProductList;