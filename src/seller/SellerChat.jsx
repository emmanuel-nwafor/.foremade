import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { auth, db } from '/src/firebase';
import { collection, getDocs, query, where, orderBy, onSnapshot, doc, getDoc, addDoc } from 'firebase/firestore';
import ChatTemplates from '/src/components/chat/ChatTemplates';
import Spinner from '../components/common/Spinner';

function canSendImage(messages) {
  if (messages.length === 0) return false;
  const lastMsg = messages[messages.length - 1];
  return /photo|image|picture|show|damage|send us|share/i.test(lastMsg.text);
}

const SellerChat = () => {
  const { chatId } = useParams();
  const navigate = useNavigate();
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchChats = async () => {
      try {
        if (!auth.currentUser) {
          toast.error('Please sign in to view chats.');
          navigate('/login');
          return;
        }

        const chatsQuery = query(collection(db, 'chats'), where('sellerId', '==', auth.currentUser.uid));
        const chatsSnap = await getDocs(chatsQuery);

        const fetchedChats = await Promise.all(
          chatsSnap.docs.map(async (chatDoc) => {
            const chatData = chatDoc.data();
            const orderRef = doc(db, 'orders', chatData.orderId);
            const orderSnap = await getDoc(orderRef);
            const orderData = orderSnap.exists() ? orderSnap.data() : {};
            const buyerRef = doc(db, 'users', chatData.userId);
            const buyerSnap = await getDoc(buyerRef);
            const buyerData = buyerSnap.exists() ? buyerSnap.data() : {};
            const productRef = doc(db, 'products', chatData.productId);
            const productSnap = await getDoc(productRef);
            const productData = productSnap.exists() ? productSnap.data() : {};

            return {
              chatId: chatDoc.id,
              orderId: chatData.orderId,
              buyerName: buyerData.displayName || 'Unknown Buyer',
              buyerAvatar: buyerData.avatar || 'https://ui-avatars.com/api/?name=B&background=3b82f6&color=fff&size=40',
              productName: orderData.items?.[0]?.name || productData.name || 'Product',
              lastMessage: '',
              lastMessageTime: chatData.createdAt || new Date(),
            };
          })
        );

        setChats(fetchedChats);

        if (chatId) {
          const selected = fetchedChats.find((chat) => chat.chatId === chatId);
          if (selected) {
            setSelectedChat(selected);
            const messagesQuery = query(
              collection(db, 'chats', chatId, 'messages'),
              orderBy('timestamp', 'asc')
            );
            const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
              const fetchedMessages = snapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }));
              setMessages(fetchedMessages);
            });
            return () => unsubscribe();
          } else {
            toast.error('Invalid chat selected.');
            navigate('/seller-chat');
          }
        }
      } catch (err) {
        console.error('Error fetching chats:', err.message);
        toast.error('Failed to load chats.');
      } finally {
        setLoading(false);
      }
    };

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) fetchChats();
      else {
        setLoading(false);
        toast.error('Please sign in to view chats.');
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [chatId, navigate]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size should be less than 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTemplate || !selectedChat) {
      toast.error('Please select a message template.');
      return;
    }

    try {
      setIsTyping(true);
      await addDoc(collection(db, 'chats', selectedChat.chatId, 'messages'), {
        senderId: auth.currentUser.uid,
        text: chatterTemplates.seller[selectedTemplate],
        image: null,
        timestamp: new Date(),
        status: 'delivered',
      });
      setSelectedTemplate('');
    } catch (err) {
      console.error('Error sending message:', err.message);
      toast.error('Failed to send message.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendImage = async () => {
    if (!selectedImage || !imagePreview || !selectedChat) return;

    try {
      setIsTyping(true);
      await addDoc(collection(db, 'chats', selectedChat.chatId, 'messages'), {
        senderId: auth.currentUser.uid,
        text: '',
        image: imagePreview,
        timestamp: new Date(),
        status: 'delivered',
      });
      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Error sending image:', err.message);
      toast.error('Failed to send image.');
    } finally {
      setIsTyping(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Spinner />
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800 bg-gray-50">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Seller Messages</h1>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-1/3">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Chats</h2>
          {chats.length === 0 ? (
            <p className="text-gray-600">No chats found.</p>
          ) : (
            <div className="space-y-4">
              {chats.map((chat) => (
                <div
                  key={chat.chatId}
                  onClick={() => navigate(`/seller-chat/${chat.chatId}`)}
                  className={`p-4 bg-white rounded-lg shadow-md cursor-pointer ${
                    selectedChat?.chatId === chat.chatId ? 'border-l-4 border-blue-600' : ''
                  }`}
                >
                  <p className="font-semibold text-gray-800">{chat.buyerName}</p>
                  <p className="text-sm text-gray-600">Order #{chat.orderId}</p>
                  <p className="text-sm text-gray-600">{chat.productName}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(chat.lastMessageTime.toDate()).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="md:w-2/3">
          {selectedChat ? (
            <div className="max-w-md mx-auto h-[80vh] flex flex-col bg-gray-50 rounded-lg shadow-lg border border-gray-200 overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white">
                <img
                  src={selectedChat.buyerAvatar}
                  alt="Buyer"
                  className="w-10 h-10 rounded-full border-2 border-white"
                />
                <div className="flex-1">
                  <div className="font-semibold text-lg">{selectedChat.buyerName}</div>
                  <div className="text-xs text-blue-100">Product: {selectedChat.productName}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gray-100">
                {messages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.senderId === auth.currentUser.uid ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[75%] rounded-lg px-4 py-2 shadow-sm ${
                        msg.senderId === auth.currentUser.uid
                          ? 'bg-blue-100 text-gray-800'
                          : 'bg-white text-gray-800'
                      }`}
                    >
                      {msg.text && (
                        <div className="text-sm">{msg.text}</div>
                      )}
                      {msg.image && (
                        <img
                          src={msg.image}
                          alt="chat-img"
                          className="max-w-[200px] rounded-md border border-gray-200 mb-1"
                        />
                      )}
                      <div className="flex items-center justify-end gap-1 text-xs text-gray-500">
                        <span>{new Date(msg.timestamp.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  </div>
                ))}
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
              <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                <div className="mb-3">
                  <ChatTemplates
                    role="seller"
                    onSelect={setSelectedTemplate}
                    selectedTemplate={selectedTemplate}
                  />
                </div>
                {selectedImage && imagePreview && (
                  <div className="mb-3 p-2 bg-white rounded-lg border border-gray-200">
                    <img
                      src={imagePreview}
                      alt="preview"
                      className="max-w-[100px] max-h-[100px] rounded-md"
                    />
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {selectedTemplate ? (
                    <button
                      onClick={handleSendMessage}
                      disabled={isTyping}
                      className={`flex-1 py-2 px-4 rounded-lg font-medium ${
                        !isTyping
                          ? 'bg-blue-600 text-white hover:bg-blue-700'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {isTyping ? 'Sending...' : 'Send Message'}
                    </button>
                  ) : (
                    <button
                      onClick={() => navigate('/support')}
                      className="flex-1 py-2 px-4 rounded-lg font-medium bg-orange-500 text-white hover:bg-orange-600"
                    >
                      Contact Support
                    </button>
                  )}
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
                        className="bg-blue-600 text-white p-2 rounded-lg cursor-pointer hover:bg-blue-700"
                      >
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 9l5-5 5 5M12 4.5V15" />
                        </svg>
                      </label>
                      {selectedImage && imagePreview && (
                        <button
                          onClick={handleSendImage}
                          disabled={isTyping}
                          className={`py-2 px-4 rounded-lg font-medium ${
                            !isTyping
                              ? 'bg-blue-600 text-white hover:bg-blue-700'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          Send Image
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-600">Select a chat to view messages.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SellerChat;