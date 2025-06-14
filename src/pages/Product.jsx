import { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, deleteDoc, collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { addToCart } from '/src/utils/cartUtils';
import CustomAlert, { useAlerts } from '/src/components/common/CustomAlert';
import ProductCard from '/src/components/home/ProductCard';
import SkeletonLoader from '/src/components/common/SkeletonLoader';

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState('');
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [mainMedia, setMainMedia] = useState('');
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState('right');
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);

  const { alerts, addAlert, removeAlert } = useAlerts();

  const colorMap = {
    red: '#ff0000',
    blue: '#0000FF',
    brown: '#8b4513',
    green: '#008000',
    black: '#000000',
    gold: '#ff9a1d',
    white: '#FFFFFF',
    yellow: '#FFFF00',
    gray: '#808080',
    purple: '#800080',
    pink: '#FFC1CC',
    orange: '#FFA500',
    silver: '#e2f2ec',
  };

  const SIZE_RELEVANT_CATEGORIES = ['foremade fashion', 'clothing', 'shoes', 'accessories'];

  const fetchFavorites = useCallback(async () => {
    if (!auth.currentUser) {
      setFavorites([]);
      return;
    }
    try {
      const favoritesQuery = query(
        collection(db, 'favorites'),
        where('userId', '==', auth.currentUser.uid)
      );
      const favoritesSnapshot = await getDocs(favoritesQuery);
      const favoriteIds = favoritesSnapshot.docs.map((doc) => doc.data().productId);
      setFavorites(favoriteIds);
    } catch (err) {
      console.error('Error fetching favorites:', err);
      addAlert('Failed to load favorites.', 'error', 3000);
    }
  }, [addAlert]);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchFavorites();
      } else {
        setFavorites([]);
      }
    });

    return () => unsubscribe();
  }, [fetchFavorites]);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        console.log('Starting fetchProduct for ID:', id);
        if (!id || typeof id !== 'string' || id.trim() === '' || id.includes('/')) {
          throw new Error('Invalid product ID');
        }
        const productRef = doc(db, 'products', id);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
          throw new Error('Product not found');
        }
        const data = productSnap.data();
        if (data.status !== 'approved') {
          throw new Error('Product not approved');
        }
        let imageUrls = Array.isArray(data.imageUrls)
          ? data.imageUrls.filter(
              (url) => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/')
            )
          : data.imageUrl &&
            typeof data.imageUrl === 'string' &&
            data.imageUrl.startsWith('https://res.cloudinary.com/')
          ? [data.imageUrl]
          : ['https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg'];
        let videoUrls = Array.isArray(data.videoUrls)
          ? data.videoUrls.filter(
              (url) => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/')
            )
          : [];
        if (imageUrls.length === 0) {
          imageUrls = ['https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg'];
        }
        console.log('Product imageUrls:', imageUrls);
        console.log('Product videoUrls:', videoUrls);
        const category = data.category?.trim().toLowerCase() || 'uncategorized';
        const requiresSizes = SIZE_RELEVANT_CATEGORIES.includes(category);
        console.log('Category:', category, 'Requires sizes:', requiresSizes, 'Sizes:', data.sizes || []);
        const reviewsSnapshot = await getDocs(collection(db, `products/${id}/reviews`));
        const reviews = reviewsSnapshot.docs.map((reviewDoc) => {
          const reviewData = reviewDoc.data();
          let userName = reviewData.userName || 'Anonymous';
          if (typeof userName === 'object' && userName.name) {
            userName = userName.name;
          }
          return {
            id: reviewDoc.id,
            ...reviewData,
            userName,
          };
        });
        const productData = {
          id: productSnap.id,
          name: data.name || 'Unnamed Product',
          description: data.description || '',
          price: data.price || 0,
          stock: data.stock || 0,
          category,
          colors: data.colors || [],
          sizes: requiresSizes ? data.sizes || [] : [],
          condition: data.condition || 'New',
          imageUrls,
          videoUrls,
          imageUrl: imageUrls[0],
          tags: data.tags || [],
          seller: data.seller || { name: 'Unknown Seller', id: data.sellerId || '' },
          rating: data.rating || Math.random() * 2 + 3,
          reviews,
          status: data.status || 'pending',
        };
        console.log('Fetched product:', productData);
        setProduct(productData);
        setMainMedia(productData.imageUrls[0]);
        setCurrentMediaIndex(0);
        console.log('Main media set:', productData.imageUrls[0]);

        const updateRecentSearches = () => {
          const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
          const newSearch = {
            id: productData.id,
            name: productData.name,
            imageUrl: productData.imageUrl,
            category: productData.category,
            status: productData.status,
          };
          const updatedRecent = [newSearch, ...recent.filter((item) => item.id !== id)].slice(0, 5);
          localStorage.setItem('recentSearches', JSON.stringify(updatedRecent));
        };
        updateRecentSearches();

        const similarQuery = query(collection(db, 'products'), where('category', '==', productData.category));
        const querySnapshot = await getDocs(similarQuery);
        const similar = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            if (data.status !== 'approved') return null;
            let imageUrl =
              data.imageUrl &&
              typeof data.imageUrl === 'string' &&
              data.imageUrl.startsWith('https://res.cloudinary.com/')
                ? data.imageUrl
                : Array.isArray(data.imageUrls) &&
                  data.imageUrls[0] &&
                  typeof data.imageUrls[0] === 'string' &&
                  data.imageUrls[0].startsWith('https://res.cloudinary.com/')
                ? data.imageUrls[0]
                : 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg';
            if (doc.id === id) return null;
            const similarCategory = data.category?.trim().toLowerCase() || 'uncategorized';
            const requiresSizesForSimilar = SIZE_RELEVANT_CATEGORIES.includes(similarCategory);
            console.log('Similar product category:', similarCategory, 'Requires sizes:', requiresSizesForSimilar, 'Sizes:', data.sizes || []);
            return {
              id: doc.id,
              name: data.name || 'Unnamed Product',
              price: data.price || 0,
              stock: data.stock || 0,
              category: similarCategory,
              colors: data.colors || [],
              sizes: requiresSizesForSimilar ? data.sizes || [] : [],
              condition: data.condition || 'New',
              imageUrl,
              tags: data.tags || [],
              seller: data.seller || { name: 'Unknown Seller', id: data.sellerId || '' },
              rating: data.rating || Math.random() * 2 + 3,
              status: data.status || 'pending',
            };
          })
          .filter((product) => product && product.imageUrl);
        console.log('Fetched similar products:', similar);
        setSimilarProducts(similar.slice(0, 4));
      } catch (err) {
        console.error('Error loading product:', err);
        setProduct(null);
        setSimilarProducts([]);
        addAlert(err.message || 'Failed to load product.', 'error', 3000);
        if (err.message.includes('Product not found') || err.message.includes('Invalid product ID') || err.message.includes('Product not approved')) {
          navigate('/products');
        }
      }
    };

    const fetchRecentSearches = async () => {
      try {
        console.log('Starting fetchRecentSearches...');
        const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
        if (recent.length === 0) {
          setRecentSearches([]);
          return;
        }
        const products = [];
        for (const item of recent) {
          if (item.status !== 'approved') continue;
          const productRef = doc(db, 'products', item.id);
          const productSnap = await getDoc(productRef);
          if (productSnap.exists()) {
            const data = productSnap.data();
            if (data.status !== 'approved') continue;
            let imageUrl =
              data.imageUrl &&
              typeof data.imageUrl === 'string' &&
              data.imageUrl.startsWith('https://res.cloudinary.com/')
                ? data.imageUrl
                : Array.isArray(data.imageUrls) &&
                  data.imageUrls[0] &&
                  typeof data.imageUrls[0] === 'string' &&
                  data.imageUrls[0].startsWith('https://res.cloudinary.com/')
                ? data.imageUrls[0]
                : 'https://res.cloudinary.com/your_cloud_name/image/upload/v1/default.jpg';
            const category = data.category?.trim().toLowerCase() || 'uncategorized';
            const requiresSizes = SIZE_RELEVANT_CATEGORIES.includes(category);
            console.log('Recent search category:', category, 'Requires sizes:', requiresSizes, 'Sizes:', data.sizes || []);
            products.push({
              id: productSnap.id,
              name: data.name || 'Unnamed Product',
              price: data.price || 0,
              stock: data.stock || 0,
              category,
              colors: data.colors || [],
              sizes: requiresSizes ? data.sizes || [] : [],
              condition: data.condition || 'New',
              imageUrl,
              tags: data.tags || [],
              seller: data.seller || { name: 'Unknown Seller', id: data.sellerId || '' },
              rating: data.rating || Math.random() * 2 + 3,
              status: data.status || 'pending',
            });
          }
        }
        console.log('Fetched recent searches:', products);
        setRecentSearches(products);
      } catch (err) {
        console.error('Error fetching recent searches:', err);
        addAlert('Failed to load recent searches.', 'error', 3000);
        setRecentSearches([]);
      }
    };

    const fetchAllData = async () => {
      try {
        setLoading(true);
        console.log('Starting fetchAllData...');
        await Promise.all([fetchProduct(), fetchRecentSearches()]);
        console.log('All data fetched successfully.');
      } catch (err) {
        console.error('Error in fetchAllData:', err);
      } finally {
        console.log('Setting loading to false...');
        setLoading(false);
      }
    };

    fetchAllData();
  }, [id, navigate]);

  useEffect(() => {
    if (!product || product.imageUrls.length <= 1 || isVideoPlaying) return;

    const interval = setInterval(() => {
      setCurrentMediaIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % product.imageUrls.length;
        setSlideDirection('right');
        setMainMedia(product.imageUrls[nextIndex]);
        setIsVideoPlaying(false);
        console.log('Auto-slid to media:', product.imageUrls[nextIndex], 'Index:', nextIndex);
        return nextIndex;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [product, isVideoPlaying]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      if (quantity > product.stock) {
        addAlert(`Cannot add more than ${product.stock} units of ${product.name}`, 'error', 3000);
        setQuantity(product.stock > 0 ? product.stock : 1);
        return;
      }
      await addToCart(product.id, quantity, auth.currentUser?.uid);
      addAlert(`${product.name} added to cart!`, 'success', 3000);
      setQuantity(1);
    } catch (err) {
      console.error('Error adding to cart:', err);
      addAlert('Failed to add to cart', 'error', 3000);
    }
  };

  const toggleFavorite = async () => {
    if (!product) {
      addAlert('No product selected', 'error', 3000);
      return;
    }
    if (!auth.currentUser) {
      addAlert('Please log in to manage favorites', 'error', 3000);
      return;
    }
    try {
      const favoritesRef = collection(db, 'favorites');
      const favoriteQuery = query(
        favoritesRef,
        where('userId', '==', auth.currentUser.uid),
        where('productId', '==', product.id)
      );
      const favoriteSnap = await getDocs(favoriteQuery);
      if (!favoriteSnap.empty) {
        for (const doc of favoriteSnap.docs) {
          if (doc.data().userId !== auth.currentUser.uid) continue;
          await deleteDoc(doc.ref);
        }
        setFavorites((prev) => prev.filter((id) => id !== product.id));
        addAlert('Removed from favorites', 'success', 3000);
      } else {
        await addDoc(favoritesRef, {
          userId: auth.currentUser.uid,
          productId: product.id,
          createdAt: serverTimestamp(),
        });
        setFavorites((prev) => [...prev, product.id]);
        addAlert('Added to favorites!', 'success', 3000);
      }
    } catch (err) {
      console.error('Error toggling favorite:', err);
      addAlert('Failed to update favorites.', 'error', 3000);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      addAlert('Please log in to submit a review', 'error', 3000);
      return;
    }
    if (reviewRating < 1 || reviewRating > 5) {
      addAlert('Please select a valid rating (1-5)', 'error', 3000);
      return;
    }
    if (!reviewComment.trim()) {
      addAlert('Please enter a review comment', 'error', 3000);
      return;
    }
    try {
      let userName;
      try {
        const storedUserData = localStorage.getItem('userData');
        userName = storedUserData
          ? JSON.parse(storedUserData).name || 'Anonymous'
          : auth.currentUser.displayName || 'Anonymous';
      } catch {
        userName = auth.currentUser.displayName || 'Anonymous';
      }
      await addDoc(collection(db, `products/${id}/reviews`), {
        userId: auth.currentUser.uid,
        userName,
        rating: reviewRating,
        comment: reviewComment,
        date: serverTimestamp(),
      });
      addAlert('Review submitted successfully!', 'success', 3000);
      setReviewRating(0);
      setReviewComment('');
      setShowReviewForm(false);
      const reviewsSnapshot = await getDocs(collection(db, `products/${id}/reviews`));
      const reviews = reviewsSnapshot.docs.map((reviewDoc) => {
        const reviewData = reviewDoc.data();
        let userName = reviewData.userName || 'Anonymous';
        if (typeof userName === 'object' && userName.name) {
          userName = userName.name;
        }
        return {
          id: reviewDoc.id,
          ...reviewData,
          userName,
        };
      });
      console.log('Updated reviews:', reviews);
      setProduct((prev) => ({ ...prev, reviews }));
    } catch (err) {
      console.error('Error submitting review:', err);
      addAlert('Failed to submit review', 'error', 3000);
    }
  };

  const handleMediaClick = (media, index) => {
    if (typeof media === 'string' && (media.startsWith('https://res.cloudinary.com/') || media.includes('.mp4'))) {
      setSlideDirection(index > currentMediaIndex ? 'right' : 'left');
      setMainMedia(media);
      setCurrentMediaIndex(index);
      setIsVideoPlaying(media.includes('.mp4'));
      console.log('Main media updated:', media, 'Is video:', media.includes('.mp4'), 'Direction:', index > currentMediaIndex ? 'right' : 'left');
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SkeletonLoader type="productDetail" count={1} />
        <CustomAlert alerts={alerts} removeAlert={removeAlert} />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600">Product not found or not approved.</p>
        <Link to="/products" className="text-blue-600 hover:underline">
          Back to Products
        </Link>
        <CustomAlert alerts={alerts} removeAlert={removeAlert} />
      </div>
    );
  }

  const DESCRIPTION_LIMIT = 100;
  const REVIEW_LIMIT = 5;
  const truncatedDescription =
    product.description.length > DESCRIPTION_LIMIT
      ? `${product.description.substring(0, DESCRIPTION_LIMIT)}...`
      : product.description;
  const shouldShowDescriptionToggle = product.description.length > DESCRIPTION_LIMIT;
  const displayedReviews = showAllReviews ? product.reviews : product.reviews?.slice(0, REVIEW_LIMIT);
  const imageMedia = product.imageUrls;

  return (
    <div className="relative container mx-auto p-5">
      <style>
        {`
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideInLeft {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .slide-in-right {
            animation: slideInRight 0.5s ease-in-out forwards;
          }
          .slide-in-left {
            animation: slideInLeft 0.5s ease-in-out forwards;
          }
          .main-image-container {
            position: relative;
            width: 100%;
            height: 0;
            padding-top: 100%; /* Creates a perfect square (100% of width) */
            overflow: hidden;
          }
          .main-image-container img, .main-image-container video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease-in-out;
            border-radius: 0.5rem;
          }
          .main-image-container:hover img, .main-image-container:hover video {
            transform: scale(1.5);
          }
          .thumbnail-video {
            width: 3.5rem;
            height: 3.5rem;
            object-fit: cover;
            border-radius: 0.5rem;
          }
        `}
      </style>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-3/4">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="md:w-1/2">
              <div className="main-image-container">
                {typeof mainMedia === 'string' && mainMedia.includes('.mp4') ? (
                  <video
                    src={mainMedia}
                    controls
                    className={slideDirection === 'right' ? 'slide-in-right' : 'slide-in-left'}
                    onError={(e) => {
                      console.error('Video load error:', { productId: product.id, videoUrl: e.target.src, name: product.name });
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML += '<div class="absolute w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-500 text-sm">Video N/A</span></div>';
                    }}
                    onLoadedData={() => console.log('Video loaded:', { productId: product.id, videoUrl: mainMedia, name: product.name })}
                  />
                ) : (
                  <img
                    src={mainMedia}
                    alt={product.name}
                    className={slideDirection === 'right' ? 'slide-in-right' : 'slide-in-left'}
                    onError={(e) => {
                      console.error('Image load error:', { productId: product.id, imageUrl: e.target.src, name: product.name });
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML += '<div class="absolute w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-500 text-sm">Image N/A</span></div>';
                    }}
                    onLoad={(e) => {
                      console.log('Image loaded:', { productId: product.id, imageUrl: mainMedia, name: product.name });
                      e.target.style.opacity = '1';
                    }}
                  />
                )}
              </div>
              {(imageMedia.length > 1 || product.videoUrls.length > 0) && (
                <div className="flex items-center justify-center gap-2 mt-2 overflow-x-auto">
                  {imageMedia.map((media, index) => (
                    <div
                      key={index}
                      className="relative"
                      onClick={() => handleMediaClick(media, index)}
                    >
                      <img
                        src={media}
                        alt={`${product.name} ${index + 1}`}
                        className={`w-14 h-14 object-cover rounded-lg border cursor-pointer ${
                          mainMedia === media ? 'border-blue-500 border-2' : 'border-gray-300'
                        }`}
                        onError={(e) => {
                          console.error('Thumbnail image error:', { productId: product.id, imageUrl: e.target.src, name: product.name });
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML += '<div class="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-500 text-xs">Image N/A</span></div>';
                        }}
                        onLoad={() => console.log('Thumbnail image loaded:', { productId: product.id, imageUrl: media, name: product.name })}
                      />
                    </div>
                  ))}
                  {product.videoUrls.map((video, index) => (
                    <div
                      key={`video-${index}`}
                      className="relative"
                      onClick={() => handleMediaClick(video, imageMedia.length + index)}
                    >
                      <video
                        src={video}
                        className="thumbnail-video border cursor-pointer"
                        muted
                        loop
                        autoPlay
                        onError={(e) => {
                          console.error('Thumbnail video error:', { productId: product.id, videoUrl: e.target.src, name: product.name });
                          e.target.style.display = 'none';
                          e.target.parentElement.innerHTML += '<div class="w-14 h-14 bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-500 text-xs">Video N/A</span></div>';
                        }}
                        onLoadedData={() => console.log('Thumbnail video loaded:', { productId: product.id, videoUrl: video, name: product.name })}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="md:w-1/2">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{product.name}</h1>
              <p className="text-sm text-gray-600 mb-2">
                Seller: <span className="font-medium">{product.seller.name}</span>
              </p>
              <p className="text-sm text-gray-600 mb-2">
                Category: <span className="font-medium">{product.category}</span>
              </p>
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {product.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
              <div className="flex items-center mb-3">
                {[...Array(5)].map((_, i) => (
                  <i
                    key={i}
                    className={`bx bxs-star text-amber-400 text-base sm:text-lg md:text-xl ${
                      i < Math.floor(product.rating) ? 'bx-star-filled' : ''
                    }`}
                  ></i>
                ))}
                <span className="text-sm text-gray-600 ml-2">
                  ({product.reviews?.length || 0} reviews)
                </span>
              </div>
              <p className="text-2xl font-bold text-gray-800 mb-4">
                ₦{product.price.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-600 mb-4">
                Stock:{' '}
                <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>
                  {product.stock > 0 ? `${product.stock} units available` : 'Out of stock'}
                </span>
              </p>
              {product.colors.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-1">Colors:</label>
                  <div className="flex gap-2">
                    {product.colors.map((color, index) => (
                      <div key={index} className="relative group">
                        <span
                          className="w-6 h-6 rounded-full inline-block border border-gray-300"
                          style={{ backgroundColor: colorMap[color.toLowerCase()] || '#000000' }}
                        ></span>
                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 -top-8 left-1/2 transform -translate-x-1/2">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {product.sizes.length > 0 && (
                <div className="mb-4">
                  <label className="block text-sm text-gray-600 mb-1">Sizes:</label>
                  <div className="flex gap-2">
                    {product.sizes.map((size, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-gray-100 rounded"
                      >
                        {size}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center mb-4">
                <label className="mr-2 text-sm text-gray-600">Quantity:</label>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-16 p-1 border border-gray-300 rounded"
                  disabled={product.stock === 0}
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddToCart}
                  className={`w-full px-2 py-1 text-xs rounded-lg transition ${
                    product.stock > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={product.stock <= 0}
                >
                  {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
                <button
                  onClick={toggleFavorite}
                  className={`flex items-center justify-center gap-2 px-2 py-1 text-xs border rounded-lg transition ${
                    favorites.includes(product.id)
                      ? 'border-red-500 text-red-500 hover:bg-red-50'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <i
                    className={`bx bxs-heart text-xl ${
                      favorites.includes(product.id) ? 'text-red-500' : 'text-gray-400'
                    }`}
                  ></i>
                </button>
              </div>
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Product Description</h2>
            <p className="text-sm text-gray-700 leading-relaxed">
              {showFullDescription ? product.description : truncatedDescription}
            </p>
            {shouldShowDescriptionToggle && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="mt-2 text-blue-600 hover:underline text-sm"
              >
                {showFullDescription ? 'Show Less' : 'See More'}
              </button>
            )}
          </div>
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-3">Customer Reviews</h2>
            {auth.currentUser && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    setShowReviewForm(!showReviewForm);
                    console.log('Toggled review form:', !showReviewForm);
                  }}
                  className="text-blue-600 hover:underline text-sm"
                >
                  {showReviewForm ? 'Hide Review Form' : 'Write a Review'}
                </button>
                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} className="mt-4">
                    <h3 className="text-lg font-medium mb-2">Write a Review</h3>
                    <div className="flex items-center mb-2">
                      <label className="mr-2 text-sm text-gray-600">Rating:</label>
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`bx bxs-star text-base cursor-pointer ${
                            i < reviewRating ? 'text-amber-400' : 'text-gray-400'
                          }`}
                          onClick={() => setReviewRating(i + 1)}
                        ></i>
                      ))}
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Write your review..."
                      className="w-full p-2 border border-gray-300 rounded mb-2"
                      rows="4"
                    ></textarea>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                    >
                      Submit Review
                    </button>
                  </form>
                )}
              </div>
            )}
            {product.reviews && product.reviews.length > 0 ? (
              <>
                {displayedReviews.map((review) => (
                  <div key={review.id} className="border-b border-gray-200 py-3">
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`bx bxs-star text-sm ${
                            i < Math.floor(review.rating) ? 'text-amber-400' : 'text-gray-400'
                          }`}
                        ></i>
                      ))}
                      <span className="text-sm text-gray-600 ml-2">({review.rating})</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{review.comment}</p>
                    <p className="text-xs text-gray-500">
                      By {review.userName || 'Anonymous'} on{' '}
                      {review.date?.toDate().toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      }) || 'Unknown Date'}
                    </p>
                  </div>
                ))}
                {product.reviews.length > REVIEW_LIMIT && (
                  <button
                    onClick={() => {
                      setShowAllReviews(!showAllReviews);
                      console.log('Toggled show all reviews:', !showAllReviews);
                    }}
                    className="mt-2 text-blue-600 hover:underline text-sm"
                  >
                    {showAllReviews
                      ? 'Show Less'
                      : `Show More (${product.reviews.length - REVIEW_LIMIT} more)`}
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-600">No reviews yet. Be the first to review this product!</p>
            )}
          </div>
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Searches</h2>
            {recentSearches.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recentSearches.map((recentProduct) => (
                  <ProductCard key={recentProduct.id} product={recentProduct} />
                )).slice(0, 4)}
              </div>
            ) : (
              <p className="text-sm text-gray-600">No recent searches found.</p>
            )}
          </div>
        </div>
        <div className="w-full md:w-1/4 max-md:hidden overflow-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Recommended for you</h2>
          <div className="flex flex-col gap-4 md:border-l md:pl-4">
            {similarProducts.length > 0 ? (
              similarProducts.map((similarProduct) => (
                <div key={similarProduct.id} className="md:w-full">
                  <ProductCard product={similarProduct} />
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-600">No similar products found.</p>
            )}
          </div>
        </div>
      </div>
      <div className="md:hidden lg:hidden xl:hidden mt-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recommended for you</h2>
        <div className="grid grid-cols-2 gap-4 overflow-auto">
          {similarProducts.length > 0 ? (
            similarProducts.map((similarProduct) => (
              <ProductCard key={similarProduct.id} product={similarProduct} />
            ))
          ) : (
            <p className="text-sm text-gray-600 col-span-2">No similar products found.</p>
          )}
        </div>
      </div>
      <CustomAlert alerts={alerts} removeAlert={removeAlert} />
    </div>
  );
};

export default Product;