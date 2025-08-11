import React, { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { Link } from 'react-router-dom';
import { collection, query, where, getDocs, getDoc, deleteDoc, doc } from 'firebase/firestore';
import Sidebar from '../profile/Sidebar';
import ProductCard from '../components/home/ProductCard';
import Spinner from '../components/common/Spinner';
import { HeartHandshakeIcon } from 'lucide-react';

export default function Favorites() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isAuthError, setIsAuthError] = useState(false);
  const [userData, setUserData] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [favoriteProducts, setFavoriteProducts] = useState([]);

  // Mock data for counts
  const mockOrderCount = 5;

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setLoading(true);
      if (!user) {
        console.log('No authenticated user'); // Debug
        setError('Please sign in to view your wishlist.');
        setIsAuthError(true);
        setFavorites([]);
        setFavoriteProducts([]);
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching data for user:', user.uid); // Debug
        const storedUserData = localStorage.getItem('userData');
        let additionalData = {};
        if (storedUserData) {
          additionalData = JSON.parse(storedUserData);
        }

        setUserData({
          email: user.email || 'test@example.com',
          name: user.displayName || 'User',
          profileImage: additionalData.profileImage || null,
          createdAt: additionalData.createdAt || null,
          address: additionalData.address || 'Not provided',
          uid: user.uid,
        });

        // Fetch favorites from Firestore
        console.log('Querying favorites for user:', user.uid);
        const favoritesQuery = query(
          collection(db, 'favorites'),
          where('userId', '==', user.uid)
        );
        const favoritesSnapshot = await getDocs(favoritesQuery);
        const favoriteList = favoritesSnapshot.docs.map((doc) => {
          console.log('Favorite doc:', doc.id, doc.data()); // Debug
          return {
            id: doc.id,
            ...doc.data(),
          };
        });
        setFavorites(favoriteList);

        // Fetch product details for favorites
        const productPromises = favoriteList.map(async (favorite) => {
          const productDoc = await getDoc(doc(db, 'products', favorite.productId));
          if (productDoc.exists()) {
            const data = productDoc.data();
            return {
              id: productDoc.id,
              name: data.name,
              description: data.description || '',
              price: data.price,
              stock: data.stock || 0,
              category: data.category?.trim().toLowerCase() || '',
              colors: data.colors || [],
              sizes: data.category?.trim().toLowerCase() === 'foremade fashion' ? data.sizes || [] : [],
              condition: data.condition || '',
              imageUrls: data.imageUrls || [], // Updated to use imageUrls array
              seller: data.seller || { name: 'Unknown Seller' },
              rating: data.rating || Math.random() * 2 + 3,
            };
          }
          console.warn('Product not found for favorite:', favorite.productId); // Debug
          return null;
        });

        const products = (await Promise.all(productPromises)).filter((product) => product !== null);
        setFavoriteProducts(products);
      } catch (err) {
        console.error('Error fetching favorites:', err.code, err.message, err.stack);
        setError('Failed to load wishlist: ' + (err.message || 'Unknown error'));
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const handleRemoveFavorite = async (favoriteId, productId) => {
    if (!auth.currentUser) {
      setError('Please sign in to manage your wishlist.');
      setIsAuthError(true);
      return;
    }

    try {
      console.log('Removing favorite:', favoriteId, 'for user:', auth.currentUser.uid); // Debug
      const favoriteDoc = await getDoc(doc(db, 'favorites', favoriteId));
      if (!favoriteDoc.exists()) {
        console.warn('Favorite not found:', favoriteId);
        return;
      }
      if (favoriteDoc.data().userId !== auth.currentUser.uid) {
        console.error('Cannot delete favorite with mismatched userId:', favoriteDoc.data());
        setError('Permission denied: Cannot remove this favorite.');
        return;
      }
      await deleteDoc(doc(db, 'favorites', favoriteId));
      setFavorites((prev) => prev.filter((fav) => fav.id !== favoriteId));
      setFavoriteProducts((prev) => prev.filter((prod) => prod.id !== productId));
      console.log('Removed favorite:', favoriteId);
    } catch (err) {
      console.error('Error removing favorite:', err.code, err.message, err.stack);
      setError('Failed to remove item from wishlist: ' + (err.message || 'Unknown error'));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Spinner />
        <p className="text-gray-600">Loading...</p>
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
            onClick={() => {
              setError('');
              setLoading(true); // Trigger reload
            }}
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
        <Sidebar userData={userData} orderCount={mockOrderCount} wishlistCount={favorites.length} />
        <div className="md:w-3/4">
          <div className="rounded-lg p-6  bg-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Favorites</h3>
            </div>
            {favoriteProducts.length === 0 ? (
              <div className="text-center">
                <div className="inline-block p-4 rounded-full mb-2 bg-gray-100">
                  <span className="text-2xl"><HeartHandshakeIcon /></span>
                </div>
                <p className="text-gray-400">No items in your wish list!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {favoriteProducts.map((product) => (
                  <div key={product.id} className="relative">
                    <ProductCard product={{ ...product, imageUrl: product.imageUrls[0] || '' }} />
                    <button
                      onClick={() => {
                        const favorite = favorites.find((fav) => fav.productId === product.id);
                        if (favorite) {
                          handleRemoveFavorite(favorite.id, product.id);
                        }
                      }}
                      className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      title="Remove from Wishlist"
                    >
                      <i className="bx bx-x"></i>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}