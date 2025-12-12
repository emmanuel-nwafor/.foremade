import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Spinner from '/src/components/common/Spinner';
import emptyCart from '/src/assets/icons/empty-cart.svg';
import placeholder from '/src/assets/placeholder.png';
import PriceFormatter from '/src/components/layout/PriceFormatter';
import {
  getCart,
  updateCart,
  clearCart,
  checkout,
  mergeGuestCart,
  addToCart,
} from '/src/utils/cartUtils';
import CartItem from '/src/components/cart/CartItem';
import CartSummary from '/src/components/cart/CartSummary';

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scrollY, setScrollY] = useState(0);
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      try {
        if (cartItems.length === 0) {
          setRecommendedProducts([]);
          return;
        }

        // Get unique categories from cart items
        const categories = [...new Set(cartItems.map((item) => item.product.category).filter(Boolean))];
        if (categories.length === 0) {
          setRecommendedProducts([]);
          return;
        }

        // Fetch up to 4 products from the same categories, excluding cart items
        const productIdsInCart = cartItems.map((item) => item.productId);
        const products = [];
        for (const category of categories) {
          const q = query(
            collection(db, 'products'),
            where('category', '==', category),
            limit(4 - products.length) // Limit to fill up to 4 total
          );
          const querySnapshot = await getDocs(q);
          querySnapshot.forEach((doc) => {
            const productData = doc.data();
            if (!productIdsInCart.includes(doc.id)) {
              const imageUrl = Array.isArray(productData.imageUrls) && productData.imageUrls[0] && typeof productData.imageUrls[0] === 'string' && productData.imageUrls[0].startsWith('https://')
                ? productData.imageUrls[0]
                : productData.imageUrl && typeof productData.imageUrl === 'string' && productData.imageUrl.startsWith('https://')
                ? productData.imageUrl
                : placeholder;
              products.push({
                id: doc.id,
                name: productData.name || 'Unnamed Product',
                price: Number(productData.price) || 0,
                imageUrl,
                stock: Number(productData.stock) || 0,
              });
            }
          });
          if (products.length >= 4) break; // Stop if we have enough products
        }

        setRecommendedProducts(products.slice(0, 4)); // Ensure max 4 products
      } catch (err) {
        console.error('Error fetching recommended products:', err);
        setRecommendedProducts([]);
      }
    };

    fetchRecommendedProducts();
  }, [cartItems]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);
      try {
        setLoading(true);
        setError(null);
        let items = [];
        if (currentUser) {
          await mergeGuestCart(currentUser.uid);
          items = await getCart(currentUser.uid);
        } else {
          items = await getCart();
        }
        console.log('Raw cart items from getCart:', items);
        // Normalize cart items
        const normalizedItems = items
          .map((item) => {
            if (!item.product) {
              console.warn('Cart item missing product data:', { productId: item.productId, quantity: item.quantity });
              return null;
            }
            const { product } = item;
            let imageUrl = product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('https://')
              ? product.imageUrl
              : Array.isArray(product.imageUrls) && product.imageUrls[0] && typeof product.imageUrls[0] === 'string' && product.imageUrls[0].startsWith('https://')
              ? product.imageUrls[0]
              : placeholder;
            return {
              ...item,
              product: {
                id: product.id || item.productId,
                name: product.name || 'Unnamed Product',
                price: Number(product.price) || 0,
                stock: Number(product.stock) || 0,
                category: product.category || 'uncategorized',
                imageUrl,
                rating: product.rating || Math.random() * 2 + 3,
                colors: product.colors || [],
                sizes: product.sizes || [],
                condition: product.condition || 'New',
                sellerId: product.sellerId || '',
              },
            };
          })
          .filter((item) => {
            if (!item) {
              console.warn('Filtered out invalid cart item');
              return false;
            }
            const isValidImage = item.product.imageUrl && typeof item.product.imageUrl === 'string' && (item.product.imageUrl.startsWith('https://') || item.product.imageUrl === placeholder);
            if (!isValidImage) {
              console.warn('Filtered out cart item with invalid imageUrl:', {
                productId: item.productId,
                name: item.product.name,
                imageUrl: item.product.imageUrl,
              });
              return false;
            }
            return true;
          });

        console.log('Normalized cart items:', normalizedItems);
        setCartItems(normalizedItems);
        if (normalizedItems.length === 0) {
          setError('Your cart is empty.');
        }
      } catch (err) {
        console.error('Error loading cart:', { message: err.message, code: err.code });
        setError('Failed to load cart. Please try again.');
        setCartItems([]);
        toast.error('Failed to load cart');
      } finally {
        setLoading(false);
      }
    });

    const handleCartUpdate = async () => {
      try {
        const items = await getCart(user?.uid);
        console.log('Raw cart items from handleCartUpdate:', items);
        const normalizedItems = items
          .map((item) => {
            if (!item.product) {
              console.warn('Cart item missing product data:', { productId: item.productId, quantity: item.quantity });
              return null;
            }
            const { product } = item;
            let imageUrl = product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('https://')
              ? product.imageUrl
              : Array.isArray(product.imageUrls) && product.imageUrls[0] && typeof product.imageUrls[0] === 'string' && product.imageUrls[0].startsWith('https://')
              ? product.imageUrls[0]
              : placeholder;
            return {
              ...item,
              product: {
                id: product.id || item.productId,
                name: product.name || 'Unnamed Product',
                price: Number(product.price) || 0,
                stock: Number(product.stock) || 0,
                category: product.category || 'uncategorized',
                imageUrl,
                rating: product.rating || Math.random() * 2 + 3,
                colors: product.colors || [],
                sizes: product.sizes || [],
                condition: product.condition || 'New',
                sellerId: product.sellerId || '',
              },
            };
          })
          .filter((item) => {
            if (!item) return false;
            const isValidImage = item.product.imageUrl && typeof item.product.imageUrl === 'string' && (item.product.imageUrl.startsWith('https://') || item.product.imageUrl === placeholder);
            if (!isValidImage) {
              console.warn('Filtered out cart item with invalid imageUrl:', {
                productId: item.productId,
                name: item.product.name,
                imageUrl: item.product.imageUrl,
              });
              return false;
            }
            return true;
          });

        setCartItems(normalizedItems);
        if (normalizedItems.length === 0) {
          setError('Your cart is empty.');
        } else {
          setError(null);
        }
      } catch (err) {
        console.error('Error updating cart:', { message: err.message, code: err.code });
        setError('Failed to update cart.');
        toast.error('Failed to update cart');
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);
    return () => {
      unsubscribe();
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [user]);

  const updateCartQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) return;
    try {
      const item = cartItems.find((i) => i.productId === productId);
      if (item && item.product && newQuantity > item.product.stock) {
        toast.error(`Cannot add more than ${item.product.stock} units of ${item.product.name}`);
        return;
      }
      const updatedItems = cartItems.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      );
      await updateCart(updatedItems, user?.uid);
      setCartItems(updatedItems);
      toast.success('Quantity updated');
    } catch (err) {
      console.error('Error updating quantity:', { message: err.message, code: err.code });
      toast.error('Failed to update quantity');
    }
  };

  const removeFromCart = async (productId) => {
    try {
      const updatedItems = cartItems.filter((item) => item.productId !== productId);
      await updateCart(updatedItems, user?.uid);
      setCartItems(updatedItems);
      toast.success('Item removed from cart');
      if (updatedItems.length === 0) {
        setError('Your cart is empty.');
      }
    } catch (err) {
      console.error('Error removing item:', { message: err.message, code: err.code });
      toast.error('Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    try {
      await clearCart(user?.uid);
      setCartItems([]);
      setError('Your cart is empty.');
      toast.success('Cart cleared successfully');
    } catch (err) {
      console.error('Error clearing cart:', { message: err.message, code: err.code });
      toast.error('Failed to clear cart');
    }
  };

  const handleCheckout = async () => {
    if (!user) {
      toast.error('Please log in to checkout');
      navigate('/login');
      return;
    }
    try {
      await checkout(user.uid);
      toast.success('Order placed successfully!');
      navigate('/orders');
    } catch (err) {
      console.error('Error during checkout:', { message: err.message, code: err.code });
      toast.error(err.message || 'Checkout failed');
    }
  };

  const handleAddToCart = async (product) => {
    try {
      const existingItem = cartItems.find((item) => item.productId === product.id);
      const newQuantity = existingItem ? existingItem.quantity + 1 : 1;
      if (newQuantity > product.stock) {
        toast.error(`Cannot add more than ${product.stock} units of ${product.name}`);
        return;
      }
      const cartItem = {
        productId: product.id,
        quantity: newQuantity,
        product: {
          id: product.id,
          name: product.name,
          price: product.price,
          stock: product.stock,
          category: product.category || 'uncategorized',
          imageUrl: product.imageUrl,
        },
      };
      const updatedItems = existingItem
        ? cartItems.map((item) =>
            item.productId === product.id ? { ...item, quantity: newQuantity } : item
          )
        : [...cartItems, cartItem];
      await addToCart(cartItem, user?.uid);
      setCartItems(updatedItems);
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      console.error('Error adding to cart:', err);
      toast.error('Failed to add item to cart');
    }
  };

  const totalPrice = cartItems.reduce(
    (total, item) => total + (item.product?.price || 0) * item.quantity,
    0
  );

  if (loading) return (
    <div className="p-4 text-gray-600 text-center">
      <Spinner />
      Loading...
    </div>
  );

  return (
    <div className="mb-10 container mx-auto px-4 py-8 min-h-screen">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Your Cart
      </h1>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="lg:w-2/3">
          {error && cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center">
              <img
                src={emptyCart}
                alt="Empty Cart"
                className="h-[420px] m-3"
                onError={(e) => {
                  console.warn('Failed to load empty cart image:', e.target.src);
                  e.target.src = placeholder;
                }}
              />
              <p className="text-gray-600 m-3 text-md">
                {error}
                <Link to="/products" className="underline text-blue-500 ml-1">
                  Shop Now
                </Link>
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {cartItems.map((item) => (
                <CartItem
                  key={item.productId}
                  item={item}
                  updateCartQuantity={updateCartQuantity}
                  removeFromCart={removeFromCart}
                />
              ))}
            </div>
          )}
        </div>
        <div className="lg:w-1/3">
          <CartSummary
            totalPrice={totalPrice}
            handleCheckout={handleCheckout}
            cartItems={cartItems}
            clearCart={handleClearCart}
            isFixed={scrollY > 200}
          />
        </div>
      </div>
    </div>
  );
};

export default Cart;