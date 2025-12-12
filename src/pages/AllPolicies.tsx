import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import PrivacyRequestForm from '../components/privacy/PrivacyRequestForm';

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
              
              <PrivacyRequestForm />
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
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 py-10">
            <div className="max-w-3xl mx-auto">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-20 h-20 mb-4 flex items-center justify-center bg-green-100 rounded-full">
                  <i className="bx bx-shield text-5xl text-green-700"></i>
                </div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-green-700 mb-2">Your Data Protection Rights under Nigerian Law (NDPA 2023)</h1>
                <p className="text-gray-600 max-w-xl">As a data subject in Nigeria, the Nigeria Data Protection Act (NDPA) 2023 grants you specific rights regarding your personal data. These rights ensure transparency, accountability, and give you greater control over how your information is collected, used, stored, and shared by organizations.</p>
                  </div>
              <div className="bg-white/90 rounded-xl shadow-lg p-6 md:p-10 border border-green-100">
                <h2 className="text-xl font-bold text-green-700 mb-3 mt-8">1. Right to Access Personal Data</h2>
                <p className="mb-2">You have the right to request and receive confirmation as to whether or not an organization holds your personal data. Where your data is being processed, you are entitled to:</p>
                <ul className="list-disc ml-6 mb-4 text-green-900">
                  <li>A copy of the personal data being processed</li>
                  <li>Information about the purpose of the processing</li>
                  <li>The categories of data involved</li>
                  <li>The recipients or categories of recipients to whom the data has been disclosed</li>
                  <li>The retention period for the data or criteria for determining that period</li>
                  <li>The existence of your data protection rights (e.g., correction, deletion)</li>
                  <li>Information about any automated decision-making (e.g., profiling) that may affect you</li>
                </ul>
                <p className="mb-4">Organizations must respond within 30 days and in a clear, intelligible format.</p>
                <h2 className="text-xl font-bold text-green-700 mb-3 mt-8">2. Right to Data Correction (Rectification)</h2>
                <p className="mb-4">You have the right to request that inaccurate or incomplete data about you be corrected or updated without undue delay. The organization must also notify any third parties who received the inaccurate data.</p>
                <h2 className="text-xl font-bold text-green-700 mb-3 mt-8">3. Right to Data Deletion (Erasure)</h2>
                <p className="mb-2">Also known as the "right to be forgotten", you may request the deletion of your data under specific conditions, such as:</p>
                <ul className="list-disc ml-6 mb-4">
                  <li>Data is no longer needed for its original purpose</li>
                  <li>You withdraw consent</li>
                  <li>You object to processing with no overriding legitimate reason</li>
                  <li>Data was unlawfully processed</li>
                  <li>Deletion is required for legal compliance</li>
                </ul>
                <p className="mb-4">Note: This right is not absolute and may be limited by legal obligations.</p>
                <h2 className="text-xl font-bold text-green-700 mb-3 mt-8">4. Right to Restrict Data Processing</h2>
                <p className="mb-2">You can request temporary restriction of data processing under circumstances such as:</p>
                <ul className="list-disc ml-6 mb-4">
                  <li>Contesting the accuracy of the data</li>
                  <li>Unlawful processing but preferring restriction over deletion</li>
                  <li>Data no longer needed but required for legal claims</li>
                  <li>Pending verification of objection to processing</li>
                </ul>
                <h2 className="text-xl font-bold text-green-700 mb-3 mt-8">5. Right to Data Portability</h2>
                <p className="mb-4">You have the right to receive your personal data in a structured, machine-readable format, and to transmit it to another data controller. This applies to data based on consent or a contract and processed by automated means.</p>
                <h2 className="text-xl font-bold text-green-700 mb-3 mt-8">How to Exercise Your Rights</h2>
                <p className="mb-4">You may contact the organization (data controller) through a formal Data Subject Access Request (DSAR). A response is typically required within 30 days. If unsatisfied, complaints can be filed with the Nigeria Data Protection Commission (NDPC) at <a href="https://ndpc.gov.ng" target="_blank" rel="noopener noreferrer" className="text-green-700 underline font-semibold">https://ndpc.gov.ng</a>.</p>
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
                  // OLD: Showing page not found
                  // {
                  //   title: 'Privacy Rights for Individuals',
                  //   description: 'Comprehensive guide to privacy rights and protections for individuals.',
                  //   link: 'https://www.oaic.gov.au/privacy/privacy-rights-for-individuals'
                  // },
                  {
                    title: 'Privacy Complaints',
                    description: 'Information about making privacy complaints and the complaint process.',
                    link: 'https://www.oaic.gov.au/privacy/privacy-complaints'
                  },
                  // OLD: Showing page not found
                  // {
                  //   title: 'Privacy Complaints',
                  //   description: 'Information about making privacy complaints and the complaint process.',
                  //   link: 'https://www.oaic.gov.au/privacy/privacy-complaints'
                  // },
                  {
                    title: 'Privacy Guidance for Organisations and Government Agencies',
                    description: 'Guidance for organisations and government agencies on privacy obligations.',
                    link: 'https://www.oaic.gov.au/privacy/guidance-and-advice'
                  },
                  // OLD: Showing page not found
                  // {
                  //   title: 'Notifiable Data Breaches',
                  //   description: 'Information about the Notifiable Data Breaches (NDB) scheme and reporting requirements.',
                  //   link: 'https://www.oaic.gov.au/privacy/notifiable-data-breaches'
                  // },
                  {
                    title: 'Notifiable Data Breaches',
                    description: 'Information about the Notifiable Data Breaches (NDB) scheme and reporting requirements.',
                    link: 'https://www.oaic.gov.au/privacy/notifiable-data-breaches'
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
            aria-label="back"
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