import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';
import { toast } from 'react-toastify';

export default function AllTrendingGadgets() {
  const [products, setProducts] = useState([]);
  const [dailyDeals, setDailyDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const category = 'Gadgets';

  const firestoreCategories = [
    'tablet & phones',
    'computers & accessories',
    'electronics',
    'smart watches',
    'game & fun',
  ];

  const fetchProducts = async () => {
    try {
      setLoading(true);

      // Check admin-selected trending items
      const trendingQuery = query(
        collection(db, 'trendingItems'),
        where('category', '==', category)
      );
      const trendingSnapshot = await getDocs(trendingQuery);
      const trendingItems = trendingSnapshot.docs.map(doc => doc.data());

      if (trendingItems.length > 0) {
        const productPromises = trendingItems.map(async (item) => {
          const productDoc = await getDoc(doc(db, 'products', item.productId));
          if (productDoc.exists()) {
            return { id: productDoc.id, ...productDoc.data() };
          }
          return null;
        });
        const fetched = (await Promise.all(productPromises))
          .filter(p => p && p.status === 'approved');
        setProducts(fetched);
        return;
      }

      // Fallback
      const q = query(
        collection(db, 'products'),
        where('status', '==', 'approved'),
        where('category', 'in', firestoreCategories)
      );
      const snapshot = await getDocs(q);
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProducts(fetched);
    } catch (err) {
      toast.error('Failed to load gadgets products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    getDocs(collection(db, 'dailyDeals')).then(snapshot => {
      setDailyDeals(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
  }, []);

  return (
    <section className="py-8 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-6">
          All Trending Gadgets
        </h2>
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-gray-200 rounded-lg h-72 animate-pulse"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <p className="text-gray-600">No gadgets products found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map(product => (
              <ProductCard key={product.id} product={product} dailyDeals={dailyDeals} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
