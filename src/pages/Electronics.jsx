import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';
import CategoriesCarousel from '/src/components/home/CategoriesCarousel';

export default function ELectronics() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const category = 'Electronics';
  const categoryId = 3;
  const firestoreCategory = 'electronics';

  useEffect(() => {
    const fetchElectronics = async () => {
      try {
        setLoading(true);
        setError(null);
        const q = query(collection(db, 'products'), where('category', '==', firestoreCategory));
        const querySnapshot = await getDocs(q);
        const allProducts = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          return { id: doc.id, ...data };
        });
        console.log('All fetched products (Electronics):', allProducts);

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
              category: data.category || 'electronics',
              categoryId: data.category?.trim().toLowerCase() === firestoreCategory.toLowerCase() ? categoryId : 3,
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
              console.warn('Filtered out product with low stock (Electronics):', {
                id: product.id,
                name: product.name,
                stock: product.stock,
              });
              return false;
            }
            const isValidImage = product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('https://');
            if (!isValidImage && product.imageUrl !== '/images/placeholder.jpg') {
              console.warn('Filtered out product with invalid imageUrl (Electronics):', {
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
          console.warn('No products passed the filters (Electronics). Relaxing stock filter to debug...');
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
                category: data.category || 'electronics',
                categoryId: data.category?.trim().toLowerCase() === firestoreCategory.toLowerCase() ? categoryId : 3,
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
                console.warn('Filtered out product with invalid imageUrl (relaxed filter, Electronics):', {
                  id: product.id,
                  name: product.name,
                  imageUrl: product.imageUrl,
                });
                return false;
              }
              return true;
            });
          console.log('Products with relaxed stock filter (Electronics):', relaxedProductsData);
          setProducts(relaxedProductsData.sort((a, b) => b.rating - a.rating));
        } else {
          setProducts(productsData);
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

    fetchElectronics();
  }, []);

  if (loading) {
    return (
      <section className="py-8 bg-white">
        <div className="container mx-auto px-4">
         <CategoriesCarousel category={category} />
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-800">
              {category}
            </h2>
            <div className="flex items-center gap-3">
              <div className="h-5 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="w-full">
                <div className="bg-gray-200 rounded-lg h-72 w-full animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <CategoriesCarousel category={category} />
        <div className="flex mt-6 justify-between items-center mb-6">
          <h2 className="text-lg md:text-xl font-bold text-gray-800">
            {category}
          </h2>
          <div className="flex items-center gap-3">
            <Link to={`/products?category=${categoryId}`} className="text-blue-600 text-sm hover:text-blue-400">
              See All
            </Link>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
          {products.length === 0 ? (
            <p className="text-gray-600 p-4">No {category} products found.</p>
          ) : (
            products.map((product) => (
              <div key={product.id} className="w-full">
                <ProductCard product={product} />
              </div>
            ))
          )}
          {console.log(error)}
        </div>
      </div>
    </section>
  );
}