import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '/src/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Help from '../common/Help';
import AddToCartButton from '/src/components/cart/AddToCartButton';

const ProductCard = ({ product }) => {
  // Define all hooks at the top, before any early returns
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const userId = 'currentUserId'; // Replace with actual user ID from auth
      if (!userId || !product?.id) {
        setIsFavorited(false); // Set default state instead of returning early
        setFavoriteCount(product?.favoriteCount || 0);
        return;
      }

      try {
        const productRef = doc(db, 'products', product.id);
        const docSnap = await getDoc(productRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setIsFavorited(data.favoritedBy?.includes(userId) || false);
          setFavoriteCount(data.favoriteCount || 0);
        }
      } catch (err) {
        console.error('Error checking favorite status:', err);
        toast.error('Failed to load favorite status.');
      }
    };
    checkFavoriteStatus();
  }, [product?.id]); // Use optional chaining to handle undefined product

  // Early return after all hooks are called
  if (!product || typeof product !== 'object') {
    console.error('Invalid product prop:', product);
    return null;
  }

  const truncateName = (name) => {
    if (!name) return '';
    return name.length > 17 ? name.slice(0, 14) + '...' : name;
  };

  const imageSrc =
    product.imageUrl &&
    typeof product.imageUrl === 'string' &&
    product.imageUrl.startsWith('https://') &&
    product.imageUrl.trim() !== ''
      ? product.imageUrl
      : '/images/placeholder.jpg';

  const handleFavorite = async () => {
    const userId = 'currentUserId'; // Replace with actual user ID from auth
    if (!userId || !product.id) {
      toast.error('Please sign in to favorite a product.');
      return;
    }

    try {
      const productRef = doc(db, 'products', product.id);
      const docSnap = await getDoc(productRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const currentFavoritedBy = data.favoritedBy || [];
        const currentCount = data.favoriteCount || 0;

        const 

        if (isFavorited) {
          await updateDoc(productRef, {
            favoritedBy: arrayRemove(userId),
            favoriteCount: currentCount - 1,
          });
          setIsFavorited(false);
          setFavoriteCount(currentCount - 1);
          toast.success('Removed from favorites!');
        } else {
          await updateDoc(productRef, {
            favoritedBy: arrayUnion(userId),
            favoriteCount: currentCount + 1,
          });
          setIsFavorited(true);
          setFavoriteCount(currentCount + 1);
          toast.success('Added to favorites!');
        }
      }
    } catch (err) {
      console.error('Error updating favorite:', err);
      toast.error('Failed to update favorite. Try again!');
    }
  };

  return (
    <div className="relative w-full max-w-[240px]">
      <Link to={`/product/${product.id}`} className="flex flex-col w-full">
        <div className="rounded-lg p-2 max-md:p-3 grid relative">
          <div className="relative">
            <img
              src={imageSrc}
              alt={product.name || 'Product'}
              className="h-[250px] w-[250px] border rounded-sm object-cover mb-1"
              onError={(e) => {
                if (e.target.src !== '/images/placeholder.jpg') {
                  console.warn('Image load error, falling back to placeholder:', {
                    productId: product.id,
                    imageUrl: product.imageUrl,
                    attemptedUrl: imageSrc,
                    name: product.name,
                  });
                  e.target.src = '/images/placeholder.jpg';
                }
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', {
                  productId: product.id,
                  imageUrl: imageSrc,
                  name: product.name,
                });
              }}
            />
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleFavorite();
              }}
              className="absolute bottom-2 left-2 bg-white rounded-full p-2 shadow-md hover:bg-gray-100 focus:outline-none"
            >
              <i
                className={`bx text-xl ${
                  isFavorited ? 'bx-heart text-red-500' : 'bx-heart text-gray-500'
                }`}
              ></i>
              <span className="ml-1 text-xs font-semibold">{favoriteCount}</span>
            </button>
          </div>
          <h3 className="text-sm font-semibold text-gray-800">{truncateName(product.name)}</h3>
          <p className="text-gray-600">
            ₦{(product.price || 0).toLocaleString('en-NG', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <div className="flex items-center mt-1">
            <div className="flex gap-1">
              {[...Array(5)].map((_, i) => (
                <i
                  key={i}
                  className={`bx bxs-star text-sm sm:text-base md:text-lg ${
                    i < Math.floor(product.rating || 0) ? 'text-amber-400' : 'text-gray-400'
                  }`}
                ></i>
              ))}
            </div>
          </div>
          <span className="inline-block mt-2 text-[14px] bg-[url('https://i.pinimg.com/736x/73/d3/1f/73d31fc942fcca8178fb9c07a970dd61.jpg')] bg-cover bg-center text-white px-2 py-1 rounded">
            Brand Store
          </span>
        </div>
      </Link>
      <div className="absolute top-2 right-2 max-md:top-1 max-md:right-1">
        <AddToCartButton productId={product.id} />
      </div>
      {/* <div className="absolute bottom-2 right-2 max-md:bottom-1 max-md:right-1">
        <Help />
      </div> */}
    </div>
  );
};

export default ProductCard;