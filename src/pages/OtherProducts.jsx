import { useParams, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';

// Optional: Map category to banner image
const categoryBanners = {
  Shoes: 'https://banner2.cleanpng.com/20180406/wow/kisspng-shoe-jumpman-sneakers-air-jordan-teal-jordan-5ac6ff9c2fcfe2.7959868915229910041959.jpg',
  Fashion: 'https://pngimg.com/uploads/dress_shirt/dress_shirt_PNG8088.png',
  Phones: 'https://banner2.cleanpng.com/20240415/cv/transparent-apple-logo-person-holding-iphone-11-pro-max661df755177ea1.73458741.webp',
  Laptops: 'https://banner2.cleanpng.com/lnd/20240424/uxz/transparent-rainbow-open-laptop-with-rainbow-gradient-background-image662945f170dc49.58708681.webp',
  Watches: 'https://banner2.cleanpng.com/20180202/lie/av2ldq3r4.webp',
  Electronics: 'https://banner2.cleanpng.com/20180131/jgw/av1z4nree.webp',
  // ...add more as needed
};

export default function OtherProductsPage(props) {
  // Support both prop and route param for category
  const params = useParams();
  const location = useLocation();
  const category = props.category || params.category || '';

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!category) return;
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'products'),
          where('category', '==', category.toLowerCase())
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(items);
      } catch (err) {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [category]);

  // Banner image or fallback
  const bannerImg = categoryBanners[category] || null;

  return (
    <section className="py-8 bg-white">
      {/* Dynamic Banner */}
      <div className="mb-6">
        <div className="relative w-full h-40 md:h-56 bg-gradient-to-r from-blue-100 to-blue-300 flex items-center justify-center rounded-lg overflow-hidden">
          {bannerImg && (
            <img
              src={bannerImg}
              alt={category}
              className="absolute right-4 bottom-0 h-32 md:h-48 object-contain opacity-60 pointer-events-none"
              style={{ maxWidth: '40%' }}
            />
          )}
          <h1 className="relative z-10 text-2xl md:text-4xl font-bold text-blue-900 drop-shadow-lg">
            {category ? `${category} Products` : 'Products'}
          </h1>
        </div>
      </div>
      <div className="container mx-auto px-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">
          {category ? `Products in ${category}` : 'Products'}
        </h2>
        {loading ? (
          <div>Loading...</div>
        ) : products.length === 0 ? (
          <p className="text-gray-600">No products found for this category.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {products.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
