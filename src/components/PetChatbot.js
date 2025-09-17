import React, { useState, useEffect, useRef } from "react";
import { Send, Bot, User, X, MessageCircle, RefreshCw, Sparkles, Heart } from "lucide-react";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { petsService } from "../services/pets.services2"; // ✅ Your Firestore service

// Init Gemini with your API key
const genAI = new GoogleGenerativeAI(process.env.REACT_APP_GEMINI_API_KEY);

const PetChatbot = () => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Hi! I'm your Pet Assistant 🐾. I can answer FAQs and suggest pets based on our database. What would you like to know?",
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
    "how to add pet": 'To add a pet, go to your Profile and click "Add Pet". Fill in details like name, type, traits, and upload a photo.',
    "matching pets": "We consider traits, type, and location to suggest matches. Try asking: 'Recommend a friendly dog'",
    "forum help": "In the Forum, you can create posts, reply to discussions, and connect with other owners.",
    "account settings": "In your Profile you can update details, change email preferences, and manage your pets.",
    "safety tips": "Always meet in public places, verify vaccination records, and trust your instincts.",
  };

  // Check FAQ match
  const findFAQ = (msg) => {
    const lower = msg.toLowerCase();
    if (lower.includes("add pet")) return "how to add pet";
    if (lower.includes("match")) return "matching pets";
    if (lower.includes("forum")) return "forum help";
    if (lower.includes("account") || lower.includes("profile")) return "account settings";
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

  // Floating button when closed
  if (!isOpen) {
    return (
      <div 
        className="chatbot-float-button"
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          zIndex: 50
        }}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="btn btn-primary"
          style={{
            width: '4rem',
            height: '4rem',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'visible',
            boxShadow: 'var(--glow-purple)',
            animation: 'chatbotPulse 2s infinite'
          }}
        >
          <MessageCircle size={24} />
          
          {/* Notification badge */}
          <div 
            style={{
              position: 'absolute',
              top: '-0.25rem',
              right: '-0.25rem',
              width: '1.25rem',
              height: '1.25rem',
              background: 'linear-gradient(135deg, #ec4899, #ef4444)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              animation: 'bounce 1s infinite'
            }}
          >
            <Heart size={10} color="white" />
          </div>
        </button>
      </div>
    );
  }

  return (
    <div 
      className="chatbot-container"
      style={{
        position: 'fixed',
        bottom: '1.5rem',
        right: '1.5rem',
        width: '24rem',
        height: '40rem',
        zIndex: 50,
        maxHeight: '90vh',
        maxWidth: 'calc(100vw - 2rem)'
      }}
    >
      {/* Main chatbot container using site CSS classes */}
      <div className="glass-card" style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(139, 92, 246, 0.3)',
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        boxShadow: 'var(--glow-card)'
      }}>
        
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--primary-purple) 0%, var(--secondary-pink) 100%)',
          padding: 'var(--space-lg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'relative'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            <div style={{
              width: '2.5rem',
              height: '2.5rem',
              background: 'rgba(255, 255, 255, 0.2)',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              position: 'relative'
            }}>
              <Bot size={18} color="white" />
              <div style={{
                position: 'absolute',
                top: '-0.125rem',
                right: '-0.125rem',
                width: '0.75rem',
                height: '0.75rem',
                background: '#10b981',
                borderRadius: '50%',
                border: '2px solid white'
              }} />
            </div>
            <div>
              <h3 style={{ 
                fontWeight: 'bold', 
                color: 'white', 
                fontSize: '1.125rem',
                margin: 0 
              }}>Pet Assistant</h3>
              <p style={{ 
                color: 'rgba(255, 255, 255, 0.8)', 
                fontSize: '0.75rem',
                margin: 0 
              }}>
                {loadingPets ? "Loading pets..." : `${pets.length} pets available`}
              </p>
            </div>
          </div>
          
          <button
            onClick={() => setIsOpen(false)}
            className="btn-link"
            style={{
              color: 'white',
              padding: '0.5rem',
              borderRadius: '50%',
              transition: 'all 0.2s ease',
              backgroundColor: 'rgba(255, 255, 255, 0.1)'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'}
            onMouseLeave={(e) => e.target.style.backgroundColor = 'rgba(255, 255, 255, 0.1)'}
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages container */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: 'var(--space-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'var(--space-md)'
        }}>
          {messages.map((m) => (
            <div
              key={m.id}
              style={{
                display: 'flex',
                justifyContent: m.sender === "user" ? 'flex-end' : 'flex-start',
                alignItems: 'flex-end',
                gap: 'var(--space-sm)'
              }}
            >
              {/* Avatar for bot messages */}
              {m.sender === "bot" && (
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  background: 'linear-gradient(135deg, var(--primary-purple), var(--secondary-pink))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <Bot size={12} color="white" />
                </div>
              )}
              
              {/* Message bubble */}
              <div style={{
                maxWidth: '80%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: m.sender === "user" ? 'flex-end' : 'flex-start'
              }}>
                <div style={{
                  padding: 'var(--space-sm) var(--space-md)',
                  borderRadius: 'var(--radius-md)',
                  background: m.sender === "user" 
                    ? 'linear-gradient(135deg, var(--primary-purple), var(--secondary-pink))'
                    : 'var(--bg-secondary)',
                  color: 'var(--text-primary)',
                  border: m.sender === "bot" ? '1px solid rgba(255, 255, 255, 0.1)' : 'none',
                  boxShadow: m.sender === "user" ? 'var(--shadow-sm)' : 'none'
                }}>
                  <p style={{ 
                    margin: 0, 
                    fontSize: '0.875rem', 
                    lineHeight: 1.5 
                  }}>
                    {m.text}
                  </p>
                </div>
                
                <div style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginTop: '0.25rem'
                }}>
                  {formatTime(m.timestamp)}
                </div>
              </div>

              {/* Avatar for user messages */}
              {m.sender === "user" && (
                <div style={{
                  width: '2rem',
                  height: '2rem',
                  background: 'linear-gradient(135deg, var(--primary-purple), var(--secondary-pink))',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <User size={12} color="white" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div style={{
              display: 'flex',
              justifyContent: 'flex-start',
              alignItems: 'flex-end',
              gap: 'var(--space-sm)'
            }}>
              <div style={{
                width: '2rem',
                height: '2rem',
                background: 'linear-gradient(135deg, var(--primary-purple), var(--secondary-pink))',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Bot size={12} color="white" />
              </div>
              <div style={{
                background: 'var(--bg-secondary)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--space-sm) var(--space-md)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-sm)'
              }}>
                <RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} color="var(--text-secondary)" />
                <span style={{ 
                  fontSize: '0.875rem', 
                  color: 'var(--text-secondary)' 
                }}>
                  Thinking...
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          background: 'rgba(255, 255, 255, 0.02)',
          padding: 'var(--space-lg)'
        }}>
          <div style={{ 
            display: 'flex', 
            gap: 'var(--space-sm)', 
            alignItems: 'flex-end' 
          }}>
            <div style={{ flex: 1, position: 'relative' }}>
              <input
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask about pets, adoption, or site features..."
                className="form-group input"
                style={{
                  width: '100%',
                  background: 'var(--bg-secondary)',
                  border: '2px solid rgba(139, 92, 246, 0.2)',
                  borderRadius: 'var(--radius-md)',
                  padding: 'var(--space-sm) var(--space-md)',
                  color: 'var(--text-primary)',
                  fontSize: '0.875rem',
                  transition: 'all 0.3s ease',
                  outline: 'none'
                }}
                disabled={isLoading}
                onFocus={(e) => {
                  e.target.style.borderColor = 'var(--primary-purple)';
                  e.target.style.boxShadow = '0 0 0 3px rgba(139, 92, 246, 0.2)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = 'rgba(139, 92, 246, 0.2)';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            
            <button
              onClick={handleSend}
              disabled={isLoading || !inputMessage.trim()}
              className="btn btn-primary"
              style={{
                padding: 'var(--space-sm)',
                minWidth: '2.75rem',
                height: '2.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              {isLoading ? (
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
          
          {/* Status bar */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 'var(--space-sm)',
            fontSize: '0.75rem',
            color: 'var(--text-muted)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div style={{
                width: '0.5rem',
                height: '0.5rem',
                background: '#10b981',
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
              }} />
              <span>Assistant is online</span>
            </div>
            <div>Press Enter to send</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add required CSS animations to the component
const chatbotStyles = `
  @keyframes chatbotPulse {
    0%, 100% { 
      transform: scale(1);
      box-shadow: var(--glow-purple);
    }
    50% { 
      transform: scale(1.05);
      box-shadow: var(--glow-pink);
    }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
    40%, 43% { transform: translateY(-8px); }
    70% { transform: translateY(-4px); }
    90% { transform: translateY(-2px); }
  }
`;

// Inject styles if in browser
if (typeof document !== 'undefined' && !document.getElementById('chatbot-styles')) {
  const styleSheet = document.createElement('style');
  styleSheet.id = 'chatbot-styles';
  styleSheet.textContent = chatbotStyles;
  document.head.appendChild(styleSheet);
}

export default PetChatbot;