import { useState, useEffect, useRef } from "react";
import { FaXmark } from "react-icons/fa6";
import { personalityType, studentLevelType, useConvData } from "../contexts/ConversationContext";

interface TeacherCreateModalProps {
    onClose: () => void;
    onCreateTeacher: (
        name: string,
        subject: string,
        personality: personalityType,
        studentLevel: studentLevelType,
        nativeLanguage: string,
        model: string
    ) => void;
}

const TeacherCreateModal = ({ onClose, onCreateTeacher }: TeacherCreateModalProps) => {

    const { getModelChoices } = useConvData();

    //const [name, setName] = useState<string>("New Teacher");
    const [subject, setSubject] = useState<string>("");
    const [language, setLanguage] = useState<string>("English");
    const [personality, setPersonality] = useState<personalityType>('professional');
    const [studentLevel, setStudentLevel] = useState<studentLevelType>('intermediate');
    const [model, setModel] = useState<string>(getModelChoices()[0].id);
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOutsideClick = (event: MouseEvent) => {
            if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        const handleEscapeKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.addEventListener("mousedown", handleOutsideClick);
        document.addEventListener("keydown", handleEscapeKey);

        return () => {
            document.removeEventListener("mousedown", handleOutsideClick);
            document.removeEventListener("keydown", handleEscapeKey);
        };
    }, [onClose]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onCreateTeacher("Teacher", subject, personality, studentLevel, language, model);
        onClose();
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
        options: { value: string; label: string }[]
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-[2px]">
            <div
                ref={modalRef}
                className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 w-full max-w-md shadow-xl border border-blue-500/30 hover:border-blue-500/50 transition-all duration-200"
                style={{
                    boxShadow: '0 4px 20px rgba(0,0,0,0.3), 0 0 15px rgba(59, 130, 246, 0.2)'
                }}
            >
                <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
                    <h2 className="text-xl font-bold text-white">Create New Teacher</h2>
                    <button
                        onClick={onClose}
                        className="text-white/50 hover:text-white hover:bg-red-500/20 p-1 rounded-full
                      transition-all duration-200 transform hover:scale-110"
                    >
                        <FaXmark size={16} />
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-white/90 text-sm mb-1 font-medium">Subject</label>
                        <input
                            type="text"
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700/70 text-white rounded-md 
                        focus:outline-none focus:ring-2 focus:ring-blue-500/70
                        border border-gray-600 hover:border-gray-500
                        transition-all duration-200"
                            placeholder="e.g. French, Math, History"
                            required
                        />
                    </div>

                    <div className="mb-4">
                        <label className="block text-white/90 text-sm mb-1 font-medium">Language</label>
                        <input
                            type="text"
                            value={language}
                            onChange={(e) => setLanguage(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-700/70 text-white rounded-md 
                        focus:outline-none focus:ring-2 focus:ring-blue-500/70
                        border border-gray-600 hover:border-gray-500
                        transition-all duration-200"
                            placeholder="e.g. French, Math, History"
                            required
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
                        options={getModelChoices().map((model) => ({
                            value: model.id,
                            label: model.name,
                        }))}
                    />

                    <div className="flex justify-end gap-3 mt-6">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-700/70 text-white rounded-md hover:bg-gray-600 
                        focus:outline-none focus:ring-2 focus:ring-blue-500/70
                        border border-gray-600 hover:border-gray-500
                        transition-all duration-200"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600/80 text-white rounded-md hover:bg-blue-500 
                        focus:outline-none focus:ring-2 focus:ring-blue-500/70
                        border border-blue-600/80 hover:border-blue-500
                        transition-all duration-200"
                        >
                            Create Teacher
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default TeacherCreateModal;
