import { useState } from 'react';
import { Link } from 'react-router-dom';
import FeaturedProducts from './FeaturedProducts';
import BestSelling from './BestSelling';
import LatestProducts from './LatestProducts';

const RecommendedForYou = () => {
  const [activeTab, setActiveTab] = useState('featured');

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex flex-col items-center justify-between mb-4">
        <h2 className="text-lg text-center sm:text-xl md:text-2xl font-bold text-gray-800 mb-4">
          Recommended For You
        </h2>
        {/* Desktop Tabs (Text) */}
        <div className="hidden sm:flex items-center justify-center gap-4 sm:gap-6 mb-10">
          <button
            className={`text-sm ${
              activeTab === 'featured' ? 'text-blue-600 font-semibold' : 'text-gray-600'
            } hover:text-blue-600`}
            onClick={() => setActiveTab('featured')}
          >
            Featured Products
          </button>
          <button
            className={`text-sm ${
              activeTab === 'bestSelling' ? 'text-blue-600 font-semibold' : 'text-gray-600'
            } hover:text-blue-600`}
            onClick={() => setActiveTab('bestSelling')}
          >
            Best Selling
          </button>
          <button
            className={`text-sm ${
              activeTab === 'latest' ? 'text-blue-600 font-semibold' : 'text-gray-600'
            } hover:text-blue-600`}
            onClick={() => setActiveTab('latest')}
          >
            Latest Products
          </button>
          <Link to="/products" className="text-blue-600 text-sm hover:underline">
            View All
          </Link>
        </div>
        {/* Mobile Tabs (Icons) */}
        <div className="flex sm:hidden items-center justify-center gap-4 mb-10">
          <button
            className={`text-xl ${
              activeTab === 'featured' ? 'text-blue-600' : 'text-gray-600'
            } hover:text-blue-600`}
            onClick={() => setActiveTab('featured')}
          >
            <i className="bx bx-star"></i>
          </button>
          <button
            className={`text-xl ${
              activeTab === 'bestSelling' ? 'text-blue-600' : 'text-gray-600'
            } hover:text-blue-600`}
            onClick={() => setActiveTab('bestSelling')}
          >
            <i className="bx bxs-hot"></i>
          </button>
          <button
            className={`text-xl ${
              activeTab === 'latest' ? 'text-blue-600' : 'text-gray-600'
            } hover:text-blue-600`}
            onClick={() => setActiveTab('latest')}
          >
            <i className="bx bx-time"></i>
          </button>
          <Link to="/products" className="text-blue-600 text-xl hover:text-blue-600">
            <i className="bx bx-right-arrow-alt"></i>
          </Link>
        </div>
      </div>

      {/* Content based on active tab */}
      {activeTab === 'featured' && <FeaturedProducts />}
      {activeTab === 'bestSelling' && <BestSelling />}
      {activeTab === 'latest' && <LatestProducts />}
    </section>
  );
};

export default RecommendedForYou;