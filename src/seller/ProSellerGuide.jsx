import React from 'react';
import { Link } from 'react-router-dom';
import businessImage from '../assets/images/business_image.png';

const ProSellerGuide = () => {
  return (
    <div className="bg-white min-h-screen mb-12">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-4xl font-bold text-blue-950 text-center mb-4">
          Registering as a FOREMADE Pro Seller
        </h1>
        <p className="text-lg text-blue-950 leading-relaxed mb-6">
          Are you a <strong className="font-semibold">manufacturer</strong>, <strong className="font-semibold">trader</strong>, <strong className="font-semibold">brand</strong>, or <strong className="font-semibold">retail business</strong> looking to grow your customer base and expand your reach? Become a <strong className="font-semibold">FOREMADE Pro Seller</strong> and unlock advanced features, dedicated support, and greater visibility.
        </p>

        <div className="text-center mb-6">
          <img
            src={businessImage}
            alt="Inspiring Business Image"
            className="w-full max-w-3xl rounded-lg shadow-md"
          />
        </div>

        <h2 className="text-2xl font-semibold text-blue-950 mt-8 mb-4">Who Can Register?</h2>
        <ul className="list-disc list-inside text-blue-950 mb-6 space-y-2">
          <li>Registered businesses or companies</li>
          <li>Manufacturers, distributors, or wholesalers</li>
          <li>NGOs or registered charities</li>
          <li>Verified online entrepreneurs or sole traders</li>
        </ul>

        <h2 className="text-2xl font-semibold text-blue-950 mt-8 mb-4">How to Register</h2>
        <h3 className="text-xl font-medium text-blue-950 mt-6 mb-2">1. New to FOREMADE?</h3>
        <p className="text-blue-950 mb-4">
          Sign up directly through the <strong className="font-semibold">FOREMADE Pro Seller registration page</strong>.
        </p>
        <h3 className="text-xl font-medium text-blue-950 mt-6 mb-2">2. Already a FOREMADE seller?</h3>
        <p className="text-blue-950 mb-4">
          You can upgrade your existing account to a Pro Seller account once all current orders are fulfilled and your balance is withdrawn.
        </p>
        <h3 className="text-xl font-medium text-blue-950 mt-6 mb-2">3. Need both personal and business accounts?</h3>
        <p className="text-blue-950 mb-4">
          No problem! Just use a <strong className="font-semibold">separate email address and phone number</strong> for your Pro account.
        </p>
        <p className="text-blue-950 mb-6">
          <strong className="font-semibold">Note:</strong> All orders must be completed and funds withdrawn before switching to a Pro account.
        </p>

        <h2 className="text-2xl font-semibold text-blue-950 mt-8 mb-4">What You'll Need to Provide</h2>
        <h3 className="text-xl font-medium text-blue-950 mt-6 mb-2">For Sole Traders / Entrepreneurs:</h3>
        <ul className="list-disc list-inside text-blue-950 mb-6 space-y-2">
          <li>National ID or equivalent</li>
          <li>Business registration (if available)</li>
          <li>Business address</li>
          <li>Valid identification</li>
          <li>Bank details</li>
        </ul>
        <h3 className="text-xl font-medium text-blue-950 mt-6 mb-2">For Registered Companies / NGOs / Manufacturers:</h3>
        <ul className="list-disc list-inside text-blue-950 mb-6 space-y-2">
          <li>Business registration certificate</li>
          <li>Tax Identification Number</li>
          <li>Business name and address</li>
          <li>ID of an authorised representative</li>
          <li>Company bank account</li>
        </ul>

        <h2 className="text-2xl font-semibold text-blue-950 mt-8 mb-4">Verification Process</h2>
        <p className="text-blue-950 mb-6">
          All Pro Sellers must complete our Know Your Business (KYB) verification. Once verified, you'll receive a "Pro Seller" badge, and your business information will be visible to buyers for added credibility.
        </p>

        <h2 className="text-2xl font-semibold text-blue-950 mt-8 mb-4">Benefits of Being a Pro Seller</h2>
        <ul className="list-disc list-inside text-blue-950 mb-6 space-y-2">
          <li>Shipping and logistics support (optional if you prefer self-fulfillment)</li>
          <li>Bulk product upload and inventory management tools</li>
          <li>Dedicated account support</li>
          <li>Increased exposure in marketing campaigns</li>
          <li>Opportunity to be featured in promotions and newsletters</li>
        </ul>

        <h2 className="text-2xl font-semibold text-blue-950 mt-8 mb-6">Ready to grow your business with FOREMADE?</h2>
        <Link
          to="/pro-seller-form"
          className="cta inline-block bg-[#F49B1B] text-[#0D2A4D] px-6 py-3 text-center font-bold mt-6 rounded-md hover:bg-[#e6b800] transition duration-200"
        >
          Register now and take the next step toward scaling your success.
        </Link>
      </div>
    </div>
  );
};

export default ProSellerGuide;