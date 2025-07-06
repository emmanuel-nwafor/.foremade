import React, { useState, useRef } from 'react';
import { toast } from 'react-toastify';

const chatterTemplates = {
  buyer: {
    'Acknowledged Receipt': "Hi, just confirming that I've received the item. Thank you!",
    'Not As Described': "Hi, I received the item but it's a bit different from what I expected. The [describe issue] isn't quite as shown.",
    'Significantly Not as Described': "Hello, I've received the item, but it's significantly different from the description. It doesn't match the images or details listed.",
    'Product is Damaged': "Hi, the item I received is damaged. It looks like it got affected during delivery. Please advise on next steps.",
    'Not Received': "Hi, I haven't received my item yet. The delivery window has passed.",
    'Marked Delivered But Not Received': "My order says it's been delivered, but I didn't receive anything.",
    'No Shipping Update': "Hi, I placed an order and haven't seen any shipping updates. Has the item been sent?"
  },
  seller: {
    'Order Confirmation': "Thanks for your order! We've received it and are preparing your item for dispatch. You'll receive tracking details once it ships.",
    'Item Dispatched': "Hi! Your order has been dispatched via [Courier Name]. Tracking number: [Tracking ID]. Let us know when it arrives!",
    'Confirm Delivery': "Hi, just checking in to confirm if you've received your item. We hope everything's in order!",
    'Response: Minor Issue': "Thanks for reaching out. Sorry to hear that. Could you please share a photo of the issue? We'll look into it right away.",
    'Response: Significant Issue': "We're really sorry about this. Please send us a photo or video of what you received so we can escalate it for review. If confirmed, a refund or return can be processed.",
    'Response: Damaged': "Oh no! We're really sorry to hear that. Please send us photos of the damage (including packaging if possible), and we'll help sort this out quickly.",
    'Response: Not Received': "Thanks for reaching out. Let me check the tracking and follow up with the courier. We'll update you shortly.",
    'Response: Marked Delivered': "We're sorry to hear that. Sometimes items may be left with a neighbour or reception. Could you kindly check? If not, we'll raise this with the courier and update you.",
    'Response: No Tracking Update': "Thanks for checking in. Let me confirm the dispatch status and get back to you shortly. We'll ensure this is resolved quickly."
  }
};

export default function ChatterTemplates() {
  const [role, setRole] = useState('buyer');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  const [copied, setCopied] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleCopy = () => {
    const messageToCopy = selectedTemplate ? chatterTemplates[role][selectedTemplate] : customMessage;
    if (messageToCopy) {
      navigator.clipboard.writeText(messageToCopy);
      setCopied(true);
      toast.success('Message copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      
      // Validate file size (5MB limit)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }

      setSelectedImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSendMessage = () => {
    const message = selectedTemplate ? chatterTemplates[role][selectedTemplate] : customMessage;
    
    if (!message.trim()) {
      toast.error('Please enter a message');
      return;
    }

    // Here you would typically send the message to your chat system
    // For now, we'll just show a success message
    toast.success('Message sent successfully!');
    
    // Reset form
    setSelectedTemplate('');
    setCustomMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getCurrentMessage = () => {
    return selectedTemplate ? chatterTemplates[role][selectedTemplate] : customMessage;
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
        Pre-Chat Message Templates
      </h2>

      {/* Role Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Your Role
        </label>
        <select 
          value={role} 
          onChange={e => setRole(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="buyer">Buyer</option>
          <option value="seller">Seller</option>
        </select>
      </div>

      {/* Message Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Message Type
        </label>
        <select 
          value={selectedTemplate} 
          onChange={e => setSelectedTemplate(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Select a template message</option>
          {Object.keys(chatterTemplates[role]).map(key => (
            <option key={key} value={key}>{key}</option>
          ))}
        </select>
      </div>

      {/* Custom Message Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Or Write Custom Message
        </label>
        <textarea
          value={customMessage}
          onChange={(e) => setCustomMessage(e.target.value)}
          placeholder="Type your custom message here..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 h-32 resize-none"
          disabled={!!selectedTemplate}
        />
      </div>

      {/* Image Upload */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Attach Image (Optional)
        </label>
        <div className="flex items-center space-x-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            id="image-upload"
          />
          <label
            htmlFor="image-upload"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 cursor-pointer transition-colors"
          >
            Choose Image
          </label>
          {selectedImage && (
            <button
              onClick={removeImage}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            >
              Remove
            </button>
          )}
        </div>
        
        {/* Image Preview */}
        {imagePreview && (
          <div className="mt-4">
            <img 
              src={imagePreview} 
              alt="Preview" 
              className="max-w-xs max-h-48 rounded-md border border-gray-300"
            />
            <p className="text-sm text-gray-600 mt-2">
              {selectedImage?.name} ({(selectedImage?.size / 1024 / 1024).toFixed(2)} MB)
            </p>
          </div>
        )}
      </div>

      {/* Message Preview */}
      {getCurrentMessage() && (
        <div className="mb-6 p-4 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-sm font-medium text-gray-700 mb-2">Message Preview:</p>
          <p className="text-gray-800 whitespace-pre-wrap">{getCurrentMessage()}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button 
          onClick={handleCopy}
          disabled={!getCurrentMessage()}
          className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {copied ? 'Copied!' : 'Copy to Clipboard'}
        </button>
        <button 
          onClick={handleSendMessage}
          disabled={!getCurrentMessage()}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors"
        >
          Send Message
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-blue-50 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Tip:</strong> Select a template message or write your own custom message. 
          You can also attach an image to provide visual context for your message.
        </p>
      </div>
    </div>
  );
} 