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
      let userCountry = 'US'; // Default
      let userCurrency = 'USD';

      console.log('Starting currency detection via IP...');
      try {
        const response = await axios.get('https://ipapi.co/json/', { timeout: 5000 });
        userCountry = response.data.country_code?.toUpperCase() || 'US';
        console.log('Country from IP:', userCountry);
      } catch (error) {
        console.error('IP geolocation error:', error.message);
      }

      // Country-to-currency map
      const countryCurrencyMap = {
        NG: 'NGN', GB: 'GBP', US: 'USD', JP: 'JPY', GH: 'GHS', DE: 'EUR', FR: 'EUR',
        IT: 'EUR', ES: 'EUR', CA: 'CAD', AU: 'AUD', CN: 'CNY', IN: 'INR', BR: 'BRL',
        ZA: 'ZAR', KE: 'KES', MX: 'MXN', RU: 'RUB', SG: 'SGD', AE: 'AED', SA: 'SAR',
        KR: 'KRW', NZ: 'NZD', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK', EG: 'EGP',
        TR: 'TRY'
      };
      userCurrency = countryCurrencyMap[userCountry] || 'USD';
      console.log('Set currency to:', userCurrency);
      setCurrency(userCurrency);

      // Fetch exchange rates
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
        }
      } catch (error) {
        console.error('Exchange rate fetch error:', error.message);
        setRates({ NGN: 1, USD: 0.00062, GBP: 0.00048, JPY: 0.099, GHS: 0.0096, EUR: 0.00058 });
      } finally {
        setLoading(false);
        console.log('Currency detection complete');
      }
    };

    fetchLocationAndCurrency();
  }, []);

  const convertPrice = (priceInNGN) => {
    if (!rates[currency]) {
      console.warn(`Rate not found for ${currency}, using NGN`);
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'NGN' }).format(priceInNGN);
    }
    const convertedPrice = priceInNGN * rates[currency];
    return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(convertedPrice);
  };

  const changeCurrency = (newCurrency) => {
    if (rates[newCurrency]) {
      console.log('Changing currency to:', newCurrency);
      setCurrency(newCurrency);
    } else {
      console.warn(`No rate for ${newCurrency}`);
    }
  };

  return (
    <CurrencyContext.Provider value={{ currency, rates, convertPrice, changeCurrency, loading, availableCurrencies }}>
      {children}
    </CurrencyContext.Provider>
  );
};