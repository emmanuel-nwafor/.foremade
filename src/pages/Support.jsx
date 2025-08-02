import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../contexts/AuthContext';

const Support = () => {
  const [activeTab, setActiveTab] = useState('contact');
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [loading, setLoading] = useState(false);   
  const { user } = useAuth ? useAuth() : { user: null };

  // FAQ data
  const faqItems = [
    {
      question: "How do I place an order?",
      answer: "To place an order, browse our products, add items to your cart, and proceed to checkout. You'll need to provide shipping and payment information to complete your order."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept various payment methods including credit/debit cards, bank transfers, and digital wallets. All payments are processed securely through our payment partners."
    },
    {
      question: "How can I track my order?",
      answer: "Once your order is shipped, you'll receive a tracking number via email. You can also view your order status and tracking information in your account under 'My Orders'."
    },
    {
      question: "What is your return policy?",
      answer: "We offer a 30-day return policy for most items. Products must be in original condition with all packaging. Some restrictions may apply to certain categories."
    },
    {
      question: "How long does shipping take?",
      answer: "Standard shipping typically takes 3-7 business days within the country. International shipping may take 7-14 business days. Express shipping options are available at checkout."
    },
    {
      question: "Do you ship internationally?",
      answer: "Yes, we ship to most countries worldwide. International shipping costs and delivery times vary by location."
    },
    {
      question: "How do I become a seller on Foremade?",
      answer: "To become a seller, create an account and click on 'Become a Seller' in your profile. You'll need to complete the seller application and verification process."
    },
    {
      question: "What are Foremade's fees for sellers?",
      answer: "Our seller fees include a small listing fee and a commission on sales. The exact fee structure depends on your seller level and product category."
    }
  ];

  // Privacy & Terms sections
  const policyLinks = [
    { name: "Privacy Policy", url: "/privacy-policy" },
    { name: "Terms & Conditions", url: "/terms-conditions" },
    { name: "Seller Agreement", url: "/seller-agreement" },
    { name: "Shipping Policy", url: "/shipping-policy" }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({ ...prevData, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Real API call
      const backendUrl = import.meta.env.VITE_BACKEND_URL || '';
      console.log('Submitting to:', `${backendUrl}/api/support-request`, formData);
      let idToken = null;
      if (user) {
        idToken = await user.getIdToken();
      }
      const response = await fetch(`${backendUrl}/api/support-request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          ...(idToken ? { 'Authorization': `Bearer ${idToken}` } : {})
        },
        body: JSON.stringify(formData),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to send message. Please try again later.');
      }
      toast.success('Your message has been sent! Our support team will get back to you soon.');
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error(error.message || "Failed to send message. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const toggleAccordion = (index) => {
    setActiveAccordion(activeAccordion === index ? null : index);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <motion.h1 
        className="text-2xl md:text-3xl font-bold text-center mb-8"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        Customer Support Center
      </motion.h1>

      {/* Tab Navigation */}
      <div className="flex justify-center mb-8">
      <div className="inline-flex bg-background-light rounded-lg p-1 border border-border-light">
          {['contact', 'faq', 'policies'].map((tab) => (
            <motion.button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-md ${
                activeTab === tab 
                  ? 'bg-gray text-black' 
                  : 'bg-transparent text-secondary hover:bg-background-dark'
              } transition-all duration-200 text-sm md:text-base font-medium`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              {tab === 'contact' && 'Contact Us'}
              {tab === 'faq' && 'FAQs'}
              {tab === 'policies' && 'Policies'}
            </motion.button>
          ))}
        </div>
      </div>

      {/* Contact Form */}
      {activeTab === 'contact' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-2xl mx-auto"
        >
          <div className="bg-background-light rounded-lg shadow-md p-6 mb-8 border border-border-light">
            <h2 className="text-xl font-semibold mb-4 text-primary">Get in Touch</h2>
            <p className="text-secondary mb-6">
              Have a question or need assistance? Fill out the form below and our support team will get back to you as soon as possible.
            </p>
            
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-secondary mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full p-2 border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-secondary mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full p-2 border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                    required
                  />
                </div>
              </div>
              
              <div className="mb-4">
                <label htmlFor="subject" className="block text-sm font-medium text-secondary mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                className="w-full p-2 border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                />
              </div>
              
              <div className="mb-6">
                <label htmlFor="message" className="block text-sm font-medium text-secondary mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  rows="5"
                className="w-full p-2 border border-border-light rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  required
                ></textarea>
              </div>
              
              <motion.button
                type="submit"
                disabled={loading}
                className={`w-full py-2 px-4 ${
                  loading ? 'bg-primary/70' : 'bg-primary hover:bg-primary/80'
                } text-white rounded-md transition-colors duration-200 flex items-center justify-center`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {loading ? (
                  <>
                    <span className="mr-2">Sending...</span>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </>
                ) : (
                  'Send Message'
                )}
              </motion.button>
            </form>
          </div>
          
          <div className="bg-background-light rounded-lg shadow-md p-6 border border-border-light">
            <h2 className="text-xl font-semibold mb-4 text-primary">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full text-primary">
                  <i className="bx bx-envelope text-xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-md font-medium text-secondary">Email</h3>
                  <p className="text-primary hover:underline">support@foremade.com</p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-primary/10 p-3 rounded-full text-primary">
                  <i className="bx bx-map text-xl"></i>
                </div>
                <div className="ml-4">
                  <h3 className="text-md font-medium text-secondary">Address</h3>
                  <p className="text-secondary">United Kingdom</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* FAQs */}
      {activeTab === 'faq' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="max-w-3xl mx-auto"
        >
          <h2 className="text-xl font-semibold mb-6 text-center">Frequently Asked Questions</h2>
          
          <div className="space-y-4">
            {faqItems.map((faq, index) => (
              <motion.div 
                key={index}
                className="border border-border-light rounded-lg overflow-hidden bg-background-light"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <button
                  className="w-full px-6 py-4 text-left bg-background-light hover:bg-background-dark flex justify-between items-center"
                  onClick={() => toggleAccordion(index)}
                >
                  <span className="font-medium text-primary">{faq.question}</span>
                  <motion.i 
                    className={`bx ${activeAccordion === index ? 'bx-minus' : 'bx-plus'} text-primary`}
                    animate={{ rotate: activeAccordion === index ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  ></motion.i>
                </button>
                
                <motion.div 
                  className="px-6 pb-4"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ 
                    height: activeAccordion === index ? 'auto' : 0,
                    opacity: activeAccordion === index ? 1 : 0
                  }}
                  transition={{ duration: 0.3 }}
                  style={{ overflow: 'hidden' }}
                >
                  <p className="text-secondary">{faq.answer}</p>
                </motion.div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-secondary mb-4">Can't find what you're looking for?</p>
            <motion.button
              onClick={() => setActiveTab('contact')}
              className="px-6 py-2 bg-primary text-white rounded-md hover:bg-primary/80 transition-colors duration-200"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Contact Support
            </motion.button>
          </div>
        </motion.div>
      )}

      {/* Policies */}
      {activeTab === 'policies' && (
        <div className="max-w-3xl mx-auto">
          <h2 className="text-xl font-semibold mb-6 text-center">Policies & Terms</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {policyLinks.map((policy, index) => (
              <Link
                key={index}
                to={policy.url}
                className="bg-background-light rounded-lg shadow-md p-6 flex flex-col items-center hover:shadow-lg transition-shadow duration-200 hover:text-primary border border-border-light"
              >
                <div className="bg-primary/10 p-4 rounded-full text-primary mb-4">
                  <i className="bx bx-file text-2xl"></i>
                </div>
                <h3 className="text-lg font-medium text-primary">{policy.name}</h3>
                <p className="text-secondary mt-2 flex items-center">
                  Read more
                  <i className="bx bx-right-arrow-alt ml-1 text-primary"></i>
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;