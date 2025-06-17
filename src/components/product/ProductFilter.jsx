import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '/src/firebase';

const ProductFilter = ({ onFilterChange }) => {
  const [priceRange, setPriceRange] = useState([0, 100000]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [sortOption, setSortOption] = useState('default');
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handlePriceChange = (newRange) => {
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

  const handleSearchChange = (e) => {
    const newSearchTerm = e.target.value;
    setSearchTerm(newSearchTerm);
    onFilterChange({ priceRange, selectedCategories, sortOption, searchTerm: newSearchTerm });
  };

  return (
    <div className="p-4">
      <h3 className="text-sm font-semibold mb-4">Filters</h3>
      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="w-full p-2 border rounded"
        />
      </div>
      {/* Price Range */}
      <div className="mb-4">
        <label className="block mb-2">Price Range: ₦{priceRange[0]} - ₦{priceRange[1]}</label>
        <input
          type="range"
          min="0"
          max="100000"
          value={priceRange[0]}
          onChange={(e) => handlePriceChange([parseInt(e.target.value), priceRange[1]])}
          className="w-full"
        />
        <input
          type="range"
          min="0"
          max="100000"
          value={priceRange[1]}
          onChange={(e) => handlePriceChange([priceRange[0], parseInt(e.target.value)])}
          className="w-full"
        />
      </div>
      {/* Categories */}
      <div className="mb-4 text-sm">
        <h4 className="font-medium mb-2">Categories</h4>
        {loading ? (
          <p>Loading categories...</p>
        ) : categories.length === 0 ? (
          <p>No categories available</p>
        ) : (
          categories.map((category) => (
            <label key={category.id} className="block">
              <input
                type="checkbox"
                value={category.id}
                checked={selectedCategories.includes(category.id)}
                onChange={() => handleCategoryChange(category.id)}
              />{' '}
              {category.name}
            </label>
          ))
        )}
      </div>
      {/* Sort Options */}
      <div>
        <label className="block mb-2">Sort By</label>
        <select value={sortOption} onChange={handleSortChange} className="w-full p-2 border rounded">
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