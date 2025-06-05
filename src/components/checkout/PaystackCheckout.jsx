import { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { auth } from '/src/firebase';
import '/src/index.css';

const PaystackCheckout = ({
  email,
  amount, // Already in kobo from Checkout.jsx
  onSuccess,
  onClose,
  disabled,
  buttonText,
  className,
  iconClass,
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

    if (!email || !amount || amount <= 0) {
      toast.error('Valid email and amount required.');
      return;
    }

    setLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';
      const payload = {
        amount, // Use as-is (already in kobo)
        email,
        currency: 'NGN',
        metadata: {
          userId: auth.currentUser?.uid || 'anonymous',
          orderId: `order-${Date.now()}`,
        },
      };
      console.log('Initiating Paystack Payment with Payload:', payload); // Debug log
      const { data } = await axios.post(`${backendUrl}/initiate-paystack-payment`, payload);

      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email,
        amount, // Use as-is (already in kobo)
        currency: 'NGN',
        ref: data.reference,
        language: 'en', // Explicitly set to prevent null error
        callback: (response) => {
          console.log('Paystack Callback Response:', response); // Debug log
          onSuccess(response);
          setLoading(false);
        },
        onClose: () => {
          console.log('Paystack Modal Closed'); // Debug log
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
      toast.error(
        err.code === 'ERR_NETWORK'
          ? 'Cannot connect to server. Ensure backend is running on port 5000.'
          : err.response?.data?.message || 'Payment failed.'
      );
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