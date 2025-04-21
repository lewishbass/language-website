'use client';
import { useState, useRef } from "react";
import { FaSearch, FaEdit, FaUserPlus, FaEllipsisH } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { TbLayoutSidebarLeftCollapseFilled, TbLayoutSidebarLeftExpandFilled } from "react-icons/tb";
import { useConvData, personalityType, studentLevelType } from "../contexts/ConversationContext";
import TeacherEditPopup from "./TeacherEditPopup";
import TeacherCreateModal from "./TeacherCreateModal";

export default function Sidebar() {
  const {
    getModelChoices, addConversation, getConversations, deleteConversation, activeConversation, activateConversation,
    teachers, activeTeacher, activateTeacher, deleteTeacher, addTeacher, updateTeacher
  } = useConvData();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);
  const [activePopupTeacherId, setActivePopupTeacherId] = useState<string | null>(null);
  const [showCreateTeacherModal, setShowCreateTeacherModal] = useState(false);
  const teacherRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const handleNewConversation = () => {
    addConversation("New Conversation", getModelChoices()[0].id);
  };

  const handleNewTeacher = () => {
    setShowCreateTeacherModal(true);
  };

  const handleCreateTeacher = (
    name: string,
    subject: string,
    personality: personalityType,
    studentLevel: studentLevelType,
    nativeLanguage: string,
    model: string
  ) => {
    addTeacher(name, subject, personality, studentLevel, nativeLanguage, model);
  };

  const handleTeacherOptionsClick = (e: React.MouseEvent, teacherId: string) => {
    e.stopPropagation();
    setActivePopupTeacherId(activePopupTeacherId === teacherId ? null : teacherId);
  };

  const handlePopupClose = () => {
    setActivePopupTeacherId(null);
  };

  return (
    <div
      className={`relative h-screen bg-gradient-to-b from-gray-800 to-gray-950 border-r-2 border-white/20 p-0 
                 shadow-lg flex flex-col justify-between items-center 
                 ${sidebarExpanded ? "w-40 md:w-64 lg:w-80" : "w-16"}`}
    >
      {/* sidebar options */}
      <div className={`w-full p-3 flex gap-3 transition-all duration-300 ${sidebarExpanded ? "flex-row" : "flex-col items-center"}`}>
        {/* Collapse/Expand Button */}
        <button
          onClick={() => setSidebarExpanded(!sidebarExpanded)}
          className={`wg group relative p-2 hover:bg-white/20 rounded-lg flex items-center gap-2 w-10 h-10
                      transition-all duration-200 hover:shadow-inner ${sidebarExpanded ? "mr-auto" : ""}`}
        >
          <TbLayoutSidebarLeftCollapseFilled size={20} className="absolute top-1/2 left-1/2 w-6 h-6 -translate-x-1/2 -translate-y-1/2 
                                                                  text-white/60 group-hover:text-white transition-opacity duration-200"
            style={{ opacity: sidebarExpanded ? 1 : 0 }} />
          <TbLayoutSidebarLeftExpandFilled size={20} className="absolute top-1/2 left-1/2 w-6 h-6 -translate-x-1/2 -translate-y-1/2 
                                                                text-white/60 group-hover:text-white transition-opacity duration-200"
            style={{ opacity: !sidebarExpanded ? 1 : 0 }} />
        </button>
        {/* Search Conversation Button */}
        <button className="wg group relative p-2 hover:bg-white/20 rounded-lg flex items-center gap-2 w-10 h-10 
                          transition-all duration-200 hover:shadow-inner">
          <FaSearch size={18} className="absolute top-1/2 left-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 
                                        text-white/60 group-hover:text-white transition-colors duration-200" />
        </button>
        {/* New conversation button */}
        <button
          onClick={handleNewConversation}
          className="wg group relative p-2 hover:bg-white/20 rounded-lg flex items-center gap-2 w-10 h-10 
                    transition-all duration-200 hover:shadow-inner"
        >
          <FaEdit size={18} className="absolute top-1/2 left-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 
                                      text-white/60 group-hover:text-white transition-colors duration-200" />
        </button>
        {/* New teacher button */}
        <button
          onClick={handleNewTeacher}
          className="wg group relative p-2 hover:bg-white/20 rounded-lg flex items-center gap-2 w-10 h-10 
                    transition-all duration-200 hover:shadow-inner"
        >
          <FaUserPlus size={18} className="absolute top-1/2 left-1/2 w-5 h-5 -translate-x-1/2 -translate-y-1/2 
                                      text-white/60 group-hover:text-white transition-colors duration-200" />
        </button>
      </div>
      <div className="bg-gradient-to-r from-transparent via-white/50 to-transparent h-[2px] w-[100%] mb-3"></div>
      {/* Conversation List */}
      <div className="w-full h-full overflow-hidden">
        <div className="flex flex-col gap-3 p-1 overflow-y-auto h-full custom-scrollbar">
          {getConversations()
            .filter(conv => conv.teacherId === undefined)
            .map((conv, index) => (
              <div key={index} className={`relative ${(activeConversation !== null && activeConversation?.id == conv.id) ? "bg-white/25" : "bg-white/5 hover:bg-white/15"}  rounded-lg cursor-pointer overflow-hidden 
                            transition-all duration-200 hover:shadow-md ${sidebarExpanded ? "p-2.5 min-h-15" : "p-1 min-h-12"}`}
              onClick={() => activateConversation(conv.id)}>
              {sidebarExpanded &&
                <button className="group absolute top-0 right-0 p-[5px] transition-colors duration-200 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteConversation(conv.id);
                    }}>
                    <FaXmark size={14} className="text-white/40 group-hover:text-white/90 transition-colors duration-200" />
                </button>}
              <div className="flex gap-2.5 truncate">
                <div className={`${sidebarExpanded ? "rounded-full" : "rounded-sm"} bg-gradient-to-br ${!conv.logoURL ? "from-white/15 to-white/5" : ""} flex items-center justify-center 
                        transition-all duration-200 ${sidebarExpanded ? "h-10 min-w-10" : "w-full h-full"}`}>
                    {conv.logoURL ?
                      <img src={conv.logoURL} alt="Conversation" className="w-10 h-10 object-cover" style={{ filter: "drop-shadow(2px 2px 0px #0004)" }} /> :
                      <div className="w-10 h-10 rounded-full flex items-center justify-center">
                        <span className="text-white/70 text-xl font-semibold">{conv.title.charAt(0).toUpperCase()}</span>
                      </div>
                    }
                </div>
                {sidebarExpanded && <div className="w-[calc(100%-2.5rem)]">
                    <div className="truncate overflow-hidden text-white/90 w-full max-w-[95%] h-5 font-medium">{conv.title}</div>
                    <div className="truncate overflow-hidden text-white/40 w-full max-w-[95%] h-5 text-sm">{conv.lastMessage || "No Messages"}</div>
                </div>}
              </div>
              </div>
            ))}
        </div>
      </div>

      <div className="w-full"><div className="bg-gradient-to-r from-transparent via-white/50 to-transparent h-[2px] w-full mb-3"></div>
      </div>
      {/* Teacher list */}

      <div className="w-full h-full overflow-hidden">
        <div className="p-1 overflow-y-auto h-full custom-scrollbar">
          {teachers.map((teacher) => (
            // add list of convs associated with teacher in dropdown
            <div
              key={teacher.id}
              ref={(el) => { teacherRefs.current[teacher.id] = el }}
              className={`mb-2 relative ${(activeTeacher !== null && activeTeacher?.id === teacher.id) ? "bg-white/25" : "bg-white/5 hover:bg-white/15"}  rounded-lg cursor-pointer overflow-hidden 
                          transition-all duration-200 hover:shadow-md ${sidebarExpanded ? "p-2.5 min-h-15" : "p-1 min-h-12"}`}
              onClick={() => activateTeacher(teacher.id)}
            >
              {sidebarExpanded && (
                <>
                  <button
                    className="group absolute top-0 right-0 p-[5px] transition-colors duration-200 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteTeacher(teacher.id);
                    }}
                  >
                    <FaXmark size={14} className="text-white/40 group-hover:text-white/90 transition-colors duration-200" />
                  </button>
                  <button
                    className="group absolute top-0 right-6 p-[5px] transition-colors duration-200 cursor-pointer"
                    onClick={(e) => handleTeacherOptionsClick(e, teacher.id)}
                  >
                    <FaEllipsisH size={14} className="text-white/40 group-hover:text-white/90 transition-colors duration-200" />
                  </button>
                </>
              )}
              <div className="flex gap-2.5 truncate">
                <div className={`${sidebarExpanded ? "rounded-full" : "rounded-sm"} bg-gradient-to-br ${!teacher.logoURL ? "from-white/15 to-white/5" : ""} flex items-center justify-center 
                                transition-all duration-200 ${sidebarExpanded ? "h-10 min-w-10" : "w-full h-full"}`}>
                  {teacher.logoURL ?
                    <img src={teacher.logoURL} alt="Teacher" className="w-10 h-10 object-cover rounded-full" style={{ filter: "drop-shadow(2px 2px 0px #0004)" }} /> :
                    <div className="w-10 h-10 rounded-full flex items-center justify-center">
                      <span className="text-white/70 text-xl font-semibold">{teacher.name.charAt(0).toUpperCase()}</span>
                    </div>
                  }
                </div>
                {sidebarExpanded && <div className="w-[calc(100%-2.5rem)]">
                  <div className="truncate overflow-hidden text-white/90 w-full max-w-[95%] h-5 font-medium">{teacher.name}</div>
                  <div className="truncate overflow-hidden text-white/40 w-full max-w-[95%] h-5 text-sm">{teacher.subject}</div>
                </div>}
              </div>
              <div className={"mt-2 overflow-y-scroll custom-scrollbar " + (teacher.id === activeTeacher?.id ? "max-h-60" : "max-h-0")} style={{ transition: "max-height 0.3s ease-in-out" }}>
                {sidebarExpanded && getConversations()
                  .filter(conv => conv.teacherId === teacher.id)
                  .map((conv, index) => (
                    <div
                      key={index}
                      className={`text-white mb-1 relative ${(activeConversation !== null && activeConversation?.id == conv.id) ? "bg-white/25" : "bg-white/5 hover:bg-white/15"} rounded-lg cursor-pointer overflow-hidden 
                        transition-all duration-200 hover:shadow-md ${sidebarExpanded ? "p-2.5" : "p-1 min-h-12"}`}
                      onClick={() => activateConversation(conv.id)}
                    >
                      <div className="line-clamp-2 text-sm">{conv.title}</div>
                    </div>
                  ))}
              </div>

              {activePopupTeacherId === teacher.id && (
                <TeacherEditPopup
                  teacher={teacher}
                  onClose={handlePopupClose}
                  updateTeacher={updateTeacher}
                  parentRef={teacherRefs.current[teacher.id]}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Teacher Creation Modal */}
      {showCreateTeacherModal && (
        <TeacherCreateModal
          onClose={() => setShowCreateTeacherModal(false)}
          onCreateTeacher={handleCreateTeacher}
        />
      )}
    </div>
  );
}
