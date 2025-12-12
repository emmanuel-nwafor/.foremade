import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase";
import { collection, query, orderBy, onSnapshot, addDoc, doc, getDoc } from "firebase/firestore";
import SellerSidebar from "/src/seller/SellerSidebar";

// Enhanced message restrictions
const restrictMessage = (text) => {
  const patterns = [
    /\d{5,}/, // long numbers
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // emails
    /\b(?:\d{4}[- ]?){3}\d{4}\b|\b\d{16}\b/, // credit/debit cards
    /(contact me via|whatsapp|telegram|linkedin|call me|sms)/i,
    /(http|https|www\.)/i, // URLs
    /\b\d{10,}\b/, // phone numbers
    /(bank account|routing number|ssn|social security)/i,
    /(<script>|<\/script>|javascript:)/i, // XSS
    /(password|pin|otp)/i,
    /(\bfree\s+money\b|\bclick here\b|\bsubscribe\b|\boffer\b)/i, // spam
  ];
  return patterns.some((p) => p.test(text));
};

const SellerChat = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Fetch buyer name from users collection
  const fetchBuyerName = async (buyerId) => {
    const docRef = doc(db, "users", buyerId);
    const docSnap = await getDoc(docRef);
    return docSnap.exists() ? docSnap.data().name : "Unknown Buyer";
  };

  // Listen for all conversations
  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const allMsgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

      const sellerConvosObj = {};

      for (let msg of allMsgs) {
        if (msg.receiverId === auth.currentUser.uid || msg.senderId === auth.currentUser.uid) {
          const buyerId = msg.senderId === auth.currentUser.uid ? msg.receiverId : msg.senderId;

          if (!sellerConvosObj[msg.conversationId]) {
            const name = await fetchBuyerName(buyerId);
            sellerConvosObj[msg.conversationId] = {
              conversationId: msg.conversationId,
              buyerId,
              buyerName: name,
              lastMessage: msg.text,
            };
          } else {
            sellerConvosObj[msg.conversationId].lastMessage = msg.text;
          }
        }
      }

      const convArray = Object.values(sellerConvosObj);
      setConversations(convArray);

      if (!selectedConversation && convArray.length > 0) {
        setSelectedConversation(convArray[0]);
      }
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  // Listen for messages of selected conversation
  useEffect(() => {
    if (!selectedConversation) return;

    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((msg) => msg.conversationId === selectedConversation.conversationId);

      setMessages(msgs);
      scrollToBottom();
    });

    return () => unsubscribe();
  }, [selectedConversation]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation) return;

    if (restrictMessage(newMessage)) {
      console.log("connot send message")
      return;
    }

    await addDoc(collection(db, "messages"), {
      conversationId: selectedConversation.conversationId,
      senderId: auth.currentUser.uid,
      receiverId: selectedConversation.buyerId,
      text: newMessage.trim(),
      createdAt: new Date(),
    });

    setNewMessage("");
    scrollToBottom();
  };

  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      {/* Sidebar */}
      <div className="w-full md:w-64 border-b md:border-b-0 md:border-r bg-gray-50">
        <SellerSidebar />
      </div>

      {/* Conversations & Messages */}
      <div className="flex-1 flex flex-col md:flex-row">
        {/* Conversation list */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r bg-gray-50 p-2 overflow-y-auto max-h-64 md:max-h-full">
          {conversations.map((convo) => (
            <div
              key={convo.conversationId}
              className={`p-2 cursor-pointer rounded ${
                selectedConversation?.conversationId === convo.conversationId
                  ? "bg-teal-200"
                  : "hover:bg-gray-200"
              }`}
              onClick={() => setSelectedConversation(convo)}
            >
              <p className="font-medium truncate">Buyer: {convo.buyerName}</p>
              <p className="text-sm text-gray-600 truncate">{convo.lastMessage}</p>
            </div>
          ))}
        </div>

        {/* Messages */}
        <div className="flex-1 flex flex-col bg-gray-100">
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.senderId === auth.currentUser.uid ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`p-3 rounded-xl max-w-full sm:max-w-xs md:max-w-md break-words ${
                    msg.senderId === auth.currentUser.uid ? "bg-blue-600 text-white" : "bg-white text-gray-800"
                  }`}
                >
                  {msg.text}
                  <div className="text-xs text-gray-400 mt-1 text-right">
                    {msg.createdAt?.toDate
                      ? msg.createdAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "Sending..."}
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t bg-white flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message"
              className="flex-1 border rounded-full px-4 py-2 outline-none focus:ring-2 focus:ring-blue-400"
              onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
            />
            <button
              onClick={handleSendMessage}
              className="bg-blue-600 text-white px-4 py-2 rounded-full hover:bg-blue-700 transition"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerChat;
