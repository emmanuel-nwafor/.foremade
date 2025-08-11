import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function TrendingItems() {
  const items = [
    { id: 1, title: "Wireless Earbuds", price: "₦12,999", views: "1.2k", image: "https://example.com/earbuds.jpg" },
    // ...existing code...
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Trending Now</h2>
        <Link to="/trending" className="text-blue-600 hover:underline text-sm">See All</Link>
      </div>
      <div className="flex overflow-x-auto gap-4 pb-4 scrollbar-hide">
        {items.map((item) => (
          <motion.div
            key={item.id}
            whileHover={{ y: -5 }}
            className="flex-shrink-0 w-64 bg-white rounded-lg shadow-sm overflow-hidden"
          >
            <img src={item.image} alt={item.title} className="w-full h-48 object-cover" />
            <div className="p-4">
              <h3 className="text-lg font-semibold mb-2">{item.title}</h3>
              <p className="text-blue-600 font-bold">{item.price}</p>
              <div className="flex items-center mt-2 text-sm text-gray-500">
                <i className="bx bx-show mr-1"></i>
                <span>{item.views} views</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
