import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const CategoryGrid = () => {
  const categories = [
    { 
      name: 'Shoes', 
      route: '/pages/Shoes', 
      color: 'from-red-500/10 to-red-500/5', 
      hoverColor: 'hover:bg-red-500/10',
      image: 'https://banner2.cleanpng.com/20180406/wow/kisspng-shoe-jumpman-sneakers-air-jordan-teal-jordan-5ac6ff9c2fcfe2.7959868915229910041959.jpg'
    },
    { 
      name: 'Fashion', 
      route: '/pages/Fashion', 
      color: 'from-blue-500/10 to-blue-500/5', 
      hoverColor: 'hover:bg-blue-500/10',
      image: 'https://pngimg.com/uploads/dress_shirt/dress_shirt_PNG8088.png'
    },
    { 
      name: 'Phones', 
      route: '/tablet-phones', // TabletsPhones page
      color: 'from-green-500/10 to-green-500/5', 
      hoverColor: 'hover:bg-green-500/10',
      image: 'https://banner2.cleanpng.com/20240415/cv/transparent-apple-logo-person-holding-iphone-11-pro-max661df755177ea1.73458741.webp'
    },
    { 
      name: 'Laptops', 
      route: '/computers-accessories', // ComputerAccessories page
      color: 'from-yellow-500/10 to-yellow-500/5', 
      hoverColor: 'hover:bg-yellow-500/10',
      image: 'https://banner2.cleanpng.com/lnd/20240424/uxz/transparent-rainbow-open-laptop-with-rainbow-gradient-background-image662945f170dc49.58708681.webp'
    },
    { 
      name: 'Watches', 
      route: '/smart-watches', // SmartWatches page
      color: 'from-purple-500/10 to-purple-500/5', 
      hoverColor: 'hover:bg-purple-500/10',
      image: 'https://banner2.cleanpng.com/20180202/lie/av2ldq3r4.webp'
    },
    { 
      name: 'Gaming', 
      route: '/pages/GamesAndFun', // Special case
      color: 'from-pink-500/10 to-pink-500/5', 
      hoverColor: 'hover:bg-pink-500/10',
      image: 'https://banner2.cleanpng.com/lnd/20240424/jfa/aav33rgh3.webp'
    },
    { 
      name: 'Kitchen', 
      route: '/pages/HomeAndKitchen', // Special case
      color: 'from-indigo-500/10 to-indigo-500/5', 
      hoverColor: 'hover:bg-indigo-500/10',
      image: 'https://banner2.cleanpng.com/20180809/atv/kisspng-ferm-living-asymmetric-cutting-board-ferm-living-b-5b6c3d78edff15.1714747115338202809749.jpg'
    },
    { 
      name: 'Electronics', 
      route: '/electronics', // Electronics page
      color: 'from-orange-500/10 to-orange-500/5', 
      hoverColor: 'hover:bg-orange-500/10',
      image: 'https://banner2.cleanpng.com/20180131/jgw/av1z4nree.webp'
    },
  ];
  
  // Track which category is being hovered
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className="container mx-auto px-4 py-6">
      <h2 className="text-lg md:text-xl font-bold text-gray-800 mb-4">Shop by Category</h2>
      <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
        {categories.map((category, index) => (
          <Link 
            key={index} 
            to={category.route} 
            className="text-center group"
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            <motion.div 
              className={`rounded-lg overflow-hidden relative bg-gradient-to-b ${category.color} ${category.hoverColor} transition-all duration-300 h-20 w-full flex items-center justify-center group-hover:shadow-md`}
              initial={{ y: 0 }}
              animate={{ 
                y: hoveredIndex === index ? -5 : 0,
                scale: hoveredIndex === index ? 1.05 : 1
              }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <motion.img
                src={category.image}
                alt={category.name}
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
              {category.name}
            </motion.p>
          </Link>
        ))}
      </div>
    </div>
  );
};

export default CategoryGrid;