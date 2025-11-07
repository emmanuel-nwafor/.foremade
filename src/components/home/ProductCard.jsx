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
import { Heart, Palette, Ruler, ShieldCheck } from "lucide-react";
import PriceFormatter from "/src/components/layout/PriceFormatter";
import placeholder from "/src/assets/placeholder.png";

const ProductCard = ({
  product,
  dailyDeals = [],
  selectedColor = "",
  selectedSize = "",
  selectedVariant = null,
  onClick,
  isFavorite = false,
  toggleFavorite,
  cardClassName = "",
  imageClassName = "",
  priceClassName = "",
  nameClassName = "",
}) => {
  const [isFavorited, setIsFavorited] = useState(isFavorite);
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

  let mergedProduct = { ...product, stock: Number(product.stock) || 0 };
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
        Number((deal.discount * 100).toFixed(2)) || 0;
    }
  }

  const hasVariants = Array.isArray(mergedProduct.variants) && mergedProduct.variants.length > 0;

  // Determine base price
  const basePrice = Number(selectedVariant?.price || product.price) || 0;

  // Calculate min and max variant prices
  const variantPrices = hasVariants
    ? mergedProduct.variants.map((v) => Number(v.price) || 0).filter((p) => p > 0)
    : [basePrice];
  const minVariantPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : basePrice;
  const maxVariantPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : basePrice;

  useEffect(() => {
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

    // Image handling
    let initialImage = placeholder;
    if (selectedVariant?.imageUrls?.length > 0) {
      const firstValidUrl = selectedVariant.imageUrls.find(
        (url) => typeof url === "string" && url.startsWith("https://")
      );
      initialImage = firstValidUrl || selectedVariant.imageUrls[0] || placeholder;
    } else if (hasVariants && mergedProduct.variants[0]?.imageUrls) {
      const firstValidUrl = mergedProduct.variants[0].imageUrls.find(
        (url) => typeof url === "string" && url.startsWith("https://")
      );
      initialImage = firstValidUrl || mergedProduct.variants[0].imageUrls[0] || placeholder;
    } else if (Array.isArray(mergedProduct.imageUrls) && mergedProduct.imageUrls.length > 0) {
      const firstValidUrl = mergedProduct.imageUrls.find(
        (url) => typeof url === "string" && url.startsWith("https://")
      );
      initialImage = firstValidUrl || mergedProduct.imageUrls[0] || placeholder;
    } else if (
      mergedProduct.imageUrl &&
      typeof mergedProduct.imageUrl === "string" &&
      mergedProduct.imageUrl.startsWith("https://")
    ) {
      initialImage = mergedProduct.imageUrl;
    } else {
      console.warn(`Product ${mergedProduct.id} has no valid imageUrl or imageUrls`);
    }
    setImageUrl(initialImage);
    setImageFailed(false);
  }, [mergedProduct.id, mergedProduct.imageUrls, mergedProduct.imageUrl, mergedProduct.variants, selectedVariant]);

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
            isFavorite
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
  }, [product.id, isFavorite]);

  useEffect(() => {
    if (feeConfig && mergedProduct.category && minVariantPrice > 0) {
      const config = feeConfig[mergedProduct.category] || {
        minPrice: 1000,
        maxPrice: Infinity,
        buyerProtectionRate: 0.08,
        handlingRate: 0.20,
      };
      const buyerProtectionFee = minVariantPrice * config.buyerProtectionRate;
      const handlingFee = minVariantPrice * config.handlingRate;
      const totalEstimatedPrice = minVariantPrice + buyerProtectionFee + handlingFee;
      const sellerEarnings = minVariantPrice;
      setFees({
        buyerProtectionFee,
        handlingFee,
        totalEstimatedPrice,
        sellerEarnings,
      });
    }
  }, [feeConfig, mergedProduct.category, minVariantPrice]);

  // Calculate prices for display
  const originalPrice = basePrice;
  const totalPrice = fees.totalEstimatedPrice;
  const discountedTotalPrice = mergedProduct.isDailyDeal
    ? Math.round(totalPrice * (1 - mergedProduct.discountPercentage / 100))
    : totalPrice;

  const minTotalPrice = hasVariants ? fees.totalEstimatedPrice : totalPrice;
  const maxTotalPrice = hasVariants
    ? Math.round(
        (maxVariantPrice +
          maxVariantPrice * (feeConfig?.[mergedProduct.category]?.buyerProtectionRate || 0.08) +
          maxVariantPrice * (feeConfig?.[mergedProduct.category]?.handlingRate || 0.20)) *
          (mergedProduct.isDailyDeal ? 1 - mergedProduct.discountPercentage / 100 : 1)
      )
    : totalPrice;

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (toggleFavorite) {
      toggleFavorite();
    } else {
      const userId = auth.currentUser?.uid;
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
    }
  };

  const truncateText = (text, maxLength = 35) => {
    if (!text || typeof text !== "string") return "No name available";
    return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
  };

  // Extract colors and sizes from product and variants
  const uniqueColors = [
    ...(mergedProduct.colors ? (Array.isArray(mergedProduct.colors) ? mergedProduct.colors : [mergedProduct.colors]) : []),
    ...(hasVariants
      ? [...new Set(mergedProduct.variants.map((v) => v.color).filter(Boolean))]
      : []),
  ].filter((value, index, self) => self.indexOf(value) === index);

  const uniqueSizes = [
    ...(mergedProduct.sizes ? (Array.isArray(mergedProduct.sizes) ? mergedProduct.sizes : [mergedProduct.sizes]) : []),
    ...(hasVariants
      ? [...new Set(mergedProduct.variants.map((v) => v.size).filter(Boolean))]
      : []),
  ].filter((value, index, self) => self.indexOf(value) === index);

  return (
    <Link
      to={`/product/${mergedProduct.id}`}
      onClick={onClick}
      className={`bg-[#F0F0F0] rounded-lg transition duration-300 flex flex-col min-w-0 overflow-hidden ${cardClassName}`}
      tabIndex={0}
      aria-label={mergedProduct.name}
    >
    <div className={`relative h-[200px] overflow-hidden rounded-t-lg min-w-0 bg-[#F0F0F0] flex items-center justify-center ${imageClassName}`}>
          <img
            src={imageFailed ? placeholder : imageUrl}
            alt={mergedProduct.name || "Product Image"}
            className="w-full h-full object-contain object-center max-w-full max-h-full"
          onError={(e) => {
            if (!imageFailed) {
              // console.error(
              //   "Image load error for product:",
              //   mergedProduct.id,
              //   mergedProduct.name,
              //   { imageUrl, attemptedUrl: e.target.src }
              // );
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
          aria-label={isFavorited ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart
            className={`w-5 h-5 ${isFavorited ? "text-gray-600 fill-gray-600" : "text-gray-600"}`}
          />
          <p className="mx-1 text-sm">{favoriteCount}</p>
        </button>
        {mergedProduct.isDailyDeal && (
          <div className="absolute top-2 left-2 bg-red-600 text-white px-1.5 xs:px-2 py-0.5 xs:py-1 rounded-full text-[10px] xs:text-xs font-bold">
            {mergedProduct.discountPercentage}% OFF
          </div>
        )}
      </div>
      <div className="flex flex-col justify-between flex-grow p-3 min-w-0 overflow-hidden">
        <div>
          <h3
            className={`mb-1 break-words line-clamp-2 min-h-[48px] ${nameClassName}`}
            title={mergedProduct.name}
            style={{
              fontSize: "13px",
              // fontWeight: 600,
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
            <span className="inline-block border border-red-500 text-red-500 text-[10px] font-semibold px-[3px] py-[2px] rounded-full">
              Almost Gone
            </span>
          )}
          <div className="flex items-center justify-between mt-2">
            {mergedProduct.condition && (
              <p
                style={{ fontSize: "13px", color: "#222" }}
                className="mb-2"
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
          {(uniqueColors.length > 0 || uniqueSizes.length > 0) && (
            <div className="flex flex-wrap gap-x-3 gap-y-1 mb-2 text-xs text-gray-600">
              {uniqueColors.length > 0 && (
                <span className="flex items-center">
                  <Palette size={14} className="mr-1 text-gray-500" />
                  {uniqueColors.join(", ")}
                </span>
              )}
              {uniqueSizes.length > 0 && (
                <span className="flex items-center">
                  <Ruler size={14} className="mr-1 text-gray-500" />
                  {uniqueSizes.slice(0, 4).join(", ")}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="mt-auto">
          <div className="flex items-center justify-between">
            <span
              className={`text-[16px] text-[#222] flex items-center gap-0.5rem ${priceClassName}`}
            >
              {hasVariants ? (
                <>
                  <PriceFormatter
                    price={mergedProduct.isDailyDeal ? Math.round(minTotalPrice * (1 - mergedProduct.discountPercentage / 100)) : minTotalPrice}
                    currency={mergedProduct.currency || localStorage.getItem("currency") || "USD"}
                  />
                </>
              ) : (
                <PriceFormatter
                  price={mergedProduct.isDailyDeal ? discountedTotalPrice : totalPrice}
                  currency={mergedProduct.currency || localStorage.getItem("currency") || "USD"}
                />
              )}
            </span>
          </div>
          {mergedProduct.isDailyDeal && (
            <span
              className="text-gray-400 line-through text-[10px]"
              style={{ fontSize: "10px" }}
            >
              <PriceFormatter
                price={hasVariants ? minVariantPrice : originalPrice}
                currency={mergedProduct.currency || localStorage.getItem("currency") || "USD"}
              />
              {hasVariants && minVariantPrice !== maxVariantPrice && (
                <>
                  {" - "}
                  <PriceFormatter
                    price={maxVariantPrice}
                    currency={mergedProduct.currency || localStorage.getItem("currency") || "USD"}
                  />
                </>
              )}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
};

export default ProductCard;