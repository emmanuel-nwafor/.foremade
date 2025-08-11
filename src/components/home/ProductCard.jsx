import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "/src/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { Heart } from "lucide-react";
import PriceFormatter from "/src/components/layout/PriceFormatter";
import { ShieldCheck, Palette, Ruler } from "lucide-react";
import placeholder from "/src/assets/placeholder.png";

const ProductCard = ({ product, dailyDeals = [] }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFailed, setImageFailed] = useState(false);
  const [feeConfig, setFeeConfig] = useState(null);
  const [fees, setFees] = useState({
    buyerProtectionFee: 0,
    handlingFee: 0,
    totalEstimatedPrice: 0,
    sellerEarnings: 0,
  });
  const [isProSeller, setIsProSeller] = useState(false);

  let mergedProduct = { ...product, stock: product.stock || 0 }; // Default stock to 0 if not provided
  if (Array.isArray(dailyDeals) && product.id) {
    const deal = dailyDeals.find(
      (d) =>
        d.productId === product.id &&
        d.discount &&
        (!d.endDate || new Date(d.endDate) > new Date()) &&
        (!d.startDate || new Date(d.startDate) <= new Date())
    );
    if (deal) {
      mergedProduct.isDailyDeal = true;
      mergedProduct.discountPercentage =
        typeof deal.discount === "number" ? (deal.discount * 100).toFixed(2) : 0;
    }
  }

  let minPrice = mergedProduct.price || 0;
  let maxPrice = mergedProduct.price || 0;
  let hasVariants = Array.isArray(mergedProduct.variants) && mergedProduct.variants.length > 0;

  if (hasVariants) {
    const variantPrices = mergedProduct.variants.map((v) => (v.price || 0));
    minPrice = Math.min(...variantPrices);
    maxPrice = Math.max(...variantPrices);
  }

  useEffect(() => {
    let initialImage = placeholder;
    if (hasVariants && mergedProduct.variants[0]?.imageUrls) {
      const firstValidUrl = mergedProduct.variants[0].imageUrls.find((url) =>
        typeof url === "string" && url.trim() && url.startsWith("https://")
      );
      initialImage = firstValidUrl || (mergedProduct.variants[0].imageUrls[0] || placeholder);
    } else if (Array.isArray(mergedProduct.imageUrls) && mergedProduct.imageUrls.length > 0) {
      const firstValidUrl = mergedProduct.imageUrls.find((url) =>
        typeof url === "string" && url.trim() && url.startsWith("https://")
      );
      initialImage = firstValidUrl || mergedProduct.imageUrls[0] || placeholder;
    } else if (mergedProduct.imageUrl && typeof mergedProduct.imageUrl === "string" && mergedProduct.imageUrl.startsWith("https://")) {
      initialImage = mergedProduct.imageUrl;
    } else {
      console.warn(`Product ${mergedProduct.id} has no valid imageUrl or imageUrls`);
    }
    setImageUrl(initialImage);
    setImageFailed(false);

    const fetchFeeConfig = async () => {
      try {
        const docRef = doc(db, "feeConfigurations", "categoryFees");
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setFeeConfig(docSnap.data());
        }
      } catch (err) {
        console.error("Error fetching fee configurations:", err);
      }
    };
    fetchFeeConfig();

    const checkProSellerStatus = async () => {
      if (mergedProduct.sellerId) {
        try {
          const proSellersSnapshot = await getDocs(collection(db, "proSellers"));
          const proSellers = proSellersSnapshot.docs.map((doc) => doc.data());
          const isMatch = proSellers.some(
            (proSeller) => proSeller.userId === mergedProduct.sellerId
          );
          setIsProSeller(isMatch);
        } catch (err) {
          console.error("Error checking pro seller status:", err);
          setIsProSeller(false);
        }
      }
    };
    checkProSellerStatus();
  }, [product, hasVariants, mergedProduct.sellerId]);

  useEffect(() => {
    if (feeConfig && mergedProduct.category && maxPrice > 0) {
      const config = feeConfig[mergedProduct.category] || {
        minPrice: 1000,
        maxPrice: Infinity,
        buyerProtectionRate: 0.08,
        handlingRate: 0.20,
      };
      const buyerProtectionFee = maxPrice * config.buyerProtectionRate;
      const handlingFee = maxPrice * config.handlingRate;
      const totalEstimatedPrice = maxPrice + buyerProtectionFee + handlingFee;
      const sellerEarnings = maxPrice;
      setFees({
        buyerProtectionFee,
        handlingFee,
        totalEstimatedPrice,
        sellerEarnings,
      });
    }
  }, [feeConfig, mergedProduct.category, maxPrice]);

  const originalDisplayPrice = maxPrice;
  let discount = 0;
  if (
    mergedProduct.isDailyDeal &&
    typeof mergedProduct.discountPercentage === "number" &&
    mergedProduct.discountPercentage > 0
  ) {
    discount = mergedProduct.discountPercentage;
  } else if (
    typeof mergedProduct.discount === "number" &&
    mergedProduct.discount > 0 &&
    mergedProduct.discount < 100
  ) {
    discount = mergedProduct.discount;
  }
  const hasDiscount = discount > 0;
  const discountedPrice = hasDiscount
    ? Math.round(maxPrice * (1 - discount / 100))
    : maxPrice;
  const totalEstimatedPrice = hasDiscount
    ? Math.round((maxPrice + fees.buyerProtectionFee + fees.handlingFee) * (1 - discount / 100))
    : fees.totalEstimatedPrice;

  const truncateText = (text, maxLength = 35) => {
    if (!text || typeof text !== "string") return "No name available";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  useEffect(() => {
    const fetchFavoriteStatus = async () => {
      if (!product || !product.id) {
        setIsFavorited(false);
        setFavoriteCount(0);
        return;
      }
      try {
        const productRef = doc(db, "products", product.id);
        const docSnap = await getDoc(productRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          const userId = auth.currentUser?.uid;
          setIsFavorited(
            (userId &&
              Array.isArray(data.favoritedBy) &&
              data.favoritedBy.includes(userId)) ||
            false
          );
          setFavoriteCount(data.favoriteCount || 0);
        } else {
          setIsFavorited(false);
          setFavoriteCount(0);
        }
      } catch (err) {
        console.error("Error fetching favorite status:", err);
      }
    };
    fetchFavoriteStatus();
  }, [product.id]);

  const handleFavorite = async (e) => {
    e.preventPropagation();
    e.stopPropagation();
    const userId = auth.currentUser?.uid;
    if (!userId || !product?.id) {
      toast.error("Please sign in to favorite a product.");
      return;
    }
    try {
      const productRef = doc(db, "products", product.id);
      const docSnap = await getDoc(productRef);
      if (!docSnap.exists()) {
        toast.error("Product not found.");
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
        toast.success("Removed from favorites!");
      } else {
        if (favoritedBy.includes(userId)) {
          toast.info("You have already favorited this product.");
          return;
        }
        await updateDoc(productRef, {
          favoritedBy: arrayUnion(userId),
          favoriteCount: currentCount + 1,
        });
        setIsFavorited(true);
        setFavoriteCount(currentCount + 1);
        toast.success("Added to favorites!");
      }
    } catch (err) {
      console.error("Error updating favorite:", err);
      toast.error("Failed to update favorite. Try again!");
    }
  };

  const uniqueColors = hasVariants
    ? [...new Set(mergedProduct.variants.map((v) => v.color).filter(Boolean))]
    : [];
  const uniqueSizes = hasVariants
    ? [...new Set(mergedProduct.variants.map((v) => v.size).filter(Boolean))]
    : [];

  return (
    <Link
      to={`/product/${mergedProduct.id}`}
      className="bg-white rounded-lg shadow-sm hover:shadow-md transition duration-300 flex flex-col min-w-0 overflow-hidden"
      tabIndex={0}
      aria-label={mergedProduct.name}
    >
      <div className="relative h-[200px] overflow-hidden rounded-t-lg min-w-0">
        <img
          src={imageFailed ? placeholder : imageUrl}
          alt={mergedProduct.name || "Product Image"}
          className="w-full h-full object-cover max-w-full max-h-full"
          onError={(e) => {
            if (!imageFailed) {
              console.error(
                "Image load error for product:",
                mergedProduct.id,
                mergedProduct.name,
                { imageUrl, attemptedUrl: e.target.src }
              );
              setImageFailed(true);
              setImageUrl(placeholder);
            }
          }}
          loading="lazy"
          fetchPriority="low"
        />
        <button
          onClick={handleFavorite}
          className="absolute top-2 right-2 p-1.5 flex items-center justify-evenly bg-white/70 backdrop-blur-sm rounded-full hover:bg-white transition-colors"
          aria-label={
            isFavorited ? "Remove from favorites" : "Add to favorites"
          }
        >
          <Heart
            className={`w-5 h-5 ${
              isFavorited ? "text-gray-600 fill-gray-600" : "text-gray-600"
            }`}
          />
          <p className="mx-1 text-sm">{favoriteCount}</p>
        </button>
      </div>
      <div className="flex flex-col justify-between flex-grow p-3 min-w-0 overflow-hidden">
        <div>
          <h3
            className="mb-1 break-words line-clamp-2 min-h-[48px]"
            title={mergedProduct.name}
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "#222",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {truncateText(mergedProduct.name)}
            {mergedProduct.name && mergedProduct.name.length < 35 && (
              <span style={{ visibility: "hidden" }}>
                {"\u00A0".repeat(40)}
              </span>
            )}
          </h3>
          {(mergedProduct.stock <= 2 && mergedProduct.stock > 0) && (
            <span className="inline-block border border-red-500 text-red-500 text-xs font-semibold px-[5px] py-[2px] rounded-full">
              Almost Gone
            </span>
          )}
          <div className="flex items-center justify-between">
          {mergedProduct.condition && (
            <p
              style={{ fontSize: "13px", color: "#222", fontWeight: 500 }}
              className="mb-2 mt-2"
            >
              <span>{mergedProduct.condition}</span>
            </p>
          )}

          {isProSeller && (
              <div className="p-[5px] flex items-center justify-center bg-gray-100 rounded-full">
                <ShieldCheck className="w-4 h-4 text-green-500" />
              </div>
          )}
          </div>

          {hasVariants && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-xs text-gray-600">
              {uniqueColors.length > 0 && (
                <span className="flex items-center">
                  <Palette size={14} className="mr-1 text-gray-500" />
                  {uniqueColors.length} Color{uniqueColors.length > 1 ? "s" : ""}
                </span>
              )}
              {uniqueSizes.length > 0 && (
                <span className="flex items-center">
                  <Ruler size={14} className="mr-1 text-gray-500" />
                  {uniqueSizes.length} Size{uniqueSizes.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="mt-auto">
          <div className="flex items-center justify-between">
            <span
              style={{
                fontSize: "16px",
                fontWeight: 500,
                color: "#222",
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
              }}
            >
              {mergedProduct.isDailyDeal ? (
                <PriceFormatter price={discountedPrice} />
              ) : (
                <PriceFormatter price={totalEstimatedPrice} />
              )}
            </span>
          </div>

          {mergedProduct.isDailyDeal && (
            <span
              className="text-gray-400 line-through mr-1"
              style={{ fontSize: "10px" }}
            >
              <PriceFormatter price={originalDisplayPrice} />
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;