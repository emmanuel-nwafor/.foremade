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
  const [sellerLocation, setSellerLocation] = useState('');
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
  const [isDailyDeal, setIsDailyDeal] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);

  const { alerts, addAlert, removeAlert } = useAlerts();

  const colorMap = {
    red: '#ff0000',
    blue: '#0000ff',
    brown: '#8b4513',
    green: '#008000',
    black: '#000000',
    gold: '#ff9a1d',
    white: '#ffffff',
    yellow: '#ffff00',
    gray: '#808080',
    purple: '#800080',
    pink: '#ffc1cc',
    orange: '#ffa500',
    silver: '#e2f2ec',
  };

  const tagStyles = {
    new: 'bg-blue-100 text-blue-700 border-blue-200',
    sale: 'bg-red-100 text-red-700 border-red-200',
    trending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    default: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  const SIZE_RELEVANT_CATEGORIES = ['foremade fashion', 'clothing', 'shoes', 'accessories'];

  const calculateTotalPrice = (basePrice, qty, discountPercentage = 0) => {
    const discount = discountPercentage > 0 ? (basePrice * discountPercentage) / 100 : 0;
    const discountedPrice = basePrice - discount;
    return discountedPrice * (1 + 0.075 + 0.02 + 0.05) * qty; // Match Checkout.js
  };

  const formatDescription = (text) => {
    if (!text || typeof text !== 'string') return '';
    const sanitized = text.replace(/<[^>]+>/g, '');
    const lines = sanitized.split('\n');
    let isList = false;
    let output = lines
      .map((line) => {
        line = line.trim();
        if (!line) return null;
        line = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        line = line.replace(/__(.*?)__/g, '<strong>$1</strong>');
        if (line.startsWith('- ') || line.startsWith('* ')) {
          const content = line.substring(2).trim();
          if (!isList) {
            isList = true;
            return `<li class="ml-4 list-disc">${content}</li>`;
          }
          return `<li class="ml-4 list-disc">${content}</li>`;
        }
        if (isList) {
          isList = false;
          return `</ul><p class="mb-2">${line}</p>`;
        }
        return `<p class="mb-2">${line}</p>`;
      })
      .filter(Boolean)
      .join('');
    if (isList) output += '</ul>';
    return output;
  };

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
        console.log('Fetching product ID:', id);
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
        let location = '';
        if (data.sellerId) {
          const sellerRef = doc(db, 'users', data.sellerId);
          const sellerSnap = await getDoc(sellerRef);
          if (sellerSnap.exists()) {
            const sellerData = sellerSnap.data();
            location = sellerData.location
              ? `${sellerData.location.city || ''}, ${sellerData.location.state || ''}, ${sellerData.location.country || ''}`
                  .trim()
                  .replace(/, ,/g, ',')
              : '';
          }
        }
        setSellerLocation(location);

        let imageUrls = Array.isArray(data.imageUrls)
          ? data.imageUrls.filter((url) => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/'))
          : data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('https://res.cloudinary.com/')
          ? [data.imageUrl]
          : ['https://via.placeholder.com/600'];
        let videoUrls = Array.isArray(data.videoUrls)
          ? data.videoUrls.filter((url) => typeof url === 'string' && url.startsWith('https://res.cloudinary.com/'))
          : [];
        if (imageUrls.length === 0) {
          imageUrls = ['https://via.placeholder.com/600'];
        }
        const category = data.category?.trim().toLowerCase() || 'uncategorized';
        const requiresSizes = SIZE_RELEVANT_CATEGORIES.includes(category);
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
          sellerId: data.sellerId || '',
          rating: data.rating || Math.random() * 2 + 3,
          reviews,
          status: data.status || 'pending',
          isDailyDeal: data.isDailyDeal || false,
          discountPercentage: data.discountPercentage || 0,
        };
        console.log('Fetched product:', productData);
        setProduct(productData);
        setMainMedia(productData.imageUrls[0]);
        setCurrentMediaIndex(0);
        setIsDailyDeal(productData.isDailyDeal);
        setDiscountPercentage(productData.discountPercentage);

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
              data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('https://res.cloudinary.com/')
                ? data.imageUrl
                : Array.isArray(data.imageUrls) &&
                  data.imageUrls[0] &&
                  typeof data.imageUrls[0] === 'string' &&
                  data.imageUrls[0].startsWith('https://res.cloudinary.com/')
                ? data.imageUrls[0]
                : 'https://via.placeholder.com/600';
            if (doc.id === id) return null;
            const similarCategory = data.category?.trim().toLowerCase() || 'uncategorized';
            const requiresSizesForSimilar = SIZE_RELEVANT_CATEGORIES.includes(similarCategory);
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
              isDailyDeal: data.isDailyDeal || false,
              discountPercentage: data.discountPercentage || 0,
            };
          })
          .filter((product) => product && product.imageUrl);
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
              data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('https://res.cloudinary.com/')
                ? data.imageUrl
                : Array.isArray(data.imageUrls) &&
                  data.imageUrls[0] &&
                  typeof data.imageUrls[0] === 'string' &&
                  data.imageUrls[0].startsWith('https://res.cloudinary.com/')
                ? data.imageUrls[0]
                : 'https://via.placeholder.com/600';
            const category = data.category?.trim().toLowerCase() || 'uncategorized';
            const requiresSizes = SIZE_RELEVANT_CATEGORIES.includes(category);
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
              isDailyDeal: data.isDailyDeal || false,
              discountPercentage: data.discountPercentage || 0,
            });
          }
        }
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
        await Promise.all([fetchProduct(), fetchRecentSearches()]);
      } catch (err) {
        console.error('Error in fetchAllData:', err);
      } finally {
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

  const DESCRIPTION_LIMIT = 150;
  const REVIEW_LIMIT = 5;
  const truncatedDescription =
    product.description.length > DESCRIPTION_LIMIT ? `${product.description.substring(0, DESCRIPTION_LIMIT)}...` : product.description;
  const shouldShowDescriptionToggle = product.description.length > DESCRIPTION_LIMIT;
  const displayedReviews = showAllReviews ? product.reviews : product.reviews?.slice(0, REVIEW_LIMIT);
  const imageMedia = product.imageUrls;
  const totalPrice = calculateTotalPrice(product.price, quantity, isDailyDeal ? discountPercentage : 0);

  return (
    <div className="mb-[160px] container mx-auto px-4 py-6 md:py-8">
      <style>
        {`
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fadeIn { animation: fadeIn 0.5s ease-out; }
          @keyframes slideInRight {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          @keyframes slideInLeft {
            from { transform: translateX(-100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
          .slide-in-right { animation: slideInRight 0.3s ease-out; }
          .slide-in-left { animation: slideInLeft 0.3s ease-out; }
          .main-media-container {
            position: relative;
            width: 100%;
            padding-top: 100%;
            overflow: hidden;
            border-radius: 0.75rem;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          }
          .main-media-container img, .main-media-container video {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            object-fit: cover;
            transition: transform 0.3s ease;
          }
          .main-media-container:hover img, .main-media-container:hover video {
            transform: scale(1.05);
          }
          .thumbnail {
            transition: all 0.2s ease;
          }
          .thumbnail:hover {
            transform: scale(1.1);
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
          }
          .sticky-cart {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: white;
            padding: 1rem;
            box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
            z-index: 50;
          }
          .formatted-description strong {
            font-weight: 600;
          }
          .formatted-description ul {
            list-style: disc;
            margin-left: 1.5rem;
            margin-bottom: 0.5rem;
          }
          .formatted-description li {
            margin-bottom: 0.25rem;
          }
        `}
      </style>
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            <div>
              <div className="main-media-container">
                {mainMedia.includes('.mp4') ? (
                  <video
                    src={mainMedia}
                    controls
                    autoPlay={isVideoPlaying}
                    className={slideDirection === 'right' ? 'slide-in-right' : 'slide-in-left'}
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML += '<div class="absolute w-full h-full bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-500 text-sm">Video N/A</span></div>';
                    }}
                  />
                ) : (
                  <img
                    src={mainMedia}
                    alt={product.name}
                    className={slideDirection === 'right' ? 'slide-in-right' : 'slide-in-left'}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/600';
                    }}
                  />
                )}
              </div>
              {(imageMedia.length > 1 || product.videoUrls.length > 0) && (
                <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide">
                  {imageMedia.map((media, index) => (
                    <img
                      key={index}
                      src={media}
                      alt={`${product.name} ${index + 1}`}
                      className={`w-16 h-16 object-cover rounded-lg border cursor-pointer thumbnail ${
                        mainMedia === media ? 'border-blue-500 border-2' : 'border-gray-200'
                      }`}
                      onClick={() => handleMediaClick(media, index)}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/64';
                      }}
                    />
                  ))}
                  {product.videoUrls.map((video, index) => (
                    <video
                      key={`video-${index}`}
                      src={video}
                      className={`w-16 h-16 object-cover rounded-lg border cursor-pointer thumbnail ${
                        mainMedia === video ? 'border-blue-500 border-2' : 'border-gray-200'
                      }`}
                      muted
                      loop
                      autoPlay
                      onClick={() => handleMediaClick(video, imageMedia.length + index)}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML += '<div class="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center"><span class="text-gray-500 text-xs">Video N/A</span></div>';
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
            <div className="flex flex-col gap-3">
              <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{product.name}</h1>
              {isDailyDeal && (
                <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  Daily Deal! -{discountPercentage}%
                </span>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span>
                  Seller: <strong>{product.seller.name}</strong>
                </span>
                {sellerLocation && (
                  <>
                    <span>|</span>
                    <span className="flex items-center">
                      <i className="bx bx-map text-blue-600 mr-1" />
                      <strong>{sellerLocation}</strong>
                    </span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <i
                    key={i}
                    className={`bx ${i < Math.floor(product.rating) ? 'bxs-star' : 'bx-star'} text-lg text-amber-400`}
                  />
                ))}
                <span className="text-sm text-gray-600">({product.reviews?.length || 0} reviews)</span>
              </div>
              {product.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {product.tags.map((tag, index) => {
                    const tagKey = tag.toLowerCase();
                    const style = tagStyles[tagKey] || tagStyles.default;
                    return (
                      <span
                        key={index}
                        className={`px-3 py-1 text-xs font-medium rounded-full border ${style} transform hover:scale-105 transition-transform shadow-sm`}
                      >
                        {tag}
                      </span>
                    );
                  })}
                </div>
              )}
              <div className="text-sm text-gray-600">
                Category: <span className="font-medium">{product.category}</span>
              </div>
              <div className="text-sm text-gray-600">
                Condition: <span className="font-medium">{product.condition}</span>
              </div>
              <div className="text-sm text-gray-600">
                Stock: <span className={product.stock > 0 ? 'text-green-600' : 'text-red-600'}>{product.stock > 0 ? `${product.stock} available` : 'Out of stock'}</span>
              </div>
              {product.colors.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Colors:</label>
                  <div className="flex gap-2 flex-wrap">
                    {product.colors.map((color, index) => (
                      <div key={index} className="relative group">
                        <span
                          className="w-8 h-8 rounded-full inline-block border border-gray-300 cursor-pointer transform hover:scale-110 transition-transform"
                          style={{ backgroundColor: colorMap[color.toLowerCase()] || '#000000' }}
                          aria-label={color}
                        />
                        <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded px-2 py-1 -top-8 left-1/2 transform -translate-x-1/2">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {product.sizes.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Sizes:</label>
                  <div className="flex gap-2 flex-wrap">
                    {product.sizes.map((size, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-full border border-gray-200 hover:bg-gray-200 transition-colors"
                      >
                        {product.category === 'shoes' ? `${size}"` : size}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              <div className="mt-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-2">Price:</h3>
                <p className="text-2xl font-bold text-blue-600">₦{totalPrice.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</p>
                <p className="text-xs text-gray-500">Total for {quantity} item(s)</p>
              </div>
              <div className="flex items-center gap-4 mt-4">
                <label className="text-sm font-medium text-gray-700">Quantity:</label>
                <input
                  type="number"
                  min="1"
                  max={product.stock}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={product.stock === 0}
                  aria-label="Quantity"
                />
              </div>
              <div className="flex gap-4 mt-4">
                <button
                  onClick={handleAddToCart}
                  className={`flex-1 py-3 px-6 rounded-lg text-sm font-medium transition-transform transform hover:scale-105 ${
                    product.stock > 0
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                  }`}
                  disabled={product.stock <= 0}
                  aria-label={product.stock > 0 ? 'Add to cart' : 'Out of stock'}
                >
                  {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                </button>
                <button
                  onClick={toggleFavorite}
                  className={`p-3 rounded-lg border transition-transform transform hover:scale-105 ${
                    favorites.includes(product.id)
                      ? 'border-red-500 text-red-500 hover:bg-red-50'
                      : 'border-gray-300 text-gray-600 hover:bg-gray-100'
                  }`}
                  aria-label={favorites.includes(product.id) ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <i className={`bx bxs-heart text-xl ${favorites.includes(product.id) ? 'text-red-500' : 'text-gray-400'}`} />
                </button>
              </div>
            </div>
          </div>
          <div className="mt-8 bg-gray-50 rounded-lg shadow-sm p-6 animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Product Description</h2>
            <div
              className="text-sm text-gray-700 leading-relaxed formatted-description"
              dangerouslySetInnerHTML={{ __html: showFullDescription ? formatDescription(product.description) : formatDescription(truncatedDescription) }}
            />
            {shouldShowDescriptionToggle && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="mt-2 text-blue-600 hover:underline text-sm"
                aria-label={showFullDescription ? 'Show less description' : 'Show more description'}
              >
                {showFullDescription ? 'Show Less' : 'Show More'}
              </button>
            )}
          </div>
          <div className="mt-8 bg-gray-50 rounded-lg shadow-sm p-6 animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Customer Reviews</h2>
            {auth.currentUser && (
              <div className="mb-6">
                <button
                  onClick={() => setShowReviewForm(!showReviewForm)}
                  className="text-blue-600 hover:underline text-sm"
                  aria-label={showReviewForm ? 'Hide review form' : 'Write a review'}
                >
                  {showReviewForm ? 'Hide Review Form' : 'Write a Review'}
                </button>
                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} className="mt-4 p-4 bg-gray-50 rounded-lg">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">Write a Review</h3>
                    <div className="flex items-center mb-3">
                      <label className="mr-2 text-sm font-medium text-gray-700">Rating:</label>
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`bx bxs-star text-lg cursor-pointer transition-colors ${
                            i < reviewRating ? 'text-amber-400' : 'text-gray-300 hover:text-amber-300'
                          }`}
                          onClick={() => setReviewRating(i + 1)}
                          aria-label={`Rate ${i + 1} stars`}
                        />
                      ))}
                    </div>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="Write your review..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                      rows="4"
                      aria-label="Review comment"
                    />
                    <button
                      type="submit"
                      className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-transform transform hover:scale-105"
                      aria-label="Submit review"
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
                  <div key={review.id} className="border-b border-gray-200 py-4 last:border-b-0">
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <i
                          key={i}
                          className={`bx ${i < Math.floor(review.rating) ? 'bxs-star' : 'bx-star'} text-sm text-amber-400`}
                        />
                      ))}
                      <span className="text-sm text-gray-600 ml-2">({review.rating})</span>
                    </div>
                    <p className="text-sm text-gray-700 mb-1">{review.comment}</p>
                    <p className="text-xs text-gray-500">
                      By {review.userName || 'Anonymous'} on{' '}
                      {review.date?.toDate().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) || 'Unknown Date'}
                    </p>
                  </div>
                ))}
                {product.reviews.length > REVIEW_LIMIT && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="mt-4 text-blue-600 hover:underline text-sm"
                    aria-label={showAllReviews ? 'Show fewer reviews' : 'Show more reviews'}
                  >
                    {showAllReviews ? 'Show Less' : `Show More (${product.reviews.length - REVIEW_LIMIT} more)`}
                  </button>
                )}
              </>
            ) : (
              <p className="text-sm text-gray-600 flex items-center">
                <i className="bx bx-message-square-detail mr-1 text-gray-400" />
                No reviews yet. Be the first to review this product!
              </p>
            )}
          </div>
          <div className="mt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Searches</h2>
            {recentSearches.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {recentSearches.slice(0, 4).map((recentProduct) => (
                  <ProductCard key={recentProduct.id} product={recentProduct} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 flex items-center">
                <i className="bx bx-search-alt-2 mr-1 text-gray-400" />
                No recent searches found.
              </p>
            )}
          </div>
        </div>
        <div className="hidden lg:block lg:col-span-1">
          <div className="sticky top-4">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Recommended for You</h2>
            <div className="flex flex-col gap-4">
              {similarProducts.length > 0 ? (
                similarProducts.map((similarProduct) => (
                  <ProductCard key={similarProduct.id} product={similarProduct} isDailyDeal={similarProduct.isDailyDeal} />
                ))
              ) : (
                <p className="text-sm text-gray-600 flex items-center">
                  <i className="bx bx-list-ul mr-1 text-gray-400" />
                  No similar products found.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
      <div className="lg:hidden mt-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recommended for You</h2>
        <div className="grid grid-cols-2 gap-4">
          {similarProducts.length > 0 ? (
            similarProducts.map((similarProduct) => (
              <ProductCard key={similarProduct.id} product={similarProduct} isDailyDeal={similarProduct.isDailyDeal} />
            ))
          ) : (
            <p className="text-sm text-gray-600 col-span-2 flex items-center">
              <i className="bx bx-list-ul mr-1 text-gray-400" />
              No similar products found.
            </p>
          )}
        </div>
      </div>
      <CustomAlert alerts={alerts} removeAlert={removeAlert} />
    </div>
  );
};

export default Product;