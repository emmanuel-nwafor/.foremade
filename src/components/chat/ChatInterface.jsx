import React, { useState, useRef, useEffect } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { auth, db } from './firebase';
import { collection, addDoc, query, where, orderBy, onSnapshot, doc, getDoc } from 'firebase/firestore';
import ChatTemplates from './ChatTemplates';

function canSendImage(messages) {
  if (messages.length === 0) return false;
  const lastMsg = messages[messages.length - 1];
  return /photo|image|picture|show|damage|send us|share/i.test(lastMsg.text);
}

const ChatInterface = () => {
  const { orderId } = useParams();
  const { state } = useLocation();
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
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
        return;
      }

      if (!orderId || !state?.sellerId || !state?.productName || state?.role !== 'buyer') {
        toast.error('Invalid chat request.');
        navigate('/orders');
        return;
      }

      try {
        const orderRef = doc(db, 'orders', orderId);
        const orderSnap = await getDoc(orderRef);
        if (!orderSnap.exists() || orderSnap.data().userId !== auth.currentUser.uid) {
          toast.error('Invalid order or unauthorized access.');
          navigate('/orders');
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
          const chatRef = await addDoc(collection(db, 'chats'), {
            orderId,
            userId: auth.currentUser.uid,
            sellerId: state.sellerId,
            productId: orderSnap.data().items[0]?.productId || '',
            createdAt: new Date(),
          });
          chatId = chatRef.id;
        } else {
          chatId = chatSnap.docs[0].id;
        }

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
      } catch (err) {
        console.error('Error validating chat:', err.message);
        toast.error('Failed to load chat.');
        navigate('/orders');
      } finally {
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
      const chatId = chatSnap.docs[0].id;

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: auth.currentUser.uid,
        text: chatterTemplates.buyer[selectedTemplate],
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
      const chatId = chatSnap.docs[0].id;

      await addDoc(collection(db, 'chats', chatId, 'messages'), {
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
    return <div className="container mx-auto px-4 py-8 text-center text-gray-600">Loading...</div>;
  }

  if (!isValidOrder) {
    return null;
  }

  return (
    <div className="max-w-md mx-auto h-[80vh] flex flex-col bg-gray-50 rounded-lg shadow-lg border border-gray-200 overflow-hidden">
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white">
        <img
          src={recipient.avatar}
          alt="Seller"
          className="w-10 h-10 rounded-full border-2 border-white"
        />
        <div className="flex-1">
          <div className="font-semibold text-lg">{recipient.name}</div>
          <div className="text-xs text-blue-100">Product: {state?.productName || 'Unknown'}</div>
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
            role="buyer"
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
  );
};

export default ChatInterface;