'use client';

import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// Define types for our conversation data
interface Message{
   id:string;
   text:string;
   sender:string; // 'user' or 'assistant'
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
}



interface ConversationContextType {
  conversations: Conversation[];
  addConversation: (title:string, model:string) => string;
  getConversations: () => Conversation[];
  getActiveConversation: () => Conversation | null; // Function to get the active conversation
  getMessages: () => Message[]; // Function to get messages for a conversation
  updateConversation: (id: string, updates: Partial<Conversation>) => boolean;
  deleteConversation: (id: string) => boolean;

  activateConversation: (id: string) => void; // Function to activate a conversation

  sendMessage: (text:string, sender:string, timestamp:Date, logoURL?:string, senderName?:string) => boolean;
  deleteMessage: (id:string) => boolean; // Deletes message and children
  editMessage: (id:string, text:string) => boolean; // Function to edit a message
  regenerateMessage: (id:string) => boolean; // Function to regenerate a message
}

// Create the context with a default undefined value
const ConversationContext = createContext<ConversationContextType | undefined>(undefined);

// Provider component
export function ConversationProvider({ children }: { children: ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]); // State to hold messages

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

  const saveMessages = (contentPointer:string, messages: Message[]) => {
    // Save messages to local storage or any other persistent storage
    localStorage.setItem(contentPointer, JSON.stringify(messages));
    return true;
  }
  
  const deleteMessages = (contentPointer:string) => {
    // Delete messages from local storage or any other persistent storage
    localStorage.removeItem(contentPointer);
    return true;
  }

  const loadMessages = (contentPointer:string) => {
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

  const getActiveConversation = () => {
    return activeConversation;
  };

  const getMessages = () => {
    return messages;
  }
    
  const addConversation = (title:string, model:string) => {
    const id = Date.now().toString(); // Simple ID generation
    const newConversation = { 
      id,
      title,
      lastUpdated: new Date(), // Set the last updated time to now
      lastMessage: '', // Initialize with an empty string
      isPinned: false, // Default value for isPinned
      contentPointer: `messages_${id}`, // Unique content pointer for messages
      model, // Model used for the conversation
    };
    
    saveMessages(newConversation.contentPointer, []); // Initialize messages for the new conversation
    saveConversations([...conversations, newConversation]);
    setConversations(prev => [...prev, newConversation]);
    setActiveConversation(newConversation); // Set the new conversation as active
    loadMessages(newConversation.contentPointer); // Load messages for the new conversation
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

    return updated;
  };

  const deleteConversation = (id: string) => {

    if ( activeConversation && activeConversation.id === id) {
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

  const sendMessage = (text:string, sender:string, timestamp:Date, logoURL?:string, senderName?:string) => {
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
    console.log(updatedMessages)

    updateConversation(activeConversation.id, {
      lastUpdated: new Date(), // Update the last updated time
      lastMessage: text, // Update the last message text
    });

    return true;
  }

  const deleteMessage = (id:string) => {
    const updatedMessages = messages.filter(message => message.id !== id);
    if (!activeConversation || !activeConversation.contentPointer) {
      console.error('No active conversation to delete the message from.');
      return false;
    }
    saveMessages(activeConversation.contentPointer, updatedMessages); // Save messages to local storage
    setMessages(updatedMessages);
    
    return true;
  }

  const editMessage = (id:string, text:string) => {
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

    // delete messages before the edited message
    const updatedMessages = messages.filter(message => message.timestamp >= messages[messageIndex].timestamp);

    if (!activeConversation || !activeConversation.contentPointer) {
      console.error('No active conversation to edit the message in.');
      return false;
    }
    saveMessages(activeConversation.contentPointer, updatedMessages); // Save messages to local storage
    setMessages(updatedMessages); // Update the messages state

    sendMessage(editedMessage.text, editedMessage.sender, editedMessage.timestamp, editedMessage.logoURL, editedMessage.senderName); // Send the edited message
    return true;
  }

  const regenerateMessage = (id:string) => {
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


  const value = {
    conversations,
    addConversation,
    getConversations,
    getMessages,
    updateConversation,
    deleteConversation,
    activateConversation,
    sendMessage,
    deleteMessage,
    editMessage,
    regenerateMessage,
    getActiveConversation,
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
