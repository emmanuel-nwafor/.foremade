import React from 'react';
import { useCurrency } from '/src/CurrencyContext';

export default function PriceFormatter({ price }) {
  const { convertPrice, loading } = useCurrency();

  return (
    <span className="text-blue-600 font-bold dark:text-gray-200">
      {loading ? '...' : convertPrice(price)}
    </span>
  );
}