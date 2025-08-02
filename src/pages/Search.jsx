import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';
import { toast } from 'react-toastify';

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState([0, 100000]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const productSnapshot = await getDocs(collection(db, 'products'));
        const categorySet = new Set(
          productSnapshot.docs.map((doc) => doc.data().category || 'Other')
        );
        setCategories(['All', ...categorySet]);
      } catch (err) {
        console.error('Error fetching categories:', err);
        toast.error('Failed to load categories.');
      }
    };
    fetchCategories();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setProducts([]);
      return;
    }
    setLoading(true);
    try {
      let q = query(collection(db, 'products'), where('status', '==', 'approved'));
      if (selectedCategory !== 'All') {
        q = query(q, where('category', '==', selectedCategory));
      }
      const snapshot = await getDocs(q);
      const results = snapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter(
          (product) =>
            product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            product.price >= priceRange[0] &&
            product.price <= priceRange[1]
        );
      setProducts(results);
    } catch (err) {
      console.error('Error searching products:', err);
      toast.error('Failed to load search results.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeout = setTimeout(handleSearch, 500);
    return () => clearTimeout(timeout);
  }, [searchTerm, selectedCategory, priceRange]);

  return (
    <div className="min-h-screen bg-gray-100 py-4 xs:py-6">
      <div className="container mx-auto px-3 xs:px-4">
        {/* Search Bar */}
        <div className="relative mb-4 xs:mb-6">
          <input
            type="text"
            placeholder="Search for items..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 xs:py-3 rounded-full bg-white shadow-sm text-sm xs:text-base focus:outline-none focus:ring-2 focus:ring-blue-500 justify-end"
          />
          <i className="bx bx-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg xs:text-xl"></i>
        </div>

        {/* Filters */}
        <div className="flex flex-col xs:flex-row gap-3 xs:gap-4 mb-4 xs:mb-6">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 rounded-lg bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <div className="flex items-center gap-2">
            <input
              type="number"
              placeholder="Min"
              value={priceRange[0] || ''}
              onChange={(e) => setPriceRange([Number(e.target.value) || 0, priceRange[1]])}
              className="w-20 px-2 py-2 rounded-lg bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span>-</span>
            <input
              type="number"
              placeholder="Max"
              value={priceRange[1] || ''}
              onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value) || 100000])}
              className="w-20 px-2 py-2 rounded-lg bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 xs:gap-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-white rounded-lg shadow-sm h-[260px] animate-pulse"></div>
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-600">
            <i className="bx bx-search-alt-2 text-4xl mb-2"></i>
            <p className="text-sm xs:text-base">No products found. Try a different search term.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 xs:gap-4">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  price: product.price,
                  imageUrls: product.imageUrls,
                  sellerName: product.sellerName || 'Unknown Seller',
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;