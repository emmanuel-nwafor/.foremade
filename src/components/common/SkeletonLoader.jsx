const SkeletonLoader = ({ type = 'default', count = 1 }) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'featuredProduct':
      case 'recommended':
        // Used in ProductList, RecommendedForYou - mimics a product card grid
        return (
          <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 xs:gap-4 sm:gap-5 lg:gap-6 animate-pulse px-2 sm:px-4">
            {[...Array(count)].map((_, index) => (
              <div
                key={index}
                className="w-full h-56 xs:h-60 sm:h-64 md:h-72 lg:h-80 bg-gray-200 rounded-lg"
              >
                <div className="w-full h-40 xs:h-44 sm:h-48 md:h-52 lg:h-56 bg-gray-300 rounded-t-lg"></div>
                <div className="p-2 sm:p-3">
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
          <div className="animate-pulse px-2 sm:px-4">
            {/* Main Product Section */}
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6 lg:gap-8">
              <div className="w-full md:w-3/4">
                <div className="flex flex-col md:flex-row gap-4 sm:gap-6">
                  <div className="w-full md:w-1/2">
                    <div className="w-full h-64 xs:h-72 sm:h-80 md:h-96 lg:h-[450px] bg-gray-200 rounded-lg"></div>
                  </div>
                  <div className="w-full md:w-1/2">
                    <div className="h-6 xs:h-7 sm:h-8 bg-gray-200 rounded w-3/4 mb-3 sm:mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3 sm:mb-4"></div>
                    <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/4 mb-3 sm:mb-4"></div>
                    <div className="h-12 sm:h-16 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
                {/* Description Placeholder */}
                <div className="mt-6 sm:mt-8">
                  <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                </div>
                {/* Reviews Placeholder */}
                <div className="mt-6 sm:mt-8">
                  <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
              {/* Similar Products (Desktop) */}
              <div className="w-full md:w-1/4 max-md:hidden">
                <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="flex flex-col gap-4 md:border-l md:pl-4">
                  {[...Array(4)].map((_, index) => (
                    <div
                      key={index}
                      className="w-full h-56 sm:h-60 md:h-64 lg:h-72 bg-gray-200 rounded-lg"
                    >
                      <div className="w-full h-40 sm:h-44 md:h-48 lg:h-52 bg-gray-300 rounded-t-lg"></div>
                      <div className="p-2 sm:p-3">
                        <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Similar Products (Mobile) */}
            <div className="md:hidden mt-4 sm:mt-6">
              <div className="h-5 sm:h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-3 gap-3 xs:gap-4 sm:gap-5">
                {[...Array(4)].map((_, index) => (
                  <div
                    key={index}
                    className="w-full h-56 xs:h-60 sm:h-64 bg-gray-200 rounded-lg"
                  >
                    <div className="w-full h-40 xs:h-44 sm:h-48 bg-gray-300 rounded-t-lg"></div>
                    <div className="p-2 sm:p-3">
                      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>
                      <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'categories':
        // Used in Category - mimics category cards
        return (
          <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 xs:gap-4 sm:gap-5 lg:gap-6 animate-pulse px-2 sm:px-4">
            <div className="xs:col-span-2 sm:col-span-2 h-36 xs:h-40 sm:h-44 md:h-48 lg:h-52 bg-gray-200 rounded-lg"></div>
            <div className="h-36 xs:h-40 sm:h-44 md:h-48 lg:h-52 bg-gray-200 rounded-lg"></div>
            <div className="h-36 xs:h-40 sm:h-44 md:h-48 lg:h-52 bg-gray-200 rounded-lg"></div>
            <div className="h-36 xs:h-40 sm:h-44 md:h-48 lg:h-52 bg-gray-200 rounded-lg max-sm:hidden"></div>
            <div className="h-36 xs:h-40 sm:h-44 md:h-48 lg:h-52 bg-gray-200 rounded-lg max-md:hidden"></div>
            <div className="h-36 xs:h-40 sm:h-44 md:h-48 lg:h-52 bg-gray-200 rounded-lg max-lg:hidden"></div>
          </div>
        );

      default:
        // Used in TopStores - mimics a store card
        return (
          <div className="w-full h-36 xs:h-40 sm:h-44 md:h-48 bg-gray-200 rounded-lg animate-pulse">
            <div className="p-3 xs:p-4">
              <div className="h-4 sm:h-5 bg-gray-300 rounded w-1/2 mb-2 sm:mb-3"></div>
              <div className="h-3 sm:h-4 bg-gray-300 rounded w-1/4 mb-3 sm:mb-4"></div>
              <div className="flex gap-2 sm:gap-3">
                <div className="w-16 xs:w-20 sm:w-24 h-16 xs:h-20 sm:h-24 bg-gray-300 rounded-md"></div>
                <div className="w-16 xs:w-20 sm:w-24 h-16 xs:h-20 sm:h-24 bg-gray-300 rounded-md"></div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={type === 'default' ? 'flex gap-3 sm:gap-4 overflow-x-auto px-2 sm:px-4' : ''}>
      {[...Array(type === 'featuredProduct' || type === 'recommended' || type === 'productDetail' || type === 'categories' ? 1 : count)].map((_, index) => (
        <div key={index} className={type === 'default' ? 'flex-shrink-0 w-[300px] sm:w-[320px]' : ''}>
          {renderSkeleton()}
        </div>
      ))}
    </div>
  );
};

export default SkeletonLoader;