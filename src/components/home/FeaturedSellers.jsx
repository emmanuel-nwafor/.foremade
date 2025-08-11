import React from 'react';
import { Link } from 'react-router-dom';

export default function FeaturedSellers() {
  const sellers = [
    {
      id: 1,
      name: "Tech Haven",
      rating: 4.8,
      sales: "5k+",
      image: "https://example.com/seller1.jpg",
      category: "Electronics"
    },
    // ...existing code...
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Featured Sellers</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {sellers.map((seller) => (
          <Link
            key={seller.id}
            to={`/seller/${seller.id}`}
            className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <img
                src={seller.image}
                alt={seller.name}
                className="w-16 h-16 rounded-full object-cover"
              />
              <div>
                <h3 className="font-semibold text-gray-800">{seller.name}</h3>
                <p className="text-sm text-gray-500">{seller.category}</p>
                <div className="flex items-center mt-1">
                  <i className="bx bxs-star text-yellow-400"></i>
                  <span className="text-sm text-gray-600 ml-1">{seller.rating}</span>
                  <span className="text-sm text-gray-500 ml-2">({seller.sales} sales)</span>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
