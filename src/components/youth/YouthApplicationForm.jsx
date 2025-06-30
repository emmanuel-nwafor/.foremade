import React, { useState } from 'react';
import { Users, User, ChevronDown, ArrowRight, Target, Lightbulb, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CustomAlert, { useAlerts } from '../common/CustomAlert';

const YouthApplicationForm = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    // Step 1: Personal Info
    fullName: '',
    age: '',
    email: '',
    // Step 2: Business Vision
    businessIdea: '',
    motivation: '',
    relevantExperience: '',
    // Step 3: Goals & Support
    expectedChallenges: '',
    twelveMonthGoals: '',
    supportNeeded: ''
  });

  const [errors, setErrors] = useState({});
  const { alerts, addAlert, removeAlert } = useAlerts();

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    // Clear error when user types
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.fullName) newErrors.fullName = 'Name is required';
      if (!formData.age) newErrors.age = 'Age is required';
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Invalid email';
    }
    
    if (step === 2) {
      if (!formData.businessIdea) newErrors.businessIdea = 'Business idea is required';
      if (!formData.motivation) newErrors.motivation = 'Motivation is required';
      if (!formData.relevantExperience) newErrors.relevantExperience = 'Relevant experience is required';
    }
    
    if (step === 3) {
      if (!formData.expectedChallenges) newErrors.expectedChallenges = 'Expected challenges is required';
      if (!formData.twelveMonthGoals) newErrors.twelveMonthGoals = '12-month goals is required';
      if (!formData.supportNeeded) newErrors.supportNeeded = 'Support needed is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (validateStep(currentStep)) {
      if (currentStep < 3) {
        setCurrentStep(prev => prev + 1);
      } else {
        // Handle final submission
        await handleSubmit();
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    
    try {
      // Enhanced console logging with detailed information
      const submissionData = {
        ...formData,
        submittedAt: new Date().toISOString(),
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        formType: 'Youth Empowerment Application'
      };

      console.log('=== YOUTH EMPOWERMENT FORM SUBMISSION ===');
      console.log('Form Data:', submissionData);
      console.log('Submission Time:', new Date().toLocaleString());
      console.log('Total Fields:', Object.keys(formData).length);
      console.log('==========================================');

      // Make API call to /api/youth-empowerment
      console.log('Sending data to /api/youth-empowerment...');
      
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'https://foremade-backend.onrender.com';
      const response = await fetch(`${backendUrl}/api/youth-empowerment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(submissionData),
      });

      console.log('API Response Status:', response.status);
      console.log('API Response Headers:', Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error Response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      const result = await response.json();
      console.log('API Success Response:', result);
      console.log('=== SUBMISSION COMPLETED SUCCESSFULLY ===');

      // Show success message
      addAlert('Application submitted successfully! We will review your application and get back to you soon.', 'success');
      
      // Reset form
      setFormData({
        fullName: '',
        age: '',
        email: '',
        businessIdea: '',
        motivation: '',
        relevantExperience: '',
        expectedChallenges: '',
        twelveMonthGoals: '',
        supportNeeded: ''
      });
      setCurrentStep(1);

    } catch (error) {
      console.error('=== SUBMISSION ERROR ===');
      console.error('Error Details:', error);
      console.error('Error Message:', error.message);
      console.error('Error Stack:', error.stack);
      console.error('=======================');
      
      addAlert('There was an error submitting your application. Please try again or contact support at support@foremade.com', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStepContent = () => {
    const variants = {
      enter: { x: 50, opacity: 0 },
      center: { x: 0, opacity: 1 },
      exit: { x: -50, opacity: 0 }
    };

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {currentStep === 1 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="mb-6 text-center">
                <User className="w-6 h-6 text-neutral-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-neutral-800 mb-2">Personal Information</h2>
                <p className="text-neutral-600">Let's start with the basics</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.fullName}
                  onChange={(e) => handleInputChange('fullName', e.target.value)}
                  className={`w-full px-4 py-3 sm:py-3.5 border rounded-xl text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent transition-all ${errors.fullName ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Age <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter your age"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className={`w-full px-4 py-3 sm:py-3.5 border rounded-xl text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent transition-all pr-12 ${errors.age ? 'border-red-500' : 'border-gray-300'}`}
                  />
                  <ChevronDown className="absolute right-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                </div>
                {errors.age && <p className="text-red-500 text-xs mt-1">{errors.age}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  placeholder="your.email@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={`w-full px-4 py-3 sm:py-3.5 border rounded-xl text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent transition-all ${errors.email ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="mb-6 text-center">
                <Lightbulb className="w-6 h-6 text-neutral-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-neutral-800 mb-2">Your Business Vision</h2>
                <p className="text-neutral-600">Tell us about your entrepreneurial journey</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Business Idea <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Describe your business idea in detail..."
                  value={formData.businessIdea}
                  onChange={(e) => handleInputChange('businessIdea', e.target.value)}
                  rows={4}
                  className={`w-full px-4 py-3 sm:py-3.5 border rounded-xl text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent transition-all resize-none ${errors.businessIdea ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.businessIdea && <p className="text-red-500 text-xs mt-1">{errors.businessIdea}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Motivation <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="What drives you to pursue this business opportunity?"
                  value={formData.motivation}
                  onChange={(e) => handleInputChange('motivation', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-3 sm:py-3.5 border rounded-xl text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent transition-all resize-none ${errors.motivation ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.motivation && <p className="text-red-500 text-xs mt-1">{errors.motivation}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Relevant Experience <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="Share any relevant experience, skills, or background..."
                  value={formData.relevantExperience}
                  onChange={(e) => handleInputChange('relevantExperience', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-3 sm:py-3.5 border rounded-xl text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent transition-all resize-none ${errors.relevantExperience ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.relevantExperience && <p className="text-red-500 text-xs mt-1">{errors.relevantExperience}</p>}
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4 sm:space-y-6">
              <div className="mb-6 text-center">
                <Target className="w-6 h-6 text-neutral-500 mx-auto mb-3" />
                <h2 className="text-xl font-bold text-neutral-800 mb-2">Goals & Support</h2>
                <p className="text-neutral-600">Help us understand how we can support your success</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Expected Challenges <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="What obstacles do you anticipate in your entrepreneurial journey?"
                  value={formData.expectedChallenges}
                  onChange={(e) => handleInputChange('expectedChallenges', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-3 sm:py-3.5 border rounded-xl text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent transition-all resize-none ${errors.expectedChallenges ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.expectedChallenges && <p className="text-red-500 text-xs mt-1">{errors.expectedChallenges}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  12-Month Goals <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="What do you aim to achieve in the next 12 months?"
                  value={formData.twelveMonthGoals}
                  onChange={(e) => handleInputChange('twelveMonthGoals', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-3 sm:py-3.5 border rounded-xl text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent transition-all resize-none ${errors.twelveMonthGoals ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.twelveMonthGoals && <p className="text-red-500 text-xs mt-1">{errors.twelveMonthGoals}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Support Needed from Foremade <span className="text-red-500">*</span>
                </label>
                <textarea
                  placeholder="What specific support, resources, or guidance would be most valuable to you?"
                  value={formData.supportNeeded}
                  onChange={(e) => handleInputChange('supportNeeded', e.target.value)}
                  rows={3}
                  className={`w-full px-4 py-3 sm:py-3.5 border rounded-xl text-gray-900 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:border-transparent transition-all resize-none ${errors.supportNeeded ? 'border-red-500' : 'border-gray-300'}`}
                />
                {errors.supportNeeded && <p className="text-red-500 text-xs mt-1">{errors.supportNeeded}</p>}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    );
  };

  return (
    <div className="relative">
      <CustomAlert alerts={alerts} removeAlert={removeAlert} />
      <div className="min-h-screen bg-neutral-50 py-6 px-4 sm:py-8 md:py-12 lg:py-16">
        <div className="max-w-md lg:max-w-2xl xl:max-w-3xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8 sm:mb-10 lg:mb-12">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-4 sm:mb-6">
              <Users className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-neutral-900 mb-3 sm:mb-4 leading-tight">
              Youth Empowerment<br />Program
            </h1>
            <p className="text-neutral-600 text-sm sm:text-base lg:text-lg leading-relaxed max-w-2xl mx-auto">
              Join our exclusive community of ambitious young entrepreneurs and creators.
            </p>
          </div>

          {/* Progress Steps */}
          <div className="flex justify-center items-center gap-2 sm:gap-4 lg:gap-6 mb-8 sm:mb-10 max-w-lg mx-auto">
            {[1, 2, 3].map((step, index) => (
              <React.Fragment key={step}>
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center transition-all
                    ${currentStep > step ? 'bg-black text-white' : 
                      currentStep === step ? 'bg-black text-white' : 'bg-neutral-200 text-neutral-600'}`}
                >
                  {currentStep > step ? (
                    <CheckCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <span className="text-sm sm:text-base font-bold">{step}</span>
                  )}
                </div>
                {index < 2 && (
                  <div className={`w-8 sm:w-12 h-0.5 transition-all ${
                    currentStep > step + 1 ? 'bg-black' : 'bg-neutral-200'
                  }`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl p-4 sm:p-6 lg:p-8 shadow-xl shadow-neutral-200/50 mb-6">
            {renderStepContent()}

            {/* Navigation Buttons */}
            <div className="flex gap-3 mt-6 sm:mt-8 lg:mt-10">
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  className="flex-1 px-4 py-3 sm:py-4 border border-neutral-300 rounded-xl font-semibold text-neutral-600 hover:bg-neutral-50 transition-colors lg:text-lg"
                >
                  Previous
                </button>
              )}
              <button
                onClick={handleContinue}
                disabled={isSubmitting}
                className={`flex-1 bg-black text-white py-3 sm:py-4 px-6 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors lg:text-lg ${
                  isSubmitting 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'hover:bg-neutral-800'
                }`}
              >
                {currentStep === 3 ? (
                  isSubmitting ? (
                    <>
                      Submitting...
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    </>
                  ) : (
                    <>
                      Submit Application
                      <CheckCircle className="w-4 h-4" />
                    </>
                  )
                ) : (
                  <>
                    Continue
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center">
            <p className="text-xs sm:text-sm lg:text-base text-neutral-500">
              Questions? Contact us at{' '}
              <span className="text-black font-medium hover:underline">support@foremade.com</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default YouthApplicationForm;