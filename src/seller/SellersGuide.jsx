import React from 'react';
import { Link } from 'react-router-dom';

function SellersGuide() {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-800">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Start Selling on Foremade
          </h1>
          <p className="text-lg md:text-xl mb-8">
            Reach millions of customers and grow your business today!
          </p>
          <Link
            to="/seller/login"
            className="bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition duration-300"
          >
            Get Started Now
          </Link>
        </div>
      </section>

      {/* How to Sign Up Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How to Sign Up and Start Selling
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg text-center">
              <i className="bx bx-user-plus text-4xl text-blue-600 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Step 1: Create an Account</h3>
              <p className="text-gray-600">
                Sign up with your email and password. It takes less than a minute to get started.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <i className="bx bx-store text-4xl text-blue-600 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Step 2: Choose Your Seller Type</h3>
              <p className="text-gray-600">
                Decide if you want to sell as a Merchant or a Casual Seller based on your needs.
              </p>
            </div>
            <div className="bg-white p-6 rounded-lg text-center">
              <i className="bx bx-upload text-4xl text-blue-600 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Step 3: List Your Products</h3>
              <p className="text-gray-600">
                Add your products, set your prices, and start selling to a global audience.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Seller Types Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Choose Your Selling Style
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">Merchant Seller</h3>
              <p className="text-gray-600 mb-4">
                Perfect for businesses or individuals looking to sell large volumes of products. As a Merchant Seller, you’ll have access to advanced tools, bulk listing options, and priority support.
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4">
                <li>Access to analytics and sales reports</li>
                <li>Bulk upload for product listings</li>
                <li>Dedicated account manager</li>
                <li>Priority customer support</li>
              </ul>
              <Link
                to="/seller/login"
                className="text-blue-600 font-semibold hover:underline"
              >
                Start as a Merchant Seller
              </Link>
            </div>
            <div className="bg-gray-50 p-8 rounded-lg">
              <h3 className="text-2xl font-semibold mb-4">Casual Seller</h3>
              <p className="text-gray-600 mb-4">
                Ideal for individuals looking to sell a few items occasionally. As a Casual Seller, you can quickly list items without any commitment or advanced tools.
              </p>
              <ul className="list-disc list-inside text-gray-600 mb-4">
                <li>Simple and easy listing process</li>
                <li>No subscription fees</li>
                <li>Sell up to 10 items per month</li>
                <li>Basic customer support</li>
              </ul>
              <Link
                to="/seller/login"
                className="text-blue-600 font-semibold hover:underline"
              >
                Start as a Casual Seller
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Sell on Foremade Section */}
      <section className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Why Sell on Foremade?
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <i className="bx bx-globe text-4xl text-blue-600 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Global Reach</h3>
              <p className="text-gray-600">
                Connect with millions of customers worldwide and grow your sales.
              </p>
            </div>
            <div className="text-center">
              <i className="bx bx-shield text-4xl text-blue-600 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">Secure Payments</h3>
              <p className="text-gray-600">
                Receive payments securely with our trusted payment gateways.
              </p>
            </div>
            <div className="text-center">
              <i className="bx bx-support text-4xl text-blue-600 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">24/7 Support</h3>
              <p className="text-gray-600">
                Our support team is here to help you every step of the way.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="bg-blue-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Start Selling?
          </h2>
          <p className="text-lg md:text-xl mb-8">
            Join thousands of sellers and turn your products into profits today!
          </p>
          <Link
            to="/seller/login"
            className="bg-white text-blue-600 font-semibold py-3 px-6 rounded-lg hover:bg-gray-200 transition duration-300"
          >
            Start Selling Now
          </Link>
        </div>
      </section>
    </div>
  );
}

export default SellersGuide;