import React from 'react';
import { useNavigate } from 'react-router-dom';

const CartSummary = ({ totalPrice, cartItems, clearCart }) => {
  const navigate = useNavigate();
  const hasStockIssues = cartItems.some((item) => item.quantity > (item.product?.stock || 0));
  const isCartEmpty = cartItems.length === 0;
  const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);
  const belowMinimumPrice = totalPrice < 15000; // Minimum order is ₦15,000 from PDF

  // Shipping is free within Nigeria
  const shipping = 0;

  // Discount Logic
  let discount = 0;
  if (totalItems >= 10 && totalItems < 15) {
    discount = 0.12; // 12% discount
  } else if (totalItems >= 15 && totalItems < 20) {
    discount = 0.22; // 12% + 10% = 22% discount
  } else if (totalItems === 20) {
    discount = 0.30; // 12% + 10% + 8% = 30% discount
  }
  const discountAmount = totalPrice * discount;
  const subtotalAfterDiscount = totalPrice - discountAmount;
  const grandTotal = subtotalAfterDiscount + shipping;

  const handleCheckout = () => {
    if (belowMinimumPrice) {
      alert('Minimum purchase amount is ₦15,000 to checkout.');
      return;
    }
    if (totalItems > 20) {
      alert('Maximum basket size is 20 items.');
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
        {discount > 0 && (
          <div className="flex justify-between">
            <span>Discount ({(discount * 100).toFixed(0)}%)</span>
            <span className="text-green-600 font-semibold">
              -₦{discountAmount.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
            </span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="text-green-600 font-semibold">FREE</span>
        </div>
        <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
          <span>Grand Total</span>
          <span>₦{grandTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Success Message (Discount applied) */}
      {discount > 0 && !belowMinimumPrice && !hasStockIssues && (
        <p className="text-green-600 text-xs mt-2 bg-green-50 p-2 rounded">
          🎉 Congrats! You got a <strong>{(discount * 100).toFixed(0)}% discount</strong> for {totalItems} items!
        </p>
      )}

      {/* Error Messages */}
      {belowMinimumPrice && (
        <p className="text-red-600 text-xs mt-2 bg-red-50 p-2 rounded">
          ❌ Minimum purchase amount is ₦15,000 to checkout.
        </p>
      )}
      {totalItems > 20 && (
        <p className="text-red-600 text-xs mt-2 bg-red-50 p-2 rounded">
          ❌ Maximum basket size is 20 items.
        </p>
      )}

      <div className="mt-4 flex gap-3">
        <button
          onClick={handleCheckout}
          className={`flex-1 px-6 py-2 rounded-lg text-white transition ${
            isCartEmpty || hasStockIssues || belowMinimumPrice || totalItems > 20
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={isCartEmpty || hasStockIssues || belowMinimumPrice || totalItems > 20}
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