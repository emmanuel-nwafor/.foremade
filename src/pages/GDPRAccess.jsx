import React from 'react';
import { Link } from 'react-router-dom';

const GDPRAccess = () => {
  const openGDPRArticle = () => {
    window.open('https://gdpr-info.eu/art-15-gdpr/', '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4">
            <Link 
              to="/privacy-policy/eu"
              className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <i className="bx bx-arrow-back text-2xl"></i>
            </Link>
            <h1 className="text-3xl font-bold">Right of Access (Article 15 GDPR)</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="prose prose-blue max-w-none">
            <div className="mb-6">
              <p className="text-gray-700">
                To view the official text of Article 15 of the GDPR, please click the button below to open it in a new window:
              </p>
            </div>
            
            <div className="flex justify-center mb-8">
              <button
                onClick={openGDPRArticle}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="bx bx-external-link text-xl"></i>
                View Article 15 GDPR
              </button>
            </div>

            <div className="mt-8 bg-gray-50 p-6 rounded-lg">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">How to Exercise Your Right</h3>
              <p className="text-gray-700 mb-4">
                To exercise your right of access, you can:
              </p>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <i className="bx bx-envelope text-blue-600 text-xl mt-1"></i>
                  <div>
                    <h4 className="font-semibold text-gray-900">Email Request</h4>
                    <p className="text-gray-600">Send your request to privacy@foremade.com</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <i className="bx bx-user text-blue-600 text-xl mt-1"></i>
                  <div>
                    <h4 className="font-semibold text-gray-900">Privacy Centre</h4>
                    <p className="text-gray-600">Submit your request through our <Link to="/privacy-policy/contact" className="text-blue-600 hover:text-blue-800">Privacy Centre</Link></p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <footer className="mt-16 pt-8 border-t border-gray-200 text-center">
          <div className="text-gray-500 text-sm">
            © 2025 Foremade Global. All rights reserved.
          </div>
        </footer>
      </div>
    </div>
  );
};

export default GDPRAccess; 