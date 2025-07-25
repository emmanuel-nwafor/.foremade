import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '/src/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useCurrency } from '/src/CurrencyContext';
import PriceFormatter from '/src/components/layout/PriceFormatter';

const CartItem = ({ item, updateCartQuantity, removeFromCart }) => {
  const { convertPrice } = useCurrency();
  const [mainImage, setMainImage] = useState('https://via.placeholder.com/200?text=No+Image');
  const [product, setProduct] = useState(null);
  const [feeConfig, setFeeConfig] = useState({ taxRate: 0.075, buyerProtectionRate: 0.02, handlingRate: 0.05 });
  const [isDailyDeal, setIsDailyDeal] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);

  const calculateTotalPrice = (basePrice, qty = 1, discountPercentage = 0) => {
    const discount = discountPercentage > 0 ? (basePrice * discountPercentage) / 100 : 0;
    const discountedPrice = basePrice - discount;
    return discountedPrice * (1 + feeConfig.taxRate + feeConfig.buyerProtectionRate + feeConfig.handlingRate) * qty;
  };

  useEffect(() => {
    const fetchFeeConfig = async () => {
      try {
        const feeRef = doc(db, 'feeConfigurations', 'categoryFees');
        const feeSnap = await getDoc(feeRef);
        if (feeSnap.exists()) {
          const data = feeSnap.data();
          const category = product?.category || 'default';
          setFeeConfig(data[category] || { taxRate: 0.075, buyerProtectionRate: 0.02, handlingRate: 0.05 });
        }
      } catch (err) {
        console.error('Error fetching fee config:', err);
      }
    };

    const fetchProduct = async () => {
      if (item && item.productId) {
        try {
          const productRef = doc(db, 'products', item.productId);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const productData = productSnap.data();
            setProduct({
              id: productSnap.id,
              name: productData.name || 'Unnamed Product',
              price: productData.price || 0,
              stock: productData.stock || 0,
              category: productData.category?.trim().toLowerCase() || 'uncategorized',
            });
            const imageUrls = Array.isArray(productData.imageUrls)
              ? productData.imageUrls.filter((url) => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/'))
              : productData.imageUrl && typeof productData.imageUrl === 'string' && productData.imageUrl.startsWith('https://res.cloudinary.com/')
              ? [productData.imageUrl]
              : [];
            setMainImage(imageUrls.length > 0 ? imageUrls[0] : 'https://via.placeholder.com/200?text=No+Image');

            const dealsSnapshot = await getDocs(collection(db, 'dailyDeals'));
            const activeDeal = dealsSnapshot.docs
              .map((doc) => ({ id: doc.id, ...doc.data() }))
              .find((deal) => deal.productId === item.productId && new Date(deal.endDate) > new Date() && new Date(deal.startDate) <= new Date());
            if (activeDeal) {
              setIsDailyDeal(true);
              setDiscountPercentage((activeDeal.discount * 100).toFixed(2));
            } else {
              setIsDailyDeal(false);
              setDiscountPercentage(0);
            }
          } else {
            console.warn(`Product ${item.productId} not found in Firestore.`);
            setProduct(null);
            setMainImage('https://via.placeholder.com/200?text=No+Image');
          }
        } catch (err) {
          console.error('Product fetch error for cart item:', item.productId, ':', err);
          setProduct(null);
          setMainImage('https://via.placeholder.com/200?text=No+Image');
        }
      }
    };

    fetchFeeConfig();
    fetchProduct();
  }, [item]);

  if (!item || !item.productId || !product) {
    console.error('Invalid cart item data:', item);
    return (
      <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
        <div className="w-16 h-16 bg-gray-200 rounded flex items-center justify-center">
          <span className="text-gray-500 text-xs">Image N/A</span>
        </div>
        <div className="flex-1">
          <h3 className="text-sm font-bold text-gray-800">Product Not Found</h3>
          <p className="text-xs text-gray-600">Item ID: {item?.productId || 'Unknown'}</p>
          <p className="text-xs text-red-600">This product is no longer available.</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => removeFromCart(item?.productId)}
            className="text-red-500 hover:text-red-700"
            aria-label="Remove unavailable product from cart"
          >
            <i className="bx bx-trash text-xl"></i>
          </button>
        </div>
      </div>
    );
  }

  const isOutOfStock = product.stock === 0;
  const totalPrice = calculateTotalPrice(product.price, item.quantity, isDailyDeal ? discountPercentage : 0);

  // Use variant image and price if available
  const displayImage =
    item.variant?.imageUrl ||
    (item.variants?.length > 0 && item.variants[0]?.imageUrls?.[0]) ||
    item.imageUrl ||
    (Array.isArray(item.imageUrls) && item.imageUrls[0]) ||
    'https://via.placeholder.com/600';
  const displayPrice = typeof item.variant?.price === 'number'
    ? item.variant.price
    : typeof item.price === 'number'
    ? item.price
    : 0;

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
      <Link to={`/product/${product.id}`}>
        <img
          src={displayImage}
          alt={item.name}
          className="w-16 h-16 object-cover rounded"
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/600';
            console.error('CartItem image load error:', item);
          }}
          onLoad={() => {
            console.log('CartItem image loaded successfully:', { productId: item.productId, imageUrl: mainImage, name: product.name });
          }}
        />
      </Link>
      <div className="flex-1">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-bold text-gray-800">{product.name}</h3>
        </Link>
        {isDailyDeal && (
          <div className="flex items-center gap-2">
            <p className="text-xs text-blue-600 font-medium">
              <PriceFormatter price={totalPrice} />
            </p>
            <p className="text-xs text-gray-500 line-through">
              <PriceFormatter price={calculateTotalPrice(product.price, item.quantity, 0)} />
            </p>
          </div>
        )}
        {!isDailyDeal && (
          <p className="text-xs text-gray-600">
            <PriceFormatter price={totalPrice} />
          </p>
        )}
        <p className="text-xs text-gray-600">
          Stock:{' '}
          <span className={isOutOfStock ? 'text-red-600' : 'text-green-600'}>
            {isOutOfStock ? 'Out of stock' : `${product.stock} units available`}
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <input
          type="number"
          min="1"
          max={product.stock}
          value={item.quantity}
          onChange={(e) => {
            const value = parseInt(e.target.value) || 1;
            console.log('Updating quantity:', { productId: item.productId, newQuantity: value });
            updateCartQuantity(item.productId, value);
          }}
          className="w-16 p-1 border border-gray-300 rounded"
          disabled={isOutOfStock}
          aria-label={`Quantity of ${product.name}`}
        />
        <button
          onClick={() => {
            console.log('Removing item:', { productId: item.productId, name: product.name });
            removeFromCart(item.productId);
          }}
          className="text-red-500 hover:text-red-700"
          aria-label={`Remove ${product.name} from cart`}
        >
          <i className="bx bx-trash text-xl"></i>
        </button>
      </div>
    </div>
  );
};

export default CartItem;