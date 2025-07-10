import React from 'react';

const YouthEmpowermentTerm = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-5xl mx-auto p-8">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8 border border-gray-100">
          <div className="flex items-center justify-center mb-6">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 rounded-full">
              <i className="bx bx-world text-3xl text-white"></i>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-center bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            FOREMADE Youth Empowerment
          </h1>
          <h2 className="text-2xl font-semibold text-center text-gray-700 mb-4">
            Terms of Engagement
          </h2>
          <div className="bg-indigo-50 rounded-lg p-4">
            <p className="text-center text-gray-700 font-medium">
              "Empowered Creators Collaboration Agreement"
            </p>
          </div>
          <p className="mt-6 text-gray-600 text-center leading-relaxed">
            This agreement outlines the terms and conditions between <strong className="text-indigo-600">FOREMADE Marketplace</strong> ("FOREMADE") 
            and the selected participant/brand ("Creator") under the <strong className="text-purple-600">FOREMADE Youth Empowerment Initiative</strong>.
          </p>
        </div>

        {/* Main Content */}
        <div className="space-y-6">
          {sections.map((section, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-indigo-50 p-2 rounded-lg mr-3">
                  <i className={`bx ${section.icon} text-indigo-600 text-xl`}></i>
                </div>
                <h3 className="text-xl font-semibold text-gray-800">{section.title}</h3>
              </div>
              {section.content}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl shadow-lg p-6 text-white mb-20">
          <div className="flex items-center justify-center mb-4">
            <i className="bx bx-handshake text-3xl mr-3"></i>
            <h3 className="text-xl font-semibold">Agreement Commitment</h3>
          </div>
          <p className="text-center leading-relaxed">
            <strong>By entering into this agreement, both parties commit to upholding the objectives 
            of the Youth Empowerment Initiative in a fair and transparent manner.</strong>
          </p>
        </div>
      </div>

      {/* Boxicons CDN */}
      <link href='https://unpkg.com/boxicons@2.1.4/css/boxicons.min.css' rel='stylesheet' />
    </div>
  );
};

// Helper data structure for sections
const sections = [
  {
    icon: 'bx-target-lock',
    title: '1. Purpose',
    content: (
      <p className="text-gray-600 leading-relaxed ml-12">
        The initiative aims to empower talented youth-led creators by offering financial support, 
        free retail exposure, and a structured commercial partnership to scale their creations through the FOREMADE platform.
      </p>
    )
  },
  {
    icon: 'bx-briefcase',
    title: '2. Project Scope',
    content: (
      <div className="ml-12 space-y-3">
        <div className="flex items-center">
          <i className="bx bx-dollar-circle text-indigo-500 mr-2"></i>
          <span className="text-gray-600">Provide initial funding for production setup</span>
        </div>
        <div className="flex items-center">
          <i className="bx bx-store text-indigo-500 mr-2"></i>
          <span className="text-gray-600">Offer access to online retail infrastructure</span>
        </div>
        <div className="flex items-center">
          <i className="bx bx-trending-up text-indigo-500 mr-2"></i>
          <span className="text-gray-600">Co-market the Creator's selected product lines through web and social campaigns</span>
        </div>
        <div className="flex items-center">
          <i className="bx bx-shield-check text-indigo-500 mr-2"></i>
          <span className="text-gray-600">
            Retain co-ownership of the empowered product lines <strong className="text-indigo-600">until 10,000 units are sold</strong>
          </span>
        </div>
      </div>
    )
  },
  {
    icon: 'bx-time',
    title: '3. Duration & Termination',
    content: (
      <div className="ml-12 space-y-3">
        <div className="flex items-center">
          <i className="bx bx-calendar text-indigo-500 mr-2"></i>
          <span className="text-gray-600">The partnership runs until a total of <strong className="text-indigo-600">10,000 units</strong> have been sold</span>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4 mt-3">
          <div className="font-medium text-indigo-700 mb-2">After reaching this threshold:</div>
          <div className="space-y-2 text-sm">
            <div className="flex items-center">
              <i className="bx bx-crown text-indigo-500 mr-2"></i>
              <span className="text-gray-600">Creator retains <strong className="text-indigo-600">100% ownership</strong></span>
            </div>
            <div className="flex items-center">
              <i className="bx bx-no-entry text-indigo-500 mr-2"></i>
              <span className="text-gray-600">FOREMADE no longer shares in profits</span>
            </div>
            <div className="flex items-center">
              <i className="bx bx-wallet text-indigo-500 mr-2"></i>
              <span className="text-gray-600">50% of capital funding is retained by the Creator</span>
            </div>
            <div className="flex items-center">
              <i className="bx bx-refresh text-indigo-500 mr-2"></i>
              <span className="text-gray-600">Option to renew under revised terms</span>
            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: 'bx-pie-chart-alt',
    title: '4. Profit Sharing',
    content: (
      <div className="ml-12 space-y-3">
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center">
            <i className="bx bx-line-chart text-indigo-500 mr-2"></i>
            <span className="text-gray-700"><strong>0–10,000 units:</strong> Creator gets <strong className="text-indigo-600">40% net profit</strong></span>
          </div>
        </div>
        <div className="bg-indigo-50 rounded-lg p-4">
          <div className="flex items-center">
            <i className="bx bx-trending-up text-indigo-500 mr-2"></i>
            <span className="text-gray-700"><strong>Post-10,000 units:</strong> Creator gets <strong className="text-indigo-600">60%</strong>, FOREMADE gets <strong className="text-indigo-600">40%</strong> (if agreement continues)</span>
          </div>
        </div>
      </div>
    )
  },
  {
    icon: 'bx-money',
    title: '5. Capital Funding',
    content: (
      <div className="ml-12 space-y-3">
        <div className="flex items-center">
          <i className="bx bx-package text-indigo-500 mr-2"></i>
          <span className="text-gray-600">Initial setup costs covered by FOREMADE</span>
        </div>
        <div className="flex items-center">
          <i className="bx bx-repeat text-indigo-500 mr-2"></i>
          <span className="text-gray-600">Performance-based funding adjustments</span>
        </div>
        <div className="flex items-center">
          <i className="bx bx-coin-stack text-indigo-500 mr-2"></i>
          <span className="text-gray-600">Materials and packaging support included</span>
        </div>
      </div>
    )
  },
  {
    icon: 'bx-refresh',
    title: '6. Continuation Clause',
    content: (
      <div className="ml-12 space-y-3">
        <div className="flex items-center">
          <i className="bx bx-copyright text-indigo-500 mr-2"></i>
          <span className="text-gray-600">Creator retains intellectual property rights</span>
        </div>
        <div className="flex items-center">
          <i className="bx bx-package text-indigo-500 mr-2"></i>
          <span className="text-gray-600">FOREMADE continues logistics support</span>
        </div>
        <div className="flex items-center">
          <i className="bx bx-calendar-check text-indigo-500 mr-2"></i>
          <span className="text-gray-600">Quarterly performance reviews</span>
        </div>
      </div>
    )
  },
  {
    icon: 'bx-package',
    title: '7. Product Standards',
    content: (
      <p className="text-gray-600 text-sm leading-relaxed ml-12">
        All products must meet agreed quality standards. Packaging design must align with youth-focused branding 
        and maintain consistency with the Creator's vision while meeting FOREMADE's marketplace requirements.
      </p>
    )
  },
  {
    icon: 'bx-bullhorn',
    title: '8. Marketing & Branding',
    content: (
      <p className="text-gray-600 text-sm leading-relaxed ml-12">
        Products will be featured prominently on the "Empowered Creators" section. All marketing materials 
        will include Creator credits and cultural storytelling elements to maintain authenticity.
      </p>
    )
  },
  {
    icon: 'bx-exit',
    title: '9. Termination Clause',
    content: (
      <div className="ml-12 space-y-3">
        <div className="flex items-center">
          <i className="bx bx-time text-indigo-500 mr-2"></i>
          <span className="text-gray-600">14 days notice required</span>
        </div>
        <div className="flex items-center">
          <i className="bx bx-calculator text-indigo-500 mr-2"></i>
          <span className="text-gray-600">Fair reconciliation of funding and inventory</span>
        </div>
      </div>
    )
  },
  {
    icon: 'bx-balance-scale',
    title: '10. Dispute Resolution',
    content: (
      <div className="ml-12 space-y-3">
        <div className="flex items-center">
          <i className="bx bx-conversation text-indigo-500 mr-2"></i>
          <span className="text-gray-600">Mediation as primary resolution method</span>
        </div>
        <div className="flex items-center">
          <i className="bx bx-book-open text-indigo-500 mr-2"></i>
          <span className="text-gray-600">Local jurisdiction laws apply</span>
        </div>
        <p className="text-gray-600 text-sm mt-2">
          <strong>Note:</strong> All disputes will be handled in accordance with the laws applicable to your country of operation.
        </p>
      </div>
    )
  }
];

export default YouthEmpowermentTerm;
