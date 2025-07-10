import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../assets/logo.png';

export default function SellerAgreement() {
  const handleDownload = () => {
    const pdfUrl = '/agreement.pdf'; // Path to the PDF in public folder
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'FOREMADE_Vendor_Agreement.pdf';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-serif text-gray-800">
      {/* Title Page */}
      <header className="pt-16 pb-8 text-center border-b border-gray-300">
        <div className="max-w-4xl mx-auto">
          <img src={logo} alt="Formade logo" className="h-16 mx-auto mb-4" />
          <h1 className="text-4xl font-bold mb-4">Vendor User Agreement</h1>
          <p className="text-lg mb-2">Workbay, 2nd Floor, Lagos City Mall, Onikan, TBS Lagos</p>
          <p className="text-lg mb-2">
            Contact:{' '}
            <a href="mailto:info@foremade.com" className="underline hover:text-blue-600">
              info@foremade.com
            </a>
          </p>
          <p className="text-lg mb-4">Tel: +234 9126866984, +44 7481841132 (WhatsApp)</p>
          <p className="text-lg">Effective Date: _________________________</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-8 my-8 border border-gray-200">
        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">Introduction</h2>
          <p className="text-justify">
            Welcome to FOREMADE. This Vendor User Agreement (“Agreement”) governs your participation as a seller
            (“Vendor”, “You”, “Your”) on the FOREMADE Online Marketplace (“FOREMADE”, “Platform”, “We”, “Us”,
            “Our”). By registering and listing products on FOREMADE, you agree to be bound by the terms and
            conditions set forth below.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">1. Purpose of the Platform</h2>
          <p className="text-justify">
            FOREMADE provides Vendors with a free, professional online platform to sell their products to buyers
            both locally and internationally. FOREMADE offers unmatched visibility, access to a growing customer
            base, and a seamless transaction experience.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">2. Platform Usage Rights</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Vendors are granted the right to list, market, and sell products on the FOREMADE marketplace.</li>
            <li>
              Vendors retain full ownership of their products but grant FOREMADE a non-exclusive, royalty-free
              license to display, market, and promote the products across the platform and its promotional
              channels.
            </li>
            <li>Vendors must provide accurate product descriptions, pricing, and images.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">3. Free Access & Seller Costs</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              As of the effective date of this agreement, FOREMADE does not charge Vendors any listing fees or
              commissions to sell products on the platform.
            </li>
            <li>Visibility on FOREMADE is free of charge.</li>
            <li>
              FOREMADE reserves the right to introduce optional paid promotional services to Vendors for
              enhanced visibility.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">4. Pricing, Taxes, and Shipping Structure</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Vendors set their base product prices.</li>
            <li>
              FOREMADE may add applicable government taxes and shipping fees to the listed price for the buyer.
            </li>
            <li>
              Example: If you price an item at ₦200, the displayed price to the buyer may be ₦220 (which includes
              tax and delivery). You will always receive ₦200 per unit sold.
            </li>
            <li>Buyers, not Vendors, pay for delivery.</li>
            <li>FOREMADE manages shipping logistics to ensure professional delivery and compliance.</li>
            <li>FOREMADE may generate revenue from buyer protection fees and optional Vendor promotions.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">5. Vendor Responsibilities</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Maintain product quality and provide accurate product listings.</li>
            <li>
              Keep product prices competitive, ideally lower than your in-store prices, to attract more customers
              and stay ahead of competition.
            </li>
            <li>
              Comply with all applicable laws, including product safety, labelling, and intellectual property
              rights.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">6. Prohibited Activities</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Direct private interactions between Vendors and customers outside the FOREMADE platform are
              strictly prohibited to maintain professionalism and platform integrity.
            </li>
            <li>
              Personal deliveries by Vendors are not allowed. All items must pass through FOREMADE’s logistics
              system for quality control and tracking.
            </li>
            <li>
              Any attempt to bypass the platform’s payment or shipping process will result in immediate
              termination of your account.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">7. Returns, Damages, and Loss</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Refer to the FOREMADE Return Policy published on our website for details on customer returns.
            </li>
            <li>
              Any product lost or damaged while in the custody of FOREMADE will be replaced or reimbursed by
              FOREMADE.
            </li>
            <li>Products are inspected at collection to ensure compliance with the listing description.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">8. Payment to Vendors</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>
              Payment for products sold will be processed and released upon the successful pickup of the item
              from the Vendor’s shop by FOREMADE’s logistics team.
            </li>
            <li>FOREMADE provides transparent statements of sales and payments to Vendors.</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">9. Transparency & Trust</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>FOREMADE is committed to operating with honesty, fairness, and full disclosure.</li>
            <li>
              We encourage open communication regarding your concerns and we are dedicated to building
              long-term partnerships with all Vendors.
            </li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">10. Modifications to Agreement</h2>
          <p className="text-justify">
            FOREMADE may update this Agreement periodically. You will be notified of any significant changes,
            and continued use of the platform constitutes acceptance of the revised terms.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">11. Termination</h2>
          <p className="text-justify">
            FOREMADE reserves the right to suspend or terminate any Vendor account found to be in violation of
            this Agreement or applicable laws.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">12. Governing Law</h2>
          <p className="text-justify">
            This Agreement shall be governed and interpreted under the laws of the Federal Republic of Nigeria.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-bold mb-3">Acceptance</h2>
          <p className="text-justify mb-4">
            By registering and selling on FOREMADE, you acknowledge that you have read, understood, and agreed to
            all the terms of this Agreement.
          </p>
          <div className="grid grid-cols-2 gap-4 border-t border-gray-300 pt-4">
            <div>
              <p><strong>Vendor’s Name:</strong> _______________________________</p>
              <p><strong>Position:</strong> _____________________________________</p>
              <p><strong>Business Name:</strong> _______________________________</p>
              <p><strong>Address:</strong> _____________________________________</p>
            </div>
            <div>
              <p><strong>Signature:</strong> _____________________________</p>
              <p><strong>Date:</strong> ________________________________</p>
            </div>
          </div>
        </section>

        <div className="text-right">
          <button
            onClick={handleDownload}
            className="bg-slate-600 text-white px-4 py-2 rounded hover:bg-slate-800 transition duration-200"
          >
            Download Agreement
          </button>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-300 p-6 text-center text-gray-800">
        <p>Workbay, 2nd Floor, Lagos City Mall, Onikan, TBS Lagos</p>
        <p>
          Contact:{' '}
          <a href="mailto:info@foremade.com" className="underline hover:text-blue-600">
            info@foremade.com
          </a>
        </p>
        <p>Tel: +234 9126866984, +44 7481841132 (WhatsApp)</p>
        <p className="mt-2">
          <Link to="/seller/register" className="underline hover:text-blue-600">
            Back to Vendor Registration
          </Link>
        </p>
      </footer>
    </div>
  );
}