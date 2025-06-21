import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getCartItemCount } from '/src/utils/cartUtils';
import { toast } from 'react-toastify';
import logo from '/src/assets/logi.png';
import FreeShipping from '../home/FreeShipping';

const Header = () => {
  const location = useLocation();
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
  
  // State for the main navigation "More" dropdown
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  
  // A SEPARATE state for the categories "More" dropdown
  const [categoryMoreOpen, setCategoryMoreOpen] = useState(false);

  const categories = [
    "Camera & Photography",
    "Television & Accessories",
    "Drinks & Beverages",
    "Game & Console",
    "Home & Living",
    "Perfumes & Fragrances",
    "Vehicles & Transport",
    "Clothing",
    "Coffee & Tea",
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

  const visibleCategories = categories.slice(0, 4);

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
  
  // Handler for the main navigation "More"
  const toggleMoreDropdown = () => {
    setMoreDropdownOpen(!moreDropdownOpen);
  };
  
  // A SEPARATE handler for the categories "More"
  const toggleCategoryMore = () => {
    setCategoryMoreOpen(!categoryMoreOpen);
  };

  const handleMoreDropdownBlur = () => {
    setTimeout(() => setMoreDropdownOpen(false), 200);
  };

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <header className="w-full">
      {/* Desktop Header */}
      <div className="bg-[#112D4E] hidden sm:flex text-white py-2 px-4">
        <div className="flex justify-between items-center w-full max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link to="/">
              <img
                src={logo}
                className="h-10 md:h-12 w-auto"
                alt="Foremade"
              />
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden lg:flex items-center space-x-6 flex-1 justify-center">
            <Link to="/products" className="hover:text-gray-100 hover:underline transition-all whitespace-nowrap text-sm">
              Shop
            </Link>
            <Link to="/products-upload" className="hover:text-gray-100 hover:underline transition-all whitespace-nowrap text-sm">
              Sell
            </Link>
            <Link to="/smile" className="hover:text-gray-100 hover:underline transition-all whitespace-nowrap text-sm">
              Smile
            </Link>
            <div className="relative">
              <button
                onClick={toggleMoreDropdown}
                className="hover:text-gray-300 text-sm focus:outline-none whitespace-nowrap"
              >
                More <i className="bx bx-chevron-down"></i>
              </button>
              {moreDropdownOpen && (
                <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                  <Link
                    to="/daily-deals"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm whitespace-nowrap"
                    onClick={() => setMoreDropdownOpen(false)}
                  >
                    Daily Deals
                  </Link>
                  <Link
                    to="/brand-outlet"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm whitespace-nowrap"
                    onClick={() => setMoreDropdownOpen(false)}
                  >
                    Brand Outlet
                  </Link>
                  <Link
                    to="/gift-cards"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm whitespace-nowrap"
                    onClick={() => setMoreDropdownOpen(false)}
                  >
                    Gift Cards
                  </Link>
                  <Link
                    to="/help-contact"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm whitespace-nowrap"
                    onClick={() => setMoreDropdownOpen(false)}
                  >
                    Help & Contact
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* User Actions */}
          <div className="flex items-center space-x-3 flex-shrink-0">
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
            <Link to="/notifications" className="relative">
              <i className="bx bx-bell text-xl"></i>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </Link>
            <Link to="/search" className="lg:hidden">
              <i className="bx bx-search text-xl"></i>
            </Link>
            <Link to="/cart" className="relative">
              <i className="bx bx-cart-alt text-xl text-white"></i>
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Header */}
      <div className="sm:hidden bg-[#112D4E] text-white py-3 px-4 flex justify-between items-center fixed top-0 left-0 right-0 z-40">
        <Link to="/" className="flex-shrink-0">
          <img src={logo} className="h-10 w-auto" alt="Foremade" />
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/cart" className="relative">
            <i className="bx bx-cart-alt text-xl text-white"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button onClick={() => setSidebarOpen(true)} className="focus:outline-none">
            <i className="bx bx-menu text-2xl"></i>
          </button>
        </div>
      </div>

      {/* Mobile Content */}
      <div className="block sm:hidden pt-16">
        <FreeShipping />
      </div>

      {/* Mobile Search */}
      <div className="block sm:hidden px-4 mt-2">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search for electronics, accessories..."
            className="w-full p-2 pl-8 border border-gray-400 rounded-md text-black placeholder-gray-600 focus:outline-none text-sm"
            value={searchQuery}
            onChange={handleSearch}
            onFocus={handleFocus}
            onBlur={handleBlur}
          />
          <i className="bx bx-search absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-600"></i>
          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-50 max-h-80 overflow-y-auto">
              {loading ? (
                <div className="p-2 text-sm text-gray-600">Loading...</div>
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
                    <span className="text-sm text-gray-800 truncate">{product.name}</span>
                  </Link>
                ))
              ) : (
                <div className="p-2 text-sm text-gray-600">No results found</div>
              )}
            </div>
          )}
        </div>

        {/* Mobile Categories */}
        <div className="flex overflow-x-auto gap-2 text-xs text-gray-700 py-2 scrollbar-hide">
          {categories.map((category) => (
            <Link
              key={category}
              to={`/category/${slugify(category)}`}
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
            <div className="w-full mt-2 sm:mt-4 overflow-hidden">
              <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700 flex-wrap">
                
                {/* Display first 8 categories on all screen sizes */}
                {categories.slice(0, 8).map((category) => (
                  <Link
                    key={category}
                    to={`/category/${slugify(category)}`}
                    className="hover:text-blue-600 whitespace-nowrap"
                  >
                    {category}
                  </Link>
                ))}

                {/* Categories "More" dropdown */}
                <div className="relative">
                  <button
                    onClick={toggleCategoryMore}
                    className="hover:text-blue-600 focus:outline-none whitespace-nowrap"
                  >
                    More <i className="bx bx-chevron-down"></i>
                  </button>
                  {categoryMoreOpen && (
                    <div className="absolute top-full left-0 mt-1 w-60 bg-white border border-gray-200 rounded-md shadow-lg z-50">
                      <Link
                        to="/hair-nails-accessories"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
                        onClick={() => setCategoryMoreOpen(false)}
                      >
                        Hair Nails & Accessories
                      </Link>
                      <Link
                        to="/home-living"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
                        onClick={() => setCategoryMoreOpen(false)}
                      >
                        Home & Living
                      </Link>
                      <Link
                        to="/jewellery-accessories"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
                        onClick={() => setCategoryMoreOpen(false)}
                      >
                        Jewellery & Accessories
                      </Link>
                      <Link
                        to="/perfumes-fragrances"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
                        onClick={() => setCategoryMoreOpen(false)}
                      >
                        Perfumes & Fragrances
                      </Link>
                      <Link
                        to="/sneakers-joggers"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
                        onClick={() => setCategoryMoreOpen(false)}
                      >
                        Sneakers & Joggers
                      </Link>
                      <Link
                        to="/health-wellness"
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
                        onClick={() => setCategoryMoreOpen(false)}
                      >
                        Health & Wellness
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

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
          className={`flex flex-col items-center ${location.pathname === '/products-upload' ? 'text-blue-600' : 'text-gray-600'} hover:text-amber-500`}
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
          className="fixed top-0 left-0 h-full bg-[#f8d7b0] w-80 transform transition-transform duration-300 ease-in-out z-50 overflow-y-auto"
          style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <div className="p-4">
            <button onClick={() => setSidebarOpen(false)} className="mb-4">
              <i className="bx bx-x text-2xl text-[#112040]"></i>
            </button>
            <div className="flex flex-col space-y-3">
              {categories.map((category) => (
                <Link
                  key={category}
                  to={`/category/${slugify(category)}`}
                  className="text-[#112040] hover:text-amber-500 text-sm py-2 border-b border-[#112040]/10"
                  onClick={() => setSidebarOpen(false)}
                >
                  {category}
                </Link>
              ))}
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