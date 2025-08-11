import React from 'react';
import { Link } from 'react-router-dom';
import HeroImage from '../assets/icons/undraw_my-files_1xwx.svg';

const ProRefundPolicy = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-10">
    <div className="max-w-3xl mx-auto">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center mb-8">
        <img src={HeroImage} alt="Pro Refund Policy" className="w-40 h-40 mb-4" />
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-700 mb-2">Pro Seller Refund & Withdrawal Policy</h1>
        <p className="text-gray-600 max-w-xl">Learn about Foremade's return, refund, and withdrawal policy for Pro Seller transactions.</p>
      </div>
      {/* Policy Card */}
      <div className="bg-white/90 rounded-xl shadow-lg p-6 md:p-10 border border-blue-100">
        <h2 className="text-xl font-bold text-blue-700 mb-3">Buyer Return Rights</h2>
        <ul className="list-disc ml-6 mb-4 text-blue-900">
          <li><strong>7-Day Return Period:</strong> Buyers have 7 calendar days from the day after receiving their order to request a return and refund.</li>
          <li><strong>How to Request a Return:</strong> Use the <span className="font-semibold">"Report an Issue"</span> button within your order conversation on Foremade.</li>
          <li><strong>Return Exceptions:</strong> Some products like custom-made, perishable, or hygiene-sensitive items are excluded from return eligibility.</li>
          <li><strong>Return Shipping Costs:</strong> Buyers usually cover return shipping unless the seller offers free returns.</li>
        </ul>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 rounded">
          <strong className="text-blue-700">Note:</strong> Always check the product listing for specific return exceptions or seller-offered free returns.
        </div>
        <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">Pro Seller Responsibilities</h2>
        <ul className="list-disc ml-6 mb-4">
          <li><strong>Accept Return Requests:</strong> Must be accepted if submitted within the 7-day return window.</li>
          <li><strong>Respond Within 2 Business Days:</strong> Decide whether to request the item back or issue a refund.</li>
          <li><strong>Inspect Returned Items:</strong> Sellers must confirm the condition within 2 days of receiving returned goods.</li>
          <li><strong>Additional Policies:</strong> Sellers may add more generous return options as long as they align with Foremade standards.</li>
        </ul>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded">
          <span className="text-yellow-700 font-semibold">Tip:</span> Pro Sellers can offer more flexible return policies to attract buyers, but must always meet Foremade's minimum standards.
        </div>
        <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">Item Not Delivered</h2>
        <ul className="list-disc ml-6 mb-4">
          <li><strong>Missing Parcels:</strong> If an order is marked delivered but not received, the 7-day period begins from the expected delivery date.</li>
          <li><strong>Reporting Issues:</strong> Buyers should report delivery issues within this period. Foremade will investigate with the courier.</li>
        </ul>
        <div className="bg-purple-50 border-l-4 border-purple-400 p-3 mb-4 rounded">
          <span className="text-purple-700 font-semibold">Reminder:</span> Always keep your tracking information and communicate promptly if there are delivery issues.
        </div>
        <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">Foremade's Role</h2>
        <ul className="list-disc ml-6 mb-4">
          <li><strong>Dispute Support:</strong> Foremade helps resolve issues if buyers and sellers can't agree.</li>
          <li><strong>Item Not as Described:</strong> Claims will be reviewed based on evidence from both parties.</li>
          <li><strong>Enforcement:</strong> Sellers must respond to valid claims within 2 days, or Foremade may intervene and refund the buyer directly.</li>
        </ul>
        <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4 rounded">
          <strong>Important:</strong> Failure to respond to disputes may result in automatic refunds and impact your Pro Seller status. For more details, see the <Link to="/pro-seller-guide" className="text-blue-600 underline font-semibold">Pro Seller Guide</Link>.
        </div>
      </div>
    </div>
  </div>
);

export default ProRefundPolicy; 