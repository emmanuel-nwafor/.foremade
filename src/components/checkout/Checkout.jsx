import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, setDoc, updateDoc, getDoc, collection, addDoc, serverTimestamp, runTransaction } from 'firebase/firestore';
import { getCart, clearCart } from '/src/utils/cartUtils';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { toast } from 'react-toastify';
import Spinner from '/src/components/common/Spinner';
import PaystackCheckout from './PaystackCheckout';
import cards from '/src/assets/card.png';

const customToastStyle = {
  background: '#22c55e',
  color: '#fff',
  fontWeight: 'bold',
  borderRadius: '8px',
  padding: '16px',
};

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

// Preload image utility to check if an image URL is valid
const preloadImage = (url) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
  });
};

const StripeCheckoutForm = ({ totalPrice, formData, onSuccess, onCancel, currency, handlingFee, buyerProtectionFee }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast.error('Stripe not loaded. Please try again.', { position: 'top-right', autoClose: 3000 });
      return;
    }

    setLoading(true);
    try {
      const amountInCents = currency === 'GBP' 
        ? Math.round(totalPrice * 100) // Already converted to GBP
        : Math.round(totalPrice * 100); // Kobo for NGN

      const backendUrl = import.meta.env.VITE_URL || 'http://localhost:5000';
      let attempts = 3;
      let lastError = null;

      while (attempts > 0) {
        try {
          const { data } = await axios.post(
            `${backendUrl}/create-payment-intent`,
            {
              amount: amountInCents,
              currency: currency.toLowerCase(),
              metadata: {
                userId: auth.currentUser?.uid || 'anonymous',
                orderId: `order-${Date.now()}`,
                handlingFee,
                buyerProtectionFee,
              },
            },
            { timeout: 15000 }
          );

          const { error: stripeError, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
            payment_method: {
              card: elements.getElement(CardElement),
              billing_details: {
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                address: {
                  line1: formData.address,
                  city: formData.city,
                  postal_code: formData.postalCode,
                  country: currency === 'GBP' ? 'GB' : 'NG',
                },
              },
            },
          });

          if (stripeError) {
            toast.error(stripeError.message, { position: 'top-right', autoClose: 3000 });
            return;
          }

          if (paymentIntent.status === 'succeeded') {
            await onSuccess(paymentIntent);
            setLoading(false);
            return;
          }
        } catch (err) {
          lastError = err;
          attempts--;
          if (err.code !== 'ECONNABORTED' || attempts === 0) {
            throw err;
          }
          toast.warn(`Retrying payment (${attempts} attempts left)...`, { position: 'top-right', autoClose: 2000 });
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
      throw lastError || new Error('Payment failed after retries.');
    } catch (err) {
      console.error('Stripe payment error:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
      });
      toast.error(
        err.code === 'ECONNABORTED'
          ? 'Payment timed out. Please try again or check your connection.'
          : err.message || 'Payment failed. Try again.',
        { position: 'top-right', autoClose: 3000 }
      );
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">Card Details</label>
        <CardElement
          options={{
            style: {
              base: { fontSize: '16px', color: '#424770', '::placeholder': { color: '#aab7c4' } },
              invalid: { color: '#9e2146' },
            },
          }}
          className="p-3 border border-gray-300 rounded-lg"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || !stripe || !elements}
          className={`flex-1 py-3 px-4 rounded-lg text-white text-sm font-medium transition duration-200 shadow ${
            loading || !stripe || !elements
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {loading ? 'Processing...' : `Pay ${currency} ${totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition text-sm disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loadingState, setLoadingState] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Nigeria',
    phone: '',
  });
  const [imageLoading, setImageLoading] = useState({});

  useEffect(() => {
    const loadCartAndUserData = async () => {
      try {
        setLoadingState(true);
        const user = auth.currentUser;
        const cartItems = await getCart(user?.uid);
        console.log('Loaded cart items:', JSON.stringify(cartItems, null, 2));

        const processedCart = await Promise.all(cartItems.map(async (item) => {
          const productData = await item.product || {};
          let imageUrls = [];

          if (Array.isArray(productData.imageUrls)) {
            imageUrls = productData.imageUrls.filter(
              (url) => typeof url === 'string' && (url.startsWith('https://res.cloudinary.com/') || url.startsWith('http'))
            );
          } else if (
            productData.imageUrl &&
            typeof productData.imageUrl === 'string' && 
            (productData.imageUrl.startsWith('https://res.cloudinary.com/') || productData.imageUrl.startsWith('http'))
          ) {
            imageUrls = [productData.imageUrl];
          }

          const validImageUrls = await Promise.all(imageUrls.map(url => preloadImage(url)));
          const filteredImageUrls = imageUrls.filter((_, index) => validImageUrls[index]);

          if (filteredImageUrls.length === 0) {
            filteredImageUrls.push('https://res.cloudinary.com/demo/image/upload/v1/sample');
            console.warn('No valid imageUrls found for product:', productData.name || 'Unknown', 'Using fallback');
          }

          console.log('Processed valid imageUrls for', productData.name || 'Unknown', ':', filteredImageUrls);

          return {
            ...item,
            product: {
              ...productData,
              imageUrls: filteredImageUrls,
            },
            currentImage: filteredImageUrls[0] || 'https://res.cloudinary.com/demo/image/upload/v1/sample',
            slideDirection: 'right',
          };
        }));

        setCart(processedCart);
        setImageLoading(
          processedCart.reduce((acc, item) => ({
            ...acc,
            [item.productId]: true,
          }), {})
        );

        if (user) {
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setFormData((prev) => ({
              ...prev,
              name: userData.name || user.displayName || '',
              email: userData.email || user.email || '',
              address: userData.address || '',
              city: userData.city || '',
              postalCode: userData.postalCode || '',
              country: userData.country || 'Nigeria',
              phone: userData.phone || '',
            }));
          }
        }
      } catch (err) {
        console.error('Error loading cart or user data:', {
          message: err.message || 'No message available',
          stack: err.stack || 'No stack trace available',
        });
        setCart([]);
        toast.error('Failed to load data.', { position: 'top-right', autoClose: 3000 });
      } finally {
        setLoadingState(false);
      }
    };

    const handleCartUpdate = async () => {
      try {
        const user = auth.currentUser;
        const cartItems = await getCart(user?.uid);
        console.log('Updated cart items:', JSON.stringify(cartItems, null, 2));

        const processedCart = await Promise.all(cartItems.map(async (item) => {
          const productData = item.product || {};
          let imageUrls = [];

          if (Array.isArray(productData.imageUrls)) {
            imageUrls = productData.imageUrls.filter(
              (url) => typeof url === 'string' && (url.startsWith('https://res.cloudinary.com/') || url.startsWith('http'))
            );
          } else if (
            productData.imageUrl &&
            typeof productData.imageUrl === 'string' &&
            (productData.imageUrl.startsWith('https://res.cloudinary.com/') || productData.imageUrl.startsWith('http'))
          ) {
            imageUrls = [productData.imageUrl];
          }

          const validImageUrls = await Promise.all(imageUrls.map(url => preloadImage(url)));
          const filteredImageUrls = imageUrls.filter((_, index) => validImageUrls[index]);

          if (filteredImageUrls.length === 0) {
            filteredImageUrls.push('https://res.cloudinary.com/demo/image/upload/v1/sample');
            console.warn('No valid imageUrls for product:', productData.name || 'Unknown', 'Using default image');
          }

          console.log('Updated valid imageUrls for', productData.name || 'Unknown', ':', filteredImageUrls);

          return {
            ...item,
            product: {
              ...productData,
              imageUrls: filteredImageUrls,
            },
            currentImage: filteredImageUrls[0] || 'https://res.cloudinary.com/demo/image/upload/v1/sample',
            slideDirection: 'right',
          };
        }));

        setCart(processedCart);
        setImageLoading(
          processedCart.reduce((acc, item) => ({
            ...acc,
            [item.productId]: true,
          }), {})
        );
      } catch (err) {
        console.error('Error updating cart:', {
          message: err.message,
          stack: err.stack,
        });
        toast.error('Failed to update cart.', { position: 'top-right', autoClose: 3000 });
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      loadCartAndUserData();
    });

    return () => {
      unsubscribe();
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, []);

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalNgn = cart.reduce(
    (total, item) => total + (item.product ? item.product.price * item.quantity : 0),
    0
  );
  const belowMinimumPrice = subtotalNgn < 12000;
  const taxRate = 0.075;
  const taxNgn = subtotalNgn * taxRate;
  const handlingFeeRate = 0.05; // 5% handling fee
  const buyerProtectionRate = 0.02; // 2% buyer protection fee
  const totalNgnBeforeFees = subtotalNgn + taxNgn;
  const handlingFeeNgn = totalNgnBeforeFees * handlingFeeRate;
  const buyerProtectionFeeNgn = totalNgnBeforeFees * buyerProtectionRate;
  const totalFeesNgn = handlingFeeNgn + buyerProtectionFeeNgn;
  const totalNgn = totalNgnBeforeFees + totalFeesNgn;

  const currency = formData.country === 'United Kingdom' ? 'GBP' : 'NGN';
  const conversionRateNgnToGbp = 0.00048; // 1 NGN = 0.00048 GBP
  const totalAmount = currency === 'GBP' ? totalNgn * conversionRateNgnToGbp : totalNgn;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const { name, email, address, city, postalCode, country, phone } = formData;
    if (!name || !email || !address || !city || !postalCode || !country || !phone) {
      return { isValid: false, message: 'All fields are required.' };
    }
    if (!/\S+@\S+\.\S+/.test(email)) {
      return { isValid: false, message: 'Invalid email address.' };
    }
    if (!['Nigeria', 'United Kingdom'].includes(country)) {
      return { isValid: false, message: 'Select Nigeria or United Kingdom.' };
    }
    return { isValid: true, message: '' };
  };

  const formValidity = useMemo(() => validateForm(), [formData]);

  const sendOrderConfirmationEmail = async (order) => {
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      await axios.post(`${backendUrl}/send-order-confirmation`, {
        to: order.shippingDetails.email,
        orderId: order.paymentId,
        items: order.items,
        total: order.totalAmount,
        currency: order.currency,
        shippingDetails: order.shippingDetails,
        paymentGateway: order.paymentGateway,
        date: order.date,
      });
      console.log('Order confirmation email sent successfully');
    } catch (err) {
      console.error('Error sending order confirmation email:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
      });
      toast.warn('Order placed successfully, but failed to send confirmation email.', {
        position: 'top-right',
        autoClose: 3000,
      });
    }
  };

  const handlePaymentSuccess = useCallback(
    async (paymentData) => {
      try {
        if (cart.length === 0) {
          toast.error('Cart is empty.', { position: 'top-right', autoClose: 3000 });
          return;
        }
        const validation = validateForm();
        if (!validation.isValid) {
          toast.error(validation.message, { position: 'top-right', autoClose: 3000 });
          return;
        }
        if (belowMinimumPrice) {
          toast.error('Total amount must be at least ₦12,000 to proceed.', { position: 'top-right', autoClose: 3000 });
          return;
        }

        const userId = auth.currentUser?.uid || 'anonymous';
        const orderId = `order-${Date.now()}`;
        const paymentGateway = formData.country === 'United Kingdom' ? 'Stripe' : 'Paystack';

        // Group items by sellerId
        const sellers = {};
        cart.forEach((item) => {
          const sellerId = item.product?.sellerId || 'default-seller-id';
          if (!sellerId) {
            console.warn('No sellerId found for item:', item);
            throw new Error('Seller ID missing for item: ' + item.productId);
          }
          if (!sellers[sellerId]) sellers[sellerId] = [];
          sellers[sellerId].push(item);
        });

        let lastOrder = null; // To store the last order for email confirmation
        const walletUpdates = []; // To track wallet updates for rollback

        // Use a single transaction to ensure atomicity
        await runTransaction(db, async (transaction) => {
          // Step 1: Perform ALL reads first
          // Read product stock
          const productRefs = cart.map(item => doc(db, 'products', item.productId));
          const productSnaps = await Promise.all(productRefs.map(ref => transaction.get(ref)));
          
          const stockUpdates = [];
          productSnaps.forEach((snap, index) => {
            if (!snap.exists()) {
              console.warn(`Product ${cart[index].productId} does not exist. Skipping stock update.`);
              return; // Skip missing products
            }
            const currentStock = snap.data().stock;
            const requestedQuantity = cart[index].quantity;
            const newStock = currentStock - requestedQuantity;
            if (newStock < 0) {
              throw new Error(`Insufficient stock for product ${cart[index].productId} (${cart[index].product?.name || 'Unknown'})`);
            }
            stockUpdates.push({ ref: productRefs[index], newStock });
          });

          // Read seller wallets
          const sellerWalletRefs = Object.keys(sellers).map(sellerId => doc(db, 'wallets', sellerId));
          const sellerWalletSnaps = await Promise.all(sellerWalletRefs.map(ref => transaction.get(ref)));
          const sellerWallets = sellerWalletSnaps.map((snap, index) => ({
            ref: sellerWalletRefs[index],
            exists: snap.exists(),
            data: snap.exists() ? snap.data() : null,
            sellerId: Object.keys(sellers)[index],
          }));

          // Step 2: Compute changes (no writes yet)
          const orders = [];
          sellerWallets.forEach(({ ref, exists, data, sellerId }) => {
            const sellerItems = sellers[sellerId];
            const sellerSubtotalNgn = sellerItems.reduce(
              (total, item) => total + (item.product.price * item.quantity),
              0
            );
            const sellerTaxNgn = sellerSubtotalNgn * taxRate;
            const sellerTotalNgnBeforeFees = sellerSubtotalNgn + sellerTaxNgn;
            const sellerHandlingFee = sellerTotalNgnBeforeFees * handlingFeeRate;
            const sellerBuyerProtectionFee = sellerTotalNgnBeforeFees * buyerProtectionRate;
            const sellerTotalFees = sellerHandlingFee + sellerBuyerProtectionFee;
            const sellerShareNgn = sellerTotalNgnBeforeFees; // Seller gets subtotal + tax
            const sellerShare = currency === 'GBP' ? sellerShareNgn * conversionRateNgnToGbp : sellerShareNgn;

            const order = {
              id: orderId,
              userId,
              sellerId,
              items: sellerItems.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                price: item.product?.price || 0,
                name: item.product?.name || 'Unknown',
                sellerId: item.product?.sellerId || sellerId,
              })),
              totalAmount,
              handlingFee: sellerHandlingFee,
              buyerProtectionFee: sellerBuyerProtectionFee,
              sellerShare,
              date: new Date().toISOString(),
              createdAt: serverTimestamp(),
              shippingDetails: formData,
              status: 'pending-approval',
              paymentGateway,
              paymentId: paymentData.id || paymentData.reference,
              currency,
            };
            orders.push({ order, orderId: `${orderId}-${sellerId}` });

            // Prepare wallet update
            const pendingBalance = (exists ? (data.pendingBalance || 0) : 0) + sellerShare;
            walletUpdates.push({ sellerId, amount: sellerShare }); // For rollback if needed
            transaction.set(ref, {
              availableBalance: exists ? (data.availableBalance || 0) : 0,
              pendingBalance,
              updatedAt: serverTimestamp(),
              ...(exists ? {} : { createdAt: serverTimestamp() }),
            }, { merge: true });
          });

          // Step 3: Perform ALL writes
          // Create orders
          orders.forEach(({ order, orderId }) => {
            const orderRef = doc(db, 'orders', orderId);
            transaction.set(orderRef, order);
            lastOrder = order; // Update lastOrder for email confirmation
          });

          // Update product stock
          stockUpdates.forEach(({ ref, newStock }) => {
            transaction.update(ref, { stock: newStock });
          });

          // Record seller transactions
          const transactionPromises = orders.map(({ order }) =>
            addDoc(collection(db, 'transactions'), {
              userId: order.sellerId,
              type: 'Sale',
              description: `Sale from order ${order.id}`,
              amount: order.sellerShare,
              date: new Date().toISOString().split('T')[0],
              status: 'Pending',
              createdAt: serverTimestamp(),
              reference: order.paymentId,
            })
          );
          await Promise.all(transactionPromises);
        });

        // Save user details (outside transaction, as it's not critical to atomicity)
        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          await setDoc(userDocRef, formData, { merge: true });
        }

        // Send email confirmation using the last order
        if (lastOrder) {
          await sendOrderConfirmationEmail({
            ...lastOrder,
            items: cart.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.product?.price || 0,
              name: item.product?.name || 'Unknown',
              sellerId: item.product?.sellerId,
            })),
          });
        }

        // Clear cart
        await clearCart(auth.currentUser?.uid);
        setCart([]);

        toast.success(
          <div>
            <strong>Payment Successful!</strong>
            <p>Your order has been placed. Check your email for confirmation.</p>
          </div>,
          {
            position: 'top-right',
            autoClose: 5000,
            style: customToastStyle,
            icon: <i className="bx bx-check-circle text-blue-500 text-xl"></i>,
          }
        );
        navigate('/order-confirmation', { state: { order: { ...lastOrder, items: cart } } });
      } catch (err) {
        console.error('Checkout error:', {
          message: err.message,
          stack: err.stack,
          code: err.code,
        });
        toast.error(err.message || 'Failed to place order. Please try again.', { position: 'top-right', autoClose: 3000 });

        // Rollback wallet updates if possible
        if (walletUpdates.length > 0) {
          try {
            await runTransaction(db, async (transaction) => {
              for (const { sellerId, amount } of walletUpdates) {
                const walletRef = doc(db, 'wallets', sellerId);
                const walletSnap = await transaction.get(walletRef);
                if (walletSnap.exists()) {
                  const currentPending = walletSnap.data().pendingBalance || 0;
                  transaction.update(walletRef, {
                    pendingBalance: Math.max(0, currentPending - amount),
                    updatedAt: serverTimestamp(),
                  });
                }
              }
            });
            console.log('Rolled back wallet updates due to checkout failure.');
          } catch (rollbackErr) {
            console.error('Rollback error:', rollbackErr);
            toast.warn('Failed to rollback wallet updates. Please contact support.', { position: 'top-right', autoClose: 5000 });
          }
        }
      }
    },
    [cart, subtotalNgn, belowMinimumPrice, formData, totalNgn, navigate, totalItems, currency]
  );

  const handleCancel = () => {
    toast.info('Payment cancelled.', { position: 'top-right', autoClose: 3000 });
  };

  const handleImageClick = (itemId, url, index, currentIndex) => {
    setCart((prev) => prev.map((item) =>
      item.productId === itemId ? {
          ...item,
          currentImage: url,
          slideDirection: index > currentIndex ? 'right' : 'left',
        } : item
    ));
    console.log('Cart item image updated:', { itemId, url, direction: index > currentIndex ? 'right' : 'left' });
  };

  const handleImageLoad = (productId, isThumbnail) => {
    setImageLoading((prev) => {
      const updated = { ...prev, [productId]: prev[productId] && !isThumbnail ? false : prev[productId] };
      console.log(`Image ${isThumbnail ? 'thumbnail' : 'main'} loaded for productId: ${productId}`, { updated });
      return updated;
    });
  };

  const handleImageError = (e, productId) => {
    console.error(`Cart item image load error for productId: ${productId}`, {
      imageUrl: e.target.src,
      productId,
      error: e.message || 'Unknown error occurred',
    });
    setImageLoading((prev) => ({ ...prev, [productId]: false }));
    e.target.src = 'https://res.cloudinary.com/demo/image/upload/v1/sample';
  };

  if (loadingState) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Spinner />
          <p className="text-gray-600 text-sm mt-2">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <style>
        {`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideInLeft {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .slide-in-right {
            animation: slideInRight 0.3s ease-in-out forwards;
          }
          .slide-in-left {
            animation: slideInLeft 0.3s ease-in-out forwards;
          }
        `}
      </style>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Checkout</h1>
      {cart.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Your cart is empty.{' '}
            <Link to="/products" className="text-blue-600 hover:underline">
              Continue shopping
            </Link>
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-gray-100 rounded-lg">
            <h2 className="text-lg font-semibold text-gray-800 m-5 rounded-lg">Shipping Details</h2>
            <form className="space-y-4 p-6 rounded-lg">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loadingState}
                />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loadingState}
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loadingState}
                />
              </div>
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loadingState}
                />
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  City <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loadingState}
                />
              </div>
              <div>
                <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700">
                  Postal Code <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="postalCode"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loadingState}
                />
              </div>
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country <span className="text-red-500">*</span>
                </label>
                <select
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleInputChange}
                  className="mt-1 w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                  disabled={loadingState}
                >
                  <option value="">Select a country</option>
                  <option value="Nigeria">Nigeria</option>
                  <option value="United Kingdom">United Kingdom</option>
                </select>
              </div>
            </form>
            <div className="mt-8 shadow-sm p-5 rounded-lg">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Cart Items</h2>
              {cart.map((item) => (
                <div key={item.productId} className="flex items-start gap-4 mb-4 border-b pb-4">
                  <div className="w-24 h-24 relative overflow-hidden">
                    {imageLoading[item.productId] && (
                      <div className="absolute w-full h-full flex items-center justify-center bg-gray-200 rounded-lg">
                        <Spinner />
                      </div>
                    )}
                    <img
                      src={item.currentImage}
                      alt={item.product?.name || 'Unknown Product'}
                      className={`absolute w-full h-full object-cover rounded-lg ${
                        item.slideDirection === 'right' ? 'slide-in-right' : 'slide-in-left'
                      } ${imageLoading[item.productId] ? 'opacity-0' : 'opacity-100'}`}
                      onLoad={() => handleImageLoad(item.productId, false)}
                      onError={(e) => handleImageError(e, item.productId)}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-800">
                      {item.product?.name || 'Unknown'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {currency} {(item.product?.price * item.quantity || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                      })} (x{item.quantity})
                    </p>
                    {item.product?.imageUrls?.length > 1 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {item.product.imageUrls.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`${item.product?.name || 'Unknown'} ${index + 1}`}
                            className={`w-10 h-10 object-cover rounded border cursor-pointer ${
                              item.currentImage === url ? 'border-blue-500 border-2' : 'border-gray-300'
                            } ${imageLoading[item.productId] ? 'opacity-0' : 'opacity-100'}`}
                            onClick={() =>
                              handleImageClick(
                                item.productId,
                                url,
                                index,
                                item.product.imageUrls.indexOf(item.currentImage)
                              )
                            }
                            onLoad={() => handleImageLoad(item.productId, true)}
                            onError={(e) => handleImageError(e, item.productId)}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="w-full lg:w-1/3">
            <div className="p-6 bg-gray-100 rounded-lg shadow-sm sticky top-4">
              <img src={cards} alt="Accepted payment cards" className="mb-4" />
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Items</span>
                  <span>{totalItems}</span>
                </div>
                {cart.map((item) => (
                  <div key={item.productId} className="flex justify-between">
                    <span>
                      {item.product?.name || 'Unknown'} (x{item.quantity})
                    </span>
                    <span>
                      {currency} {(item.product?.price * item.quantity || 0).toLocaleString('en-US', {
                        minimumFractionDigits: 0,
                      })}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    {currency} {subtotalNgn.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (7.5%)</span>
                  <span>
                    {currency} {taxNgn.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Handling Fee (5%)</span>
                  <span>
                    {currency} {handlingFeeNgn.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Buyer Protection Fee (2%)</span>
                  <span>
                    {currency} {buyerProtectionFeeNgn.toLocaleString('en-US', { minimumFractionDigits: 0 })}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
                  <span>Grand Total</span>
                  <span>
                    {currency} {totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              {belowMinimumPrice && (
                <p className="text-red-600 text-xs mt-2 bg-red-50 p-2 rounded">
                  ❌ Minimum purchase amount is ₦12,000 to checkout.
                </p>
              )}
              <div className="mt-6 border-t pt-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4">Shipping Information</h2>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Name:</strong> {formData.name || 'Not provided'}
                  </p>
                  <p>
                    <strong>Email:</strong> {formData.email || 'Not provided'}
                  </p>
                  <p>
                    <strong>Phone:</strong> {formData.phone || 'Not provided'}
                  </p>
                  <p>
                    <strong>Address:</strong> {formData.address || 'Not provided'}
                  </p>
                  <p>
                    <strong>City:</strong> {formData.city || 'Not provided'}
                  </p>
                  <p>
                    <strong>Postal Code:</strong> {formData.postalCode || 'Not provided'}
                  </p>
                  <p>
                    <strong>Country:</strong> {formData.country || 'Not provided'}
                  </p>
                </div>
              </div>
              {isAuthenticated && formValidity.isValid && cart.length > 0 && !belowMinimumPrice && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4">Payment Details</h2>
                  {formData.country === 'United Kingdom' ? (
                    <Elements stripe={stripePromise}>
                      <StripeCheckoutForm
                        totalPrice={totalAmount}
                        formData={formData}
                        onSuccess={handlePaymentSuccess}
                        onCancel={handleCancel}
                        currency={currency}
                        handlingFee={handlingFeeNgn}
                        buyerProtectionFee={buyerProtectionFeeNgn}
                      />
                    </Elements>
                  ) : formData.country === 'Nigeria' ? (
                    <PaystackCheckout
                      email={formData.email}
                      amount={totalAmount * 100} // Convert to kobo
                      onSuccess={handlePaymentSuccess}
                      onClose={handleCancel}
                      disabled={!formValidity.isValid || cart.length === 0 || loadingState || belowMinimumPrice}
                      buttonText="Pay Now"
                      className={`w-full py-3 px-4 rounded-lg text-white text-sm font-medium transition duration-200 shadow ${
                        !formValidity.isValid || cart.length === 0 || loadingState || belowMinimumPrice
                          ? 'bg-gray-400 cursor-not-allowed'
                          : 'bg-blue-900 hover:bg-blue-800'
                      }`}
                      iconClass="bx bx-cart mr-2"
                    />
                  ) : (
                    <p className="text-red-600 text-sm">Please select a valid country.</p>
                  )}
                </div>
              )}
              {!isAuthenticated && (
                <div className="mt-4 text-sm text-red-600">
                  Please{' '}
                  <Link to="/login" className="text-blue-600 hover:underline">
                    log in
                  </Link>{' '}
                  to proceed with payment.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;