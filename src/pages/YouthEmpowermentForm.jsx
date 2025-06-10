import React, { useState } from 'react';

const YouthEmpowermentForm = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    age: '',
    businessIdea: '',
    motivation: '',
    experience: '',
    challenges: '',
    goals: '',
    supportNeeded: ''
  });

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 3;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    // Add your form submission logic here
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-12">
      {[1, 2, 3].map((step) => (
        <div key={step} className="flex items-center">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${
              step <= currentStep
                ? 'bg-slate-900 text-white'
                : 'bg-slate-200 text-slate-500'
            }`}
          >
            {step < currentStep ? <CheckCircle size={20} /> : step}
          </div>
          {step < 3 && (
            <div
              className={`w-16 h-0.5 mx-4 ${
                step < currentStep ? 'bg-slate-900' : 'bg-slate-200'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Users className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Personal Information</h2>
        <p className="text-slate-600">Let's start with the basics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Full Name *
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-white"
            placeholder="Enter your full name"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-3">
            Age *
          </label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-white"
            placeholder="Enter your age"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Email Address *
        </label>
        <input
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-white"
          placeholder="your.email@example.com"
          required
        />
      </div>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Lightbulb className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Your Business Vision</h2>
        <p className="text-slate-600">Tell us about your entrepreneurial journey</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Business Idea *
        </label>
        <textarea
          name="businessIdea"
          value={formData.businessIdea}
          onChange={handleChange}
          rows="4"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-white resize-none"
          placeholder="Describe your business idea in detail..."
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Motivation *
        </label>
        <textarea
          name="motivation"
          value={formData.motivation}
          onChange={handleChange}
          rows="3"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-white resize-none"
          placeholder="What drives you to pursue this business opportunity?"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Relevant Experience *
        </label>
        <textarea
          name="experience"
          value={formData.experience}
          onChange={handleChange}
          rows="3"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-white resize-none"
          placeholder="Share any relevant experience, skills, or background..."
          required
        />
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Target className="w-12 h-12 text-slate-700 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Goals & Support</h2>
        <p className="text-slate-600">Help us understand how we can support your success</p>
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Expected Challenges *
        </label>
        <textarea
          name="challenges"
          value={formData.challenges}
          onChange={handleChange}
          rows="3"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-white resize-none"
          placeholder="What obstacles do you anticipate in your entrepreneurial journey?"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          12-Month Goals *
        </label>
        <textarea
          name="goals"
          value={formData.goals}
          onChange={handleChange}
          rows="3"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-white resize-none"
          placeholder="What do you aim to achieve in the next 12 months?"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-semibold text-slate-700 mb-3">
          Support Needed from Foremade *
        </label>
        <textarea
          name="supportNeeded"
          value={formData.supportNeeded}
          onChange={handleChange}
          rows="4"
          className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-transparent transition-all duration-200 bg-white resize-none"
          placeholder="What specific support, resources, or guidance would be most valuable to you?"
          required
        />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-900 rounded-2xl mb-6">
            <Users className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Youth Empowerment Program
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Join our exclusive community of ambitious young entrepreneurs and creators. 
            Take the first step towards building your future.
          </p>
        </div>

        {/* Main Form Card */}
        <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
          <div className="px-8 py-12 sm:px-12">
            {renderStepIndicator()}
            
            <div>
              {currentStep === 1 && renderStep1()}
              {currentStep === 2 && renderStep2()}
              {currentStep === 3 && renderStep3()}

              {/* Navigation Buttons */}
              <div className="flex justify-between items-center mt-12 pt-8 border-t border-slate-200">
                <button
                  type="button"
                  onClick={prevStep}
                  className={`px-6 py-3 text-slate-600 font-medium rounded-lg transition-colors duration-200 ${
                    currentStep === 1 
                      ? 'invisible' 
                      : 'hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  Previous
                </button>

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={nextStep}
                    className="inline-flex items-center px-8 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all duration-200 group"
                  >
                    Continue
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="inline-flex items-center px-8 py-3 bg-slate-900 text-white font-semibold rounded-lg hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 transition-all duration-200 group"
                  >
                    Submit Application
                    <CheckCircle className="ml-2 w-4 h-4 group-hover:scale-110 transition-transform duration-200" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-slate-500 text-sm">
            Questions? Contact us at{' '}
            <a href="mailto:support@foremade.com" className="text-slate-700 hover:text-slate-900 transition-colors duration-200">
              support@foremade.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default YouthEmpowermentForm;