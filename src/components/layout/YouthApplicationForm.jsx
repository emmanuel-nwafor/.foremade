import React, { useState } from 'react';
import { motion } from 'framer-motion';

const YouthApplicationForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    email: '',
    phone: '',
    city: '',
    country: '',
    talentArea: '',
    portfolioLink: '',
    bio: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      // Simulate submission delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Form submission data:', formData);

      setStatus({
        type: 'success',
        message: 'Application submitted successfully! You will receive an email once your application is reviewed.'
      });
      
      // Reset form
      setFormData({
        fullName: '',
        age: '',
        email: '',
        phone: '',
        city: '',
        country: '',
        talentArea: '',
        portfolioLink: '',
        bio: ''
      });
      
    } catch (error) {
      console.error('Error submitting application:', error);
      setStatus({
        type: 'error',
        message: 'Failed to submit application. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8"
    >
      <div className="relative z-10 max-w-2xl mx-auto bg-white shadow-xl rounded-lg p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-8">
            Join the Foremade Youth Creator Program
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input fields */}
            {[
              { label: 'Full Name', name: 'fullName', type: 'text' },
              { label: 'Age', name: 'age', type: 'number' },
              { label: 'Email', name: 'email', type: 'email' },
              { label: 'Phone Number', name: 'phone', type: 'tel' },
              { label: 'City', name: 'city', type: 'text' },
              { label: 'Country', name: 'country', type: 'text' },
              { label: 'Area of Creativity / Business', name: 'talentArea', type: 'text' },
              { label: 'Portfolio Link', name: 'portfolioLink', type: 'url', required: false }
            ].map((field) => (
              <div key={field.name}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                <input
                  type={field.type}
                  name={field.name}
                  required={field.required !== false}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
            ))}

            {/* Bio textarea */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Short Bio / Description
              </label>
              <textarea
                name="bio"
                rows="4"
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
              ></textarea>
            </div>

            {/* Submit button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white 
                  ${isLoading 
                    ? 'bg-indigo-400 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
                  }`}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-2">
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    <span>Submitting...</span>
                  </div>
                ) : 'Submit Application'}
              </button>
            </div>
          </form>

          {/* Status message */}
          {status.message && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-md ${
                status.type === 'success' 
                  ? 'bg-green-50 text-green-800' 
                  : 'bg-red-50 text-red-800'
              }`}
            >
              {status.message}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default YouthApplicationForm;
