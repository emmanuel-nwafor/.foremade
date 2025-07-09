import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from './firebase';
import axios from 'axios';

const CurrencyContext = createContext();

export const useCurrency = () => useContext(CurrencyContext);

export const CurrencyProvider = ({ children }) => {
  const [currency, setCurrency] = useState('USD');
  const [rates, setRates] = useState({ NGN: 1, USD: 0.00062, GBP: 0.00048, JPY: 0.099, GHS: 0.0096, EUR: 0.00058 });
  const [availableCurrencies, setAvailableCurrencies] = useState([
    { code: 'USD', label: '$ USD' },
    { code: 'NGN', label: '₦ NGN' },
    { code: 'GBP', label: '£ GBP' },
    { code: 'JPY', label: '¥ JPY' },
    { code: 'GHS', label: '₵ GHS' },
    { code: 'EUR', label: '€ EUR' },
    { code: 'CAD', label: '$ CAD' },
    { code: 'AUD', label: '$ AUD' },
    { code: 'CNY', label: '¥ CNY' },
    { code: 'INR', label: '₹ INR' },
  ]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLocationAndCurrency = async () => {
      let userCountry = 'US'; // Default to US (USD)
      let userCurrency = 'USD';

      console.log('Starting currency detection...');

      // Check Firestore for user/seller country
      if (auth.currentUser) {
        try {
          console.log('Checking Firestore for user:', auth.currentUser.uid);
          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userSnap = await getDoc(userRef);
          if (userSnap.exists() && userSnap.data().country) {
            userCountry = userSnap.data().country.toUpperCase();
            console.log('User country from Firestore:', userCountry);
          } else {
            const sellerRef = doc(db, 'sellers', auth.currentUser.uid);
            const sellerSnap = await getDoc(sellerRef);
            if (sellerSnap.exists() && sellerSnap.data().country) {
              userCountry = sellerSnap.data().country.toUpperCase();
              console.log('Seller country from Firestore:', userCountry);
            }
          }
        } catch (error) {
          console.error('Firestore error:', error.message);
        }
      } else {
        // Fallback to browser geolocation
        console.log('No user logged in, using ipapi.co for geolocation');
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const response = await axios.get('https://ipapi.co/json/', { timeout: 5000 });
            userCountry = response.data.country_code?.toUpperCase() || 'US';
            console.log(`Geolocation attempt ${attempt} country:`, userCountry);
            break;
          } catch (error) {
            console.error(`Geolocation attempt ${attempt} error:`, error.message);
            if (attempt === 1) {
              await new Promise((resolve) => setTimeout(resolve, 1000));
            }
          }
        }
      }

      // Comprehensive country-to-currency map
      const countryCurrencyMap = {
        NG: 'NGN', // Nigeria
        GB: 'GBP', // United Kingdom
        US: 'USD', // United States
        JP: 'JPY', // Japan
        GH: 'GHS', // Ghana
        DE: 'EUR', // Germany
        FR: 'EUR', // France
        IT: 'EUR', // Italy
        ES: 'EUR', // Spain
        CA: 'CAD', // Canada
        AU: 'AUD', // Australia
        CN: 'CNY', // China
        IN: 'INR', // India
        BR: 'BRL', // Brazil
        ZA: 'ZAR', // South Africa
        KE: 'KES', // Kenya
        MX: 'MXN', // Mexico
        RU: 'RUB', // Russia
        SG: 'SGD', // Singapore
        AE: 'AED', // UAE
        SA: 'SAR', // Saudi Arabia
        KR: 'KRW', // South Korea
        NZ: 'NZD', // New Zealand
        CH: 'CHF', // Switzerland
        SE: 'SEK', // Sweden
        NO: 'NOK', // Norway
        DK: 'DKK', // Denmark
        EG: 'EGP', // Egypt
        TR: 'TRY', // Turkey
        // Extend for other countries as needed
      };
      userCurrency = countryCurrencyMap[userCountry] || 'USD';
      console.log('Selected currency:', userCurrency);
      setCurrency(userCurrency);

      // Fetch exchange rates and currencies
      try {
        console.log('Fetching exchange rates...');
        const ratesRef = doc(db, 'currencyRates', 'latest');
        const ratesSnap = await getDoc(ratesRef);
        if (ratesSnap.exists() && ratesSnap.data().updatedAt?.toDate() > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
          setRates(ratesSnap.data().rates);
          setAvailableCurrencies(ratesSnap.data().availableCurrencies || availableCurrencies);
          console.log('Loaded rates from Firestore:', ratesSnap.data().rates);
        } else {
          const response = await axios.get('https://v6.exchangerate-api.com/v6/YOUR_API_KEY/latest/NGN', { timeout: 5000 });
          const newRates = response.data.conversion_rates;
          const currencyList = Object.keys(newRates)
            .sort()
            .map((code) => ({
              code,
              label: new Intl.NumberFormat('en-US', { style: 'currency', currency: code }).format(0).replace(/[0-9.,]/g, '') + ` ${code}`,
            }));
          await setDoc(ratesRef, {
            base: 'NGN',
            rates: newRates,
            availableCurrencies: currencyList,
            updatedAt: serverTimestamp(),
          });
          setRates(newRates);
          setAvailableCurrencies(currencyList);
          console.log('Fetched rates from API:', newRates);
          console.log('Available currencies:', currencyList.length);
        }
      } catch (error) {
        console.error('Exchange rate fetch error:', error.message);
        // Fallback to minimal rates
        setRates({ NGN: 1, USD: 0.00062, GBP: 0.00048, JPY: 0.099, GHS: 0.0096, EUR: 0.00058 });
      } finally {
        setLoading(false);
        console.log('Currency detection complete, loading:', false);
      }
    };

    fetchLocationAndCurrency();
  }, []);

  const convertPrice = (priceInNGN) => {
    if (!rates[currency]) {
      console.warn(`Rate not found for currency: ${currency}, using NGN`);
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'NGN',
        minimumFractionDigits: 2,
      }).format(priceInNGN);
    }
    const convertedPrice = priceInNGN * rates[currency];
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    }).format(convertedPrice);
  };

  const changeCurrency = (newCurrency) => {
    if (rates[newCurrency]) {
      console.log('Changing currency to:', newCurrency);
      setCurrency(newCurrency);
    } else {
      console.warn(`No rate available for currency: ${newCurrency}`);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, rates, convertPrice, changeCurrency, loading, availableCurrencies }}>
      {children}
    </CurrencyContext.Provider>
  );
};