import React from 'react';
import '/src/theme.css';
import { Link } from 'react-router-dom';

const TermsAndConditions = () => {
  return (
    <div className="min-h-screen bg-background-light py-8">
      <div className="max-w-3xl mx-auto policy-card">
        <div className="policy-header text-primary">FOREMADE Marketplace – Terms and Conditions</div>
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 mb-4 flex items-center justify-center bg-primary/10 rounded-full">
            <i className="bx bx-file text-5xl text-primary"></i>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-2">FOREMADE Marketplace – Terms and Conditions</h1>
          <p className="text-secondary max-w-xl">Please read these terms and conditions carefully before using the FOREMADE platform.</p>
        </div>
        {/* Terms Card */}
        <div className="policy-content">
          <p className="mb-2 text-secondary"><strong>Last Updated:</strong> July 5, 2024</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">1. Eligibility</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>Be at least 18 years old (or have guardian consent if underage)</li>
            <li>Provide truthful and accurate registration details</li>
            <li>Not be restricted from using digital platforms by applicable law</li>
          </ul>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">2. Account Registration</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>Keep your login details secure</li>
            <li>Be responsible for all activity under your account</li>
            <li>Notify FOREMADE of any unauthorised access or misuse</li>
          </ul>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">3. Selling on FOREMADE</h2>
          <p className="mb-4">Sellers must list only legal, original, and accurately described items, fulfill orders on time, maintain good service, and follow our policies. See our <Link to="/seller-agreement" className="policy-link">Seller Agreement</Link>.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">4. Buying on FOREMADE</h2>
          <p className="mb-4">Buyers must complete purchases in good faith, avoid fraud, and raise issues respectfully within the platform.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">5. Listing and Selling Fees</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li>No listing fees for up to 300 items/month (<Link to="/sellers-guide" className="policy-link">Standard Sellers</Link>)</li>
            <li>Up to 400 items/month (<Link to="/pro-seller-guide" className="policy-link">Pro Sellers</Link>)</li>
            <li>Fees apply only for extra listings, communicated in advance</li>
          </ul>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">6. Inclusive Pricing</h2>
          <p className="mb-4">All prices shown are final and include taxes, buyer protection, and handling fees. No hidden costs at checkout.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">7. Payments & Payouts</h2>
          <p className="mb-4">Payments are released after buyer confirmation. Seller wallets show pending balance until approved by FOREMADE, after which they can withdraw.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">8. Returns & Refunds</h2>
          <p className="mb-4">7-day return window. Sellers respond within 2 business days. Refunds issued after successful return. Exceptions apply.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">9. Prohibited Items</h2>
          <p className="mb-4">Illegal, counterfeit, restricted, or infringing items are banned. Violations lead to suspension.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">10. Disputes & Resolution</h2>
          <p className="mb-4">Direct communication encouraged. FOREMADE may step in and issue a final decision if needed.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">11. Intellectual Property</h2>
          <p className="mb-4">Users grant FOREMADE a non-exclusive license to use uploaded content. Do not upload content you don't own.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">12. Platform Use & Conduct</h2>
          <p className="mb-4">No fraud, abuse, or misuse of the platform. Violators may be banned.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">13. Limitation of Liability</h2>
          <p className="mb-4">FOREMADE is not liable for third-party delays, misuse of products, or losses from transactions.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">14. Account Suspension & Termination</h2>
          <p className="mb-4">FOREMADE can suspend or terminate accounts violating terms without prior notice.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">15. Privacy and Data Use</h2>
          <p className="mb-4">We respect your data. See our <Link to="/privacy-policy" className="policy-link">Privacy Policy</Link> for more details.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">16. Changes to These Terms</h2>
          <p className="mb-4">We may update these terms. Continued use implies acceptance of updates.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">17. Contact Us</h2>
          <p className="mb-4">Email: support@foremade.com<br />Website: www.foremade.com<br />See also our <Link to="/shipping-policy" className="policy-link">Shipping Policy</Link>.</p>
        </div>
        <footer className="policy-footer text-secondary">
          &copy; {new Date().getFullYear()} Foremade. All rights reserved.
        </footer>
      </div>
    </div>
  );
};

export default TermsAndConditions; 