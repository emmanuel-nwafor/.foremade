import { useState, useEffect, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '/src/firebase';
import debounce from 'lodash.debounce';

const ProductFilter = ({ onFilterChange }) => {
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortOption, setSortOption] = useState('default');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'categories'));
        const categoryList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || 'Unnamed Category',
        }));
        setCategories(categoryList);
      } catch (err) {
        console.error('Error fetching categories:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  // Debounced search handler
  const debouncedSearch = useCallback(
    debounce((value) => {
      onFilterChange({ priceRange, selectedCategories, sortOption, searchTerm: value });
    }, 300),
    [priceRange, selectedCategories, sortOption]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  const handlePriceChange = (newRange) => {
    const [min, max] = newRange;
    if (min > max) return; // Prevent invalid range
    setPriceRange(newRange);
    onFilterChange({ priceRange: newRange, selectedCategories, sortOption, searchTerm });
  };

  const handleCategoryChange = (categoryId) => {
    const updatedCategories = selectedCategories.includes(categoryId)
      ? selectedCategories.filter((id) => id !== categoryId)
      : [...selectedCategories, categoryId];
    setSelectedCategories(updatedCategories);
    onFilterChange({ priceRange, selectedCategories: updatedCategories, sortOption, searchTerm });
  };

  const handleSortChange = (e) => {
    const newSortOption = e.target.value;
    setSortOption(newSortOption);
    onFilterChange({ priceRange, selectedCategories, sortOption: newSortOption, searchTerm });
  };

  const clearFilters = () => {
    setPriceRange([0, 100000]);
    setSelectedCategories([]);
    setSortOption('default');
    setSearchTerm('');
    onFilterChange({ priceRange: [0, 100000], selectedCategories: [], sortOption: 'default', searchTerm: '' });
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm md:sticky md:top-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Filters</h3>
        <button
          onClick={clearFilters}
          className="text-sm text-blue-600 hover:text-blue-800 transition"
          aria-label="Clear all filters"
        >
          Clear All
        </button>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          aria-label="Search products"
        />
      </div>

      {/* Price Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Price Range: ₦{priceRange[0].toLocaleString()} - ₦{priceRange[1].toLocaleString()}
        </label>
        <div className="flex flex-col gap-2">
          <input
            type="range"
            min="0"
            max="100000"
            value={priceRange[0]}
            onChange={(e) => handlePriceChange([parseInt(e.target.value), priceRange[1]])}
            className="w-full accent-blue-500"
            aria-label="Minimum price"
          />
          <input
            type="range"
            min="0"
            max="100000"
            value={priceRange[1]}
            onChange={(e) => handlePriceChange([priceRange[0], parseInt(e.target.value)])}
            className="w-full accent-blue-500"
            aria-label="Maximum price"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Categories</h4>
          <button
            className="md:hidden text-blue-600 text-sm"
            onClick={() => setIsCategoryOpen(!isCategoryOpen)}
            aria-label={isCategoryOpen ? 'Collapse categories' : 'Expand categories'}
          >
            {isCategoryOpen ? 'Hide' : 'Show'}
          </button>
        </div>
        <div className={`text-sm ${isCategoryOpen ? 'block' : 'hidden md:block'}`}>
          {loading ? (
            <div className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ) : categories.length === 0 ? (
            <p className="text-gray-500">No categories available</p>
          ) : (
            categories.map((category) => (
              <label
                key={category.id}
                className="flex items-center space-x-2 py-1 hover:bg-gray-100 rounded px-2 transition"
              >
                <input
                  type="checkbox"
                  value={category.id}
                  checked={selectedCategories.includes(category.id)}
                  onChange={() => handleCategoryChange(category.id)}
                  className="accent-blue-500"
                  aria-label={`Select ${category.name} category`}
                />
                <span className="text-gray-700">{category.name}</span>
              </label>
            ))
          )}
        </div>
      </div>

      {/* Sort Options */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
        <select
          value={sortOption}
          onChange={handleSortChange}
          className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          aria-label="Sort products"
        >
          <option value="default">Default</option>
          <option value="price-low-high">Price: Low to High</option>
          <option value="price-high-low">Price: High to Low</option>
          <option value="alpha-asc">Alphabetical: A-Z</option>
          <option value="alpha-desc">Alphabetical: Z-A</option>
        </select>
      </div>
    </div>
  );
};

export default ProductFilter;