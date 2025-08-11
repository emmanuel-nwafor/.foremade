import React, { useState, useEffect } from 'react';
import { collection, getDocs, query, where, setDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '/src/firebase';
import { toast } from 'react-toastify';

export default function AdminEditTrendings() {
  const [products, setProducts] = useState([]);
  const [trendingItems, setTrendingItems] = useState({ Fashion: [], Gadgets: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products and trending items
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all approved products
        const productsQuery = query(
          collection(db, 'products'),
          where('status', '==', 'approved')
        );
        const productsSnapshot = await getDocs(productsQuery);
        const allProducts = productsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        // Extract unique categories
        const categorySet = new Set(allProducts.map((p) => p.category || 'Other'));
        setCategories(['All', ...categorySet]);

        // Fetch trending items
        const trendingSnapshot = await getDocs(collection(db, 'trendingItems'));
        const trending = { Fashion: [], Gadgets: [] };
        trendingSnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.category === 'Fashion' || data.category === 'Gadgets') {
            const product = allProducts.find((p) => p.id === data.productId);
            trending[data.category].push({
              id: doc.id,
              ...data,
              productName: product?.name || 'Unknown Product',
            });
          }
        });
        setTrendingItems(trending);
        setProducts(allProducts);
      } catch (err) {
        console.error('Error loading data:', err);
        toast.error('Failed to load products or trending items.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Add trending item
  const addTrendingItem = async (productId, category) => {
    if (trendingItems[category].length >= 10) {
      toast.error(`Cannot add more to trending ${category}. Maximum 10 items reached.`);
      return;
    }
    try {
      const trendingRef = doc(collection(db, 'trendingItems'));
      await setDoc(trendingRef, {
        productId,
        category,
        addedAt: new Date(),
      });
      const product = products.find((p) => p.id === productId);
      setTrendingItems({
        ...trendingItems,
        [category]: [
          ...trendingItems[category],
          { id: trendingRef.id, productId, productName: product.name },
        ],
      });
      toast.success(`Added to trending ${category}!`);
    } catch (err) {
      console.error('Error adding trending item:', err);
      toast.error('Failed to add trending item.');
    }
  };

  // Remove trending item
  const removeTrendingItem = async (trendingId, category) => {
    try {
      await deleteDoc(doc(db, 'trendingItems', trendingId));
      setTrendingItems({
        ...trendingItems,
        [category]: trendingItems[category].filter((item) => item.id !== trendingId),
      });
      toast.success('Removed from trending items!');
    } catch (err) {
      console.error('Error removing trending item:', err);
      toast.error('Failed to remove trending item.');
    }
  };

  // Filter products for search and category
  const filteredProducts = products.filter(
    (product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (categoryFilter === 'All' || product.category === categoryFilter)
  );

  if (loading) {
    return (
      <div className="py-4 xs:py-6">
        <div className="container mx-auto px-2 xs:px-4">
          <div className="bg-white rounded-lg shadow-sm p-4 xs:p-6 animate-pulse">
            <div className="h-6 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-200 rounded"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-4 xs:py-6">
      <div className="container mx-auto px-2 xs:px-4">
        <h1 className="text-xl xs:text-2xl font-bold text-gray-800 mb-4 xs:mb-6 flex items-center">
          <i className="bx bx-trending-up text-blue-600 mr-2 text-2xl"></i>
          Edit Trending Items
        </h1>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 xs:gap-4 mb-4 xs:mb-6">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              aria-label="Search products"
            />
            <i className="bx bx-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg"></i>
          </div>
          <div className="relative flex-1">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg bg-white shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all appearance-none"
              aria-label="Filter by category"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            <i className="bx bx-filter absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-lg"></i>
          </div>
        </div>

        {/* Trending Sections */}
        {['Fashion', 'Gadgets'].map((category) => (
          <div key={category} className="mb-6 xs:mb-8 bg-white rounded-lg shadow-sm">
            <div className="sticky top-0 bg-white z-10 p-4 xs:p-6 border-b border-gray-100">
              <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                <i className="bx bx-star text-blue-600 mr-2 text-xl"></i>
                Trending in {category}
              </h3>
            </div>
            <div className="p-4 xs:p-6">
              <div className="mb-4 xs:mb-6">
                <h4 className="text-sm font-medium text-gray-600 mb-2">Current Trending Products</h4>
                {trendingItems[category].length === 0 ? (
                  <p className="text-gray-500 text-sm flex items-center">
                    <i className="bx bx-list-ul mr-1 text-gray-400"></i>
                    No trending products selected for {category}.
                  </p>
                ) : (
                  <ul className="space-y-2 animate-fadeIn">
                    {trendingItems[category].map((item) => (
                      <li
                        key={item.id}
                        className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        <span className="text-sm text-gray-800">{item.productName}</span>
                        <button
                          onClick={() => removeTrendingItem(item.id, category)}
                          className="text-red-500 hover:text-red-600 transform hover:scale-110 transition-transform"
                          aria-label={`Remove ${item.productName} from trending ${category}`}
                        >
                          <i className="bx bx-trash text-lg"></i>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <h4 className="text-sm font-medium text-gray-600 mb-2">Add Products</h4>
              {filteredProducts.length === 0 ? (
                <p className="text-gray-500 text-sm flex items-center">
                  <i className="bx bx-search-alt-2 mr-1 text-gray-400"></i>
                  No products match your search or filter.
                </p>
              ) : (
                <ul className="space-y-2 max-h-80 overflow-y-auto animate-fadeIn">
                  {filteredProducts.map((product) => (
                    <li
                      key={product.id}
                      className="flex items-center justify-between p-2 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {product.imageUrls?.[0] && (
                          <img
                            src={product.imageUrls[0]}
                            alt={product.name}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <span className="text-sm text-gray-800">{product.name}</span>
                      </div>
                      <button
                        onClick={() => addTrendingItem(product.id, category)}
                        className={`text-blue-600 hover:text-blue-500 text-sm transform hover:scale-110 transition-transform ${
                          trendingItems[category].some((i) => i.productId === product.id)
                            ? 'opacity-50 cursor-not-allowed'
                            : ''
                        }`}
                        disabled={trendingItems[category].some((i) => i.productId === product.id)}
                        aria-label={`Add ${product.name} to trending ${category}`}
                      >
                        <i className="bx bx-plus text-lg"></i>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}