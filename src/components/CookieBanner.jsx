
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
    <div className="fixed bottom-0 left-0 right-0 bg-primary text-white py-4 px-6 text-center text-sm z-50 flex flex-col md:flex-row items-center justify-center">
      <span>
        We use cookies to improve your experience on our site. By using our site, you accept our use of cookies.
      </span>
      <a href="/cookie-policy" className="text-accent underline ml-2">
        Learn more
      </a>
      <button
        onClick={acceptCookies}
        className="ml-4 bg-accent text-primary font-bold px-4 py-2 rounded shadow hover:bg-accent-dark transition-colors"
      >
        Accept
      </button>
    </div>
  );
};

export default CookieBanner;
