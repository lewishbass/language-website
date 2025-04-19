'use client';

import { Message } from '../contexts/ConversationContext';

// Types for OpenRouter API
interface OpenRouterMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface OpenRouterCompletionResponse {
  id: string;
  model: string;
  choices: {
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// Format our app's Message[] into OpenRouter's expected format
export const formatConversation = (messages: Message[]): OpenRouterMessage[] => {
  return messages.map(message => {
    // Map sender to role
    let role: 'user' | 'assistant' | 'system';
    
    if (message.sender === 'user') {
      role = 'user';
    } else if (message.sender === 'system') {
      role = 'system';
    } else {
      role = 'assistant';
    }

    // Create the OpenRouter message format
    return {
      role,
      content: message.text
    };
  });
};

// Main function to get completion from OpenRouter
export const getCompletion = async (
  model: string, 
  messages: Message[],
  systemMessage?: string | undefined
): Promise<string> => {
  // Get API key from environment variables
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  
  if (!apiKey) {
    throw new Error('OpenRouter API key is not set in environment variables');
  }
  let content = [...messages];
  if (systemMessage) {
    const systemMessageObj = {
      id: 'system',
      text: systemMessage,
      sender: 'system',
      senderName: 'System',
      timestamp: new Date(),
    };
    content = [systemMessageObj, ...content];
  }
  // Format messages for OpenRouter
  const formattedMessages = formatConversation(content);
  
  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "Language Teacher Website",
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        messages: formattedMessages
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json() as OpenRouterCompletionResponse;
    
    // Return the generated content from the first choice
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    } else {
      throw new Error('No completion returned from OpenRouter');
    }
  } catch (error) {
    console.error('Error getting completion from OpenRouter:', error);
    throw error;
  }
};

export const getSummary = async (
  model: string,
  messages: Message[]
): Promise<string> => {

  const summaryMessage = 'You generate titles for conversations. Given a conversation, return a three word title and nothing else.';
  
  const response = await getCompletion(model, messages, summaryMessage);
  return response;
}