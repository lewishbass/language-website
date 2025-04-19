'use client';
import { useState, useEffect, useRef } from 'react';
import { useConvData } from '../contexts/ConversationContext';
import { FaPaperPlane, FaRedo } from 'react-icons/fa';
import { MdEdit, MdDeleteOutline } from 'react-icons/md';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import { MathJax } from 'better-react-mathjax';

import { CopyBlock, obsidian } from 'react-code-blocks';


export default function Chat() {
  const {
    activeConversation,
    messages,
    sendMessage,
    deleteMessage,
    editMessage,
    regenerateMessage,
    getModelChoices,
    activeModel,
    setActiveModel,
    updateConversation,
    generating,
  } = useConvData();

  const [inputText, setInputText] = useState('');
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [showSystemPrompt, setShowSystemPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');


  const textResizeTimeout = useRef<NodeJS.Timeout | null>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load system prompt when active conversation changes
  useEffect(() => {
    if (activeConversation) {
      setSystemPrompt(activeConversation.systemPrompt || '');
    }
  }, [activeConversation]);

  // Auto-resize textarea as user types with debouncing
  useEffect(() => {
    if (textResizeTimeout.current) {
      clearTimeout(textResizeTimeout.current);
    }
    const timeoutId = setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.style.height = 'auto';
        textAreaRef.current.style.height = `${textAreaRef.current.scrollHeight}px`;
      }
    }, 100);

    return () => clearTimeout(timeoutId);
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
    if (e.key === 'Enter' && !e.shiftKey && !generating) {
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

  const handleSystemPromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setSystemPrompt(e.target.value);
  };

  const saveSystemPrompt = () => {
    if (activeConversation) {
      updateConversation(activeConversation.id, { systemPrompt });
      setShowSystemPrompt(false);
    }
  };

  const formatMessage = (message: string) => {

    const codesections = message.split(/```/g).map((section, index) => {
      if (index % 2 === 0) {
        return <MathJax key={index}>
          <ReactMarkdown
            remarkPlugins={[remarkGfm, remarkMath]}
            rehypePlugins={[rehypeKatex]}>
            {section}
          </ReactMarkdown>
        </MathJax >
      }
      else {
        const language = section.split('\n')[0].trim(); // Get the language from the first line
        const code = section.split('\n').slice(1).join('\n'); // Get the code from the rest of the lines
        return <CopyBlock
          key={index}
          text={code}
          language={language}
          showLineNumbers={true}
          theme={obsidian}
          codeBlock
          customStyle={{
            fontSize: '0.9em',
            padding: '0.1rem',
            margin: '10px 10px',
            borderRadius: '1rem',
            overflow: 'auto',
            maxWidth: '100%',
            lineHeight: '1',
          }}
        />
      }
    });

    return codesections;

  }


  useEffect(() => {
    console.log('Active Conv:', activeConversation);
  }, [activeConversation]);

  if (!activeConversation) {
    return (
      <div className="flex-1 flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-black">
        <div className="text-white/60 text-lg">Select or create a conversation to start chatting</div>
      </div>
    );
  }


  return (
    <div className="flex-1 flex flex-col h-screen bg-gradient-to-br from-gray-900 to-black overflow-x-hidden max-w-full">
      {/* Conversation header */}
      <div className="p-4">
        <div className="flex items-center align-center mb-2">
          {activeModel && activeModel?.logoURL &&
            <img src={activeModel.logoURL} alt="Logo" className="w-8 h-8 rounded-full mr-2" style={{ filter: "drop-shadow(2px 2px 1px #fff1)" }} />
          }
          <h2 className="text-xl font-semibold text-white">{activeConversation.title}</h2>

          <div className="relative fancy-select-wrapper inline-block ml-auto">
            <select
              value={activeModel?.id}
              onChange={(e) => {
                setActiveModel(e.target.value);
              }}
              className="fancy-select appearance-none bg-gray-800/60 text-white border border-gray-700 rounded px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2  backdrop-blur-sm transition-all duration-200"
            >
              {getModelChoices().map(model => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-white/70">
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>
        </div>
        <div className="flex items-center">
          <button
            onClick={() => setShowSystemPrompt(true)}
            className="ml-2 text-white/40 hover:text-white"
            title={showSystemPrompt ? "Hide system prompt" : "Edit system prompt"}
          >
            <MdEdit size={18} />
          </button>
          <span className="text-white/60 text-xs mr-2 ml-2 py-1">System Prompt:</span>
          {showSystemPrompt && <><button
            onClick={() => {
              setShowSystemPrompt(false)
              setSystemPrompt(activeConversation.systemPrompt || '');
            }
            }
            className="text-white/60 hover:text-white text-xs mr-2 ml-auto"
          >
            Cancel
          </button>
            <button
              onClick={saveSystemPrompt}
              className="bg-blue-600 text-white px-3 py-1 rounded-md text-xs hover:bg-blue-500"
            >
              Save Prompt
            </button></>}
        </div>
        {showSystemPrompt ? (
          <div className="mt-2 mb-0">
            <textarea
              value={systemPrompt}
              onChange={handleSystemPromptChange}
              placeholder="Enter system prompt..."
              className="custom-scrollbar w-full bg-white/10 text-white rounded-lg py-2 px-3 resize-none min-h-[75px] max-h-[75px] focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              rows={3}
            />
          </div>
        ) : (

          <div className="mt-2 mb-1">

            <div className="bg-white/5 rounded-lg py-2 px-3 text-white/80 text-sm max-h-[75px] overflow-y-auto custom-scrollbar">
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  p: ({ ...props }) => <p className="whitespace-pre-wrap" {...props} />
                }}
              >
                {systemPrompt || 'No system prompt set.'}
              </ReactMarkdown>
            </div>
          </div>

        )}


      </div>
      <div className="bg-gradient-to-r from-transparent via-white/50 to-transparent h-[2px] w-[100%] mb-3"></div>

      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar overflow-x-hidden max-w-full">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-white/60 text-lg">No messages yet. Start a conversation!</div>
          </div>
        ) : (
          messages.map((message) => (

            <div className={`w-full rounded-lg p-4 ${message.sender === 'user'
              ? 'bg-white/0 text-white'
              : 'bg-white/0 text-white'
              }`} key={message.id}>
              <div className="flex items-center mb-2 pl-4 space-x-1">
                {
                  message.logoURL && <img src={message.logoURL} alt="Logo" className="w-8 h-8 rounded-full mr-2" style={{ filter: "drop-shadow(1px 1px 3px #fff8)" }} />
                }

                <span className="font-bold text-xl mr-2">{message.senderName}</span>
                {message.sender === 'user' && (
                  <button
                    onClick={() => startEditMessage(message.id, message.text)}
                    className="wg text-white/40 hover:text-white"
                    title="Edit message"
                  >
                    <MdEdit size={18} />
                  </button>
                )}
                {message.sender === 'assistant' && (
                  <button
                    onClick={() => regenerateMessage(message.id)}
                    className="wg text-white/40 hover:text-white"
                    title="Regenerate response"
                  >
                    <FaRedo size={16} />
                  </button>
                )}
                <button
                  onClick={() => deleteMessage(message.id)}
                  className="wg text-white/40 hover:text-white"
                  title="Delete message"
                >
                  <MdDeleteOutline size={18} />
                </button>
                <span className="text-xs opacity-30 ml-auto">
                  {new Date(message.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="h-[4px] w-[100%] mb-3 rounded-full" style={{
                background: message.sender === 'user'
                  ? 'linear-gradient(to right, #3b82f6, #9333ea, #6366f100 90%)'
                  : 'linear-gradient(to right, #84cc1600 10%, #f97316, #fbbf24)'
              }}></div>

              <div className={"max-w-full " + (message.sender === 'user' ? 'text-white/80' : 'text-white/95')}>

                {formatMessage(message.text)}
              </div>


            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-white/20 p-4">
        <div className="relative">
          {editingMessageId && <div className='text-sm opacity-20 mb-2'>Editing Message {editingMessageId}</div>}
          <textarea
            ref={textAreaRef}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="custom-scrollbar w-full bg-white/5 text-white rounded-lg py-3 px-4 pr-12 resize-none min-h-[50px] max-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={1}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputText.trim() || generating}
            className="cursor-pointer absolute right-3 bottom-5 text-blue-400 hover:text-blue-300 disabled:text-gray-500 disabled:cursor-not-allowed"
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
