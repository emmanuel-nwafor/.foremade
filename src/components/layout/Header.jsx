import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { collection, doc, getDoc, onSnapshot, query, where, getDocs } from 'firebase/firestore';
import { getCartItemCount } from '/src/utils/cartUtils';
import { toast } from 'react-toastify';
import logo from '/src/assets/foremade.png';
import FreeShipping from '../home/FreeShipping';

const Header = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [cartCount, setCartCount] = useState(0);
  const [favorites, setFavorites] = useState([]);
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [categoryMoreOpen, setCategoryMoreOpen] = useState(false);
  const [mobileCategoryMoreOpen, setMobileCategoryMoreOpen] = useState(false);
  const [categories, setCategories] = useState([]);

  const mobileHeaderHeight = "5rem";

  const slugify = (name) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

  // Fetch categories with custom order only (badges removed)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), async (snapshot) => {
      const catList = snapshot.docs.map((doc) => doc.id);

      try {
        const orderRef = doc(db, 'settings', 'categoryOrder');
        const orderSnap = await getDoc(orderRef);

        let ordered = catList;
        if (orderSnap.exists() && orderSnap.data().order) {
          const saved = orderSnap.data().order;
          ordered = [
            ...saved.filter((c) => catList.includes(c)),
            ...catList.filter((c) => !saved.includes(c)).sort((a, b) => a.localeCompare(b)),
          ];
        } else {
          ordered.sort((a, b) => a.localeCompare(b));
        }

        setCategories(ordered);
      } catch (err) {
        console.error('Error loading categories:', err);
        toast.error('Failed to load categories');
        setCategories(catList.sort((a, b) => a.localeCompare(b)));
      }
    });

    return () => unsub();
  }, []);

  const visibleCategories = categories.slice(0, 8);
  const hiddenCategories = categories.slice(8);
  const getCategoryPath = (category) => `/category/${slugify(category)}`;
  const showBackButton = location.pathname !== '/';

  // Auth, cart, notifications, favorites (unchanged)
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      try {
        const count = await getCartItemCount(currentUser?.uid);
        setCartCount(count);
        if (currentUser) {
          const storedUserData = localStorage.getItem('userData');
          if (storedUserData) setUserData(JSON.parse(storedUserData));
        } else {
          setUserData(null);
          setNotificationCount(0);
          setFavorites([]);
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
          toast.error('Failed to load notifications');
        }
      };
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const stored = localStorage.getItem('favorites');
        setFavorites(stored ? JSON.parse(stored) : []);
      } catch (err) {
        toast.error('Failed to sync favorites');
      }
    };
    loadFavorites();

    const handleCartUpdate = async () => {
      try {
        const count = await getCartItemCount(user?.uid);
        setCartCount(count);
      } catch (err) {
        toast.error('Failed to update cart');
      }
    };

    const handleStorageChange = (e) => e.key === 'favorites' && loadFavorites();

    window.addEventListener('cartUpdated', handleCartUpdate);
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('cartUpdated', handleCartUpdate);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [user]);

  const getDisplayName = () => {
    if (userData?.name) return userData.name.split(' ')[0];
    return user?.displayName?.split(' ')[0] || 'Guest';
  };

  const handleSearch = async (e) => {
    const queryText = e.target.value;
    setSearchQuery(queryText);
    if (!queryText.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }
    setLoading(true);
    try {
      const q = query(collection(db, 'products'), where('status', '==', 'approved'));
      const snapshot = await getDocs(q);
      const filtered = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((p) => p.name.toLowerCase().includes(queryText.toLowerCase()));
      setSearchResults(filtered);
      setShowDropdown(true);
    } catch (err) {
      toast.error('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleFocus = () => searchQuery.trim() && searchResults.length > 0 && setShowDropdown(true);
  const handleBlur = () => setTimeout(() => setShowDropdown(false), 200);

  const toggleCategoryMore = () => setCategoryMoreOpen((prev) => !prev);
  const toggleMobileCategoryMore = () => setMobileCategoryMoreOpen((prev) => !prev);

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <header className="w-full">
      {/* Desktop Top Bar */}
      <div className="bg-[#112639] hidden sm:flex text-white w-full h-16 items-center">
        <div className="flex w-full h-full items-center justify-between px-4">
          <div className="flex items-center">
            <Link to="/"><img src={logo} className="h-10 w-auto my-3" alt="Foremade" /></Link>
            <nav className="flex items-center ml-4">
              <Link to="/products" className="px-3 hover:text-gray-100 hover:underline">Shop</Link>
              <Link to="/products-upload" className="px-3 hover:text-gray-100 hover:underline">Sell</Link>
              <Link to="/smile" className="px-3 hover:text-gray-100 hover:underline">Smile</Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            {user ? (
              <Link to="/profile" className="hover:text-gray-300 text-sm">Hi, {getDisplayName()}</Link>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <Link to="/login" className="hover:text-gray-300">Login</Link>
                <span className="text-gray-300">|</span>
                <Link to="/register" className="hover:text-gray-300">Sign Up</Link>
              </div>
            )}
            <Link to="/notifications" className="relative">
              <i className="bx bx-bell text-xl"></i>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative">
              <i className="bx bx-cart-alt text-xl"></i>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
      <div className="hidden sm:block bg-[#eb9325] h-2 w-full" />

      {/* Mobile Fixed Header */}
      <div className="sm:hidden bg-[#112639] text-white flex items-center justify-between px-4 py-5 fixed top-0 left-0 right-0 z-40"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <Link to="/"><img src={logo} className="h-14 my-3" alt="Foremade" /></Link>
        <div className="flex items-center gap-4">
          <Link to="/cart" className="relative">
            <i className="bx bx-cart-alt text-xl"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button onClick={() => setSidebarOpen(true)}><i className="bx bx-menu text-2xl"></i></button>
        </div>
      </div>

      {/* Mobile Spacer + Orange Bar + FreeShipping */}
      <div className="sm:hidden" style={{ height: `calc(${mobileHeaderHeight} + env(safe-area-inset-top))`, minHeight: '5rem' }} />
      <div className="sm:hidden bg-[#eb9325] h-2 w-full" />
      {/* <div className="sm:hidden"><FreeShipping /></div> */}

      {/* Mobile Search & Categories (no badges) */}
      <div className="block sm:hidden px-2 mt-2">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search for electronics, accessories..."
            className="w-full p-2 pl-10 pr-4 border border-gray-400 rounded-md text-black text-xs focus:outline-none"
            value={searchQuery}
            onChange={handleSearch}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 text-sm pointer-events-none"></i>
          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-2 text-xs text-gray-600">Loading...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map((product) => (
                  <Link
                    key={product.id}
                    to={`/product/${product.id}`}
                    className="flex items-center p-2 hover:bg-gray-100"
                    onClick={() => { setShowDropdown(false); setSearchQuery(''); }}
                  >
                    <img
                      src={product.imageUrls?.[0]?.startsWith('https://') ? product.imageUrls[0] : 'https://via.placeholder.com/40?text=No+Image'}
                      alt={product.name}
                      className="w-8 h-8 object-cover rounded mr-2"
                      onError={(e) => e.target.src = 'https://via.placeholder.com/40?text=No+Image'}
                    />
                    <span className="text-xs text-gray-800">{product.name}</span>
                  </Link>
                ))
              ) : (
                <div className="p-2 text-xs text-gray-600">No results found</div>
              )}
            </div>
          )}
        </div>

        <div className="flex overflow-x-auto gap-3 py-3 hide-scrollbar">
          {categories.map((category) => (
            <Link
              key={category}
              to={getCategoryPath(category)}
              className="bg-gray-100 rounded-full px-4 py-2 text-xs text-gray-700 hover:text-blue-600 whitespace-nowrap flex-shrink-0"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>

      {/* Desktop FreeShipping + Search + Categories (no badges) */}
      {/* <div className="hidden sm:block"><FreeShipping /></div> */}
      <div className="hidden sm:block">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col items-center">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search Foremade"
                className="w-full p-3 pl-12 pr-12 border border-gray-400 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <i className="bx bx-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 text-xl"></i>
              {showDropdown && (
                <div className="absolute top-full left-0 mt-2 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="p-3 text-gray-600">Loading...</div>
                  ) : searchResults.length > 0 ? (
                    searchResults.map((product) => (
                      <Link
                        key={product.id}
                        to={`/product/${product.id}`}
                        className="flex items-center p-3 hover:bg-gray-100"
                        onClick={() => { setShowDropdown(false); setSearchQuery(''); }}
                      >
                        <img
                          src={product.imageUrls?.[0]?.startsWith('https://') ? product.imageUrls[0] : 'https://via.placeholder.com/50?text=No+Image'}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded mr-3"
                          onError={(e) => e.target.src = 'https://via.placeholder.com/50?text=No+Image'}
                        />
                        <span className="text-gray-800">{product.name}</span>
                      </Link>
                    ))
                  ) : (
                    <div className="p-3 text-gray-600">No results found</div>
                  )}
                </div>
              )}
            </div>

            <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm text-gray-700">
              {visibleCategories.map((category) => (
                <Link
                  key={category}
                  to={getCategoryPath(category)}
                  className="hover:text-blue-600"
                >
                  {category}
                </Link>
              ))}
              {categories.length > 8 && (
                <div className="relative">
                  <button onClick={toggleCategoryMore} className="hover:text-blue-600 flex items-center gap-1">
                    More <i className="bx bx-chevron-down"></i>
                  </button>
                  {categoryMoreOpen && (
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
                      {hiddenCategories.map((category) => (
                        <Link
                          key={category}
                          to={getCategoryPath(category)}
                          className="block px-4 py-3 text-gray-800 hover:bg-gray-100"
                          onClick={() => setCategoryMoreOpen(false)}
                        >
                          {category}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Back Button */}
      {showBackButton && (
        <div className="w-full flex justify-start mt-4 px-4">
          <button
            onClick={() => (window.history.length > 2 ? navigate(-1) : navigate('/'))}
            className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-200 text-blue-700 font-medium"
          >
            <i className="bx bx-arrow-back text-xl"></i>
            <span className="hidden sm:inline">Return</span>
          </button>
        </div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around py-2 z-40">
        <Link to="/" className={`flex flex-col items-center ${location.pathname === '/' ? 'text-blue-600' : 'text-gray-600'}`}>
          <i className="bx bx-home-alt text-2xl"></i>
          <span className="text-xs">Home</span>
        </Link>
        <Link to="/search" className={`flex flex-col items-center ${location.pathname === '/search' ? 'text-blue-600' : 'text-gray-600'}`}>
          <i className="bx bx-search text-2xl"></i>
          <span className="text-xs">Search</span>
        </Link>
        <Link to="/products-upload" className={`flex flex-col items-center ${location.pathname.startsWith('/products-upload') ? 'text-blue-600' : 'text-gray-600'}`}>
          <i className="bx bxs-plus-circle text-2xl"></i>
          <span className="text-xs">Sell</span>
        </Link>
        <Link to="/notifications" className={`flex flex-col items-center relative ${location.pathname === '/notifications' ? 'text-blue-600' : 'text-gray-600'}`}>
          <i className="bx bx-bell text-2xl"></i>
          {notificationCount > 0 && (
            <span className="absolute -top-1 right-3 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notificationCount}
            </span>
          )}
          <span className="text-xs">Inbox</span>
        </Link>
        <Link to="/profile" className={`flex flex-col items-center ${location.pathname === '/profile' ? 'text-blue-600' : 'text-gray-600'}`}>
          <i className="bx bx-user text-2xl"></i>
          <span className="text-xs">You</span>
        </Link>
      </nav>

      {/* Mobile Sidebar */}
      <div className={`sm:hidden fixed inset-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300`}>
        <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
        <div className="relative w-full h-full bg-[#f8d7b0] overflow-y-auto">
          <div className="p-4">
            <button onClick={() => setSidebarOpen(false)} className="mb-6">
              <i className="bx bx-x text-3xl text-[#112040]"></i>
            </button>
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-3">
                <Link to="/products" onClick={() => setSidebarOpen(false)} className="bg-white/80 text-[#112040] text-center py-3 rounded-lg font-semibold hover:bg-white">
                  Shop
                </Link>
                <Link to="/products-upload-variant" onClick={() => setSidebarOpen(false)} className="bg-white/80 text-[#112040] text-center py-3 rounded-lg font-semibold hover:bg-white">
                  Sell
                </Link>
                <Link to="/smile" onClick={() => setSidebarOpen(false)} className="bg-white/80 text-[#112040] text-center py-3 rounded-lg font-semibold hover:bg-white">
                  Smile
                </Link>
              </div>
              {user ? (
                <Link to="/profile" onClick={() => setSidebarOpen(false)} className="block bg-[#112040] text-white text-center py-3 rounded-lg">
                  My Profile
                </Link>
              ) : (
                <div className="bg-[#112040] text-white text-center py-3 rounded-lg">
                  <Link to="/login" onClick={() => setSidebarOpen(false)} className="mx-2">Log in</Link>
                  <span>|</span>
                  <Link to="/register" onClick={() => setSidebarOpen(false)} className="mx-2">Sign up</Link>
                </div>
              )}
              <div className="space-y-1">
                {categories.slice(0, 8).map((category) => (
                  <Link
                    key={category}
                    to={getCategoryPath(category)}
                    onClick={() => setSidebarOpen(false)}
                    className="block py-2 border-b border-[#112040]/10 text-[#112040] hover:text-amber-500"
                  >
                    {category}
                  </Link>
                ))}
                {categories.length > 8 && (
                  <div>
                    <button
                      onClick={toggleMobileCategoryMore}
                      className="w-full text-left py-2 border-b border-[#112040]/10 flex justify-between items-center text-[#112040] hover:text-amber-500"
                    >
                      More <i className="bx bx-chevron-down"></i>
                    </button>
                    {mobileCategoryMoreOpen && (
                      <div className="pl-4 space-y-1">
                        {categories.slice(8).map((category) => (
                          <Link
                            key={category}
                            to={getCategoryPath(category)}
                            onClick={() => {
                              setSidebarOpen(false);
                              setMobileCategoryMoreOpen(false);
                            }}
                            className="block py-2 border-b border-[#112040]/10 text-[#112040] hover:text-amber-500"
                          >
                            {category}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;