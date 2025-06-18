import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { db } from '/src/firebase';
import { doc, getDoc } from 'firebase/firestore';

const CartItem = ({ item, updateCartQuantity, removeFromCart }) => {
  const [mainImage, setMainImage] = useState('https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg');
  const [feeConfig, setFeeConfig] = useState({ taxRate: 0.075, buyerProtectionRate: 0.02, handlingRate: 0.05 });

  const calculateTotalPrice = (basePrice, qty = 1) => {
    return basePrice * (1 + feeConfig.taxRate + feeConfig.buyerProtectionRate + feeConfig.handlingRate) * qty;
  };

  useEffect(() => {
    const fetchFeeConfig = async () => {
      try {
        const feeRef = doc(db, 'feeConfigurations', 'categoryFees');
        const feeSnap = await getDoc(feeRef);
        if (feeSnap.exists()) {
          const data = feeSnap.data();
          const category = item?.product?.category || 'default';
          setFeeConfig(data[category] || { taxRate: 0.075, buyerProtectionRate: 0.02, handlingRate: 0.05 });
        }
      } catch (err) {
        console.error('Error fetching fee config:', err);
      }
    };

    const fetchImage = async () => {
      if (item && item.productId) {
        try {
          const productRef = doc(db, 'products', item.productId);
          const productSnap = await getDoc(productRef);
          let imageUrl = 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg';
          if (productSnap.exists()) {
            const productData = productSnap.data();
            const imageUrls = Array.isArray(productData.imageUrls)
              ? productData.imageUrls.filter((url) => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/'))
              : productData.imageUrl && typeof productData.imageUrl === 'string' && productData.imageUrl.startsWith('https://res.cloudinary.com/')
              ? [productData.imageUrl]
              : [];
            imageUrl = imageUrl.length > 0 ? imageUrls[0] : imageUrl;
          } else {
            console.warn(`Product ${item.productId} not found in Firestore.`);
          }
          setMainImage(imageUrl);
        } catch (err) {
          console.error('Image fetch error for cart item:', item.productId, ':', err);
          setMainImage('https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg');
        }
      }
    };

    fetchFeeConfig();
    fetchImage();
  }, [item]);

  if (!item || !item.product || !item.productId) {
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

  const product = {
    id: item.product.id || item.productId,
    name: item.product.name || 'Unnamed Product',
    price: item.product.price || 0,
    stock: item.product.stock || 0,
  };
  const isOutOfStock = product.stock === 0;
  const totalPrice = calculateTotalPrice(product.price, item.quantity);

  return (
    <div className="flex items-center gap-4 p-4 bg-gray-100 rounded-lg">
      <Link to={`/product/${product.id}`}>
        <img
          src={mainImage}
          alt={product.name}
          className="w-16 h-16 object-cover rounded"
          onError={(e) => {
            console.error('CartItem image load error:', { productId: item.productId, failedUrl: e.target.src, name: product.name });
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML =
              '<div class="w-16 h-16 bg-gray-200 rounded flex items-center justify-center"><span class="text-gray-500 text-xs">Image N/A</span></div>';
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
        <p className="text-xs text-gray-600">
          ₦{totalPrice.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </p>
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