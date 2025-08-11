import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebase';
import ProductList from '../components/product/ProductList';
import { collection, getDocs } from 'firebase/firestore';
import ProductFilter from '../components/product/ProductFilter';

const Products = () => {
  const [initialProducts, setInitialProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [dailyDeals, setDailyDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
        console.log('Total products fetched from Firestore:', querySnapshot.docs.length);
        const products = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();
            const productStatus = data.status || 'pending';
            if (productStatus !== 'approved') {
              console.log(`Product ${doc.id} not approved, skipping (status: ${productStatus})`, data);
              return null;
            }

            let imageUrl = null;
            if (Array.isArray(data.variants) && data.variants.length > 0 && data.variants[0]?.imageUrls) {
              const firstValidUrl = data.variants[0].imageUrls.find((url) => typeof url === 'string' && url.trim() && url.startsWith('https://'));
              imageUrl = firstValidUrl || (data.variants[0].imageUrls[0] || null);
              console.log(`Variant image check for ${doc.id}:`, { firstValidUrl, allUrls: data.variants[0].imageUrls });
            } else if (Array.isArray(data.imageUrls) && data.imageUrls.length > 0) {
              const firstValidUrl = data.imageUrls.find((url) => typeof url === 'string' && url.trim() && url.startsWith('https://'));
              imageUrl = firstValidUrl || data.imageUrls[0] || null;
              console.log(`Product image check for ${doc.id}:`, { firstValidUrl, allUrls: data.imageUrls });
            } else if (data.imageUrl && typeof data.imageUrl === 'string' && data.imageUrl.startsWith('https://')) {
              imageUrl = data.imageUrl;
              console.log(`Single imageUrl check for ${doc.id}:`, data.imageUrl);
            } else {
              console.warn(`Product ${doc.id} has no valid imageUrl or imageUrls`, {
                id: doc.id,
                name: data.name,
                imageUrl: data.imageUrl,
                imageUrls: data.imageUrls,
                variants: data.variants,
              });
            }

            // Calculate price range for products with variants
            let minPrice = data.price || 0;
            let maxPrice = data.price || 0;
            let hasVariants = Array.isArray(data.variants) && data.variants.length > 0;
            if (hasVariants) {
              const variantPrices = data.variants.map((v) => (v.price || 0));
              minPrice = Math.min(...variantPrices);
              maxPrice = Math.max(...variantPrices);
            }

            return {
              id: doc.id,
              name: data.name || 'Unknown Product',
              description: data.description || '',
              price: hasVariants ? minPrice : data.price || 0, // Use minPrice for variants, else base price
              minPrice: hasVariants ? minPrice : null,
              maxPrice: hasVariants ? maxPrice : null,
              stock: data.stock || 0,
              category: data.category || 'uncategorized',
              categoryId: categoryMap[data.category?.toLowerCase()] || 11,
              colors: data.colors || [],
              sizes: data.sizes || [],
              condition: data.condition || 'New',
              imageUrl,
              variants: data.variants || [],
              sellerId: data.sellerId || '',
              seller: data.seller || { name: data.sellerName || 'Unknown Seller', id: data.sellerId || '' },
              rating: data.rating || 0,
              reviews: data.reviews || [],
              status: productStatus,
              bumpExpiry: data.bumpExpiry || null,
            };
          })
          .filter((product) => product !== null && product.id);

        console.log('Fetched approved products from Firestore:', products);
        if (products.length === 0) {
          console.warn('No approved products found in Firestore. Check if products have status: "approved".');
          setError('No approved products available at the moment.');
        }
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
    getDocs(collection(db, 'dailyDeals')).then((snapshot) => {
      setDailyDeals(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
  }, [categoryMap]);

  useEffect(() => {
    console.log('Filtered products passed to ProductList:', filteredProducts);
  }, [filteredProducts]);

  const handleFilterChange = useCallback(
    ({ priceRange, selectedCategories, sortOption, searchTerm }) => {
      let updatedProducts = [...initialProducts].filter((product) => product !== null);

      updatedProducts.sort((a, b) => {
        const aBump = a.bumpExpiry ? new Date(a.bumpExpiry) : null;
        const bBump = b.bumpExpiry ? new Date(b.bumpExpiry) : null;
        if (aBump && bBump) return bBump - aBump;
        if (aBump) return -1;
        if (bBump) return 1;
        return 0;
      });

      updatedProducts = updatedProducts.filter((product) => {
        const withinPriceRange =
          (product.minPrice !== null ? product.minPrice : product.price) >= priceRange[0] &&
          (product.maxPrice !== null ? product.maxPrice : product.price) <= priceRange[1];
        const inSelectedCategories =
          selectedCategories.length === 0 || selectedCategories.includes(product.categoryId);
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
        return withinPriceRange && inSelectedCategories && matchesSearch;
      });

      if (sortOption === 'price-low-high') {
        updatedProducts.sort((a, b) => (a.minPrice || a.price) - (b.minPrice || b.price));
      } else if (sortOption === 'price-high-low') {
        updatedProducts.sort((a, b) => (b.minPrice || b.price) - (a.minPrice || a.price));
      } else if (sortOption === 'alpha-asc') {
        updatedProducts.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortOption === 'alpha-desc') {
        updatedProducts.sort((a, b) => b.name.localeCompare(a.name));
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
          <ProductList products={filteredProducts} loading={loading} dailyDeals={dailyDeals} />
        </div>
      </div>
    </div>
  );
};

export default Products;