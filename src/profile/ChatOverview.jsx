import React, { useState, useEffect, useRef } from "react";
import { db, auth } from "../firebase";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  getDoc,
} from "firebase/firestore";
import Sidebar from "/src/profile/Sidebar";
import { motion, AnimatePresence } from "framer-motion";
import Spinner from "/src/components/common/Spinner";

const ChatOverview = () => {
  const [conversations, setConversations] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);
  const [newMessages, setNewMessages] = useState({});
  const scrollRefs = useRef({});

  // Restrict sensitive messages
  const restrictMessage = (text) => {
    const patterns = [
      /\d{5,}/, // long numbers
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/, // emails
      /\b(?:\d{4}[- ]?){3}\d{4}\b|\b\d{16}\b/, // credit/debit cards
      /(contact me via|whatsapp|telegram|linkedin|call me|sms)/i, // contact requests
      /(http|https|www\.)/i, // URLs
      /\b\d{10,}\b/, // phone numbers
      /(bank account|routing number|ssn|social security)/i,
      /(<script>|<\/script>|javascript:)/i,
      /(password|pin|otp)/i,
      /(\bfree\s+money\b|\bclick here\b|\bsubscribe\b|\boffer\b)/i,
    ];
    return patterns.some((p) => p.test(text));
  };

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const allMsgs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      const convosMap = {};

      await Promise.all(
        allMsgs
          .filter(
            (msg) =>
              msg.senderId === auth.currentUser.uid || msg.receiverId === auth.currentUser.uid
          )
          .map(async (msg) => {
            const sellerId = msg.senderId !== auth.currentUser.uid ? msg.senderId : msg.receiverId;

            if (!convosMap[msg.conversationId]) {
              try {
                const sellerDoc = await getDoc(doc(db, "sellers", sellerId));
                const sellerName = sellerDoc.exists() ? sellerDoc.data().name : sellerId;
                convosMap[msg.conversationId] = {
                  conversationId: msg.conversationId,
                  sellerId,
                  sellerName,
                  messages: [msg],
                };
              } catch {
                convosMap[msg.conversationId] = {
                  conversationId: msg.conversationId,
                  sellerId,
                  sellerName: sellerId,
                  messages: [msg],
                };
              }
            } else {
              convosMap[msg.conversationId].messages.push(msg);
            }
          })
      );

      setConversations(Object.values(convosMap));
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const toggleConversation = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
    setTimeout(() => scrollToBottom(id), 100);
  };

  const handleSendMessage = async (conversation) => {
    const text = newMessages[conversation.conversationId];
    if (!text || restrictMessage(text)) return;

    try {
      await addDoc(collection(db, "messages"), {
        conversationId: conversation.conversationId,
        senderId: auth.currentUser.uid,
        receiverId: conversation.sellerId,
        text,
        createdAt: serverTimestamp(),
      });
      setNewMessages((prev) => ({ ...prev, [conversation.conversationId]: "" }));
      scrollToBottom(conversation.conversationId);
    } catch (err) {
      console.error("Error sending message:", err.message);
    }
  };

  const scrollToBottom = (conversationId) => {
    if (scrollRefs.current[conversationId]) {
      scrollRefs.current[conversationId].scrollTop =
        scrollRefs.current[conversationId].scrollHeight;
    }
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <Spinner />
        <p className="text-gray-600 dark:text-gray-300">Loading chats...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 text-gray-800 dark:text-gray-200 mb-20">
      <div className="flex flex-col md:flex-row gap-4">
        <Sidebar />
        <motion.div
          className="md:w-3/4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-2xl font-bold mb-6">Your Conversations</h1>

          {conversations.length === 0 ? (
            <p className="text-gray-600 dark:text-gray-400 text-center mt-10">
              No messages yet
            </p>
          ) : (
            <div className="space-y-4">
              {conversations.map((convo) => (
                <div
                  key={convo.conversationId}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
                >
                  {/* Seller Header */}
                  <div
                    onClick={() => toggleConversation(convo.conversationId)}
                    className="cursor-pointer flex items-center gap-3 mb-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                      {getInitials(convo.sellerName)}
                    </div>
                    <p className="font-medium text-gray-800 dark:text-gray-100">
                      {/* {convo.sellerName} */}
                      Seller
                    </p>
                    <span className="ml-auto text-gray-400">
                      {expanded[convo.conversationId] ? "▲" : "▼"}
                    </span>
                  </div>

                  {/* Messages */}
                  <AnimatePresence>
                    {expanded[convo.conversationId] && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-2 max-h-96 overflow-y-auto p-2 border-t border-gray-200 dark:border-gray-700"
                        ref={(el) => (scrollRefs.current[convo.conversationId] = el)}
                      >
                        {convo.messages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`max-w-xs p-2 rounded-lg ${
                              msg.senderId === auth.currentUser.uid
                                ? "bg-blue-500 text-white self-end"
                                : "bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 self-start"
                            }`}
                          >
                            <p className="text-sm">
                              {restrictMessage(msg.text) ? "⚠️ Restricted Message" : msg.text}
                            </p>
                            <span className="text-xs text-gray-400">
                              {msg.createdAt?.toDate
                                ? new Date(msg.createdAt.toDate()).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })
                                : ""}
                            </span>
                          </div>
                        ))}

                        {/* Input for new message */}
                        <div className="flex gap-2 mt-2">
                          <input
                            type="text"
                            value={newMessages[convo.conversationId] || ""}
                            onChange={(e) =>
                              setNewMessages((prev) => ({
                                ...prev,
                                [convo.conversationId]: e.target.value,
                              }))
                            }
                            placeholder="Type a message..."
                            className="flex-1 p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:text-gray-200"
                          />
                          <button
                            onClick={() => handleSendMessage(convo)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition"
                          >
                            Send
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ChatOverview;
