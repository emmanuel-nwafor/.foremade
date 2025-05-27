import { useState, useEffect, useMemo, useCallback } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ProductList from '../components/product/ProductList';
import ProductFilter from '../components/product/ProductFilter';

const Products = () => {
  const [initialProducts, setInitialProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Map Firestore category to categoryId for filtering
  const categoryMap = useMemo(
    () => ({
      'tablet & phones': 1,
      'health & beauty': 2,
      'foremade fashion': 3,
      'electronics': 4,
      'baby products': 5,
      'computers & accessories': 6,
      'game & fun': 7,
      'drinks & categories': 8,
      'home & kitchen': 9,
      'smart watches': 10,
      'uncategorized': 11,
    }),
    []
  );

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const querySnapshot = await getDocs(collection(db, 'products'));
        const products = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            // Normalize imageUrl
            let imageUrl;
            if (data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('https://')) {
              imageUrl = data.imageUrl;
            } else if (
              Array.isArray(data.imageUrls) &&
              data.imageUrls.length > 0 &&
              typeof data.imageUrls[0] === 'string' &&
              data.imageUrls[0].startsWith('https://')
            ) {
              imageUrl = data.imageUrls[0];
            } else {
              imageUrl = null; // Trigger shimmer in ProductCard
              console.warn(`Product ${doc.id} has no valid imageUrl or imageUrls`, {
                id: doc.id,
                name: data.name,
                imageUrl: data.imageUrl,
                imageUrls: data.imageUrls,
              });
            }
            // Validate critical fields with defaults
            return {
              id: doc.id,
              name: data.name || 'Unknown Product',
              description: data.description || '',
              price: data.price || 0,
              stock: data.stock || 0,
              category: data.category || 'uncategorized',
              categoryId: categoryMap[data.category?.toLowerCase()] || 11,
              colors: data.colors || [],
              sizes: data.sizes || [],
              condition: data.condition || 'New',
              imageUrl,
              sellerId: data.sellerId || '',
              seller: data.seller || { name: data.sellerName || 'Unknown Seller', id: data.sellerId || '' },
              rating: data.rating || 0,
              reviews: data.reviews || [],
            };
          })
          .filter((product) => {
            if (!product.id) {
              console.error('Filtered out product with invalid id:', product);
              return false;
            }
            return true;
          });

        console.log('Fetched products from Firestore:', products);
        setInitialProducts(products);
        setFilteredProducts(products);
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Failed to load products. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryMap]);

  useEffect(() => {
    console.log('Filtered products passed to ProductList:', filteredProducts);
  }, [filteredProducts]);

  const handleFilterChange = useCallback(
    ({ priceRange, selectedCategories, sortOption, searchTerm }) => {
      let updatedProducts = [...initialProducts].filter((product) => product !== null);

      updatedProducts = updatedProducts.filter((product) => {
        const withinPriceRange = product.price >= priceRange[0] && product.price <= priceRange[1];
        const inSelectedCategories =
          selectedCategories.length === 0 || selectedCategories.includes(product.categoryId);
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        return withinPriceRange && inSelectedCategories && matchesSearch;
      });

      // Apply sorting
      if (sortOption === 'price-low-high') {
        updatedProducts.sort((a, b) => a.price - b.price);
      } else if (sortOption === 'price-high-low') {
        updatedProducts.sort((a, b) => b.price - b.price);
      } else if (sortOption === 'alpha-asc') {
        updatedProducts.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortOption === 'alpha-desc') {
        updatedProducts.sort((a, b) => b.name.localeCompare(b.name));
      }

      console.log('Updated filtered products:', updatedProducts);
      setFilteredProducts(updatedProducts);
    },
    [initialProducts]
  );

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <p className="text-red-600 text-center">{error}</p>
      </div>
    );
  }

  return (
    <div className="mb-10 rounded-lg mx-auto p-3">
      <div className="flex-col">
        <h2 className="text-2xl font-bold mb-4 m-4">Shop All Products</h2>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full rounded-lg border md:w-1/4">
          <ProductFilter onFilterChange={handleFilterChange} />
        </div>
        <div className="w-full rounded-lg border">
          <ProductList products={filteredProducts} loading={loading} />
        </div>
      </div>
    </div>
  );
};

export default Products;