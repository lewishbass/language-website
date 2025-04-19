'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { getCompletion, getSummary } from '../utils/OpenRouterInterface';

// Define types for our conversation data
interface Message {
  id: string;
  text: string;
  sender: string; // 'user' or 'assistant'
  senderName: string; // Name of the sender
  timestamp: Date;
  logoURL?: string; // Optional logo URL for the sender
}

interface Conversation {
  id: string;
  title: string;
  lastUpdated: Date;
  lastMessage: string; // The last message text
  isPinned: boolean; // Flag to indicate if the conversation is pinned
  contentPointer: string;
  model: string; // The model used for the conversation
  logoURL?: string; // Optional logo URL for the conversation
  systemPrompt?: string; // Optional system prompt for the conversation
}

interface ModelChoice {
  id: string;
  name: string;
  description: string;
  logoURL?: string; // Optional logo URL for the model
  cost: number; // Cost associated with the model
}

const modelChoices: ModelChoice[] = [
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1-mini', description: 'Fast and capable OpenAI model', logoURL: '/logos/openai.svg', cost: 1.6 },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', description: 'Fast, efficient Google AI model', logoURL: '/logos/gemini.svg', cost: 0.4 },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', description: 'Compact, efficient Anthropic model', logoURL: '/logos/claude.svg', cost: 4 },
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', description: 'Advanced open-source model from Meta', logoURL: '/logos/meta.svg', cost: 0.6 },
]

interface ConversationContextType {
  conversations: Conversation[];
  addConversation: (title: string, model: string) => string;
  getConversations: () => Conversation[];
  activeConversation: Conversation | null; // Function to get the active conversation
  messages: Message[]; // State to hold messages
  updateConversation: (id: string, updates: Partial<Conversation>) => boolean;
  deleteConversation: (id: string) => boolean;

  getModelChoices: () => ModelChoice[]; // Function to get model choices
  setActiveModel: (modelId: string) => void; // Function to set the active model choice
  activeModel: ModelChoice | undefined; // State to hold the active model choice

  activateConversation: (id: string) => void; // Function to activate a conversation

  sendMessage: (text: string, sender: string, timestamp: Date, logoURL?: string, senderName?: string) => Promise<boolean>;
  deleteMessage: (id: string) => boolean; // Deletes message and children
  editMessage: (id: string, text: string) => boolean; // Function to edit a message
  regenerateMessage: (id: string) => boolean; // Function to regenerate a message

  generating: boolean; // State to hold the generating status
}

// Create the context with a default undefined value
const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

