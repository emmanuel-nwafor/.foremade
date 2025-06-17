import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth, db } from '/src/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { toast } from 'react-toastify';
import AddToCartButton from '/src/components/cart/AddToCartButton';

const FALLBACK_IMAGE = 'https://via.placeholder.com/200?text=No+Image';

const ProductCard = ({ product }) => {
  console.log('ProductCard received product:', product);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [imageUrl, setImageUrl] = useState(FALLBACK_IMAGE);
  const [imageFailed, setImageFailed] = useState(false);

  // Calculate total price with fees (from Product.jsx)
  const calculateTotalPrice = (basePrice, qty = 1) => {
    const buyerProtectionFee = basePrice * 0.02; // 2%
    const handlingFee = 500; // ₦500 per item
    const subtotal = basePrice + handlingFee;
    const tax = subtotal * 0.075; // 7.5% VAT
    const total = (basePrice + buyerProtectionFee + handlingFee + tax) * qty;
    return total;
  };

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!product || typeof product !== 'object' || !product.id) {
        console.log('Invalid or missing product ID:', product);
        setIsFavorited(false);
        setFavoriteCount(0);
        return;
      }

      try {
        const productRef = doc(db, 'products', product.id);
        const docSnap = await getDoc(productRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Firestore favorite data:', {
            id: product.id,
            favoritedBy: data.favoritedBy,
            favoriteCount: data.favoriteCount,
          });
          const userId = auth.currentUser?.uid;
          setIsFavorited(userId && Array.isArray(data.favoritedBy) && data.favoritedBy.includes(userId) || false);
          setFavoriteCount(data.favoriteCount || 0);
        } else {
          console.warn('Product not found in Firestore:', product.id);
          setIsFavorited(false);
          setFavoriteCount(0);
        }
      } catch (err) {
        console.error('Error fetching favorite data:', err);
        toast.error('Failed to load favorite data.');
      }
    };
    fetchFavorites();

    // Set imageUrl from props
    let validImage = FALLBACK_IMAGE;
    if (typeof product.imageUrl === 'string' && product.imageUrl.startsWith('https://')) {
      validImage = product.imageUrl;
    } else if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0 && typeof product.imageUrls[0] === 'string' && product.imageUrls[0].startsWith('https://')) {
      validImage = product.imageUrls[0];
    }
    console.log('Setting imageUrl to:', validImage);
    setImageUrl(validImage);
    setImageFailed(false);
  }, [product.id, product.imageUrl, product.imageUrls]);

  const truncateName = (name) => {
    if (!name || typeof name !== 'string') return 'Unnamed Product';
    return name.length > 15 ? name.slice(0, 12) + '...' : name;
  };

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const userId = auth.currentUser?.uid;
    if (!userId || !product?.id) {
      toast.error('Please sign in to favorite a product.');
      return;
    }

    try {
      const productRef = doc(db, 'products', product.id);
      const docSnap = await getDoc(productRef);
      if (!docSnap.exists()) {
        toast.error('Product not found.');
        return;
      }

      const data = docSnap.data();
      const currentCount = data.favoriteCount || 0;
      const favoritedBy = data.favoritedBy || [];

      if (isFavorited) {
        await updateDoc(productRef, {
          favoritedBy: arrayRemove(userId),
          favoriteCount: Math.max(0, currentCount - 1),
        });
        setIsFavorited(false);
        setFavoriteCount(Math.max(0, currentCount - 1));
        toast.success('Removed from favorites!');
      } else {
        if (favoritedBy.includes(userId)) {
          toast.info('You have already favorited this product.');
          return;
        }
        await updateDoc(productRef, {
          favoritedBy: arrayUnion(userId),
          favoriteCount: currentCount + 1,
        });
        setIsFavorited(true);
        setFavoriteCount(currentCount + 1);
        toast.success('Added to favorites!');
      }
    } catch (err) {
      console.error('Error updating favorite:', err);
      toast.error('Failed to update favorite. Try again!');
    }
  };

  const trackProductView = () => {
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    if (product.id && !recentlyViewed.includes(product.id)) {
      const updatedRecentlyViewed = [product.id, ...recentlyViewed].slice(0, 10);
      localStorage.setItem('recentlyViewed', JSON.stringify(updatedRecentlyViewed));
    }
  };

  const totalPrice = calculateTotalPrice(product.price || 0);

  return (
    <Link
      to={`/product/${product.id}`}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition duration-300 flex flex-col"
      onClick={trackProductView}
      tabIndex={0}
      aria-label={product.name}
    >
      {/* Image Container with fixed height */}
      <div className="relative h-[200px] overflow-hidden rounded-t-lg">
        <img
          src={imageFailed ? FALLBACK_IMAGE : imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={() => {
            if (!imageFailed) {
              console.warn('Image load error:', { productId: product.id, imageUrl, name: product.name });
              setImageFailed(true);
              setImageUrl(FALLBACK_IMAGE);
            }
          }}
          loading="lazy"
          fetchpriority="low"
        />
        {/* Favorite button overlay */}
        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 p-1.5 flex items-center justify-evenly bg-white/70 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <i className={`bx ${isFavorited ? 'bxs-heart' : 'bx-heart'} text-xl ${isFavorited ? 'text-gray-600' : ''}`} />
          <p className="mx-1 text-sm">{favoriteCount}</p>
        </button>
      </div>

      {/* Content area with flex layout */}
      <div className="flex flex-col justify-between flex-grow p-3">
        {/* Product info */}
        <div>
          <h3 className="font-medium text-sm text-gray-800 line-clamp-2 mb-1" title={product.name}>
            {truncateName(product.name)}
          </h3>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <i className="bx bx-store text-blue-600 mr-1"></i>
            <span className="line-clamp-1" title={product.sellerName || product.seller?.name || 'Unknown Seller'}>
              {product.sellerName || product.seller?.name || 'Unknown Seller'}
            </span>
          </div>
        </div>

        {/* Price and cart section - always at bottom */}
        <div className="mt-auto">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-600">
              ₦{totalPrice.toLocaleString('en-NG')}
            </span>
            <AddToCartButton productId={product.id} isIconOnly={true} />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;