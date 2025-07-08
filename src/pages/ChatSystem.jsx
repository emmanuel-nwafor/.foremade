import React, { useState } from 'react';
import ChatterTemplates from '../components/chat/ChatterTemplates';
import ChatInterface from '../components/chat/ChatInterface';

const ChatSystem = () => {
  const [activeTab, setActiveTab] = useState('templates'); // 'templates' or 'chat'

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Chat System
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Use pre-written message templates or chat directly with buyers and sellers. 
            Upload images to provide better context for your messages.
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg shadow-md p-1">
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'templates'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Message Templates
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-6 py-2 rounded-md transition-colors ${
                activeTab === 'chat'
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              Live Chat
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-4xl mx-auto">
          {activeTab === 'templates' ? (
            <ChatterTemplates />
          ) : (
            <div className="space-y-8">
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Live Chat Interface
                </h2>
                <p className="text-gray-600 mb-6">
                  This is a demo chat interface. In a real implementation, this would connect to your messaging system.
                </p>
                <ChatInterface recipientName="John's Electronics Store" />
              </div>
              
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-800 mb-2">
                  Features Available:
                </h3>
                <ul className="text-blue-700 space-y-1">
                  <li>• Real-time messaging with typing indicators</li>
                  <li>• Image upload and preview</li>
                  <li>• Message history and timestamps</li>
                  <li>• Responsive design for mobile and desktop</li>
                  <li>• Integration with message templates</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatSystem; 