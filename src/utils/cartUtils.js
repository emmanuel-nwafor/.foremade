import { db } from '/src/firebase';
import { doc, getDoc, collection, addDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

export const addToCart = async (productId, quantity, userId = null) => {
  if (!productId || quantity <= 0) {
    throw new Error('Invalid cart item data');
  }

  try {
    const productRef = doc(db, 'products', productId);
    const productSnap = await getDoc(productRef);
    if (!productSnap.exists()) {
      throw new Error('Product not found');
    }
    const productData = productSnap.data();
    if (productData.stock < quantity) {
      throw new Error(`Only ${productData.stock} units available`);
    }

    const cart = await getCart(userId);
    const existingItem = cart.find((item) => item.productId === productId);
    let updatedCart;

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      if (newQuantity > productData.stock) {
        throw new Error(`Cannot add more than ${productData.stock} units`);
      }
      updatedCart = cart.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      );
    } else {
      updatedCart = [
        ...cart,
        {
          productId,
          quantity,
          product: {
            name: productData.name,
            price: productData.price,
            image: productData.imageUrl,
            stock: productData.stock,
            sellerId: productData.sellerId || 'default-seller-id',
          },
        },
      ];
    }

    await updateCart(updatedCart, userId);
    toast.success('Added to cart');
  } catch (error) {
    console.error('Error adding to cart:', error);
    toast.error(error.message);
    throw error;
  }
};

export const getCart = async (userId = null) => {
  const cartKey = userId ? `userCart_${userId}` : 'guestCart';
  let cart = [];

  try {
    const storedCart = localStorage.getItem(cartKey);
    if (storedCart) {
      cart = JSON.parse(storedCart);
      if (!Array.isArray(cart)) {
        console.warn('Invalid cart format, resetting:', cart);
        cart = [];
      }
    }

    const validCart = [];
    for (const item of cart) {
      if (!item.productId || item.quantity <= 0) {
        console.warn('Invalid cart item:', item);
        continue;
      }
      try {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const productData = productSnap.data();
          validCart.push({
            ...item,
            product: {
              name: productData.name,
              price: productData.price,
              image: productData.imageUrl,
              stock: productData.stock,
              sellerId: productData.sellerId || 'default-seller-id',
            },
          });
        } else {
          console.warn(`Product not found for ID: ${item.productId}`);
          toast.error(`Removed unavailable product (ID: ${item.productId}) from cart`);
        }
      } catch (error) {
        console.error(`Error validating product ${item.productId}:`, error);
        toast.error(`Error validating product (ID: ${item.productId})`);
      }
    }

    if (validCart.length < cart.length) {
      await updateCart(validCart, userId);
    }

    return validCart;
  } catch (err) {
    console.error('Error fetching cart:', err);
    toast.error('Failed to fetch cart');
    return [];
  }
};

export const getCartItemCount = async (userId = null) => {
  try {
    const cart = await getCart(userId);
    return cart.reduce((total, item) => total + item.quantity, 0);
  } catch (error) {
    console.error('Error getting cart item count:', error);
    return 0;
  }
};

export const updateCart = async (cartItems, userId = null) => {
  const cartKey = userId ? `userCart_${userId}` : 'guestCart';
  try {
    localStorage.setItem(cartKey, JSON.stringify(cartItems));
    window.dispatchEvent(new Event('cartUpdated'));
  } catch (err) {
    console.error('Error updating cart:', err);
    toast.error('Failed to update cart');
    throw err;
  }
};

export const clearCart = async (userId = null) => {
  try {
    await updateCart([], userId);
    toast.success('Cart cleared');
  } catch (error) {
    console.error('Error clearing cart:', error);
    toast.error('Failed to clear cart');
    throw error;
  }
};

export const checkout = async (userId) => {
  if (!userId) throw new Error('Please log in to checkout');
  const cart = await getCart(userId);
  if (cart.length === 0) throw new Error('Cart is empty');

  try {
    for (const item of cart) {
      const productRef = doc(db, 'products', item.productId);
      const productSnap = await getDoc(productRef);
      if (!productSnap.exists()) {
        throw new Error(`Product ${item.productId} no longer available`);
      }
      const productData = productSnap.data();
      if (productData.stock < item.quantity) {
        throw new Error(`Insufficient stock for ${productData.name}`);
      }
    }

    const orderRef = collection(db, 'orders');
    await addDoc(orderRef, {
      userId,
      items: cart,
      total: cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
      createdAt: new Date().toISOString(),
      status: 'pending',
    });

    await clearCart(userId);
    toast.success('Order placed successfully');
  } catch (err) {
    console.error('Checkout error:', err);
    toast.error(err.message);
    throw err;
  }
};

export const mergeGuestCart = async (userId) => {
  try {
    const guestCart = await getCart(null);
    if (guestCart.length === 0) return;

    const userCart = await getCart(userId);
    const mergedCart = [...userCart];

    for (const guestItem of guestCart) {
      const existingItem = mergedCart.find((item) => item.productId === guestItem.productId);
      if (existingItem) {
        existingItem.quantity += guestItem.quantity;
        try {
          const productRef = doc(db, 'products', existingItem.productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const productData = productSnap.data();
            if (existingItem.quantity > productData.stock) {
              existingItem.quantity = productData.stock;
              toast.warn(`Adjusted quantity for ${productData.name} to available stock`);
            }
          }
        } catch (error) {
          console.error(`Error validating product ${existingItem.productId}:`, error);
          toast.error(`Error validating product (ID: ${existingItem.productId})`);
        }
      } else {
        mergedCart.push(guestItem);
      }
    }

    await updateCart(mergedCart, userId);
    await clearCart(null);
    toast.success('Guest cart merged with your account');
  } catch (error) {
    console.error('Error merging guest cart:', error);
    toast.error('Failed to merge guest cart');
  }
};