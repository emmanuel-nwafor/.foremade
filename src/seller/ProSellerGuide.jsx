import React from 'react';
import { Link } from 'react-router-dom';

const ProSellerGuide = () => {
  return (
    <div className="bg-white min-h-screen mb-12">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-4xl font-bold text-blue-950 text-center mb-4">
          Registering as a FOREMADE Pro Seller
        </h1>
        <p className="text-lg text-blue-950 leading-relaxed mb-6">
          Are you a <strong className="font-semibold">manufacturer</strong>,{' '}
          <strong className="font-semibold">trader</strong>,{' '}
          <strong className="font-semibold">brand</strong>, or{' '}
          <strong className="font-semibold">retail business</strong> looking to reach more customers across Nigeria and
          beyond? Become a <strong className="font-semibold">FOREMADE Pro Seller</strong> and get access to advanced
          features, dedicated support, and increased visibility.
        </p>

        <div className="text-center mb-6">
          <img
            src="business_image.png"
            alt="Inspiring Business Image"
            className="w-full max-w-3xl rounded-lg shadow-md"
          />
        </div>

        <h2 className="text-2xl font-semibold text-blue-950 mt-8 mb-4">Who Can Register?</h2>
        <ul className="list-disc list-inside text-blue-950 mb-6 space-y-2">
          <li>Registered businesses or companies in Nigeria</li>
          <li>Manufacturers, distributors, or wholesalers</li>
          <li>NGOs or registered charities</li>
          <li>Verified online entrepreneurs or sole traders</li>
        </ul>

        <h2 className="text-2xl font-semibold text-blue-950 mt-8 mb-4">How to Register</h2>
        <h3 className="text-xl font-medium text-blue-950 mt-6 mb-2">1. New to FOREMADE?</h3>
        <p className="text-blue-950 mb-4">
          Start fresh by signing up directly via the <strong className="font-semibold">FOREMADE Pro Seller registration
          page</strong>.
        </p>
        <h3 className="text-xl font-medium text-blue-950 mt-6 mb-2">2. Already on FOREMADE?</h3>
        <p className="text-blue-950 mb-4">
          Convert your existing seller account to a Pro account <strong className="font-semibold">after all current orders
          are completed</strong> and your balance is withdrawn.
        </p>
        <h3 className="text-xl font-medium text-blue-950 mt-6 mb-2">3. Want both personal and business accounts?</h3>
        <p className="text-blue-950 mb-4">
          No wahala! Use a <strong className="font-semibold">different email and phone number</strong> to register your
          Pro account.
        </p>
        <p className="text-blue-950 mb-6">
          <strong className="font-semibold">Note:</strong> You must complete and withdraw all orders before converting
          your standard account to Pro.
        </p>

        <h2 className="text-2xl font-semibold text-blue-950 mt-8 mb-4">What You'll Need to Provide</h2>
        <h3 className="text-xl font-medium text-blue-950 mt-6 mb-2">For Sole Traders / Entrepreneurs:</h3>
        <ul className="list-disc list-inside text-blue-950 mb-6 space-y-2">
          <li>BVN or National ID</li>
          <li>CAC registration (if available)</li>
          <li>Business address</li>
          <li>Valid ID</li>
          <li>Bank details</li>
        </ul>
        <h3 className="text-xl font-medium text-blue-950 mt-6 mb-2">For Registered Companies / NGOs / Manufacturers:</h3>
        <ul className="list-disc list-inside text-blue-950 mb-6 space-y-2">
          <li>CAC certificate</li>
          <li>TIN (Tax ID Number)</li>
          <li>Business name and address</li>
          <li>Director/representative ID</li>
          <li>Company bank account</li>
        </ul>

        <h2 className="text-2xl font-semibold text-blue-950 mt-8 mb-4">Verification Process</h2>
        <p className="text-blue-950 mb-6">
          You'll need to complete our Know Your Business (KYB) verification. Once approved, you'll get a "Pro Seller"
          badge, and your business details will be displayed for buyer transparency.
        </p>

        <h2 className="text-2xl font-semibold text-blue-950 mt-8 mb-4">What You Gain</h2>
        <ul className="list-disc list-inside text-blue-950 mb-6 space-y-2">
          <li>FOREMADE handles shipping and logistics (unless you prefer otherwise)</li>
          <li>Bulk upload and inventory tools</li>
          <li>Dedicated account support</li>
          <li>More visibility across our campaigns</li>
          <li>Get featured in promotions and newsletters</li>
        </ul>

        <h2 className="text-2xl font-semibold text-blue-950 mt-8 mb-6">Ready to grow?</h2>
        <Link 
          to="/pro-seller-form" 
          className="cta inline-block bg-[#F49B1B] text-[#0D2A4D] px-6 py-3 text-center font-bold mt-6 rounded-md hover:bg-[#e6b800] transition duration-200"
        >
          Register as a FOREMADE Pro Seller
        </Link>
      </div>
    </div>
  );
};

export default ProSellerGuide;