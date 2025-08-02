import React from 'react';
import { useCurrency } from '../../CurrencyContext';
import { Globe } from 'lucide-react';

export default function CurrencyConverter() {
  const { currency, changeCurrency, loading, availableCurrencies = [] } = useCurrency();

  const fallbackCurrencies = [
    { code: 'USD', label: 'USD' },
    { code: 'NGN', label: 'NGN' },
    { code: 'GBP', label: 'GBP' },
    { code: 'JPY', label: 'JPY' },
    { code: 'GHS', label: 'GHS' },
    { code: 'EUR', label: 'EUR' },
    { code: 'CAD', label: 'CAD' },
    { code: 'AUD', label: 'AUD' },
    { code: 'CNY', label: 'CNY' },
    { code: 'INR', label: 'INR' },
  ];

  return (
    <div className="flex items-center">
      <Globe className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      {loading ? (
        <span className="text-xs text-gray-600 dark:text-gray-300">Loading...</span>
      ) : (
        <select
          value={currency}
          onChange={(e) => changeCurrency(e.target.value)}
          className="rounded-md bg-gray-100 dark:bg-gray-700 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Select currency"
        >
          {(availableCurrencies.length > 0 ? availableCurrencies : fallbackCurrencies).map((cur) => (
            <option key={cur.code} value={cur.code}>
              {cur.code}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}