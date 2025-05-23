import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getCartItemCount } from '/src/utils/cartUtils';
import { toast } from 'react-toastify';
import logo from '/src/assets/logo.png';

const Header = () => {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchCategory, setSearchCategory] = useState('All Categories');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);

  const categories = [
    'All Categories',
    'Tablet & Phones',
    'Health & Beauty',
    'Electronics',
    'Baby Products',
    'Computers & Accessories',
    'Game & Fun',
    'Drinks & Categories',
    'Home & Kitchen',
    'Smart Watches',
  ];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      try {
        const count = await getCartItemCount(currentUser?.uid);
        setCartCount(count);
        if (currentUser) {
          try {
            const storedUserData = localStorage.getItem('userData');
            if (storedUserData) {
              setUserData(JSON.parse(storedUserData));
            }
          } catch (err) {
            console.error('Error parsing userData:', err);
            toast.error('Failed to load user profile');
          }
        } else {
          setUserData(null);
          setNotificationCount(0);
          localStorage.removeItem('userData');
        }
      } catch (err) {
        console.error('Error in auth state:', err);
        toast.error('Failed to initialize session');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const fetchNotifications = async () => {
        try {
          const notificationsQuery = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            where('read', '==', false)
          );
          const notificationsSnap = await getDocs(notificationsQuery);
          setNotificationCount(notificationsSnap.size);
        } catch (err) {
          console.error('Error fetching notifications:', err);
          toast.error('Failed to load notifications');
        }
      };
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    try {
      const storedFavorites = localStorage.getItem('favorites');
      setFavorites(storedFavorites ? JSON.parse(storedFavorites) : []);
    } catch (err) {
      console.error('Error loading favorites:', err);
      toast.error('Failed to load favorites');
    }

    const handleCartUpdate = async () => {
      try {
        const count = await getCartItemCount(user?.uid);
        setCartCount(count);
      } catch (err) {
        console.error('Error updating cart:', err);
        toast.error('Failed to update cart');
      }
    };

    const handleStorageChange = (event) => {
      if (event.key === 'favorites') {
        try {
          const storedFavorites = localStorage.getItem('favorites');
          setFavorites(storedFavorites ? JSON.parse(storedFavorites) : []);
        } catch (err) {
          console.error('Error parsing favorites:', err);
          toast.error('Failed to sync favorites');
        }
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  const getDisplayName = () => {
    if (userData && userData.name) return userData.name.split(' ')[0] || 'User';
    return user ? user.displayName?.split(' ')[0] || 'User' : 'Guest';
  };

  const handleSearch = async (e) => {
    const queryText = e.target.value;
    setSearchQuery(queryText);
    if (queryText.trim() === '') {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      let q = query(collection(db, 'products'));
      if (searchCategory !== 'All Categories') {
        q = query(q, where('category', '==', searchCategory.toLowerCase()));
      }
      const querySnapshot = await getDocs(q);
      const filtered = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((product) =>
          product.name.toLowerCase().includes(queryText.toLowerCase())
        );
      setSearchResults(filtered);
      setShowDropdown(true);
    } catch (err) {
      console.error('Error searching:', err);
      setError('Failed to search.');
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (e) => {
    setSearchCategory(e.target.value);
    if (searchQuery.trim() !== '') {
      handleSearch({ target: { value: searchQuery } });
    }
  };

  const handleFocus = () => {
    if (searchQuery.trim() !== '' && searchResults.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 200);
  };

  const favoritesCount = favorites.length;

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <header className="bg-white">
      <div className="hidden sm:block border-b border-gray-200 text-gray-600 py-2">
        <div className="container mx-auto px-4 flex flex-col justify-between sm:flex-row sm:justify-between sm:items-center">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm">
            {user ? (
              <div className="flex items-center gap-3">
                <Link to="/profile" className="cursor-pointer hover:text-blue-600">
                  Hello, {getDisplayName()}
                </Link>
              </div>
            ) : (
              <p className="cursor-pointer">
                Hi!{' '}
                <Link to="/login" className="text-blue-500 underline">
                  Sign in
                </Link>{' '}
                or{' '}
                <Link to="/register" className="text-blue-500 underline">
                  Register
                </Link>
              </p>
            )}
            <Link to="/deals" className="hover:text-blue-600">
              Daily Deals
            </Link>
            <Link to="/brands" className="hover:text-blue-600 hidden lg:inline">
              Brand Outlet
            </Link>
            <Link to="/gift-cards" className="hover:text-blue-600 hidden lg:inline">
              Gift Cards
            </Link>
            <Link to="/help" className="hover:text-blue-600 hidden lg:inline">
              Help & Contact
            </Link>
            <div className="relative group lg:hidden p-1">
              <button className="hover:text-blue-600 flex items-center">
                More <i className="bx bx-chevron-down ml-1"></i>
              </button>
              <div className="absolute hidden group-hover:block bg-white border border-gray-200 py-2 mt-1 z-10 w-48 rounded-md shadow-lg">
                <Link to="/brands" className="block px-4 py-1 text-sm hover:bg-gray-100">
                  Brand Outlet
                </Link>
                <Link to="/gift-cards" className="block px-4 py-1 text-sm hover:bg-gray-100">
                  Gift Cards
                </Link>
                <Link to="/help" className="block px-4 py-1 text-sm hover:bg-gray-100">
                  Help & Contact
                </Link>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-sm mt-2 sm:mt-0">
            <Link to="/ship-to" className="hover:text-blue-600">
              Ship to
            </Link>
            <div className="relative group">
              <button className="hover:text-blue-600 flex items-center">
                My Foremade <i className="bx bx-chevron-down ml-1"></i>
              </button>
              <div className="absolute hidden group-hover:block bg-white border border-gray-200 py-3 z-10 w-48 rounded-md shadow-lg">
                <Link to="/profile" className="block px-4 py-1 text-sm hover:bg-gray-100">
                  Profile
                </Link>
                <Link to="/orders" className="block px-4 py-1 text-sm hover:bg-gray-100">
                  Orders
                </Link>
                <Link to="/favorites" className="block px-4 py-1 text-sm hover:bg-gray-100">
                  Favorites ({favoritesCount})
                </Link>
                {user && (
                  <>
                    <Link to="/my-products" className="block px-4 py-1 text-sm hover:bg-gray-100">
                      My Products
                    </Link>
                    <Link to="/upload-product" className="block px-4 py-1 text-sm hover:bg-gray-100">
                      Upload Product
                    </Link>
                  </>
                )}
              </div>
            </div>
            <Link to="/sellers-guide" className="hover:text-blue-600">
              Sell
            </Link>
            <Link to="/watchlist" className="hover:text-blue-600">
              Watchlist
            </Link>
            <Link to="/notifications" className="relative">
              <i className="bx bx-bell text-xl text-gray-600"></i>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[12px] rounded-full h-4 w-4 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Link>
            <div className="hidden sm:flex items-center gap-3">
              <Link to="/favorites" className="flex items-center relative">
                <i className="bx bx-heart text-slate-500 text-xl"></i>
                {favoritesCount > 0 && (
                  <span className="absolute -top-1 -right-2 bg-red-600 text-white text-[12px] rounded-full h-4 w-4 flex items-center justify-center">
                    {favoritesCount}
                  </span>
                )}
              </Link>
              <Link to="/cart" className="flex items-center relative">
                <i className="bx bx-cart-alt text-[#ec9d38] text-xl"></i>
                {cartCount > 0 && (
                  <div className="absolute -top-1 -right-2 bg-red-600 text-white text-[12px] rounded-full h-4 w-4 flex items-center justify-center">
                    {cartCount}
                  </div>
                )}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 text-black py-2 flex justify-between items-center sm:border-gray-200">
        <div className="flex items-center">
          <Link to="/">
            <img
              src={logo}
              className="h-12 sm:h-14 sm:w-[400px] md:w-[400px] lg:w-[400px] xl:w-[300px]"
              alt="Foremade"
            />
          </Link>
        </div>

        <div className="hidden sm:flex items-center w-full mx-4 relative">
          <div className="flex items-center rounded-full w-full">
            <div className="relative flex-1 border-2 rounded-l-full border-l-2">
              <input
                type="text"
                placeholder="Search Foremade"
                className="w-full border-2 border-black bg-white py-2 pl-10 pr-3 text-lg focus:outline-none placeholder-black text-black border-none rounded-l-full"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <i className="bx bx-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-600 text-xl"></i>
            </div>
            <div className="relative">
              <select
                value={searchCategory}
                onChange={handleCategoryChange}
                className="bg-gray-100 py-2 pl-3 w-40 text-lg text-black focus:outline-none appearance-none rounded-r-full border-r border-gray-300"
              >
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
              <i className="bx bx-chevron-down absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600 text-lg"></i>
            </div>
          </div>
          <button className="m-3 bg-blue-600 py-2 px-4 rounded-full text-white text-lg">
            Search
          </button>
          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-2 text-base text-gray-600">Loading...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="flex items-center p-2 hover:bg-gray-100"
                    onClick={() => {
                      setShowDropdown(false);
                      setSearchQuery('');
                    }}
                  >
                    <img
                      src={
                        product.imageUrls && product.imageUrls[0]?.startsWith('https://')
                          ? product.imageUrls[0]
                          : 'https://via.placeholder.com/40?text=Image+Not+Found'
                      }
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded mr-2"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/40?text=Image+Not+Found';
                      }}
                    />
                    <span className="text-base text-gray-800">{product.name}</span>
                  </Link>
                ))
              ) : (
                <div className="p-2 text-base text-gray-600">No results found</div>
              )}
            </div>
          )}
        </div>

        <div className="sm:hidden flex items-center gap-3">
          <Link to="/cart" className="relative">
            <i className="bx bx-heart text-black text-2xl"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-sm rounded-full h-5 w-5 flex items-center justify-center">
                {0}
              </span>
            )}
          </Link>
          <Link to="/cart" className="relative">
            <i className="bx bx-cart-alt text-black text-2xl"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-sm rounded-full h-5 w-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="text-gray-600 focus:outline-none"
          >
            <i className="bx bx-menu text-2xl text-black"></i>
          </button>
        </div>
      </div>

      <div className="sm:hidden px-4 py-2">
        <div className="flex items-center w-full mb-2 relative">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search Foremade"
              className="w-full border border-gray-300 rounded-l-md p-2 pl-8 text-base focus:outline-none focus:ring-2 focus:ring-blue-600"
              value={searchQuery}
              onChange={handleSearch}
              onFocus={handleFocus}
              onBlur={handleBlur}
            />
            <i className="bx bx-search absolute left-2 top-1/2 transform -translate-y-1/2 text-black-600 text-lg"></i>
          </div>
          <button className="bg-blue-600 text-amber-400 p-1 rounded-r-md">
            <i className="bx bx-search text-xl"></i>
          </button>
          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-2 text-base text-gray-600">Loading...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="flex items-center p-2 hover:bg-gray-100"
                    onClick={() => {
                      setShowDropdown(false);
                      setSearchQuery('');
                    }}
                  >
                    <img
                      src={
                        product.imageUrls && product.imageUrls[0]?.startsWith('https://')
                          ? product.imageUrls[0]
                          : 'https://via.placeholder.com/40?text=Image+Not+Found'
                      }
                      alt={product.name}
                      className="w-10 h-10 object-cover rounded mr-2"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/40?text=Image+Not+Found';
                      }}
                    />
                    <span className="text-base text-gray-800">{product.name}</span>
                  </Link>
                ))
              ) : (
                <div className="p-2 text-base text-gray-600">No results found</div>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center justify-start gap-2 overflow-x-auto scrollbar-hide p-2">
          {!user && (
            <Link
              to="/login"
              className="flex items-center justify-center bg-white border border-gray-200 rounded-full px-4 py-1 text-base text-gray-600 hover:bg-gray-100 whitespace-nowrap"
              onClick={() => setIsSidebarOpen(false)}
            >
              <i className="bx bx-log-in mr-2 text-lg text-gray-500"></i>Sign in
            </Link>
          )}
          {categories.slice(1).map((category) => (
            <Link
              key={category}
              to={`/${category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
              className="flex items-center justify-center bg-white border border-gray-200 rounded-full px-4 py-1 text-base text-gray-600 hover:bg-gray-100 whitespace-nowrap"
            >
              <i className="bx bx-category mr-2 text-lg text-gray-500"></i>{category}
            </Link>
          ))}
        </div>
      </div>

      <div className="hidden sm:block border-t border-gray-200 py-2">
        <div className="container mx-auto px-4">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4 text-sm text-gray-600">
            {categories.slice(1).map((category) => (
              <Link
                key={category}
                to={`/${category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                className="hover:text-blue-600"
              >
                {category}
              </Link>
            ))}
            <div className="relative group lg:hidden">
              <button className="hover:text-blue-600 flex items-center">
                More <i className="bx bx-chevron-down ml-1"></i>
              </button>
              <div className="absolute hidden group-hover:block bg-white border border-gray-200 py-2 mt-1 z-10 w-48 rounded-md shadow-lg">
                <Link
                  to="/travel-lifestyle"
                  className="block px-4 py-1 text-sm hover:bg-gray-100"
                >
                  Travel & Lifestyle
                </Link>
                <Link
                  to="/computers-accessories"
                  className="block px-4 py-1 text-sm hover:bg-gray-100"
                >
                  Computers & Accessories
                </Link>
                <Link
                  to="/game-fun"
                  className="block px-4 py-1 text-sm hover:bg-gray-100"
                >
                  Game & Fun
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-y-0 left-0 w-64 bg-white transform ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } transition-transform duration-300 sm:hidden z-50 shadow-lg`}
      >
        <div className="flex justify-between items-center p-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">Menu</h2>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="text-gray-600 focus:outline-none"
          >
            <i className="bx bx-x text-2xl"></i>
          </button>
        </div>
        <nav className="flex flex-col p-4 space-y-2 text-base text-gray-600">
          <div className="flex items-center space-x-2 mb-4">
            <Link to="/profile" onClick={() => setIsSidebarOpen(false)}>
              <i className="bx bx-user-circle text-2xl text-gray-600"></i>
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                <Link
                  to="/profile"
                  className="cursor-pointer hover:text-blue-600"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  Hello, {getDisplayName()}
                </Link>
              </div>
            ) : (
              <p className="cursor-pointer">
                Hi!{' '}
                <Link
                  to="/login"
                  className="text-blue-600 underline"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  Sign in
                </Link>
                <span className="mx-1">|</span>
                <Link
                  to="/register"
                  className="text-blue-600 underline"
                  onClick={() => setIsSidebarOpen(false)}
                >
                  Register
                </Link>
              </p>
            )}
          </div>
          <Link
            to="/deals"
            className="flex items-center space-x-2 hover:text-blue-600"
            onClick={() => setIsSidebarOpen(false)}
          >
            <i className="bx bx-bolt-circle text-lg"></i>
            <span>Hot Deals</span>
          </Link>
          <Link
            to="/brands"
            className="flex items-center space-x-2 hover:text-blue-600"
            onClick={() => setIsSidebarOpen(false)}
          >
            <i className="bx bx-store text-lg"></i>
            <span>Premium Brands</span>
          </Link>
          <Link
            to="/gift-cards"
            className="flex items-center space-x-2 hover:text-blue-600"
            onClick={() => setIsSidebarOpen(false)}
          >
            <i className="bx bx-gift text-lg"></i>
            <span>Gift Vouchers</span>
          </Link>
          <Link
            to="/help"
            className="flex items-center space-x-2 hover:text-blue-600"
            onClick={() => setIsSidebarOpen(false)}
          >
            <i className="bx bx-help-circle text-lg"></i>
            <span>Support Center</span>
          </Link>
          <Link
            to="/ship-to"
            className="flex items-center space-x-2 hover:text-blue-600"
            onClick={() => setIsSidebarOpen(false)}
          >
            <i className="bx bx-globe text-lg"></i>
            <span>Delivery Options</span>
          </Link>
          <Link
            to="/sellers-guide"
            className="flex items-center space-x-2 hover:text-blue-600"
            onClick={() => setIsSidebarOpen(false)}
          >
            <i className="bx bx-camera text-lg"></i>
            <span>Start Selling</span>
          </Link>
          <Link
            to="/favorites"
            className="flex items-center space-x-2 hover:text-blue-600"
            onClick={() => setIsSidebarOpen(false)}
          >
            <i className="bx bx-heart text-lg"></i>
            <span>Favorites ({favoritesCount})</span>
          </Link>
          <Link
            to="/profile"
            className="flex items-center space-x-2 hover:text-blue-600"
            onClick={() => setIsSidebarOpen(false)}
          >
            <i className="bx bx-user text-lg"></i>
            <span>Profile</span>
          </Link>
          <Link
            to="/watchlist"
            className="flex items-center space-x-2 hover:text-blue-600"
            onClick={() => setIsSidebarOpen(false)}
          >
            <i className="bx bx-bookmark text-lg"></i>
            <span>Watchlist</span>
          </Link>
          <Link
            to="/orders"
            className="flex items-center space-x-2 hover:text-blue-600"
            onClick={() => setIsSidebarOpen(false)}
          >
            <i className="bx bx-package text-lg"></i>
            <span>Orders</span>
          </Link>
          {user && (
            <>
              <Link
                to="/my-products"
                className="flex items-center space-x-2 hover:text-blue-600"
                onClick={() => setIsSidebarOpen(false)}
              >
                <i className="bx bx-store-alt text-lg"></i>
                <span>My Products</span>
              </Link>
              <Link
                to="/product-product"
                className="flex items-center space-x-2 hover:text-blue-600"
                onClick={() => setIsSidebarOpen(false)}
              >
                <i className="bx bx-upload text-lg"></i>
                <span>Upload Product</span>
              </Link>
            </>
          )}
        </nav>
      </div>

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 z-40">
        <Link
          to="/"
          className={`flex flex-col items-center ${
            location.pathname === '/' ? 'text-gray-600' : 'text-gray-600'
          } hover:text-amber-500`} // Changed hover to amber-500
        >
          <i className="bx bx-home-alt text-2xl"></i>
          <span className="text-sm">Home</span>
        </Link>
        <Link
          to="/search"
          className={`flex flex-col items-center ${
            location.pathname === '/search' ? 'text-blue-600' : 'text-gray-600'
          } hover:text-amber-500`} // Changed hover to amber-500
        >
          <i className="bx bx-search text-2xl"></i>
          <span className="text-sm">Search</span>
        </Link>
        <Link
          to="/sellers-guide"
          className={`flex flex-col items-center ${
            location.pathname === '/sellers-guide' ? 'text-blue-600' : 'text-gray-600'
          } hover:text-amber-500`} // Changed hover to amber-500
        >
          <i className="bx bxs-plus-circle text-2xl"></i>
          <span className="text-sm">Sell</span>
        </Link>
        <Link
          to="/notifications"
          className={`flex flex-col items-center relative ${
            location.pathname === '/notifications' ? 'text-blue-600' : 'text-gray-600'
          } hover:text-amber-500`} // Changed hover to amber-500
        >
          <i className="bx bx-bell text-2xl"></i>
          {notificationCount > 0 && (
            <span className="absolute top-0 right-2 bg-red-600 text-white text-sm rounded-full h-5 w-5 flex items-center justify-center">
              {notificationCount}
            </span>
          )}
          <span className="text-sm">Inbox</span>
        </Link>
        <Link
          to="/profile"
          className={`flex flex-col items-center ${
            location.pathname === '/profile' ? 'text-blue-600' : 'text-gray-600'
          } hover:text-amber-500`} // Changed hover to amber-500
        >
          <i className="bx bx-user text-2xl"></i>
          <span className="text-sm">Me</span> {/* Changed Profile to Me */}
        </Link>
      </nav>
    </header>
  );
};

export default Header;