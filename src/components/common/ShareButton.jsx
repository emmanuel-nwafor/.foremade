// ShareButton.jsx
import React, { useState, useRef, useEffect } from "react";

const ShareButton = ({ productId, productName }) => {
  const [open, setOpen] = useState(false);
  const popupRef = useRef(null);

  const productUrl = `${window.location.origin}/product/${productId}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(productUrl);
      alert("Product link copied to clipboard!");
      setOpen(false);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleWhatsAppShare = () => {
    const message = `Check out this product: ${productName}\n${productUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
    setOpen(false);
  };

  // Close popup if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-10 h-10 bg-gray-200 rounded-full hover:bg-gray-300 transition"
      >
        <i className="bx bx-share bx-flip-horizontal text-2xl"></i>
      </button>

      {open && (
        <div
          ref={popupRef}
          className="absolute top-full mt-2 right-0 w-40 bg-white dark:bg-gray-800 shadow-lg rounded-lg border border-gray-200 dark:border-gray-700 z-50"
        >
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <i className="bx bxl-whatsapp text-green-500 text-lg"></i>
            WhatsApp
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 w-full text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            <i className="bx bx-copy text-black text-lg"></i>
            Copy Link
          </button>
        </div>
      )}
    </div>
  );
};

export default ShareButton;
