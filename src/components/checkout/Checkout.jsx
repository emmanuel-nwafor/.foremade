import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { getCart, clearCart } from '/src/utils/cartUtils';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import axios from 'axios';
import { toast } from 'react-toastify';
import Spinner from '/src/components/common/Spinner';
import PaystackCheckout from './PaystackCheckout';
import cards from '/src/assets/card.png';

// Custom toast style for success
const customToastStyle = {
  background: '#22c55e',
  color: '#fff',
  fontWeight: 'bold',
  borderRadius: '8px',
  padding: '16px',
};

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const StripeCheckoutForm = ({ totalPrice, formData, onSuccess, onCancel }) => {
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
      const gbpAmount = Math.round(totalPrice * 100); // Total in GBP pence
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      let attempts = 3;
      let lastError = null;

      while (attempts > 0) {
        try {
          const { data } = await axios.post(
            `${backendUrl}/create-payment-intent`,
            {
              amount: gbpAmount,
              currency: 'gbp',
              metadata: {
                userId: auth.currentUser?.uid || 'anonymous',
                orderId: `order-${Date.now()}`,
              },
            },
            { timeout: 15000 }
          );

          const { error, paymentIntent } = await stripe.confirmCardPayment(data.clientSecret, {
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
                  country: 'GB',
                },
              },
            },
          });

          if (error) {
            toast.error(error.message, { position: 'top-right', autoClose: 3000 });
            return;
          }

          if (paymentIntent.status === 'succeeded') {
            await onSuccess(paymentIntent);
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
    } finally {
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
              : 'bg-blue-900 hover:bg-blue-800'
          }`}
        >
          {loading ? 'Processing...' : `Pay £${totalPrice.toFixed(2)}`}
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
  const [loading, setLoading] = useState(true);
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
        setLoading(true);
        const user = auth.currentUser;
        const cartItems = await getCart(user?.uid);
        console.log('Loaded cart items:', JSON.stringify(cartItems, null, 2));

        // Process cart items to ensure valid imageUrls
        const processedCart = cartItems.map((item) => {
          const productData = item.product || {};
          let imageUrls = [];
          if (Array.isArray(productData.imageUrls)) {
            imageUrls = productData.imageUrls.filter(
              (url) => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/')
            );
          } else if (
            productData.imageUrl &&
            typeof productData.imageUrl === 'string' &&
            productData.imageUrl.startsWith('https://res.cloudinary.com/')
          ) {
            imageUrls = [productData.imageUrl];
          }
          if (imageUrls.length === 0) {
            imageUrls = ['https://res.cloudinary.com/demo/image/upload/v1/sample'];
            console.warn('No valid imageUrls for product:', productData.name, 'Using fallback');
          }
          console.log('Processed imageUrls for', productData.name, ':', imageUrls);
          return {
            ...item,
            product: {
              ...productData,
              imageUrls,
            },
            currentImage: imageUrls[0] || 'https://res.cloudinary.com/demo/image/upload/v1/sample',
            slideDirection: 'right',
          };
        });

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
          message: err.message,
          stack: err.stack,
        });
        setCart([]);
        toast.error('Failed to load data.', { position: 'top-right', autoClose: 3000 });
      } finally {
        setLoading(false);
      }
    };

    const handleCartUpdate = async () => {
      try {
        const user = auth.currentUser;
        const cartItems = await getCart(user?.uid);
        console.log('Updated cart items:', JSON.stringify(cartItems, null, 2));
        const processedCart = cartItems.map((item) => {
          const productData = item.product || {};
          let imageUrls = [];
          if (Array.isArray(productData.imageUrls)) {
            imageUrls = productData.imageUrls.filter(
              (url) => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/')
            );
          } else if (
            productData.imageUrl &&
            typeof productData.imageUrl === 'string' &&
            productData.imageUrl.startsWith('https://res.cloudinary.com/')
          ) {
            imageUrls = [productData.imageUrl];
          }
          if (imageUrls.length === 0) {
            imageUrls = ['https://res.cloudinary.com/demo/image/upload/v1/sample'];
            console.warn('No valid imageUrls for product:', productData.name, 'Using fallback');
          }
          console.log('Updated imageUrls for', productData.name, ':', imageUrls);
          return {
            ...item,
            product: {
              ...productData,
              imageUrls,
            },
            currentImage: imageUrls[0] || 'https://res.cloudinary.com/demo/image/upload/v1/sample',
            slideDirection: 'right',
          };
        });
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

  // Calculate shipping for Nigeria (Lagos Express Delivery)
  const calculateShippingNgn = (itemCount) => {
    if (itemCount === 0) return 0;
    const baseShipping = 25000; // ₦25,000 for first item
    const shippingDiscount = itemCount === 9 ? 0.3 : 0; // 30% discount if exactly 9 items
    return baseShipping * (1 - shippingDiscount);
  };

  // Calculate totals (base in NGN)
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotalNgn = cart.reduce(
    (total, item) => total + (item.product ? item.product.price * item.quantity : 0),
    0
  );
  const belowMinimumPrice = subtotalNgn < 12000;
  const taxRate = 0.075;
  const taxNgn = subtotalNgn * taxRate;
  const shippingNgn = formData.country === 'Nigeria' ? calculateShippingNgn(totalItems) : 500; // Flat ₦500 for UK
  const totalNgn = subtotalNgn + taxNgn + shippingNgn;

  // Convert to GBP for Stripe (United Kingdom)
  const conversionRateGbp = 0.00048; // 1 NGN = 0.00048 GBP
  const subtotalGbp = subtotalNgn * conversionRateGbp;
  const taxGbp = taxNgn * conversionRateGbp;
  const shippingGbp = shippingNgn * conversionRateGbp;
  const totalGbp = totalNgn * conversionRateGbp;

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
      await axios.post(`${backendUrl}/send-order-confirmation-email`, {
        to: order.shippingDetails.email,
        orderId: order.paymentId,
        items: order.items,
        total: order.paymentGateway === 'Stripe' ? order.total : order.total,
        currency: order.paymentGateway === 'Stripe' ? 'GBP' : 'NGN',
        shippingDetails: order.shippingDetails,
        paymentGateway: order.paymentGateway,
        date: order.date,
      });
      console.log('Order confirmation email sent successfully.');
    } catch (err) {
      console.error('Error sending order confirmation email:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
      });
      toast.warn('Order placed, but failed to send confirmation email.', {
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
          toast.error('Total price must be at least ₦12,000 to proceed.', { position: 'top-right', autoClose: 3000 });
          return;
        }
        const stockIssues = cart.filter((item) => item.quantity > (item.product?.stock || 0));
        if (stockIssues.length > 0) {
          toast.error('Stock issues detected.', { position: 'top-right', autoClose: 3000 });
          return;
        }

        const userId = auth.currentUser?.uid || 'anonymous';
        const orderId = `order-${Date.now()}`;
        const paymentGateway = formData.country === 'Nigeria' ? 'Paystack' : 'Stripe';
        const vendorId = cart[0]?.product?.sellerId;
        if (!vendorId) {
          console.warn('No vendorId found in cart:', cart);
          throw new Error('Vendor ID missing. Please check product data.');
        }
        console.log('Creating order with vendorId:', vendorId);
        const order = {
          userId,
          vendorId,
          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.product?.price || 0,
            name: item.product?.name || 'Unknown',
          })),
          total: paymentGateway === 'Stripe' ? totalGbp : totalNgn,
          date: new Date().toISOString(),
          shippingDetails: formData,
          status: 'completed',
          paymentGateway,
          paymentId: paymentData.id || paymentData.reference,
        };

        try {
          await setDoc(doc(db, 'orders', orderId), order);
          console.log('Order saved:', orderId);
        } catch (orderError) {
          console.error('Firestore order write error:', {
            code: orderError.code,
            message: orderError.message,
          });
          throw new Error(
            orderError.code === 'permission-denied'
              ? 'Insufficient permissions to save order. Please check Firestore rules.'
              : 'Failed to save order.'
          );
        }

        for (const item of cart) {
          const productRef = doc(db, 'products', item.productId);
          try {
            const productSnap = await getDoc(productRef);
            if (productSnap.exists()) {
              await updateDoc(productRef, { stock: productSnap.data().stock - item.quantity });
            } else {
              console.warn(`Product ${item.productId} does not exist.`);
            }
          } catch (productError) {
            console.error('Firestore product update error:', {
              code: productError.code,
              message: productError.message,
              productId: item.productId,
            });
            throw new Error(
              productError.code === 'permission-denied'
                ? 'Insufficient permissions to update product stock.'
                : 'Failed to update product stock.'
            );
          }
        }

        if (auth.currentUser) {
          const userDocRef = doc(db, 'users', auth.currentUser.uid);
          try {
            await setDoc(
              userDocRef,
              {
                name: formData.name,
                email: formData.email,
                address: formData.address,
                city: formData.city,
                postalCode: formData.postalCode,
                country: formData.country,
                phone: formData.phone,
              },
              { merge: true }
            );
          } catch (userError) {
            console.error('Firestore user update error:', {
              code: userError.code,
              message: userError.message,
            });
            throw new Error(
              userError.code === 'permission-denied'
                ? 'Insufficient permissions to update user profile.'
                : 'Failed to update user profile.'
            );
          }
        }

        try {
          await sendOrderConfirmationEmail(order);
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
              icon: <i className="bx bx-check-circle text-2xl"></i>,
            }
          );
          navigate('/order-confirmation', { state: { order } });
        } catch (e) {
          console.error('Error clearing cart:', e);
          toast.warn('Order placed, but failed to clear cart.', { position: 'top-right', autoClose: 3000 });
        }
      } catch (err) {
        console.error('Checkout error:', {
          message: err.message,
          stack: err.stack,
          code: err.code,
        });
        toast.error(err.message || 'Failed to place order.', { position: 'top-right', autoClose: 3000 });
      }
    },
    [cart, formData, totalNgn, totalGbp, navigate, belowMinimumPrice]
  );

  const handleCancel = () => {
    toast.info('Payment cancelled.', { position: 'top-right', autoClose: 3000 });
  };

  const handleImageClick = (itemId, url, index, currentIndex) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === itemId
          ? {
              ...item,
              currentImage: url,
              slideDirection: index > currentIndex ? 'right' : 'left',
            }
          : item
      )
    );
    console.log('Checkout item image updated:', url, 'Direction:', index > currentIndex ? 'right' : 'left');
  };

  const handleImageLoad = (productId) => {
    setImageLoading((prev) => ({ ...prev, [productId]: false }));
    console.log('Image loaded for productId:', productId);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Spinner />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  // Determine currency and amounts based on country
  const isStripe = formData.country === 'United Kingdom';
  const currency = isStripe ? 'GBP' : 'NGN';
  const subtotal = isStripe ? subtotalGbp : subtotalNgn;
  const tax = isStripe ? taxGbp : taxNgn;
  const shipping = isStripe ? shippingGbp : shippingNgn;
  const total = isStripe ? totalGbp : totalNgn;

  console.log('Currency:', currency, 'Total:', total);

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800">
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                  disabled={loading}
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
                      alt={item.product?.name || 'Unknown'}
                      className={`absolute w-full h-full object-cover rounded-lg ${
                        item.slideDirection === 'right' ? 'slide-in-right' : 'slide-in-left'
                      } ${imageLoading[item.productId] ? 'opacity-0' : 'opacity-100'}`}
                      onLoad={() => handleImageLoad(item.productId)}
                      onError={(e) => {
                        console.error('Checkout item image load error:', {
                          productId: item.productId,
                          imageUrl: e.target.src,
                          name: item.product?.name,
                          error: e.message || 'Unknown error',
                        });
                        setImageLoading((prev) => ({ ...prev, [item.productId]: false }));
                        e.target.src = 'https://res.cloudinary.com/demo/image/upload/v1/sample';
                      }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-800">
                      {item.product?.name || 'Unknown'}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {isStripe
                        ? `£${(item.product?.price * item.quantity * conversionRateGbp || 0).toLocaleString('en-GB', {
                            minimumFractionDigits: 2,
                          })}`
                        : `₦${(item.product?.price * item.quantity || 0).toLocaleString('en-NG', {
                            minimumFractionDigits: 2,
                          })}`}{' '}
                      (x{item.quantity})
                    </p>
                    {item.product?.imageUrls?.length > 1 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {item.product.imageUrls.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`${item.product?.name} ${index + 1}`}
                            className={`w-10 h-10 object-cover rounded border cursor-pointer ${
                              item.currentImage === url ? 'border-blue-500 border-2' : 'border-gray-300'
                            }`}
                            onClick={() =>
                              handleImageClick(
                                item.productId,
                                url,
                                index,
                                item.product.imageUrls.indexOf(item.currentImage)
                              )
                            }
                            onError={(e) => {
                              console.error('Checkout thumbnail image load error:', {
                                productId: item.productId,
                                imageUrl: e.target.src,
                                name: item.product?.name,
                                error: e.message || 'Unknown error',
                              });
                              e.target.src = 'https://res.cloudinary.com/demo/image/upload/v1/sample';
                            }}
                            onLoad={() => {
                              console.log('Checkout thumbnail image loaded successfully:', {
                                productId: item.productId,
                                imageUrl: url,
                                name: item.product?.name,
                              });
                            }}
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
              <img src={cards} alt="cards" />
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
                      {isStripe
                        ? `£${(item.product?.price * item.quantity * conversionRateGbp || 0).toLocaleString('en-GB', {
                            minimumFractionDigits: 2,
                          })}`
                        : `₦${(item.product?.price * item.quantity || 0).toLocaleString('en-NG', {
                            minimumFractionDigits: 2,
                          })}`}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    {isStripe
                      ? `£${subtotal.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                      : `₦${subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (7.5%)</span>
                  <span>
                    {isStripe
                      ? `£${tax.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                      : `₦${tax.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping {totalItems === 9 && formData.country === 'Nigeria' && <span className="text-green-600">(30% off)</span>}</span>
                  <span>
                    {isStripe
                      ? `£${shipping.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                      : `₦${shipping.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
                  <span>Grand Total</span>
                  <span>
                    {isStripe
                      ? `£${total.toLocaleString('en-GB', { minimumFractionDigits: 2 })}`
                      : `₦${total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}`}
                  </span>
                </div>
              </div>
              {belowMinimumPrice && (
                <p className="text-red-600 text-xs mt-2">
                  Total price must be at least ₦12,000 to proceed.
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
                        totalPrice={totalGbp}
                        formData={formData}
                        onSuccess={handlePaymentSuccess}
                        onCancel={handleCancel}
                      />
                    </Elements>
                  ) : formData.country === 'Nigeria' ? (
                    <PaystackCheckout
                      email={formData.email}
                      amount={totalNgn * 100} // Paystack expects kobo
                      onSuccess={handlePaymentSuccess}
                      onClose={handleCancel}
                      disabled={!formValidity.isValid || cart.length === 0 || loading || belowMinimumPrice}
                      buttonText="Pay Now"
                      className={`w-full py-3 px-4 rounded-lg text-white text-sm font-medium transition duration-200 shadow ${
                        !formValidity.isValid || cart.length === 0 || loading || belowMinimumPrice
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