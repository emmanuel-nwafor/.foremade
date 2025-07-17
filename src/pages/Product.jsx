import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { auth, db } from '/src/firebase';
import { doc, getDoc, deleteDoc, collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { addToCart } from '/src/utils/cartUtils';
import CustomAlert, { useAlerts } from '/src/components/common/CustomAlert';
import ProductCard from '/src/components/home/ProductCard';
import SkeletonLoader from '/src/components/common/SkeletonLoader';
import PriceFormatter from '/src/components/layout/PriceFormatter';

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
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
  const [selectedColor, setSelectedColor] = useState('');
  const [selectedSize, setSelectedSize] = useState('');

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
    window.scrollTo(0, 0);
    setLoading(true);

    if (!id || typeof id !== 'string' || id.trim() === '') {
      setLoading(false);
      addAlert('Invalid product ID', 'error', 3000);
      navigate('/products');
      return;
    }

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
        };

        const dealsSnapshot = await getDocs(collection(db, 'dailyDeals'));
        const activeDeal = dealsSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .find((deal) => deal.productId === id && new Date(deal.endDate) > new Date() && new Date(deal.startDate) <= new Date());
        if (activeDeal) {
          setIsDailyDeal(true);
          setDiscountPercentage((activeDeal.discount * 100).toFixed(2));
        } else {
          setIsDailyDeal(false);
          setDiscountPercentage(0);
        }

        console.log('Fetched product:', productData);
        setProduct(productData);
        setMainMedia(productData.imageUrls[0]);
        setCurrentMediaIndex(0);
        
        if (productData.colors.length > 0) {
          setSelectedColor(productData.colors[0]);
        }
        if (productData.sizes.length > 0) {
          setSelectedSize(productData.sizes[0]);
        }

        const updateRecentSearches = () => {
          const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
          const newSearch = {
            id: productData.id,
            name: productData.name,
            imageUrl: productData.imageUrl,
            price: productData.price || 0,
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
          setTimeout(() => {
            navigate('/products');
          }, 2000);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();

    return () => {
      setLoading(false);
    };
  }, [id, navigate]);

  useEffect(() => {
    try {
      const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
      const validRecent = recent
        .filter(item => item && item.id && item.name)
        .map(item => ({
          ...item,
          price: typeof item.price === 'number' && !isNaN(item.price) ? item.price : 0
        }));
      setRecentSearches(validRecent);
    } catch (err) {
      console.error('Error loading recent searches:', err);
      setRecentSearches([]);
    }
  }, []);

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

  const handlePayNow = () => {
    if (!product) return;
    if (quantity > product.stock) {
      addAlert(`Cannot purchase more than ${product.stock} units of ${product.name}`, 'error', 3000);
      setQuantity(product.stock > 0 ? product.stock : 1);
      return;
    }
    navigate(`/checkout?productId=${product.id}&quantity=${quantity}&color=${encodeURIComponent(selectedColor || '')}&size=${encodeURIComponent(selectedSize || '')}`);
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`, { state: { from: location.pathname } });
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
  const originalPrice = calculateTotalPrice(product.price, quantity, 0);
  const avgRating = product.reviews && product.reviews.length > 0 
    ? (product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length).toFixed(1)
    : product.rating.toFixed(1);

  return (
    <div className="mb-[140px] container mx-auto px-4 py-6 md:py-8 relative">
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
          .product-info-card {
            background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
            border: 1px solid #e2e8f0;
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin-bottom: 1rem;
            transition: all 0.3s ease;
          }
          .product-info-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 0, 0, 0.1);
          }
          .price-section {
            background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
            border: 1px solid #93c5fd;
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin: 1rem 0;
          }
          .selection-option {
            transition: all 0.2s ease;
            cursor: pointer;
          }
          .selection-option:hover {
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          .selection-option.selected {
            border-color: #3b82f6;
            background-color: #dbeafe;
            box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
          }
          .info-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.25rem;
            font-size: 0.875rem;
            font-weight: 500;
            padding: 0.375rem 0.75rem;
            border-radius: 0.5rem;
            transition: all 0.2s ease;
          }
          .info-badge:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .quantity-controls {
            display: flex;
            align-items: center;
            border: 1px solid #d1d5db;
            border-radius: 0.5rem;
            overflow: hidden;
            background: white;
            max-width: 120px;
          }
          .quantity-controls button {
            background: #f9fafb;
            border: none;
            padding: 0.5rem 0.75rem;
            transition: all 0.2s ease;
            cursor: pointer;
          }
          .quantity-controls button:hover {
            background: #e5e7eb;
          }
          .quantity-controls input {
            border: none;
            text-align: center;
            width: 3rem;
            padding: 0.5rem;
            background: white;
          }
          .quantity-controls input:focus {
            outline: none;
            box-shadow: inset 0 0 0 2px #3b82f6;
          }
          .favorite-button {
            transition: all 0.3s ease;
          }
          .favorite-button:hover {
            transform: scale(1.2);
          }
          .favorite-button.active {
            transform: scale(1.1);
            color: #ef4444;
          }
        `}
      </style>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Media Section */}
            <div>
              <div className="relative main-media-container">
                {mainMedia.includes('.mp4') ? (
                  <video
                    src={mainMedia}
                    controls
                    autoPlay={isVideoPlaying}
                    className={slideDirection === 'right' ? 'slide-in-right' : 'slide-in-left'}
                    style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain', borderRadius: '0.75rem' }}
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
                    style={{ maxWidth: '100%', height: 'auto', objectFit: 'contain', borderRadius: '0.75rem' }}
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
                      className={`thumbnail w-16 h-16 object-cover rounded-lg cursor-pointer border-2 ${
                        currentMediaIndex === index ? 'border-blue-500' : 'border-gray-200'
                      }`}
                      style={{ minWidth: '4rem', minHeight: '4rem', maxWidth: '100%', objectFit: 'cover' }}
                      onClick={() => handleMediaClick(media, index)}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/600';
                      }}
                    />
                  ))}
                  {product.videoUrls.map((video, index) => (
                    <video
                      key={`video-${index}`}
                      src={video}
                      className={`thumbnail w-16 h-16 object-cover rounded-lg cursor-pointer border-2 ${
                        currentMediaIndex === imageMedia.length + index ? 'border-blue-500' : 'border-gray-200'
                      }`}
                      style={{ minWidth: '4rem', minHeight: '4rem', maxWidth: '100%', objectFit: 'cover' }}
                      onClick={() => handleMediaClick(video, imageMedia.length + index)}
                      onError={(e) => {
                        e.target.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              )}
              {/* Description */}
              <div className="product-info-card mt-6">
                <h3 className="text-lg font-bold text-gray-800 mb-3">Description</h3>
                <div
                  className="formatted-description text-gray-700 text-sm"
                  dangerouslySetInnerHTML={{
                    __html: showFullDescription
                      ? formatDescription(product.description)
                      : formatDescription(truncatedDescription),
                  }}
                />
                {shouldShowDescriptionToggle && (
                  <button
                    onClick={() => setShowFullDescription(!showFullDescription)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-2"
                  >
                    {showFullDescription ? 'Show Less' : 'Show More'}
                  </button>
                )}
              </div>
              {/* Reviews Section */}
              <div className="product-info-card" style={{ marginBottom: '2rem' }}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-gray-800">Reviews</h3>
                  {auth.currentUser && (
                    <button
                      onClick={() => setShowReviewForm(!showReviewForm)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      {showReviewForm ? 'Cancel' : 'Write a Review'}
                    </button>
                  )}
                </div>
                {showReviewForm && (
                  <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rating</label>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewRating(star)}
                            className={`w-8 h-8 ${
                              star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'
                            }`}
                          >
                            <svg fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Comment</label>
                      <textarea
                        value={reviewComment}
                        onChange={(e) => setReviewComment(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Share your experience with this product..."
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Submit Review
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowReviewForm(false)}
                        className="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}
                {displayedReviews && displayedReviews.length > 0 ? (
                  <div className="space-y-4">
                    {displayedReviews.map((review) => (
                      <div key={review.id} className="border-b border-gray-200 pb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <svg
                                key={star}
                                className={`w-4 h-4 ${
                                  star <= review.rating ? 'text-yellow-400' : 'text-gray-300'
                                }`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                          <span className="text-sm font-medium text-gray-700">{review.userName}</span>
                          <span className="text-xs text-gray-500">
                            {review.date ? new Date(review.date.seconds * 1000).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                        <p className="text-gray-700">{review.comment}</p>
                      </div>
                    ))}
                    {product.reviews && product.reviews.length > REVIEW_LIMIT && (
                      <button
                        onClick={() => setShowAllReviews(!showAllReviews)}
                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                      >
                        {showAllReviews ? 'Show Less' : `Show All ${product.reviews.length} Reviews`}
                      </button>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500">No reviews yet. Be the first to review this product!</p>
                )}
              </div>
            </div>

            {/* Product Info Section */}
            <div className="space-y-4 min-w-0">
              <div className="product-info-card min-w-0">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2 break-words">{product.name}</h1>
                
                {/* Tags */}
                {product.tags && product.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3 overflow-x-auto scrollbar-hide">
                    {product.tags.map((tag, index) => (
                      <span
                        key={index}
                        className={`px-2 py-1 text-xs rounded-full border ${
                          tagStyles[tag.toLowerCase()] || tagStyles.default
                        } break-words`}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Rating */}
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        className={`w-5 h-5 ${
                          star <= Math.floor(avgRating) ? 'text-yellow-400' : 'text-gray-300'
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {avgRating} ({product.reviews?.length || 0} reviews)
                  </span>
                </div>

                {/* Price Section */}
                <div className="price-section">
                  {isDailyDeal ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 min-w-0 overflow-x-auto">
                        <span className="text-2xl font-bold text-green-600 whitespace-nowrap">
                          <PriceFormatter price={totalPrice} />
                        </span>
                        <span className="text-lg text-gray-500 line-through whitespace-nowrap">
                          <PriceFormatter price={originalPrice} />
                        </span>
                        <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-medium whitespace-nowrap">
                          {discountPercentage}% OFF
                        </span>
                      </div>
                      <p className="text-sm text-green-600 font-medium">Daily Deal Active!</p>
                    </div>
                  ) : (
                    <div className="text-2xl font-bold text-gray-800">
                      <PriceFormatter price={totalPrice} />
                    </div>
                  )}
                  <div className="text-sm text-gray-500 mt-1">
                    Includes taxes and fees
                  </div>
                </div>

                {/* Product Info Badges */}
                <div className="flex flex-wrap gap-2 mb-4 min-w-0 overflow-x-auto scrollbar-hide">
                  <div className="info-badge bg-blue-100 text-blue-700 border border-blue-200">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                    <span>{product.condition}</span>
                  </div>
                  <div className="info-badge bg-green-100 text-green-700 border border-green-200">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 21c-4.418 0-8-4.03-8-9a8 8 0 1 1 16 0c0 4.97-3.582 9-8 9z" /><circle cx="12" cy="12" r="3" /></svg>
                    <span>{sellerLocation || 'Location not specified'}</span>
                  </div>
                  <div className="info-badge bg-purple-100 text-purple-700 border border-purple-200">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 7V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v1" /><path strokeLinecap="round" strokeLinejoin="round" d="M4 7h16v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7z" /></svg>
                    <span>{product.seller.name}</span>
                  </div>
                  <div className="info-badge bg-orange-100 text-orange-700 border border-orange-200">
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 17v-2a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                    <span>{product.stock} in stock</span>
                  </div>
                </div>

                {/* Color Selection */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Color:</h3>
                    <div className="flex flex-wrap gap-2">
                      {product.colors.map((color, index) => (
                        <div
                          key={index}
                          className={`selection-option w-8 h-8 rounded-full border-2 ${
                            selectedColor === color ? 'selected' : 'border-gray-300'
                          }`}
                          style={{ backgroundColor: colorMap[color.toLowerCase()] || color }}
                          onClick={() => setSelectedColor(color)}
                          title={color}
                        />
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Selected: {selectedColor}</p>
                  </div>
                )}

                {/* Size Selection */}
                {product.sizes && product.sizes.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Size:</h3>
                    <div className="flex flex-wrap gap-2 min-w-0">
                      {product.sizes.map((size, index) => (
                        <button
                          key={index}
                          className={`selection-option px-3 py-1 border rounded-md text-sm ${
                            selectedSize === size
                              ? 'selected border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-300 hover:border-gray-400'
                          } break-words`}
                          onClick={() => setSelectedSize(size)}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Selected: {selectedSize}</p>
                  </div>
                )}

                {/* Quantity Selection */}
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Quantity:</h3>
                  <div className="quantity-controls">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 hover:bg-gray-100"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => {
                        const value = parseInt(e.target.value) || 1;
                        setQuantity(Math.max(1, Math.min(value, product.stock)));
                      }}
                      min="1"
                      max={product.stock}
                      className="flex-1 text-center"
                    />
                    <button
                      onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                      className="px-3 py-2 hover:bg-gray-100"
                    >
                      +
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">
                    {product.stock} available
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>
                  <button
                    onClick={toggleFavorite}
                    className={`hover:text-red-500 hover:bg-red-200 hover: py-3 px-4 rounded-lg border transition-colors flex justify-center items-center ${
                      favorites.includes(product.id)
                        ? 'active bg-red-50 border-red-300 text-red-700'
                        : 'bg-gray-50 border-gray-300 text-gray-700'
                    }`}
                    title={favorites.includes(product.id) ? 'Remove from Favorites' : 'Add to Favorites'}
                  >
                    <svg
                      className="w-6 h-6"
                      fill={favorites.includes(product.id) ? 'currentColor' : 'none'}
                      stroke="currentColor"
                      strokeWidth="2"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products and Recent Searches Sidebar */}
        <div className="lg:col-span-1 min-w-0">
          <div className="sticky top-4 space-y-6 min-w-0">
            {/* Similar Products */}
            {similarProducts.length > 0 && (
              <div className="product-info-card min-w-0">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Similar Products</h3>
                <div className="space-y-4">
                  {similarProducts.map((similarProduct) => (
                    <div
                      key={similarProduct.id}
                      onClick={() => handleProductClick(similarProduct.id)}
                      className="block hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex gap-3">
                        <img
                          src={similarProduct.imageUrl}
                          alt={similarProduct.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/600';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium text-gray-800 truncate">
                            {similarProduct.name}
                          </h4>
                          <p className="text-sm text-gray-600">
                            <PriceFormatter price={similarProduct.price} />
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs text-gray-500">
                              {similarProduct.rating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="product-info-card min-w-0">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Recently Viewed</h3>
                <div className="space-y-4">
                  {recentSearches.slice(0, 3).map((recentProduct) => (
                    <div
                      key={recentProduct.id}
                      onClick={() => handleProductClick(recentProduct.id)}
                      className="block hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer"
                    >
                      <div className="flex gap-3">
                        <img
                          src={recentProduct.imageUrl}
                          alt={recentProduct.name}
                          className="w-12 h-12 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/600';
                          }}
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-medium text-gray-800 truncate">
                            {recentProduct.name}
                          </h4>
                          <p className="text-xs text-gray-600">
                            <PriceFormatter price={recentProduct.price || 0} />
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Cart for Mobile */}
        <div className="sticky-cart md:hidden min-w-0">
          <div className="flex items-center justify-between min-w-0 flex-wrap">
            <div>
              <div className="text-lg font-bold text-gray-800">
                <PriceFormatter price={totalPrice} />
              </div>
              {isDailyDeal && (
                <div className="text-sm text-green-600">
                  {discountPercentage}% off today!
                </div>
              )}
            </div>
            <button
              onClick={handlePayNow}
              disabled={product.stock === 0}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {product.stock === 0 ? 'Out of Stock' : 'Pay Now'}
            </button>
          </div>
        </div>

        <CustomAlert alerts={alerts} removeAlert={removeAlert} />
      </div>
    </div>
  );
};

export default Product;