import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { auth } from '/src/firebase';
import '/src/index.css';

const PaystackCheckout = ({
  email,
  amount,
  onSuccess,
  onClose,
  disabled,
  buttonText,
  className,
  iconClass,
  sellerId, // Added
  handlingFee, // Added
  buyerProtectionFee, // Added
}) => {
  const [loading, setLoading] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setScriptLoaded(true);
    script.onerror = () => {
      toast.error('Failed to load Paystack script.');
      setScriptLoaded(false);
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const payNow = async () => {
    if (!scriptLoaded || !window.PaystackPop) {
      toast.error('Paystack not loaded.');
      return;
    }

    if (!email || !amount || amount <= 0 || !sellerId) {
      toast.error('Valid email, amount, and seller ID required.');
      return;
    }

    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      if (!import.meta.env.VITE_PAYSTACK_PUBLIC_KEY) {
        throw new Error('Paystack public key is not configured.');
      }

      const amountInKobo = Math.round(amount); // Already in kobo from Checkout
      const payload = {
        amount: amountInKobo,
        email,
        currency: 'NGN',
        metadata: {
          userId: auth.currentUser?.uid || 'anonymous',
          orderId: `order-${Date.now()}`,
          sellerId, // Added
          handlingFee: handlingFee || 0, // Added
          buyerProtectionFee: buyerProtectionFee || 0, // Added
        },
      };

      console.log('Sending payload to backend:', payload);

      const { data } = await axios.post(`${backendUrl}/initiate-paystack-payment`, payload);

      console.log('Backend response:', data);

      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email,
        amount: amountInKobo,
        currency: 'NGN',
        ref: data.reference,
        callback: (response) => {
          console.log('Paystack callback:', response);
          onSuccess(response);
          setLoading(false);
        },
        onClose: () => {
          console.log('Paystack iframe closed');
          onClose();
          setLoading(false);
        },
      });

      handler.openIframe();
    } catch (err) {
      console.error('Paystack payment error:', {
        message: err.message,
        code: err.code,
        response: err.response?.data,
      });
      const errorMessage =
        err.code === 'ERR_NETWORK'
          ? 'Cannot connect to server. Ensure backend is running.'
          : err.response?.data?.error ||
            err.response?.data?.message ||
            'Payment failed. Please try again.';
      toast.error(errorMessage);
      setLoading(false);
    }
  };

  return (
    <button
      onClick={payNow}
      disabled={disabled || loading || !scriptLoaded}
      className={`paystack-button ${className}`}
    >
      {iconClass && <i className={iconClass}></i>}
      {loading ? 'Processing...' : buttonText}
    </button>
  );
};

export default PaystackCheckout;