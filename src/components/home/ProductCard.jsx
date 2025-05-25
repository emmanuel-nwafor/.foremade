import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { db } from '/src/firebase';
import { doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';
import Help from '../common/Help';
import AddToCartButton from '/src/components/cart/AddToCartButton';

const ProductCard = ({ product, sellerType = 'casual' }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const userId = 'currentUserId'; // Replace with actual user ID from auth
      if (!userId || !product?.id) {
        setIsFavorited(false);
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
  }, [product?.id]);

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
        const currentCount = data.favoriteCount || 0;
        const favoritedBy = data.favoritedBy || [];

        if (isFavorited) {
          await updateDoc(productRef, {
            favoritedBy: arrayRemove(userId),
            favoriteCount: currentCount - 1,
          });
          setIsFavorited(false);
          setFavoriteCount(currentCount - 1);
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
      }
    } catch (err) {
      console.error('Error updating favorite:', err);
      toast.error('Failed to update favorite. Try again!');
    }
  };

  // Styles for pro seller
  const cardStyles = sellerType === 'pro'
    ? 'relative w-full max-w-[260px] border-2 border-yellow-500 rounded-lg p-2 max-md:p-3 shadow-md'
    : 'relative w-full max-w-[240px] rounded-lg p-2 max-md:p-3';

  const badgeContent = sellerType === 'pro' ? (
    <span className="inline-flex items-center mt-2 text-[14px] bg-yellow-500 text-white px-2 py-1 rounded">
      <i className="bx bxs-star text-[12px] mr-1"></i>
      Pro Seller
    </span>
  ) : (
    <span className="inline-block mt-2 text-[14px] bg-[url('https://i.pinimg.com/736x/73/d3/1f/73d31fc942fcca8178fb9c07a970dd61.jpg')] bg-cover bg-center text-white px-2 py-1 rounded">
      Brand Store
    </span>
  );

  return (
    <div className={cardStyles}>
      <div className="grid">
        <div className="relative">
          
          <Link to={`/product/${product.id}`}>
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
          </Link>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleFavorite();
            }}
            className="absolute bottom-2 left-2 bg-white rounded-full px-2 py-1 border border-gray-300 flex items-center"
          >
            <i
              className={`bx ${isFavorited ? 'bxs-heart text-red-500' : 'bx-heart text-gray-500'} text-lg`}
            ></i>
                        {/* Fav count */}
            <div>
              {favoriteCount > 0 && (
                <span className="text-slate-600 text-sm font-bold rounded-full px-1">
                  {favoriteCount}
                </span>
              )}
            </div>
          </button>
        </div>
        <div className="flex flex-col w-full">
          {/* Product name, price, and Add to Cart */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800">{truncateName(product.name)}</h3>
              <p className="text-gray-600">
                ₦{(product.price || 0).toLocaleString('en-NG', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </p>
            </div>
            <AddToCartButton productId={product.id} />
          </div>

          {/* Stars and favorite count */}
          <div className="flex justify-between mt-1">
            <div className="flex items-center">
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
          </div>
          {badgeContent}
        </div>
      </div>
      {/* <div className="bottom-2 right-2 max-md:bottom-1 max-md:right-1">
        <Help />
      </div> */}
    </div>
  );
};

export default ProductCard;