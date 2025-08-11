import { useState } from 'react';
import { auth } from '/src/firebase';
import { addToCart } from '/src/utils/cartUtils';
import CustomAlert, { useAlerts } from '/src/components/common/CustomAlert';

const AddToCartButton = ({ productId, isIconOnly = false, customClass = '' }) => {
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

  // Base button styles based on mode
  let buttonClassName = isIconOnly
    ? `${customClass} focus:outline-none`
    : `rounded-full px-2 py-1 text-white focus:outline-none ml-2 transition-all duration-200 ${
        loading
            ? 'bg-gray-300 cursor-not-allowed'
            : 'bg-[#000] hover:bg-blue-950'
      }`;

  return (
    <div className="">
      <button
        onClick={handleAddToCart}
        disabled={loading}
        className={buttonClassName}
        aria-label="Add to cart"
      >
        <i className={`bx bx-cart-add text-2xl ${loading ? 'opacity-50' : ''}`}></i>
      </button>
      <CustomAlert alerts={alerts} removeAlert={(id) => setAlerts(alerts.filter((alert) => alert.id !== id))} />
    </div>
  );
};

export default AddToCartButton;