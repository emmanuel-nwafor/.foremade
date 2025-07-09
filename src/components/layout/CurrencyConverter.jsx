import React from 'react';
import { useCurrency } from '/src/CurrencyContext';
import { Globe } from 'lucide-react';

export default function CurrencyConverter() {
  const { currency, changeCurrency, loading } = useCurrency();

  const currencies = [
    { code: 'NGN', label: '₦ NGN' },
    { code: 'GBP', label: '£ GBP' },
  ];

  return (
    <div className="flex items-center gap-2">
      <Globe className="w-4 h-4 text-gray-600 dark:text-gray-300" />
      {loading ? (
        <span className="text-xs text-gray-600 dark:text-gray-300">Loading...</span>
      ) : (
        <select
          value={currency}
          onChange={(e) => changeCurrency(e.target.value)}
          className="p-1 rounded-md bg-gray-100 dark:bg-gray-700 text-xs text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Select currency"
        >
          {currencies.map((cur) => (
            <option key={cur.code} value={cur.code}>
              {cur.label}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}