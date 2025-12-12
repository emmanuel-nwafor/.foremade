import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '/src/firebase';
import { doc, getDoc, collection, getDocs } from 'firebase/firestore';
import { useCurrency } from '/src/CurrencyContext';
import PriceFormatter from '/src/components/layout/PriceFormatter';
import placeholder from '/src/assets/placeholder.png';

const CartItem = ({ item, updateCartQuantity, removeFromCart }) => {
  const { convertPrice } = useCurrency();
  const [mainImage, setMainImage] = useState(placeholder);
  const [product, setProduct] = useState(null);
  const [feeConfig, setFeeConfig] = useState({ buyerProtectionRate: 0.08, handlingRate: 0.20 });
  const [isDailyDeal, setIsDailyDeal] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [imageError, setImageError] = useState(false);

  const calculateTotalPrice = (basePrice, qty = 1, discountPercentage = 0) => {
    const discount = discountPercentage > 0 ? (basePrice * discountPercentage) / 100 : 0;
    const discountedPrice = basePrice - discount;
    return discountedPrice * (1 + feeConfig.buyerProtectionRate + feeConfig.handlingRate) * qty;
  };

  useEffect(() => {
    const fetchFeeConfig = async () => {
      try {
        const feeRef = doc(db, 'feeConfigurations', 'categoryFees');
        const feeSnap = await getDoc(feeRef);
        if (feeSnap.exists()) {
          const data = feeSnap.data();
          const category = product?.category || 'default';
          setFeeConfig(data[category] || { buyerProtectionRate: 0.08, handlingRate: 0.20 });
        }
      } catch (err) {
        console.error('Error fetching fee config:', err);
      }
    };

    const fetchProduct = async () => {
      if (!item || !item.productId) {
        console.warn('Invalid cart item data:', item);
        setProduct(null);
        setMainImage(placeholder);
        return;
      }

      try {
        const productRef = doc(db, 'products', item.productId);
        const productSnap = await getDoc(productRef);
        if (productSnap.exists()) {
          const productData = productSnap.data();
          setProduct({
            id: productSnap.id,
            name: productData.name || 'Unnamed Product',
            price: Number(productData.price) || 0,
            stock: Number(productData.stock) || 0,
            category: productData.category?.trim().toLowerCase() || 'uncategorized',
            imageUrls: productData.imageUrls || [],
          });

          const imageUrls = Array.isArray(productData.imageUrls)
            ? productData.imageUrls.filter((url) => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/'))
            : productData.imageUrl && typeof productData.imageUrl === 'string' && productData.imageUrl.startsWith('https://res.cloudinary.com/')
            ? [productData.imageUrl]
            : [];
          setMainImage(imageUrls.length > 0 ? imageUrls[0] : placeholder);

          const dealsSnapshot = await getDocs(collection(db, 'dailyDeals'));
          const activeDeal = dealsSnapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .find((deal) => deal.productId === item.productId && new Date(deal.endDate) > new Date() && new Date(deal.startDate) <= new Date());
          if (activeDeal) {
            setIsDailyDeal(true);
            setDiscountPercentage(Number((activeDeal.discount * 100).toFixed(2)));
          } else {
            setIsDailyDeal(false);
            setDiscountPercentage(0);
          }
        } else {
          console.warn(`Product ${item.productId} not found in Firestore.`);
          setProduct(null);
          setMainImage(placeholder);
        }
      } catch (err) {
        console.error('Product fetch error for cart item:', item.productId, ':', err);
        setProduct(null);
        setMainImage(placeholder);
      }
    };

    fetchFeeConfig();
    fetchProduct();
  }, [item]);

  const handleIncrement = () => {
    if (item.quantity < product.stock) {
      const newQuantity = item.quantity + 1;
      console.log('Incrementing quantity:', { productId: item.productId, newQuantity });
      updateCartQuantity(item.productId, newQuantity);
    }
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      const newQuantity = item.quantity - 1;
      console.log('Decrementing quantity:', { productId: item.productId, newQuantity });
      updateCartQuantity(item.productId, newQuantity);
    }
  };

  if (!item || !item.productId || !product) {
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

  // Use variant price and image if available
  const displayPrice = typeof item.variant?.price === 'number'
    ? item.variant.price
    : typeof item.price === 'number'
    ? item.price
    : product.price || 0;

  const displayImage = (() => {
    if (item.variant?.imageUrl && typeof item.variant.imageUrl === 'string' && item.variant.imageUrl.startsWith('https://res.cloudinary.com/')) {
      return item.variant.imageUrl;
    }
    if (item.variants?.length > 0 && item.variants[0]?.imageUrls?.length > 0 && item.variants[0].imageUrls[0].startsWith('https://res.cloudinary.com/')) {
      return item.variants[0].imageUrls[0];
    }
    return mainImage;
  })();

  // Truncate product name to 7-8 words
  const truncateName = (name, maxWords = 8) => {
    const words = name.split(' ');
    return words.length > maxWords ? words.slice(0, maxWords).join(' ') + '…' : name;
  };

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
      <Link to={`/product/${product.id}`}>
        <div className="relative w-16 h-16">
          {imageError && (
            <div className="absolute bottom-0 left-0 bg-red-600 text-white text-xs px-1 rounded">
              Image Failed
            </div>
          )}
          <img
            src={displayImage}
            alt={product.name}
            className="w-16 h-16 object-cover rounded"
            onError={(e) => {
              if (!imageError) {
                console.error('CartItem image load error:', { productId: item.productId, imageUrl: displayImage });
                setImageError(true);
                e.target.src = placeholder;
              }
            }}
            onLoad={() => {
              console.log('CartItem image loaded successfully:', { productId: item.productId, imageUrl: displayImage, name: product.name });
              setImageError(false);
            }}
            loading="lazy"
          />
        </div>
      </Link>
      <div className="flex-1">
        <Link to={`/product/${product.id}`}>
          <h3 className="text-sm font-bold text-gray-800">{truncateName(product.name)}</h3>
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
        <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden">
          <button
            onClick={handleDecrement}
            className={`px-1 py-1 text-gray-600 hover:bg-gray-200 transition ${
              item.quantity <= 1 || isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={item.quantity <= 1 || isOutOfStock}
            aria-label={`Decrease quantity of ${product.name}`}
          >
            <i className="bx bx-minus"></i>
          </button>
          <span className="px-3 py-1 text-gray-800 font-medium">{item.quantity}</span>
          <button
            onClick={handleIncrement}
            className={`px-1 py-1 text-gray-600 hover:bg-gray-200 transition ${
              item.quantity >= product.stock || isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={item.quantity >= product.stock || isOutOfStock}
            aria-label={`Increase quantity of ${product.name}`}
          >
            <i className="bx bx-plus"></i>
          </button>
        </div>
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