import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '/src/firebase';
import ProductCard from '/src/components/home/ProductCard';
import CategoryBanner from '/src/components/category/CategoryBanner';

// Sample category structure for Hair, Nails & Accessories
const CATEGORY_STRUCTURE = {
  "Hair, Nails & Accessories": {
    bannerImage: "/images/banners/hair-nails-banner.jpg",
    subcategories: [
      {
        name: "Hair Care & Styling",
        subSubcategories: [
          "Shampoos & Conditioners",
          "Hair Oils & Serums",
          "Hair Creams & Lotions",
          "Leave-in Treatments & Masks",
          "Hair Relaxers & Texturizers",
          "Hair Colour & Dyes"
        ]
      },
      {
        name: "Hair Extensions & Wigs",
        subSubcategories: [
          "Human Hair Bundles",
          "Synthetic Wigs",
          "Lace Front Wigs",
          "Closures & Frontals",
          "Braiding Hair",
          "Clip-ins & Tape-ins"
        ]
      },
      {
        name: "💈 Hair Styling Tools",
        subSubcategories: [
          "Hair Dryers",
          "Straighteners & Curlers",
          "Hot Combs & Brushes",
          "Trimmers & Clippers",
          "Nail Art & Accessories"
        ]
      },
      {
        name: "Nail Products",
        subSubcategories: [
          "Nail Polish & Gels",
          "Acrylic & Press-on Nails",
          "Nail Art & Accessories",
          "Cuticle Oils & Nail Treatments",
          "Manicure & Pedicure Kits"
        ]
      },
      {
        name: "🧴 Salon & Beauty Accessories",
        subSubcategories: [
          "Salon Aprons & Capes",
          "Spray Bottles & Applicators",
          "Mixing Bowls & Brushes",
          "Nail Files & Buffers",
          "Tool Sterilizers & Storage"
        ]
      },
      {
        name: "Hair Creams & Lotions",
        subSubcategories: []
      }
    ]
  }
};

export default function CategoryPage() {
  const { categoryName } = useParams();
  const [activeSubcategory, setActiveSubcategory] = useState('');
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const categoryData = CATEGORY_STRUCTURE[categoryName];
  const firestoreCategory = categoryName?.toLowerCase();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const q = query(
          collection(db, 'products'), 
          where('category', '==', firestoreCategory)
        );
        
        const querySnapshot = await getDocs(q);
        const productsData = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          // Skip products with low stock or invalid images
          if (data.stock >= 10 && data.imageUrl && data.imageUrl.startsWith('https://')) {
            productsData.push({
              id: doc.id,
              ...data,
              imageUrl: Array.isArray(data.imageUrls) && data.imageUrls[0] 
                ? data.imageUrls[0] 
                : data.imageUrl
            });
          }
        });
        
        setProducts(productsData);
        setLoading(false);
      } catch (err) {
        console.error(`Error loading ${categoryName} products:`, err);
        setError(`Failed to load ${categoryName} products.`);
        setLoading(false);
      }
    };

    if (categoryName) fetchProducts();
  }, [categoryName, firestoreCategory]);

  // Set first subcategory as active when data loads
  useEffect(() => {
    if (categoryData && categoryData.subcategories.length > 0 && !activeSubcategory) {
      setActiveSubcategory(categoryData.subcategories[0].name);
    }
  }, [categoryData, activeSubcategory]);

  // Filter products by active subcategory
  useEffect(() => {
    if (activeSubcategory && products.length > 0) {
      const filtered = products.filter(product => 
        product.subcategory === activeSubcategory
      );
      setFilteredProducts(filtered);
    }
  }, [activeSubcategory, products]);

  if (!categoryData) {
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
    <div className="bg-white min-h-screen">
      {/* Category Banner */}
      <CategoryBanner 
        title={categoryName} 
        imageUrl={categoryData.bannerImage} 
      />
      
      {/* Subcategory Tabs */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex overflow-x-auto pb-2 mb-6 -mx-4 px-4 border-b">
          {categoryData.subcategories.map((subcategory) => (
            <button
              key={subcategory.name}
              className={`px-4 py-2 font-medium whitespace-nowrap ${
                activeSubcategory === subcategory.name
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveSubcategory(subcategory.name)}
            >
              {subcategory.name}
            </button>
          ))}
        </div>
        
        {/* Sub-Subcategories Sections */}
        {activeSubcategory && (
          <div>
            {categoryData.subcategories
              .find(sc => sc.name === activeSubcategory)
              ?.subSubcategories?.length > 0 ? (
              <div className="mb-8">
                <h2 className="text-xl font-bold mb-4">Shop by Type</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                  {categoryData.subcategories
                    .find(sc => sc.name === activeSubcategory)
                    .subSubcategories.map((subSubcategory) => (
                      <Link
                        key={subSubcategory}
                        to={`/products?category=${categoryName}&subcategory=${activeSubcategory}&subSubcategory=${subSubcategory}`}
                        className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors"
                      >
                        <div className="text-gray-800 font-medium">{subSubcategory}</div>
                      </Link>
                    ))}
                </div>
              </div>
            ) : null}

            {/* Products Grid */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">
                  {activeSubcategory} Products
                </h2>
                <Link 
                  to={`/products?category=${categoryName}&subcategory=${activeSubcategory}`}
                  className="text-blue-600 hover:underline"
                >
                  See All
                </Link>
              </div>
              
              {loading ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[...Array(5)].map((_, idx) => (
                    <div key={idx} className="bg-gray-200 rounded-lg aspect-square animate-pulse" />
                  ))}
                </div>
              ) : error ? (
                <div className="text-center py-8 text-red-600">{error}</div>
              ) : filteredProducts.length === 0 ? (
                <div className="text-center py-8 text-gray-600">
                  No products found in {activeSubcategory}
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredProducts.slice(0, 10).map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
