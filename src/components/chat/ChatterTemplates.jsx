import React, { useState, useRef, useEffect } from 'react';

const chatterTemplates = {
  buyer: {
    'Acknowledged Receipt': "Hi, just confirming that I've received the item. Thank you!",
    'Not As Described': "Hi, I received the item but it's a bit different from what I expected. The [describe issue] isn't quite as shown.",
    'Significantly Not as Described': "Hello, I've received the item, but it's significantly different from the description. It doesn't match the images or details listed.",
    'Product is Damaged': "Hi, the item I received is damaged. It looks like it got affected during delivery. Please advise on next steps.",
    'Not Received': "Hi, I haven't received my item yet. The delivery window has passed.",
    'Marked Delivered But Not Received': "My order says it's been delivered, but I didn't receive anything.",
    'No Shipping Update': "Hi, I placed an order and haven't seen any shipping updates. Has the item been sent?",
    'Request Photos': "Could you please share some photos of the actual item?",
    'Thank You': "Thank you for your help!",
    'Following Up': "Hi, just following up on my previous message. Any updates?"
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
    'Response: No Tracking Update': "Thanks for checking in. Let me confirm the dispatch status and get back to you shortly. We'll ensure this is resolved quickly.",
    'Apology': "We sincerely apologize for the inconvenience caused.",
    'Processing Refund': "We're processing your refund now. You should see it in 3-5 business days.",
    'Escalating Issue': "I'm escalating this to our senior team for immediate resolution."
  }
};

const avatars = {
  buyer: 'https://ui-avatars.com/api/?name=B&background=34d399&color=fff&size=40',
  seller: 'https://ui-avatars.com/api/?name=S&background=3b82f6&color=fff&size=40',
};

function canSendImage(messages) {
  if (messages.length === 0) return false;
  const lastMsg = messages[messages.length - 1];
  return /photo|image|picture|show|damage|send us|share/i.test(lastMsg.text);
}

