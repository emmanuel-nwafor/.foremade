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

  return (
    <div>
      <style>
        {`
          .shimmer {
            position: relative;
            height: 250px;
            background: #f6f7f8;
            overflow: hidden;
            border: 1px solid #e5e7eb;
            border-radius: 2px;
          }
          .shimmer::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(
              90deg,
              rgba(255, 255, 255, 0) 0%,
              rgba(255, 255, 255, 0.4) 50%,
              rgba(255, 255, 255, 0) 100%
            );
            animation: shimmer 1.5s infinite;
          }
          @keyframes shimmer {
            0% { left: -100%; }
            100% { left: 100%; }
          }
        `}
      </style>
      <div className="grid">
        <div className="relative">
          <Link to={`/product/${product.id}`}>
            {imageFailed ? (
              <div className="shimmer mb-1" />
            ) : (
              <img
                src={imageUrl}
                alt={product.name || 'Product'}
                className="h-[300px] w-[300px] rounded-lg object-cover mb-1"
                onError={() => {
                  console.warn('Image load error, falling back to shimmer:', { productId: product.id, imageUrl, name: product.name });
                  setImageFailed(true);
                }}
                onLoad={() => console.log('Image loaded:', { productId: product.id, imageUrl, name: product.name })}
              />
            )}
          </Link>
          {product.status === 'approved' && (
            <div className="absolute top-2 right-2 bg-green-100 text-green-600 px-2 py-1 rounded-full flex items-center gap-1 text-xs">
              <i className="bx bxs-check-circle text-green-600"></i>
              <span>Verified</span>
            </div>
          )}
          <button
            onClick={handleFavorite}
            className="absolute bottom-2 left-2 bg-white rounded-full px-2 py-1 border border-gray-300 flex items-center"
          >
            <i className={`bx ${isFavorited ? 'bx-heart text-gray-500' : 'bx-heart text-slate-500'} text-lg`}></i>
            {favoriteCount > 0 && <span className="text-slate-600 text-sm font-bold rounded-full px-1">{favoriteCount}</span>}
          </button>
        </div>
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm mb-1 text-gray-800">{truncateName(product.name)}</h3>
              <p className="text-amber-600 text-sm">
                ₦{(product.price || 0).toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <AddToCartButton productId={product.id} />
          </div>
          <div className="flex justify-between mt-1">
            <div className="flex items-center">
              {showSizes ? (
                <div className="flex flex-wrap gap-1">
                  {product.sizes.map((size, index) => (
                    <span key={index} className="text-md text-gray-700 mt-1 rounded">{size}</span>
                  ))}
                </div>
              ) : <div className="text-xs text-gray-600">No sizes available</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
