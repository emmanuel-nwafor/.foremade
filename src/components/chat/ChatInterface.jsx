import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-toastify';

const ChatInterface = ({ recipientName = "Seller", recipientAvatar = null }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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
    if (!newMessage.trim() && !selectedImage) {
      toast.error('Please enter a message or attach an image');
      return;
    }

    const messageData = {
      id: Date.now(),
      text: newMessage.trim(),
      image: imagePreview,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, messageData]);
    setNewMessage('');
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    // Simulate typing indicator
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      // Simulate response (you can remove this in real implementation)
      const responseData = {
        id: Date.now() + 1,
        text: "Thanks for your message! I'll get back to you soon.",
        sender: 'recipient',
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages(prev => [...prev, responseData]);
    }, 2000);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Chat Header */}
      <div className="bg-blue-600 text-white px-6 py-4 flex items-center">
        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3">
          {recipientAvatar ? (
            <img src={recipientAvatar} alt={recipientName} className="w-8 h-8 rounded-full" />
          ) : (
            <i className="bx bx-user text-blue-600 text-xl"></i>
          )}
        </div>
        <div>
          <h3 className="font-semibold">{recipientName}</h3>
          <p className="text-sm text-blue-100">Online</p>
        </div>
      </div>

      {/* Messages Container */}
      <div className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              {message.image && (
                <img
                  src={message.image}
                  alt="Attached"
                  className="w-full h-32 object-cover rounded mb-2"
                />
              )}
              <p className="text-sm">{message.text}</p>
              <p className={`text-xs mt-1 ${
                message.sender === 'user' ? 'text-blue-100' : 'text-gray-500'
              }`}>
                {message.timestamp}
              </p>
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
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
      <div className="border-t border-gray-200 p-4">
        {/* Image Preview */}
        {imagePreview && (
          <div className="mb-3 relative">
            <img
              src={imagePreview}
              alt="Preview"
              className="max-w-xs max-h-32 rounded border border-gray-300"
            />
            <button
              onClick={removeImage}
              className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-red-600"
            >
              ×
            </button>
          </div>
        )}

        <div className="flex items-end space-x-2">
          <div className="flex-1">
            <textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="2"
            />
          </div>
          
          <div className="flex flex-col space-y-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="chat-image-upload"
            />
            <label
              htmlFor="chat-image-upload"
              className="px-3 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 cursor-pointer transition-colors text-sm"
            >
              <i className="bx bx-image text-lg"></i>
            </label>
            
            <button
              onClick={handleSendMessage}
              disabled={!newMessage.trim() && !selectedImage}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
            >
              <i className="bx bx-send text-lg"></i>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface; 