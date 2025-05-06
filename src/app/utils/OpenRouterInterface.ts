'use client';

import { Message } from '../contexts/ConversationContext';

const ngrok_url = "https://fce8-128-173-236-186.ngrok-free.app/v1/chat/completions";

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

// Define streaming data structure
interface OpenRouterStreamingResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    delta: {
      role?: string;
      content?: string;
    };
    index: number;
    finish_reason: string | null;
  }[];
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
  systemMessage?: string | undefined,
  onProgress?: (partialResponse: string) => void,
  backend: 'openrouter' | 'ngrok' = 'openrouter'
): Promise<string> => {
  // If onProgress callback is provided, use streaming
  if (onProgress) {
    return streamCompletion(model, messages, systemMessage, onProgress, backend);
  }

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
    let response = {
      ok: false,
      status: 500,
      json: async () => ({}),
      text: async () => ({}),
      body: null,
    } as Response;
    if (backend === 'ngrok') {
      // Handle ngrok backend if needed
      response = await fetch(ngrok_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages
        })
      }
      );
    } else if (backend === 'openrouter') {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
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
    } else {
      throw new Error('Invalid backend specified. Use "openrouter" or "ngrok".');
    }
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }
    
    const data = await response.json() as OpenRouterCompletionResponse;
    
    // Return the generated content from the first choice
    if (data.choices && data.choices.length > 0) {
      return data.choices[0].message.content;
    }
  } catch (error) {
    console.error('Error getting completion from OpenRouter:', error);
    throw error;
  }
  return ""; // Fallback return in case of failure
};

// New function for handling streaming completions
export const streamCompletion = async (
  model: string,
  messages: Message[],
  systemMessage: string | undefined,
  onProgress: (partialResponse: string) => void,
  backend: 'openrouter' | 'ngrok' = 'openrouter'
): Promise<string> => {
  const apiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
  console.log("backend", backend);
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
    let response = {
      ok: false,
      status: 500,
      json: async () => ({}),
      text: async () => ({}),
      body: null,
    } as Response;
    if (backend === 'ngrok') {
      response = await fetch(ngrok_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          stream: true // Enable streaming
        })
      }
      );
    } else if (backend === 'openrouter') {
      response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
          "X-Title": "Language Teacher Website",
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model,
          messages: formattedMessages,
          stream: true // Enable streaming
        })
      });
    }


    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} ${errorText}`);
    }

    // Ensure response is readable as a stream
    if (!response.body) {
      throw new Error('Response body is null');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let fullResponse = "";

    // Process the stream
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Decode the chunk
      const chunk = decoder.decode(value, { stream: true });

      // Split the chunk into lines and process each line
      const lines = chunk.split('\n').filter(line => line.trim() !== '');

      for (const line of lines) {
        // Remove 'data: ' prefix and parse JSON
        if (line.startsWith('data: ')) {
          const jsonStr = line.slice(6);

          // The "[DONE]" message indicates the end of the stream
          if (jsonStr === "[DONE]") continue;

          try {
            const data = JSON.parse(jsonStr) as OpenRouterStreamingResponse;

            // Process each choice in the response
            if (data.choices && data.choices.length > 0) {
              // Get content from delta
              const content = data.choices[0].delta.content;

              if (content) {
                fullResponse += content;
                onProgress(fullResponse);
              }
            }
          } catch (e) {
            console.error('Error parsing streaming JSON:', e, jsonStr);
          }
        }
      }
    }

    return fullResponse;
  } catch (error) {
    console.error('Error streaming completion from OpenRouter:', error);
    throw error;
  }
};

export const getSummary = async (
  model: string,
  messages: Message[],
): Promise<string> => {

  const summaryMessage = 'You generate titles for conversations. Given a conversation, return a three word title and nothing else.';
  
  return await getCompletion('openai/gpt-4.1-mini', messages, summaryMessage);

};