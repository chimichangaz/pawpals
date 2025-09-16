// src/components/PetChatbot.js
import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, X, MessageCircle, RefreshCw } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { petsService } from "../services/pets.services2"; // ✅ Firestore service

// Init Gemini
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

const PetChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your Pet Assistant 🤖. I can answer FAQs and suggest pets based on our database. What would you like to know?",
      sender: "bot",
      timestamp: new Date(),
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pets, setPets] = useState([]);
  const [loadingPets, setLoadingPets] = useState(true);

  const messagesEndRef = useRef(null);

  // Fetch pets from Firestore
  useEffect(() => {
    const fetchPets = async () => {
      try {
        setLoadingPets(true);
        const petsData = await petsService.getAllPets();
        setPets(petsData);
      } catch (err) {
        console.error("Error fetching pets:", err);
      } finally {
        setLoadingPets(false);
      }
    };
    fetchPets();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // FAQs
  const faqResponses = {
    "how to add pet":
      'To add a pet, go to your Profile and click "Add Pet". Fill in details like name, type, traits, and upload a photo.',
    "matching pets":
      "We consider traits, type, and location to suggest matches. Try asking: 'Recommend a friendly dog'",
    "forum help":
      "In the Forum, you can create posts, reply to discussions, and connect with other owners.",
    "account settings":
      "In your Profile you can update details, change email preferences, and manage your pets.",
    "safety tips":
      "Always meet in public places, verify vaccination records, and trust your instincts.",
  };

  // Check FAQ match
  const findFAQ = (msg) => {
    const lower = msg.toLowerCase();
    if (lower.includes("add pet")) return "how to add pet";
    if (lower.includes("match")) return "matching pets";
    if (lower.includes("forum")) return "forum help";
    if (lower.includes("account") || lower.includes("profile"))
      return "account settings";
    if (lower.includes("safety")) return "safety tips";
    return null;
  };

  // Handle send
  const handleSend = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      text: inputMessage,
      sender: "user",
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      // 1. FAQ quick answer
      const faqKey = findFAQ(inputMessage);
      if (faqKey) {
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now() + 1,
            text: faqResponses[faqKey],
            sender: "bot",
            timestamp: new Date(),
          },
        ]);
        return;
      }

      // 2. Gemini with pets context
      const siteContext = `
You are the Pet Assistant chatbot for a pet adoption website.
Only answer about pets, adoption, and site features.
Never answer unrelated questions.

Here is the current pet database:
${JSON.stringify(pets, null, 2)}

User's question: ${inputMessage}
`;

      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      const result = await model.generateContent(siteContext);
      const text = result.response.text();

      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text,
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } catch (err) {
      console.error("Gemini API error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          text: "⚠️ Sorry, something went wrong connecting to Gemini.",
          sender: "bot",
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp) =>
    timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // --- UI ---
  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white p-4 rounded-full shadow-lg"
      >
        <MessageCircle size={24} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 w-96 h-[600px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4 rounded-t-lg flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot size={20} />
          <h3 className="font-semibold">Pet Assistant</h3>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="hover:bg-white/20 rounded-full p-1"
        >
          <X size={18} />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${
              m.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`p-3 rounded-lg max-w-[80%] ${
                m.sender === "user"
                  ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-br-sm"
                  : "bg-gray-100 text-gray-800 rounded-bl-sm"
              }`}
            >
              <p className="text-sm">{m.text}</p>
            </div>
            <div className="text-xs text-gray-400 ml-2 self-end">
              {formatTime(m.timestamp)}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="flex items-center space-x-2 bg-gray-100 p-3 rounded-lg">
              <RefreshCw size={14} className="animate-spin" />
              <span className="text-sm text-gray-500">Thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about pets or site features..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={isLoading || !inputMessage.trim()}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-2 rounded-lg"
          >
            <Send size={16} />
          </button>
        </div>
        <div className="mt-2 text-xs text-gray-500">
          {loadingPets
            ? "Loading pets..."
            : `${pets.length} pets available in database`}
        </div>
      </div>
    </div>
  );
};

export default PetChatbot;
