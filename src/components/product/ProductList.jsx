import { useState, useEffect } from 'react';
import ProductCard from '../home/ProductCard';
import SkeletonLoader from '../common/SkeletonLoader';

const ProductList = ({ products = [] }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);

    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => {
      console.log('Clearing timer');
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    if (products.length > 0 && loading) {
      setLoading(false);
    }
  }, [products, loading]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SkeletonLoader type="featuredProduct" count={8} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 py-2">
      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-">
        {products.length === 0 ? (
          <p className="text-center col-span-full">
            <SkeletonLoader type="featuredProduct" count={8}/>
          </p>
        ) : (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  );
};

export default ProductList;