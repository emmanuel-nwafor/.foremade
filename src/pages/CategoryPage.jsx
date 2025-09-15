import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, onSnapshot, getDocs, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';
import CategoryBanner from '/src/components/category/CategoryBanner';

// Banner mapping for desktop and mobile
const categoryBanners = {
  'Transport': {
    desktop: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1750485716/auto_big_k4jp8e.jpg',
    mobile:  'https://res.cloudinary.com/dvhogp27g/image/upload/v1750485719/auto_small_fvr8do.jpg',
  },
  'Television': {
    desktop: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1750485684/screens_big_stuvgq.jpg',
    mobile:  'https://res.cloudinary.com/dvhogp27g/image/upload/v1750485713/screens_small_wzvifu.jpg',
  },
  'Scent': {
    desktop: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1750485702/perfume_big_mzpohm.jpg',
    mobile:  'https://res.cloudinary.com/dvhogp27g/image/upload/v1750485684/perfume_small_xhsxan.jpg',
  },
  'Home & Living': {
    desktop: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1750485706/garden_big_p9bfjz.jpg',
    mobile:  'https://res.cloudinary.com/dvhogp27g/image/upload/v1750485710/garden_small_ruvatt.jpg',
  },
  'Photography': {
    desktop: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1750485711/camera_big_icewmf.jpg',
    mobile:  'https://res.cloudinary.com/dvhogp27g/image/upload/v1750485703/camera_small_dv0k55.jpg',
  },
  'Game & Console': {
    desktop: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1750485685/games_big_tyfg2v.jpg',
    mobile:  'https://res.cloudinary.com/dvhogp27g/image/upload/v1750485698/games_small_s2hvrp.jpg',
  },
  'Beverages': {
    desktop: 'https://res.cloudinary.com/dvhogp27g/image/upload/v1750485685/drink_big_afnisz.jpg',
    mobile:  'https://res.cloudinary.com/dvhogp27g/image/upload/v1750485685/drink_small_tsaqxo.jpg',
  },
};

// Responsive hook
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return isMobile;
}

// Fallback image for categories without a provided banner
const fallbackBanner = 'https://cdn.pixabay.com/photo/2018/08/29/17/07/ecommerce-3640321_640.jpg';

function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function findCategoryBySlug(slug, categories) {
  return Object.keys(categories).find(
    name => slugify(name) === slug
  );
}

export default function CategoryPage() {
  const { categoryName } = useParams();
  const [customSubcategories, setCustomSubcategories] = useState({});
  const [bannerDesktop, setBannerDesktop] = useState(null);
  const [bannerMobile, setBannerMobile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [products, setProducts] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const isMobile = useIsMobile();

  // Fetch subcategories (real-time)
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'customSubcategories'), (snapshot) => {
      const subcatData = {};
      snapshot.forEach((doc) => {
        subcatData[doc.id] = doc.data().subcategories || [];
      });
      setCustomSubcategories(subcatData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Find the real category name from the slug
  const realCategoryName = findCategoryBySlug(categoryName, customSubcategories);
  const subcategories = realCategoryName ? customSubcategories[realCategoryName] : null;

  // Fetch banners from Firestore with fallback to categoryBanners
  useEffect(() => {
    if (realCategoryName) {
      const fetchBanners = async () => {
        const catDocRef = doc(db, 'categories', realCategoryName);
        const catSnap = await getDoc(catDocRef);
        if (catSnap.exists()) {
          const data = catSnap.data();
          setBannerDesktop(data.bannerDesktop || (categoryBanners[realCategoryName]?.desktop || fallbackBanner));
          setBannerMobile(data.bannerMobile || (categoryBanners[realCategoryName]?.mobile || fallbackBanner));
        } else {
          // Fallback to categoryBanners if Firestore doc doesn't exist
          setBannerDesktop(categoryBanners[realCategoryName]?.desktop || fallbackBanner);
          setBannerMobile(categoryBanners[realCategoryName]?.mobile || fallbackBanner);
        }
      };
      fetchBanners();
    }
  }, [realCategoryName]);

  const bannerImg = isMobile ? bannerMobile : bannerDesktop;
  const showTitle = !bannerDesktop; // Adjusted to check if custom banner exists

  // Set first subcategory as active when data loads or category changes
  useEffect(() => {
    if (subcategories && subcategories.length > 0) {
      setActiveSubcategory(subcategories[0]);
    }
  }, [subcategories]);

  // Fetch products for the active subcategory
  useEffect(() => {
    const fetchProducts = async () => {
      if (!realCategoryName || !activeSubcategory) return;
      setProductsLoading(true);
      try {
        const q = query(
          collection(db, 'products'),
          where('category', '==', realCategoryName.toLowerCase()),
          where('subcategory', '==', activeSubcategory)
        );
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setProducts(items);
      } catch (err) {
        setProducts([]);
      } finally {
        setProductsLoading(false);
      }
    };
    fetchProducts();
  }, [realCategoryName, activeSubcategory]);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!subcategories) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Category not found</h1>
          <p className="mt-4">The category "{categoryName}" doesn't exist.</p>
          <Link to="/" className="mt-6 inline-block text-blue-600 hover:underline">
            Return to homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen mb-14">
      {/* Category Banner */}
      <CategoryBanner title={showTitle ? realCategoryName : ''} imageUrl={bannerImg} />

      {/* Subcategory Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex overflow-x-auto pb-2 mb-6 -mx-4 px-4 border-b">
          {subcategories.map((subcategory) => (
            <button
              key={subcategory}
              className={`px-4 py-2 font-medium whitespace-nowrap ${
                activeSubcategory === subcategory
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveSubcategory(subcategory)}
            >
              {subcategory}
            </button>
          ))}
        </div>

        {/* Products for active subcategory */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {activeSubcategory} Products
            </h2>
            <Link 
              to={`/products?category=${encodeURIComponent(realCategoryName)}&subcategory=${encodeURIComponent(activeSubcategory)}`}
              className="text-blue-600 hover:underline"
            >
              See All
            </Link>
          </div>
          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, idx) => (
                <div key={idx} className="bg-gray-200 rounded-lg aspect-square animate-pulse" />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-8 text-gray-600">
              No products found in {activeSubcategory}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}