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
  const [favorites, setFavorites] = useState([]); // Fixed: Corrected setFavorites
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [notificationCount, setNotificationCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [categoriesDropdownOpen, setCategoriesDropdownOpen] = useState(false);

  const categories = [
    'Tablet & Phones',
    'Health & Beauty',
    'Electronics',
    'Baby Products',
    'Computers & Accessories',
    'Games & Fun',
    'Drinks & Categories',
    'Home & Kitchen',
    'Smart Watches',
  ];

  const visibleCategories = categories.slice(0, 4);
  const dropdownCategories = categories.slice(4);

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
          setFavorites([]); // Clear favorites when logged out
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

  console.log(favorites)

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
  }, [user, setFavorites]);

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

  const handleMoreDropdownBlur = () => {
    setTimeout(() => setMoreDropdownOpen(false), 200);
  };

  const toggleCategoriesDropdown = () => {
    setCategoriesDropdownOpen(!categoriesDropdownOpen);
  };

  const handleCategoriesDropdownBlur = () => {
    setTimeout(() => setCategoriesDropdownOpen(false), 200);
  };

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <header className="">
      <div className="bg-[#112D4E] hidden sm:flex text-white py-1 sm:py-2 justify-between items-center px-2 sm:px-4">
        <div className='flex justify-between items-center'>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Link to="/">
              <img
                src={logo}
                className="h-10 sm:h-[52px] sm:w-auto md:w-auto lg:w-auto xl:w-auto"
                alt="Foremade"
              />
            </Link>
          </div>

          <div className="flex ml-5 items-center space-x-4 mt-2">
            <Link to="/products" className="hover:text-gray-100 hover:underline transition-all">Shop</Link>
            <Link to="/dashboard" className="m-2 hover:text-gray-100 hover:underline transition-all">Sell</Link>
            <Link to="/smile" className="m-2 hover:text-gray-100 hover:underline transition-all">Smile</Link>
            <div className="relative group">
              <button
                onClick={toggleMoreDropdown}
                onBlur={handleMoreDropdownBlur}
                className="hover:text-gray-300 text-xs sm:text-sm focus:outline-none"
              >
                More <i className="bx bx-chevron-down"></i>
              </button>
              {moreDropdownOpen && (
                <div className="absolute hidden group-hover:block top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                  <Link
                    to="/daily-deals"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
                    onClick={() => setMoreDropdownOpen(false)}
                  >
                    Daily Deals
                  </Link>
                  <Link
                    to="/brand-outlet"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
                    onClick={() => setMoreDropdownOpen(false)}
                  >
                    Brand Outlet
                  </Link>
                  <Link
                    to="/gift-cards"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
                    onClick={() => setMoreDropdownOpen(false)}
                  >
                    Gift Cards
                  </Link>
                  <Link
                    to="/help-contact"
                    className="block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
                    onClick={() => setMoreDropdownOpen(false)}
                  >
                    Help & Contact
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-4">
          {user ? (
            <Link to="/profile" className="hover:text-gray-300 text-xs sm:text-sm">
              Hi, {getDisplayName()}
            </Link>
          ) : (
            <div className='flex items-center'>
              <Link to="/login" className="m-2 hover:text-gray-300 text-xs sm:text-sm">
                Login
              </Link>
              |
              <Link to="/register" className="m-2 hover:text-gray-300 text-xs sm:text-sm">
                Sign Up
              </Link>
            </div>
          )}
          <Link to="/notifications" className="relative">
            <i className="bx bx-bell text-lg sm:text-xl"></i>
            {notificationCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] sm:text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {notificationCount}
              </span>
            )}
          </Link>
          <Link to="/cart" className="relative">
            <i className="bx bx-cart-alt text-[22px] sm:text-xl text-white"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] sm:text-xs rounded-full h-4 w-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div className="sm:hidden bg-[#112D4E] text-white py-3 px-4 flex justify-between items-center fixed top-0 left-0 right-0 z-40">
        <Link to="/">
          <img src={logo} className="h-10" alt="Foremade" />
        </Link>
        <div className="flex items-center space-x-4">
          <Link to="/cart" className="relative">
            <i className="bx bx-cart-alt text-[22px] text-white"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] rounded-full h-4 w-4 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>
          <button onClick={() => setSidebarOpen(true)} className="focus:outline-none">
            <i className="bx bx-menu text-2xl"></i>
          </button>
        </div>
      </div>

      <div className="block sm:hidden pt-16">
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
          <i className="bx bx-search absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-600 text-sm"></i>
          {showDropdown && (
            <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-md shadow-lg z-10 max-h-80 overflow-y-auto">
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
                      className="w-8 h-8 object-cover rounded mr-2"
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
        <div className="flex overflow-x-auto scrollbar-hide gap-2 text-[10px] text-gray-700 py-2">
          {categories.map((category) => (
            <Link
              key={category}
              to={`/${category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
              className="hover:text-blue-600 bg-gray-100 rounded-full px-3 py-1 whitespace-nowrap"
            >
              {category}
            </Link>
          ))}
        </div>
      </div>

      <div className="hidden sm:block">
        <FreeShipping />
      </div>

      <div className="container mx-auto px-2 sm:px-4 py-1 sm:py-4">
        <div className="flex flex-col items-center">
          <div className="relative w-full hidden sm:block">
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
          <div className="hidden sm:flex justify-center gap-1 sm:gap-2 mt-2 sm:mt-4 text-xs sm:text-sm text-gray-700">
            <div className="flex items-center gap-1 sm:gap-2">
              {categories.map((category, index) => (
                <div key={category}>
                  <Link
                    to={`/${category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                    className="hover:text-blue-600 whitespace-nowrap px-2 py-1 xl:block hidden"
                  >
                    {category}
                  </Link>
                  {index < visibleCategories.length ? (
                    <Link
                      to={`/${category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                      className="hover:text-blue-600 whitespace-nowrap px-2 py-1 hidden xl:hidden sm:block"
                    >
                      {category}
                    </Link>
                  ) : null}
                </div>
              ))}
              <div className="relative group hidden xl:hidden sm:block">
                <button
                  onClick={toggleCategoriesDropdown}
                  onBlur={handleCategoriesDropdownBlur}
                  className="hover:text-blue-600 flex items-center px-2 py-1"
                >
                  More <i className="bx bx-chevron-down ml-1"></i>
                </button>
                {categoriesDropdownOpen && (
                  <div className="absolute hidden group-hover:block top-full left-0 mt-1 w-40 bg-white border border-gray-200 rounded-md shadow-lg z-10">
                    {dropdownCategories.map((category) => (
                      <Link
                        key={category}
                        to={`/${category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                        className="block px-4 py-2 text-gray-800 hover:bg-gray-100 text-sm"
                        onClick={() => setCategoriesDropdownOpen(false)}
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

      <nav className="sm:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center py-2 z-40">
        <Link
          to="/"
          className={`flex flex-col items-center ${location.pathname === '/' ? 'text-gray-600' : 'text-gray-600'} hover:text-amber-500`}
        >
          <i className="bx bx-home-alt text-2xl"></i>
          <span className="text-sm">Home</span>
        </Link>
        <Link
          to="/search"
          className={`flex flex-col items-center ${location.pathname === '/search' ? 'text-blue-600' : 'text-gray-600'} hover:text-amber-500`}
        >
          <i className="bx bx-search text-2xl"></i>
          <span className="text-sm">Search</span>
        </Link>
        <Link
          to="/products-upload"
          className={`flex flex-col items-center ${location.pathname === '/sellers-guide' ? 'text-blue-600' : 'text-gray-600'} hover:text-amber-500`}
        >
          <i className="bx bxs-plus-circle text-2xl"></i>
          <span className="text-sm">Sell</span>
        </Link>
        <Link
          to="/notifications"
          className={`flex flex-col items-center relative ${location.pathname === '/notifications' ? 'text-blue-600' : 'text-gray-600'} hover:text-amber-500`}
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
          className={`flex flex-col items-center ${location.pathname === '/profile' ? 'text-blue-600' : 'text-gray-600'} hover:text-amber-500`}
        >
          <i className="bx bx-user text-2xl"></i>
          <span className="text-sm">You</span>
        </Link>
      </nav>

      <div className="sm:hidden mb-3">
        <div
          className="fixed top-0 left-0 h-full bg-[#f8d7b0] w-full transform transition-transform duration-300 ease-in-out z-50"
          style={{ transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)' }}
        >
          <div className="p-4">
            <button onClick={() => setSidebarOpen(false)} className="mb-4">
              <i className="bx bx-x text-2xl text-[#112040]"></i>
            </button>
            <div className="flex flex-col space-y-2">
              {categories.map((category) => (
                <Link
                  key={category}
                  to={`/${category.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-')}`}
                  className="text-[#112040] hover:text-amber-500 text-sm"
                  onClick={() => setSidebarOpen(false)}
                >
                  {category}
                </Link>
              ))}
              {!user && (
                <div className="flex justify-center items-center mt-4 bg-[#112040] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#112040]/80">
                  <Link to="/login" className="" onClick={() => setSidebarOpen(false)}>
                    Log in
                  </Link>
                  |
                  <Link to="/register" className="" onClick={() => setSidebarOpen(false)}>
                    Sign up
                  </Link>
                </div>
              )}
              {user && (
                <Link
                  to="/profile"
                  className="mt-4 bg-[#112040] text-white px-4 py-2 rounded-lg text-sm hover:bg-[#112040]/80"
                  onClick={() => setSidebarOpen(false)}
                >
                  Hi, {getDisplayName()}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;