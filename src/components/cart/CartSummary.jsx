import React from 'react';
import { useNavigate } from 'react-router-dom';

const CartSummary = ({ totalPrice, cartItems, clearCart }) => {
  const navigate = useNavigate();
  const hasStockIssues = cartItems.some((item) => item.quantity > (item.product?.stock || 0));
  const isCartEmpty = cartItems.length === 0;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const belowMinimumPrice = totalPrice < 12000;

  // Dynamic Shipping Logic
  const baseShipping = 2000; // ₦2,000 for the first item
  const additionalShippingPerItem = 500; // ₦500 per extra item
  const rawShipping = baseShipping + (totalItems - 1) * additionalShippingPerItem;
  const shipping = totalItems >= 9 ? rawShipping * 0.7 : rawShipping; // 30% off for 9 items
  const grandTotal = totalPrice + shipping;

  const handleCheckout = () => {
    if (belowMinimumPrice) {
      alert('Minimum purchase amount is ₦12,000 to checkout.');
      return;
    }
    navigate('/checkout');
  };

  return (
    <div className="p-4 bg-gray-50 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₦{totalPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>
            {totalItems >= 9 ? (
              <span className="flex items-center gap-1">
                <span className="line-through text-gray-500 mr-1">
                  ₦{rawShipping.toLocaleString('en-NG')}
                </span>
                <span className="text-green-600 font-semibold">
                  ₦{shipping.toLocaleString('en-NG')}
                </span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  30% OFF
                </span>
              </span>
            ) : (
              `₦${rawShipping.toLocaleString('en-NG')}`
            )}
          </span>
        </div>
        <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
          <span>Grand Total</span>
          <span>₦{grandTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Success Message (Only shows if 9 items & no errors) */}
      {totalItems >= 9 && !belowMinimumPrice && !hasStockIssues && (
        <p className="text-green-600 text-xs mt-2 bg-green-50 p-2 rounded">
          🎉 Congrats! You got a <strong>30% shipping discount</strong> for 9 items!
        </p>
      )}

      {/* Error Message (Minimum Purchase) */}
      {belowMinimumPrice && (
        <p className="text-red-600 text-xs mt-2 bg-red-50 p-2 rounded">
          ❌ Minimum purchase amount is ₦12,000 to checkout.
        </p>
      )}

      <div className="mt-4 flex gap-3">
        <button
          onClick={handleCheckout}
          className={`flex-1 px-6 py-2 rounded-lg text-white transition ${
            isCartEmpty || hasStockIssues || belowMinimumPrice
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={isCartEmpty || hasStockIssues || belowMinimumPrice}
        >
          Checkout
        </button>
        <button
          onClick={clearCart}
          className={`px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition ${
            isCartEmpty ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isCartEmpty}
        >
          Clear Cart
        </button>
      </div>
    </div>
  );
};

export default CartSummary;