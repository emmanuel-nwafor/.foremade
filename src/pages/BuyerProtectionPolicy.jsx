import React from 'react';
import HeroImage from '../assets/icons/undraw_my-files_1xwx.svg';

const BuyerProtectionPolicy = () => (
  <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-10">
    <div className="max-w-3xl mx-auto">
      {/* Hero Section */}
      <div className="flex flex-col items-center text-center mb-8">
        <img src={HeroImage} alt="Buyer Protection" className="w-40 h-40 mb-4" />
        <h1 className="text-3xl md:text-4xl font-extrabold text-blue-700 mb-2">Buyer Protection Policy</h1>
        <p className="text-gray-600 max-w-xl">Your peace of mind is our priority. Learn how Foremade protects your purchases and ensures a safe shopping experience.</p>
      </div>
      {/* Policy Card */}
      <div className="bg-white/90 rounded-xl shadow-lg p-6 md:p-10 border border-blue-100">
        <h2 className="text-xl font-bold text-blue-700 mb-3">Important</h2>
        <p className="mb-4">
          If your purchase was made through a Foremade Pro Seller, please refer to our <strong>Pro Refund Policy</strong> instead.<br/>
          Every order placed using the Buy Now button includes our Buyer Protection (added as a fee at checkout), which activates the Foremade Refund Policy. This protection ensures you're eligible for a refund if:
        </p>
        <ul className="list-disc ml-6 mb-4 text-blue-900">
          <li>Your parcel never arrives</li>
          <li>Your parcel arrives damaged</li>
          <li>The item you receive is significantly not as described (SNAD)</li>
        </ul>
        <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 rounded">
          <strong className="text-blue-700">Please note:</strong> Refunds are not guaranteed for items that don't fit or aren't your style. You may still contact the seller to request a return, but approval is at their discretion.
        </div>
        <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">Refunds for Returns</h2>
        <p className="mb-2">A full return refund may include:</p>
        <ul className="list-disc ml-6 mb-4">
          <li>The price of returned items</li>
          <li>The Buyer Protection fee linked to returned items</li>
          <li>Your original shipping fee</li>
          <li>Optional services (e.g., Item or Electronics Verification)</li>
        </ul>
        <p className="mb-4">
          We'll calculate the protection refund based on the items kept and refund the remaining portion. Discounts or voucher values used during purchase will be deducted proportionally from your refund.
        </p>
        <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">Partial Refunds</h2>
        <p className="mb-2">
          If your item is SNAD, the seller may offer a partial refund, allowing you to keep the item while receiving part of the cost back. You'll see the offer in your chat with the seller, where you can <em>accept or decline</em>. Accepted partial refunds include:
        </p>
        <ul className="list-disc ml-6 mb-4">
          <li>A partial item price refund</li>
          <li>A proportional refund of the Buyer Protection fee</li>
        </ul>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded">
          Shipping fees and optional service charges are not refunded in partial cases. Bundled purchases don't qualify for partial refunds—only full or item-specific returns.
        </div>
        <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">How to Request a Refund</h2>
        <p className="mb-2">You must act within 2 days of being notified that your order was delivered or marked as lost:</p>
        <ol className="list-decimal ml-6 mb-4">
          <li>Go to your <em>chat with the seller</em></li>
          <li>Press <em>I have an issue</em></li>
          <li>Follow the prompts to submit your refund request</li>
        </ol>
        <div className="bg-purple-50 border-l-4 border-purple-400 p-3 mb-4 rounded">
          This action temporarily freezes the order while we help resolve the situation. If you do nothing within the 2-day window, payment will be released to the seller.
        </div>
        <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">What Happens Next?</h2>
        <p className="mb-2">Depending on the issue, here's how we handle it:</p>
        <ul className="list-disc ml-6 mb-4">
          <li>Order is paused</li>
          <li>Payment is held securely</li>
          <li>You and the seller can work toward a solution</li>
        </ul>
        <p className="mb-4">
          You can track the status directly in the <em>conversation screen</em>. If you both resolve the issue yourselves, simply press:
        </p>
        <ul className="list-disc ml-6 mb-4">
          <li><em>Resolve this issue</em> for missing/damaged parcels</li>
          <li><em>Cancel & keep order</em> for agreed resolutions</li>
        </ul>
        <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">If You're the Seller</h2>
        <p className="mb-2">If a buyer raises an SNAD claim:</p>
        <ul className="list-disc ml-6 mb-4">
          <li>Ask them to suspend the order by clicking <em>I have an issue</em></li>
          <li>You'll have 14 days to resolve the issue</li>
          <li>Review buyer's evidence and choose one option:
            <ul className="list-disc ml-6">
              <li><em>Partial refund</em> (buyer keeps item)</li>
              <li><em>Full refund</em> (buyer keeps item)</li>
              <li><em>Request a return</em></li>
            </ul>
          </li>
        </ul>
        <p className="mb-2">If a return is requested:</p>
        <ul className="list-disc ml-6 mb-4">
          <li>Buyer ships the item within 5 business days</li>
          <li>Share your <em>contact info</em> if required</li>
          <li>After receiving the item, confirm its condition within 2 days</li>
          <li>Press <em>Everything is OK</em> to complete the return</li>
        </ul>
        <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">If You Disagree with a Claim</h2>
        <p className="mb-2">You may dispute the refund request:</p>
        <ol className="list-decimal ml-6 mb-4">
          <li>Press <em>View issue details</em></li>
          <li>Click <em>Contact Us</em></li>
          <li>Review the terms and press <em>Agree</em></li>
          <li>Press <em>Submit</em> to escalate to our support team</li>
        </ol>
        <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4 rounded">
          <strong>Note:</strong> You can only dispute if you haven't already accepted a refund option.
        </div>
        <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">If No Agreement is Reached</h2>
        <p className="mb-4">
          If both sides can't find a solution within 14 days, and no one reaches out for support, Foremade will step in to review the case and issue a final decision.
        </p>
        <h2 className="text-xl font-bold text-blue-700 mb-3 mt-8">Special Cases</h2>
        <p className="mb-2"><strong>Item Verified but Still SNAD</strong><br/>
          Follow the steps under <em>I've received a SNAD item</em> to request a refund.
        </p>
        <p className="mb-2"><strong>Device Linked to Seller's Account</strong></p>
        <ul className="list-disc ml-6 mb-4">
          <li>Notify the seller</li>
          <li>If unlinking fails, discuss a return or refund</li>
          <li>If a return is required, use the <em>Return the order</em> button</li>
        </ul>
        <p className="mb-4">
          Shipping details must be accurate. If not provided, Foremade may issue a refund even without a return.
        </p>
      </div>
    </div>
  </div>
);

export default BuyerProtectionPolicy; 