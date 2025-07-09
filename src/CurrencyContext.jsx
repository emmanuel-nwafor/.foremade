import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import axios from 'axios';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('NGN');
  const [rates, setRates] = useState({ NGN: 1, GBP: 0.001 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocationAndCurrency = async () => {
      let userCountry = 'NG'; // Default to Nigeria
      let userCurrency = 'NGN';

      // Check Firestore for user/seller country
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists() && userSnap.data().country) {
          userCountry = userSnap.data().country;
        } else {
          const sellerRef = doc(db, 'sellers', auth.currentUser.uid);
          const sellerSnap = await getDoc(sellerRef);
          if (sellerSnap.exists() && sellerSnap.data().country) {
            userCountry = sellerSnap.data().country;
          }
        }
      } else {
        // Fallback to browser geolocation
        try {
          const response = await axios.get('https://ipapi.co/json/');
          userCountry = response.data.country_code;
        } catch (error) {
          console.error('Geolocation error:', error);
        }
      }

      // Map country to currency
      const countryCurrencyMap = {
        NG: 'NGN',
        GB: 'GBP',
      };
      userCurrency = countryCurrencyMap[userCountry] || 'NGN';
      setCurrency(userCurrency);

      // Fetch exchange rates
      const ratesRef = doc(db, 'currencyRates', 'latest');
      const ratesSnap = await getDoc(ratesRef);
      if (ratesSnap.exists() && ratesSnap.data().updatedAt.toDate() > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
        setRates(ratesSnap.data().rates);
        setLoading(false);
      } else {
        try {
          const response = await axios.get('https://v6.exchangerate-api.com/v6/8de4f48b0314d62f3381e82d/latest/NGN');
          const newRates = response.data.conversion_rates;
          await setDoc(ratesRef, {
            base: 'NGN',
            rates: newRates,
            updatedAt: serverTimestamp(),
          });
          setRates(newRates);
        } catch (error) {
          console.error('Exchange rate fetch error:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchLocationAndCurrency();
  }, []);

  const convertPrice = (priceInNGN) => {
    if (!rates[currency]) return priceInNGN;
    const convertedPrice = priceInNGN * rates[currency];
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(convertedPrice);
  };

  const changeCurrency = (newCurrency) => {
    if (rates[newCurrency]) setCurrency(newCurrency);
  };

  return (
    <CurrencyContext.Provider value={{ currency, rates, convertPrice, changeCurrency, loading }}>
      {children}
    </CurrencyContext.Provider>
  );
};