// Provider component
export function ConversationProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]); // State to hold messages
  const [activeModel, ssetActiveModel] = useState<ModelChoice | undefined>(undefined); // State to hold the active model choice
  const [generating, setGenerating] = useState<boolean>(false); // State to hold the generating status

  const saveConversations = (conversations: Conversation[]) => {
    // Save conversations to local storage or any other persistent storage
    localStorage.setItem('conversations', JSON.stringify(conversations));
    return true;
  };

  const loadConversations = () => {
    // Load conversations from local storage or any other persistent storage
    const storedConversations = localStorage.getItem('conversations');
    if (storedConversations) {
      setConversations(JSON.parse(storedConversations));
    }
  };
  useEffect(() => {
    loadConversations(); // Load conversations when the component mounts
  }, []);

  const saveMessages = (contentPointer: string, messages: Message[]) => {
    // Save messages to local storage or any other persistent storage
    localStorage.setItem(contentPointer, JSON.stringify(messages));
    return true;
  }

  const deleteMessages = (contentPointer: string) => {
    // Delete messages from local storage or any other persistent storage
    localStorage.removeItem(contentPointer);
    return true;
  }

  const loadMessages = (contentPointer: string) => {
    // Load messages from local storage or any other persistent storage
    const storedMessages = localStorage.getItem(contentPointer);
    if (storedMessages) {
      setMessages(JSON.parse(storedMessages));
      return true;
    }
    return false;
  };

  const getConversations = () => {
    return conversations;
  };

  const addConversation = (title: string, model: string) => {
    const id = Date.now().toString(); // Simple ID generation
    const newConversation = {
      id,
      title,
      lastUpdated: new Date(), // Set the last updated time to now
      lastMessage: '', // Initialize with an empty string
      isPinned: false, // Default value for isPinned
      contentPointer: `messages_${id}`, // Unique content pointer for messages
      model, // Model used for the conversation
      logoURL: getModelChoices().find(modelChoice => modelChoice.id === model)?.logoURL, // Get the logo URL for the model
    };

    saveMessages(newConversation.contentPointer, []); // Initialize messages for the new conversation
    saveConversations([...conversations, newConversation]);
    setConversations(prev => [...prev, newConversation]);
    setActiveConversation(newConversation); // Set the new conversation as active
    loadMessages(newConversation.contentPointer); // Load messages for the new conversation
    ssetActiveModel(getModelChoices().find(modelChoice => modelChoice.id === model)); // Set the active model based on the conversation
    return id;
  };

  const updateConversation = (id: string, updates: Partial<Conversation>) => {
    let updated = false;



    const updatedConversations = conversations.map(conv => {
      if (conv.id === id) {
        updated = true;
        return { ...conv, ...updates };
      }
      return conv;
    });


    saveConversations(updatedConversations);
    setConversations(updatedConversations);

    if (id === activeConversation?.id) {
      setActiveConversation(prev => prev ? { ...prev, ...updates } : null); // Update active conversation if it was updated
    }

    return updated;
  };

  const deleteConversation = (id: string) => {

    if (activeConversation && activeConversation.id === id) {
      setActiveConversation(null); // Clear active conversation if it's deleted
    }

    let deleted = false;
    conversations.forEach(conv => {
      if (conv.id === id) {
        deleted = true;
      }
    });
    if (!deleted) return deleted; // If not found, return false
    const contentPointer = conversations.find(conv => conv.id === id)?.contentPointer;
    if (contentPointer) {
      deleteMessages(contentPointer); // Delete messages associated with the conversation
    }

    // Remove the conversation from the list
    const updatedConversations = conversations.filter(conv => conv.id !== id);
    saveConversations(updatedConversations);
    setConversations(updatedConversations);

    return deleted;
  };

  const activateConversation = (id: string) => {
    const conversation = conversations.find(conv => conv.id === id);
    if (conversation) {
      setActiveConversation(conversation);
      ssetActiveModel(getModelChoices().find(model => model.id === conversation.model)); // Set the active model based on the conversation
      const loaded = loadMessages(conversation.contentPointer); // Load messages for the active conversation
      if (!loaded) {
        console.error(`Messages for conversation with id ${id} not found`);
        return false;
      }
    } else {
      console.error(`Conversation with id ${id} not found`);
      return false;
    }
    return true;
  };

  const sendMessage = async (text: string, sender: string, timestamp: Date, logoURL?: string, senderName?: string) => {
    const newMessage: Message = {
      id: Date.now().toString(), // Simple ID generation
      text,
      sender,
      senderName: senderName || (sender === 'user' ? 'User' : 'Assistant'), // Default sender name
      timestamp,
      logoURL,
    };

    const updatedMessages = [...messages, newMessage];
    if (!activeConversation || !activeConversation.contentPointer) {
      console.error('No active conversation to send the message to.');
      return false;
    }
    saveMessages(activeConversation.contentPointer, updatedMessages); // Save messages to local storage
    setMessages(updatedMessages);

    updateConversation(activeConversation.id, {
      lastUpdated: new Date(), // Update the last updated time
      lastMessage: text, // Update the last message text
    });

    // If this is a user message, generate an AI response
    if (sender === 'user' && activeModel) {
      // Set generating status to true
      setGenerating(true);
      try {
        // Call getCompletion to get a response from the AI
        const responseText = await getCompletion(
          activeConversation.model,
          updatedMessages,
          activeConversation.systemPrompt, // Pass the system prompt if available
        );

        // Create and send the assistant's response
        const assistantMessage: Message = {
          id: Date.now().toString(),
          text: responseText,
          sender: 'assistant',
          senderName: 'Assistant',
          timestamp: new Date(),
          logoURL: activeModel.logoURL
        };

        // Add the assistant message
        const messagesWithResponse = [...updatedMessages, assistantMessage];
        saveMessages(activeConversation.contentPointer, messagesWithResponse);
        setMessages(messagesWithResponse);

        // Update the conversation metadata
        updateConversation(activeConversation.id, {
          lastUpdated: new Date(),
          lastMessage: responseText,
        });
        if (activeConversation.title === 'New Conversation' || messagesWithResponse.length % 20 < 2) {
          const summaryText = await getSummary(activeConversation.model, messagesWithResponse);
          updateConversation(activeConversation.id, {
            title: summaryText, // Update the conversation title with the summary
            lastUpdated: new Date(), // Update the last updated time
            lastMessage: responseText, // Update the last message text
          });
        }

      } catch (error) {
        console.error('Error generating AI response:', error);
        // Create an error message if the API call fails
        const errorMessage: Message = {
          id: Date.now().toString(),
          text: "Sorry, I couldn't generate a response. Please try again.",
          sender: 'assistant',
          senderName: 'Assistant',
          timestamp: new Date(),
          logoURL: activeModel.logoURL
        };

        const messagesWithError = [...updatedMessages, errorMessage];
        saveMessages(activeConversation.contentPointer, messagesWithError);
        setMessages(messagesWithError);

      } finally {
        // Set generating status back to false when done
        setGenerating(false);
      }
    }

    return true;
  }

  const deleteMessage = (id: string) => {
    const updatedMessages = messages.filter(message => message.id !== id);
    if (!activeConversation || !activeConversation.contentPointer) {
      console.error('No active conversation to delete the message from.');
      return false;
    }
    saveMessages(activeConversation.contentPointer, updatedMessages); // Save messages to local storage
    setMessages(updatedMessages);

    return true;
  }

  const editMessage = (id: string, text: string) => {
    const messageIndex = messages.findIndex(message => message.id === id);
    if (messageIndex === -1) {
      console.error(`Message with id ${id} not found`);
      return false;
    }

    const editedMessage: Message = {
      ...messages[messageIndex],
      text,
      timestamp: new Date(), // Update the timestamp to the current time
    };

    const updatedMessages = messages.map(message => {
      if (message.id === id) {
        return editedMessage;
      }
      return message;
    });
    if (!activeConversation || !activeConversation.contentPointer) {
      console.error('No active conversation to edit the message in.');
      return false;
    }
    saveMessages(activeConversation.contentPointer, updatedMessages); // Save messages to local storage
    setMessages(updatedMessages); // Update the messages state
    return true;
  }

  const regenerateMessage = (id: string) => {
    const messageIndex = messages.findIndex(message => message.id === id);
    if (messageIndex === -1) {
      console.error(`Message with id ${id} not found`);
      return false;
    }
    const regeneratedMessage: Message = {
      ...messages[messageIndex],
      text: 'Regenerated message', // Placeholder for the regenerated message text
      timestamp: new Date(), // Update the timestamp to the current time
    };
    const updatedMessages = messages.filter(message => message.timestamp >= messages[messageIndex].timestamp);
    if (!activeConversation || !activeConversation.contentPointer) {
      console.error('No active conversation to regenerate the message in.');
      return false;
    }
    saveMessages(activeConversation.contentPointer, updatedMessages); // Save messages to local storage 
    setMessages(updatedMessages); // Update the messages state
    sendMessage(regeneratedMessage.text, regeneratedMessage.sender, regeneratedMessage.timestamp, regeneratedMessage.logoURL, regeneratedMessage.senderName); // Send the regenerated message
    return true;
  }

  const getModelChoices = () => {
    return modelChoices;
  }



  const setActiveModel = (modelId: string) => {
    if (activeConversation) {
      updateConversation(activeConversation.id, { model: modelId, logoURL: getModelChoices().find(model => model.id === modelId)?.logoURL });
      ssetActiveModel(getModelChoices().find(model => model.id === modelId));

    }
  }

  const value = {
    conversations,
    addConversation,
    getConversations,
    messages,
    updateConversation,
    deleteConversation,
    activateConversation,
    sendMessage,
    deleteMessage,
    editMessage,
    regenerateMessage,
    getModelChoices,
    setActiveModel,
    activeConversation,
    activeModel,
    generating,
  };

  return (
    <ConversationContext.Provider value={value}>
      {children}
    </ConversationContext.Provider>
  );
}

// Hook for using the conversation context
export function useConvData() {
  const context = useContext(ConversationContext);

  if (context === undefined) {
    throw new Error('useConvData must be used within a ConversationProvider');
  }

  return context;
}

// Export the Message and other types for use in other components
export type { Message, Conversation, ModelChoice };