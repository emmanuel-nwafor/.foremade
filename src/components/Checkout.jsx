import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { PaystackButton } from 'react-paystack';
import axios from 'axios';
import { toast } from 'react-toastify';
import {
  doc,
  setDoc,
  getDoc,
  addDoc,
  collection,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { clearCart, getCart } from '../utils/cartUtils';
import placeholder from '../assets/placeholder.png';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);
const customToastStyle = {
  background: '#1a202c',
  color: '#ffffff',
  borderRadius: '8px',
  border: '1px solid #2d3748',
};

const StripeCheckoutForm = ({ totalPrice, currency, formData, onSuccess, cart, feeConfig }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast.error('Stripe not loaded. Please try again.', { position: 'top-right', autoClose: 3000 });
      return;
    }

    setLoading(true);
    setIsProcessing(true);
    try {
      const amountInCents = Math.round(totalPrice * 100);
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const orderId = `order-${Date.now()}`;
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
                orderId,
                sellerId: cart[0]?.product?.sellerId || 'default-seller-id',
                handlingFee: feeConfig[cart[0]?.product?.category]?.handlingRate * totalPrice || 0,
                buyerProtectionFee: feeConfig[cart[0]?.product?.category]?.buyerProtectionRate * totalPrice || 0,
                taxFee: feeConfig[cart[0]?.product?.category]?.taxRate * totalPrice || 0,
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
            await onSuccess({ ...paymentIntent, orderId });
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
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4">
      <CardElement
        options={{
          style: {
            base: {
              fontSize: '16px',
              color: '#ffffff',
              '::placeholder': { color: '#a0aec0' },
            },
            invalid: { color: '#e53e3e' },
          },
        }}
      />
      <button
        type="submit"
        disabled={loading || isProcessing}
        className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-600"
      >
        {loading || isProcessing ? 'Processing...' : `Pay ${currency} ${totalPrice.toFixed(2)}`}
      </button>
    </form>
  );
};

