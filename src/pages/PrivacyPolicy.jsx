import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const PrivacyPolicy = () => {
  const [expandedSections, setExpandedSections] = useState({});

  const toggleSection = (sectionId) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }));
  };

  const sections = [
    {
      id: 'introduction',
      title: 'Introduction and Scope',
      icon: 'bx-info-circle',
      content: (
        <p className="text-secondary leading-relaxed">
          This Privacy Notice explains how Foremade and its affiliates ("Foremade", "we", "us", or "our") collect,
          use, store, share, and protect your personal data. It complies with international privacy laws including
          GDPR, NDPR, CCPA, and more.
        </p>
      )
    },
    {
      id: 'controller',
      title: 'Data Controller',
      icon: 'bx-globe',
      content: (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { region: 'EU', entity: 'Foremade GmbH – Berlin, Germany' },
            { region: 'UK', entity: 'Foremade UK Ltd. – London' },
            { region: 'Nigeria', entity: 'Foremade Nigeria Ltd. – Lagos' },
            { region: 'Other Africa', entity: 'Foremade Africa Ltd. – Nairobi' },
            { region: 'Americas', entity: 'Foremade Americas Inc. – Delaware, USA' },
            { region: 'Asia', entity: 'Foremade Asia Pte. Ltd. – Singapore' },
            { region: 'All Regions', entity: 'Foremade Global AG – Zurich' }
          ].map(({ region, entity }, index) => (
            <div key={index} className="bg-background-light p-3 rounded-lg border-l-4 border-primary">
              <div className="font-semibold text-primary">{region}</div>
              <div className="text-sm text-secondary">{entity}</div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'contact',
      title: 'Contact and DPO',
      icon: 'bx-envelope',
      content: (
        <div className="bg-background-light p-4 rounded-lg border border-border-light">
          <p className="text-secondary">
            Reach our Data Protection Officers via the{' '}
            <Link to="/privacy-policy/contact" className="policy-link font-semibold">
              Privacy Centre
            </Link>.
          </p>
        </div>
      )
    },
    {
      id: 'data-collection',
      title: 'What Data We Collect',
      icon: 'bx-shield',
      content: (
        <div className="space-y-3">
          {[
            { type: 'Identity', desc: 'Name, email, phone number' },
            { type: 'Account Data', desc: 'Order history, preferences, settings' },
            { type: 'Usage Data', desc: 'Device/browser information, interaction patterns' },
            { type: 'Geolocation', desc: 'Location data (if enabled by you)' },
            { type: 'Third-party Sources', desc: 'Data from partners and public sources' }
          ].map(({ type, desc }, index) => (
            <div key={index} className="flex items-start space-x-3 p-3 bg-background-light rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="font-semibold text-primary">{type}</div>
                <div className="text-sm text-secondary">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'legal-basis',
      title: 'Legal Basis',
      icon: 'bx-check-circle',
      content: (
        <div className="grid md:grid-cols-2 gap-4">
          {[
            'Contract fulfillment',
            'Legal compliance',
            'Platform improvement',
            'Consent (e.g., marketing)'
          ].map((basis, index) => (
            <div key={index} className="flex items-center space-x-2 p-3 bg-background-light rounded-lg">
              <div className="w-2 h-2 bg-primary rounded-full"></div>
              <span className="text-primary font-medium">{basis}</span>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'transfers',
      title: 'International Transfers',
      icon: 'bx-world',
      content: (
        <div className="bg-background-light p-4 rounded-lg border-l-4 border-primary">
          <p className="text-secondary leading-relaxed">
            We use Standard Contractual Clauses (SCCs), NDPR rules, APEC frameworks, or other safeguards to protect your data when transferred internationally.
          </p>
        </div>
      )
    },
    {
      id: 'retention',
      title: 'Data Retention',
      icon: 'bx-folder',
      content: (
        <p className="text-secondary leading-relaxed">
          We keep your data as long as needed to deliver services, comply with legal obligations, or resolve disputes.
        </p>
      )
    },
    {
      id: 'rights',
      title: 'Your Rights',
      icon: 'bx-user',
      content: (
        <div className="bg-background-light p-4 rounded-lg border border-border-light">
          <p className="text-secondary mb-3">
            Depending on your region, you may request access, correction, deletion, or restriction of your data.
          </p>
          <div className="flex items-center space-x-2">
            <span className="text-primary">Submit requests via our</span>
            <Link to="/privacy-policy/contact" className="policy-link font-semibold">
              Privacy Centre
            </Link>
          </div>
        </div>
      )
    },
    {
      id: 'cookies',
      title: 'Cookies',
      icon: 'bx-cookie',
      content: (
        <div className="bg-background-light p-4 rounded-lg border border-border-light">
          <p className="text-secondary mb-3">
            We use cookies to enhance performance and deliver marketing. Adjust your preferences in our{' '}
            <Link to="/privacy-policy/cookies" className="policy-link font-semibold">
              Cookie Settings
            </Link>.
          </p>
        </div>
      )
    },
    {
      id: 'security',
      title: 'Data Security',
      icon: 'bx-lock',
      content: (
        <div className="bg-background-light p-4 rounded-lg border-l-4 border-primary">
          <p className="text-secondary leading-relaxed">
            We apply encryption, access controls, and secure infrastructure to protect your data from unauthorized access and breaches.
          </p>
        </div>
      )
    },
    {
      id: 'third-party',
      title: 'Third-Party Links',
      icon: 'bx-link',
      content: (
        <p className="text-secondary leading-relaxed">
          We are not responsible for third-party privacy practices linked from our platform. Please review their policies separately.
        </p>
      )
    },
    {
      id: 'children',
      title: "Children's Privacy",
      icon: 'bx-child',
      content: (
        <div className="bg-background-light p-4 rounded-lg border border-border-light">
          <p className="text-secondary leading-relaxed">
            Children under 16 require verified parental consent to use our services.
          </p>
        </div>
      )
    },
    {
      id: 'updates',
      title: 'Policy Updates',
      icon: 'bx-refresh',
      content: (
        <p className="text-secondary leading-relaxed">
          We may update this policy and will notify you of major changes through our website or email notifications.
        </p>
      )
    }
  ];

  return (
    <>
      <link href="https://cdnjs.cloudflare.com/ajax/libs/boxicons/2.1.4/css/boxicons.min.css" rel="stylesheet" />
      
      <div className="min-h-screen bg-background-light py-8">
        <div className="bg-gray-100">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="text-center">
              <div className="flex justify-center mb-6">
                <div className="bg-primary/10 p-4 rounded-2xl">
                  <i className="bx bx-shield text-4xl text-primary"></i>
                </div>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold mb-4 text-primary">
                Foremade Global Privacy Notice
              </h1>
              <div className="bg-accent px-4 py-2 rounded-full inline-block">
                <p className="text-accent font-medium">Effective Date: June 2, 2025</p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-6 py-12">
          <div className="space-y-4">
            {sections.map((section) => (
              <div key={section.id} className="bg-background-light rounded-xl shadow-sm border border-border-light overflow-hidden hover:shadow-md transition-shadow">
                <button
                  onClick={() => toggleSection(section.id)}
                  className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-background-dark transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="text-primary flex items-center justify-center w-8">
                      <i className={`bx ${section.icon} text-2xl`}></i>
                    </div>
                    <h2 className="text-xl font-semibold text-primary">{section.title}</h2>
                  </div>
                  <div className="text-secondary">
                    {expandedSections[section.id] ? (
                      <i className="bx bx-chevron-down text-2xl"></i>
                    ) : (
                      <i className="bx bx-chevron-right text-2xl"></i>
                    )}
                  </div>
                </button>
                {expandedSections[section.id] && (
                  <div className="px-6 pb-6 border-t border-border-light">
                    <div className="pt-4">
                      {section.content}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-8">
            <h3 className="text-2xl font-semibold text-primary mb-4">Regional Policies</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { name: 'EU Policy', type: 'eu' },
                { name: 'UK Policy', type: 'uk' },
                { name: 'US Policy', type: 'us' },
                { name: 'Nigeria Policy', type: 'nigeria' },
                { name: 'Other Africa', type: 'africa' },
                { name: 'Americas Policy', type: 'americas' },
                { name: 'Asia Policy', type: 'asia' },
                { name: 'Australia/Oceania', type: 'australia' }
              ].map((policy, index) => (
                <Link
                  key={index}
                  to={`/privacy-policy/${policy.type}`}
                  className="block p-4 rounded-lg border-2 bg-background-light hover:bg-background-dark transition-all group border-border-light hover:border-primary"
                >
                  <div className="text-primary group-hover:text-secondary">
                    {policy.name}
                  </div>
                  <div className="text-sm flex items-center gap-1 text-secondary">
                    View regional details
                    <i className="bx bx-right-arrow-alt"></i>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          <footer className="mt-16 pt-8 border-t border-gray-200 text-center">
            <div className="text-secondary text-sm">
              &copy; {new Date().getFullYear()} Foremade Global. All rights reserved.
            </div>
          </footer>
        </div>
      </div>
    </>
  );
};

export default PrivacyPolicy;