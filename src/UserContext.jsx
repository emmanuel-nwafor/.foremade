import { createContext, useState, useEffect } from 'react';

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [cart, setCart] = useState([]); // Array of { productId, quantity }
  const [favorites, setFavorites] = useState([]); // Array of product IDs
  const [watchlist, setWatchlist] = useState([]); // Array of product IDs
  const [orders, setOrders] = useState([]); // Array of past orders

  // Persist state to localStorage to maintain across page refreshes
  useEffect(() => {
    const storedCart = localStorage.getItem('cart');
    const storedFavorites = localStorage.getItem('favorites');
    const storedWatchlist = localStorage.getItem('watchlist');
    const storedOrders = localStorage.getItem('orders');
    
    if (storedCart) setCart(JSON.parse(storedCart));
    if (storedFavorites) setFavorites(JSON.parse(storedFavorites));
    if (storedWatchlist) setWatchlist(JSON.parse(storedWatchlist));
    if (storedOrders) setOrders(JSON.parse(storedOrders));
  }, []);

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
    localStorage.setItem('favorites', JSON.stringify(favorites));
    localStorage.setItem('watchlist', JSON.stringify(watchlist));
    localStorage.setItem('orders', JSON.stringify(orders));
  }, [cart, favorites, watchlist, orders]);

  const addToCart = (productId, quantity = 1) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === productId);
      if (existingItem) {
        return prevCart.map((item) =>
          item.productId === productId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prevCart, { productId, quantity }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  };

  const updateCartQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
    } else {
      setCart((prevCart) =>
        prevCart.map((item) =>
          item.productId === productId ? { ...item, quantity } : item
        )
      );
    }
  };

  const addToFavorites = (productId) => {
    setFavorites((prevFavorites) => {
      if (prevFavorites.includes(productId)) return prevFavorites;
      return [...prevFavorites, productId];
    });
  };

  const removeFromFavorites = (productId) => {
    setFavorites((prevFavorites) => prevFavorites.filter((id) => id !== productId));
  };

  const addToWatchlist = (productId) => {
    setWatchlist((prevWatchlist) => {
      if (prevWatchlist.includes(productId)) return prevWatchlist;
      return [...prevWatchlist, productId];
    });
  };

  const removeFromWatchlist = (productId) => {
    setWatchlist((prevWatchlist) => prevWatchlist.filter((id) => id !== productId));
  };

  const addOrder = (order) => {
    setOrders((prevOrders) => [...prevOrders, order]);
    setCart([]); // Clear cart after placing an order
  };

  return (
    <UserContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateCartQuantity,
        favorites,
        addToFavorites,
        removeFromFavorites,
        watchlist,
        addToWatchlist,
        removeFromWatchlist,
        orders,
        addOrder,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};