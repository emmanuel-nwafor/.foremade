import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { auth, db } from "/src/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { Heart } from "lucide-react";
import PriceFormatter from "/src/components/layout/PriceFormatter";
import { ShieldCheck, Palette, Ruler } from "lucide-react";

const FALLBACK_IMAGE = "https://via.placeholder.com/200?text=No+Image";

const ProductCard = ({ product, dailyDeals = [] }) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteCount, setFavoriteCount] = useState(0);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  let mergedProduct = { ...product };
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
        typeof deal.discount === "number" ? deal.discount * 100 : 0;
    }
  }

  // Calculate price range for products with variants
  let minPrice = mergedProduct.price || 0;
  let maxPrice = mergedProduct.price || 0;
  let hasVariants = mergedProduct.variants && Array.isArray(mergedProduct.variants) && mergedProduct.variants.length > 0;

  if (hasVariants) {
    const prices = mergedProduct.variants.map((v) => (v.price || 0));
    minPrice = Math.min(...prices);
    maxPrice = Math.max(...prices);
  }

  // Set initial image based on variants or product-level images
  useEffect(() => {
    let initialImage = FALLBACK_IMAGE;
    if (hasVariants && mergedProduct.variants[0]?.imageUrls?.length > 0) {
      const variantImage = mergedProduct.variants[0].imageUrls.find((url) => 
        typeof url === "string" && url.startsWith("https://")
      );
      initialImage = variantImage || FALLBACK_IMAGE;
    } else if (Array.isArray(mergedProduct.imageUrls) && mergedProduct.imageUrls.length > 0) {
      const productImage = mergedProduct.imageUrls.find((url) => 
        typeof url === "string" && url.startsWith("https://")
      );
      initialImage = productImage || FALLBACK_IMAGE;
    } else if (mergedProduct.imageUrl && typeof mergedProduct.imageUrl === "string" && mergedProduct.imageUrl.startsWith("https://")) {
      initialImage = mergedProduct.imageUrl;
    }
    setImageUrl(initialImage);
  }, [product, hasVariants]);

  // Apply discount to the minPrice for display purposes
  const originalDisplayPrice = minPrice;
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
  const discountedDisplayPrice = hasDiscount
    ? Math.round(originalDisplayPrice * (1 - discount / 100))
    : originalDisplayPrice;

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
    e.preventDefault();
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
          src={imageFailed ? FALLBACK_IMAGE : imageUrl}
          alt={mergedProduct.name || "Product Image"}
          className="w-full h-full object-cover max-w-full max-h-full"
          onError={() => {
            if (!imageFailed) {
              console.warn(
                "Image load error for product:",
                mergedProduct.id,
                mergedProduct.name
              );
              setImageFailed(true);
              setImageUrl(FALLBACK_IMAGE);
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
              fontSize: "16px",
              fontWeight: 500,
              color: "#222",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              minHeight: "48px",
            }}
          >
            {truncateText(mergedProduct.name)}
            {mergedProduct.name && mergedProduct.name.length < 35 && (
              <span style={{ visibility: "hidden" }}>
                {"\u00A0".repeat(40)}
              </span>
            )}
          </h3>

          {mergedProduct.condition && (
            <p
              style={{ fontSize: "13px", color: "#222", fontWeight: 500 }}
              className="mb-2 mt-2"
            >
              <span>{mergedProduct.condition}</span>
            </p>
          )}

          {hasVariants && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-sm text-gray-600">
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
              {hasDiscount ? (
                <>
                  <span className="" style={{ fontSize: "16px" }}>
                    <PriceFormatter price={discountedDisplayPrice} />
                  </span>
                </>
              ) : (
                <>
                  {hasVariants && minPrice !== maxPrice && (
                    <span className="text-sm text-gray-500 mr-1">From</span>
                  )}
                  <PriceFormatter price={minPrice} />
                  {hasVariants && minPrice !== maxPrice && (
                    <>
                      <span className="mx-1">-</span>
                      <PriceFormatter price={maxPrice} />
                    </>
                  )}
                </>
              )}
            </span>
            <div className="p-2 flex items-center justify-center bg-gray-100 rounded-full">
              <ShieldCheck className="w-5 h-5 text-green-500" />
            </div>
          </div>

          {hasDiscount && (
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