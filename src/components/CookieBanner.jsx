
import React, { useEffect, useState } from 'react';

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const cookiesAccepted = localStorage.getItem('cookiesAccepted');
    if (!cookiesAccepted) {
      setVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-8 md:right-8 bg-white shadow-lg rounded-lg p-4 z-50 border border-gray-200">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 max-w-7xl mx-auto">
        <div className="flex-1 text-gray-600 text-sm md:text-base">
          We use cookies to improve your experience on our site. By using our site, you accept our use of cookies.
        </div>
        <div className="flex items-center gap-4">
          <a 
            href="/cookie-policy" 
            className="text-[#112d4e] hover:text-[#112d4e] text-sm font-medium hover:underline"
          >
            Learn more
          </a>
          <button
            onClick={acceptCookies}
            className="bg-[#112d4e] hover:bg-[#112d4e] text-white font-medium px-6 py-2 rounded-md transition-colors duration-200 text-sm"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieBanner;
