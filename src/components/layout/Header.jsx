import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
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
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [categoryMoreOpen, setCategoryMoreOpen] = useState(false);
  const [mobileCategoryMoreOpen, setMobileCategoryMoreOpen] = useState(false);

  // Calculate mobile header height for spacer
  const mobileHeaderHeight = "3rem"; // Adjust based on your actual header height

  const categories = [
    "Camera & Photography",
    "Television & Accessories",
    "Drinks & Beverages",
    "Game & Console",
    "Home & Living",
    "Perfumes & Fragrances",
    "Vehicles & Transport",
    "Clothing",
    "Cocoa, Coffee & Tea",
    "Computers & Laptops",
    "Footwear",
    "Grills & Outdoor Cooking",
    "Hair, Nails & Accessories",
    "Jewellery & Accessories",
    "Sneakers & Joggers",
    "Sound & Audio",
    "Sports & Outdoors",
    "🍼 Pregnancy & Mother Care",
    "💊 Health & Wellness"
  ];

  const slugify = (name) =>
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const visibleCategories = categories.slice(0, 8);
  const hiddenCategories = categories.slice(8);

  // Add category alias mapping for Shop by Category
  const categoryAliasMap = {
    'shoe': 'Footwear',
    'shoes': 'Footwear',
    'fashion': 'Clothing',
    'clothing': 'Clothing',
    'phone': 'Computers & Laptops',
    'phones': 'Computers & Laptops',
    'laptop': 'Computers & Laptops',
    'laptops': 'Computers & Laptops',
    'gaming': 'Game & Console',
    'game': 'Game & Console',
    'console': 'Game & Console',
    // Add more aliases as needed
  };

  // Add category path mapping for Shop by Category (use actual category names as keys)
  const categoryPathMap = {
    'Footwear': 'footwear',
    'Clothing': 'clothing',
    'Computers & Laptops': 'computers-laptops',
    'Game & Console': 'game-console',
    // Add more as needed
  };

  // Helper to get mapped category
  const getCategoryLink = (category) => {
    const key = category.trim().toLowerCase();
    return categoryAliasMap[key] || category;
  };

  // Helper to get mapped category path
  const getCategoryPath = (category) => {
    return `/category/${categoryPathMap[category] || slugify(category)}`;
  };

  const showBackButton = location.pathname !== '/';

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
          console.error('Error fetching notifications:', err);
          toast.error('Failed to load notifications');
        }
      };
      fetchNotifications();
    }
  }, [user]);

  useEffect(() => {
    const loadFavorites = () => {
      try {
        const storedFavorites = localStorage.getItem('favorites');
        if (storedFavorites) {
          setFavorites(JSON.parse(storedFavorites));
        } else {
          setFavorites([]);
        }
      } catch (err) {
        console.error('Error loading favorites:', err);
        toast.error('Failed to sync favorites');
      }
    };

    loadFavorites();

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
        loadFavorites();
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
      const q = query(collection(db, 'products'), where('status', '==', 'approved'));
      const querySnapshot = await getDocs(q);
      const filtered = querySnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((product) => product.name.toLowerCase().includes(queryText.toLowerCase()));
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

  const handleFocus = () => {
    if (searchQuery.trim() !== '' && searchResults.length > 0) {
      setShowDropdown(true);
    }
  };

  const handleBlur = () => {
    setTimeout(() => setShowDropdown(false), 200);
  };

  const toggleMoreDropdown = () => {
    setMoreDropdownOpen(!moreDropdownOpen);
  };

  const toggleCategoryMore = () => {
    setCategoryMoreOpen(!categoryMoreOpen);
  };

  const toggleMobileCategoryMore = () => {
    setMobileCategoryMoreOpen(!mobileCategoryMoreOpen);
  };

  const handleMoreDropdownBlur = () => {
    setTimeout(() => setMoreDropdownOpen(false), 200);
  };

  const handleCategoryMoreBlur = () => {
    setTimeout(() => setCategoryMoreOpen(false), 200);
  };

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <header className="w-full">
      {/* Desktop Header */}
      <div className="bg-[#112639] hidden sm:flex text-white w-full py-0 h-9.5 items-center">
       
        <div className="flex w-full h-full items-center justify-between"> {/* Removed max-w-7xl, mx-auto, and px-4 */}

          {/* Left Group: Logo and nav links - add px-4 directly here if you want internal padding */}
          <div className="flex items-center h-full pl-4"> {/* Added pl-4 for internal padding here */}
            <Link to="/">
              <img
                src={logo}
                className="h-12 w-auto"
                alt="Foremade"
              />
            </Link>
            <nav className="flex items-center ml-2 mt-1">
              <Link to="/products" className="hover:text-gray-100 hover:underline transition-all px-2">
                Shop
              </Link>
              <Link to="/products-upload" className="hover:text-gray-100 hover:underline transition-all px-2">
                Sell
              </Link>
              <Link to="/smile" className="hover:text-gray-100 hover:underline transition-all px-2">
                Smile
              </Link>
            </nav>
          </div>

          {/* Right Group: User Actions - add px-4 directly here for internal padding */}
          <div className="flex items-center gap-4 pr-4"> {/* Added pr-4 for internal padding here */}
            {user ? (
              <Link to="/profile" className="hover:text-gray-300 text-sm whitespace-nowrap">
                Hi, {getDisplayName()}
              </Link>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="hover:text-gray-300 text-sm whitespace-nowrap">
                  Login
                </Link>
                <span className="text-gray-300">|</span>
                <Link to="/register" className="hover:text-gray-300 text-sm whitespace-nowrap">
                  Sign Up
                </Link>
              </div>
            )}
            <Link to="/notifications" className="relative flex items-center justify-center">
              <i className="bx bx-bell text-xl"></i>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Link>
            <Link to="/cart" className="relative flex items-center justify-center">
              <i className="bx bx-cart-alt text-xl text-white"></i>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <Link to="/search" className="lg:hidden">
              <i className="bx bx-search text-xl"></i>
            </Link>
          </div>
          
        </div>
        
      </div>
      <div className="hidden sm:block bg-[#eb9325] h-2 w-full"></div>
      {/* Mobile Header */}
      <div className="sm:hidden bg-[#112639] text-white py-3 w-full flex items-center fixed top-0 left-0 right-0 z-40 overflow-x-hidden"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        {/* Left: Logo */}
        <div className="flex items-center min-w-0">
          <Link to="/">
            <img src={logo} className="h-9" alt="Foremade" />
          </Link>
        </div>
        {/* Center: Filler */}
        <div className="flex-1 min-w-0"></div>
        {/* Right: Icons */}
        <div className="flex items-center justify-end flex-1 min-w-0">
          <Link to="/cart" className="relative flex items-center justify-center">
            <i className="bx bx-cart-alt text-xl text-white"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button onClick={() => setSidebarOpen(true)} className="ml-4 mr-4 flex items-center justify-center focus:outline-none">
            <i className="bx bx-menu text-2xl"></i>
          </button>
        </div>
      </div>

      {/* SPACER FOR FIXED HEADER */}
      <div 
        className="sm:hidden" 
        style={{ 
          height: `calc(${mobileHeaderHeight} + env(safe-area-inset-top))`,
          minHeight: '3rem' // Fallback
        }} 
      />

      {/* Mobile Content - MOVED BELOW SPACER */}
      <div className="block sm:hidden">
        <div className="block sm:hidden bg-[#eb9325] h-2 w-full -mt-16 mb-14"></div>
        <FreeShipping />
      </div>
      <div className="block sm:hidden px-2 mt-2">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search for electronics, accessories..."
            className="w-full p-2 pl-8 border border-gray-400 rounded-md text-black placeholder-gray-600 focus:outline-none text-xs"
            value={searchQuery}
            onChange={handleSearch}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
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
                      className="w-8 h-8 object-cover rounded mr-2 flex-shrink-0"
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/40?text=Image+Not+Found';
                      }}
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
        <div className="flex overflow-x-auto gap-2 text-xs text-gray-700 py-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
          {categories.map((category) => (
            <Link
              key={category}
              to={getCategoryPath(category)}
              className="hover:text-blue-600 bg-gray-100 rounded-full px-3 py-1 whitespace-nowrap flex-shrink-0"
            >
              {category}
            </Link>
          ))}
        </div>
       
      </div>

      {/* Desktop Free Shipping */}
      <div className="hidden sm:block">
        <FreeShipping />
      </div>

      {/* Desktop Search & Categories */}
      <div className="hidden sm:block">
        <div className="container mx-auto px-2 sm:px-4 py-1 sm:py-4">
          <div className="flex flex-col items-center">
            <div className="relative w-full">
              <input
                type="text"
                placeholder="Search Foremade"
                className="placeholder-slate-400 w-full p-2 pl-8 border border-gray-400 rounded-md text-black focus:outline-none text-xs sm:text-base"
                value={searchQuery}
                onChange={handleSearch}
                onFocus={handleFocus}
                onBlur={handleBlur}
              />
              <i className="bx bx-search absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-600 text-sm sm:text-base"></i>
              {showDropdown && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-80 overflow-y-auto">
                  {loading ? (
                    <div className="p-2 text-xs sm:text-base text-gray-600">Loading...</div>
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
                          className="w-8 sm:w-10 h-8 sm:h-10 object-cover rounded mr-2"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/40?text=Image+Not+Found';
                          }}
                        />
                        <span className="text-xs sm:text-base text-gray-800">{product.name}</span>
                      </Link>
                    ))
                  ) : (
                    <div className="p-2 text-xs sm:text-base text-gray-600">No results found</div>
                  )}
                </div>
              )}
            </div>
            {/* Fixed Categories Section */}
            <div className="w-full mt-2 sm:mt-4">
              <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700 flex-wrap">
                {visibleCategories.map((category) => (
                  <Link
                    key={category}
                    to={`/category/${slugify(category)}`}
                    className="hover:text-blue-600 whitespace-nowrap"
                  >
                    {category}
                  </Link>
                ))}
                {/* Categories "More" dropdown - only show if there are more than 8 categories */}
                {categories.length > 8 && (
                  <div className="relative" onMouseLeave={handleCategoryMoreBlur}>
                    <button
                      onClick={toggleCategoryMore}
                      className="hover:text-blue-600 focus:outline-none whitespace-nowrap"
                    >
                      More <i className="bx bx-chevron-down"></i>
                    </button>
                    {categoryMoreOpen && (
                      <div className="absolute top-full left-1/2 -translate-x-[60%] mt-1 w-72 bg-white border border-gray-200 rounded-md shadow-lg z-[9999] max-h-80 overflow-y-auto">
                        {hiddenCategories.map((category) => (
                          <Link
                            key={category}
                            to={`/category/${slugify(category)}`}
                            className="block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
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
      </div>

      {/* Back Button Below Categories/Search - always visible on all screens */}
      {showBackButton && (
        <div className="w-full flex justify-start mt-2 px-2 sm:px-4">
          <button
            onClick={() => {
              if (window.history.length > 2) {
                navigate(-1);
              } else {
                navigate('/');
              }
            }}
            className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-200 text-blue-700 text-sm font-medium focus:outline-none"
            aria-label="Go back"
          >
            <i className="bx bx-arrow-back text-xl"></i>
            <span className="sm:inline">Return</span>
          </button>
        </div>
      )}

      {/* Bottom Navigation - Mobile Only */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 z-40">
        <Link
          to="/"
          className={`flex flex-col items-center ${location.pathname === '/' ? 'text-blue-600' : 'text-gray-600'} hover:text-amber-500`}
        >
          <i className="bx bx-home-alt text-2xl"></i>
          <span className="text-xs">Home</span>
        </Link>
        <Link
          to="/search"
          className={`flex flex-col items-center ${location.pathname === '/search' ? 'text-blue-600' : 'text-gray-600'} hover:text-amber-500`}
        >
          <i className="bx bx-search text-2xl"></i>
          <span className="text-xs">Search</span>
        </Link>
        <Link
          to="/products-upload"
          className={`flex flex-col items-center ${location.pathname === '/products-upload' ? 'text-blue-600' : 'text-orange-500'} hover:text-amber-500`}
        >
          <i className="bx bxs-plus-circle text-2xl"></i>
          <span className="text-xs">Sell</span>
        </Link>
        <Link
          to="/notifications"
          className={`flex flex-col items-center relative ${location.pathname === '/notifications' ? 'text-blue-600' : 'text-gray-600'} hover:text-amber-500`}
        >
          <i className="bx bx-bell text-2xl"></i>
          {notificationCount > 0 && (
            <span className="absolute top-0 right-2 bg-red-600 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {notificationCount}
            </span>
          )}
          <span className="text-xs">Inbox</span>
        </Link>
        <Link
          to="/profile"
          className={`flex flex-col items-center ${location.pathname === '/profile' ? 'text-blue-600' : 'text-gray-600'} hover:text-amber-500`}
        >
          <i className="bx bx-user text-2xl"></i>
          <span className="text-xs">You</span>
        </Link>
      </nav>

      {/* Mobile Sidebar */}
      <div className="sm:hidden">
        <div
          className="fixed top-0 left-0 h-full bg-[#f8d7b0] w-full transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto max-h-screen"
          style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <div className="p-4">
            <button onClick={() => setSidebarOpen(false)} className="mb-4">
              <i className="bx bx-x text-2xl text-[#112040]"></i>
            </button>
            <div className="flex flex-col space-y-3">
              {/* Add main navigation links for all users */}
              <div className="flex justify-center gap-2 w-full mb-4">
                <Link
                  to="/products"
                  className="bg-white/80 text-[#112040] hover:text-amber-500 text-base py-3 px-4 rounded-lg border border-[#112040]/20 font-semibold shadow-sm hover:bg-white transition-all"
                  onClick={() => setSidebarOpen(false)}
                >
                  Shop
                </Link>
                <Link
                  to="/products-upload"
                  className="bg-white/80 text-[#112040] hover:text-amber-500 text-base py-3 px-4 rounded-lg border border-[#112040]/20 font-semibold shadow-sm hover:bg-white transition-all"
                  onClick={() => setSidebarOpen(false)}
                >
                  Sell
                </Link>
                <Link
                  to="/smile"
                  className="bg-white/80 text-[#112040] hover:text-amber-500 text-base py-3 px-4 rounded-lg border border-[#112040]/20 font-semibold shadow-sm hover:bg-white transition-all"
                  onClick={() => setSidebarOpen(false)}
                >
                  Smile
                </Link>
              </div>
              {/* Auth/Profile section */}
              {!user && (
                <div className="flex items-center justify-center mt-6 bg-[#112040] text-white px-4 py-3 rounded-lg text-sm hover:bg-[#112040]/80">
                  <Link to="/login" className="mx-2" onClick={() => setSidebarOpen(false)}>
                    Log in
                  </Link>
                  <span className="mx-1">|</span>
                  <Link to="/register" className="mx-2" onClick={() => setSidebarOpen(false)}>
                    Sign up
                  </Link>
                </div>
              )}
              {user && (
                <Link
                  to="/profile"
                  className="mt-6 bg-[#112040] text-white px-4 py-3 rounded-lg text-sm hover:bg-[#112040]/80 text-center"
                  onClick={() => setSidebarOpen(false)}
                >
                  My Profile
                </Link>
              )}
              {/* Categories */}
              <div className="space-y-1">
                {categories.slice(0, 8).map((category) => (
                  <Link
                    key={category}
                    to={`/category/${slugify(category)}`}
                    className="text-[#112040] hover:text-amber-500 text-sm py-2 border-b border-[#112040]/10 block"
                    onClick={() => setSidebarOpen(false)}
                  >
                    {category}
                  </Link>
                ))}
                {/* Categories "More" dropdown for mobile sidebar */}
                <div className="relative">
                  <button
                    onClick={toggleMobileCategoryMore}
                    className="text-[#112040] hover:text-amber-500 text-sm py-2 border-b border-[#112040]/10 w-full text-left flex items-center justify-between"
                  >
                    More <i className="bx bx-chevron-down"></i>
                  </button>
                  {mobileCategoryMoreOpen && (
                    <div className="mt-2 space-y-1 z-100">
                      {console.log('Mobile More Dropdown Open:', mobileCategoryMoreOpen, 'Categories:', categories.slice(8))}
                      {categories.slice(8).map((category) => (
                        <Link
                          key={category}
                          to={`/category/${slugify(category)}`}
                          className="text-[#112040] hover:text-amber-500 text-sm py-2 pl-4 border-b border-[#112040]/10 block"
                          onClick={() => {
                            setSidebarOpen(false);
                            setMobileCategoryMoreOpen(false);
                          }}
                        >
                          {category}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </div>
    </header>
  );
};

export default Header;