'use client';
import { useState, useRef, useEffect } from 'react';
import { FaXmark } from "react-icons/fa6";
import { Teacher, personalityType, studentLevelType, useConvData } from "../contexts/ConversationContext";

interface TeacherEditPopupProps {
  teacher: Teacher;
  onClose: () => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => boolean;
  parentRef: HTMLDivElement | null;
}

export default function TeacherEditPopup({ teacher, onClose, updateTeacher, parentRef }: TeacherEditPopupProps) {
  const { getModelChoices } = useConvData();

  const [name, setName] = useState(teacher.name);
  const [subject, setSubject] = useState(teacher.subject);
  const [language, setLanguage] = useState(teacher.nativeLanguage || 'English');
  const [personality, setPersonality] = useState<personalityType>(teacher.personality || 'professional');
  const [studentLevel, setStudentLevel] = useState<studentLevelType>(teacher.studentLevel || 'intermediate');
  const [model, setModel] = useState<string>(teacher.model || getModelChoices()[0]?.id);
  const [pastTopics, setPastTopics] = useState(teacher.pastTopics?.join('; ') || '');
  const [currentTopics, setCurrentTopics] = useState(teacher.currentTopics?.join('; ') || '');
  const [futureTopics, setFutureTopics] = useState(teacher.futureTopics?.join('; ') || '');
  
  const popupRef = useRef<HTMLDivElement>(null);

  
  // Calculate position to ensure popup is fully visible
  const calculatePosition = () => {
    if (!parentRef) return { top: 0, left: 300 };
    
    const rect = parentRef.getBoundingClientRect();
    const popupWidth = 280; // Width of the popup + padding
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    // Default position to the right of the parent
    let left = rect.right + 16;
    let top = rect.top;
    
    // Check if popup would go off the right edge of the screen
    if (left + popupWidth > windowWidth) {
      left = rect.left - popupWidth - 16; // Position to the left instead
      
      // If still off-screen (too far left), center it below the parent
      if (left < 0) {
        left = Math.max(10, rect.left);
        top = rect.bottom + 10;
      }
    }
    
    // Check if popup would go off the bottom of the screen
    const estimatedHeight = 400; // Increased approximate popup height
    if (top + estimatedHeight > windowHeight) {
      top = Math.max(10, windowHeight - estimatedHeight - 10);
    }
    
    return { top, left };
  };
  
  const position = calculatePosition();
  
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        saveChanges();
        onClose();
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, name, subject, personality, studentLevel, pastTopics, currentTopics, futureTopics]);
  
  // Save changes function - called when popup closes
  const saveChanges = () => {
    const updates: Partial<Teacher> = {
      name,
      subject,
      personality,
      studentLevel,
      model: teacher.model,
      pastTopics: pastTopics.split(';').map(topic => topic.trim()).filter(Boolean),
      currentTopics: currentTopics.split(';').map(topic => topic.trim()).filter(Boolean),
      futureTopics: futureTopics.split(';').map(topic => topic.trim()).filter(Boolean),
    };
    
    updateTeacher(teacher.id, updates);
  };

  const FancySelect = ({ 
    label, 
    value, 
    onChange, 
    options 
  }: { 
    label: string; 
    value: string; 
    onChange: (value: string) => void; 
    options: {value: string; label: string}[] 
  }) => (
    <div className="mb-4">
      <label className="block text-white/90 text-sm mb-1 font-medium">{label}</label>
      <div className="relative fancy-select-wrapper">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 bg-gray-700/70 text-white rounded-md 
                    focus:outline-none focus:ring-2 focus:ring-blue-500/70
                    border border-gray-600 hover:border-gray-500
                    transition-all duration-200 appearance-none"
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
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
  );
  
  return (
    <div
      ref={popupRef}
      className="fixed z-50 w-64 bg-gray-800/50 border border-gray-700 rounded-lg shadow-xl p-4
                backdrop-blur-sm text-white animate-fadeIn transition-all duration-200
                border-blue-500/30 hover:border-blue-500/50 max-h-[400px] overflow-y-scroll custom-scrollbar"
      style={{
        top: position.top,
        left: position.left,
        boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 15px rgba(59, 130, 246, 0.2)'
      }}
    >
      <div className="flex justify-between items-center mb-3 border-b border-gray-700 pb-2">
        <h3 className="text-white font-semibold text-lg">Edit Teacher</h3>
        <button 
          onClick={() => {
            saveChanges();
            onClose();
          }}
          className="text-white/50 hover:text-white hover:bg-red-500/20 p-1 rounded-full
                    transition-all duration-200 transform hover:scale-110"
        >
          <FaXmark size={16} />
        </button>
      </div>
      
      <div className="space-y-4">
        {/* Profile picture display */}
        <div className="flex justify-center mb-2">
          <div className="relative">
            <img 
              src={teacher.logoURL || '/placeholder-avatar.png'} 
              alt={`${name}'s profile`}
              className="w-24 h-24 rounded-full object-cover border-2 border-blue-500/50 shadow-lg"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-white/90 text-sm mb-1 font-medium">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700/70 text-white rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500/70
                      border border-gray-600 hover:border-gray-500
                      transition-all duration-200"
          />
        </div>
        
        <div>
          <label className="block text-white/90 text-sm mb-1 font-medium">Subject</label>
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700/70 text-white rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500/70
                      border border-gray-600 hover:border-gray-500
                      transition-all duration-200"
          />
        </div>

        <div>
          <label className="block text-white/90 text-sm mb-1 font-medium">Language</label>
          <input
            type="text"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700/70 text-white rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500/70
                      border border-gray-600 hover:border-gray-500
                      transition-all duration-200"
          />
        </div>
        
        <FancySelect
          label="Personality"
          value={personality}
          onChange={(value) => setPersonality(value as personalityType)}
          options={[
            { value: 'professional', label: 'Professional' },
            { value: 'casual', label: 'Casual' },
            { value: 'robotic', label: 'Robotic' },
            { value: 'technical', label: 'Technical' },
          ]}
        />

        <FancySelect
          label="Student Level"
          value={studentLevel}
          onChange={(value) => setStudentLevel(value as studentLevelType)}
          options={[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'expert', label: 'Expert' },
          ]}
        />

        <FancySelect
          label="Model"
          value={model}
          onChange={setModel}
          options={getModelChoices().map(model => ({
            value: model.id,
            label: model.name,
          }))}
        />
        
        <div>
          <label className="block text-white/90 text-sm mb-1 font-medium">Past Topics</label>
          <input
            type="text"
            placeholder="Topics separated by commas"
            value={pastTopics}
            onChange={(e) => setPastTopics(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700/70 text-white rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500/70
                      border border-gray-600 hover:border-gray-500
                      transition-all duration-200"
          />
        </div>
        
        <div>
          <label className="block text-white/90 text-sm mb-1 font-medium">Current Topics</label>
          <input
            type="text"
            placeholder="Topics separated by commas"
            value={currentTopics}
            onChange={(e) => setCurrentTopics(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700/70 text-white rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500/70
                      border border-gray-600 hover:border-gray-500
                      transition-all duration-200"
          />
        </div>
        
        <div>
          <label className="block text-white/90 text-sm mb-1 font-medium">Future Topics</label>
          <input
            type="text"
            placeholder="Topics separated by commas"
            value={futureTopics}
            onChange={(e) => setFutureTopics(e.target.value)}
            className="w-full px-3 py-2 bg-gray-700/70 text-white rounded-md 
                      focus:outline-none focus:ring-2 focus:ring-blue-500/70
                      border border-gray-600 hover:border-gray-500
                      transition-all duration-200"
          />
        </div>
      </div>
    </div>
  );
}
