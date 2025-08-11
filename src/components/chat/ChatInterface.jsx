import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '/src/firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import ChatTemplates, { templates } from './ChatTemplates';
import Spinner from '/src/components/common/Spinner';
import Sidebar from '/src/profile/Sidebar';

function canSendImage(messages) {
  if (messages.length === 0) return false;
  const lastMsg = messages[messages.length - 1];
  return /photo|image|picture|show|damage|send us|share/i.test(lastMsg.text);
}

const ChatInterface = () => {
  const { orderId } = useParams(); // Expecting orderId like order-1751734521969
  const { state } = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [recipient, setRecipient] = useState({ name: 'Seller', avatar: null });
  const [isValidOrder, setIsValidOrder] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    const validateOrder = async () => {
      if (!auth.currentUser) {
        toast.error('Please sign in to access chat.');
        navigate('/login');
        setLoading(false);
        return;
      }

      if (!orderId || !state?.sellerId || !state?.productName || state?.role !== 'buyer') {
        toast.error('Invalid chat request.');
        navigate('/orders');
        setLoading(false);
        return;
      }

      try {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists() || orderSnap.data().userId !== auth.currentUser.uid) {
          toast.error('Invalid order or unauthorized access.');
          navigate('/orders');
          setLoading(false);
          return;
        }

        const sellerRef = doc(db, 'users', state.sellerId);
        const sellerSnap = await getDoc(sellerRef);
        const sellerData = sellerSnap.exists() ? sellerSnap.data() : {};
        setRecipient({
          name: sellerData.displayName || 'Seller',
          avatar: sellerData.avatar || 'https://ui-avatars.com/api/?name=S&background=3b82f6&color=fff&size=40',
        });
        setIsValidOrder(true);

        const chatQuery = query(
          collection(db, 'chats'),
          where('orderId', '==', orderId),
          where('userId', '==', auth.currentUser.uid),
          where('sellerId', '==', state.sellerId)
        );
        const chatSnap = await getDocs(chatQuery);
        let chatId;
        if (chatSnap.empty) {
          const randomString = Math.random().toString(36).substr(2, 9);
          chatId = `${orderId}-${randomString}`;
          await addDoc(collection(db, 'chats'), {
            chatId: chatId,
            orderId,
            userId: auth.currentUser.uid,
            sellerId: state.sellerId,
            productId: orderSnap.data().items[0]?.productId || '',
            createdAt: new Date(),
            lastMessage: '',
            lastMessageTime: new Date(),
            typing: {},
          });
        } else {
          chatId = chatSnap.docs[0].id;
        }

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
          setRecipientTyping(data?.typing?.[state.sellerId] || false);
        }, (err) => {
          console.error('Error fetching typing status:', err.message);
        });

        return () => {
          messagesUnsubscribe();
          typingUnsubscribe();
        };
      } catch (err) {
        console.error('Error validating chat:', err.message);
        toast.error('Failed to load chat.');
        navigate('/orders');
        setLoading(false);
      }
    };

    validateOrder();
  }, [orderId, state, navigate]);

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
    if (!selectedTemplate) {
      toast.error('Please select a message template.');
      return;
    }

    try {
      setIsTyping(true);
      const chatQuery = query(
        collection(db, 'chats'),
        where('orderId', '==', orderId),
        where('userId', '==', auth.currentUser.uid),
        where('sellerId', '==', state.sellerId)
      );
      const chatSnap = await getDocs(chatQuery);
      if (chatSnap.empty) {
        toast.error('Chat not found.');
        return;
      }
      const chatId = chatSnap.docs[0].id;

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: auth.currentUser.uid,
        text: templates.buyer[selectedTemplate], // Fixed: Changed chatterTemplates to templates
        image: null,
        timestamp: new Date(),
        status: 'delivered',
      });

      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: templates.buyer[selectedTemplate],
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
    if (!selectedImage || !imagePreview) return;

    try {
      setIsTyping(true);
      const chatQuery = query(
        collection(db, 'chats'),
        where('orderId', '==', orderId),
        where('userId', '==', auth.currentUser.uid),
        where('sellerId', '==', state.sellerId)
      );
      const chatSnap = await getDocs(chatQuery);
      if (chatSnap.empty) {
        toast.error('Chat not found.');
        return;
      }
      const chatId = chatSnap.docs[0].id;

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: auth.currentUser.uid,
        text: '',
        image: imagePreview,
        timestamp: new Date(),
        status: 'delivered',
      });

      await updateDoc(doc(db, 'chats', chatId), {
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
    if (!isValidOrder) return;
    try {
      const chatQuery = query(
        collection(db, 'chats'),
        where('orderId', '==', orderId),
        where('userId', '==', auth.currentUser.uid),
        where('sellerId', '==', state.sellerId)
      );
      const chatSnap = await getDocs(chatQuery);
      if (!chatSnap.empty) {
        const chatId = chatSnap.docs[0].id;
        await updateDoc(doc(db, 'chats', chatId), {
          [`typing.${auth.currentUser.uid}`]: true,
        });
      }
    } catch (err) {
      console.error('Error updating typing status:', err.message);
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Spinner />
        <p className="text-gray-600 dark:text-gray-300">Loading chat...</p>
      </div>
    );
  }

  if (!isValidOrder) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800 dark:text-gray-700">
      <div className="flex flex-col md:flex-row gap-4">
        <Sidebar />
        <motion.div
          className="md:w-3/4 flex flex-col bg-white rounded-lg shadow-md overflow-hidden"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-3 px-4 py-3 bg-green-600 text-white border-b border-gray-200">
            <img
              src={recipient.avatar}
              alt="Seller"
              className="w-10 h-10 rounded-full border-2 border-white"
            />
            <div className="flex-1">
              <div className="font-semibold text-lg">{recipient.name}</div>
              <div className="text-xs text-green-100">Product: {state?.productName || 'Unknown'}</div>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-100">
            <AnimatePresence>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex ${msg.senderId === auth.currentUser.uid ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[70%] rounded-lg p-3 shadow-sm relative ${
                      msg.senderId === auth.currentUser.uid
                        ? 'bg-green-500 text-white rounded-br-none'
                        : 'bg-white text-gray-800 rounded-bl-none'
                    }`}
                  >
                    {msg.text && <div className="text-sm">{msg.text}</div>}
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="chat-img"
                        className="max-w-[150px] sm:max-w-[200px] rounded-md border border-gray-200 mb-1"
                      />
                    )}
                    <div className="flex items-center justify-end gap-1 text-xs mt-1">
                      <span
                        className={msg.senderId === auth.currentUser.uid ? 'text-green-100' : 'text-gray-500'}
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
                role="buyer"
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
        </motion.div>
      </div>
    </div>
  );
};

export default ChatInterface;