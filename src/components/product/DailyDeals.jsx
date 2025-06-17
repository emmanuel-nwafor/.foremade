import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';

const DailyDeals = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDeals = async () => {
      try {
        setLoading(true);
        const q = query(collection(db, 'products'), where('status', '==', 'approved'));
        const querySnapshot = await getDocs(q);
        const deals = querySnapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
          }))
          .filter(product => product.id && product.name && product.price);
        setProducts(deals);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching daily deals:', err);
        setError('Failed to load daily deals');
        setLoading(false);
      }
    };
    fetchDeals();
  }, []);

  if (loading) {
    return <div className="animate-pulse">Loading deals...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!products.length) {
    return <div>No daily deals available.</div>;
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {products.map(product => (
        <ProductCard key={product.id} product={product} isDailyDeal={true} />
      ))}
    </div>
  );
};

export default DailyDeals;