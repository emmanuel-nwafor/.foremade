import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';

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
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">Key GDPR Rights</h3>
              <div className="grid gap-4">
                {[
                  {
                    title: 'Right to Access',
                    description: 'Individuals can request access to their personal data and obtain information about how it\'s processed.',
                    link: 'https://gdpr-info.eu/art-15-gdpr/'
                  },
                  {
                    title: 'Right to Rectification',
                    description: 'Allows individuals to have inaccurate personal data corrected.',
                    link: 'https://gdpr-info.eu/art-16-gdpr/'
                  },
                  {
                    title: 'Right to Erasure ("Right to be Forgotten")',
                    description: 'Enables individuals to request the deletion of their personal data under certain circumstances.',
                    link: 'https://gdpr-info.eu/art-17-gdpr/'
                  },
                  {
                    title: 'Right to Restrict Processing',
                    description: 'Individuals can request the limitation of their data processing under specific conditions.',
                    link: 'https://gdpr-info.eu/art-18-gdpr/'
                  },
                  {
                    title: 'Right to Data Portability',
                    description: 'Allows individuals to receive their personal data in a structured format and transfer it to another controller.',
                    link: 'https://gdpr-info.eu/art-20-gdpr/'
                  },
                  {
                    title: 'Right to Object to Processing',
                    description: 'Grants individuals the right to object to the processing of their personal data in certain situations.',
                    link: 'https://gdpr-info.eu/art-21-gdpr/'
                  }
                ].map((right, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{right.title}</h4>
                    <p className="text-gray-600 mb-3">{right.description}</p>
                    <a 
                      href={right.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                    >
                      Learn More
                      <i className="bx bx-external-link text-lg"></i>
                    </a>
                  </div>
                ))}
              </div>
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
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">Key NDPR Rights</h3>
              <div className="grid gap-4">
                {[
                  {
                    title: 'Right to Access Personal Data',
                    description: 'Individuals can request access to their personal data held by an organization and obtain information about how it\'s processed.',
                    link: 'https://ndpc.gov.ng/'
                  },
                  {
                    title: 'Right to Data Correction',
                    description: 'Allows individuals to have inaccurate or incomplete personal data corrected.',
                    link: 'https://ndpc.gov.ng/'
                  },
                  {
                    title: 'Right to Data Deletion',
                    description: 'Enables individuals to request the deletion of their personal data under certain circumstances.',
                    link: 'https://ndpc.gov.ng/'
                  },
                  {
                    title: 'Right to Restrict Data Processing',
                    description: 'Individuals can request the limitation of their data processing under specific conditions.',
                    link: 'https://ndpc.gov.ng/'
                  },
                  {
                    title: 'Right to Data Portability',
                    description: 'Allows individuals to receive their personal data in a structured format and transfer it to another controller.',
                    link: 'https://ndpc.gov.ng/'
                  }
                ].map((right, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{right.title}</h4>
                    <p className="text-gray-600 mb-3">{right.description}</p>
                    <a 
                      href={right.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full hover:bg-green-100 transition-colors"
                    >
                      Learn More
                      <i className="bx bx-external-link text-lg"></i>
                    </a>
                  </div>
                ))}
              </div>
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
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">Key CCPA Rights</h3>
              <div className="grid gap-4">
                {[
                  {
                    title: 'Right to Know',
                    description: 'Consumers can request disclosure of categories and specific pieces of personal information collected, sources, purposes, and third parties with whom it\'s shared.',
                    link: 'https://oag.ca.gov/privacy/ccpa'
                  },
                  {
                    title: 'Right to Delete',
                    description: 'Consumers can request the deletion of personal information collected by the business, subject to certain exceptions.',
                    link: 'https://oag.ca.gov/privacy/ccpa'
                  },
                  {
                    title: 'Right to Opt-Out of Sale or Sharing',
                    description: 'Consumers can direct businesses to stop selling or sharing their personal information with third parties.',
                    link: 'https://cppa.ca.gov/'
                  },
                  {
                    title: 'Right to Non-Discrimination',
                    description: 'Businesses cannot discriminate against consumers for exercising their CCPA rights.',
                    link: 'https://cppa.ca.gov/'
                  }
                ].map((right, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{right.title}</h4>
                    <p className="text-gray-600 mb-3">{right.description}</p>
                    <a 
                      href={right.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-full hover:bg-red-100 transition-colors"
                    >
                      Learn More
                      <i className="bx bx-external-link text-lg"></i>
                    </a>
                  </div>
                ))}
              </div>
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
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">Key Privacy Resources</h3>
              <div className="grid gap-4">
                {[
                  {
                    title: 'APEC Privacy Framework',
                    description: 'Comprehensive framework for privacy protection across APEC member economies.',
                    link: 'https://www.apec.org/docs/default-source/Publications/2005/12/APEC-Privacy-Framework/05_ecsg_privacyframewk.pdf'
                  },
                  {
                    title: 'APEC Secretariat Privacy Policy',
                    description: 'Official privacy policy and procedures of the APEC Secretariat.',
                    link: 'https://www.apec.org/docs/default-source/aboutus/policiesandprocedures/1a-apec-secretariat—personal-data-protection-policy-v2-1-%28approved-by-cmg-on-22-july-2022%29.pdf'
                  },
                  {
                    title: 'CBPR System Guidelines',
                    description: 'Cross-Border Privacy Rules system policies and guidelines.',
                    link: 'https://cbprs.org/wp-content/uploads/2019/11/4.-CBPR-Policies-Rules-and-Guidelines-Revised-For-Posting-3-16-updated-1709-2019.pdf'
                  },
                  {
                    title: 'Hong Kong Privacy Guidelines',
                    description: 'Privacy protection guidelines from the Office of the Privacy Commissioner for Personal Data.',
                    link: 'https://www.pcpd.org.hk/english/files/infocentre/1tonylam1_ppt.pdf'
                  }
                ].map((resource, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{resource.title}</h4>
                    <p className="text-gray-600 mb-3">{resource.description}</p>
                    <a 
                      href={resource.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-50 text-yellow-600 rounded-full hover:bg-yellow-100 transition-colors"
                    >
                      View Document
                      <i className="bx bx-external-link text-lg"></i>
                    </a>
                  </div>
                ))}
              </div>
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
              <h3 className="text-xl font-semibold text-gray-800 mt-6 mb-4">Key Privacy Resources</h3>
              <div className="grid gap-4">
                {[
                  {
                    title: 'Australian Privacy Principles',
                    description: 'The 13 APPs that form the basis of privacy protection in Australia.',
                    link: 'https://www.oaic.gov.au/privacy/australian-privacy-principles'
                  },
                  {
                    title: 'Privacy Rights for Individuals',
                    description: 'Comprehensive guide to privacy rights and protections for individuals.',
                    link: 'https://www.oaic.gov.au/privacy/privacy-rights-for-individuals'
                  },
                  {
                    title: 'Privacy Complaints',
                    description: 'Information about making privacy complaints and the complaint process.',
                    link: 'https://www.oaic.gov.au/privacy/privacy-complaints'
                  },
                  {
                    title: 'Anonymity and Pseudonymity',
                    description: 'Guidelines on anonymity and pseudonymity in data collection.',
                    link: 'https://www.oaic.gov.au/privacy/privacy-fact-sheets/individuals/anonymity-and-pseudonymity'
                  },
                  {
                    title: 'Data Collection and Use',
                    description: 'Information about how personal data is collected and used.',
                    link: 'https://www.oaic.gov.au/privacy/your-privacy-rights/knowing-how-your-data-is-collected-and-used'
                  }
                ].map((resource, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
                    <h4 className="text-lg font-semibold text-gray-800 mb-2">{resource.title}</h4>
                    <p className="text-gray-600 mb-3">{resource.description}</p>
                    <a 
                      href={resource.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-full hover:bg-purple-100 transition-colors"
                    >
                      Learn More
                      <i className="bx bx-external-link text-lg"></i>
                    </a>
                  </div>
                ))}
              </div>
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