import React, { useState } from 'react';
import { toast } from 'react-toastify';

const PrivacyCenter = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [formData, setFormData] = useState({
    requestType: '',
    fullName: '',
    email: '',
    phone: '',
    region: '',
    requestDetails: '',
    verificationMethod: 'email',
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
        verificationMethod: 'email',
        additionalInfo: ''
      });
      setIsSubmitting(false);
    }, 2000);
  };

  const handleDataExport = () => {
    toast.info('Data export feature will be available soon');
  };

  const handleCookieSettings = () => {
    toast.info('Cookie settings will be available soon');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-blue-100 p-4 rounded-2xl">
                <i className="bx bx-shield-check text-4xl text-blue-600"></i>
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 text-gray-900">
              Privacy Center
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Manage your privacy rights and data preferences. Submit requests, control your data, and stay informed about how we protect your information.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1">
            <button
              onClick={() => setActiveTab('requests')}
              className={`px-6 py-3 rounded-md transition-colors ${
                activeTab === 'requests'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Privacy Requests
            </button>
            <button
              onClick={() => setActiveTab('preferences')}
              className={`px-6 py-3 rounded-md transition-colors ${
                activeTab === 'preferences'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Data Preferences
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-6 py-3 rounded-md transition-colors ${
                activeTab === 'tools'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Privacy Tools
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'requests' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Submit Privacy Request</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
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

              {/* Verification Method */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Verification Method
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="verificationMethod"
                      value="email"
                      checked={formData.verificationMethod === 'email'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span>Email verification (recommended)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="verificationMethod"
                      value="phone"
                      checked={formData.verificationMethod === 'phone'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span>SMS verification</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="verificationMethod"
                      value="document"
                      checked={formData.verificationMethod === 'document'}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    <span>Document verification (ID required)</span>
                  </label>
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
          </div>
        )}

        {activeTab === 'preferences' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Data Preferences</h2>
            
            <div className="space-y-6">
              {/* Marketing Preferences */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Marketing Communications</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Email marketing and newsletters</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>SMS notifications and updates</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Push notifications in app</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Personalized product recommendations</span>
                  </label>
                </div>
              </div>

              {/* Data Sharing */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Data Sharing</h3>
                <div className="space-y-3">
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Share data with trusted partners for service improvement</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Allow analytics and performance monitoring</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="mr-3" />
                    <span>Enable location-based services</span>
                  </label>
                </div>
              </div>

              <div className="flex justify-end">
                <button className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tools' && (
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Privacy Tools</h2>
            
            <div className="grid md:grid-cols-2 gap-6">
              {/* Data Export */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <i className="bx bx-download text-2xl text-blue-600 mr-3"></i>
                  <h3 className="text-lg font-semibold text-gray-900">Data Export</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Download a copy of all your personal data in a structured, machine-readable format.
                </p>
                <button
                  onClick={handleDataExport}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Export My Data
                </button>
              </div>

              {/* Cookie Settings */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <i className="bx bx-cookie text-2xl text-yellow-600 mr-3"></i>
                  <h3 className="text-lg font-semibold text-gray-900">Cookie Settings</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Manage your cookie preferences and control how we use tracking technologies.
                </p>
                <button
                  onClick={handleCookieSettings}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
                >
                  Manage Cookies
                </button>
              </div>

              {/* Account Deletion */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <i className="bx bx-trash text-2xl text-red-600 mr-3"></i>
                  <h3 className="text-lg font-semibold text-gray-900">Account Deletion</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  Delete Account
                </button>
              </div>

              {/* Privacy Report */}
              <div className="border border-gray-200 rounded-lg p-6">
                <div className="flex items-center mb-4">
                  <i className="bx bx-report text-2xl text-purple-600 mr-3"></i>
                  <h3 className="text-lg font-semibold text-gray-900">Privacy Report</h3>
                </div>
                <p className="text-gray-600 mb-4">
                  Generate a comprehensive report of your data usage and privacy settings.
                </p>
                <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                  Generate Report
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrivacyCenter; 