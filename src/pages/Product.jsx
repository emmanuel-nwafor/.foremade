import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom"; // Added Link
import { auth, db } from "/src/firebase";
import {
  doc,
  getDoc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { addToCart } from "/src/utils/cartUtils";
import CustomAlert, { useAlerts } from "/src/components/common/CustomAlert";
import ProductCard from "/src/components/home/ProductCard";
import SkeletonLoader from "/src/components/common/SkeletonLoader";
import PriceFormatter from "/src/components/layout/PriceFormatter";

const Product = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [sellerLocation, setSellerLocation] = useState("");
  const [similarProducts, setSimilarProducts] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [showAllReviews, setShowAllReviews] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [mainMedia, setMainMedia] = useState("");
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [slideDirection, setSlideDirection] = useState("right");
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isDailyDeal, setIsDailyDeal] = useState(false);
  const [discountPercentage, setDiscountPercentage] = useState(0);
  const [selectedColor, setSelectedColor] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [previousVariant, setPreviousVariant] = useState(null);

  const { alerts, addAlert, removeAlert } = useAlerts();

 

  const tagStyles = {
    new: "bg-amber-100 text-amber-800 border-amber-300", // Soft yellow tag
    sale: "bg-emerald-100 text-emerald-800 border-emerald-300", // Soft green tag for sale
    trending: "bg-blue-100 text-blue-800 border-blue-300", // Soft blue tag
    default: "bg-gray-100 text-gray-800 border-gray-300", // Default light grey
  };
  // END OF CHANGED PART

  const SIZE_RELEVANT_CATEGORIES = [
    "foremade fashion",
    "clothing",
    "shoes",
    "accessories",
  ];

  const calculateTotalPrice = (basePrice, qty, discountPercentage = 0) => {
    const taxAndFees = 1 + 0.075 + 0.02 + 0.05;
    const discount =
      discountPercentage > 0 ? (basePrice * discountPercentage) / 100 : 0;
    const discountedPrice = basePrice - discount;
    return discountedPrice * taxAndFees * qty;
  };

  const formatDescription = (text) => {
    if (!text || typeof text !== "string") return "";
    const sanitized = text.replace(/<[^>]+>/g, "");
    const lines = sanitized.split("\n");
    let isList = false;
    let output = lines
      .map((line) => {
        line = line.trim();
        if (!line) return null;
        line = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
        line = line.replace(/__(.*?)__/g, "<strong>$1</strong>");
        if (line.startsWith("- ") || line.startsWith("* ")) {
          const content = line.substring(2).trim();
          if (!isList) {
            isList = true;
            return `<ul class="list-disc ml-4"><li class="mb-1">${content}</li>`;
          }
          return `<li class="mb-1">${content}</li>`;
        }
        if (isList) {
          isList = false;
          return `</ul><p class="mb-2">${line}</p>`;
        }
        return `<p class="mb-2">${line}</p>`;
      })
      .filter(Boolean)
      .join("");
    if (isList) output += "</ul>";
    return output;
  };

  const fetchFavorites = useCallback(async () => {
    if (!auth.currentUser) {
      setFavorites([]);
      return;
    }
    try {
      const favoritesQuery = query(
        collection(db, "favorites"),
        where("userId", "==", auth.currentUser.uid)
      );
      const favoritesSnapshot = await getDocs(favoritesQuery);
      const favoriteIds = favoritesSnapshot.docs.map(
        (doc) => doc.data().productId
      );
      setFavorites(favoriteIds);
    } catch (err) {
      console.error("Error fetching favorites:", err);
      addAlert("Failed to load favorites.", "error", 3000);
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

    if (!id || typeof id !== "string" || id.trim() === "") {
      setLoading(false);
      addAlert("Invalid product ID", "error", 3000);
      navigate("/products");
      return;
    }

    const fetchProduct = async () => {
      try {
        console.log("Fetching product ID:", id);
        if (
          !id ||
          typeof id !== "string" ||
          id.trim() === "" ||
          id.includes("/")
        ) {
          throw new Error("Invalid product ID");
        }
        const productRef = doc(db, "products", id);
        const productSnap = await getDoc(productRef);
        if (!productSnap.exists()) {
          throw new Error("Product not found");
        }
        const data = productSnap.data();
        if (data.status !== "approved") {
          throw new Error("Product not approved");
        }
        let location = "";
        if (data.sellerId) {
          const sellerRef = doc(db, "users", data.sellerId);
          const sellerSnap = await getDoc(sellerRef);
          if (sellerSnap.exists()) {
            const sellerData = sellerSnap.data();
            location = sellerData.location
              ? `${sellerData.location.city || ""}, ${
                  sellerData.location.state || ""
                }, ${sellerData.location.country || ""}`
                  .trim()
                  .replace(/, ,/g, ",")
              : "";
          }
        }
        setSellerLocation(location);

        let imageUrls = Array.isArray(data.imageUrls)
          ? data.imageUrls
          : data.imageUrl && typeof data.imageUrl === "string"
          ? [data.imageUrl]
          : ["https://via.placeholder.com/600"];
        let videoUrls = Array.isArray(data.videoUrls) ? data.videoUrls : [];
        if (imageUrls.length === 0 || !imageUrls[0]) {
          imageUrls = ["https://via.placeholder.com/600"];
        }
        const category = data.category?.trim().toLowerCase() || "uncategorized";
        const requiresSizes = SIZE_RELEVANT_CATEGORIES.includes(category);
        const reviewsSnapshot = await getDocs(
          collection(db, `products/${id}/reviews`)
        );
        const reviews = reviewsSnapshot.docs.map((reviewDoc) => {
          const reviewData = reviewDoc.data();
          let userName = reviewData.userName || "Anonymous";
          if (typeof userName === "object" && userName.name) {
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
          name: data.name || "Unnamed Product",
          description: data.description || "",
          price: data.price || 0,
          stock: data.stock || 0,
          category,
          colors: data.colors || [],
          sizes: requiresSizes ? data.sizes || [] : [],
          condition: data.condition || "New",
          imageUrls,
          videoUrls,
          tags: data.tags || [],
          seller: data.seller || {
            name: "Unknown Seller",
            id: data.sellerId || "",
          },
          sellerId: data.sellerId || "",
          rating: data.rating || Math.random() * 2 + 3,
          reviews,
          status: data.status || "pending",
          variants: data.variants || [],
        };

        const dealsSnapshot = await getDocs(collection(db, "dailyDeals"));
        const activeDeal = dealsSnapshot.docs
          .map((doc) => ({ id: doc.id, ...doc.data() }))
          .find(
            (deal) =>
              deal.productId === id &&
              new Date(deal.endDate) > new Date() &&
              new Date(deal.startDate) <= new Date()
          );
        if (activeDeal) {
          setIsDailyDeal(true);
          setDiscountPercentage((activeDeal.discount * 100).toFixed(2));
        } else {
          setIsDailyDeal(false);
          setDiscountPercentage(0);
        }

        console.log("Fetched product:", productData);
        setProduct(productData);
        setMainMedia(productData.imageUrls[0]);
        setCurrentMediaIndex(0);

        if (productData.colors.length > 0) {
          setSelectedColor(productData.colors[0]);
        }
        if (productData.sizes.length > 0) {
          setSelectedSize(productData.sizes[0]);
        }
        if (productData.variants.length > 0) {
          setSelectedVariant(productData.variants[0]);
          setPreviousVariant(productData.variants[0]);
          setSelectedColor(productData.variants[0].color);
          setSelectedSize(productData.variants[0].size);
        }

        // In fetchProduct function, update the updateRecentSearches function:
        const updateRecentSearches = () => {
          const recent = JSON.parse(
            localStorage.getItem("recentSearches") || "[]"
          );
          // Store variant-specific data if available
          const variantData =
            productData.variants.length && selectedVariant
              ? {
                  color: selectedVariant.color,
                  size: selectedVariant.size,
                  price: selectedVariant.price,
                  imageUrl:
                    selectedVariant.imageUrls?.[0] || productData.imageUrls[0],
                }
              : null;

          const newSearch = {
            id: productData.id,
            name: productData.name,
            imageUrl: variantData?.imageUrl || productData.imageUrls[0],
            price: variantData?.price || productData.price || 0,
            category: productData.category,
            status: productData.status,
            variant: variantData, // Store variant data
          };
          const updatedRecent = [
            newSearch,
            ...recent.filter((item) => item.id !== id),
          ].slice(0, 5);
          localStorage.setItem("recentSearches", JSON.stringify(updatedRecent));
        };
        updateRecentSearches();

        const similarQuery = query(
          collection(db, "products"),
          where("category", "==", productData.category)
        );
        const querySnapshot = await getDocs(similarQuery);
        const similar = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            if (data.status !== "approved") return null;
            let imageUrl =
              data.variants &&
              data.variants.length > 0 &&
              data.variants[0]?.imageUrls?.[0]
                ? data.variants[0].imageUrls[0]
                : data.imageUrl && typeof data.imageUrl === "string"
                ? data.imageUrl
                : Array.isArray(data.imageUrls) && data.imageUrls[0]
                ? data.imageUrls[0]
                : "https://via.placeholder.com/600";
            if (doc.id === id) return null;
            const similarCategory =
              data.category?.trim().toLowerCase() || "uncategorized";
            const requiresSizesForSimilar =
              SIZE_RELEVANT_CATEGORIES.includes(similarCategory);
            return {
              id: doc.id,
              name: data.name || "Unnamed Product",
              price: data.price || 0,
              stock: data.stock || 0,
              category: similarCategory,
              colors: data.colors || [],
              sizes: requiresSizesForSimilar ? data.sizes || [] : [],
              condition: data.condition || "New",
              imageUrl,
              tags: data.tags || [],
              seller: data.seller || {
                name: "Unknown Seller",
                id: data.sellerId || "",
              },
              rating: data.rating || Math.random() * 2 + 3,
              status: data.status || "pending",
            };
          })
          .filter((product) => product && product.imageUrl);
        setSimilarProducts(similar.slice(0, 4));
      } catch (err) {
        console.error("Error loading product:", err);
        setProduct(null);
        setSimilarProducts([]);
        addAlert(err.message || "Failed to load product.", "error", 3000);
        if (
          err.message.includes("Product not found") ||
          err.message.includes("Invalid product ID") ||
          err.message.includes("Product not approved")
        ) {
          setTimeout(() => {
            navigate("/products");
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
      const recent = JSON.parse(localStorage.getItem("recentSearches") || "[]");
      const validRecent = recent
        .filter((item) => item && item.id && item.name)
        .map((item) => ({
          ...item,
          // Use variant image if available, fallback to product image
          imageUrl:
            item.variant?.imageUrl ||
            item.imageUrl ||
            "https://via.placeholder.com/600",
          price:
            typeof (item.variant?.price ?? item.price) === "number" &&
            !isNaN(item.variant?.price ?? item.price)
              ? item.variant?.price ?? item.price
              : 0,
        }));
      setRecentSearches(validRecent);
    } catch (err) {
      console.error("Error loading recent searches:", err);
      setRecentSearches([]);
    }
  }, []);

  useEffect(() => {
    if (!product) return;
    const currentVariant = product.variants.length
      ? selectedVariant || { imageUrls: [] }
      : null;
    const allMedia = product.variants.length
      ? currentVariant.imageUrls
          .map((url) => ({ type: "image", url }))
          .filter((media) => media.url)
      : product.imageUrls
          .map((url) => ({ type: "image", url }))
          .filter((media) => media.url);
    if (!allMedia.length) {
      setMainMedia("https://via.placeholder.com/600");
      setCurrentMediaIndex(0);
      return;
    }
    setMainMedia(allMedia[0].url);
    setCurrentMediaIndex(0);
  }, [product, selectedVariant]);

  useEffect(() => {
    if (!product) return;
    const currentVariant = product.variants.length
      ? selectedVariant || { imageUrls: [] }
      : null;
    const allMedia = product.variants.length
      ? currentVariant.imageUrls
          .map((url) => ({ type: "image", url }))
          .filter((media) => media.url)
      : product.imageUrls
          .map((url) => ({ type: "image", url }))
          .filter((media) => media.url);
    if (allMedia.length > 0) {
      setMainMedia(
        allMedia[currentMediaIndex]?.url || "https://via.placeholder.com/600"
      );
    } else {
      setMainMedia("https://via.placeholder.com/600");
    }
  }, [currentMediaIndex, product, selectedVariant]);

  const handleAddToCart = async () => {
    if (!product) return;
    try {
      if (quantity > (selectedVariant?.stock || product.stock)) {
        addAlert(
          `Cannot add more than ${
            selectedVariant?.stock || product.stock
          } units of ${product.name}`,
          "error",
          3000
        );
        setQuantity(
          (selectedVariant?.stock || product.stock) > 0
            ? selectedVariant?.stock || product.stock
            : 1
        );
        return;
      }
      await addToCart(
        product.id,
        quantity,
        auth.currentUser?.uid,
        selectedColor,
        selectedSize
      );
      addAlert(`${product.name} added to cart!`, "success", 3000);
      setQuantity(1);
    } catch (err) {
      console.error("Error adding to cart:", err);
      addAlert("Failed to add to cart", "error", 3000);
    }
  };

  // UPDATED: Handle Pay Now functionality
  const handlePayNow = async () => {
    if (!product) return;

    // Stock check
    if (quantity > (selectedVariant?.stock || product.stock)) {
      addAlert(
        `Cannot purchase more than ${
          selectedVariant?.stock || product.stock
        } units of ${product.name}`,
        "error",
        3000
      );
      setQuantity(
        (selectedVariant?.stock || product.stock) > 0
          ? selectedVariant?.stock || product.stock
          : 1
      );
      return;
    }

    try {
      // First add to cart
      await addToCart(
        product.id,
        quantity,
        auth.currentUser?.uid,
        selectedColor,
        selectedSize
      );

      // Then navigate to checkout (fix: ensure navigation happens after addToCart)
      setTimeout(() => {
        navigate(
          `/checkout?productId=${
            product.id
          }&quantity=${quantity}&color=${encodeURIComponent(
            selectedColor || ""
          )}&size=${encodeURIComponent(selectedSize || "")}`
        );
      }, 100); // slight delay to ensure cart update
    } catch (err) {
      console.error("Error adding to cart:", err);
      addAlert("Failed to add to cart", "error", 3000);
    }
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`, { state: { from: location.pathname } });
  };

  const toggleFavorite = async () => {
    if (!product) {
      addAlert("No product selected", "error", 3000);
      return;
    }
    if (!auth.currentUser) {
      addAlert("Please log in to manage favorites", "error", 3000);
      return;
    }
    try {
      const favoritesRef = collection(db, "favorites");
      const favoriteQuery = query(
        favoritesRef,
        where("userId", "==", auth.currentUser.uid),
        where("productId", "==", product.id)
      );
      const favoriteSnap = await getDocs(favoriteQuery);
      if (!favoriteSnap.empty) {
        for (const doc of favoriteSnap.docs) {
          if (doc.data().userId !== auth.currentUser.uid) continue;
          await deleteDoc(doc.ref);
        }
        setFavorites((prev) => prev.filter((id) => id !== product.id));
        addAlert("Removed from favorites", "success", 3000);
      } else {
        await addDoc(favoritesRef, {
          userId: auth.currentUser.uid,
          productId: product.id,
          createdAt: serverTimestamp(),
        });
        setFavorites((prev) => [...prev, product.id]);
        addAlert("Added to favorites!", "success", 3000);
      }
    } catch (err) {
      console.error("Error toggling favorite:", err);
      addAlert("Failed to update favorites.", "error", 3000);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!auth.currentUser) {
      addAlert("Please log in to submit a review", "error", 3000);
      return;
    }
    if (reviewRating < 1 || reviewRating > 5) {
      addAlert("Please select a valid rating (1-5)", "error", 3000);
      return;
    }
    if (!reviewComment.trim()) {
      addAlert("Please enter a review comment", "error", 3000);
      return;
    }
    try {
      let userName;
      try {
        const storedUserData = localStorage.getItem("userData");
        userName = storedUserData
          ? JSON.parse(storedUserData).name || "Anonymous"
          : auth.currentUser.displayName || "Anonymous";
      } catch {
        userName = auth.currentUser.displayName || "Anonymous";
      }
      await addDoc(collection(db, `products/${id}/reviews`), {
        userId: auth.currentUser.uid,
        userName,
        rating: reviewRating,
        comment: reviewComment,
        date: serverTimestamp(),
      });
      addAlert("Review submitted successfully!", "success", 3000);
      setReviewRating(0);
      setReviewComment("");
      setShowReviewForm(false);
      const reviewsSnapshot = await getDocs(
        collection(db, `products/${id}/reviews`)
      );
      const reviews = reviewsSnapshot.docs.map((reviewDoc) => {
        const reviewData = reviewDoc.data();
        let userName = reviewData.userName || "Anonymous";
        if (typeof userName === "object" && userName.name) {
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
      console.error("Error submitting review:", err);
      addAlert("Failed to submit review", "error", 3000);
    }
  };

  const handleMediaClick = (media, index) => {
    if (
      typeof media === "string" &&
      (media.startsWith("https://res.cloudinary.com/") ||
        media.includes(".mp4"))
    ) {
      setSlideDirection(index > currentMediaIndex ? "right" : "left");
      setMainMedia(media);
      setCurrentMediaIndex(index);
      setIsVideoPlaying(media.includes(".mp4"));
    }
  };

  const handleVariantChange = useCallback(
    (color, size) => {
      if (!product?.variants) return;
      const variant = product.variants.find(
        (v) => v.color === color && v.size === size
      );
      if (variant) {
        setPreviousVariant(selectedVariant);
        setSelectedVariant(variant);
        setSelectedColor(color);
        setSelectedSize(size);
        setProduct((prev) => ({
          ...prev,
          price: variant.price,
          stock: variant.stock,
          imageUrls:
            variant.imageUrls && variant.imageUrls.length > 0
              ? variant.imageUrls
              : prev.imageUrls,
        }));
        setMainMedia(
          variant.imageUrls && variant.imageUrls.length > 0
            ? variant.imageUrls[0]
            : product.imageUrls[0]
        );
        setCurrentMediaIndex(0);
        setQuantity(1);
      }
    },
    [product, selectedVariant]
  );

  const revertToPreviousVariant = () => {
    if (previousVariant) {
      setSelectedVariant(previousVariant);
      setSelectedColor(previousVariant.color);
      setSelectedSize(previousVariant.size);
      setProduct((prev) => ({
        ...prev,
        price: previousVariant.price,
        stock: previousVariant.stock,
        imageUrls:
          previousVariant.imageUrls && previousVariant.imageUrls.length > 0
            ? previousVariant.imageUrls
            : prev.imageUrls,
      }));
      setMainMedia(
        previousVariant.imageUrls && previousVariant.imageUrls.length > 0
          ? previousVariant.imageUrls[0]
          : product.imageUrls[0]
      );
      setCurrentMediaIndex(0);
      setQuantity(1);
    }
  };

  // Add this helper function near the top of your file
  const getSafeImageUrl = (url) => {
    // If url is empty, null, or known unreachable, use local fallback
    if (
      !url ||
      url.includes("via.placeholder.com") || // unreachable host
      url === "https://via.placeholder.com/600"
    ) {
      return "/fallback-image.png"; // Use a local fallback image you provide in public folder
    }
    return url;
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
        <p className="text-[#333333]">Product not found or not approved.</p>
        <Link to="/products" className="text-[#112d4e] hover:underline">
          Back to Products
        </Link>
        <CustomAlert alerts={alerts} removeAlert={removeAlert} />
      </div>
    );
  }

  const DESCRIPTION_LIMIT = 150;
  const REVIEW_LIMIT = 5;
  const truncatedDescription =
    product.description.length > DESCRIPTION_LIMIT
      ? `${product.description.substring(0, DESCRIPTION_LIMIT)}...`
      : product.description;
  const shouldShowDescriptionToggle =
    product.description.length > DESCRIPTION_LIMIT;
  const displayedReviews = showAllReviews
    ? product.reviews
    : product.reviews?.slice(0, REVIEW_LIMIT);
  const currentVariant = product.variants.length
    ? selectedVariant || { imageUrls: [] }
    : null;
  const allMedia = product.variants.length
    ? currentVariant.imageUrls
        .map((url) => ({ type: "image", url }))
        .filter((media) => media.url)
    : product.imageUrls
        .map((url) => ({ type: "image", url }))
        .filter((media) => media.url);
  const totalPrice = calculateTotalPrice(
    selectedVariant?.price || product.price,
    quantity,
    isDailyDeal ? discountPercentage : 0
  );
  const originalPrice = calculateTotalPrice(
    selectedVariant?.price || product.price,
    quantity,
    0
  );
  const avgRating =
    product.reviews && product.reviews.length > 0
      ? (
          product.reviews.reduce((sum, review) => sum + review.rating, 0) /
          product.reviews.length
        ).toFixed(1)
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
            background: #F0F0F0; /* Soft off-white */
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
            background: #F0F0F0; /* Soft off-white */
            border: 1px solid #CCCCCC; /* Light grey border */
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
            background: #f0f0f0; /* Primary accent blue/teal */
            border: 1px solid #cccccc; /* Primary accent blue/teal */
            border-radius: 0.75rem;
            padding: 1.5rem;
            margin: 1rem 0;
            color: #F0F0F0; /* Soft off-white text */
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
            border-color: #E0B912; /* Secondary accent gold/yellow */
            background-color: #E0B912; /* Secondary accent gold/yellow */
            color: #333333; /* Dark neutral text */
            box-shadow: 0 0 0 2px rgba(224, 185, 18, 0.2);
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
            background: #F0F0F0; /* Soft off-white */
            color: #333333; /* Dark neutral text */
            border: 1px solid #CCCCCC; /* Light grey border */
          }
          .info-badge:hover {
            transform: translateY(-1px);
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
          }
          .quantity-controls {
            display: flex;
            align-items: center;
            border: 1px solid #CCCCCC; /* Light grey border */
            border-radius: 0.5rem;
            overflow: hidden;
            background: #F0F0F0; /* Soft off-white */
            max-width: 120px;
          }
          .quantity-controls button {
            background: #F0F0F0; /* Soft off-white */
            border: none;
            padding: 0.5rem 0.75rem;
            transition: all 0.2s ease;
            cursor: pointer;
            color: #333333; /* Dark neutral text */
          }
          .quantity-controls button:hover {
            background: #112d4e; /* Primary accent blue/teal */
            color: #F0F0F0; /* Soft off-white text */
          }
          .quantity-controls input {
            border: none;
            text-align: center;
            width: 3rem;
            padding: 0.5rem;
            background: #F0F0F0; /* Soft off-white */
            color: #333333; /* Dark neutral text */
          }
          .quantity-controls input:focus {
            outline: none;
            box-shadow: inset 0 0 0 2px #E0B912; /* Secondary accent gold/yellow */
          }
          .favorite-button {
            transition: all 0.3s ease;
            color: #333333; /* Dark neutral text */
          }
          .favorite-button:hover {
            transform: scale(1.2);
          }
          .favorite-button.active {
            transform: scale(1.1);
            color: gray; /* Muted red for active favorite */
          }
          .back-icon {
            transition: all 0.3s ease;
            color: #333333; /* Dark neutral text */
          }
          .back-icon:hover {
            transform: scale(1.2);
          }
        `}
      </style>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fadeIn">
            {/* Media Section */}
            <div className="order-1">
              <div className="relative main-media-container">
                {allMedia.length > 0 &&
                allMedia[currentMediaIndex].type === "image" ? (
                  <img
                    src={getSafeImageUrl(allMedia[currentMediaIndex].url)}
                    alt={`${product.name} ${
                      product.variants.length
                        ? `variant ${
                            product.variants.findIndex(
                              (v) => v === selectedVariant
                            ) + 1
                          }`
                        : ""
                    } image`}
                    className={
                      slideDirection === "right"
                        ? "slide-in-right"
                        : "slide-in-left"
                    }
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "/fallback-image.png";
                    }}
                  />
                ) : allMedia.length > 0 &&
                  allMedia[currentMediaIndex].type === "video" ? (
                  <video
                    src={allMedia[currentMediaIndex].url}
                    controls
                    autoPlay={isVideoPlaying}
                    className={
                      slideDirection === "right"
                        ? "slide-in-right"
                        : "slide-in-left"
                    }
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : (
                  <img
                    src="/fallback-image.png"
                    alt="Placeholder Image"
                    className="animate-fadeIn"
                  />
                )}
              </div>

              {allMedia.length > 1 && (
                <div className="flex justify-center space-x-2 mt-4 overflow-x-auto pb-2">
                  {allMedia.map((media, index) => (
                    <div
                      key={index}
                      className={`w-20 h-20 flex-shrink-0 cursor-pointer rounded-md overflow-hidden border-2 ${
                        currentMediaIndex === index
                          ? "border-[#112d4e]" // Primary accent border for selected thumbnail
                          : "border-transparent"
                      } thumbnail`}
                      onClick={() => handleMediaClick(media.url, index)}
                    >
                      {media.type === "image" ? (
                        <img
                          src={getSafeImageUrl(media.url)}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "/fallback-image.png";
                          }}
                        />
                      ) : (
                        <video
                          src={media.url}
                          className="w-full h-full object-cover"
                        >
                          Your browser does not support the video tag.
                        </video>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Product Details Section */}
            <div className="order-2 md:order-2 product-info-card shadow-lg">
              <div className="flex items-center mb-4">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center text-[#333333] hover:text-[#112d4e] back-icon mr-3"
                  aria-label="Back to previous page"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <h1 className="text-3xl font-bold text-[#333333] flex-grow">
                  {product.name}
                </h1>
                <button
                  onClick={toggleFavorite}
                  className={`favorite-button p-2 rounded-full ${
                    favorites.includes(product.id)
                      ? "active text-[#DC2626]" // Muted red when favorited
                      : "text-[#333333] hover:text-[#DC2626]"
                  }`}
                  aria-label={
                    favorites.includes(product.id)
                      ? "Remove from favorites"
                      : "Add to favorites"
                  }
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-7 w-7"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>

             {/* Price Section */}
<div className="price-section text-white text-center">
  <div className="flex flex-col sm:flex-row justify-between items-center">
    <p className="text-2xl font-extrabold mb-2 sm:mb-0">
      <PriceFormatter
        price={totalPrice}
        currency={product.currency || localStorage.getItem("currency") || "USD"}
      />
    </p>
    {isDailyDeal && (
      <div className="text-right">
        <p className="text-sm line-through opacity-80">
          <PriceFormatter
            price={originalPrice}
            currency={product.currency || localStorage.getItem("currency") || "USD"}
          />
        </p>
        <p className="text-lg font-semibold text-[#E0B912]">
          {discountPercentage}% OFF!
        </p>
      </div>
    )}
  </div>
  <p className="text-sm mt-1 text-[#F0F0F0] opacity-90">
    Total price (inclusive of taxes and fees)
  </p>
</div>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="info-badge">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-[#112d4e]" // Primary accent color
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.329 1.14l1.519 4.674c.3.921-.755 1.688-1.539 1.14l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.543-1.838-.219-1.539-1.14l1.519-4.674a1 1 0 00-.329-1.14l-3.976-2.888c-.784-.57-.381-1.81.588-1.81h4.915a1 1 0 00.95-.69l1.519-4.674z"
                    />
                  </svg>
                  {avgRating} ({product.reviews.length} reviews)
                </span>
                <span className="info-badge">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 text-[#112d4e]" // Primary accent color
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.001 12.001 0 002.92 12c0 2.843.614 5.518 1.697 7.918l-.666 1.055c-.247.391.077.917.555.917h16.486c.478 0 .802-.526.555-.917l-.666-1.055c1.083-2.4 1.697-5.075 1.697-7.918a12.001 12.001 0 00-3.079-8.056z"
                    />
                  </svg>
                  {product.condition}
                </span>
                <Link
  to={`/seller/${product.sellerId}`}
  className="info-badge hover:bg-gray-200"
>
  <i className="ri-store-line"></i>
  Seller: {product.seller.name}
</Link>
              </div>

              {product.variants.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-[#333333] mb-2">
                    Variants:
                  </h3>
                  {product.colors.length > 0 && (
                    <div className="mb-3">
                      <p className="text-sm text-[#333333] mb-1">
                        Color:{" "}
                        <span className="font-medium text-[#112d4e]">
                          {selectedColor || "N/A"}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {product.colors.map((colorName) => (
                          <button
                            key={colorName}
                            onClick={() =>
                              handleVariantChange(colorName, selectedSize)
                            }
                            className={`selection-option p-2 rounded-lg border-2 flex items-center justify-center min-w-[32px] min-h-[32px] ${
                              selectedColor === colorName
                                ? "selected"
                                : "border-[#CCCCCC] bg-[#F0F0F0] text-[#333333] hover:bg-[#E0B912] hover:text-[#333333]"
                            }`}
                            style={{
                              backgroundColor:
                                colorMap[colorName.toLowerCase()] ||
                                colorName,
                              borderColor:
                                selectedColor === colorName
                                  ? "#E0B912" // Secondary accent for selected
                                  : "#CCCCCC", // Light grey
                              color:
                                colorName.toLowerCase() === "white" ||
                                colorName.toLowerCase() === "silver" ||
                                colorMap[colorName.toLowerCase()] === "#F0F0F0"
                                  ? "#333333"
                                  : "#F0F0F0", // Dark text for light colors, light text for dark
                            }}
                            aria-label={`Select color ${colorName}`}
                            title={colorName}
                          >
                            {selectedColor !== colorName &&
                            (colorName.toLowerCase() === "white" ||
                              colorName.toLowerCase() === "silver") ? (
                              <div
                                className="w-5 h-5 rounded-full border border-gray-400"
                                style={{
                                  backgroundColor:
                                    colorMap[colorName.toLowerCase()] ||
                                    colorName,
                                }}
                              ></div>
                            ) : null}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.sizes.length > 0 && (
                    <div>
                      <p className="text-sm text-[#333333] mb-1">
                        Size:{" "}
                        <span className="font-medium text-[#112d4e]">
                          {selectedSize || "N/A"}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {product.sizes.map((sizeName) => (
                          <button
                            key={sizeName}
                            onClick={() =>
                              handleVariantChange(selectedColor, sizeName)
                            }
                            className={`selection-option px-4 py-2 rounded-lg border-2 ${
                              selectedSize === sizeName
                                ? "selected"
                                : "border-[#CCCCCC] bg-[#F0F0F0] text-[#333333] hover:bg-[#E0B912] hover:text-[#333333]"
                            }`}
                            aria-label={`Select size ${sizeName}`}
                          >
                            {sizeName}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {product.variants.length > 0 && !selectedVariant && (
                    <p className="text-red-500 text-sm mt-2">
                      Please select a valid variant combination.
                    </p>
                  )}
                </div>
              )}

              {/* Stock and Quantity */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <p className="text-sm font-semibold text-[#333333]">
                    Quantity:
                  </p>
                  <div className="quantity-controls">
                    <button
                      onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                      aria-label="Decrease quantity"
                    >
                      -
                    </button>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                      }
                      className="no-arrows"
                      min="1"
                      max={selectedVariant?.stock || product.stock}
                      aria-label="Product quantity"
                    />
                    <button
                      onClick={() =>
                        setQuantity((prev) =>
                          Math.min(
                            prev + 1,
                            selectedVariant?.stock || product.stock
                          )
                        )
                      }
                      disabled={quantity >= (selectedVariant?.stock || product.stock)}
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <p
                  className={`text-sm font-semibold ${
                    (selectedVariant?.stock || product.stock) > 0
                      ? "text-[#112d4e]" // Primary accent for in stock
                      : "text-[#DC2626]" // Muted red for out of stock
                  }`}
                >
                  Stock: {selectedVariant?.stock || product.stock} units
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 mb-6">
                <button
                  onClick={handleAddToCart}
                  disabled={!product.stock || quantity > product.stock}
                  className="flex-1 px-6 py-3 rounded-lg bg-[#ffffff] text-[#333333] font-semibold hover:bg-[#cccccc] focus:outline-none focus:ring-2 focus:ring-[#E0B912] focus:ring-offset-2 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Add to Cart
                </button>
                <button
                  onClick={handlePayNow}
                  disabled={!product.stock || quantity > product.stock}
                  className="flex-1 px-6 py-3 rounded-lg bg-[#112d4e] text-[#F0F0F0] font-semibold hover:bg-[#112d4e] focus:outline-none focus:ring-2 focus:ring-[#112d4e] focus:ring-offset-2 transition duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Pay Now
                </button>
              </div>
            </div>
          </div>

          {/* Product Description */}
          <div className="product-info-card shadow-lg mt-6">
            <h2 className="text-2xl font-bold text-[#333333] mb-4">
              Description
            </h2>
            <div
              className="text-[#555555] leading-relaxed formatted-description"
              dangerouslySetInnerHTML={{
                __html: formatDescription(
                  showFullDescription
                    ? product.description
                    : truncatedDescription
                ),
              }}
            ></div>
            {shouldShowDescriptionToggle && (
              <button
                onClick={() => setShowFullDescription(!showFullDescription)}
                className="text-[#112d4e] hover:underline mt-2 text-sm"
              >
                {showFullDescription ? "Show Less" : "Read More"}
              </button>
            )}
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((tag, index) => {
                const tagClass = tagStyles[tag.toLowerCase()] || tagStyles.default;
                return (
                  <span
                    key={index}
                    className={`px-3 py-1 text-xs font-semibold rounded-full border ${tagClass}`}
                  >
                    {tag}
                  </span>
                );
              })}
            </div>
          </div>

          {/* Reviews Section */}
          <div className="product-info-card shadow-lg mt-6">
            <h2 className="text-2xl font-bold text-[#333333] mb-4">
              Customer Reviews ({product.reviews.length})
            </h2>
            {product.reviews.length === 0 ? (
              <p className="text-[#555555]">No reviews yet. Be the first!</p>
            ) : (
              <div className="space-y-4">
                {displayedReviews.map((review) => (
                  <div
                    key={review.id}
                    className="border-b border-[#CCCCCC] pb-4 last:border-b-0"
                  >
                    <div className="flex items-center mb-2">
                      <p className="font-semibold text-[#333333]">
                        {review.userName}
                      </p>
                      <span className="ml-3 text-sm text-[#8D8D8D]">
                        {new Date(review.date?.toDate()).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          xmlns="http://www.w3.org/2000/svg"
                          className={`h-5 w-5 ${
                            i < review.rating
                              ? "text-[#E0B912]" // Secondary accent for filled stars
                              : "text-[#CCCCCC]" // Light grey for empty stars
                          }`}
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.329 1.14l1.07 3.292c.3.921-.755 1.688-1.539 1.14l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.543-1.838-.219-1.539-1.14l1.07-3.292a1 1 0 00-.329-1.14l-2.8-2.034c-.784-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      <span className="ml-2 text-sm font-medium text-[#333333]">
                        {review.rating.toFixed(1)}
                      </span>
                    </div>
                    <p className="text-[#555555]">{review.comment}</p>
                  </div>
                ))}
                {product.reviews.length > REVIEW_LIMIT && (
                  <button
                    onClick={() => setShowAllReviews(!showAllReviews)}
                    className="text-[#112d4e] hover:underline mt-4 text-sm"
                  >
                    {showAllReviews ? "Show Less Reviews" : "Show All Reviews"}
                  </button>
                )}
              </div>
            )}
            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="mt-6 px-4 py-2 bg-[#E0B912] text-[#333333] font-semibold rounded-lg hover:bg-[#FACC15] focus:outline-none focus:ring-2 focus:ring-[#E0B912] focus:ring-offset-2 transition duration-200 ease-in-out"
            >
              {showReviewForm ? "Cancel Review" : "Write a Review"}
            </button>
            {showReviewForm && (
              <form onSubmit={handleSubmitReview} className="mt-4">
                <div className="mb-4">
                  <label
                    htmlFor="rating"
                    className="block text-sm font-medium text-[#333333] mb-2"
                  >
                    Rating:
                  </label>
                  <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg
                        key={star}
                        xmlns="http://www.w3.org/2000/svg"
                        className={`h-8 w-8 cursor-pointer ${
                          star <= reviewRating
                            ? "text-[#E0B912]" // Secondary accent for selected stars
                            : "text-[#CCCCCC]" // Light grey for unselected stars
                        }`}
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        onClick={() => setReviewRating(star)}
                        aria-label={`Rate ${star} stars`}
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.329 1.14l1.07 3.292c.3.921-.755 1.688-1.539 1.14l-2.8-2.034a1 1 0 00-1.176 0l-2.8 2.034c-.783.543-1.838-.219-1.539-1.14l1.07-3.292a1 1 0 00-.329-1.14l-2.8-2.034c-.784-.57-.381-1.81.588-1.81h3.462a1 1 0 00.95-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                </div>
                <div className="mb-4">
                  <label
                    htmlFor="comment"
                    className="block text-sm font-medium text-[#333333] mb-2"
                  >
                    Comment:
                  </label>
                  <textarea
                    id="comment"
                    className="w-full p-3 border border-[#CCCCCC] rounded-lg focus:ring-[#E0B912] focus:border-[#E0B912] outline-none text-[#333333] bg-[#F0F0F0]"
                    rows="4"
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts on this product..."
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="px-6 py-3 bg-[#112d4e] text-[#F0F0F0] font-semibold rounded-lg hover:bg-[#007F8B] focus:outline-none focus:ring-2 focus:ring-[#112d4e] focus:ring-offset-2 transition duration-200 ease-in-out"
                >
                  Submit Review
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Similar Products & Recently Viewed */}
        <div className="lg:col-span-1">
          {similarProducts.length > 0 && (
            <div className="product-info-card shadow-lg mb-6">
              <h2 className="text-xl font-bold text-[#333333] mb-4">
                Similar Products
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {similarProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onClick={() => handleProductClick(p.id)}
                    isFavorite={favorites.includes(p.id)}
                    toggleFavorite={toggleFavorite}
                    cardClassName="!shadow-none !border !border-[#CCCCCC] hover:!border-[#112d4e] !bg-[#F0F0F0] !text-[#333333] min-h-[180px] max-h-[220px] lg:min-h-[80px] lg:max-h-[110px]"
                    imageClassName="!rounded-md h-[80px] min-h-0 max-h-[100px] lg:h-[40px] lg:max-h-[50px]"
                    priceClassName="!text-[#112d4e]"
                    nameClassName="!text-[#333333]"
                  />
                ))}
              </div>
            </div>
          )}

          {recentSearches.length > 0 && (
            <div className="product-info-card shadow-lg">
              <h2 className="text-xl font-bold text-[#333333] mb-4">
                Recently Viewed
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4">
                {recentSearches.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    onClick={() => handleProductClick(p.id)}
                    isFavorite={favorites.includes(p.id)}
                    toggleFavorite={toggleFavorite}
                    cardClassName="!shadow-none !border !border-[#CCCCCC] hover:!border-[#112d4e] !bg-[#F0F0F0] !text-[#333333] min-h-[180px] max-h-[220px] lg:min-h-[80px] lg:max-h-[110px]"
                    imageClassName="!rounded-md h-[80px] min-h-0 max-h-[100px] lg:h-[40px] lg:max-h-[50px]"
                    priceClassName="!text-[#112d4e]"
                    nameClassName="!text-[#333333]"
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <CustomAlert alerts={alerts} removeAlert={removeAlert} />
    </div>
  );
};

export default Product;