import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth, db } from '/src/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { toast } from 'react-toastify';
import AddToCartButton from '/src/components/cart/AddToCartButton';

const ProductCard = ({ product }) => {
  console.log('ProductCard received product:', product);
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [imageUrl, setImageUrl] = useState('/images/placeholder.jpg');
  const [imageFailed, setImageFailed] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const fetchImageAndFavorites = async () => {
      if (!product || typeof product !== 'object' || !product.id || product.status !== 'approved') {
        console.log('Product not approved, invalid, or missing ID:', { productId: product?.id, status: product?.status });
        setIsFavorited(false);
        setFavoriteCount(0);
        setImageUrl('/images/placeholder.jpg');
        return;
      }

      try {
        const productRef = doc(db, 'products', product.id);
        const docSnap = await getDoc(productRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Firestore product data:', { id: product.id, status: data.status, imageUrls: data.imageUrls, favoritedBy: data.favoritedBy, favoriteCount: data.favoriteCount });
          const userId = auth.currentUser?.uid;
          setIsFavorited(userId && Array.isArray(data.favoritedBy) && data.favoritedBy.includes(userId) || false);
          setFavoriteCount(data.favoriteCount || 0);
          const validImage = Array.isArray(data.imageUrls) && data.imageUrls.length > 0 && typeof data.imageUrls[0] === 'string' && data.imageUrls[0].startsWith('https://') 
            ? data.imageUrls[0] 
            : '/images/placeholder.jpg';
          console.log('Setting imageUrl to:', validImage);
          setImageUrl(validImage);
          setImageFailed(false);
        } else {
          console.warn('Product not found in Firestore:', product.id);
          setImageUrl('/images/placeholder.jpg');
        }
      } catch (err) {
        console.error('Error fetching product data:', err);
        toast.error('Failed to load product data.');
        setImageUrl('/images/placeholder.jpg');
      }
    };
    fetchImageAndFavorites();
  }, [product?.id]);

  const truncateName = (name) => {
    if (!name) return '';
    return name.length > 17 ? name.slice(0, 14) + '...' : name;
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

  const showSizes =
    product?.category?.toLowerCase() === 'foremade fashion' &&
    Array.isArray(product.sizes) &&
    product.sizes.length > 0;

  // Handle tracking product views for "Recently Viewed" functionality
  const trackProductView = () => {
    // Get existing recently viewed products from localStorage
    const recentlyViewed = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');

    // Add current product to the front if it's not already there
    if (product.id && !recentlyViewed.includes(product.id)) {
      // Add to front of array and limit to 10 items
      const updatedRecentlyViewed = [product.id, ...recentlyViewed].slice(0, 10);
      localStorage.setItem('recentlyViewed', JSON.stringify(updatedRecentlyViewed));
    }
  };

  return (
    <Link
      to={`/product/${product.id}`}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition duration-300 h-[360px] flex flex-col"
      onClick={trackProductView}
      tabIndex={0}
      aria-label={product.name}
    >
      {/* Image Container with fixed height */}
      <div className="relative h-[200px] overflow-hidden rounded-t-lg">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover"
          onError={(e) => {
            console.warn('Image load error, falling back to shimmer:', { productId: product.id, imageUrl, name: product.name });
            setImageFailed(true);
          }}
        />
        {/* Favorite button overlay */}
        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 p-1.5 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          onMouseDown={e => e.stopPropagation()}
          onClickCapture={e => e.preventDefault()}
        >
          <i className={`bx ${isFavorited ? 'bxs-heart text-red-500' : 'bx-heart'} text-xl`}></i>
        </button>
      </div>

      {/* Content area with fixed height and flex layout */}
      <div className="flex flex-col justify-between flex-grow p-3">
        {/* Product info */}
        <div>
          <h3 className="font-medium text-sm text-gray-800 line-clamp-2 mb-1" title={product.name}>
            {product.name}
          </h3>
          <div className="flex items-center text-sm text-gray-600 mb-2">
            <i className="bx bx-store text-blue-600 mr-1"></i>
            <span className="line-clamp-1" title={product.seller?.name || 'Unknown Seller'}>
              {product.seller?.name || 'Unknown Seller'}
            </span>
          </div>
        </div>

        {/* Price and cart section - always at bottom */}
        <div className="mt-auto">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-600">
              ₦{product.price?.toLocaleString('en-NG') || '0'}
            </span>
            <AddToCartButton productId={product.id} isIconOnly={true} />
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;

