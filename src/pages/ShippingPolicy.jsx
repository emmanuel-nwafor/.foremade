import React from 'react';
import { Link } from 'react-router-dom';

const ShippingPolicy = () => {
  return (
    <div className="min-h-screen bg-background-light py-10">
      <div className="max-w-3xl mx-auto">
        {/* Hero Section */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-20 h-20 mb-4 flex items-center justify-center bg-primary/10 rounded-full">
            <i className="bx bx-package text-5xl text-primary"></i>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-primary mb-2">FOREMADE Shipping Policy</h1>
          <p className="text-secondary max-w-xl">Learn about our shipping methods, fees, and delivery timeframes for FOREMADE Marketplace.</p>
        </div>
        {/* Policy Card */}
        <div className="bg-background-light rounded-xl shadow-lg p-6 md:p-10 border border-border-light">
          <p className="mb-2 text-secondary"><strong>Last Updated:</strong> July 5, 2024</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">1. Shipping Methods</h2>
          <p className="mb-4 text-secondary">FOREMADE offers multiple shipping options depending on the location of the buyer and seller:</p>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li><strong>Local Delivery:</strong> Available for buyers and sellers within the same country or region.</li>
            <li><strong>Standard Shipping:</strong> Carried out through our partnered courier services with tracking provided.</li>
            <li><strong>Express Shipping:</strong> Optional faster delivery for eligible items at an additional cost.</li>
            <li><strong>Pick-Up Options:</strong> In some locations, buyers may choose to collect items directly from sellers or drop-off points.</li>
          </ul>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">2. Shipping Fees</h2>
          <p className="mb-4 text-secondary">Shipping fees are automatically calculated at checkout based on item size, weight, and destination. Multi-item discounts may apply when purchasing several products from the same seller. Sellers are responsible for accurately entering item weight and dimensions to ensure correct fee calculation.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">3. Order Processing Time</h2>
          <p className="mb-4 text-secondary">Sellers must ship items within <strong>2 business days</strong> of receiving an order. Failure to ship within the required time may lead to order cancellation and account penalties.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">4. Delivery Timeframes</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li><strong>Local Delivery:</strong> 2–5 business days</li>
            <li><strong>Domestic Standard Shipping:</strong> 3–7 business days</li>
            <li><strong>International Shipping:</strong> 7–21 business days (depending on destination and customs)</li>
          </ul>
          <p className="mb-4 text-secondary">Delivery times may vary based on the courier and unforeseen circumstances such as weather or strikes.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">5. Tracking & Confirmation</h2>
          <p className="mb-4 text-secondary">All shipped orders must include tracking information. Buyers will receive tracking updates and can monitor delivery progress through their FOREMADE account.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">6. Shipping Responsibility</h2>
          <ul className="list-disc ml-6 mb-4 text-secondary">
            <li><strong>Sellers:</strong> Responsible for packaging items securely and dispatching within the stated timeframe.</li>
            <li><strong>Buyers:</strong> Responsible for providing a complete and accurate delivery address.</li>
          </ul>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">7. Lost or Delayed Shipments</h2>
          <p className="mb-4 text-secondary">If an item hasn’t arrived within the expected timeframe, buyers should contact the seller first via the platform. If unresolved, buyers can raise an issue within <strong>7 days after the estimated delivery date</strong> for further investigation and support.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">8. International Shipping & Customs</h2>
          <p className="mb-4 text-secondary">International orders may be subject to customs fees, import duties, or taxes depending on the destination country. These charges are the responsibility of the buyer unless otherwise stated.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">9. Non-Delivery or Return to Sender</h2>
          <p className="mb-4 text-secondary">If an order is returned due to incorrect address or non-collection, the buyer may be responsible for re-shipping costs.</p>
          <h2 className="text-xl font-bold text-primary mb-3 mt-8">10. Prohibited Items</h2>
          <p className="mb-4 text-secondary">Items that violate FOREMADE's <Link to="/terms-conditions" className="policy-link">Prohibited Products Policy</Link> or applicable shipping laws will not be permitted.</p>
          <p className="mb-4 text-secondary">If you need help with your shipment, contact our support team via the <Link to="/support" className="policy-link">Help Centre</Link> on your dashboard.</p>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy; 