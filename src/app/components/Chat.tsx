'use client';
import { useState, useEffect, useRef } from 'react';
import { useConvData } from '../contexts/ConversationContext';
import { FaPaperPlane, FaRedo } from 'react-icons/fa';
import { MdEdit, MdDeleteOutline } from 'react-icons/md';

export default function Chat() {
  const { 
    getActiveConversation, 
    getMessages, 
    sendMessage, 
    deleteMessage, 
    editMessage, 
    regenerateMessage 
  } = useConvData();
  
  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = getActiveConversation();
  const messages = getMessages();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea as user types
  useEffect(() => {
    if (textAreaRef.current) {
      textAreaRef.current.style.height = 'auto';
      textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
    }
  }, [inputText]);

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeConversation) return;
    
    if (editingMessageId) {
      // Edit existing message
      editMessage(editingMessageId, inputText);
      setEditingMessageId(null);
    } else {
      // Send new message
      sendMessage(inputText, 'user', new Date(), undefined, 'You');
      
      // Simulate assistant response (you would replace this with real API call)
      
    }
    
    setInputText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const startEditMessage = (id: string, text: string) => {
    setEditingMessageId(id);
    setInputText(text);
    if (textAreaRef.current) {
      textAreaRef.current.focus();
    }
  };

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="text-white/60 text-lg">Select or create a conversation to start chatting</div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-screen bg-gradient-to-br from-gray-900 to-black">
      {/* Conversation header */}
      <div className="p-4">
        <h2 className="text-xl font-semibold text-white">{activeConversation.title}</h2>
        <p className="text-white/60 text-sm">Model: {activeConversation.model}</p>
      </div>
      <div className="bg-gradient-to-r from-transparent via-white/50 to-transparent h-[2px] w-[100%] mb-3"></div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60 text-lg">No messages yet. Start a conversation!</div>
          </div>
        ) : (
          messages.map((message) => (
            <div 
              key={message.id} 
              className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] rounded-lg p-4 ${
                message.sender === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white/10 text-white'
              }`}>
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium">{message.senderName}</span>
                  <span className="text-xs opacity-60">
                    {new Date(message.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{message.text}</p>
                
                {/* Message actions */}
                <div className={`flex gap-2 mt-2 justify-${message.sender === 'user' ? 'end' : 'start'}`}>
                  {message.sender === 'user' && (
                    <button 
                      onClick={() => startEditMessage(message.id, message.text)}
                      className="text-white/60 hover:text-white"
                      title="Edit message"
                    >
                      <MdEdit size={18} />
                    </button>
                  )}
                  {message.sender === 'assistant' && (
                    <button 
                      onClick={() => regenerateMessage(message.id)}
                      className="text-white/60 hover:text-white"
                      title="Regenerate response"
                    >
                      <FaRedo size={16} />
                    </button>
                  )}
                  <button 
                    onClick={() => deleteMessage(message.id)}
                    className="text-white/60 hover:text-white"
                    title="Delete message"
                  >
                    <MdDeleteOutline size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Input area */}
      <div className="border-t border-white/20 p-4">
        <div className="relative">
          <textarea
            ref={textAreaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="w-full bg-white/5 text-white rounded-lg py-3 px-4 pr-12 resize-none min-h-[50px] max-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
          />
          <button 
            onClick={handleSendMessage}
            disabled={!inputText.trim()}
            className="absolute right-3 bottom-3 text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed"
          >
            <FaPaperPlane size={20} />
          </button>
        </div>
        <div className="text-xs text-white/40 mt-2">
          Press Enter to send, Shift+Enter for new line
        </div>
      </div>
    </div>
  );
}
