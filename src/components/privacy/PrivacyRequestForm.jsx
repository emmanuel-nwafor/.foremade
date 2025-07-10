import React, { useState } from 'react';
import { toast } from 'react-toastify';

const PrivacyRequestForm = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [formData, setFormData] = useState({
    requestType: '',
    fullName: '',
    email: '',
    phone: '',
    region: '',
    requestDetails: '',
    additionalInfo: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestTypes = [
    { value: 'access', label: 'Access My Data', description: 'Get a copy of all personal data we hold about you' },
    { value: 'correction', label: 'Correct My Data', description: 'Update or correct inaccurate personal information' },
    { value: 'deletion', label: 'Delete My Data', description: 'Request deletion of your personal data (Right to be Forgotten)' },
    { value: 'restriction', label: 'Restrict Processing', description: 'Limit how we process your personal data' },
    { value: 'portability', label: 'Data Portability', description: 'Receive your data in a structured, machine-readable format' },
    { value: 'objection', label: 'Object to Processing', description: 'Object to processing based on legitimate interests' },
    { value: 'withdraw', label: 'Withdraw Consent', description: 'Withdraw previously given consent for data processing' },
    { value: 'complaint', label: 'File a Complaint', description: 'Report privacy concerns or violations' }
  ];

  const regions = [
    { value: 'eu', label: 'European Union (GDPR)' },
    { value: 'uk', label: 'United Kingdom (UK GDPR)' },
    { value: 'nigeria', label: 'Nigeria (NDPR)' },
    { value: 'us', label: 'United States (CCPA/CPRA)' },
    { value: 'canada', label: 'Canada (PIPEDA)' },
    { value: 'australia', label: 'Australia (Privacy Act)' },
    { value: 'singapore', label: 'Singapore (PDPA)' },
    { value: 'other', label: 'Other Region' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.requestType || !formData.fullName || !formData.email) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    
    // Simulate API call
    setTimeout(() => {
      toast.success('Privacy request submitted successfully! We will respond within 30 days.');
      setFormData({
        requestType: '',
        fullName: '',
        email: '',
        phone: '',
        region: '',
        requestDetails: '',
        additionalInfo: ''
      });
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-8">
      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
        <div className="bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('requests')}
            className={`px-6 py-2 rounded-md transition-colors ${
              activeTab === 'requests'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Privacy Requests
          </button>
          <button
            onClick={() => setActiveTab('contact')}
            className={`px-6 py-2 rounded-md transition-colors ${
              activeTab === 'contact'
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Contact DPO
          </button>
        </div>
      </div>

      {/* Tab Content */}
      {activeTab === 'requests' && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Submit Privacy Request</h3>
          
          {/* Request Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Request Type *
            </label>
            <div className="grid md:grid-cols-2 gap-4">
              {requestTypes.map((type) => (
                <label key={type.value} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="requestType"
                    value={type.value}
                    checked={formData.requestType === type.value}
                    onChange={handleInputChange}
                    className="mt-1"
                  />
                  <div>
                    <div className="font-medium text-gray-900">{type.label}</div>
                    <div className="text-sm text-gray-600">{type.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number (Optional)
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Region *
              </label>
              <select
                name="region"
                value={formData.region}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select your region</option>
                {regions.map((region) => (
                  <option key={region.value} value={region.value}>
                    {region.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Request Details */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Request Details *
            </label>
            <textarea
              name="requestDetails"
              value={formData.requestDetails}
              onChange={handleInputChange}
              rows="4"
              placeholder="Please provide specific details about your request..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* Email Verification Notice */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-start space-x-3">
              <i className="bx bx-info-circle text-blue-600 text-xl mt-0.5"></i>
              <div>
                <h4 className="font-semibold text-blue-900 mb-1">Email Verification</h4>
                <p className="text-sm text-blue-700">
                  We will verify your identity via email at <strong>{formData.email}</strong>. 
                  Please check your inbox for a verification link after submitting this request.
                </p>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Information (Optional)
            </label>
            <textarea
              name="additionalInfo"
              value={formData.additionalInfo}
              onChange={handleInputChange}
              rows="3"
              placeholder="Any additional context or specific requirements..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-semibold"
            >
              {isSubmitting ? (
                <span className="flex items-center">
                  <i className="bx bx-loader-alt animate-spin mr-2"></i>
                  Submitting...
                </span>
              ) : (
                'Submit Request'
              )}
            </button>
          </div>
        </form>
      )}

      {activeTab === 'contact' && (
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-gray-900 mb-6">Contact Data Protection Officer</h3>
          
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <h4 className="font-semibold text-blue-900 mb-3">Email Contact</h4>
              <p className="text-blue-700 mb-4">For privacy-related inquiries and support:</p>
              <a 
                href="mailto:privacy@foremade.com" 
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                privacy@foremade.com
              </a>
            </div>
            
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-900 mb-3">Response Time</h4>
              <p className="text-green-700 mb-2">We aim to respond to all privacy requests within:</p>
              <ul className="text-green-700 text-sm space-y-1">
                <li>• Initial acknowledgment: 24 hours</li>
                <li>• Full response: 30 days</li>
                <li>• Complex requests: 60 days</li>
              </ul>
            </div>
          </div>

          <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
            <h4 className="font-semibold text-yellow-900 mb-3">Data Protection Officer</h4>
            <div className="text-sm">
              <div className="mb-2">
                <strong className="text-yellow-800">Email:</strong> privacy@foremade.com
              </div>
              <div className="mb-2">
                <strong className="text-yellow-800">Response Time:</strong> Within 24-48 hours
              </div>
              <div>
                <strong className="text-yellow-800">Languages:</strong> English, French, Spanish, Arabic
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PrivacyRequestForm; 