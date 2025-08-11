import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const EmpowermentHubPreview = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Force scroll on every render (for debugging)
  window.scrollTo(0, 0);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-purple-600 via-indigo-600 to-purple-700 py-6 px-4 sm:py-8 sm:px-6 lg:px-8 my-4 sm:my-6 rounded-xl sm:rounded-2xl mx-2 sm:mx-4 shadow-lg">
      {/* Subtle animated background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-48 sm:w-72 h-48 sm:h-72 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 right-0 w-48 sm:w-72 h-48 sm:h-72 bg-indigo-200 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-20 w-48 sm:w-72 h-48 sm:h-72 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse animation-delay-4000"></div>
      </div>

      {/* Subtle decorative elements */}
      <div className="absolute top-8 left-8 w-1.5 h-1.5 bg-purple-200 rounded-full animate-ping opacity-50"></div>
      <div className="absolute top-16 right-12 w-1 h-1 bg-indigo-200 rounded-full animate-ping opacity-50 animation-delay-1000"></div>
      <div className="absolute bottom-12 left-16 w-1 h-1 bg-purple-200 rounded-full animate-ping opacity-50 animation-delay-3000"></div>

      <div className="relative max-w-6xl mx-auto">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6 sm:gap-8">
          {/* Left side - Content */}
          <div className="flex-1 text-center lg:text-left">
            {/* Header */}
            <div className="mb-3 sm:mb-4">
              <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 text-white leading-tight flex flex-wrap items-center justify-center lg:justify-start">
                <i className="bx bx-rocket text-xl sm:text-2xl text-purple-200 mr-2 sm:mr-3"></i>
                <span className="whitespace-nowrap">Foremade Youth</span>
                <span className="ml-2 bg-gradient-to-r from-purple-200 to-indigo-200 bg-clip-text text-transparent whitespace-nowrap">
                  Empowerment Hub
                </span>
              </h2>
            </div>

            {/* Description */}
            <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6 text-purple-100 leading-relaxed px-2 sm:px-0">
              Join our community of young creators and entrepreneurs. Get funding, mentorship,
              and a <span className="font-medium text-purple-200">free platform</span> to showcase your talents.
            </p>

            {/* Feature highlights */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="flex items-center space-x-2 bg-white bg-opacity-5 px-3 py-1 rounded-full backdrop-blur-sm text-xs sm:text-sm">
                <i className="bx bx-dollar-circle text-purple-200"></i>
                <span className="text-white font-medium">Funding</span>
              </div>
              <div className="flex items-center space-x-2 bg-white bg-opacity-5 px-3 py-1 rounded-full backdrop-blur-sm text-xs sm:text-sm">
                <i className="bx bx-user-voice text-purple-200"></i>
                <span className="text-white font-medium">Mentorship</span>
              </div>
              <div className="flex items-center space-x-2 bg-white bg-opacity-5 px-3 py-1 rounded-full backdrop-blur-sm text-xs sm:text-sm">
                <i className="bx bx-devices text-purple-200"></i>
                <span className="text-white font-medium">Free Platform</span>
              </div>
            </div>
          </div>

          {/* Right side - CTA Buttons */}
          <div className="flex flex-col w-full sm:w-auto sm:flex-row lg:flex-col gap-2 sm:gap-3">
            <button
              onClick={() => navigate('/empowerment-hub')}
              className="w-full sm:w-auto group inline-flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 text-sm sm:text-base font-medium rounded-full text-white border border-purple-200 hover:bg-white hover:text-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-200 focus:ring-opacity-50 transition-all duration-200 transform hover:scale-105 backdrop-blur-sm whitespace-nowrap"
            >
              <i className="bx bx-info-circle mr-2"></i>
              <span>Learn More</span>
              <i className="bx bx-chevron-right ml-1 group-hover:translate-x-1 transition-transform duration-200"></i>
            </button>

            {/* Trust indicator */}
            <div className="flex items-center justify-center lg:justify-start mt-2 text-xs text-purple-200">
              <i className="bx bx-group mr-1"></i>
              <span>1000+ members</span>
              <div className="flex ml-2">
                {[...Array(5)].map((_, i) => (
                  <i key={i} className="bx bxs-star text-purple-200 text-xs"></i>
                ))}
              </div>
              <span className="ml-1">4.9</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmpowermentHubPreview;