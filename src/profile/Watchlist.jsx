import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, getDocs, getDoc, query, where, doc, deleteDoc } from 'firebase/firestore';
import Sidebar from './Sidebar';
import Spinner from '../components/common/Spinner';

const Watchlist = () => {
  const [watchlist, setWatchlist] = useState([]);
  const [userData, setUserData] = useState(null);
  const [orderCount, setOrderCount] = useState(0);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthError, setIsAuthError] = useState(false);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (!user) {
        setError('Please log in to view your watchlist.');
        setIsAuthError(true);
        setLoading(false);
        return;
      }

      try {
        const userDoc = doc(db, 'users', user.uid);
        const docSnap = await getDoc(userDoc);
        if (!docSnap.exists()) {
          console.warn('User document not found:', user.uid);
          setError('User profile not found.');
          return;
        }
        const firestoreData = docSnap.data();

        setUserData({
          email: user.email || 'test@example.com',
          username: firestoreData.username || user.displayName || 'emmaChi',
          name: firestoreData.name || user.displayName || 'Emmanuel Chinecherem',
          profileImage: firestoreData.profileImage || null,
          createdAt: firestoreData.createdAt || '2025-05-04T23:28:48.857Z',
          address: firestoreData.address || 'Not provided',
          uid: user.uid,
        });

        const ordersQuery = query(collection(db, 'orders'), where('userId', '==', user.uid));
        const ordersSnap = await getDocs(ordersQuery);
        setOrderCount(ordersSnap.docs.length);

        const favoritesQuery = query(collection(db, 'favorites'), where('userId', '==', user.uid));
        const favoritesSnap = await getDocs(favoritesQuery);
        setWishlistCount(favoritesSnap.docs.length);

        const favorites = await Promise.all(
          favoritesSnap.docs.map(async (favDoc) => {
            const productDoc = await getDoc(doc(db, 'products', favDoc.data().productId));
            if (productDoc.exists()) {
              return {
                id: favDoc.id,
                productId: favDoc.data().productId,
                ...productDoc.data(),
              };
            }
            return null;
          })
        );

        setWatchlist(favorites.filter((item) => item !== null));
      } catch (err) {
        console.error('Error loading watchlist:', err);
        setError('Failed to load watchlist.');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const removeFromWatchlist = async (favoriteId) => {
    try {
      await deleteDoc(doc(db, 'favorites', favoriteId));
      setWatchlist((prev) => prev.filter((item) => item.id !== favoriteId));
      setWishlistCount((prev) => prev - 1);
      window.dispatchEvent(new Event('wishlistCountUpdated'));
    } catch (err) {
      console.error('Error removing from watchlist:', err);
      setError('Failed to remove item.');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Spinner />
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600">{error}</p>
        {isAuthError ? (
          <Link to="/login" className="text-blue-600 hover:underline">
            Go to Login
          </Link>
        ) : (
          <button
            onClick={() => setError('')}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800">
      <div className="flex flex-col md:flex-row gap-6">
        <Sidebar userData={userData} orderCount={orderCount} wishlistCount={wishlistCount} />
        <div className="md:w-3/4">
          <h1 className="text-2xl font-bold text-gray-800 mb-6">Your Watchlist</h1>
          {watchlist.length === 0 ? (
            <p className="text-gray-600">
              Your watchlist is empty.{' '}
              <Link to="/products" className="text-blue-600 hover:underline">
                Continue shopping
              </Link>
            </p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {watchlist.map((product) => (
                <div key={product.id} className="bg-gray-100 rounded-lg p-4">
                  <Link to={`/product/${product.productId}`}>
                    <img
                      src={product.imageUrl || 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg'}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-md mb-2"
                    />
                    <h3 className="text-sm font-bold text-gray-800">{product.name}</h3>
                    <p className="text-xs text-gray-600">
                      ₦{product.price.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </Link>
                  <button
                    onClick={() => removeFromWatchlist(product.id)}
                    className="mt-2 text-red-500 hover:text-red-700"
                  >
                    <i className="bx bx-bookmark text-xl"></i> Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Watchlist;