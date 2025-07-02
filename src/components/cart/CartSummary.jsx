import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '/src/firebase';
import { doc, getDoc } from 'firebase/firestore';

const CartSummary = ({ totalPrice: propTotalPrice, cartItems, clearCart }) => {
  const navigate = useNavigate();
  const [feeConfig, setFeeConfig] = useState({ taxRate: 0.075, buyerProtectionRate: 0.02, handlingRate: 0.05 });

  useEffect(() => {
    const fetchFeeConfig = async () => {
      try {
        const feeRef = doc(db, 'feeConfigurations', 'categoryFees');
        const feeSnap = await getDoc(feeRef);
        if (feeSnap.exists()) {
          const data = feeSnap.data();
          const category = cartItems[0]?.product?.category || 'default';
          setFeeConfig(data[category] || { taxRate: 0.075, buyerProtectionRate: 0.02, handlingRate: 0.05 });
        }
      } catch (err) {
        console.error('Error fetching fee config:', err);
      }
    };

    fetchFeeConfig();
  }, [cartItems]);

  const calculateTotalPrice = (basePrice, qty = 1) => {
    return basePrice * (1 + feeConfig.taxRate + feeConfig.buyerProtectionRate + feeConfig.handlingRate) * qty;
  };

  const totalPrice = cartItems.reduce((sum, item) => sum + calculateTotalPrice(item.product.price || 0, item.quantity || 1), 0);
  const hasStockIssues = cartItems.some((item) => item.quantity > (item.product?.stock || 0));
  const isCartEmpty = cartItems.length === 0;
  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const belowMinimumPrice = totalPrice < 1000; // Aligned with Checkout.js

  // Shipping is free within Nigeria
  const shipping = 0;

  // Remove discount logic to match Checkout.js
  const grandTotal = totalPrice + shipping;

  const handleCheckout = () => {
    if (belowMinimumPrice) {
      alert('Minimum purchase amount is ₦12,000 to checkout.');
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
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="text-green-600 font-semibold">FREE</span>
        </div>
        <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
          <span>Grand Total</span>
          <span>₦{grandTotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Error Messages */}
      {belowMinimumPrice && (
        <p className="text-red-600 text-xs mt-2 bg-red-50 p-2 rounded">
          ❌ Minimum purchase amount is ₦25,000 to checkout.
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