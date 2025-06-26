import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';
import CategoryBanner from '/src/components/category/CategoryBanner';

// Utility to slugify category names
const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Map category slugs to special content
const CATEGORY_SPECIAL_CONTENT = {
  'hair-nails-accessories': {
    bannerImage: '/images/banners/hair-nails-banner.jpg',
    description: 'Discover the best in hair, nails, and accessories!',
    // ...other special content...
  },
  'electronics': {
    bannerImage: '/images/banners/electronics-banner.jpg',
    description: 'Shop the latest electronics and gadgets.',
  },
  'sports-outdoors': {
    bannerImage: '/images/banners/sports-banner.jpg',
    description: 'Gear up for sports and outdoor adventures.',
  },
  // ...add more categories as needed...
};

export default function CategoryPage() {
  const { categoryName } = useParams();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get special content for this category
  const specialContent = CATEGORY_SPECIAL_CONTENT[categoryName];

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        // Fetch products for this category
        // You may want to map slug back to display name if needed
        const q = query(
          collection(db, 'products'),
          where('category', '==', categoryName)
        );
        const querySnapshot = await getDocs(q);
        const productsData = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          productsData.push({
            id: doc.id,
            ...data,
            imageUrl: Array.isArray(data.imageUrls) && data.imageUrls[0]
              ? data.imageUrls[0]
              : data.imageUrl
          });
        });
        setProducts(productsData);
        setLoading(false);
      } catch (err) {
        setError('Failed to load products.');
        setLoading(false);
      }
    };
    fetchProducts();
  }, [categoryName]);

  if (!specialContent) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Category not found</h1>
          <p className="mt-4">The category "{categoryName}" doesn't exist.</p>
          <Link to="/" className="mt-6 inline-block text-blue-600 hover:underline">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Special Banner */}
      <div className="w-full h-48 bg-cover bg-center flex items-center justify-center mb-8"
        style={{ backgroundImage: `url(${specialContent.bannerImage})` }}>
        <h1 className="text-3xl font-bold text-white drop-shadow-lg">{specialContent.description}</h1>
      </div>
      {/* Products Grid */}
      <div className="container mx-auto px-4 py-6">
        <h2 className="text-xl font-bold mb-4 capitalize">{categoryName.replace(/-/g, ' ')}</h2>
        {loading ? (
          <div>Loading...</div>
        ) : error ? (
          <div className="text-red-600">{error}</div>
        ) : products.length === 0 ? (
          <div>No products found in this category.</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
