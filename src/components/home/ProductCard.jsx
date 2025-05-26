import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { auth, db } from '/src/firebase';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { toast } from 'react-toastify';
import AddToCartButton from '/src/components/cart/AddToCartButton';

const ProductCard = ({ product, sellerType = 'casual' }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [imageUrl, setImageUrl] = useState('https://placehold.co/250x250?text=Placeholder');

  useEffect(() => {
    const fetchImageAndFavorites = async () => {
      if (!product?.id) {
        setIsFavorited(false);
        setFavoriteCount(0);
        setImageUrl('https://placehold.co/250x250?text=Placeholder');
        return;
      }

      try {
        const productRef = doc(db, 'products', product.id);
        const docSnap = await getDoc(productRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          // Set favorite status
          const userId = auth.currentUser?.uid;
          setIsFavorited(userId && data.favoritedBy?.includes(userId) || false);
          setFavoriteCount(data.favoriteCount || 0);
          // Set image URL
          const validImage =
            Array.isArray(data.imageUrls) &&
            data.imageUrls.length > 0 &&
            typeof data.imageUrls[0] === 'string' &&
            data.imageUrls[0].startsWith('https://')
              ? data.imageUrls[0]
              : 'https://placehold.co/250x250?text=Placeholder';
          setImageUrl(validImage);
        } else {
          console.warn('Product not found in Firestore:', product.id);
          setImageUrl('https://placehold.co/250x250?text=Placeholder');
        }
      } catch (err) {
        console.error('Error fetching product data:', err);
        toast.error('Failed to load product data.');
        setImageUrl('https://placehold.co/250x250?text=Placeholder');
      }
    };
    fetchImageAndFavorites();
  }, [product?.id]);

  if (!product || typeof product !== 'object') {
    console.error('Invalid product prop:', product);
    return null;
  }

  const truncateName = (name) => {
    if (!name) return '';
    return name.length > 17 ? name.slice(0, 14) + '...' : name;
  };

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const userId = auth.currentUser?.uid;
    if (!userId || !product.id) {
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

  // Show sizes only for Foremade Fashion category
  const showSizes =
    product?.category?.toLowerCase() === 'foremade fashion' &&
    Array.isArray(product.sizes) &&
    product.sizes.length > 0;

  // Styles for pro seller
  const cardStyles =
    sellerType === 'pro'
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
              src={imageUrl}
              alt={product.name || 'Product'}
              className="h-[250px] w-[270px] border rounded-sm object-cover mb-1"
              onError={(e) => {
                if (e.target.src !== 'https://placehold.co/250x250?text=Placeholder') {
                  console.warn('Image load error, falling back to placeholder:', {
                    productId: product.id,
                    imageUrl: imageUrl,
                    attemptedUrl: e.target.src,
                    name: product.name,
                    error: e.message || 'Unknown error',
                  });
                  e.target.src = 'https://placehold.co/250x250?text=Placeholder';
                  setImageUrl('https://placehold.co/250x250?text=Placeholder');
                }
              }}
              onLoad={() => {
                console.log('Image loaded successfully:', {
                  productId: product.id,
                  imageUrl: imageUrl,
                  name: product.name,
                });
              }}
            />
          </Link>
          <button
            onClick={handleFavorite}
            className="absolute bottom-2 left-2 bg-white rounded-full px-2 py-1 border border-gray-300 flex items-center"
          >
            <i
              className={`bx ${isFavorited ? 'bxs-heart text-red-500' : 'bx-heart text-gray-500'} text-lg`}
            ></i>
            {favoriteCount > 0 && (
              <span className="text-slate-600 text-sm font-bold rounded-full px-1">
                {favoriteCount}
              </span>
            )}
          </button>
        </div>
        <div className="flex flex-col w-full">
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
          <div className="flex justify-between mt-1">
            <div className="flex items-center">
              {showSizes ? (
                <div className="flex flex-wrap gap-1">
                  {product.sizes.map((size, index) => (
                    <span
                      key={index}
                      className="text-sm bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-gray-600">No sizes available</div>
              )}
            </div>
          </div>
          {badgeContent}
        </div>
      </div>
    </div>
  );
};

export default ProductCard;