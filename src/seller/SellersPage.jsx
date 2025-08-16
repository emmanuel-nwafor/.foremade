import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { db } from "/src/firebase";
import { doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";
import { toast } from "react-toastify";
import Spinner from "/src/components/common/Spinner";
import PriceFormatter from "/src/components/layout/PriceFormatter";
import placeholder from "/src/assets/placeholder.png";
import { ShieldCheck, User } from "lucide-react";
import "boxicons/css/boxicons.min.css";

const SellersPage = () => {
  const { sellerId } = useParams();
  const [seller, setSeller] = useState(null);
  const [products, setProducts] = useState([]);
  const [feeConfig, setFeeConfig] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSellerData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch fee configuration
        const feeRef = doc(db, "feeConfigurations", "categoryFees");
        const feeSnap = await getDoc(feeRef);
        const fees = feeSnap.exists() ? feeSnap.data() : {};
        setFeeConfig(fees);

        // Fetch seller details from 'users' collection
        const sellerRef = doc(db, "users", sellerId);
        const sellerSnap = await getDoc(sellerRef);

        if (!sellerSnap.exists()) {
          setError("Seller not found.");
          return;
        }

        const sellerData = sellerSnap.data();
        // Only include non-sensitive fields
        const filteredSellerData = {
          username: sellerData.username || `Seller ${sellerId.slice(0, 6)}`,
          profilePicture: sellerData.profilePicture || `https://ui-avatars.com/api/?name=${encodeURIComponent(sellerData.username || "Seller")}&size=128&background=112d4e&color=fff`,
          isProSeller: sellerData.isProSeller || false,
        };
        setSeller(filteredSellerData);

        // Fetch products by this seller
        const productsQuery = query(
          collection(db, "products"),
          where("sellerId", "==", sellerId)
        );
        const productsSnap = await getDocs(productsQuery);
        const productsList = productsSnap.docs.map((doc) => {
          const productData = doc.data();
          const category = productData.category || "default";
          const config = fees[category] || { minPrice: 1000, maxPrice: Infinity, buyerProtectionRate: 0.08, handlingRate: 0.20 };
          const basePrice = productData.price || 0;
          const totalPrice = basePrice + basePrice * config.buyerProtectionRate + basePrice * config.handlingRate;

          return {
            id: doc.id,
            ...productData,
            imageUrls: Array.isArray(productData.imageUrls) && productData.imageUrls.length > 0
              ? productData.imageUrls[0]
              : placeholder,
            totalPrice,
            category,
          };
        });
        setProducts(productsList);
      } catch (err) {
        console.error("Error fetching seller data:", err);
        setError("Failed to load seller data.");
        toast.error("Failed to load seller data.", { position: "top-right", autoClose: 3000 });
      } finally {
        setLoading(false);
      }
    };

    if (sellerId) {
      fetchSellerData();
    } else {
      setError("Invalid seller ID.");
      setLoading(false);
    }
  }, [sellerId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Spinner />
        <p className="text-gray-600 text-sm mt-2">Loading seller data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p className="text-red-600 text-sm">{error}</p>
        <Link
          to="/products"
          className="text-blue-600 hover:underline text-sm flex items-center gap-1 justify-center mt-4"
          aria-label="Back to products"
        >
          <i className="bx bx-arrow-back" aria-hidden="true" />
          Back to Products
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mb-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <i className="bx bx-store text-blue-600" aria-hidden="true" />
          Seller Profile
        </h1>
        <Link
          to="/products"
          className="text-blue-600 hover:underline text-sm flex items-center gap-1"
          aria-label="Back to products"
        >
          <i className="bx bx-arrow-back" aria-hidden="true" />
          Back to Products
        </Link>
      </div>

      {/* Seller Info Section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8 flex items-center gap-6">
        <img
          src={seller.profilePicture}
          alt={`${seller.username}'s avatar`}
          className="w-24 h-24 rounded-full object-cover border-2 border-blue-600"
          onError={(e) => {
            e.target.src = placeholder;
          }}
          loading="lazy"
          aria-label="Seller avatar"
        />
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-800">{seller.username}</h2>
            {seller.isProSeller ? (
              <ShieldCheck
                className="w-5 h-5 text-amber-500"
                aria-label="Pro Seller"
                title="Premium Seller"
              />
            ) : (
              <User
                className="w-5 h-5 text-gray-500"
                aria-label="Standard Seller"
                title="Standard Seller"
              />
            )}
          </div>
          <p className="text-sm text-gray-600">
            {products.length} {products.length === 1 ? "product" : "products"} listed
          </p>
          <p className="text-sm text-amber-500 mt-3">
            {seller.isProSeller ? "Pro Seller" : "Standard Seller"}
          </p>
        </div>
      </div>

      {/* Seller's Products Section */}
      <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <i className="bx bx-package text-blue-600" aria-hidden="true" />
        Products by {seller.username}
        <span className="ml-2 text-xs text-gray-500 cursor-help relative group" aria-label="Prices include fees">
          <i className="bx bx-info-circle" aria-hidden="true" />
          <span className="absolute hidden group-hover:block bg-gray-800 text-white text-xs rounded-lg p-2 -top-10 left-0 w-48 z-10">
            Prices are inclusive of taxes etc.
          </span>
        </span>
      </h2>
      {products.length === 0 ? (
        <p className="text-gray-600 text-sm">
          No products found for this seller.{" "}
          <Link to="/products" className="text-blue-600 hover:underline">
            Browse other products
          </Link>
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <Link
              key={product.id}
              to={`/product/${product.id}`}
              className="bg-white p-4 rounded-lg shadow-md hover:shadow-lg transition transform"
              aria-label={`View ${product.name}`}
            >
              <img
                src={product.imageUrls}
                alt={product.name || "Product image"}
                className="w-full h-48 object-cover rounded-lg mb-4"
                onError={(e) => {
                  e.target.src = placeholder;
                }}
                loading="lazy"
              />
              <h3 className="text-base font-semibold text-gray-800 truncate">
                {product.name || "Unnamed Product"}
              </h3>
              <p className="text-sm text-gray-600">
                <PriceFormatter price={product.totalPrice || 0} currency="NGN" />
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default SellersPage;