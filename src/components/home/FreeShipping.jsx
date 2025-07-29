import React, { useState, useEffect } from 'react';

export default function FreeShipping() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user is logged in (simple check: userData in localStorage)
    const userData = localStorage.getItem('userData');
    if (!userData) {
      // If user is logged out, clear the dismissal flag so banner can show again
      localStorage.removeItem('freeShippingDismissed');
    }
    // Check localStorage for dismissal state
    const isDismissed = localStorage.getItem('freeShippingDismissed');
    if (!isDismissed && !userData) {
      setIsVisible(true);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
    localStorage.setItem('freeShippingDismissed', 'true');
  };

  if (!isVisible) return null;

  return (
    <div className="relative p-[1px] bg-[#eb9325]">
      <div className="flex items-center justify-center">
        <p className="text-white text-md max-md:text-sm m-1 max-md:m-0 text-center py-2">
          Up to 30% off when you buy multiple items | Free shipping Nationwide!
        </p>
        <button
          onClick={handleDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-white hover:text-gray-200"
          title="Dismiss"
          aria-label="Dismiss free shipping banner"
        >
          <i className="bx bx-x text-xl"></i>
        </button>
      </div>
    </div>
  );
}