import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { db } from '/src/firebase';
import { onSnapshot, collection, doc, getDoc } from 'firebase/firestore';
import { toast } from 'react-toastify';

// Helper to slugify category names
const slugify = (name) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

// Helper to get category path
const getCategoryPath = (category) => `/category/${slugify(category)}`;

// Fallback images
const fallbackImages = [
  "https://banner2.cleanpng.com/20180406/wow/kisspng-shoe-jumpman-sneakers-air-jordan-teal-jordan-5ac6ff9c2fcfe2.7959868915229910041959.jpg",
  "https://pngimg.com/uploads/dress_shirt/dress_shirt_PNG8088.png",
  "https://banner2.cleanpng.com/20240415/cv/transparent-apple-logo-person-holding-iphone-11-pro-max661df755177ea1.73458741.webp",
  "https://banner2.cleanpng.com/lnd/20240424/uxz/transparent-rainbow-open-laptop-with-rainbow-gradient-background-image662945f170dc49.58708681.webp",
  "https://banner2.cleanpng.com/20180202/lie/av2ldq3r4.webp",
  "https://banner2.cleanpng.com/lnd/20240424/jfa/aav33rgh3.webp",
  "https://banner2.cleanpng.com/20180809/atv/kisspng-ferm-living-asymmetric-cutting-board-ferm-living-b-5b6c3d78edff15.1714747115338202809749.jpg",
  "https://banner2.cleanpng.com/20180131/jgw/av1z4nree.webp"
];

const categoryColors = [
  'from-red-500/10 to-red-500/5',
  'from-blue-500/10 to-blue-500/5',
  'from-green-500/10 to-green-500/5',
  'from-yellow-500/10 to-yellow-500/5',
  'from-purple-500/10 to-purple-500/5',
  'from-pink-500/10 to-pink-500/5',
  'from-indigo-500/10 to-indigo-500/5',
  'from-orange-500/10 to-orange-500/5'
];

const categoryHoverColors = [
  'hover:bg-red-500/10',
  'hover:bg-blue-500/10',
  'hover:bg-green-500/10',
  'hover:bg-yellow-500/10',
  'hover:bg-purple-500/10',
  'hover:bg-pink-500/10',
  'hover:bg-indigo-500/10',
  'hover:bg-orange-500/10'
];

const LoadingSkeleton = () => (
  <div className="text-center group">
    <div className="rounded-lg overflow-hidden relative bg-gradient-to-b from-gray-200 to-gray-100 h-20 w-full flex items-center justify-center animate-pulse">
      <div className="w-12 h-12 bg-gray-300 rounded-full"></div>
    </div>
    <div className="mt-2 h-4 w-16 bg-gray-200 rounded animate-pulse mx-auto"></div>
  </div>
);

const CategoryGrid = () => {
  const [categories, setCategories] = useState([]);
  const [icons, setIcons] = useState({});
  const [loading, setLoading] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'categories'), async (snapshot) => {
      const catList = snapshot.docs.map((doc) => doc.id);

      try {
        const iconRef = doc(db, 'settings', 'categoryIcons');
        const iconSnap = await getDoc(iconRef);
        const iconData = iconSnap.exists() ? iconSnap.data().icons || {} : {};

        setCategories(catList);
        setIcons(iconData);
      } catch (err) {
        console.error('Error loading icons:', err);
        toast.error('Failed to load category icons');
      } finally {
        setLoading(false);
      }
    }, (err) => {
      console.error('Error fetching categories:', err);
      toast.error('Failed to load categories');
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Shop by Category</h2>
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {loading
          ? Array.from({ length: 8 }).map((_, i) => <LoadingSkeleton key={i} />)
          : categories.slice(0, 8).map((name, index) => {
              const imageUrl = icons[name] || fallbackImages[index % fallbackImages.length] || "https://via.placeholder.com/48";

              return (
                <Link
                  key={name}
                  to={getCategoryPath(name)}
                  className="text-center group"
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                >
                  <motion.div
                    className={`rounded-lg overflow-hidden relative bg-gradient-to-b ${categoryColors[index % categoryColors.length]} ${categoryHoverColors[index % categoryHoverColors.length]} transition-all duration-300 h-20 w-full flex items-center justify-center group-hover:shadow-md`}
                    initial={{ y: 0 }}
                    animate={{
                      y: hoveredIndex === index ? -5 : 0,
                      scale: hoveredIndex === index ? 1.05 : 1
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  >
                    <motion.img
                      src={imageUrl}
                      alt={name}
                      className="w-12 h-12 object-contain"
                      animate={{
                        scale: hoveredIndex === index ? 1.1 : 1,
                        rotate: hoveredIndex === index ? 5 : 0
                      }}
                      transition={{ type: "spring", stiffness: 200, damping: 10 }}
                    />
                    {/* Decorative circles */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse"></div>
                  </motion.div>
                  <motion.p
                    className="text-xs md:text-sm text-gray-800 mt-2 font-medium"
                    animate={{
                      fontWeight: hoveredIndex === index ? 600 : 500,
                      color: hoveredIndex === index ? "#3B82F6" : "#1F2937"
                    }}
                  >
                    {name}
                  </motion.p>
                </Link>
              );
            })}
      </div>
    </div>
  );
};

export default CategoryGrid;