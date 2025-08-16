import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
import ChatTemplates, { templates } from '/src/components/chat/ChatTemplates';
import SellerSidebar from '/src/seller/SellerSidebar';

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
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const fetchChats = () => {
      if (!auth.currentUser) {
        toast.error('Please sign in to view chats.');
        navigate('/login');
        setLoading(false);
        return () => {};
      }

      const chatsQuery = query(collection(db, 'chats'), where('sellerId', '==', auth.currentUser.uid));
      const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
        try {
          const fetchedChats = await Promise.all(
            snapshot.docs.map(async (chatDoc) => {
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
                lastMessage: chatData.lastMessage || '',
                lastMessageTime: chatData.lastMessageTime || chatData.createdAt || new Date(),
              };
            })
          );

          console.log('Fetched chats:', fetchedChats); // Debug log
          setChats(fetchedChats);

          // Select chat based on chatId from URL
          if (chatId) {
            const selected = fetchedChats.find((chat) => chat.chatId === chatId);
            if (selected) {
              setSelectedChat(selected);
              const messagesQuery = query(
                collection(db, 'chats', chatId, 'messages'),
                orderBy('timestamp', 'asc')
              );
              const messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
                const fetchedMessages = snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                }));
                setMessages(fetchedMessages);
                setLoading(false);
              }, (err) => {
                console.error('Error fetching messages:', err.message);
                toast.error('Failed to load messages.');
                setLoading(false);
              });

              const chatRef = doc(db, 'chats', chatId);
              const typingUnsubscribe = onSnapshot(chatRef, (doc) => {
                const data = doc.data();
                setRecipientTyping(data?.typing?.[data.userId] || false);
                setLoading(false);
              }, (err) => {
                console.error('Error fetching typing status:', err.message);
                setLoading(false);
              });

              return () => {
                messagesUnsubscribe();
                typingUnsubscribe();
              };
            } else {
              console.warn(`Chat with ID ${chatId} not found.`);
              toast.error('Chat not found.');
              setSelectedChat(null);
              setMessages([]);
              setLoading(false);
            }
          } else {
            setSelectedChat(null);
            setMessages([]);
            setLoading(false);
          }
        } catch (err) {
          console.error('Error fetching chats:', err.message);
          toast.error('Failed to load chats.');
          setLoading(false);
        }
      }, (err) => {
        console.error('Error in chats snapshot:', err.message);
        toast.error('Failed to load chats.');
        setLoading(false);
      });

      return unsubscribe;
    };

    const unsubscribe = fetchChats();
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
        text: templates.seller[selectedTemplate],
        image: null,
        timestamp: new Date(),
        status: 'delivered',
      });

      await updateDoc(doc(db, 'chats', selectedChat.chatId), {
        lastMessage: templates.seller[selectedTemplate],
        lastMessageTime: new Date(),
        [`typing.${auth.currentUser.uid}`]: false,
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

      await updateDoc(doc(db, 'chats', selectedChat.chatId), {
        lastMessage: 'Image sent',
        lastMessageTime: new Date(),
        [`typing.${auth.currentUser.uid}`]: false,
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

  const handleTyping = async () => {
    if (selectedChat) {
      try {
        await updateDoc(doc(db, 'chats', selectedChat.chatId), {
          [`typing.${auth.currentUser.uid}`]: true,
        });
      } catch (err) {
        console.error('Error updating typing status:', err.message);
      }
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (err) {
      return '';
    }
  };

  const formatChatTime = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      const today = new Date();
      if (date.toDateString() === today.toDateString()) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      }
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch (err) {
      return '';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-6 flex justify-center items-center">
          <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
            <i className="bx bx-loader bx-spin text-2xl"></i>
            <span>Loading...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900">
      <SellerSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-4">
        <div className="bg-white dark:bg-gray-700 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-600">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 flex items-center">
              <i className="bx bx-chat text-blue-500 mr-2"></i>
              Seller Chats
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
              Manage your conversations with buyers.
            </p>
          </div>
          <div className="flex flex-col md:flex-row gap-4">
            <motion.div
              className="md:w-1/3 bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-600"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="p-4 bg-blue-50 dark:bg-blue-900 border-b border-gray-200 dark:border-gray-600">
                <h2 className="text-lg font-bold text-gray-800 dark:text-gray-100">Chats</h2>
              </div>
              {chats.length === 0 ? (
                <p className="p-4 text-gray-600 dark:text-gray-400 text-sm">No chats found.</p>
              ) : (
                <div className="divide-y divide-gray-200 dark:divide-gray-600">
                  <AnimatePresence>
                    {chats.map((chat) => (
                      <motion.div
                        key={chat.chatId}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => {
                          navigate(`/seller-chat/${chat.chatId}`);
                          setSelectedChat(chat);
                        }}
                        className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-blue-50 dark:hover:bg-blue-800 transition ${
                          selectedChat?.chatId === chat.chatId ? 'bg-blue-100 dark:bg-blue-900' : ''
                        }`}
                      >
                        <img
                          src={chat.buyerAvatar}
                          alt="Buyer"
                          className="w-10 h-10 rounded-full border border-gray-200 dark:border-gray-600"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800 dark:text-gray-100 text-sm truncate">{chat.buyerName}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{chat.lastMessage || 'No messages yet'}</p>
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{formatChatTime(chat.lastMessageTime)}</p>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
            <motion.div
              className="md:w-2/3 flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden border border-gray-200 dark:border-gray-600"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5 }}
            >
              {selectedChat ? (
                <>
                  <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 dark:bg-blue-700 text-white border-b border-gray-200 dark:border-gray-600">
                    <img
                      src={selectedChat.buyerAvatar}
                      alt="Buyer"
                      className="w-10 h-10 rounded-full border-2 border-white"
                    />
                    <div className="flex-1">
                      <div className="font-semibold text-lg">{selectedChat.buyerName}</div>
                      <div className="text-xs text-blue-100 dark:text-blue-200">Product: {selectedChat.productName}</div>
                    </div>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100 dark:bg-gray-900">
                    <AnimatePresence>
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className={`flex ${
                            msg.senderId === auth.currentUser.uid ? 'justify-end' : 'justify-start'
                          }`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 shadow-sm relative ${
                              msg.senderId === auth.currentUser.uid
                                ? 'bg-blue-500 text-white rounded-br-none'
                                : 'bg-white dark:bg-gray-600 text-gray-800 dark:text-gray-100 rounded-bl-none'
                            }`}
                          >
                            {msg.text && <div className="text-sm">{msg.text}</div>}
                            {msg.image && (
                              <img
                                src={msg.image}
                                alt="chat-img"
                                className="max-w-[150px] sm:max-w-[200px] rounded-md border border-gray-200 dark:border-gray-600 mb-1"
                              />
                            )}
                            <div className="flex items-center justify-end gap-1 text-xs mt-1">
                              <span
                                className={
                                  msg.senderId === auth.currentUser.uid
                                    ? 'text-blue-100'
                                    : 'text-gray-500 dark:text-gray-400'
                                }
                              >
                                {formatMessageTime(msg.timestamp)}
                              </span>
                            </div>
                            <div
                              className={`absolute bottom-0 ${
                                msg.senderId === auth.currentUser.uid ? 'right-[-6px]' : 'left-[-6px]'
                              } w-0 h-0 border-t-[6px] border-t-transparent ${
                                msg.senderId === auth.currentUser.uid
                                  ? 'border-l-[6px] border-l-blue-500'
                                  : 'border-r-[6px] border-r-white dark:border-r-gray-600'
                              } border-b-[6px] border-b-transparent`}
                            />
                          </div>
                        </motion.div>
                      ))}
                      {(isTyping || recipientTyping) && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex justify-start"
                        >
                          <div className="bg-white dark:bg-gray-600 rounded-lg p-3 shadow-sm">
                            <div className="flex items-center gap-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: '0.1s' }}
                              ></div>
                              <div
                                className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                                style={{ animationDelay: '0.2s' }}
                              ></div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                    <div ref={messagesEndRef} />
                  </div>
                  <div className="bg-white dark:bg-gray-800 px-4 py-3 border-t border-gray-200 dark:border-gray-600">
                    <div className="mb-3">
                      <ChatTemplates
                        role="seller"
                        onSelect={setSelectedTemplate}
                        selectedTemplate={selectedTemplate}
                        className="w-full p-3 pl-10 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                      />
                    </div>
                    {selectedImage && imagePreview && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mb-3 p-2 bg-gray-100 dark:bg-gray-600 rounded-lg border border-gray-200 dark:border-gray-600"
                      >
                        <img
                          src={imagePreview}
                          alt="preview"
                          className="max-w-[80px] max-h-[80px] rounded-md"
                        />
                      </motion.div>
                    )}
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 bg-gray-100 dark:bg-gray-600 rounded-lg p-2">
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
                            <motion.label
                              htmlFor="image-upload"
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="text-gray-600 dark:text-gray-300 p-1 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                            >
                              <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.586-6.586M12 3v6m0 0v6m0-6h6m-6 0H6"
                                />
                              </svg>
                            </motion.label>
                          </>
                        )}
                        {selectedTemplate ? (
                          <motion.button
                            onClick={handleSendMessage}
                            disabled={isTyping}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className={`ml-auto py-2 px-4 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 flex items-center justify-center gap-2 transition ${
                              isTyping ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            onMouseDown={handleTyping}
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                              />
                            </svg>
                            Send
                          </motion.button>
                        ) : (
                          <motion.button
                            onClick={() => navigate('/support')}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="ml-auto py-2 px-4 bg-orange-500 text-white rounded-lg shadow-md hover:bg-orange-600 flex items-center justify-center gap-2 transition"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M18.364 5.636A9 9 0 1121 12h-3m-6 6v3m-6-3h-3m6-6H3m6-6V3"
                              />
                            </svg>
                            Support
                          </motion.button>
                        )}
                      </div>
                      {selectedImage && imagePreview && (
                        <motion.button
                          onClick={handleSendImage}
                          disabled={isTyping}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={`py-2 px-4 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 flex items-center justify-center gap-2 transition ${
                            isTyping ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        >
                          <svg
                            className="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                          Send Image
                        </motion.button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <motion.div
                  className="flex-1 flex items-center justify-center text-gray-600 dark:text-gray-400 text-sm"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  Select a chat to view messages.
                </motion.div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerChat;