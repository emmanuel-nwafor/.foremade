import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function ProSellerDetails() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 py-12 px-2 sm:px-8 flex items-center justify-center">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-blue-100 overflow-hidden p-8 sm:p-14">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-6">How to Become a Foremade Pro Seller</h1>
        <p className="text-lg text-gray-700 mb-8 max-w-2xl">
          Unlock advanced features, dedicated support, and greater visibility for your business by joining as a Foremade Pro Seller. Here’s everything you need to know to get started and succeed as a Pro Seller on our platform.
        </p>
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">Benefits of Pro Seller Status</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Priority listing and increased product visibility</li>
            <li>Access to advanced analytics and business tools</li>
            <li>Dedicated account manager and support</li>
            <li>Exclusive marketing and promotional opportunities</li>
            <li>Early access to new features and beta programs</li>
            <li>Customizable storefront and branding options</li>
          </ul>
        </section>
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">Requirements</h2>
          <ul className="list-disc pl-6 space-y-2 text-gray-700">
            <li>Registered business (with valid registration number)</li>
            <li>Valid tax reference (if applicable)</li>
            <li>Business bank account</li>
            <li>Ability to fulfill orders promptly and professionally</li>
            <li>Agreement to Foremade’s Pro Seller terms and conditions</li>
          </ul>
        </section>
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">Step-by-Step Process</h2>
          <ol className="list-decimal pl-6 space-y-2 text-gray-700">
            <li>Prepare your business documents (registration, tax, bank info).</li>
            <li>Click the <b>Register Now</b> button below or in the Pro Seller Guide.</li>
            <li>Fill out the Pro Seller application form with accurate details.</li>
            <li>Submit your application and await verification.</li>
            <li>Once approved, access your Pro Seller dashboard and start selling!</li>
          </ol>
        </section>
        <section className="mb-10">
          <h2 className="text-2xl font-bold text-blue-800 mb-4">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-blue-700">Can I upgrade from a standard seller to Pro?</h3>
              <p className="text-gray-600">Yes! If you already have a Foremade seller account, you can upgrade to Pro after fulfilling all current orders. Use a different email and phone number for your Pro registration if you want to keep both accounts.</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-700">How long does approval take?</h3>
              <p className="text-gray-600">Most applications are reviewed within 2-3 business days. We’ll notify you by email once your status is updated.</p>
            </div>
            <div>
              <h3 className="font-semibold text-blue-700">What if I need help with my application?</h3>
              <p className="text-gray-600">Our support team and account managers are here to help. Contact us via the support page or email for assistance.</p>
            </div>
          </div>
        </section>
        <div className="flex justify-end mt-8">
          <Link to="/pro-seller-form" className="bg-gradient-to-r from-blue-800 to-purple-800 text-white px-8 py-4 rounded-full font-semibold text-lg flex items-center shadow-lg hover:from-blue-900 hover:to-purple-900 transition-all duration-300 transform hover:scale-105">
            Register Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
} 