import { useState } from 'react';
import { auth } from '/src/firebase';
import { addToCart } from '/src/utils/cartUtils';
import CustomAlert, { useAlerts } from '/src/components/common/CustomAlert';

const AddToCartButton = ({ productId }) => {
  const [loading, setLoading] = useState(false);
  const { alerts, addAlert } = useAlerts();
  const { setAlerts } = useAlerts();

  const handleAddToCart = async () => {
    if (!productId) {
      addAlert('Invalid product ID', 'error', 3000);
      return;
    }

    setLoading(true);
    try {
      await addToCart(productId, 1, auth.currentUser?.uid);
      addAlert('Added to cart!', 'success', 3000);
    } catch (err) {
      console.error('Error adding to cart:', err);
      addAlert(err.message || 'Failed to add to cart', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="">
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className={`pl-1 pr-1 rounded-full transition-all duration-200 ${
          loading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'text-2xl bg-slate-500 shadow-xl text-white text-center hover:bg-[#ec9d38]'
        }`}
        aria-label="Add to cart"
      >
        <i className={`bx bx-plus text-white ${loading ? 'opacity-50' : ''}`}></i>
      </button>
      <CustomAlert alerts={alerts} removeAlert={(id) => setAlerts(alerts.filter((alert) => alert.id !== id))} />
    </div>
  );
};

export default AddToCartButton;