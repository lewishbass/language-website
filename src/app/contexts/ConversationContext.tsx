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

interface BufferedMessage {
  text: string;
  sender: string; // 'user' or 'assistant'
  senderName: string; // Name of the sender
  timestamp: Date;
  logoURL?: string; // Optional logo URL for the sender
  chatId: string; // ID of the chat to which the message belongs
}

interface BufferedConversation {
  title: string;
  model: string;
  teacherId?: string; // Optional teacher ID for the conversation
  initialMessage?: string; // Optional initial message for the conversation
  systemPrompt?: string; // Optional system prompt for the conversation
  logoURL?: string; // Optional logo URL for the conversation
  asstName?: string; // Optional assistant name for the conversation
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
  asstName?: string; // Optional assistant name for the conversation
  systemPrompt?: string; // Optional system prompt for the conversation
  teacherId?: string; // Optional teacher ID for the conversation
}

interface ModelChoice {
  id: string;
  name: string;
  description: string;
  logoURL?: string; // Optional logo URL for the model
  cost: number; // Cost associated with the model
  backend?: 'openrouter' | 'ngrok'; // Optional backend for the model
}

type personalityType = 'professional' | 'casual' | 'robotic' | 'technical'; // Define the personality types
type studentLevelType = 'beginner' | 'intermediate' | 'expert'; // Define the student levels

interface Teacher {
  id: string;
  name: string;
  subject: string;
  personality?: personalityType; // New field
  studentLevel?: studentLevelType; // New field
  logoURL?: string; // Optional logo URL for the teacher
  pastTopics: string[]; // Optional topics covered by the teacher
  currentTopics: string[]; // Optional current topics being taught by the teacher
  futureTopics: string[]; // Optional future topics to be covered by the teacher
  nativeLanguage?: string; // Optional native language of the teacher
  personalHistory?: string; // Optional personal history of the teacher
  model?: string; // Optional model used by the teacher
}

const modelChoices: ModelChoice[] = [
  { id: 'openai/gpt-4.1-mini', name: 'GPT-4.1-mini', description: 'Fast and capable OpenAI model', logoURL: '/logos/openai.svg', cost: 1.6, backend: "openrouter" },
  { id: 'google/gemini-2.0-flash-001', name: 'Gemini 2.0 Flash', description: 'Fast, efficient Google AI model', logoURL: '/logos/gemini.svg', cost: 0.4, backend: "openrouter" },
  { id: 'anthropic/claude-3.5-haiku', name: 'Claude 3.5 Haiku', description: 'Compact, efficient Anthropic model', logoURL: '/logos/claude.svg', cost: 4, backend: "openrouter" },
  { id: 'meta-llama/llama-4-maverick', name: 'Llama 4 Maverick', description: 'Advanced open-source model from Meta', logoURL: '/logos/meta.svg', cost: 0.6, backend: "openrouter" },
  { id: '49Simoney/SpanishLanguageTeacher-7B-9k-merged', name: 'OpenBuddy Spanish Teacher', description: 'Specialized Spanish language teacher model', logoURL: '/logos/openbuddy.png', cost: 0.2, backend: "ngrok" },
]

interface ConversationContextType {
  conversations: Conversation[];
  addConversation: (title: string, model: string, teacherId?: string, initialMessage?: string, systemPrompt?: string, logoURL?: string, asstName?: string) => string;
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

  teachers: Teacher[]; // State to hold teachers
  activeTeacher: Teacher | null; // State to hold the active teacher
  activateTeacher: (id: string) => boolean; // Function to activate a teacher
  updateTeacher: (id: string, updates: Partial<Teacher>) => boolean; // Function to update a teacher
  deleteTeacher: (id: string) => boolean; // Function to delete a teacher
  addTeacher: (name: string, subject: string, personality?: personalityType, studentLevel?: studentLevelType, nativeLanguage?: string, model?: string) => Promise<string>; // Updated
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

  const [teachers, setTeachers] = useState<Teacher[]>([]); // State to hold teachers
  const [activeTeacher, setActiveTeacher] = useState<Teacher | null>(null); // State to hold the active teacher

  const [messageBuffer, setMessageBuffer] = useState<BufferedMessage | null>(null); // State to hold the message buffer
  const [conversationBuffer, setConversationBuffer] = useState<BufferedConversation | null>(null); // State to hold the conversation buffer
  const [activateConversationBuffer, setActivateConversationBuffer] = useState<string | null>(null); // State to hold the conversation buffer

