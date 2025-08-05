import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '/src/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useCurrency } from '/src/CurrencyContext';
import PriceFormatter from '/src/components/layout/PriceFormatter';

const CartSummary = ({ totalPrice: propTotalPrice, cartItems, clearCart }) => {
  const { convertPrice } = useCurrency();
  const navigate = useNavigate();
  const [feeConfig, setFeeConfig] = useState({ buyerProtectionRate: 0.08, handlingRate: 0.20 });
  const [minimumPurchase, setMinimumPurchase] = useState(25000);

  useEffect(() => {
    const fetchConfigs = async () => {
      try {
        const feeRef = doc(db, 'feeConfigurations', 'categoryFees');
        const feeSnap = await getDoc(feeRef);
        if (feeSnap.exists()) {
          const data = feeSnap.data();
          const category = cartItems[0]?.product?.category || 'default';
          setFeeConfig(data[category] || { buyerProtectionRate: 0.08, handlingRate: 0.20 });
        }

        const minRef = doc(db, 'settings', 'minimumPurchase');
        const minSnap = await getDoc(minRef);
        if (minSnap.exists()) {
          setMinimumPurchase(minSnap.data().amount || 25000);
        }
      } catch (err) {
        console.error('Error fetching configs:', err);
      }
    };

    const fetchDailyDeals = async () => {
      try {
        const dealsSnapshot = await getDocs(collection(db, 'dailyDeals'));
        const activeDeals = dealsSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .filter((deal) => new Date(deal.endDate) > new Date() && new Date(deal.startDate) <= new Date());
        return activeDeals;
      } catch (err) {
        console.error('Error fetching daily deals:', err);
        return [];
      }
    };

    const updateDealsForItems = async () => {
      const activeDeals = await fetchDailyDeals();
      cartItems.forEach((item) => {
        const deal = activeDeals.find((d) => d.productId === item.product.id);
        if (deal) {
          item.isDailyDeal = true;
          item.discountPercentage = (deal.discount * 100).toFixed(2);
        } else {
          item.isDailyDeal = false;
          item.discountPercentage = 0;
        }
      });
    };

    if (cartItems.length > 0) {
      updateDealsForItems();
    }

    fetchConfigs();
  }, [cartItems]);

  const calculateTotalPrice = (basePrice, qty = 1, discountPercentage = 0) => {
    const discount = discountPercentage > 0 ? (basePrice * discountPercentage) / 100 : 0;
    const discountedPrice = basePrice - discount;
    return discountedPrice * (1 + feeConfig.buyerProtectionRate + feeConfig.handlingRate) * qty;
  };

  const totalPrice = cartItems.reduce((sum, item) => {
    return sum + calculateTotalPrice(item.product.price || 0, item.quantity || 1, item.discountPercentage || 0);
  }, 0);
  const hasStockIssues = cartItems.some((item) => item.quantity > (item.product?.stock || 0));
  const isCartEmpty = cartItems.length === 0;
  const totalItems = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const belowMinimumPrice = totalPrice < minimumPurchase;

  const shipping = 0;
  const grandTotal = totalPrice + shipping;

  const handleCheckout = () => {
    if (belowMinimumPrice) {
      alert(`Minimum purchase amount is ₦${minimumPurchase.toLocaleString('en-NG')} to checkout.`);
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
        {cartItems.map((item, index) => (
          item.isDailyDeal && (
            <div key={index} className="flex justify-between text-xs text-green-600">
              <span>Discount on {item.product.name}</span>
              <span>
                -<PriceFormatter price={((item.product.price * item.discountPercentage / 100) * item.quantity)} />
              </span>
            </div>
          )
        ))}
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span><PriceFormatter price={totalPrice} /></span>
        </div>
        <div className="flex justify-between">
          <span>Shipping</span>
          <span className="text-green-600 font-semibold">FREE</span>
        </div>
        <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
          <span>Grand Total</span>
          <span><PriceFormatter price={grandTotal} /></span>
        </div>
      </div>
      {belowMinimumPrice && (
        <p className="text-red-600 text-xs mt-2 bg-red-50 p-2 rounded">
          ❌ Minimum purchase amount is <PriceFormatter price={minimumPurchase} /> to checkout.
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
              : 'bg-[#112d4e] hover:bg-[#112d4e]'
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