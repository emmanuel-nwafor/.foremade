import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

const PrivacyPolicy = () => {
  const regions = [
    { 
      id: 'eu', 
      name: 'European Union',
      flag: '🇪🇺',
      color: 'from-blue-500 to-blue-700',
      textColor: 'text-blue-600',
      hoverColor: 'hover:bg-blue-50'
    },
    { 
      id: 'nigeria', 
      name: 'Nigeria',
      flag: '🇳🇬',
      color: 'from-green-500 to-green-700',
      textColor: 'text-green-600',
      hoverColor: 'hover:bg-green-50'
    },
    { 
      id: 'us', 
      name: 'United States',
      flag: '🇺🇸',
      color: 'from-red-500 to-red-700',
      textColor: 'text-red-600',
      hoverColor: 'hover:bg-red-50'
    },
    { 
      id: 'asia', 
      name: 'Asia Pacific',
      flag: '🌏',
      color: 'from-yellow-500 to-yellow-700',
      textColor: 'text-yellow-600',
      hoverColor: 'hover:bg-yellow-50'
    },
    { 
      id: 'australia', 
      name: 'Australia',
      flag: '🇦🇺',
      color: 'from-purple-500 to-purple-700',
      textColor: 'text-purple-600',
      hoverColor: 'hover:bg-purple-50'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <h1 className="text-3xl font-bold mb-4">Privacy Policy</h1>
          <p className="text-white/80 max-w-2xl">
            At Foremade, we're committed to protecting your privacy and ensuring you have control over your personal data. 
            Our privacy practices are designed to comply with global privacy regulations.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-12">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Regional Privacy Policies</h2>
          <p className="text-gray-600 mb-8">
            Select your region to view the specific privacy policy that applies to you:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {regions.map((region) => (
              <motion.div 
                key={region.id}
                whileHover={{ scale: 1.02 }}
                transition={{ type: "spring", stiffness: 400, damping: 10 }}
              >
                <Link 
                  to={`/privacy-policy/${region.id}`}
                  className={`block p-4 rounded-lg border border-gray-200 ${region.hoverColor} transition-colors duration-200`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-2xl mr-3">{region.flag}</span>
                      <span className="font-medium text-gray-900">{region.name}</span>
                    </div>
                    <div className={`${region.textColor}`}>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">General Privacy Information</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">How We Collect Information</h3>
              <p className="text-gray-600">
                We collect information that you provide directly to us, information we collect automatically when you use our services,
                and information we obtain from third-party sources.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">How We Use Your Information</h3>
              <p className="text-gray-600">
                We use your information to provide, maintain, and improve our services, process transactions,
                communicate with you, and comply with legal obligations.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">How We Share Information</h3>
              <p className="text-gray-600">
                We may share your information with third-party service providers, affiliates, and business partners.
                We may also share information for legal reasons or in the event of a business transfer.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Data Security</h3>
              <p className="text-gray-600">
                We implement appropriate technical and organizational measures to protect your personal information
                against unauthorized access, loss, or alteration.
              </p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Contact Us</h3>
              <p className="text-gray-600">
                If you have any questions about our privacy practices, you can contact our Data Protection Officer at{' '}
                <a href="mailto:privacy@foremade.com" className="text-blue-600 hover:underline">privacy@foremade.com</a>.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
          <div className="flex items-start">
            <div className="flex-shrink-0 pt-0.5">
              <svg className="h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">Last Updated</h3>
              <p className="text-sm text-blue-700 mt-1">
                This privacy policy was last updated on May 26, 2025.
              </p>
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

export default PrivacyPolicy;