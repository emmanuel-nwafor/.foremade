import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import PropTypes from "prop-types";
import { auth, db } from "/src/firebase";
import {
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  serverTimestamp,
  runTransaction,
} from "firebase/firestore";
import { getCart, clearCart, updateCart } from "/src/utils/cartUtils";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, CardElement, useStripe, useElements } from "@stripe/react-stripe-js";
import axios from "axios";
import { toast } from "react-toastify";
import Spinner from "/src/components/common/Spinner";
import PaystackCheckout from "./PaystackCheckout";
import cards from "/src/assets/card.png";
import placeholder from "/src/assets/placeholder.png";
import "boxicons/css/boxicons.min.css";
import PriceFormatter from "/src/components/layout/PriceFormatter";

const customToastStyle = {
  background: "#22c55e",
  color: "#fff",
  fontWeight: "bold",
  borderRadius: "8px",
  padding: "16px",
};

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const preloadImage = (url, timeout = 5000) => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = url;
    img.onload = () => resolve(true);
    img.onerror = () => resolve(false);
    setTimeout(() => resolve(false), timeout);
  });
};

const ProgressBar = () => (
  <div className="flex justify-between mb-8" role="progressbar" aria-label="Checkout progress">
    {["Cart", "Shipping", "Payment", "Confirmation"].map((step, index) => (
      <div key={step} className="flex-1 text-center">
        <div
          className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
            index < 2 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
          }`}
          aria-current={index < 2 ? "step" : undefined}
        >
          {index + 1}
        </div>
        <p className="text-sm mt-2 text-gray-600">{step}</p>
      </div>
    ))}
  </div>
);

const ConfirmationModal = ({ isOpen, onConfirm, onCancel }) =>
  isOpen && (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" role="dialog" aria-modal="true" aria-label="Order confirmation">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-800">Confirm Order</h3>
          <i className="bx bx-loader bx-spin text-3xl" aria-hidden="true"></i>
        </div>
        <p className="text-sm text-gray-600 mb-6">Are you sure you want to place this order and clear your cart?</p>
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            aria-label="Confirm order"
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
            aria-label="Cancel order"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onConfirm: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
};

const StripeCheckoutForm = ({ totalPrice, formData, onSuccess, onCancel, currency, setIsProcessing }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast.error("Stripe not loaded. Please try again.", { position: "top-right", autoClose: 3000 });
      return;
    }

    setLoading(true);
    setIsProcessing(true);
    try {
      const amountInCents = Math.round(totalPrice * 100);
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const { data } = await axios.post(
        `${backendUrl}/create-payment-intent`,
        {
          amount: amountInCents,
          currency: currency.toLowerCase(),
          metadata: { userId: auth.currentUser?.uid || "anonymous", orderId: `order-${Date.now()}` },
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
              country: currency === "GBP" ? "GB" : "NG",
            },
          },
        },
      });

      if (stripeError) {
        toast.error(stripeError.message, { position: "top-right", autoClose: 3000 });
        return;
      }

      if (paymentIntent.status === "succeeded") {
        await onSuccess(paymentIntent);
      }
    } catch (err) {
      console.error("Stripe payment error:", { message: err.message, code: err.code });
      toast.error(err.code === "ECONNABORTED" ? "Payment timed out." : "Payment failed.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">Card Details</label>
        <CardElement
          options={{
            style: {
              base: { fontSize: "16px", color: "#424770", "::placeholder": { color: "#aab7c4" } },
              invalid: { color: "#9e2146" },
            },
          }}
          className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || !stripe || !elements}
          className={`flex-1 py-3 px-4 rounded-lg text-white text-sm font-medium transition duration-200 shadow transform hover:scale-105 ${
            loading || !stripe || !elements ? "bg-gray-400 cursor-not-allowed" : "bg-[#112d4e] hover:bg-[#0e2740]"
          }`}
          aria-label="Checkout with Stripe"
        >
          {loading ? "Processing..." : `Pay ${currency} ${totalPrice.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition text-sm disabled:opacity-50 transform hover:scale-105"
          aria-label="Cancel payment"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

StripeCheckoutForm.propTypes = {
  totalPrice: PropTypes.number.isRequired,
  formData: PropTypes.object.isRequired,
  onSuccess: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  currency: PropTypes.string.isRequired,
  setIsProcessing: PropTypes.func.isRequired,
};

const Checkout = () => {
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loadingState, setLoadingState] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("checkoutFormData");
    return saved
      ? JSON.parse(saved)
      : { name: "", email: "", address: "", city: "", postalCode: "", country: "Nigeria", phone: "", saveInfo: false };
  });
  const [imageLoading, setImageLoading] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [feeConfig, setFeeConfig] = useState({});
  const [formErrors, setFormErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isEmailSending, setIsEmailSending] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(null);
  const [minimumPurchase, setMinimumPurchase] = useState(25000);
  const formRef = useRef(null);
  const debugMode = import.meta.env.VITE_DEBUG_MODE === "true";

  useEffect(() => {
    localStorage.setItem("checkoutFormData", JSON.stringify(formData));
  }, [formData]);

  const processCartItem = async (item, feeConfig) => {
    if (!item.productId || !item.product) return null;

    const productData = item.product;
    let imageUrls = Array.isArray(productData.imageUrls)
      ? productData.imageUrls.filter((url) => typeof url === "string" && url.match(/^https?:\/\/.+/i))
      : [productData.imageUrl].filter((url) => typeof url === "string" && url.match(/^https?:\/\/.+/i));

    const validImageUrls = await Promise.all(imageUrls.map((url) => preloadImage(url)));
    let filteredImageUrls = imageUrls.filter((_, index) => validImageUrls[index]);

    if (filteredImageUrls.length === 0) {
      filteredImageUrls = [placeholder];
      setImageErrors((prev) => ({ ...prev, [item.productId]: true }));
    }

    const productRef = doc(db, "products", item.productId);
    const productSnap = await getDoc(productRef);
    const category = productSnap.exists() ? productSnap.data().category || "default" : "default";
    const sellerId = productSnap.exists() ? productSnap.data().sellerId : "default-seller-id";
    const stock = productSnap.exists() ? productSnap.data().stock || 10 : 10;

    const config = feeConfig[category] || { minPrice: 1000, maxPrice: Infinity, buyerProtectionRate: 0.08, handlingRate: 0.20 };
    const basePrice = productData.price || 0;
    const totalPrice = basePrice + basePrice * config.buyerProtectionRate + basePrice * config.handlingRate;

    return {
      ...item,
      product: { ...productData, imageUrls: filteredImageUrls, category, sellerId, totalPrice, stock },
      currentImage: filteredImageUrls[0],
      slideDirection: "right",
    };
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingState(true);
        const user = auth.currentUser;

        const minRef = doc(db, "settings", "minimumPurchase");
        const minSnap = await getDoc(minRef);
        if (minSnap.exists()) setMinimumPurchase(minSnap.data().amount || 25000);

        const feeRef = doc(db, "feeConfigurations", "categoryFees");
        const feeSnap = await getDoc(feeRef);
        const fees = feeSnap.exists() ? feeSnap.data() : {};
        setFeeConfig(fees);

        const cartItems = await getCart(user?.uid);
        const processedCart = await Promise.all(cartItems.map((item) => processCartItem(item, fees)));
        const validCart = processedCart.filter((item) => item !== null);
        setCart(validCart);
        setImageLoading(validCart.reduce((acc, item) => ({ ...acc, [item.productId]: true }), {}));

        if (user) {
          const userDocRef = doc(db, "users", user.uid);
          const userDocSnap = await getDoc(userDocRef);
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            setFormData((prev) => ({
              ...prev,
              name: userData.name || user.displayName || prev.name,
              email: userData.email || user.email || prev.email,
              address: userData.address || prev.address,
              city: userData.city || prev.city,
              postalCode: userData.postalCode || prev.postalCode,
              country: userData.country || prev.country,
              phone: userData.phone || prev.phone,
            }));
          }
        }
      } catch (err) {
        console.error("Error loading data:", err);
        setCart([]);
        toast.error("Failed to load data.", { position: "top-right", autoClose: 3000 });
      } finally {
        setLoadingState(false);
      }
    };

    const handleCartUpdate = () => {
      loadData();
    };

    const startSessionTimeout = () => {
      clearTimeout(sessionTimeout);
      const timeout = setTimeout(() => {
        toast.warn("Session inactive. Please refresh or log in again.", { position: "top-right", autoClose: 5000 });
        navigate("/login");
      }, 30 * 60 * 1000);
      setSessionTimeout(timeout);
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("mousemove", startSessionTimeout);
    window.addEventListener("keydown", startSessionTimeout);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      loadData();
      startSessionTimeout();
    });

    return () => {
      unsubscribe();
      window.removeEventListener("cartUpdated", handleCartUpdate);
      window.removeEventListener("mousemove", startSessionTimeout);
      window.removeEventListener("keydown", startSessionTimeout);
      clearTimeout(sessionTimeout);
    };
  }, []);

  const updateQuantity = async (productId, newQuantity) => {
    try {
      const user = auth.currentUser;
      const updatedCart = cart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: Math.max(1, Math.min(newQuantity, item.product.stock || 10)) }
          : item
      );
      await updateCart(user?.uid, updatedCart);
      setCart(updatedCart);
      toast.info("Quantity updated.", { position: "top-right", autoClose: 2000 });
    } catch (err) {
      console.error("Error updating quantity:", err);
      toast.error("Failed to update quantity.", { position: "top-right", autoClose: 3000 });
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const subtotalNgn = cart.reduce(
    (total, item) => total + (item.product?.totalPrice || 0) * (item.quantity || 0),
    0
  );
  const currency = formData.country === "United Kingdom" ? "GBP" : "NGN";
  const conversionRateNgnToGbp = 0.00048;
  const totalAmount = currency === "GBP" ? subtotalNgn * conversionRateNgnToGbp : subtotalNgn;
  const belowMinimumPrice = subtotalNgn < minimumPurchase;

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "country" && value !== formData.country) {
      toast.info(`Currency will change to ${value === "United Kingdom" ? "GBP" : "NGN"}.`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const validateForm = useMemo(
    () => () => {
      const errors = {};
      const { name, email, address, city, postalCode, country, phone } = formData;
      if (!name) errors.name = "Full name is required.";
      if (!email) errors.email = "Email is required.";
      else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Invalid email address.";
      if (!phone) errors.phone = "Phone number is required.";
      if (!address) errors.address = "Address is required.";
      if (!city) errors.city = "City is required.";
      if (!postalCode) errors.postalCode = "Postal code is required.";
      if (!["Nigeria", "United Kingdom"].includes(country)) errors.country = "Select Nigeria or United Kingdom.";
      return { isValid: Object.keys(errors).length === 0, errors };
    },
    [formData]
  );

  const sendOrderConfirmationEmail = async (order) => {
    try {
      setIsEmailSending(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      const payload = {
        orderId: order.paymentId || `fallback-${Date.now()}`,
        email: order.shippingDetails?.email || formData.email,
        items: (order.items || []).map((item) => ({
          productId: item.productId || "unknown",
          quantity: item.quantity || 1,
          price: item.price || 0,
          name: item.name || "Unknown Product",
          sellerId: item.sellerId || "unknown",
          imageUrls: Array.isArray(item.imageUrls) ? item.imageUrls : [placeholder],
        })),
        total: order.totalAmount || 0,
        currency: order.currency || currency,
        shippingDetails: {
          name: order.shippingDetails?.name || formData.name || "Unknown",
          address: order.shippingDetails?.address || formData.address || "Unknown",
          city: order.shippingDetails?.city || formData.city || "",
          postalCode: order.shippingDetails?.postalCode || formData.postalCode || "",
          country: order.shippingDetails?.country || formData.country || "",
          phone: order.shippingDetails?.phone || formData.phone || "",
        },
      };

      if (!payload.email || !/\S+@\S+\.\S+/.test(payload.email)) throw new Error("Invalid or missing email address");
      if (!payload.items.length) throw new Error("No items provided");

      await axios.post(`${backendUrl}/send-order-confirmation`, payload, { timeout: 10000 });
    } catch (err) {
      console.error("Error sending order confirmation email:", err);
      toast.warn("Order placed, but failed to send confirmation email.", { position: "top-right", autoClose: 5000 });
    } finally {
      setIsEmailSending(false);
    }
  };

  const sendSellerOrderNotifications = async (sellers, sellerOrderIds, currency, shippingDetails) => {
    try {
      setIsEmailSending(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      for (const [sellerId, items] of Object.entries(sellers)) {
        const sellerOrderId = sellerOrderIds.find((id) => id.includes(sellerId)) || `order-${Date.now()}-${sellerId}`;
        const sellerSubtotal = items.reduce(
          (total, item) => total + (item.product?.totalPrice || 0) * (item.quantity || 0),
          0
        );
        const totalAmount = currency === "GBP" ? sellerSubtotal * conversionRateNgnToGbp : sellerSubtotal;

        const payload = {
          orderId: sellerOrderId,
          sellerId,
          items: items.map((item) => ({
            productId: item.productId || "unknown",
            quantity: item.quantity || 1,
            price: item.product?.totalPrice || 0,
            name: item.product?.name || "Unknown Product",
            imageUrls: Array.isArray(item.product?.imageUrls) ? item.product.imageUrls : [placeholder],
          })),
          total: totalAmount,
          currency,
          shippingDetails: {
            name: shippingDetails.name || "Unknown",
            address: shippingDetails.address || "Unknown",
            city: shippingDetails.city || "",
            postalCode: shippingDetails.postalCode || "",
            country: shippingDetails.country || "",
            phone: shippingDetails.phone || "",
          },
        };

        await axios.post(`${backendUrl}/send-seller-order-notification`, payload, { timeout: 10000 });
      }
    } catch (err) {
      console.error("Error sending seller notifications:", err);
      toast.warn("Order placed, but failed to notify some sellers.", { position: "top-right", autoClose: 5000 });
    } finally {
      setIsEmailSending(false);
    }
  };

  const handlePaymentSuccess = useCallback(
    async (paymentData) => {
      try {
        if (cart.length === 0) {
          toast.error("Cart is empty.", { position: "top-right", autoClose: 3000 });
          return;
        }
        const validation = validateForm();
        if (!validation.isValid) {
          setFormErrors(validation.errors);
          toast.error("Please fix form errors.", { position: "top-right", autoClose: 3000 });
          formRef.current.scrollIntoView({ behavior: "smooth" });
          return;
        }

        const userId = auth.currentUser?.uid || "anonymous";
        const orderId = `order-${Date.now()}`;
        const paymentGateway = formData.country === "United Kingdom" ? "Stripe" : "Paystack";
        const paymentId = paymentData?.id || paymentData?.reference || `fallback-${orderId}`;

        const sellers = {};
        cart.forEach((item) => {
          const sellerId = item.product?.sellerId || "default-seller-id";
          if (!sellers[sellerId]) sellers[sellerId] = [];
          sellers[sellerId].push(item);
        });

        let lastOrder = null;
        const sellerOrderIds = [];

        await runTransaction(db, async (transaction) => {
          const productRefs = cart.map((item) => doc(db, "products", item.productId));
          const productSnaps = await Promise.all(productRefs.map((ref) => transaction.get(ref)));

          const stockUpdates = [];
          productSnaps.forEach((snap, index) => {
            if (!snap.exists()) return;
            const currentStock = snap.data().stock || 0;
            const requestedQuantity = cart[index].quantity || 0;
            const newStock = currentStock - requestedQuantity;
            if (newStock < 0) throw new Error(`Insufficient stock for product ${cart[index].productId}`);
            stockUpdates.push({ ref: productRefs[index], newStock });
          });

          for (const [sellerId, items] of Object.entries(sellers)) {
            const sellerOrderId = `${orderId}-${sellerId}`;
            const sellerSubtotalNgn = items.reduce(
              (total, item) => total + (item.product?.totalPrice || 0) * (item.quantity || 0),
              0
            );
            const sellerShare = currency === "GBP" ? sellerSubtotalNgn * conversionRateNgnToGbp : sellerSubtotalNgn;

            const order = {
              id: orderId,
              userId,
              sellerId,
              items: items.map((item) => ({
                productId: item.productId || "unknown",
                quantity: item.quantity || 0,
                price: item.product?.totalPrice || 0,
                name: item.product?.name || "Unknown",
                sellerId: item.product?.sellerId || sellerId,
                imageUrls: item.product?.imageUrls || [placeholder],
              })),
              totalAmount: sellerShare,
              date: new Date().toISOString(),
              createdAt: serverTimestamp(),
              shippingDetails: formData,
              status: "pending-approval",
              paymentGateway,
              paymentId,
              currency,
            };
            sellerOrderIds.push(sellerOrderId);
            transaction.set(doc(db, "orders", sellerOrderId), order);
            lastOrder = order;

            const walletRef = doc(db, "wallets", sellerId);
            const walletSnap = await transaction.get(walletRef);
            const pendingBalance = (walletSnap.exists() ? walletSnap.data().pendingBalance || 0 : 0) + sellerShare;
            transaction.set(
              walletRef,
              {
                availableBalance: walletSnap.exists() ? walletSnap.data().availableBalance || 0 : 0,
                pendingBalance,
                updatedAt: serverTimestamp(),
                ...(walletSnap.exists() ? {} : { createdAt: serverTimestamp() }),
              },
              { merge: true }
            );
          }

          stockUpdates.forEach(({ ref, newStock }) => {
            transaction.update(ref, { stock: newStock });
          });

          await Promise.all(
            Object.keys(sellers).map((sellerId) =>
              addDoc(collection(db, "transactions"), {
                userId: sellerId,
                type: "Sale",
                description: `Sale from order ${orderId}`,
                amount: sellers[sellerId].reduce(
                  (total, item) => total + (item.product?.totalPrice || 0) * (item.quantity || 0),
                  0
                ),
                date: new Date().toISOString().split("T")[0],
                status: "Pending",
                createdAt: serverTimestamp(),
                reference: paymentId,
              })
            )
          );
        });

        if (auth.currentUser && formData.saveInfo) {
          await setDoc(doc(db, "users", auth.currentUser.uid), formData, { merge: true });
        }

        if (lastOrder && sellerOrderIds.length > 0) {
          await sendOrderConfirmationEmail({
            ...lastOrder,
            paymentId: sellerOrderIds[0],
            items: cart.map((item) => ({
              productId: item.productId || "unknown",
              quantity: item.quantity || 0,
              price: item.product?.totalPrice || 0,
              name: item.product?.name || "Unknown",
              sellerId: item.product?.sellerId || "unknown",
              imageUrls: item.product?.imageUrls || [placeholder],
            })),
          });
        }

        await sendSellerOrderNotifications(sellers, sellerOrderIds, currency, formData);
        await clearCart(auth.currentUser?.uid);
        setCart([]);

        toast.success(
          <div>
            <strong>Payment Successful!</strong>
            <p>Your order has been placed. Check your email for confirmation.</p>
          </div>,
          { position: "top-right", autoClose: 5000, style: customToastStyle, icon: <i className="bx bx-check-circle text-blue-500 text-xl" /> }
        );
        navigate("/order-confirmation", { state: { order: { ...lastOrder, items: cart } } });
      } catch (err) {
        console.error("Checkout error:", err);
        toast.error(err.message || "Failed to place order.", { position: "top-right", autoClose: 3000 });
      } finally {
        setShowConfirmModal(false);
      }
    },
    [cart, formData, currency, navigate]
  );

  const handleCancel = () => {
    toast.info("Payment cancelled.", { position: "top-right", autoClose: 3000 });
    setShowConfirmModal(false);
  };

  const handleImageClick = (itemId, url, index, currentIndex) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === itemId
          ? { ...item, currentImage: url, slideDirection: index > currentIndex ? "right" : "left" }
          : item
      )
    );
  };

  const handleImageLoad = (productId, isThumbnail) => {
    setImageLoading((prev) => ({ ...prev, [productId]: isThumbnail ? prev[productId] : false }));
    setImageErrors((prev) => ({ ...prev, [productId]: false }));
  };

  const handleImageError = (e, productId) => {
    setImageLoading((prev) => ({ ...prev, [productId]: false }));
    setImageErrors((prev) => ({ ...prev, [productId]: true }));
    e.target.src = placeholder;
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
    <div className="container mx-auto px-4 py-8 relative mb-20">
      {(isProcessing || isEmailSending) && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40" aria-live="polite">
          <Spinner />
          <p className="text-white ml-4">{isEmailSending ? "Sending confirmation email..." : "Processing payment..."}</p>
        </div>
      )}
      <style>
        {`
          @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          @keyframes slideInLeft { from { transform: translateX(-100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
          .slide-in-right { animation: slideInRight 0.3s ease-in-out forwards; }
          .slide-in-left { animation: slideInLeft 0.3s ease-in-out forwards; }
          .image-zoom:hover { transform: scale(1.05); transition: transform 0.3s ease; }
        `}
      </style>
      <ProgressBar />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <i className="bx bx-cart text-blue-600" aria-hidden="true" />
          Checkout
        </h1>
        <Link to="/cart" className="text-blue-600 hover:underline text-sm flex items-center gap-1" aria-label="Back to Cart">
          <i className="bx bx-arrow-back" aria-hidden="true" />
          Back to Cart
        </Link>
      </div>
      {cart.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Your cart is empty. <Link to="/products" className="text-blue-600 hover:underline">Continue shopping</Link>
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white p-6 rounded-lg shadow-md" ref={formRef}>
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="bx bx-home text-blue-600" aria-hidden="true" />
              Shipping Details
            </h2>
            <form className="space-y-4">
              {[
                { id: "name", label: "Full Name", type: "text", icon: "bx-user" },
                { id: "email", label: "Email", type: "email", icon: "bx-envelope" },
                { id: "phone", label: "Phone", type: "text", icon: "bx-phone" },
                { id: "address", label: "Address", type: "text", icon: "bx-map" },
                { id: "city", label: "City", type: "text", icon: "bx-city" },
                { id: "postalCode", label: "Postal Code", type: "text", icon: "bx-mail-send" },
              ].map(({ id, label, type, icon }) => (
                <div key={id}>
                  <label htmlFor={id} className="block text-sm font-medium text-gray-700">
                    {label} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <i className={`bx ${icon} absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400`} aria-hidden="true"></i>
                    <input
                      type={type}
                      id={id}
                      name={id}
                      value={formData[id]}
                      onChange={handleInputChange}
                      className={`mt-1 w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        formErrors[id] ? "border-red-500" : "border-gray-300"
                      }`}
                      required
                      disabled={loadingState}
                      aria-invalid={!!formErrors[id]}
                      aria-describedby={formErrors[id] ? `${id}-error` : undefined}
                    />
                  </div>
                  {formErrors[id] && (
                    <p id={`${id}-error`} className="text-red-600 text-xs mt-1">
                      {formErrors[id]}
                    </p>
                  )}
                </div>
              ))}
              <div>
                <label htmlFor="country" className="block text-sm font-medium text-gray-700">
                  Country <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <i className="bx bx-world absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" aria-hidden="true"></i>
                  <select
                    id="country"
                    name="country"
                    value={formData.country}
                    onChange={handleInputChange}
                    className={`mt-1 w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formErrors.country ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                    disabled={loadingState}
                    aria-invalid={!!formErrors.country}
                    aria-describedby={formErrors.country ? "country-error" : undefined}
                  >
                    <option value="">Select a country</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>
                {formErrors.country && (
                  <p id="country-error" className="text-red-600 text-xs mt-1">{formErrors.country}</p>
                )}
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="saveInfo"
                  name="saveInfo"
                  checked={formData.saveInfo}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  disabled={loadingState}
                />
                <label htmlFor="saveInfo" className="ml-2 text-sm text-gray-600">
                  Save shipping information for future purchases
                </label>
              </div>
            </form>
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <i className="bx bx-package text-blue-600" aria-hidden="true" />
                Cart Items
                <span className="ml-2 text-xs text-gray-500 cursor-help relative group" aria-label="Prices include fees">
                  <i className="bx bx-info-circle" aria-hidden="true" />
                  <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg p-2 -top-10 left-0 w-48 z-10">
                    Prices include buyer protection and handling fees.
                  </span>
                </span>
              </h2>
              {cart.map((item) => (
                <div key={item.productId} className="flex items-start gap-4 mb-4 border-b pb-4">
                  <div className="w-24 h-24 relative overflow-hidden rounded-lg image-zoom">
                    {imageLoading[item.productId] && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
                        <Spinner size="small" />
                      </div>
                    )}
                    <img
                      src={item.currentImage || placeholder}
                      alt={item.product?.name || "Product Image"}
                      className={`absolute w-full h-full object-cover ${
                        item.slideDirection === "right" ? "slide-in-right" : "slide-in-left"
                      } ${imageLoading[item.productId] || imageErrors[item.productId] ? "opacity-50" : "opacity-100"}`}
                      onLoad={() => handleImageLoad(item.productId, false)}
                      onError={(e) => handleImageError(e, item.productId)}
                      loading="lazy"
                    />
                    {imageErrors[item.productId] && (
                      <div className="absolute bottom-0 left-0 bg-red-600 text-white text-xs px-1 rounded">Image Failed</div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-800">{item.product?.name || "Unknown"}</h3>
                    <p className="text-sm text-gray-600">
                      <PriceFormatter price={(item.product?.totalPrice || 0) * (item.quantity || 0)} currency={currency} />
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <label htmlFor={`quantity-${item.productId}`} className="text-sm text-gray-600">
                        Qty:
                      </label>
                      <input
                        type="number"
                        id={`quantity-${item.productId}`}
                        value={item.quantity || 1}
                        onChange={(e) => updateQuantity(item.productId, parseInt(e.target.value))}
                        min="1"
                        max={item.product?.stock || 10}
                        className="w-16 p-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        aria-label={`Quantity for ${item.product?.name || "Unknown"}`}
                      />
                    </div>
                    {item.product?.imageUrls?.length > 1 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {item.product.imageUrls.map((url, index) => (
                          <img
                            key={`${item.productId}-${index}`}
                            src={url}
                            alt={`${item.product?.name || "Unknown"} ${index + 1}`}
                            className={`w-10 h-10 object-cover rounded border cursor-pointer ${
                              item.currentImage === url ? "border-blue-500 border-2" : "border-gray-300"
                            } ${imageLoading[item.productId] || imageErrors[item.productId] ? "opacity-50" : "opacity-100"}`}
                            onClick={() => handleImageClick(item.productId, url, index, item.product.imageUrls.indexOf(item.currentImage))}
                            onLoad={() => handleImageLoad(item.productId, true)}
                            onError={(e) => handleImageError(e, item.productId)}
                            loading="lazy"
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
            <div className="p-6 bg-white rounded-lg shadow-md sticky top-4">
              <img src={cards} alt="Accepted payment cards" className="mb-6 w-auto h-8" />
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <i className="bx bx-receipt text-blue-600" aria-hidden="true" />
                Order Summary
              </h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Items</span>
                  <span>{totalItems}</span>
                </div>
                {cart.map((item) => (
                  <div key={item.productId} className="flex justify-between">
                    <span className="truncate w-2/3">{item.product?.name || "Unknown"} (x{item.quantity || 0})</span>
                    <span>
                      <PriceFormatter price={(item.product?.totalPrice || 0) * (item.quantity || 0)} currency={currency} />
                    </span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    <PriceFormatter price={subtotalNgn} currency={currency} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full">Free</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
                  <span>Grand Total</span>
                  <span>
                    <PriceFormatter price={subtotalNgn} currency={currency} />
                  </span>
                </div>
              </div>
              {belowMinimumPrice && (
                <p className="text-yellow-600 text-xs mt-2 bg-yellow-50 p-2 rounded">
                  ⚠️ Note: Total is below the recommended minimum of ₦{minimumPurchase.toLocaleString("en-NG")}.
                </p>
              )}
              <div className="mt-6 border-t pt-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="bx bx-home text-blue-600" aria-hidden="true" />
                  Shipping Information
                </h2>
                <div className="space-y-2 text-sm text-gray-600">
                  <p><strong>Name:</strong> {formData.name || "Not provided"}</p>
                  <p><strong>Email:</strong> {formData.email || "Not provided"}</p>
                  <p><strong>Phone:</strong> {formData.phone || "Not provided"}</p>
                  <p><strong>Address:</strong> {formData.address || "Not provided"}</p>
                  <p><strong>City:</strong> {formData.city || "Not provided"}</p>
                  <p><strong>Postal Code:</strong> {formData.postalCode || "Not provided"}</p>
                  <p><strong>Country:</strong> {formData.country || "Not provided"}</p>
                </div>
              </div>
              {isAuthenticated && validateForm().isValid && cart.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <i className="bx bx-credit-card text-blue-600" aria-hidden="true" />
                    Payment Details
                  </h2>
                  {formData.country === "United Kingdom" ? (
                    <Elements stripe={stripePromise}>
                      <StripeCheckoutForm
                        totalPrice={totalAmount}
                        formData={formData}
                        onSuccess={(paymentIntent) => setShowConfirmModal(true)}
                        onCancel={handleCancel}
                        currency={currency}
                        setIsProcessing={setIsProcessing}
                      />
                    </Elements>
                  ) : formData.country === "Nigeria" ? (
                    <PaystackCheckout
                      email={formData.email}
                      amount={subtotalNgn * 100}
                      onSuccess={(paymentData) => setShowConfirmModal(true)}
                      onClose={handleCancel}
                      disabled={!validateForm().isValid || cart.length === 0 || loadingState}
                      buttonText="Complete Purchase"
                      className={`w-full py-3 px-4 rounded-lg text-white text-sm font-medium transition duration-200 shadow transform hover:scale-105 ${
                        !validateForm().isValid || cart.length === 0 || loadingState
                          ? "bg-gray-400 cursor-not-allowed"
                          : "bg-[#112d4e] hover:bg-[#0e2740]"
                      }`}
                      iconClass="bx bx-cart mr-2"
                      sellerId={cart[0]?.product?.sellerId || "default-seller-id"}
                    />
                  ) : (
                    <p className="text-red-600 text-sm">Please select a valid country.</p>
                  )}
                </div>
              )}
              {!isAuthenticated && (
                <div className="mt-4 text-sm text-red-600">
                  Please <Link to="/login" className="text-blue-600 hover:underline">log in</Link> to proceed with payment.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal isOpen={showConfirmModal} onConfirm={handlePaymentSuccess} onCancel={handleCancel} />
      {debugMode && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white p-4 rounded-lg shadow-lg max-h-96 overflow-y-auto">
          <h3 className="font-bold mb-2">Debug Logs</h3>
          <pre>{JSON.stringify({ cart, formData, formErrors, imageLoading, imageErrors, minimumPurchase }, null, 2)}</pre>
        </div>
      )}
    </div>
  );
};

export default Checkout;