const SkeletonLoader = ({ type = 'default', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'featuredProduct':
      case 'recommended':
        // Used in ProductList, RecommendedForYou - mimics a product card grid
        return (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {[...Array(count)].map((_, index) => (
              <div key={index} className="w-full h-64 bg-gray-200 rounded-lg">
                <div className="w-full h-48 bg-gray-300 rounded-t-lg"></div>
                <div className="p-2">
                  <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'productDetail':
        // Used in Product - mimics a product detail layout including Similar Products
        return (
          <div className="animate-pulse">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              <div className="lg:col-span-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Media Section */}
                  <div className="order-1">
                    <div className="w-full h-96 bg-gray-200 rounded-lg"></div>
                    <div className="flex gap-2 mt-4 overflow-x-auto scrollbar-hide">
                      {[...Array(4)].map((_, index) => (
                        <div key={index} className="w-16 h-16 bg-gray-300 rounded-lg"></div>
                      ))}
                    </div>
                  </div>

                  {/* Product Info Section */}
                  <div className="order-2 space-y-4">
                    <div className="product-info-card">
                      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {[...Array(1)].map((_, index) => (
                          <div key={index} className="h-6 bg-gray-200 rounded w-1/4"></div>
                        ))}
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="price-section">
                        <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {[...Array(1)].map((_, index) => (
                          <div key={index} className="h-6 bg-gray-200 rounded w-1/5"></div>
                        ))}
                      </div>
                      <div className="h-10 bg-gray-200 rounded w-1/2 mb-4"></div>
                      <div className="h-10 bg-gray-200 rounded w-1/3 mb-4"></div>
                      <div className="h-10 bg-gray-200 rounded w-2/3 mb-4"></div>
                      <div className="flex gap-3">
                        <div className="h-12 bg-gray-200 rounded w-2/3"></div>
                        <div className="h-12 bg-gray-200 rounded w-1/6"></div>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="order-3 md:order-2 lg:order-3 product-info-card mt-6">
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  </div>

                  {/* Reviews */}
                  <div className="order-4 lg:order-5 product-info-card" style={{ marginBottom: '2rem' }}>
                    <div className="h-6 bg-gray-200 rounded w-1/4 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-16 bg-gray-200 rounded w-full mb-2"></div>
                  </div>
                </div>
              </div>

              {/* Similar Products and Recent Searches Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-4 space-y-6">
                  {/* Similar Products */}
                  <div className="product-info-card">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-4">
                      {[...Array(4)].map((_, index) => (
                        <div key={index} className="h-20 bg-gray-200 rounded-lg flex">
                          <div className="w-16 h-16 bg-gray-300 rounded-lg mr-2"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recent Searches */}
                  <div className="product-info-card">
                    <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                    <div className="space-y-4">
                      {[...Array(3)].map((_, index) => (
                        <div key={index} className="h-16 bg-gray-200 rounded-lg flex">
                          <div className="w-12 h-12 bg-gray-300 rounded-lg mr-2"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                            <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'categories':
        // Used in Category - mimics category cards
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 animate-pulse">
            <div className="sm:col-span-2 h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-40 bg-gray-200 rounded-lg"></div>
            <div className="h-40 bg-gray-200 rounded-lg max-md:hidden"></div>
            <div className="h-40 bg-gray-200 rounded-lg max-md:hidden"></div>
          </div>
        );

      default:
        // Used in TopStores - mimics a store cards
        return (
          <div className="w-80 sm:w-full h-40 bg-gray-200 rounded-lg animate-pulse">
            <div className="p-4">
              <div className="h-5 bg-gray-300 rounded w-1/2 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="flex gap-2">
                <div className="w-20 h-20 bg-gray-300 rounded-md"></div>
                <div className="w-20 h-20 bg-gray-300 rounded-md"></div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={type === 'default' ? 'flex gap-4 overflow-x-auto' : ''}>
      {[...Array(type === 'featuredProduct' || type === 'recommended' || type === 'productDetail' || type === 'categories' ? 1 : count)].map((_, index) => (
        <div key={index} className={type === 'default' ? 'flex-shrink-0' : ''}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;