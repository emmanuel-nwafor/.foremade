import React, { useState, useEffect } from 'react'; // Re-add useState, useEffect
import { Link } from 'react-router-dom';
import { auth, db } from '/src/firebase'; // Re-add Firebase imports
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore'; // Re-add Firestore imports
import { toast } from 'react-toastify'; // Re-add toast
import { Heart } from 'lucide-react'; // Re-add Heart icon
import PriceFormatter from '/src/components/layout/PriceFormatter';
import { ShieldCheck } from 'lucide-react'; // Keep ShieldCheck for the other icon

const FALLBACK_IMAGE = 'https://via.placeholder.com/200?text=No+Image';

const ProductCard = ({ product }) => {
  // Re-add favorite related states
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  const [imageUrl, setImageUrl] = useState(
    (product.imageUrl && typeof product.imageUrl === 'string' && product.imageUrl.startsWith('https://'))
      ? product.imageUrl
      : (Array.isArray(product.imageUrls) && product.imageUrls.length > 0 && typeof product.imageUrls[0] === 'string' && product.imageUrls[0].startsWith('https://'))
        ? product.imageUrls[0]
        : FALLBACK_IMAGE
  );
  const [imageFailed, setImageFailed] = useState(false);

  const displayPrice = product.price || 0;

  const truncateText = (text, maxLength = 30) => {
    if (!text || typeof text !== 'string') return 'No name available';
    return text.length > maxLength ? text.slice(0, maxLength - 3) + '...' : text;
  };

  // Re-add useEffect for fetching favorite data
  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!product || !product.id) {
        setIsFavorited(false);
        setFavoriteCount(0);
        return;
      }
      try {
        const productRef = doc(db, 'products', product.id);
        const docSnap = await getDoc(productRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const userId = auth.currentUser?.uid;
          setIsFavorited(userId && Array.isArray(data.favoritedBy) && data.favoritedBy.includes(userId) || false);
          setFavoriteCount(data.favoriteCount || 0);
        } else {
          setIsFavorited(false);
          setFavoriteCount(0);
        }
      } catch (err) {
        console.error('Error fetching favorite status:', err);
        // Do not show toast here, as it might spam for every product card
      }
    };

    fetchFavoriteStatus();
    // Dependencies for this useEffect: product.id, and auth.currentUser?.uid (implicitly handled by product.id changes if user logs in/out)
    // Or more strictly: product.id, auth.currentUser?.uid
  }, [product.id]); // Keep product.id as the primary dependency

  // Re-add handleFavorite function
  const handleFavorite = async (e) => {
    e.preventDefault(); // Prevent default link navigation
    e.stopPropagation(); // Stop event propagation to the parent Link
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


  return (
    <Link
      to={`/product/${product.id}`}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition duration-300 flex flex-col min-w-0 overflow-hidden"
      tabIndex={0}
      aria-label={product.name}
    >
      <div className="relative h-[200px] overflow-hidden rounded-t-lg min-w-0">
        <img
          src={imageFailed ? FALLBACK_IMAGE : imageUrl}
          alt={product.name || 'Product Image'}
          className="w-full h-full object-cover max-w-full max-h-full"
          onError={() => {
            if (!imageFailed) {
              console.warn('Image load error for product:', product.id, product.name);
              setImageFailed(true);
              setImageUrl(FALLBACK_IMAGE);
            }
          }}
          loading="lazy"
          fetchPriority="low"
        />
        {/* Re-add the favorite button */}
        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 p-1.5 flex items-center justify-evenly bg-white/70 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart className={`w-5 h-5 ${isFavorited ? 'text-gray-600 fill-gray-600' : 'text-gray-600'}`} />
          <p className="mx-1 text-sm">{favoriteCount}</p>
        </button>
      </div>
      <div className="flex flex-col justify-between flex-grow p-3 min-w-0 overflow-hidden">
        <div>
          {/* Product Name - black text */}
          <h3 className="font-medium text-sm text-black line-clamp-2 mb-1 break-words truncate" title={product.name}>
            {truncateText(product.name)}
          </h3>

          {/* Product Condition: "New" or "Used" */}
          {product.condition && (
            <p className="text-xs text-gray-500 mb-2">
              <span className="font-semibold">{product.condition}</span>
            </p>
          )}
        </div>
        <div className="mt-auto">
          <div className="flex items-center justify-between">
            {/* Price - Using inline style for color */}
            <span
              className="font-semibold text-lg"
              style={{ color: 'black' }} // Keep this inline style for forcing black
            >
              <PriceFormatter price={displayPrice} />
            </span>
            {/* ShieldCheck icon remains */}
            <div className="p-2 flex items-center justify-center bg-gray-100 rounded-full">
              <ShieldCheck className="w-5 h-5 text-green-500" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;