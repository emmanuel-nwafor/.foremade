import { useState, useEffect, useMemo, useCallback } from 'react';
import { db } from '../firebase';
import ProductList from '../components/product/ProductList';
import { collection, getDocs, query, where } from 'firebase/firestore';
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

  const shuffleArray = (array) => {
    let shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const q = query(collection(db, 'products'), where('status', '==', 'approved'));
        const querySnapshot = await getDocs(q);
        console.log('Total approved products fetched from Firestore:', querySnapshot.docs.length);
        const products = querySnapshot.docs
          .map((doc) => {
            const data = doc.data();

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

            let minPrice = data.price || 0;
            let maxPrice = data.price || 0;
            let hasVariants = Array.isArray(data.variants) && data.variants.length > 0;
            if (hasVariants) {
              const variantPrices = data.variants.map((v) => (v.price || 0));
              minPrice = Math.min(...variantPrices);
              maxPrice = Math.max(...variantPrices);
            }

            const totalStock = hasVariants
              ? data.variants.reduce((sum, variant) => sum + (variant.stock || 0), 0)
              : data.stock || 0;

            if (totalStock < 10) {
              console.warn(`Product ${doc.id} filtered out due to low stock:`, { name: data.name, totalStock });
              return null;
            }

            return {
              id: doc.id,
              name: data.name || 'Unknown Product',
              description: data.description || '',
              price: hasVariants ? minPrice : data.price || 0,
              minPrice: hasVariants ? minPrice : null,
              maxPrice: hasVariants ? maxPrice : null,
              stock: totalStock,
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
              status: data.status || 'pending',
              bumpExpiry: data.bumpExpiry || null,
            };
          })
          .filter((product) => product !== null && product.id);

        console.log('Fetched approved products with sufficient stock:', products);
        if (products.length === 0) {
          console.warn('No approved products with sufficient stock found.');
          setError('No approved products available at the moment.');
        }
        setInitialProducts(products);
        setFilteredProducts(shuffleArray(products));
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

  const handleFilterChange = useCallback(
    ({ priceRange, selectedCategories, sortOption, searchTerm, status }) => {
      let updatedProducts = [...initialProducts].filter((product) => product !== null);

      updatedProducts = updatedProducts.filter((product) => {
        const withinPriceRange =
          (product.minPrice !== null ? product.minPrice : product.price) >= priceRange[0] &&
          (product.maxPrice !== null ? product.maxPrice : product.price) <= priceRange[1];
        return withinPriceRange;
      });

      if (selectedCategories.length > 0) {
        updatedProducts = updatedProducts.filter((product) =>
          selectedCategories.includes(product.categoryId)
        );
      }

      if (searchTerm) {
        updatedProducts = updatedProducts.filter((product) =>
          product.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (sortOption === 'price-low-high') {
        updatedProducts.sort((a, b) => (a.minPrice || a.price) - (b.minPrice || b.price));
      } else if (sortOption === 'price-high-low') {
        updatedProducts.sort((a, b) => (b.minPrice || b.price) - (a.minPrice || a.price));
      } else if (sortOption === 'alpha-asc') {
        updatedProducts.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortOption === 'alpha-desc') {
        updatedProducts.sort((a, b) => b.name.localeCompare(b.name));
      } else {
        updatedProducts.sort((a, b) => {
          const aBump = a.bumpExpiry ? new Date(a.bumpExpiry) : null;
          const bBump = b.bumpExpiry ? new Date(b.bumpExpiry) : null;
          if (aBump && bBump) return bBump - aBump;
          if (aBump) return -1;
          if (bBump) return 1;
          return 0;
        });
      }

      console.log('Updated filtered products:', updatedProducts);
      setFilteredProducts(shuffleArray(updatedProducts));
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
        <h2 className="text-2xl font-bold mb-4 m-4">Sellers You Love!</h2>
      </div>
      <div className="flex flex-col md:flex-row gap-4">
        <div className="w-full rounded-lg border md:w-1/4">
          <ProductFilter onFilterChange={handleFilterChange} categoryMap={categoryMap} />
        </div>
        <div className="w-full rounded-lg border">
          <ProductList products={filteredProducts} dailyDeals={dailyDeals} />
        </div>
      </div>
    </div>
  );
};

export default Products;