import React from 'react';
import ChatterTemplates from '../components/chat/ChatterTemplates';

const ChatTemplates = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 mb-10">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Pre-Chat Message Templates
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Use our pre-written message templates to quickly communicate with buyers or sellers. 
            Choose from common scenarios to ensure clear and professional communication.
          </p>
        </div>
        
        <ChatterTemplates />
      </div>
    </div>
  );
};

export default ChatTemplates; 