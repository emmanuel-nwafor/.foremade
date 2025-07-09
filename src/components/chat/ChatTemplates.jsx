import React from 'react';

export const templates = {
  seller: {
    orderConfirmation: 'Your order has been confirmed and will ship soon!',
    shippingUpdate: 'Your order has been shipped. Tracking ID: [TRACKING_ID].',
    issueResponse: 'We’re sorry for the inconvenience. Please share more details so we can assist you.',
    refundProcessed: 'Your refund has been processed and will reflect in 3-5 business days.',
    productInquiry: 'Thank you for your inquiry! Can you specify which product details you need?',
    deliveryDelay: 'We apologize for the delay. Your order is expected to arrive by [DATE].',
    outOfStock: 'The item is currently out of stock. We’ll notify you when it’s available.',
    orderReceived: 'We’ve received your order and are processing it now.',
    paymentIssue: 'There was an issue with your payment. Please verify your payment details.',
    productDamaged: 'Please send us images of the damaged product so we can process a replacement.',
    thankYou: 'Thank you for shopping with us! Let us know if you need further assistance.',
    customRequest: 'We’ve noted your custom request. We’ll get back to you shortly.'
  },
  buyer: {
    orderStatus: 'Can you provide an update on my order status?',
    shippingQuery: 'When will my order be shipped?',
    productQuestion: 'Can you share more details about the product?',
    returnRequest: 'I’d like to request a return for my order.',
    paymentIssue: 'I’m having trouble with the payment. Can you assist?',
    deliveryIssue: 'My order hasn’t arrived yet. Can you check on it?',
    productDamage: 'The product I received is damaged. How can I proceed?',
    refundStatus: 'Can you confirm the status of my refund?',
    cancelOrder: 'I’d like to cancel my order. Is that possible?',
    sizeIssue: 'The product doesn’t fit. Can I exchange it?',
    qualityConcern: 'I’m not satisfied with the product quality. Can we discuss this?',
    customRequest: 'I have a special request regarding my order. Can you help?'
  }
};

const ChatTemplates = ({ role, onSelect, selectedTemplate }) => {
  return (
    <div className="relative">
      <select
        value={selectedTemplate}
        onChange={(e) => onSelect(e.target.value)}
        className="w-full p-2 rounded-lg bg-gray-100 text-gray-800 border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
        aria-label="Select a message template"
      >
        <option value="">Select a message template</option>
        {Object.keys(templates[role] || {}).map((key) => (
          <option key={key} value={key}>
            {templates[role][key]}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ChatTemplates;