const Checkout = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    postalCode: '',
    country: 'Nigeria',
    saveInfo: false,
  });
  const [formErrors, setFormErrors] = useState({});
  const [currency, setCurrency] = useState('NGN');
  const [totalAmount, setTotalAmount] = useState(0);
  const [subtotalNgn, setSubtotalNgn] = useState(0);
  const [isBelowMinimumPrice, setIsBelowMinimumPrice] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [adminBank, setAdminBank] = useState(null);
  const formRef = useRef(null);
  const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
  const conversionRateNgnToGbp = 0.0005;
  const feeConfig = {
    default: {
      handlingRate: 0.05, // Updated to 5%
      buyerProtectionRate: 0.02, // Updated to 2%
      taxRate: 0.075, // 7.5%
    },
  };

  const addDebugLog = useCallback(
    (log) => {
      if (debugMode) {
        setDebugLogs((prev) => [...prev, { ...log, timestamp: new Date().toISOString() }].slice(-50));
      }
    },
    [debugMode]
  );

  const validateForm = useCallback(() => {
    const errors = {};
    if (!formData.name) errors.name = 'Name is required';
    if (!formData.email || !/\S+@\S+\.\S+/.test(formData.email)) errors.email = 'Valid email is required';
    if (!formData.phone) errors.phone = 'Phone number is required';
    if (!formData.address) errors.address = 'Address is required';
    if (!formData.city) errors.city = 'City is required';
    if (!formData.postalCode) errors.postalCode = 'Postal code is required';
    if (!formData.country) errors.country = 'Country is required';
    return { isValid: Object.keys(errors).length === 0, errors };
  }, [formData]);

  const sendOrderConfirmationEmail = useCallback(
    async (order) => {
      try {
        setIsEmailSending(true);
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
        addDebugLog({ type: 'email_attempt', backendUrl });

        const payload = {
          orderId: order.id,
          email: order.shippingDetails?.email || formData.email || auth.currentUser?.email || '',
          items: (order.items || []).map((item) => ({
            productId: item.productId || 'unknown',
            name: item.name || 'Unknown Product',
            quantity: Number(item.quantity) || 1,
            price: Number(item.price) || 0,
            imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls : [placeholder],
          })),
          total: Number(order.totalAmount) || 0,
          currency: (order.currency || currency).toLowerCase(),
        };

        if (!payload.orderId) throw new Error('Order ID is missing');
        if (!payload.email || !/\S+@\S+\.\S+/.test(payload.email)) throw new Error('Invalid or missing email address');
        if (!payload.items.length) throw new Error('No items provided in the order');
        if (!payload.total || payload.total <= 0) throw new Error('Invalid or missing total amount');
        if (!['ngn', 'gbp'].includes(payload.currency)) throw new Error('Invalid currency');

        addDebugLog({ type: 'email_payload', data: payload });

        let attempts = 3;
        let lastError = null;

        while (attempts > 0) {
          try {
            const response = await axios.post(`${backendUrl}/send-order-confirmation`, payload, {
              timeout: 10000,
            });
            addDebugLog({ type: 'email_success', data: response.data });
            toast.success('Order confirmation email sent successfully!', {
              position: 'top-right',
              autoClose: 3000,
            });
            return;
          } catch (err) {
            lastError = err;
            attempts--;
            addDebugLog({ type: 'email_retry', error: err.message, attempts });
            if (err.response?.status === 404) {
              throw new Error('Order not found. Check server configuration.');
            }
            if (attempts === 0 || err.code !== 'ECONNABORTED') {
              throw err;
            }
            toast.warn(`Retrying email send (${attempts} attempts left)...`, {
              position: 'top-right',
              autoClose: 2000,
            });
            await new Promise((resolve) => setTimeout(resolve, 2000 * (3 - attempts)));
          }
        }
        throw lastError || new Error('Failed to send email after retries');
      } catch (err) {
        console.error('Email sending error:', {
          message: err.message,
          status: err.response?.status || 'unknown',
          response_data: err.response?.data || 'No response data',
        });
        addDebugLog({ type: 'email_error', data: err.message });
        toast.warn(
          'Order placed successfully, but failed to send confirmation email. Contact support@foremade.com.',
          {
            position: 'top-right',
            autoClose: 5000,
          }
        );
        if (debugMode) {
          toast.error(`Debug: Email send failed - ${err.message}`, {
            position: 'bottom-right',
            autoClose: 7000,
          });
        }
      } finally {
        setIsEmailSending(false);
      }
    },
    [formData.email, currency, debugMode, addDebugLog]
  );

  const handlePaymentSuccess = useCallback(
    async (paymentData = {}) => {
      try {
        if (cart.length === 0) {
          toast.error('Cart is empty.', { position: 'top-right', autoClose: 3000 });
          return;
        }
        const validation = validateForm();
        if (!validation.isValid) {
          setFormErrors(validation.errors);
          toast.error('Please fix form errors.', { position: 'top-right', autoClose: 3000 });
          formRef.current?.scrollIntoView({ behavior: 'smooth' });
          return;
        }
        if (isBelowMinimumPrice) {
          toast.error('Total amount must be at least ₦1,000.', { position: 'top-right', autoClose: 3000 });
          return;
        }

        addDebugLog({ type: 'payment_data', data: paymentData });
        const userId = auth.currentUser?.uid || 'anonymous';
        const orderId = paymentData?.orderId || `order-${Date.now()}`;
        const paymentGateway = formData.country === 'United Kingdom' ? 'Stripe' : 'Paystack';
        const paymentId = paymentData?.id || paymentData?.reference || `fallback-${orderId}`;

        const sellers = {};
        cart.forEach((item) => {
          const sellerId = item.product?.sellerId || 'default-seller-id';
          if (!sellerId) {
            throw new Error('Seller ID missing for item: ' + item.productId);
          }
          if (!sellers[sellerId]) sellers[sellerId] = [];
          sellers[sellerId].push(item);
        });

        const savedOrderIds = [];
        let lastOrder = null;

        if (!adminBank) {
          const adminDoc = await getDoc(doc(db, 'admins', 'admin123')); // Aligned with AdminBankSetup
          if (adminDoc.exists()) {
            setAdminBank(adminDoc.data());
          } else {
            throw new Error('Admin bank details not configured.');
          }
        }

        await runTransaction(db, async (transaction) => {
          const productRefs = cart.map((item) => doc(db, 'products', item.productId));
          const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)));

          const stockUpdates = [];
          productSnaps.forEach((snap, index) => {
            if (!snap.exists()) {
              console.warn(`Product ${cart[index].productId} does not exist.`);
              return;
            }
            const currentStock = snap.data().stock || 0;
            const requestedQuantity = cart[index].quantity || 0;
            const newStock = currentStock - requestedQuantity;
            if (newStock < 0) {
              throw new Error(`Insufficient stock for product ${cart[index].productId}`);
            }
            stockUpdates.push({ ref: productRefs[index], newStock });
          });

          const sellerWalletRefs = Object.keys(sellers).map((sellerId) => doc(db, 'wallets', sellerId));
          const sellerWalletSnaps = await Promise.all(sellerWalletRefs.map((ref) => transaction.get(ref)));
          const sellerWallets = sellerWalletSnaps.map((snap, index) => ({
            ref: sellerWalletRefs[index],
            exists: snap.exists(),
            data: snap.exists() ? snap.data() : null,
            sellerId: Object.keys(sellers)[index],
          }));

          const orders = [];
          sellerWallets.forEach(({ ref, exists, data, sellerId }) => {
            const sellerItems = sellers[sellerId];
            const sellerSubtotalNgn = sellerItems.reduce(
              (total, item) => total + ((item.product?.totalPrice || 0) * (item.quantity || 0)),
              0
            );
            const sellerSubtotal = currency === 'GBP' ? sellerSubtotalNgn * conversionRateNgnToGbp : sellerSubtotalNgn;

            const handlingFee = feeConfig[cart[0]?.product?.category]?.handlingRate * sellerSubtotal || 0;
            const buyerProtectionFee = feeConfig[cart[0]?.product?.category]?.buyerProtectionRate * sellerSubtotal || 0;
            const taxFee = feeConfig[cart[0]?.product?.category]?.taxRate * sellerSubtotal || 0;
            const totalFees = handlingFee + buyerProtectionFee + taxFee;
            const adminAmount = totalFees;
            const sellerAmount = sellerSubtotal - totalFees;

            const order = {
              id: orderId,
              userId,
              sellerId: sellerId,
              items: sellerItems.map((item) => ({
                productId: item.productId || 'unknown',
                quantity: item.quantity || 0,
                price: item.product?.totalPrice || 0,
                name: item.product?.name || 'Unknown',
                sellerId: item.product?.sellerId || sellerId,
                imageUrls: item.product?.imageUrls || [placeholder],
              })),
              totalAmount: sellerSubtotal,
              date: new Date().toISOString(),
              createdAt: serverTimestamp(),
              shippingDetails: formData,
              status: 'pending-approval',
              paymentGateway,
              paymentId,
              currency,
              adminAmount,
              sellerAmount,
            };
            const firestoreOrderId = `${orderId}-${sellerId}`;
            orders.push({ order, firestoreOrderId });
            savedOrderIds.push(firestoreOrderId);

            const availableBalance = (exists ? data?.availableBalance || 0 : 0) + sellerAmount; // Credit availableBalance
            transaction.set(
              ref,
              {
                availableBalance,
                pendingBalance: exists ? data?.pendingBalance || 0 : 0,
                updatedAt: serverTimestamp(),
                ...(exists ? {} : { createdAt: serverTimestamp() }),
              },
              { merge: true }
            );
          });

          orders.forEach(({ order, firestoreOrderId }) => {
            const orderRef = doc(db, 'orders', firestoreOrderId);
            transaction.set(orderRef, order);
            lastOrder = order;
          });

          stockUpdates.forEach(({ ref, newStock }) => {
            transaction.update(ref, { stock: newStock });
          });

          const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
          for (const { order } of orders) {
            const payload = {
              buyerId: userId,
              sellerId: order.sellerId,
              productId: order.items[0]?.productId || 'unknown',
              amount: order.totalAmount,
              transactionReference: order.paymentId,
              adminAmount: order.adminAmount,
              sellerAmount: order.sellerAmount,
            };
            await axios.post(`${backendUrl}/process-payment`, payload, { timeout: 15000 });
            await addDoc(collection(db, 'transactions'), {
              buyerId: order.userId,
              sellerId: order.sellerId,
              productId: order.items[0]?.productId || 'unknown',
              type: 'Sale',
              description: `Purchase of ${order.items[0]?.name || 'product'} - Fees to admin, earnings to seller`,
              amount: order.totalAmount,
              sellerAmount: order.sellerAmount,
              adminFees: order.adminAmount,
              status: 'Completed',
              createdAt: serverTimestamp(),
              reference: order.paymentId,
            });
          }
        });

        for (const firestoreOrderId of savedOrderIds) {
          const sellerId = firestoreOrderId.split('-').slice(-1)[0];
          const sellerItems = sellers[sellerId] || [];
          const sellerSubtotalNgn = sellerItems.reduce(
            (total, item) => total + ((item.product?.totalPrice || 0) * (item.quantity || 0)),
            0
          );
          const sellerSubtotal = currency === 'GBP' ? sellerSubtotalNgn * conversionRateNgnToGbp : sellerSubtotalNgn;
          const handlingFee = feeConfig[cart[0]?.product?.category]?.handlingRate * sellerSubtotal || 0;
          const buyerProtectionFee = feeConfig[cart[0]?.product?.category]?.buyerProtectionRate * sellerSubtotal || 0;
          const taxFee = feeConfig[cart[0]?.product?.category]?.taxRate * sellerSubtotal || 0;
          const adminAmount = handlingFee + buyerProtectionFee + taxFee;
          const sellerAmount = sellerSubtotal - adminAmount;

          await sendOrderConfirmationEmail({
            id: firestoreOrderId,
            userId,
            sellerId,
            items: sellerItems.map((item) => ({
              productId: item.productId || 'unknown',
              quantity: item.quantity || 0,
              price: item.product?.totalPrice || 0,
              name: item.product?.name || 'Unknown',
              sellerId: item.product?.sellerId || sellerId,
              imageUrls: item.product?.imageUrls || [placeholder],
            })),
            totalAmount: sellerSubtotal,
            date: new Date().toISOString(),
            createdAt: new Date(),
            shippingDetails: formData,
            status: 'pending-approval',
            paymentGateway,
            paymentId,
            currency,
            adminAmount,
            sellerAmount,
          });
        }

        if (auth.currentUser && formData.saveInfo) {
          await setDoc(doc(db, 'users', auth.currentUser.uid), formData, { merge: true });
        }

        await clearCart(auth.currentUser?.uid);
        setCart([]);

        toast.success(
          <div>
            <strong>Payment Successful!</strong>
            <p>Your order has been placed successfully. Check your email for confirmation.</p>
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
        console.error('Checkout error:', err);
        toast.error(err.message || 'Failed to place order. Please try again.', {
          position: 'top-right',
          autoClose: 3000,
        });
        if (debugMode) {
          toast.error(`Debug: ${err.message}`, { position: 'bottom-right', autoClose: 5000 });
        }
      } finally {
        setTimeout(() => {
          setShowConfirmModal(false);
        }, 1000);
      }
    },
    [
      cart,
      subtotalNgn,
      isBelowMinimumPrice,
      formData,
      currency,
      totalAmount,
      totalItems,
      navigate,
      debugMode,
      addDebugLog,
      validateForm,
      sendOrderConfirmationEmail,
      adminBank,
    ]
  );

  const PaystackCheckout = () => {
    const publicKey = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;
    const amountInKobo = totalAmount * 100;

    return (
      <PaystackButton
        email={formData.email}
        amount={amountInKobo}
        publicKey={publicKey}
        currency="NGN"
        onSuccess={(response) => {
          const orderId = `order-${Date.now()}`;
          handlePaymentSuccess({ reference: response.reference, orderId });
        }}
        onClose={() => {
          toast.error('Payment cancelled.', { position: 'top-right', autoClose: 3000 });
        }}
        className="mt-6 w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        text="Pay with Paystack"
      />
    );
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const userCart = await getCart(user?.uid);
        setCart(userCart);
        setSubtotalNgn(
          userCart.reduce(
            (total, item) => total + ((item.product?.totalPrice || 0) * (item.quantity || 0)),
            0
          )
        );
        setTotalItems(userCart.reduce((total, item) => total + (item.quantity || 0), 0));
        if (user) {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setFormData((prev) => ({ ...prev, ...userDoc.data() }));
          }
        }
      } catch (err) {
        console.error('Error loading data:', err);
        toast.error('Error loading checkout data.', { position: 'top-right', autoClose: 3000 });
      }
    };
    loadData();

    const fetchAdminBank = async () => {
      try {
        const adminDoc = await getDoc(doc(db, 'admins', 'admin123')); // Aligned with AdminBankSetup
        if (adminDoc.exists()) {
          setAdminBank(adminDoc.data());
        } else {
          toast.warn('Admin bank details not configured.', { position: 'top-right', autoClose: 5000 });
        }
      } catch (err) {
        console.error('Error fetching admin bank:', err);
        toast.error('Failed to fetch admin bank details.', { position: 'top-right', autoClose: 3000 });
      }
    };
    fetchAdminBank();
  }, [user]);

  useEffect(() => {
    const total = subtotalNgn * (currency === 'GBP' ? conversionRateNgnToGbp : 1);
    setTotalAmount(total);
    setIsBelowMinimumPrice(currency === 'NGN' && subtotalNgn < 1000);
  }, [subtotalNgn, currency]);

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: '' }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>
        <form ref={formRef} onSubmit={(e) => { e.preventDefault(); setShowConfirmModal(true); }}>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Information</h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block mb-1">Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="w-full bg-gray-800 text-white p-2 rounded"
                />
                {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
              </div>
              <div>
                <label className="block mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  className="w-full bg-gray-800 text-white p-2 rounded"
                />
                {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
              </div>
              <div>
                <label className="block mb-1">Phone</label>
                <input
                  type="text"
                  name="phone"
                  value={formData.phone}
                  onChange={handleFormChange}
                  className="w-full bg-gray-800 text-white p-2 rounded"
                />
                {formErrors.phone && <p className="text-red-500 text-sm">{formErrors.phone}</p>}
              </div>
              <div>
                <label className="block mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleFormChange}
                  className="w-full bg-gray-800 text-white p-2 rounded"
                />
                {formErrors.address && <p className="text-red-500 text-sm">{formErrors.address}</p>}
              </div>
              <div>
                <label className="block mb-1">City</label>
                <input
                  type="text"
                  name="city"
                  value={formData.city}
                  onChange={handleFormChange}
                  className="w-full bg-gray-800 text-white p-2 rounded"
                />
                {formErrors.city && <p className="text-red-500 text-sm">{formErrors.city}</p>}
              </div>
              <div>
                <label className="block mb-1">Postal Code</label>
                <input
                  type="text"
                  name="postalCode"
                  value={formData.postalCode}
                  onChange={handleFormChange}
                  className="w-full bg-gray-800 text-white p-2 rounded"
                />
                {formErrors.postalCode && <p className="text-red-500 text-sm">{formErrors.postalCode}</p>}
              </div>
              <div>
                <label className="block mb-1">Country</label>
                <select
                  name="country"
                  value={formData.country}
                  onChange={handleFormChange}
                  className="w-full bg-gray-800 text-white p-2 rounded"
                >
                  <option value="Nigeria">Nigeria</option>
                  <option value="United Kingdom">United Kingdom</option>
                </select>
                {formErrors.country && <p className="text-red-500 text-sm">{formErrors.country}</p>}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="saveInfo"
                  checked={formData.saveInfo}
                  onChange={handleFormChange}
                  className="mr-2"
                />
                <label>Save shipping info</label>
              </div>
            </div>
          </div>
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            {formData.country === 'United Kingdom' ? (
              <Elements stripe={stripePromise}>
                <StripeCheckoutForm
                  totalPrice={totalAmount}
                  currency={currency}
                  formData={formData}
                  onSuccess={handlePaymentSuccess}
                  cart={cart}
                  feeConfig={feeConfig}
                />
              </Elements>
            ) : (
              <PaystackCheckout />
            )}
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
            disabled={isEmailSending}
          >
            {isEmailSending ? 'Processing...' : 'Place Order'}
          </button>
        </form>
        {debugMode && (
          <div className="fixed bottom-4 right-4 bg-gray-800 p-4 rounded shadow-lg max-h-[500px] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Debug Logs</h3>
            {debugLogs.map((log, index) => (
              <pre key={index} className="text-sm text-gray-300">
                {JSON.stringify(log, null, 2)}
              </pre>
            ))}
          </div>
        )}
      </div>
      {showConfirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-gray-800 p-6 rounded-lg">
            <h2 className="text-xl font-bold mb-4">Confirm Payment</h2>
            <p className="mb-4">Total: {currency} {totalAmount.toFixed(2)}</p>
            <button
              onClick={() => handlePaymentSuccess()}
              className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
              disabled={isEmailSending}
            >
              {isEmailSending ? 'Processing...' : 'Confirm Payment'}
            </button>
            <button
              onClick={() => setShowConfirmModal(false)}
              className="ml-4 text-gray-500 hover:text-gray-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Checkout;