import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, getDoc, doc, query, where } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';
import { toast } from 'react-toastify';

function FeaturedProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dailyDeals, setDailyDeals] = useState([]);
  const scrollRef = useRef(null);

  const categories = [
    'foremade fashion',
    'smart watches',
    'drinks & categories',
    'health & beauty',
    'game & fun',
    'computers & accessories',
  ];

  const shuffleArray = (array) => {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    const fetchDailyDeals = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'dailyDeals'));
        setDailyDeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Error loading daily deals:', err);
      }
    };
    fetchDailyDeals();
  }, []);

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch admin-selected products
        const featuredSnapshot = await getDocs(collection(db, 'featuredProducts'));
        const adminSelectedProducts = await Promise.all(
          featuredSnapshot.docs.map(async (featuredDoc) => {
            try {
              const productRef = doc(db, 'products', featuredDoc.data().productId);
              console.log('Fetching product:', featuredDoc.data().productId);
              const productDoc = await getDoc(productRef);
              if (productDoc.exists() && productDoc.data().status === 'approved') {
                return { id: productDoc.id, ...productDoc.data(), isAdminSelected: true };
              }
              console.warn('Product not found or not approved:', featuredDoc.data().productId);
              return null;
            } catch (err) {
              console.warn('Error fetching product for featured:', err);
              return null;
            }
          })
        );
        const validAdminSelected = adminSelectedProducts.filter(p => p !== null);

        // Fetch active bumped products
        const now = new Date();
        const bumpsSnapshot = await getDocs(
          query(collection(db, 'productBumps'), where('expiry', '>', now))
        );
        const bumpedProducts = await Promise.all(
          bumpsSnapshot.docs.map(async (bumpDoc) => {
            try {
              const productRef = doc(db, 'products', bumpDoc.data().productId);
              const productDoc = await getDoc(productRef);
              if (productDoc.exists() && productDoc.data().status === 'approved') {
                return {
                  id: productDoc.id,
                  ...productDoc.data(),
                  isBumped: true,
                  bumpExpiry: bumpDoc.data().expiry?.toDate(),
                  bumpDuration: bumpDoc.data().bumpDuration,
                };
              }
              console.warn('Bumped product not found or not approved:', bumpDoc.data().productId);
              return null;
            } catch (err) {
              console.warn('Error fetching product for bump:', err);
              return null;
            }
          })
        );
        const validBumpedProducts = bumpedProducts.filter(p => p !== null);
        console.log('Valid bumped products:', validBumpedProducts);

        // Fetch other approved products
        const q = query(
          collection(db, 'products'),
          where('status', '==', 'approved'),
          where('category', 'in', categories)
        );
        const querySnapshot = await getDocs(q);
        const allProducts = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Filter products with valid stock
        const filteredProducts = allProducts.filter((product) => {
          if ((product.stock || 0) < 10) {
            console.warn('Filtered out product with low stock:', {
              id: product.id,
              name: product.name,
              stock: product.stock,
            });
            return false;
          }
          return true;
        });
        console.log('Filtered products (stock > 10):', filteredProducts);

        // Combine and prioritize: admin-selected, bumped, then others
        const finalProducts = [
          ...validAdminSelected,
          ...validBumpedProducts.filter(
            p => !validAdminSelected.some(ap => ap.id === p.id)
          ),
          ...shuffleArray(
            filteredProducts.filter(
              p => !validAdminSelected.some(ap => ap.id === p.id) &&
                   !validBumpedProducts.some(bp => bp.id === p.id)
            )
          ),
        ].slice(0, 15);

        setProducts(finalProducts);
      } catch (err) {
        console.error('Error loading featured products:', {
          message: err.message,
          code: err.code,
        });
        setError('Failed to load featured products.');
        toast.error('Failed to load featured products.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedProducts();
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -240, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 240, behavior: 'smooth' });
    }
  };

  return (
    <section className="bg-white">
      <div className="container mx-auto px-4">
        <div
          ref={scrollRef}
          className="flex overflow-x-auto scrollbar-hide snap-x snap-mandatory"
        >
          {error ? (
            <p className="text-red-600 p-4">Failed to load featured products.</p>
          ) : loading ? (
            <>
              {[...Array(7)].map((_, index) => (
                <div key={index} className="flex-shrink-0 w-60 mr-4">
                  <div className="bg-gray-200 rounded-lg h-72 w-full animate-pulse"></div>
                </div>
              ))}
            </>
          ) : products.length === 0 ? (
            <p className="text-gray-600 p-4">No featured products found.</p>
          ) : (
            products.map((product) => (
              <div
                key={product.id}
                className="flex-shrink-0 w-60 mr-4 snap-start"
              >
                <ProductCard product={product} dailyDeals={dailyDeals} />
              </div>
            ))
          )}
        </div>
         <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={scrollLeft}
              className="bg-gray-200 rounded-full p-1 hover:bg-gray-300"
            >
              <i className="bx bx-chevron-left text-xl text-gray-600"></i>
            </button>
            <button
              onClick={scrollRight}
              className="bg-gray-200 rounded-full p-1 hover:bg-gray-300"
            >
              <i className="bx bx-chevron-right text-xl text-gray-600"></i>
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default FeaturedProducts;