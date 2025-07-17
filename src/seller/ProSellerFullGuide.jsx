import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import bgImage from '../assets/images/bg.jpg';

export default function ProSellerFullGuide() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Background */}
      <div className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" style={{ backgroundImage: `url(${bgImage})` }} />
      <div className="relative z-10 max-w-4xl mx-auto px-4 py-12 w-full">
        {/* Introduction */}
        <section className="mb-10 bg-white rounded-2xl shadow-lg p-8">
          <h1 className="text-4xl font-extrabold text-blue-900 mb-4">Foremade Pro Seller Guide</h1>
          <p className="text-lg text-gray-700 mb-2">Welcome to the comprehensive guide for becoming a Foremade Pro Seller. This page covers everything you need to know to get started, maximize your success, and understand the benefits and requirements of the Pro Seller program.</p>
        </section>

        {/* Who Can Register */}
        <section className="mb-8 bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">Who Can Register?</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Manufacturers, brands, and authorized distributors</li>
            <li>Retailers and traders with a business presence</li>
            <li>Businesses seeking advanced selling tools and analytics</li>
            <li>Existing Foremade sellers ready to upgrade</li>
          </ul>
        </section>

        {/* Benefits */}
        <section className="mb-8 bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">Benefits of Becoming a Pro Seller</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Priority listing and increased product visibility</li>
            <li>Access to advanced analytics and sales reports</li>
            <li>Dedicated account manager and support</li>
            <li>Bulk product upload and inventory management tools</li>
            <li>Exclusive marketing and promotional opportunities</li>
            <li>Early access to new platform features</li>
          </ul>
        </section>

        {/* Requirements */}
        <section className="mb-8 bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">Requirements</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Valid business registration and tax information</li>
            <li>Proof of product authenticity (for brands/distributors)</li>
            <li>Minimum monthly sales volume (varies by category)</li>
            <li>Compliance with Foremade’s seller policies</li>
            <li>Active fulfillment of orders and positive ratings</li>
          </ul>
        </section>

        {/* How to Register */}
        <section className="mb-8 bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">How to Register</h2>
          <ol className="list-decimal pl-6 text-gray-700 space-y-1">
            <li>Go to the <Link to="/pro-seller-form" className="text-blue-600 underline">Pro Seller Registration Form</Link>.</li>
            <li>Fill in your business and contact details.</li>
            <li>Upload required documents (business registration, product certificates, etc.).</li>
            <li>Submit your application for review.</li>
            <li>Wait for approval and onboarding instructions from the Foremade team.</li>
          </ol>
          <div className="mt-4 flex justify-end">
            <Link to="/pro-seller-form" className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-full font-semibold flex items-center shadow">
              Register Now <ArrowRight className="ml-2 w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Fees & Commissions */}
        <section className="mb-8 bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">Fees & Commissions</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>One-time registration fee (see registration form for current amount)</li>
            <li>Commission on sales (varies by product category, typically 5-15%)</li>
            <li>No hidden charges; all fees are transparently listed in your seller dashboard</li>
          </ul>
        </section>

        {/* Support & Resources */}
        <section className="mb-8 bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">Support & Resources</h2>
          <ul className="list-disc pl-6 text-gray-700 space-y-1">
            <li>Dedicated Pro Seller support team</li>
            <li>Access to training materials and webinars</li>
            <li>Community forums and peer support</li>
            <li>Knowledge base with step-by-step guides</li>
          </ul>
        </section>

        {/* FAQs */}
        <section className="mb-8 bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900">How long does approval take?</h3>
              <p className="text-gray-700">Most applications are reviewed within 2-5 business days. You will be notified by email once your account is approved or if more information is needed.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Can I upgrade from a regular seller account?</h3>
              <p className="text-gray-700">Yes! If you already sell on Foremade, you can apply for Pro Seller status. Make sure all your current orders are fulfilled before applying.</p>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">What if I need help with my application?</h3>
              <p className="text-gray-700">Contact our support team at <a href="mailto:support@foremade.com" className="text-blue-600 underline">support@foremade.com</a> for assistance.</p>
            </div>
          </div>
        </section>

        {/* Contact/Help */}
        <section className="mb-8 bg-white rounded-2xl shadow p-6">
          <h2 className="text-2xl font-bold text-blue-800 mb-2">Contact & Help</h2>
          <p className="text-gray-700">For further questions or support, email <a href="mailto:support@foremade.com" className="text-blue-600 underline">support@foremade.com</a> or visit our <Link to="/support" className="text-blue-600 underline">Support Center</Link>.</p>
        </section>
      </div>
    </div>
  );
} 