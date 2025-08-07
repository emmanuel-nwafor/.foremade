import { useState, useEffect } from "react";
import SkeletonLoader from "../common/SkeletonLoader";
import {
  Zap,
  Shield,
  Clock,
  Truck,
  Rocket,
  Smile,
  ArrowRight,
} from "lucide-react";
import goImage from "../../assets/images/go.jpg";

const Category = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <section className="container mx-auto px-4 py-8">
        <h2 className="text-lg sm:text-lg md:text-xl font-bold text-gray-800 mb-4">
          Top Categories
        </h2>
        <SkeletonLoader type="categories" />
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8">
      <h2 className="text-lg sm:text-lg md:text-xl font-bold text-gray-800 mb-4">
        Top Categories
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ">
        {/* ForemadeGo Delivery Ad Card */}
        <div className="p-5 md:col-span-2 bg-gradient-to-br from-[#D1FAE5] to-[#A7F3D0] rounded-2xl sm:p-3 text-gray-900 relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10 pointer-events-none">
            <div className="absolute -top-4 -right-4 w-24 h-24 bg-white rounded-full"></div>
            <div className="absolute top-1/2 -left-8 w-16 h-16 bg-white rounded-full"></div>
            <div className="absolute -bottom-6 right-1/3 w-20 h-20 bg-white rounded-full"></div>
          </div>
          <div className="relative z-10">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold mb-1">
                  ForemadeGo
                </h2>
                <p className="text-teal-100 text-xs sm:text-sm font-medium">
                  Lightning Fast • Ultra Secure
                </p>
              </div>
              <div className="hidden sm:block">
                <img
                  src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMzAiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMiIvPgo8cGF0aCBkPSJNMjAgMjVIMzVMMzAgMzVIMjBWMjVaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K"
                  alt="Delivery"
                  className="w-8 h-8"
                />
              </div>
            </div>
            {/* Main Content Grid & CTA */}
            <div className="flex flex-col lg:flex-row gap-3 mb-2 items-stretch">
              {/* Left Side - Features + CTA */}
              <div className="flex flex-col justify-center flex-1 gap-4">
                {/* Features */}
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 bg-white/30 backdrop-blur-sm rounded-xl p-2">
                    <div className="bg-white/40 rounded-full p-1">
                      <Zap className="w-4 h-4 text-teal-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-gray-800">
                        Integrated with Foremade
                      </h4>
                      <p className="text-teal-600 text-xs">
                        Get your orders in record time
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/30 backdrop-blur-sm rounded-xl p-2">
                    <div className="bg-white/40 rounded-full p-1">
                      <Shield className="w-4 h-4 text-teal-500" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-gray-800">
                        100% Secure
                      </h4>
                      <p className="text-teal-600 text-xs">
                        Your packages, guaranteed safe
                      </p>
                    </div>
                  </div>
                </div>
                {/* CTA */}
                <div className="bg-white rounded-2xl p-2 flex items-center justify-center gap-12 mt-2">
                  <h3 className="text-teal-700 text-xs font-semibold mb-0">
                    Get Delivery in Minutes
                  </h3>
                  <a
                    href="https://foremadego.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-teal-400 to-teal-600 hover:from-teal-500 hover:to-teal-700 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 shadow-md text-[10px]"
                  >
                    Track your orders here
                    <ArrowRight className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Right Side - Delivery Person Image */}
              <div className="flex flex-col items-center justify-center flex-1">
                <div className="relative">
                  <div className="w-56 h-56 sm:w-64 sm:h-64 rounded-2xl overflow-hidden shadow-xl border-4 border-white/40">
                    <img
                      src={goImage}
                      alt="Happy ForemadeGo delivery person on motorcycle"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Floating badge */}
                  <div className="absolute -top-2 -right-2 bg-yellow-200 text-teal-700 px-2 py-0.5 rounded-full text-[0.65rem] font-bold shadow-lg">
                    #1 Rated
                  </div>
                </div>
              </div>
            </div>
            {/* Bottom tagline */}
            <div className="text-center mt-1 flex items-center justify-center gap-2">
              <Rocket className="w-4 h-4 text-teal-400" title="Speed" />
              <Shield className="w-4 h-4 text-teal-400" title="Security" />
              <Smile
                className="w-4 h-4 text-teal-400"
                title="Satisfaction Guaranteed"
              />
            </div>
          </div>
        </div>

        {/* Cut the Price Card */}
        <div className="md:col-span-1 bg-[#E0F4FF] text-black rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row max-md:items-center items-left justify-between">
          <div className="flex-1">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold mb-2">
              Cut the Price, Not the Features
            </h3>
            <p className="text-sm sm:text-xs mb-4">
              Get the latest phones at 20% off
            </p>
            <a
              href="/electronics"
              className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm sm:text-xs inline-block"
            >
              Buy Now
            </a>
          </div>
          <div className="mt-4 sm:mt-0 sm:self-start">
            <img
              src="https://pngimg.com/uploads/iphone16/small/iphone16_PNG6.png"
              alt="Phone"
              className="w-20 h-40"
            />
          </div>
        </div>

        {/* Style Meets Function Card */}
        <div className="bg-[#EDE9FE] text-black rounded-lg p-4 sm:p-6 flex sm:flex-row items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2">
              Style Meets Function
            </h3>
            <a
              href="/electronics"
              className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm sm:text-xs inline-block"
            >
              Shop Now
            </a>
          </div>
          <div className="mt-4 sm:mt-0">
            <img
              src="https://pngimg.com/uploads/laptop/small/laptop_PNG101763.png"
              alt="Laptop"
              className="w-24 sm:w-28 h-auto"
            />
          </div>
        </div>

        {/* Capture the Magic Card */}
        <div className="bg-[#FFE5E5] text-black rounded-lg p-4 sm:p-6 flex sm:flex-row items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2">
              Capture the Magic Around
            </h3>
            <a
              href="/electronics"
              className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm sm:text-xs inline-block"
            >
              Shop Now
            </a>
          </div>
          <div className="mt-4 sm:mt-0">
            <img
              src="https://pngimg.com/uploads/camera_lens/small/camera_lens_PNG4.png"
              alt="Camera"
              className="w-20 sm:w-24 h-auto"
            />
          </div>
        </div>

        {/* Health & Wellness Card */}
        <div className="bg-[#E0F4FF] text-black rounded-lg p-4 sm:p-6 flex flex-col sm:flex-row items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg md:text-xl font-bold mb-2">
              Health & Wellness
            </h3>
            <a
              href="/health-beauty"
              className="bg-gray-800 text-white px-4 py-2 rounded-md hover:bg-gray-700 text-sm sm:text-xs inline-block"
            >
              Shop Now
            </a>
          </div>
          <div className="mt-4 sm:mt-0">
            <img
              src="https://pngimg.com/uploads/pills/small/pills_PNG16492.png"
              alt="Bottle"
              className="w-20 sm:w-24 h-auto"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Category;
