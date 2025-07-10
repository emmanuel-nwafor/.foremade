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
        amount: amount, // Send in NGN
        email,
        currency: 'NGN',
        metadata: {
          userId: auth.currentUser?.uid || 'anonymous',
          orderId: `order-${Date.now()}`,
        },
      };
      const { data } = await axios.post(`${backendUrl}/initiate-paystack-payment`, payload);

      const handler = window.PaystackPop.setup({
        key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
        email,
        amount: Math.round(amount * 100), // Paystack iframe expects kobo
        currency: 'NGN',
        ref: data.reference,
        callback: (response) => {
          onSuccess(response);
          setLoading(false);
        },
        onClose: () => {
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