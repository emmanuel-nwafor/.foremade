import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '/src/firebase';
import { collection, getDocs, query, where, orderBy, onSnapshot, doc, getDoc, addDoc, updateDoc } from 'firebase/firestore';
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
    const fetchChats = async () => {
      try {
        if (!auth.currentUser) {
          toast.error('Please sign in to view chats.');
          navigate('/login');
          return;
        }

        const chatsQuery = query(collection(db, 'chats'), where('sellerId', '==', auth.currentUser.uid));
        const unsubscribe = onSnapshot(chatsQuery, async (snapshot) => {
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
              const messagesUnsubscribe = onSnapshot(messagesQuery, (snapshot) => {
                const fetchedMessages = snapshot.docs.map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                }));
                setMessages(fetchedMessages);
              });

              const chatRef = doc(db, 'chats', chatId);
              const typingUnsubscribe = onSnapshot(chatRef, (doc) => {
                const data = doc.data();
                setRecipientTyping(data?.typing?.[data.userId] || false);
              });

              return () => {
                messagesUnsubscribe();
                typingUnsubscribe();
              };
            } else {
              toast.error('Invalid chat selected.');
              navigate('/seller-chat');
            }
          }
        }, (err) => {
          console.error('Error fetching chats:', err.message);
          toast.error('Failed to load chats. Please try again.');
          setLoading(false);
        });

        return () => unsubscribe();
      } catch (err) {
        console.error('Error fetching chats:', err.message);
        toast.error('Failed to load chats. Please try again.');
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
      await updateDoc(doc(db, 'chats', selectedChat.chatId), {
        [`typing.${auth.currentUser.uid}`]: false,
      });

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
      });

      setSelectedTemplate('');
    } catch (err) {
      console.error('Error sending message:', err.message);
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendImage = async () => {
    if (!selectedImage || !imagePreview || !selectedChat) return;

    try {
      setIsTyping(true);
      await updateDoc(doc(db, 'chats', selectedChat.chatId), {
        [`typing.${auth.currentUser.uid}`]: false,
      });

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
      });

      setSelectedImage(null);
      setImagePreview(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error('Error sending image:', err.message);
      toast.error('Failed to send image. Please try again.');
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
    const date = new Date(timestamp.toDate());
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 || 12;
    return `${formattedHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gray-100">
        <SellerSidebar />
        <div className="flex-1 ml-0 md:ml-64 p-4 sm:p-6 flex justify-center items-center">
          <i className="bx bx-loader bx-spin text-2xl"></i>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-100">
      <SellerSidebar />
      <div className="flex-1 ml-0 md:ml-64 p-4 sm:p-6">
        <div className="flex flex-col md:flex-row gap-4 sm:gap-6 max-w-5xl mx-auto">
          <motion.div
            className="md:w-1/3 bg-white rounded-lg shadow-md overflow-hidden"
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="p-4 bg-green-50 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">Chats</h2>
            </div>
            {chats.length === 0 ? (
              <p className="p-4 text-gray-600 text-sm">No chats found.</p>
            ) : (
              <div className="divide-y divide-gray-200">
                <AnimatePresence>
                  {chats.map((chat) => (
                    <motion.div
                      key={chat.chatId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.2 }}
                      onClick={() => navigate(`/seller-chat/${chat.chatId}`)}
                      className={`p-4 flex items-center gap-3 cursor-pointer hover:bg-green-50 transition ${
                        selectedChat?.chatId === chat.chatId ? 'bg-green-100' : ''
                      }`}
                    >
                      <img
                        src={chat.buyerAvatar}
                        alt="Buyer"
                        className="w-10 h-10 rounded-full border border-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 text-sm truncate">{chat.buyerName}</p>
                        <p className="text-xs text-gray-500 truncate">{chat.lastMessage}</p>
                      </div>
                      <p className="text-xs text-gray-400">{formatMessageTime(chat.lastMessageTime)}</p>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
          <motion.div
            className="md:w-2/3 flex flex-col bg-white rounded-lg shadow-md overflow-hidden"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            {selectedChat ? (
              <>
                <div className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white border-b border-gray-200">
                  <img
                    src={selectedChat.buyerAvatar}
                    alt="Buyer"
                    className="w-10 h-10 rounded-full border-2 border-white"
                  />
                  <div className="flex-1">
                    <div className="font-semibold text-base sm:text-lg">{selectedChat.buyerName}</div>
                    <div className="text-xs text-green-100">Order #{selectedChat.orderId}</div>
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-100 space-y-3">
                  <AnimatePresence>
                    {messages.map((msg, idx) => (
                      <motion.div
                        key={idx}
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
                              ? 'bg-green-500 text-white rounded-br-none'
                              : 'bg-white text-gray-800 rounded-bl-none'
                          }`}
                        >
                          {msg.text && (
                            <div className="text-sm">{msg.text}</div>
                          )}
                          {msg.image && (
                            <img
                              src={msg.image}
                              alt="chat-img"
                              className="max-w-[150px] sm:max-w-[200px] rounded-md border border-gray-200 mb-1"
                            />
                          )}
                          <div className="flex items-center justify-end gap-1 text-xs mt-1">
                            <span
                              className={
                                msg.senderId === auth.currentUser.uid ? 'text-green-100' : 'text-gray-500'
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
                                ? 'border-l-[6px] border-l-green-500'
                                : 'border-r-[6px] border-r-white'
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
                        <div className="bg-white rounded-lg p-3 shadow-sm">
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
                <div className="bg-white px-4 py-3 border-t border-gray-200">
                  <div className="mb-3">
                    <ChatTemplates
                      role="seller"
                      onSelect={setSelectedTemplate}
                      selectedTemplate={selectedTemplate}
                      className="w-full p-2 rounded-full bg-gray-100 text-gray-800 border border-gray-300 focus:ring-2 focus:ring-green-500 focus:border-green-500 transition"
                    />
                  </div>
                  {selectedImage && imagePreview && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mb-3 p-2 bg-gray-100 rounded-lg border border-gray-200"
                    >
                      <img
                        src={imagePreview}
                        alt="preview"
                        className="max-w-[80px] max-h-[80px] rounded-md"
                      />
                    </motion.div>
                  )}
                  <div className="flex items-center gap-2">
                    <div className="flex-1 flex items-center gap-2 bg-gray-100 rounded-full p-2">
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
                            className="text-gray-600 p-1 cursor-pointer hover:text-green-600"
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
                          className={`ml-auto p-2 rounded-full ${
                            !isTyping
                              ? 'bg-green-500 text-white hover:bg-green-600'
                              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
                        </motion.button>
                      ) : (
                        <motion.button
                          onClick={() => navigate('/support')}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="ml-auto p-2 rounded-full bg-orange-500 text-white hover:bg-orange-600"
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
                        </motion.button>
                      )}
                    </div>
                    {selectedImage && imagePreview && (
                      <motion.button
                        onClick={handleSendImage}
                        disabled={isTyping}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`p-2 rounded-full ${
                          !isTyping
                            ? 'bg-green-500 text-white hover:bg-green-600'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
                      </motion.button>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <p className="flex-1 flex items-center justify-center text-gray-600 text-sm sm:text-base">
                Select a chat to start messaging
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default SellerChat;