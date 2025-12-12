import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Link, useNavigate } from "react-router-dom";
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
import {
  Elements,
  CardElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import axios from "axios";
import { toast } from "react-toastify";
import Spinner from "/src/components/common/Spinner";
import PaystackCheckout from "./PaystackCheckout";
import cards from "/src/assets/card.png";
import placeholder from "/src/assets/placeholder.png";
import { useCurrency } from "/src/CurrencyContext";
import PriceFormatter from "/src/components/layout/PriceFormatter";
import "boxicons/css/boxicons.min.css";

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
  <div className="flex justify-between mb-8">
    {["Cart", "Shipping", "Payment", "Confirmation"].map((step, index) => (
      <div key={step} className="flex-1 text-center">
        <div
          className={`w-8 h-8 mx-auto rounded-full flex items-center justify-center ${
            index < 2 ? "bg-blue-600 text-white" : "bg-gray-300 text-gray-600"
          }`}
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-sm w-full">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Confirm Order
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Are you sure you want to place this order and clear your cart?
        </p>
        <div className="flex gap-4">
          <button
            onClick={onConfirm}
            className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-100 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

const StripeCheckoutForm = ({
  totalPrice,
  formData,
  onSuccess,
  onCancel,
  currency,
  setIsProcessing,
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      toast.error("Stripe not loaded. Please try again.", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);
    setIsProcessing(true);
    try {
      const amountInCents = Math.round(totalPrice * 100);
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
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
                userId: auth.currentUser?.uid || "anonymous",
                orderId: `order-${Date.now()}`,
              },
            },
            { timeout: 15000 }
          );

          const { error: stripeError, paymentIntent } =
            await stripe.confirmCardPayment(data.clientSecret, {
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
            toast.error(stripeError.message, {
              position: "top-right",
              autoClose: 3000,
            });
            return;
          }

          if (paymentIntent.status === "succeeded") {
            await onSuccess(paymentIntent);
            setLoading(false);
            setIsProcessing(false);
            return;
          }
        } catch (err) {
          lastError = err;
          attempts--;
          if (err.code !== "ECONNABORTED" || attempts === 0) {
            throw err;
          }
          toast.warn(`Retrying payment (${attempts} attempts left)...`, {
            position: "top-right",
            autoClose: 2000,
          });
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
      throw lastError || new Error("Payment failed after retries.");
    } catch (err) {
      console.error("Stripe payment error:", {
        message: err.message,
        code: err.code,
        response: err.response?.data,
      });
      console.log("Logging to Sentry:", err);
      toast.error(
        err.code === "ECONNABORTED"
          ? "Payment timed out. Please try again or check your connection."
          : err.message || "Payment failed. Try again.",
        { position: "top-right", autoClose: 3000 }
      );
      setLoading(false);
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Card Details
        </label>
        <CardElement
          options={{
            style: {
              base: {
                fontSize: "16px",
                color: "#424770",
                "::placeholder": { color: "#aab7c4" },
              },
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
            loading || !stripe || !elements
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-[#112d4e] hover:bg-[#0e2740]"
          }`}
          aria-label="CheckOut"
        >
          {loading
            ? "Processing..."
            : `Pay <PriceFormatter price={totalPrice} />`}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={loading}
          className="px-4 py-3 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition text-sm disabled:opacity-50 transform hover:scale-105"
          aria-label="Cancel Payment"
        >
          Cancel
        </button>
      </div>
    </form>
  );
};

const Checkout = () => {
  const { convertPrice, currency } = useCurrency();
  const navigate = useNavigate();
  const [cart, setCart] = useState([]);
  const [loadingState, setLoadingState] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formData, setFormData] = useState(() => {
    const saved = localStorage.getItem("checkoutFormData");
    return saved
      ? JSON.parse(saved)
      : {
          name: "",
          email: "",
          address: "",
          city: "",
          postalCode: "",
          country: "Nigeria",
          phone: "",
          saveInfo: false,
        };
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

  useEffect(() => {
    const loadCartAndUserData = async () => {
      try {
        setLoadingState(true);
        const user = auth.currentUser;

        const minRef = doc(db, "settings", "minimumPurchase");
        const minSnap = await getDoc(minRef);
        if (minSnap.exists()) {
          setMinimumPurchase(minSnap.data().amount || 25000);
        }

        const feeRef = doc(db, "feeConfigurations", "categoryFees");
        const feeSnap = await getDoc(feeRef);
        setFeeConfig(feeSnap.exists() ? feeSnap.data() : {});

        const cartItems = await getCart(user?.uid);
        console.log("Loaded cart items:", JSON.stringify(cartItems, null, 2));

        const processedCart = await Promise.all(
          cartItems.map(async (item) => {
            if (!item.productId || !item.product) {
              console.warn("Invalid cart item:", item);
              return null;
            }

            const productData = item.product || {};
            let imageUrls = [];

            if (Array.isArray(productData.imageUrls)) {
              imageUrls = productData.imageUrls.filter(
                (url) => typeof url === "string" && url.match(/^https?:\/\/.+/i)
              );
            } else if (
              productData.imageUrl &&
              typeof productData.imageUrl === "string" &&
              productData.imageUrl.match(/^https?:\/\/.+/i)
            ) {
              imageUrls = [productData.imageUrl];
            }

            const validImageUrls = await Promise.all(
              imageUrls.map((url) => preloadImage(url))
            );
            let filteredImageUrls = imageUrls.filter(
              (_, index) => validImageUrls[index]
            );

            if (filteredImageUrls.length === 0) {
              filteredImageUrls = [placeholder];
              setImageErrors((prev) => ({ ...prev, [item.productId]: true }));
              console.warn(
                "No valid imageUrls for product:",
                productData.name || "Unknown",
                "Using placeholder"
              );
            }

            const productRef = doc(db, "products", item.productId);
            const productSnap = await getDoc(productRef);
            const category = productSnap.exists()
              ? productSnap.data().category || "default"
              : "default";
            const sellerId = productSnap.exists()
              ? productSnap.data().sellerId
              : "default-seller-id";
            const stock = productSnap.exists()
              ? productSnap.data().stock || 10
              : 10;

            const categoryFees = (feeSnap.exists() &&
              feeSnap.data()[category]) || {
              taxRate: 0.075,
              buyerProtectionRate: 0.02,
              handlingRate: 0.05,
            };
            const basePrice = productData.price || 0;
            const totalPrice =
              basePrice *
              (1 +
                categoryFees.taxRate +
                categoryFees.buyerProtectionRate +
                categoryFees.handlingRate);

            return {
              ...item,
              product: {
                ...productData,
                imageUrls: filteredImageUrls,
                category,
                sellerId,
                totalPrice,
                stock,
              },
              currentImage: filteredImageUrls[0],
              slideDirection: "right",
            };
          })
        );

        const validCart = processedCart.filter((item) => item !== null);
        setCart(validCart);
        setImageLoading(
          validCart.reduce(
            (acc, item) => ({
              ...acc,
              [item.productId]: true,
            }),
            {}
          )
        );

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
        console.error("Error loading cart or user data:", err);
        console.log("Logging to Sentry:", err);
        setCart([]);
        toast.error("Failed to load data.", {
          position: "top-right",
          autoClose: 3000,
        });
      } finally {
        setLoadingState(false);
      }
    };

    const handleCartUpdate = async () => {
      try {
        const user = auth.currentUser;
        const cartItems = await getCart(user?.uid);
        const feeRef = doc(db, "feeConfigurations", "categoryFees");
        const feeSnap = await getDoc(feeRef);
        const feeConfig = feeSnap.exists() ? feeSnap.data() : {};

        const processedCart = await Promise.all(
          cartItems.map(async (item) => {
            if (!item.productId || !item.product) {
              console.warn("Invalid cart item:", item);
              return null;
            }

            const productData = item.product || {};
            let imageUrls = [];

            if (Array.isArray(productData.imageUrls)) {
              imageUrls = productData.imageUrls.filter(
                (url) => typeof url === "string" && url.match(/^https?:\/\/.+/i)
              );
            } else if (
              productData.imageUrl &&
              typeof productData.imageUrl === "string" &&
              productData.imageUrl.match(/^https?:\/\/.+/i)
            ) {
              imageUrls = [productData.imageUrl];
            }

            const validImageUrls = await Promise.all(
              imageUrls.map((url) => preloadImage(url))
            );
            let filteredImageUrls = imageUrls.filter(
              (_, index) => validImageUrls[index]
            );

            if (filteredImageUrls.length === 0) {
              filteredImageUrls = [placeholder];
              setImageErrors((prev) => ({ ...prev, [item.productId]: true }));
              console.warn(
                "No valid imageUrls for product:",
                productData.name || "Unknown",
                "Using placeholder"
              );
            }

            const productRef = doc(db, "products", item.productId);
            const productSnap = await getDoc(productRef);
            const category = productSnap.exists()
              ? productSnap.data().category || "default"
              : "default";
            const sellerId = productSnap.exists()
              ? productSnap.data().sellerId
              : "default-seller-id";
            const stock = productSnap.exists()
              ? productSnap.data().stock || 10
              : 10;

            const categoryFees = feeConfig[category] || {
              taxRate: 0.075,
              buyerProtectionRate: 0.02,
              handlingRate: 0.05,
            };
            const basePrice = productData.price || 0;
            const totalPrice =
              basePrice *
              (1 +
                categoryFees.taxRate +
                categoryFees.buyerProtectionRate +
                categoryFees.handlingRate);

            return {
              ...item,
              product: {
                ...productData,
                imageUrls: filteredImageUrls,
                category,
                sellerId,
                totalPrice,
                stock,
              },
              currentImage: filteredImageUrls[0],
              slideDirection: "right",
            };
          })
        );

        const validCart = processedCart.filter((item) => item !== null);
        setCart(validCart);
        setImageLoading(
          validCart.reduce(
            (acc, item) => ({
              ...acc,
              [item.productId]: true,
            }),
            {}
          )
        );
      } catch (err) {
        console.error("Error updating cart:", err);
        console.log("Logging to Sentry:", err);
        toast.error("Failed to update cart.", {
          position: "top-right",
          autoClose: 3000,
        });
      }
    };

    const startSessionTimeout = () => {
      clearTimeout(sessionTimeout);
      const timeout = setTimeout(() => {
        toast.warn("Session inactive. Please refresh or log in again.", {
          position: "top-right",
          autoClose: 5000,
        });
        navigate("/login");
      }, 30 * 60 * 1000);
      setSessionTimeout(timeout);
    };

    window.addEventListener("cartUpdated", handleCartUpdate);
    window.addEventListener("mousemove", startSessionTimeout);
    window.addEventListener("keydown", startSessionTimeout);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      setIsAuthenticated(!!user);
      loadCartAndUserData();
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
          ? {
              ...item,
              quantity: Math.max(
                1,
                Math.min(newQuantity, item.product.stock || 10)
              ),
            }
          : item
      );
      await updateCart(user?.uid, updatedCart);
      setCart(updatedCart);
      toast.info("Quantity updated.", {
        position: "top-right",
        autoClose: 2000,
      });
    } catch (err) {
      console.error("Error updating quantity:", err);
      console.log("Logging to Sentry:", err);
      toast.error("Failed to update quantity.", {
        position: "top-right",
        autoClose: 3000,
      });
    }
  };

  const totalItems = cart.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const subtotalNgn = cart.reduce(
    (total, item) =>
      total + (item.product?.totalPrice || 0) * (item.quantity || 0),
    0
  );
  const belowMinimumPrice = subtotalNgn < minimumPurchase;
  const totalAmount = currency === "GBP" ? subtotalNgn * 0.00048 : subtotalNgn;

  useEffect(() => {
    console.log("Subtotal NGN:", convertPrice(subtotalNgn));
    console.log("Total Amount:", convertPrice(totalAmount), "(", currency, ")");
  }, [subtotalNgn, totalAmount, currency, convertPrice]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setFormErrors((prev) => ({ ...prev, [name]: "" }));
    if (name === "country" && value !== formData.country) {
      toast.info(
        `Currency will change to ${
          value === "United Kingdom" ? "GBP" : "NGN"
        }.`,
        {
          position: "top-right",
          autoClose: 3000,
        }
      );
    }
  };

  const validateForm = () => {
    const errors = {};
    const { name, email, address, city, postalCode, country, phone } = formData;
    if (!name) errors.name = "Full name is required.";
    if (!email) errors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(email))
      errors.email = "Invalid email address.";
    if (!phone) errors.phone = "Phone number is required.";
    if (!address) errors.address = "Address is required.";
    if (!city) errors.city = "City is required.";
    // Postal code is optional
    if (!["Nigeria", "United Kingdom"].includes(country))
      errors.country = "Select Nigeria or United Kingdom.";
    return { isValid: Object.keys(errors).length === 0, errors };
  };

  const formValidity = useMemo(() => validateForm(), [formData]);

  const sendOrderConfirmationEmail = async (order) => {
    try {
      setIsEmailSending(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL;
      console.log("Backend URL:", backendUrl);
      console.log("Sending order confirmation email with payload:", {
        orderId: order.paymentId || "unknown",
        email: order.shippingDetails?.email || "unknown",
        items: order.items,
        total: order.totalAmount || 0,
        currency: order.currency || "unknown",
        shippingDetails: order.shippingDetails || {},
      });

      const payload = {
        orderId: order.paymentId || `fallback-${Date.now()}`,
        email: order.shippingDetails?.email || formData.email,
        items: (order.items || []).map((item) => ({
          productId: item.productId || "unknown",
          quantity: item.quantity || 1,
          price: item.price || 0,
          name: item.name || "Unknown Product",
          sellerId: item.sellerId || "unknown",
          imageUrls: Array.isArray(item.imageUrls)
            ? item.imageUrls
            : [placeholder],
        })),
        total: order.totalAmount || 0,
        currency: order.currency || currency,
        shippingDetails: {
          name: order.shippingDetails?.name || formData.name || "Unknown",
          address:
            order.shippingDetails?.address || formData.address || "Unknown",
          city: order.shippingDetails?.city || formData.city || "",
          postalCode:
            order.shippingDetails?.postalCode || formData.postalCode || "",
          country: order.shippingDetails?.country || formData.country || "",
          phone: order.shippingDetails?.phone || formData.phone || "",
        },
      };

      if (!payload.email || !/\S+@\S+\.\S+/.test(payload.email)) {
        throw new Error("Invalid or missing email address");
      }
      if (!payload.items.length) {
        throw new Error("No items provided");
      }

      let attempts = 2;
      let lastError = null;

      while (attempts > 0) {
        try {
          const response = await axios.post(
            `${backendUrl}/send-order-confirmation`,
            payload,
            {
              timeout: 10000,
            }
          );
          console.log(
            "Order confirmation email sent successfully:",
            response.data
          );
          return;
        } catch (err) {
          lastError = err;
          attempts--;
          if (attempts === 0 || err.response?.status !== 400) {
            throw err;
          }
          console.warn(`Retrying email send (${attempts} attempts left)...`);
          await new Promise((resolve) => setTimeout(resolve, 2000));
        }
      }
      throw lastError || new Error("Failed to send email after retries");
    } catch (err) {
      console.error("Error sending order confirmation email:", {
        message: err.message,
        status: err.response?.status,
        responseData: err.response?.data,
        stack: err.stack,
      });
      console.log("Logging to Sentry:", err);
      toast.warn(
        "Order placed successfully, but failed to send confirmation email. Please check your email later.",
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
      if (debugMode) {
        toast.error(
          `Debug: Email send failed - ${err.message} (${JSON.stringify(
            err.response?.data
          )})`,
          {
            position: "bottom-right",
            autoClose: 5000,
          }
        );
      }
    } finally {
      setIsEmailSending(false);
    }
  };

  const sendSellerOrderNotifications = async (
    sellers,
    sellerOrderIds,
    currency,
    shippingDetails
  ) => {
    try {
      setIsEmailSending(true);
      const backendUrl = import.meta.env.VITE_BACKEND_URL;

      for (const [sellerId, items] of Object.entries(sellers)) {
        const sellerOrderId =
          sellerOrderIds.find((id) => id.includes(sellerId)) ||
          `order-${Date.now()}-${sellerId}`;
        const sellerSubtotal = items.reduce(
          (total, item) =>
            total + (item.product?.totalPrice || 0) * (item.quantity || 0),
          0
        );
        const totalAmount =
          currency === "GBP" ? sellerSubtotal * 0.00048 : sellerSubtotal;

        const payload = {
          orderId: sellerOrderId,
          sellerId,
          items: items.map((item) => ({
            productId: item.productId || "unknown",
            quantity: item.quantity || 1,
            price: item.product?.totalPrice || 0,
            name: item.product?.name || "Unknown Product",
            imageUrls: Array.isArray(item.product?.imageUrls)
              ? item.product.imageUrls
              : [placeholder],
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

        console.log("Sending seller notification email with payload:", {
          orderId: sellerOrderId,
          sellerId,
          items: payload.items,
          total: totalAmount,
          currency,
          shippingDetails: payload.shippingDetails,
        });

        let attempts = 2;
        let lastError = null;

        while (attempts > 0) {
          try {
            const response = await axios.post(
              `${backendUrl}/send-seller-order-notification`,
              payload,
              {
                timeout: 10000,
              }
            );
            console.log(
              `Seller notification email sent successfully for seller ${sellerId}:`,
              response.data
            );
            break;
          } catch (err) {
            lastError = err;
            attempts--;
            if (attempts === 0 || err.response?.status !== 400) {
              throw err;
            }
            console.warn(
              `Retrying seller email send for ${sellerId} (${attempts} attempts left)...`
            );
            await new Promise((resolve) => setTimeout(resolve, 2000));
          }
        }
        if (attempts === 0) {
          throw (
            lastError ||
            new Error(
              `Failed to send seller email for ${sellerId} after retries`
            )
          );
        }
      }
    } catch (err) {
      console.error("Error sending seller notification emails:", {
        message: err.message,
        status: err.response?.status,
        responseData: err.response?.data,
        stack: err.stack,
      });
      console.log("Logging to Sentry:", err);
      toast.warn(
        "Order placed successfully, but failed to notify some sellers. They may receive notifications later.",
        {
          position: "top-right",
          autoClose: 5000,
        }
      );
      if (debugMode) {
        toast.error(
          `Debug: Seller email send failed - ${err.message} (${JSON.stringify(
            err.response?.data
          )})`,
          {
            position: "bottom-right",
            autoClose: 5000,
          }
        );
      }
    } finally {
      setIsEmailSending(false);
    }
  };

  const handlePaymentSuccess = useCallback(
    async (paymentData) => {
      try {
        if (cart.length === 0) {
          toast.error("Cart is empty.", {
            position: "top-right",
            autoClose: 3000,
          });
          return;
        }
        const validation = validateForm();
        if (!validation.isValid) {
          setFormErrors(validation.errors);
          toast.error("Please fix form errors.", {
            position: "top-right",
            autoClose: 3000,
          });
          formRef.current.scrollIntoView({ behavior: "smooth" });
          return;
        }
        if (belowMinimumPrice) {
          toast.error(
            `Total amount must be at least <PriceFormatter price={minimumPurchase} /> to proceed.`,
            { position: "top-right", autoClose: 3000 }
          );
          return;
        }

        console.log("Payment data:", paymentData);
        if (!paymentData || (!paymentData.id && !paymentData.reference)) {
          console.warn("Invalid payment data:", paymentData);
          console.log(
            "Logging to Sentry:",
            new Error("Invalid payment data received")
          );
        }

        const userId = auth.currentUser?.uid || "anonymous";
        const orderId = `order-${Date.now()}`;
        const paymentGateway =
          formData.country === "United Kingdom" ? "Stripe" : "Paystack";
        const paymentId =
          paymentData?.id || paymentData?.reference || `fallback-${orderId}`;

        const sellers = {};
        cart.forEach((item) => {
          const sellerId = item.product?.sellerId || "default-seller-id";
          if (!sellerId) {
            console.warn("No sellerId found for item:", item);
            throw new Error("Seller ID missing for item: " + item.productId);
          }
          if (!sellers[sellerId]) sellers[sellerId] = [];
          sellers[sellerId].push(item);
        });

        let lastOrder = null;
        const walletUpdates = [];
        const sellerOrderIds = [];

        await runTransaction(db, async (transaction) => {
          const productRefs = cart.map((item) =>
            doc(db, "products", item.productId)
          );
          const productSnaps = await Promise.all(
            productRefs.map((ref) => transaction.get(ref))
          );

          const stockUpdates = [];
          productSnaps.forEach((snap, index) => {
            if (!snap.exists()) {
              console.warn(
                `Product ${cart[index].productId} does not exist. Skipping stock update.`
              );
              return;
            }
            const currentStock = snap.data().stock || 0;
            const requestedQuantity = cart[index].quantity || 0;
            const newStock = currentStock - requestedQuantity;
            if (newStock < 0) {
              throw new Error(
                `Insufficient stock for product ${cart[index].productId} (${
                  cart[index].product?.name || "Unknown"
                })`
              );
            }
            stockUpdates.push({ ref: productRefs[index], newStock });
          });

          const sellerWalletRefs = Object.keys(sellers).map((sellerId) =>
            doc(db, "wallets", sellerId)
          );
          const sellerWalletSnaps = await Promise.all(
            sellerWalletRefs.map((ref) => transaction.get(ref))
          );
          const sellerWallets = sellerWalletSnaps.map((snap, index) => ({
            ref: sellerWalletRefs[index],
            exists: snap.exists(),
            data: snap.exists() ? snap.data() : null,
            sellerId: Object.keys(sellers)[index],
          }));

          console.log(
            "Seller wallets before update:",
            sellerWallets.map((wallet) => ({
              sellerId: wallet.sellerId,
              exists: wallet.exists,
              pendingBalance: wallet.data?.pendingBalance || 0,
              availableBalance: wallet.data?.availableBalance || 0,
            }))
          );

          const orders = [];
          sellerWallets.forEach(({ ref, exists, data, sellerId }) => {
            const sellerItems = sellers[sellerId];
            const sellerSubtotalNgn = sellerItems.reduce(
              (total, item) =>
                total + (item.product?.totalPrice || 0) * (item.quantity || 0),
              0
            );
            const sellerShare =
              currency === "GBP"
                ? sellerSubtotalNgn * 0.00048
                : sellerSubtotalNgn;

            const order = {
              id: orderId,
              userId,
              sellerId,
              items: sellerItems.map((item) => ({
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
            const sellerOrderId = `${orderId}-${sellerId}`;
            orders.push({ order, orderId: sellerOrderId });
            sellerOrderIds.push(sellerOrderId);

            const pendingBalance =
              (exists ? data?.pendingBalance || 0 : 0) + sellerShare;
            walletUpdates.push({ sellerId, amount: sellerShare });
            transaction.set(
              ref,
              {
                availableBalance: exists ? data?.availableBalance || 0 : 0,
                pendingBalance,
                updatedAt: serverTimestamp(),
                ...(exists ? {} : { createdAt: serverTimestamp() }),
              },
              { merge: true }
            );

            console.log(`Updated wallet for seller ${sellerId}:`, {
              pendingBalance,
              availableBalance: exists ? data?.availableBalance || 0 : 0,
            });
          });

          orders.forEach(({ order, orderId }) => {
            const orderRef = doc(db, "orders", orderId);
            try {
              transaction.set(orderRef, order);
            } catch (err) {
              console.error(`Error saving order ${orderId}:`, err);
              throw err;
            }
            lastOrder = order;
          });

          stockUpdates.forEach(({ ref, newStock }) => {
            transaction.update(ref, { stock: newStock });
          });

          const transactionPromises = orders.map(({ order }) =>
            addDoc(collection(db, "transactions"), {
              userId: order.sellerId,
              type: "Sale",
              description: `Sale from order ${order.id}`,
              amount: order.totalAmount,
              date: new Date().toISOString().split("T")[0],
              status: "Pending",
              createdAt: serverTimestamp(),
              reference: order.paymentId,
            })
          );
          await Promise.all(transactionPromises);
        });

        const updatedWallets = await Promise.all(
          walletUpdates.map(async ({ sellerId }) => {
            const walletRef = doc(db, "wallets", sellerId);
            const walletSnap = await getDoc(walletRef);
            return {
              sellerId,
              exists: walletSnap.exists(),
              data: walletSnap.exists() ? walletSnap.data() : null,
            };
          })
        );
        console.log("Seller wallets after update:", updatedWallets);

        if (auth.currentUser && formData.saveInfo) {
          const userDocRef = doc(db, "users", auth.currentUser.uid);
          await setDoc(userDocRef, formData, { merge: true });
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

        await sendSellerOrderNotifications(
          sellers,
          sellerOrderIds,
          currency,
          formData
        );

        await clearCart(auth.currentUser?.uid);
        setCart([]);

        toast.success(
          <div>
            <strong>Payment Successful!</strong>
            <p>
              Your order has been placed. Check your email for confirmation.
            </p>
          </div>,
          {
            position: "top-right",
            autoClose: 5000,
            style: customToastStyle,
            icon: <i className="bx bx-check-circle text-blue-500 text-xl" />,
          }
        );
        navigate("/order-confirmation", {
          state: { order: { ...lastOrder, items: cart } },
        });
      } catch (err) {
        console.error("Checkout error:", err);
        console.log("Logging to Sentry:", err);
        toast.error(err.message || "Failed to place order. Please try again.", {
          position: "top-right",
          autoClose: 3000,
        });
        if (debugMode) {
          toast.error(`Debug: ${err.message}`, {
            position: "bottom-right",
            autoClose: 5000,
          });
        }
      } finally {
        setShowConfirmModal(false);
      }
    },
    [
      cart,
      subtotalNgn,
      belowMinimumPrice,
      formData,
      totalAmount,
      navigate,
      totalItems,
      currency,
      debugMode,
      minimumPurchase,
    ]
  );

  const handleCancel = () => {
    toast.info("Payment cancelled.", {
      position: "top-right",
      autoClose: 3000,
    });
    setShowConfirmModal(false);
  };

  const handleImageClick = (itemId, url, index, currentIndex) => {
    setCart((prev) =>
      prev.map((item) =>
        item.productId === itemId
          ? {
              ...item,
              currentImage: url,
              slideDirection: index > currentIndex ? "right" : "left",
            }
          : item
      )
    );
    console.log("Cart item image updated:", {
      itemId,
      url,
      direction: index > currentIndex ? "right" : "left",
    });
  };

  const handleImageLoad = (productId, isThumbnail) => {
    setImageLoading((prev) => ({
      ...prev,
      [productId]: isThumbnail ? prev[productId] : false,
    }));
    setImageErrors((prev) => ({ ...prev, [productId]: false }));
    console.log(
      `Image ${
        isThumbnail ? "thumbnail" : "main"
      } loaded for productId: ${productId}`
    );
  };

  const handleImageError = (e, productId) => {
    console.error(`Image load error for productId: ${productId}`, {
      imageUrl: e.target.src,
      productId,
    });
    setImageLoading((prev) => ({ ...prev, [productId]: false }));
    setImageErrors((prev) => ({ ...prev, [productId]: true }));
    e.target.src = placeholder;
    if (debugMode) {
      toast.warn(`Image failed to load for product ${productId}`, {
        position: "top-right",
        autoClose: 3000,
      });
    }
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
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-40">
          <Spinner />
          <p className="text-white ml-4">
            {isEmailSending
              ? "Sending confirmation email..."
              : "Processing payment..."}
          </p>
        </div>
      )}
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
          .slide-in-right { animation: slideInRight 0.3s ease-in-out forwards; }
          .slide-in-left { animation: slideInLeft 0.3s ease-in-out forwards; }
          .image-zoom:hover { transform: scale(1.05); transition: transform 0.3s ease; }
        `}
      </style>
      <ProgressBar />
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <i className="bx bx-cart text-blue-600" />
          Checkout
        </h1>
        <Link
          to="/cart"
          className="text-blue-600 hover:underline text-sm flex items-center gap-1"
          aria-label="Back to Cart"
        >
          <i className="bx bx-arrow-back" />
          Back to Cart
        </Link>
      </div>
      {cart.length === 0 ? (
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Your cart is empty.{" "}
            <Link to="/products" className="text-blue-600 hover:underline">
              Continue shopping
            </Link>
          </p>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-6">
          <div
            className="flex-1 bg-white p-6 rounded-lg shadow-md"
            ref={formRef}
          >
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <i className="bx bx-home text-blue-600" />
              Shipping Details
            </h2>
            <form className="space-y-4">
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 items-center gap-1"
                >
                  Full Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <i className="bx bx-user absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className={`mt-1 w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formErrors.name ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                    disabled={loadingState}
                    aria-invalid={!!formErrors.name}
                    aria-describedby={
                      formErrors.name ? "name-error" : undefined
                    }
                  />
                </div>
                {formErrors.name && (
                  <p id="name-error" className="text-red-600 text-xs mt-1">
                    {formErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 items-center gap-1"
                >
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <i className="bx bx-envelope absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`mt-1 w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formErrors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                    disabled={loadingState}
                    aria-invalid={!!formErrors.email}
                    aria-describedby={
                      formErrors.email ? "email-error" : undefined
                    }
                  />
                </div>
                {formErrors.email && (
                  <p id="email-error" className="text-red-600 text-xs mt-1">
                    {formErrors.email}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 items-center gap-1"
                >
                  Phone <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <i className="bx bx-phone absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`mt-1 w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formErrors.phone ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                    disabled={loadingState}
                    aria-invalid={!!formErrors.phone}
                    aria-describedby={
                      formErrors.phone ? "phone-error" : undefined
                    }
                  />
                </div>
                {formErrors.phone && (
                  <p id="phone-error" className="text-red-600 text-xs mt-1">
                    {formErrors.phone}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 items-center gap-1"
                >
                  Address <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <i className="bx bx-map absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className={`mt-1 w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formErrors.address ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                    disabled={loadingState}
                    aria-invalid={!!formErrors.address}
                    aria-describedby={
                      formErrors.address ? "address-error" : undefined
                    }
                  />
                </div>
                {formErrors.address && (
                  <p id="address-error" className="text-red-600 text-xs mt-1">
                    {formErrors.address}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="city"
                  className="block text-sm font-medium text-gray-700 items-center gap-1"
                >
                  City <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <i className="bx bx-city absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleInputChange}
                    className={`mt-1 w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formErrors.city ? "border-red-500" : "border-gray-300"
                    }`}
                    required
                    disabled={loadingState}
                    aria-invalid={!!formErrors.city}
                    aria-describedby={
                      formErrors.city ? "city-error" : undefined
                    }
                  />
                </div>
                {formErrors.city && (
                  <p id="city-error" className="text-red-600 text-xs mt-1">
                    {formErrors.city}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="postalCode"
                  className="block text-sm font-medium text-gray-700 items-center gap-1"
                >
                  Postal Code
                </label>
                <div className="relative">
                  <i className="bx bx-mail-send absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="postalCode"
                    name="postalCode"
                    value={formData.postalCode || ''}
                    onChange={handleInputChange}
                    className={`mt-1 w-full p-3 pl-10 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      formErrors.postalCode
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                    required
                    disabled={loadingState}
                    aria-invalid={!!formErrors.postalCode}
                    aria-describedby={
                      formErrors.postalCode ? "postalcode-error" : undefined
                    }
                  />
                </div>
                {formErrors.postalCode && (
                  <p
                    id="postalcode-error"
                    className="text-red-600 text-xs mt-1"
                  >
                    {formErrors.postalCode}
                  </p>
                )}
              </div>
              <div>
                <label
                  htmlFor="country"
                  className="block text-sm font-medium text-gray-700 items-center gap-1"
                >
                  Country <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <i className="bx bx-world absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
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
                    aria-describedby={
                      formErrors.country ? "country-error" : undefined
                    }
                  >
                    <option value="">Select a country</option>
                    <option value="Nigeria">Nigeria</option>
                    <option value="United Kingdom">United Kingdom</option>
                  </select>
                </div>
                {formErrors.country && (
                  <p id="country-error" className="text-red-600 text-xs mt-1">
                    {formErrors.country}
                  </p>
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
                <label
                  htmlFor="saveInfo"
                  className="ml-2 text-sm text-gray-600"
                >
                  Save shipping information for future purchases
                </label>
              </div>
            </form>
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <i className="bx bx-package text-blue-600" />
                Cart Items
                <span
                  className="ml-2 text-xs text-gray-500 cursor-help relative group"
                  aria-label="Prices include tax, buyer protection, and handling fees."
                >
                  <i className="bx bx-info-circle" />
                  <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg p-2 -top-10 left-0 w-48 z-10">
                    Prices include tax, buyer protection, and handling fees.
                  </span>
                </span>
              </h2>
              {cart.map((item) => (
                <div
                  key={item.productId}
                  className="flex items-start gap-4 mb-4 border-b pb-4"
                >
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
                        item.slideDirection === "right"
                          ? "slide-in-right"
                          : "slide-in-left"
                      } ${
                        imageLoading[item.productId] ||
                        imageErrors[item.productId]
                          ? "opacity-50"
                          : "opacity-100"
                      }`}
                      onLoad={() => handleImageLoad(item.productId, false)}
                      onError={(e) => handleImageError(e, item.productId)}
                      loading="lazy"
                      aria-label={`Image for ${
                        item.product?.name || "Unknown Product"
                      }`}
                    />
                    {imageErrors[item.productId] && (
                      <div className="absolute bottom-0 left-0 bg-red-600 text-white text-xs px-1 rounded">
                        Image Failed
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-semibold text-gray-800">
                      {item.product?.name || "Unknown"}
                    </h3>
                    <p className="text-sm text-gray-600">
                      <PriceFormatter
                        price={
                          (item.product?.totalPrice || 0) * (item.quantity || 0)
                        }
                      />
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <label
                        htmlFor={`quantity-${item.productId}`}
                        className="text-sm text-gray-600"
                      >
                        Qty:
                      </label>
                      <input
                        type="number"
                        id={`quantity-${item.productId}`}
                        value={item.quantity || 1}
                        onChange={(e) =>
                          updateQuantity(
                            item.productId,
                            parseInt(e.target.value)
                          )
                        }
                        min="1"
                        max={item.product?.stock || 10}
                        className="w-16 p-1 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        aria-label={`Quantity for ${
                          item.product?.name || "Unknown"
                        }`}
                      />
                    </div>
                    {item.product?.imageUrls?.length > 1 && (
                      <div className="flex gap-2 mt-2 overflow-x-auto">
                        {item.product.imageUrls.map((url, index) => (
                          <img
                            key={`${item.productId}-${index}`}
                            src={url}
                            alt={`${item.product?.name || "Unknown"} ${
                              index + 1
                            }`}
                            className={`w-10 h-10 object-cover rounded border cursor-pointer ${
                              item.currentImage === url
                                ? "border-blue-500 border-2"
                                : "border-gray-300"
                            } ${
                              imageLoading[item.productId] ||
                              imageErrors[item.productId]
                                ? "opacity-50"
                                : "opacity-100"
                            }`}
                            onClick={() =>
                              handleImageClick(
                                item.productId,
                                url,
                                index,
                                item.product.imageUrls.indexOf(
                                  item.currentImage
                                )
                              )
                            }
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
              <img
                src={cards}
                alt="Accepted payment cards"
                className="mb-6 w-auto h-8"
              />
              <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <i className="bx bx-receipt text-blue-600" />
                Order Summary
              </h2>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Total Items</span>
                  <span>{totalItems}</span>
                </div>
                {cart.map((item) => (
                  <div key={item.productId} className="flex justify-between">
                    <span className="truncate w-2/3">
                      {item.product?.name || "Unknown"} (x{item.quantity || 0})
                    </span>
                    <span>
                      <PriceFormatter
                        price={
                          (item.product?.totalPrice || 0) * (item.quantity || 0)
                        }
                      />
                    </span>
                  </div>
                ))}
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    <PriceFormatter price={subtotalNgn} />
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full">
                    Free
                  </span>
                </div>
                <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
                  <span>Grand Total</span>
                  <span>
                    <PriceFormatter price={subtotalNgn} />
                  </span>
                </div>
              </div>
              {belowMinimumPrice && (
                <p className="text-red-600 text-xs mt-2 bg-red-50 p-2 rounded">
                  ❌ Minimum purchase amount is{" "}
                  <PriceFormatter price={minimumPurchase} /> to checkout.
                </p>
              )}
              <div className="mt-6 border-t pt-4">
                <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <i className="bx bx-home text-blue-600" />
                  Shipping Information
                </h2>
                <div className="space-y-2 text-sm text-gray-600">
                  <p>
                    <strong>Name:</strong> {formData.name || "Not provided"}
                  </p>
                  <p>
                    <strong>Email:</strong> {formData.email || "Not provided"}
                  </p>
                  <p>
                    <strong>Phone:</strong> {formData.phone || "Not provided"}
                  </p>
                  <p>
                    <strong>Address:</strong>{" "}
                    {formData.address || "Not provided"}
                  </p>
                  <p>
                    <strong>City:</strong> {formData.city || "Not provided"}
                  </p>
                  <p>
                    <strong>Postal Code:</strong>{" "}
                    {formData.postalCode || "Not provided"}
                  </p>
                  <p>
                    <strong>Country:</strong>{" "}
                    {formData.country || "Not provided"}
                  </p>
                </div>
                {formData.country === "United Kingdom" ? (
                  <Elements stripe={stripePromise}>
                    <StripeCheckoutForm
                      totalPrice={totalAmount}
                      formData={formData}
                      onSuccess={handlePaymentSuccess}
                      onCancel={handleCancel}
                      currency={currency}
                      setIsProcessing={setIsProcessing}
                    />
                  </Elements>
                ) : (
                  <PaystackCheckout
                    totalPrice={totalAmount}
                    formData={formData}
                    onSuccess={handlePaymentSuccess}
                    onCancel={handleCancel}
                    currency={currency}
                    setIsProcessing={setIsProcessing}
                    buttonText="Checkout"
                  />
                )}
              </div>
              <button
                onClick={() => setShowConfirmModal(true)}
                className={`mt-6 w-full py-3 px-4 rounded-lg text-white text-sm font-medium transition duration-200 shadow transform hover:scale-105 ${
                  belowMinimumPrice ||
                  !formValidity.isValid ||
                  totalItems > 20 ||
                  isProcessing ||
                  isEmailSending
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-blue-600 hover:bg-blue-700"
                }`}
                disabled={
                  belowMinimumPrice ||
                  !formValidity.isValid ||
                  totalItems > 20 ||
                  isProcessing ||
                  isEmailSending
                }
                aria-label="Confirm Order"
              >
                {isProcessing || isEmailSending
                  ? "Processing..."
                  : "Confirm Order"}
              </button>
              {belowMinimumPrice && (
                <p className="text-red-600 text-xs mt-2 bg-red-50 p-2 rounded">
                  ❌ Minimum purchase amount is{" "}
                  <PriceFormatter price={minimumPurchase} /> to checkout.
                </p>
              )}
              {totalItems > 20 && (
                <p className="text-red-600 text-xs mt-2 bg-red-50 p-2 rounded">
                  ❌ Maximum basket size is 20 items.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={showConfirmModal}
        onConfirm={() => {
          if (formData.country === "United Kingdom") {
            const stripeForm = document.querySelector("form");
            if (stripeForm) {
              stripeForm.dispatchEvent(
                new Event("submit", { cancelable: true, bubbles: true })
              );
            }
          } else {
            handlePaymentSuccess({ reference: `paystack-${Date.now()}` });
          }
        }}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default Checkout;
