import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const ChatQuickAccess = ({ recipientName = "Seller", productName = "Product" }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const quickTemplates = {
    buyer: [
      "Hi, I'm interested in this item. Is it still available?",
      "Can you provide more details about the condition?",
      "What's the best price you can offer?",
      "Do you offer shipping to my location?",
      "Can I see more photos of the item?"
    ],
    seller: [
      "Thanks for your interest! Yes, it's still available.",
      "The item is in excellent condition, barely used.",
      "I can offer a 10% discount for quick sale.",
      "Yes, I ship nationwide. Shipping is $5.",
      "I'll send you additional photos right away."
    ]
  };

  const [role, setRole] = useState('buyer');

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200">
      {/* Header */}
      <div className="bg-blue-600 text-white px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Quick Chat with {recipientName}</h3>
            <p className="text-sm text-blue-100">{productName}</p>
          </div>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-100 hover:text-white transition-colors"
          >
            <i className={`bx ${isExpanded ? 'bx-chevron-up' : 'bx-chevron-down'} text-xl`}></i>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Role Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              I am a:
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="buyer"
                  checked={role === 'buyer'}
                  onChange={(e) => setRole(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Buyer</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="seller"
                  checked={role === 'seller'}
                  onChange={(e) => setRole(e.target.value)}
                  className="mr-2"
                />
                <span className="text-sm">Seller</span>
              </label>
            </div>
          </div>

          {/* Quick Templates */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quick Messages:
            </label>
            <div className="space-y-2">
              {quickTemplates[role].map((template, index) => (
                <button
                  key={index}
                  onClick={() => {
                    navigator.clipboard.writeText(template);
                    // You could also trigger a chat here
                  }}
                  className="w-full text-left p-3 bg-gray-50 hover:bg-gray-100 rounded-md text-sm transition-colors"
                >
                  {template}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3 pt-2">
            <Link
              to="/chat-templates"
              className="flex-1 px-4 py-2 bg-blue-600 text-white text-center rounded-md hover:bg-blue-700 transition-colors text-sm"
            >
              More Templates
            </Link>
            <Link
              to="/chat-system"
              className="flex-1 px-4 py-2 bg-gray-600 text-white text-center rounded-md hover:bg-gray-700 transition-colors text-sm"
            >
              Open Chat
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatQuickAccess; 