  const formatPrompt = `
use github markdown formatting
enclose latex equations in $ equation $ and multiline equations in $$ equation $$, escape regular dollars signs with \\$
markdown and latex are always enabled, do not call them in code blocks
enclose code examples in tripple backticks, \`\`\` language    \`\`\`, use triple backticks only for code examples
`;
  const getTeacherPrompt = (teacher: Teacher) => {
    return `
You are a teacher named ${teacher.name} who speaks ${teacher.nativeLanguage} and teaches ${teacher.subject} to ${teacher.studentLevel} students.
You have a ${teacher.personality} personality.
${teacher.personalHistory ? `Your personal history is: ${teacher.personalHistory}` : ''}
    `;
  }


  const saveConversations = (conversations: Conversation[]) => {
    // Save conversations to local storage or any other persistent storage
    localStorage.setItem('conversations', JSON.stringify(conversations));
    return true;
  };

  const saveActiveConversation = (id: string) => {
    // Save active conversation to local storage or any other persistent storage
    localStorage.setItem('activeConversation', JSON.stringify(id));
    return true;
  }

  const loadConversations = () => {
    // Load conversations from local storage or any other persistent storage
    const storedConversations = localStorage.getItem('conversations');
    if (storedConversations) {
      setConversations(JSON.parse(storedConversations));
    }
  };
  useEffect(() => {
    loadConversations(); // Load conversations when the component mounts
    loadTeachers(); // Load teachers when the component mounts
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

  const addConversation = (title: string, model: string, teacherId?: string, initialMessage?: string, systemPrompt?: string, logoURL?: string, asstName?: string) => {
    const id = Date.now().toString() + Math.floor(Math.random() * 100); // Simple ID generation
    const newConversation = {
      id,
      title,
      lastUpdated: new Date(), // Set the last updated time to now
      lastMessage: '', // Initialize with an empty string
      isPinned: false, // Default value for isPinned
      contentPointer: `messages_${id}`, // Unique content pointer for messages
      model, // Model used for the conversation
      logoURL: logoURL || getModelChoices().find(modelChoice => modelChoice.id === model)?.logoURL, // Get the logo URL for the model
      asstName: asstName || 'Assistant', // Optional assistant name for the conversation
      teacherId, // Optional teacher ID for the conversation
      systemPrompt: systemPrompt || formatPrompt, // Optional system prompt for the conversation
    };
    saveMessages(newConversation.contentPointer, []); // Initialize messages for the new conversation
    saveConversations([...conversations, newConversation]);
    setConversations(prev => [...prev, newConversation]);
    setActiveConversation(newConversation); // Set the new conversation as active
    loadMessages(newConversation.contentPointer); // Load messages for the new conversation
    ssetActiveModel(getModelChoices().find(modelChoice => modelChoice.id === model)); // Set the active model based on the conversation
    if (initialMessage) {
      setMessageBuffer({
        text: initialMessage,
        sender: 'user',
        senderName: 'User',
        timestamp: new Date(),
        logoURL: undefined,
        chatId: id,
      });
    }

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
    saveActiveConversation(id); // Save the active conversation to local storage
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
      // Add a 1 second delay before generating response
      await new Promise(resolve => setTimeout(resolve, 100));

      generateResponse(updatedMessages); // Call the function to generate a response
    }

    return true;
  }

  const generateResponse = async (updatedMessages: Message[]) => {
    if (!activeModel || !activeConversation) {
      console.error('No active model or conversation to generate a response for.');
      return false;
    }
    // Set generating status to true
    setGenerating(true);
    try {
      let logoURL = activeModel.logoURL;
      if (activeConversation.logoURL) {
        logoURL = activeConversation.logoURL; // Use the conversation's logo URL if available
      }


      // Create placeholder assistant message for streaming updates
      const assistantMessage: Message = {
        id: Date.now().toString(),
        text: "", // Start with empty text for streaming
        sender: 'assistant',
        senderName: activeConversation.asstName || 'Assistant',
        timestamp: new Date(),
        logoURL: logoURL,
      };

      // Add the empty assistant message to start
      const messagesWithEmptyResponse = [...updatedMessages, assistantMessage];
      saveMessages(activeConversation.contentPointer, messagesWithEmptyResponse);
      setMessages(messagesWithEmptyResponse);

      // Call getCompletion with streaming callback
      const responseText = await getCompletion(
        activeConversation.model,
        updatedMessages,
        activeConversation.systemPrompt,
        (partialResponse) => {
          // Update the message in real-time as it's being generated
          const updatedAssistantMessage = {
            ...assistantMessage,
            text: partialResponse
          };

          const updatedStreamingMessages = [...updatedMessages, updatedAssistantMessage];
          //saveMessages(activeConversation.contentPointer, updatedStreamingMessages);
          setMessages(updatedStreamingMessages);
        },
        activeModel.backend || 'openrouter' // Use the backend from the model choice or default to 'openrouter'
      );

      // Final update after streaming completes
      const finalAssistantMessage = {
        ...assistantMessage,
        text: responseText
      };

      const messagesWithFinalResponse = [...updatedMessages, finalAssistantMessage];

      if (activeConversation.teacherId) {
        teacherCallback(activeConversation.teacherId, messagesWithFinalResponse, activeConversation); // Call the teacher callback if a teacher is associated with the conversation
      }

      saveMessages(activeConversation.contentPointer, messagesWithFinalResponse);
      setMessages(messagesWithFinalResponse);

      // Update the conversation metadata
      updateConversation(activeConversation.id, {
        lastUpdated: new Date(),
        lastMessage: responseText,
      });

      if (activeConversation.title === 'New Conversation' || messagesWithFinalResponse.length % 20 < 2) {
        const summaryText = await getSummary(activeConversation.model, messagesWithFinalResponse); // Get summary of the conversation
        console.log('Summary:', summaryText);
        updateConversation(activeConversation.id, {
          title: summaryText, // Update the conversation title with the summary
          lastUpdated: new Date(), // Update the last updated time
          lastMessage: responseText, // Update the last message text
        });
      }

      setGenerating(false);


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
      setGenerating(false);

    } finally {

    }
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
    const updatedMessages = messages.slice(0, messageIndex); // Get all messages up to and including the selected message

    if (!activeConversation || !activeConversation.contentPointer) {
      console.error('No active conversation to regenerate the message in.');
      return false;
    }
    saveMessages(activeConversation.contentPointer, updatedMessages); // Save messages to local storage 
    setMessages(updatedMessages); // Update the messages state
    //sendMessage(regeneratedMessage.text, regeneratedMessage.sender, regeneratedMessage.timestamp, regeneratedMessage.logoURL, regeneratedMessage.senderName); // Send the regenerated message
    generateResponse(updatedMessages); // Call the function to generate a response
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

  const loadTeachers = () => {
    // Load teachers from local storage or any other persistent storage
    const storedTeachers = localStorage.getItem('teachers');
    if (storedTeachers) {
      setTeachers(JSON.parse(storedTeachers));
    }
  };

  const saveTeachers = (teachers: Teacher[]) => {
    // Save teachers to local storage or any other persistent storage
    localStorage.setItem('teachers', JSON.stringify(teachers));
    return true;
  }

  const activateTeacher = (id: string) => {
    const teacher = teachers.find(teacher => teacher.id === id);
    if (teacher) {
      setActiveTeacher(teacher);
    } else {
      console.error(`Teacher with id ${id} not found`);
      return false;
    }
    return true;
  }

  const updateTeacher = (id: string, updates: Partial<Teacher>) => {
    let updated = false;
    const updatedTeachers = teachers.map(teacher => {
      if (teacher.id === id) {
        updated = true;
        return { ...teacher, ...updates };
      }
      return teacher;
    });
    saveTeachers(updatedTeachers);
    setTeachers(updatedTeachers);
    if (id === activeTeacher?.id) {
      setActiveTeacher(prev => prev ? { ...prev, ...updates } : null); // Update active teacher if it was updated
    }
    return updated;
  }

  const deleteTeacher = (id: string) => {
    if (activeTeacher && activeTeacher.id === id) {
      setActiveTeacher(null); // Clear active teacher if it's deleted
    }
    let deleted = false;
    teachers.forEach(teacher => {
      if (teacher.id === id) {
        deleted = true;
      }
    });
    if (!deleted) return deleted; // If not found, return false
    // delete messages associated with the teacher
    const teacherConversations = conversations.filter(conv => conv.teacherId === id);
    teacherConversations.forEach(conv => {
      deleteConversation(conv.id); // Delete conversations associated with the teacher
    });

    // Remove the teacher from the list
    const updatedTeachers = teachers.filter(teacher => teacher.id !== id);
    saveTeachers(updatedTeachers);
    setTeachers(updatedTeachers);
    return deleted;
  };

  // Modified to include personality and studentLevel
  const addTeacher = async (
    name: string,
    subject: string,
    personality: personalityType = 'professional',
    studentLevel: studentLevelType = 'intermediate',
    nativeLanguage: string = 'English',
    model: string = getModelChoices()[0].id, // Default model
  ) => {
    const id = Date.now().toString(); // Simple ID generation

    try {
      // Fetch random user data from the RandomUser API
      const response = await fetch('https://randomuser.me/api/');
      const data = await response.json();
      const randomUser = data.results[0];

      // Use the random user's name or fallback to provided name
      const randomName = randomUser ?
        `${randomUser.name.first} ${randomUser.name.last}` :
        name;
      const newTeacher: Teacher = {
        id,
        name: randomName, // Use the randomly generated name
        subject,
        personality, // Add personality
        studentLevel, // Add student level
        logoURL: randomUser.picture.large || `https://randomuser.me/api/portraits`,
        pastTopics: [],
        currentTopics: [],
        futureTopics: [],
        nativeLanguage, // Add native language
        model: model, // Add model
      };

      saveTeachers([...teachers, newTeacher]);
      setTeachers(prev => [...prev, newTeacher]);
      setActiveTeacher(newTeacher);
      addConversation('Teacher Agent', newTeacher.model || getModelChoices()[0].id, id, "What is your lifes story (other than teaching) in two sentences.", formatPrompt + getTeacherPrompt(newTeacher), newTeacher.logoURL, newTeacher.name); // Add a new conversation for the teacher

    } catch (error) {
      console.log('Error fetching random user data:', error);
    }


    return id;
  };

  const teacherCallback = async (techerId: string, messages: Message[], conversation: Conversation) => {
    const teacher = teachers.find(teacher => teacher.id === techerId);
    if (!teacher) return; // If teacher not found, return
    if (conversation.title === 'Teacher Agent') {
      if (messages.length == 2) { // History generation
        updateTeacher(techerId, {
          personalHistory: messages[messages.length - 1].text, // Update the teacher's personal history with the assistant's response
        });
        teacher.personalHistory = messages[messages.length - 1].text; // Update the teacher's personal history in the state
        console.log('Teacher personal history updated:', teacher.personalHistory);
        updateConversation(conversation.id, {
          systemPrompt: formatPrompt + getTeacherPrompt(teacher), // Update the system prompt with the teacher's information
        });
        setMessageBuffer({
          text: `Generate a curriculum for ${teacher?.subject} for a ${teacher?.studentLevel} student. Return a json formatted string with one object called "lessons" that contains an array of lessons. Each lesson should be a string of a list of topics to cover. e.g. "Lesson Name: topic 1, topic 2, topic 3...". No Excuses.`,
          sender: 'user',
          senderName: 'System',
          timestamp: new Date(),
          logoURL: undefined,
          chatId: conversation.id,
        });
      }
      if (messages.length == 4) { // Curriculum generation
        try {
          let lessons = messages[messages.length - 1].text;
          lessons = lessons.slice(lessons.indexOf('{')); // Extract the JSON part of the response
          lessons = lessons.slice(0, lessons.lastIndexOf('}') + 1); // Extract the JSON part of the response
          const parsedLessons = JSON.parse(lessons).lessons as string[]; // Parse the JSON response
          if (!Array.isArray(parsedLessons) || parsedLessons.length === 0) {
            console.error('Invalid lessons format:', lessons);
            return;
          }

          teacher.currentTopics = parsedLessons.slice(0, 1); // Update the teacher's current topics in the state
          teacher.futureTopics = parsedLessons.slice(1); // Update the teacher's future topics in the state
          updateTeacher(techerId, {
            currentTopics: teacher.currentTopics,
            futureTopics: teacher.futureTopics,
          });
          console.log('Teacher current topics updated:', teacher.currentTopics);
          const reformattedLessons = parsedLessons.map((lesson: string) => {
            return "**" + lesson.slice(0, lesson.indexOf(':')).trim() + "**\n\n" + lesson.slice(lesson.indexOf(':') + 1).trim(); // Reformat the lessons to be bold
          }).join('\n\n___\n\n'); // Join the lessons with new lines
          messages[3].text = reformattedLessons; // Update the message with the reformatted lessons
          setMessageBuffer({
            text: `Generate a plain text lesson plan for the lesson \n\n ${teacher.currentTopics[0]} \n\n It should describe the activity plan, what material is to be covered and the learning goals.`,
            sender: 'user',
            senderName: 'System',
            timestamp: new Date(),
            logoURL: undefined,
            chatId: conversation.id,
          });
        }
        catch (error) {
          console.error('Error parsing lessons:', error);
          return;
        }

      }
      if (messages.length > 4) {
        const lessonPlan = messages[messages.length - 1].text;

        setConversationBuffer({
          title: teacher.currentTopics[0],
          model: teacher.model || modelChoices[0].id,
          teacherId: techerId,
          initialMessage: "Lets get started",
          systemPrompt: formatPrompt + getTeacherPrompt(teacher) + `\n\nPresent the points in the lesson one at a time, engaging the student and asking what they are interested in.\n\nWhen all the content has been covered, say "<endlesson>" to end the lesson` + lessonPlan,
          logoURL: teacher.logoURL,
          asstName: teacher.name,
        });

        teacher.currentTopics = teacher.futureTopics?.slice(0, 1); // Update the teacher's current topics in the state
        teacher.pastTopics.push(teacher.currentTopics[0]); // Update the teacher's past topics in the state
        teacher.futureTopics = teacher.futureTopics?.slice(1); // Update the teacher's future topics in the state
        updateTeacher(techerId, {
          currentTopics: teacher.currentTopics,
          pastTopics: teacher.pastTopics,
          futureTopics: teacher.futureTopics,
        });
        console.log('Teacher current topics updated:', teacher.currentTopics);


      }

    }
    if (messages[messages.length - 1].text.includes('<endlesson>')) {
      console.log("ending lesson");
      const agentConversation = conversations.find(conv => conv.title === 'Teacher Agent' && conv.teacherId === techerId);
      if (!agentConversation) return; // If agent conversation not found, return


      setMessageBuffer({
        text: `Generate a plain text lesson plan for the lesson \n\n ${teacher.currentTopics[0]} \n\n It should describe the activity plan, what material is to be covered and the learning goals.`,
        sender: 'user',
        senderName: 'System',
        timestamp: new Date(),
        logoURL: undefined,
        chatId: agentConversation.id,
      });
      setTimeout(() => {
        setActivateConversationBuffer(agentConversation.id); // Activate the agent conversation
      }, 3000); // Add a delay before activating the conversation
    }
  }


  useEffect(() => {
    // send pending messages to the active conversation
    if (messageBuffer && activeConversation && messageBuffer.chatId === activeConversation.id) {

      setMessageBuffer(null); // Remove sent messages from the buffer
      sendMessage(
        messageBuffer.text,
        messageBuffer.sender,
        messageBuffer.timestamp,
        messageBuffer.logoURL,
      );
    }
  }, [messageBuffer, activeConversation, sendMessage]);

  useEffect(() => {
    // send pending messages to the active conversation
    if (generating) return;
    if (conversationBuffer) {
      addConversation(
        conversationBuffer.title,
        conversationBuffer.model,
        conversationBuffer.teacherId,
        conversationBuffer.initialMessage,
        conversationBuffer.systemPrompt,
        conversationBuffer.logoURL,
        conversationBuffer.asstName,
      );
      setConversationBuffer(null); // Remove sent messages from the buffer
    }
  }, [conversationBuffer, generating]);

  useEffect(() => {
    if (generating) return;
    if (activateConversationBuffer) {
      activateConversation(activateConversationBuffer);
      setActivateConversationBuffer(null); // Remove sent messages from the buffer
    }
  }, [activateConversationBuffer, generating]);

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
    teachers,
    activeTeacher,
    activateTeacher,
    updateTeacher,
    deleteTeacher,
    addTeacher,
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
export type { Message, Conversation, ModelChoice, Teacher, personalityType, studentLevelType };