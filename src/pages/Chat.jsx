import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { db, auth } from "/src/firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { ArrowLeft, Send } from "lucide-react";

const Chat = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [seller, setSeller] = useState(null);
  const [product, setProduct] = useState(null);

  const { productId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const sellerId = location.state?.sellerId;
  const isMountedRef = useRef(true);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
  }, []);

  const restrictMessage = (text) => {
    const patterns = [
      /\d{5,}/,
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/,
      /\b(?:\d{4}[- ]?){3}\d{4}\b|\b\d{16}\b/,
      /(contact me via|whatsapp|telegram|linkedin|call me|sms)/i,
      /(http|https|www\.)/i,
    ];
    return patterns.some((p) => p.test(text));
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  // Fetch seller and product
  useEffect(() => {
    isMountedRef.current = true;
    const fetchDetails = async () => {
      if (!sellerId || !productId) return;
      const sellerSnap = await getDoc(doc(db, "users", sellerId));
      const productSnap = await getDoc(doc(db, "products", productId));
      if (sellerSnap.exists() && productSnap.exists()) {
        setSeller({ id: sellerId, ...sellerSnap.data() });
        setProduct({ id: productId, ...productSnap.data() });
      }
    };
    fetchDetails();
    return () => (isMountedRef.current = false);
  }, [sellerId, productId]);

  // Listen for messages
  useEffect(() => {
    if (!auth.currentUser || !sellerId || !productId) return;
    const conversationId = [auth.currentUser.uid, sellerId, productId].sort().join("_");
    const q = query(
      collection(db, `conversations/${conversationId}/messages`),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isMountedRef.current) return;
      const fetched = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setMessages(fetched);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [sellerId, productId, scrollToBottom]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || restrictMessage(newMessage)) return;

    const conversationId = [auth.currentUser.uid, sellerId, productId].sort().join("_");
    const messageData = {
      text: newMessage.trim(),
      senderId: auth.currentUser.uid,
      senderName: auth.currentUser.displayName || "Anonymous",
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, `conversations/${conversationId}/messages`), messageData);

    const recipientId = auth.currentUser.uid === sellerId ? product?.ownerId : sellerId;
    if (recipientId) {
      await addDoc(collection(db, "users-notifications"), {
        userId: recipientId,
        type: "chat_message",
        message: `${messageData.senderName} sent you a message about ${product?.name}`,
        productId,
        conversationId,
        createdAt: serverTimestamp(),
        read: false,
      });
    }

    setNewMessage("");
    scrollToBottom();
  };

  const handleBack = () => navigate(-1);

  if (!seller || !product)
    return <div className="flex items-center justify-center h-screen text-gray-700">Loading...</div>;

  return (
    <div className="flex flex-col mb-14 h-screen bg-gray-100 rounded-lg shadow-xl border">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center gap-4 p-4 bg-teal-600 text-white">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">
          {getInitials(seller.name)}
        </div>
        <div>
          <h2 className="font-semibold">{seller.name}</h2>
          <p className="text-sm">{product.name}</p>
        </div>
      </div>

      {/* Product pinned */}
      <div className="bg-white shadow-sm border-b border-gray-200 p-4 flex items-center gap-4">
        <img
          src="https://i.pinimg.com/736x/17/f1/11/17f11174ba7f057202e88a2129c27598.jpg"
          alt={product.name}
          className="w-16 h-16 rounded-lg object-cover"
        />
        <div>
          <h3 className="font-medium">{product.name}</h3>
        </div>
      </div>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-50"
      >
        {messages.map((msg) => {
          const isBuyer = msg.senderId === auth.currentUser.uid;
          const initials = isBuyer
            ? getInitials(auth.currentUser.displayName)
            : getInitials(seller.name);

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2 max-w-[70%] ${
                isBuyer ? "ml-auto flex-row-reverse" : "mr-auto"
              }`}
            >
              {/* Initials bubble */}
              <div className="w-8 h-8 rounded-full bg-teal-600 text-white flex items-center justify-center font-semibold text-sm">
                {initials}
              </div>

              {/* Message bubble */}
              <div
                className={`p-3 rounded-2xl shadow-sm break-words ${
                  isBuyer
                    ? "bg-[#112639] text-white rounded-tr-none"
                    : "bg-white rounded-tl-none"
                }`}
              >
                <p>{msg.text}</p>
                <p className="text-xs text-gray-400 mt-1 text-right">
                  {msg.createdAt
                    ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "Sending..."}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form
        onSubmit={handleSendMessage}
        className="flex items-center gap-3 p-4 border-t border-gray-200 bg-white"
      >
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message"
          className="flex-1 px-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-teal-400 outline-none"
        />
        <button
          type="submit"
          className="p-3 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition"
        >
          <Send size={20} />
        </button>
      </form>
    </div>
  );
};

export default Chat;
