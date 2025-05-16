import React from 'react';
import { useNavigate } from 'react-router-dom';

const CartSummary = ({ totalPrice, cartItems, clearCart }) => {
  const navigate = useNavigate();
  const hasStockIssues = cartItems.some((item) => item.quantity > (item.product?.stock || 0));
  const isCartEmpty = cartItems.length === 0;

  const subtotal = totalPrice;
  const taxRate = 0.075;
  const tax = subtotal * taxRate;
  const shipping = subtotal > 0 ? 500 : 0;
  const grandTotal = subtotal + tax + shipping;

  const handleCheckout = () => {
    navigate('/checkout');
  };

  return (
    <div className="mt-6 p-4 bg-gray-50 rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h2>
      <div className="space-y-2 text-sm text-gray-700">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>₦{subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax (7.5%)</span>
          <span>₦{tax.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span>₦{shipping.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
        <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
          <span>Grand Total</span>
          <span>₦{grandTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>
      <div className="mt-4 flex gap-3">
        <button
          onClick={handleCheckout}
          className={`flex-1 px-6 py-2 rounded-lg text-white transition ${
            isCartEmpty || hasStockIssues
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700'
          }`}
          disabled={isCartEmpty || hasStockIssues}
          aria-label="Proceed to checkout"
        >
          Checkout
        </button>
        <button
          onClick={clearCart}
          className={`px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 transition ${
            isCartEmpty ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={isCartEmpty}
          aria-label="Clear cart"
        >
          Clear Cart
        </button>
      </div>
    </div>
  );
};

export default CartSummary;