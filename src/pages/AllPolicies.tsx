import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';

type PolicyParams = {
  type: string;
};

const AllPolicies = () => {
  const { type } = useParams<PolicyParams>();
  const navigate = useNavigate();

  const renderPolicy = () => {
    switch (type) {
      case 'cookies':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <i className="bx bx-cookie text-2xl text-yellow-600"></i>
              Cookie Settings
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                We use cookies and similar technologies to provide, protect, and improve our services. This page helps you understand how we use them and what choices you have.
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Essential Cookies</h3>
                  <p className="text-sm text-gray-600">Required for basic site functionality. Always active.</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Analytics Cookies</h3>
                  <p className="text-sm text-gray-600">Help us understand how visitors interact with our website.</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Marketing Cookies</h3>
                  <p className="text-sm text-gray-600">Used to deliver personalized advertisements.</p>
                </div>
                
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h3 className="font-semibold text-gray-900 mb-2">Preference Cookies</h3>
                  <p className="text-sm text-gray-600">Remember your settings and preferences.</p>
                </div>
              </div>

              <div className="mt-6 flex gap-4">
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Accept All
                </button>
                <button className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                  Essential Only
                </button>
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <i className="bx bx-support text-2xl text-blue-600"></i>
              Privacy Centre
            </h2>
            <div className="space-y-4">
              <p className="text-gray-700">
                Contact our Data Protection Officers for any privacy-related concerns or to exercise your data rights.
              </p>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="font-semibold text-blue-900 mb-2">Data Rights Request</h3>
                  <p className="text-sm text-blue-700 mb-4">Submit a request to access, modify, or delete your data.</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    Submit Request
                  </button>
                </div>
                
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h3 className="font-semibold text-blue-900 mb-2">Privacy Questions</h3>
                  <p className="text-sm text-blue-700 mb-4">Get help with privacy-related questions.</p>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm">
                    Contact DPO
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case 'eu':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <i className="bx bx-flag text-2xl text-blue-600"></i>
              EU Privacy Policy
            </h2>
            <div className="prose prose-blue max-w-none">
              <p className="text-gray-700">
                This policy complies with GDPR requirements for EU residents.
              </p>
              <h3>Key GDPR Rights</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Right to access your personal data</li>
                <li>Right to rectification</li>
                <li>Right to erasure ("right to be forgotten")</li>
                <li>Right to restrict processing</li>
                <li>Right to data portability</li>
                <li>Right to object to processing</li>
              </ul>
            </div>
          </div>
        );

      case 'nigeria':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <i className="bx bx-flag text-2xl text-green-600"></i>
              Nigeria Privacy Policy
            </h2>
            <div className="prose prose-green max-w-none">
              <p className="text-gray-700">
                This policy complies with NDPR requirements for Nigerian residents.
              </p>
              <h3>Key NDPR Rights</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Right to data access</li>
                <li>Right to data correction</li>
                <li>Right to data deletion</li>
                <li>Right to restrict data processing</li>
                <li>Right to data portability</li>
              </ul>
            </div>
          </div>
        );

      case 'us':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <i className="bx bx-flag text-2xl text-red-600"></i>
              US Privacy Policy
            </h2>
            <div className="prose prose-red max-w-none">
              <p className="text-gray-700">
                This policy complies with CCPA and other US privacy requirements.
              </p>
              <h3>Key CCPA Rights</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Right to know what personal information is collected</li>
                <li>Right to delete personal information</li>
                <li>Right to opt-out of the sale of personal information</li>
                <li>Right to non-discrimination for exercising CCPA rights</li>
              </ul>
            </div>
          </div>
        );

      case 'asia':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <i className="bx bx-flag text-2xl text-yellow-600"></i>
              Asia Privacy Policy
            </h2>
            <div className="prose prose-yellow max-w-none">
              <p className="text-gray-700">
                This policy complies with APEC and Asian privacy requirements.
              </p>
              <h3>Key Privacy Rights</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Right to access personal information</li>
                <li>Right to correct personal information</li>
                <li>Right to delete personal information</li>
                <li>Right to withdraw consent</li>
                <li>Right to data portability</li>
              </ul>
            </div>
          </div>
        );

      case 'australia':
        return (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              <i className="bx bx-flag text-2xl text-purple-600"></i>
              Australia/Oceania Privacy Policy
            </h2>
            <div className="prose prose-purple max-w-none">
              <p className="text-gray-700">
                This policy complies with Australian Privacy Principles (APPs).
              </p>
              <h3>Key APP Rights</h3>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>Right to access personal information</li>
                <li>Right to correct personal information</li>
                <li>Right to make a privacy complaint</li>
                <li>Right to anonymity and pseudonymity</li>
                <li>Right to be informed about data collection</li>
              </ul>
            </div>
          </div>
        );

      default:
        // Redirect to main privacy policy if type is not recognized
        navigate('/privacy-policy');
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/privacy-policy')}
              className="bg-white/10 p-2 rounded-lg hover:bg-white/20 transition-colors"
            >
              <i className="bx bx-arrow-back text-2xl"></i>
            </button>
            <h1 className="text-3xl font-bold">Privacy Settings</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {renderPolicy()}
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

export default AllPolicies; 