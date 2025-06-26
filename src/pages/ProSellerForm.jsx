import React, { useState, useEffect } from "react";
import { CheckCircle, Building, User, Mail, Phone, CreditCard, MapPin, Package, AlertCircle } from "lucide-react";

const ProSellerForm = () => {
  const [formData, setFormData] = useState({
    businessName: "",
    regNumber: "",
    taxRef: "",
    address: "",
    country: "",
    phoneCode: "",
    phone: "",
    email: "",
    manager: "",
    managerEmail: "",
    managerPhone: "",
    productLines: [],
    bankName: "",
    accountName: "",
    accountNumber: "",
    agree: false
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [user, setUser] = useState({ id: 1, name: 'Demo User' }); // Mock user for demo
  const [loading, setLoading] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-orange-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const validateStep = (step) => {
    const newErrors = {};
    
    if (step === 1) {
      if (!formData.businessName) newErrors.businessName = "Business name is required";
      if (!formData.regNumber) newErrors.regNumber = "Registration number is required";
      if (!formData.address) newErrors.address = "Business address is required";
      if (!formData.country) newErrors.country = "Country is required";
    }
    
    if (step === 2) {
      if (!formData.phoneCode) newErrors.phoneCode = "Phone code is required";
      if (!formData.phone) newErrors.phone = "Phone number is required";
      if (!formData.email) newErrors.email = "Email is required";
      if (!formData.manager) newErrors.manager = "Manager name is required";
      if (!formData.managerEmail) newErrors.managerEmail = "Manager email is required";
      if (!formData.managerPhone) newErrors.managerPhone = "Manager phone is required";
    }
    
    if (step === 3) {
      if (!formData.productLines.length) newErrors.productLines = "Select at least one product line";
      if (!formData.bankName) newErrors.bankName = "Bank name is required";
      if (!formData.accountName) newErrors.accountName = "Account name is required";
      if (!formData.accountNumber) newErrors.accountNumber = "Account number is required";
      if (!formData.agree) newErrors.agree = "You must agree to terms and conditions";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else if (name === "productLines") {
      const selected = Array.from(e.target.selectedOptions, option => option.value);
      setFormData({ ...formData, [name]: selected });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors({ ...errors, [name]: null });
    }
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    setCurrentStep(currentStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(3)) return;
    
    setIsSubmitting(true);
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("Form Data Submitted:", formData);
      // Show success message or redirect
    } catch (error) {
      console.error("Submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const steps = [
    { number: 1, title: "Business Info", icon: Building },
    { number: 2, title: "Contact Details", icon: User },
    { number: 3, title: "Products & Banking", icon: Package }
  ];

  const InputField = ({ label, name, type = "text", required = false, icon: Icon, ...props }) => (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-gray-700">
        {Icon && <Icon className="w-4 h-4 mr-2 text-gray-400" />}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={formData[name]}
        onChange={handleChange}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
          errors[name] ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        {...props}
      />
      {errors[name] && (
        <p className="flex items-center text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mr-1" />
          {errors[name]}
        </p>
      )}
    </div>
  );

  const SelectField = ({ label, name, options, required = false, icon: Icon, ...props }) => (
    <div className="space-y-2">
      <label className="flex items-center text-sm font-medium text-gray-700">
        {Icon && <Icon className="w-4 h-4 mr-2 text-gray-400" />}
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <select
        name={name}
        value={formData[name]}
        onChange={handleChange}
        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
          errors[name] ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
        }`}
        {...props}
      >
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
      {errors[name] && (
        <p className="flex items-center text-sm text-red-600">
          <AlertCircle className="w-4 h-4 mr-1" />
          {errors[name]}
        </p>
      )}
    </div>
  );

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Building className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800">Business Information</h3>
        <p className="text-gray-600">Tell us about your business</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <InputField
          label="Business Name"
          name="businessName"
          required
          icon={Building}
          placeholder="Enter your business name"
        />
        <InputField
          label="Business Registration Number"
          name="regNumber"
          required
          placeholder="e.g., RC1234567"
        />
      </div>

      <InputField
        label="Tax Reference Number"
        name="taxRef"
        placeholder="Optional tax reference"
      />

      <div className="space-y-2">
        <label className="flex items-center text-sm font-medium text-gray-700">
          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
          Business Address <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea
          name="address"
          value={formData.address}
          onChange={handleChange}
          rows={4}
          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 ${
            errors.address ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
          }`}
          placeholder="Enter your complete business address"
        />
        {errors.address && (
          <p className="flex items-center text-sm text-red-600">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.address}
          </p>
        )}
      </div>

      <SelectField
        label="Country"
        name="country"
        required
        icon={MapPin}
        options={[
          { value: "", label: "Select Country" },
          { value: "NG", label: "Nigeria" },
          { value: "UK", label: "United Kingdom" },
          { value: "GH", label: "Ghana" },
          { value: "ZA", label: "South Africa" }
        ]}
      />
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <User className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800">Contact Information</h3>
        <p className="text-gray-600">Provide your contact details</p>
      </div>

      <div className="bg-blue-50 p-6 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-4">Business Contact</h4>
        <div className="grid md:grid-cols-2 gap-6">
          <SelectField
            label="Phone Country Code"
            name="phoneCode"
            required
            icon={Phone}
            options={[
              { value: "", label: "Select Code" },
              { value: "+234", label: "+234 (Nigeria)" },
              { value: "+44", label: "+44 (UK)" },
              { value: "+233", label: "+233 (Ghana)" },
              { value: "+27", label: "+27 (South Africa)" }
            ]}
          />
          <InputField
            label="Phone Number"
            name="phone"
            required
            icon={Phone}
            placeholder="e.g., 8012345678"
          />
        </div>
        <div className="mt-4">
          <InputField
            label="Email Address"
            name="email"
            type="email"
            required
            icon={Mail}
            placeholder="business@example.com"
          />
        </div>
      </div>

      <div className="bg-green-50 p-6 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-4">Marketing Manager Details</h4>
        <div className="space-y-4">
          <InputField
            label="Marketing Manager Full Name"
            name="manager"
            required
            icon={User}
            placeholder="Full name of marketing manager"
          />
          <div className="grid md:grid-cols-2 gap-4">
            <InputField
              label="Manager Email"
              name="managerEmail"
              type="email"
              required
              icon={Mail}
              placeholder="manager@example.com"
            />
            <InputField
              label="Manager Phone Number"
              name="managerPhone"
              required
              icon={Phone}
              placeholder="Manager's phone number"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <Package className="w-16 h-16 text-orange-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-gray-800">Products & Banking</h3>
        <p className="text-gray-600">Final details for your registration</p>
      </div>

      <div className="bg-purple-50 p-6 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-4">Product Information</h4>
        <div className="space-y-2">
          <label className="flex items-center text-sm font-medium text-gray-700">
            <Package className="w-4 h-4 mr-2 text-gray-400" />
            Product Line(s) <span className="text-red-500 ml-1">*</span>
          </label>
          <select
            name="productLines"
            multiple
            value={formData.productLines}
            onChange={handleChange}
            className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200 min-h-[120px] ${
              errors.productLines ? 'border-red-500 bg-red-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <option value="fashion">Fashion</option>
            <option value="electronics">Electronics</option>
            <option value="health">Health & Wellness</option>
            <option value="beauty">Beauty</option>
            <option value="homeware">Homeware</option>
            <option value="kids">Kids</option>
            <option value="accessories">Accessories</option>
          </select>
          <p className="text-sm text-gray-500">Hold Ctrl/Cmd to select multiple options</p>
          {errors.productLines && (
            <p className="flex items-center text-sm text-red-600">
              <AlertCircle className="w-4 h-4 mr-1" />
              {errors.productLines}
            </p>
          )}
        </div>
      </div>

      <div className="bg-yellow-50 p-6 rounded-lg">
        <h4 className="font-semibold text-gray-800 mb-4">Banking Information</h4>
        <div className="space-y-4">
          <SelectField
            label="Bank Name"
            name="bankName"
            required
            icon={CreditCard}
            options={[
              { value: "", label: "Select Bank" },
              { value: "GTBank", label: "GTBank" },
              { value: "Access Bank", label: "Access Bank" },
              { value: "Zenith Bank", label: "Zenith Bank" },
              { value: "Barclays", label: "Barclays" },
              { value: "HSBC", label: "HSBC" }
            ]}
          />
          <div className="grid md:grid-cols-2 gap-4">
            <InputField
              label="Account Name"
              name="accountName"
              required
              placeholder="Account holder name"
            />
            <InputField
              label="Account Number"
              name="accountNumber"
              required
              placeholder="Account number"
            />
          </div>
        </div>
      </div>

      <div className="bg-gray-50 p-6 rounded-lg">
        <div className="flex items-start space-x-3">
          <input
            type="checkbox"
            name="agree"
            checked={formData.agree}
            onChange={handleChange}
            className="mt-1 w-5 h-5 text-orange-500 border-gray-300 rounded focus:ring-orange-500"
          />
          <div>
            <label className="text-sm font-medium text-gray-700">
              I agree to the FOREMADE Pro Seller Terms & Conditions
              <span className="text-red-500 ml-1">*</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              By checking this box, you acknowledge that you have read and agree to our terms and conditions.
            </p>
          </div>
        </div>
        {errors.agree && (
          <p className="flex items-center text-sm text-red-600 mt-2">
            <AlertCircle className="w-4 h-4 mr-1" />
            {errors.agree}
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent mb-4">
            FOREMADE Pro Seller
          </h1>
          <p className="text-xl text-gray-600">Join our premium seller network</p>
        </div>

        {/* Progress Steps */}
        <div className="flex justify-center mb-12">
          <div className="flex items-center space-x-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.number;
              const isCompleted = currentStep > step.number;
              
              return (
                <div key={step.number} className="flex items-center">
                  <div className={`flex flex-col items-center ${index > 0 ? 'ml-8' : ''}`}>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted 
                        ? 'bg-green-500 text-white' 
                        : isActive 
                        ? 'bg-orange-500 text-white' 
                        : 'bg-gray-200 text-gray-400'
                    }`}>
                      {isCompleted ? <CheckCircle className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                    </div>
                    <span className={`mt-2 text-sm font-medium ${
                      isActive ? 'text-orange-500' : isCompleted ? 'text-green-500' : 'text-gray-400'
                    }`}>
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div className={`w-16 h-1 mx-4 transition-all duration-300 ${
                      currentStep > step.number ? 'bg-green-500' : 'bg-gray-200'
                    }`} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <form onSubmit={handleSubmit}>
            {currentStep === 1 && renderStep1()}
            {currentStep === 2 && renderStep2()}
            {currentStep === 3 && renderStep3()}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-12 pt-8 border-t border-gray-200">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentStep === 1}
                className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                  currentStep === 1
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Previous
              </button>

              {currentStep < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-8 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:from-orange-600 hover:to-red-600 transition-all duration-200 transform hover:scale-105"
                >
                  Next Step
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-8 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105 ${
                    isSubmitting
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
                  } text-white`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    'Submit Registration'
                  )}
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Help Text */}
        <div className="text-center mt-8 mb-8">
          <p className="text-gray-500">
            Need help? Contact our support team at{' '}
            <a href="mailto:support@foremade.com" className="text-orange-500 hover:underline">
              support@foremade.com
            </a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ProSellerForm;