export default function WhatsAppChatTemplates() {
  const [role, setRole] = useState('buyer');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [messages, setMessages] = useState([
    { 
      sender: 'seller', 
      text: "Thanks for your order! We've received it and are preparing your item for dispatch. You'll receive tracking details once it ships.", 
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
      status: 'read'
    },
    { 
      sender: 'buyer', 
      text: "Hi, just confirming that I've received the item. Thank you!", 
      timestamp: new Date(Date.now() - 1000 * 60 * 30),
      status: 'read'
    },
  ]);
  const [isTyping, setIsTyping] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!selectedTemplate) {
      alert('Please select a message template');
      return;
    }
    
    setIsTyping(true);
    
    setTimeout(() => {
      const text = chatterTemplates[role][selectedTemplate];
      setMessages((prev) => [
        ...prev,
        { 
          sender: role, 
          text, 
          timestamp: new Date(),
          status: 'delivered'
        },
      ]);
      setSelectedTemplate('');
      setIsTyping(false);
      
      // Mark as read after 2 seconds
      setTimeout(() => {
        setMessages(prev => prev.map((msg, idx) => 
          idx === prev.length - 1 ? { ...msg, status: 'read' } : msg
        ));
      }, 2000);
    }, 1000);
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSendImage = () => {
    if (!selectedImage || !imagePreview) return;
    
    setIsTyping(true);
    
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { 
          sender: role, 
          text: '', 
          image: imagePreview, 
          timestamp: new Date(),
          status: 'delivered'
        },
      ]);
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      setIsTyping(false);
      
      // Mark as read after 2 seconds
      setTimeout(() => {
        setMessages(prev => prev.map((msg, idx) => 
          idx === prev.length - 1 ? { ...msg, status: 'read' } : msg
        ));
      }, 2000);
    }, 1500);
  };

  const MessageStatus = ({ status }) => {
    if (status === 'delivered') {
      return <span className="text-gray-400 text-xs">✓✓</span>;
    }
    if (status === 'read') {
      return <span className="text-blue-400 text-xs">✓✓</span>;
    }
    return <span className="text-gray-400 text-xs">✓</span>;
  };

  return (
    <div className="max-w-md mx-auto h-[80vh] flex flex-col bg-[#f8fafc] rounded-lg shadow-2xl border border-gray-200 overflow-hidden">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#112D4E] text-white">
        <img 
          src={role === 'buyer' ? avatars.seller : avatars.buyer} 
          alt="Contact" 
          className="w-10 h-10 rounded-full border-2 border-white shadow-sm" 
        />
        <div className="flex-1">
          <div className="font-semibold text-lg">
            {role === 'buyer' ? 'Seller' : 'Buyer'}
          </div>
          <div className="text-xs text-green-200">
            {isTyping ? 'typing...' : 'online'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button className="text-white/80 hover:text-white p-1" aria-label="Menu">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <circle cx="12" cy="5" r="1.5" />
              <circle cx="12" cy="12" r="1.5" />
              <circle cx="12" cy="19" r="1.5" />
            </svg>
          </button>
        </div>
      </div>

      {/* Role Switcher */}
      <div className="bg-gray-50 px-4 py-2 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">You are:</span>
          <div className="flex bg-white rounded-full p-1 shadow-sm">
            <button
              onClick={() => setRole('buyer')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                role === 'buyer' 
                  ? 'bg-green-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Buyer
            </button>
            <button
              onClick={() => setRole('seller')}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-all ${
                role === 'seller' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Seller
            </button>
          </div>
        </div>
      </div>

      {/* Chat Messages */}
      <div 
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3" 
        style={{ 
          background: 'linear-gradient(135deg, #e5ddd5 0%, #e5ddd5 100%)',
          backgroundImage: `
            radial-gradient(circle at 20px 20px, rgba(255,255,255,0.1) 1px, transparent 1px),
            radial-gradient(circle at 60px 60px, rgba(255,255,255,0.05) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px'
        }}
      >
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.sender === role ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[75%] rounded-lg px-4 py-2 shadow-sm relative ${
              msg.sender === role
                ? 'bg-[#dcf8c6] text-gray-900 rounded-br-sm'
                : 'bg-white text-gray-900 rounded-bl-sm'
            }`}>
              {msg.text && (
                <div className="whitespace-pre-line text-sm leading-relaxed mb-1">
                  {msg.text}
                </div>
              )}
              {msg.image && (
                <img 
                  src={msg.image} 
                  alt="chat-img" 
                  className="max-w-[200px] rounded-md border border-gray-200 shadow-sm mb-1" 
                />
              )}
              <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
                <span>{msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                {msg.sender === role && <MessageStatus status={msg.status} />}
              </div>
              {/* Message tail */}
              <div className={`absolute bottom-0 ${
                msg.sender === role 
                  ? 'right-0 transform translate-x-1' 
                  : 'left-0 transform -translate-x-1'
              }`}>
                <div className={`w-0 h-0 ${
                  msg.sender === role
                    ? 'border-l-[8px] border-l-[#dcf8c6] border-t-[8px] border-t-transparent'
                    : 'border-r-[8px] border-r-white border-t-[8px] border-t-transparent'
                }`}></div>
              </div>
            </div>
          </div>
        ))}
        
        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-white rounded-lg px-4 py-2 shadow-sm">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

              {/* Message Input */}
      <div className="bg-[#e2e8f0] px-4 py-3 border-t border-gray-200">
        {/* Template Selector */}
        <div className="mb-3">
          <select
            value={selectedTemplate}
            onChange={e => setSelectedTemplate(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-green-500 text-sm bg-white shadow-sm"
          >
            <option value="">Choose a template message...</option>
            {Object.keys(chatterTemplates[role]).map(key => (
              <option key={key} value={key}>
                {key}: {chatterTemplates[role][key].substring(0, 50)}...
              </option>
            ))}
          </select>
        </div>

        {/* Support Option - Show when no template is selected */}
        {!selectedTemplate && (
          <div className="mb-3 p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="w-5 h-5 text-orange-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
              <div className="text-sm">
                <p className="font-medium text-orange-800 mb-1">No custom messages allowed</p>
                <p className="text-orange-700">If your message isn't covered by the templates above, please contact our support team for assistance.</p>
              </div>
            </div>
          </div>
        )}

        {/* Image Preview */}
        {selectedImage && imagePreview && (
          <div className="mb-3 p-2 bg-white rounded-lg border border-gray-200">
            <img 
              src={imagePreview} 
              alt="preview" 
              className="max-w-[100px] max-h-[100px] rounded-md border border-gray-200" 
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {selectedTemplate ? (
            <button
              onClick={handleSendMessage}
              disabled={isTyping}
              className={`flex-1 py-2 px-4 rounded-full font-medium transition-all ${
                !isTyping
                  ? 'bg-[#0a4d9f] text-white shadow-sm hover:bg-[#083d7f]'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              {isTyping ? 'Sending...' : 'Send Message'}
            </button>
          ) : (
            <button
              onClick={() => window.location.href = '/support'}
              className="flex-1 py-2 px-4 rounded-full font-medium bg-orange-500 text-white shadow-sm hover:bg-orange-600 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192L5.636 18.364M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              Contact Support
            </button>
          )}
          
          {/* Image Upload */}
          {canSendImage(messages) && (
            <>
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
                className="bg-[#0a4d9f] text-white p-2 rounded-full cursor-pointer hover:bg-[#083d7f] transition-colors flex items-center"
                aria-label="Upload"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5 5 5M12 4.5V15" /></svg>
              </label>
              {selectedImage && imagePreview && (
                <button
                  onClick={handleSendImage}
                  disabled={isTyping}
                  className={`py-2 px-4 rounded-full font-medium transition-all ${
                    !isTyping
                      ? 'bg-blue-500 text-white shadow-sm hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {isTyping ? 'Sending...' : 'Send Image'}
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}