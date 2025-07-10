import { useState, useEffect } from 'react';
import ProductCard from '../home/ProductCard';

const ProductList = ({ products = [] }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (products.length > 0) {
      setLoading(false);
    } else {
      // Simulate async data fetch
      const timer = setTimeout(() => setLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [products]);

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
        <div
          className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4"
          role="grid"
          aria-label="Product list"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductList;