import React, { useEffect, useState } from 'react';
import { db } from '/src/firebase';
import { collection, getDocs } from 'firebase/firestore';
import ProductCard from '/src/components/home/ProductCard';
import SkeletonLoader from '/src/components/common/SkeletonLoader';

const FeaturedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const productsCollection = collection(db, 'products');
        const productSnapshot = await getDocs(productsCollection);
        const productList = productSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((product) => product.status === 'approved' && product.isBumped && product.bumpExpiry && new Date(product.bumpExpiry) > new Date());
        setProducts(productList);
      } catch (error) {
        console.error('Error fetching products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-3">
        <SkeletonLoader type="productCard" count={6} />
      </div>
    );
  }

  return (
    <div className="py-8">
      <h2 className="text-2xl font-bold text-center mb-6">Featured Products</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.length > 0 ? (
          products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))
        ) : (
          <p className="text-center text-gray-500 col-span-full">
            No featured products available at the moment.
          </p>
        )}
      </div>
    </div>
  );
};

export default FeaturedProducts;