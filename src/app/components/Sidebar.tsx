'use client';
import { useEffect, useState } from "react";
import { FaSearch, FaEdit } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { TbLayoutSidebarLeftCollapseFilled, TbLayoutSidebarLeftExpandFilled } from "react-icons/tb";
import { useConvData } from "../contexts/ConversationContext";

export default function Sidebar() {
  const { addConversation, getConversations, deleteConversation, getActiveConversation, activateConversation } = useConvData();
  const [sidebarExpanded, setSidebarExpanded] = useState(true);

  const handleNewConversation = () => {
    addConversation("New Conversation", "default");
  };

  return (
    <div
      className={`h-screen bg-gradient-to-b from-gray-800 to-gray-950 border-r-2 border-white/20 p-0 
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
        {/* Search Button */}
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
      </div>
      <div className="bg-gradient-to-r from-transparent via-white/50 to-transparent h-[2px] w-[100%] mb-3"></div>
      {/* Conversation List */}
      <div className="w-full h-full overflow-hidden">
        <div className="flex flex-col gap-3 p-1 overflow-y-auto h-full custom-scrollbar">
          {getConversations().map((conv, index) => (
            <div key={index} className={`relative ${(getActiveConversation() !== null && getActiveConversation()?.id == conv.id) ? "bg-white/25" : "bg-white/5 hover:bg-white/15"}  rounded-lg cursor-pointer overflow-hidden 
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
                <div className={`${sidebarExpanded? "rounded-full":"rounded-sm"} bg-gradient-to-br from-white/15 to-white/5 flex items-center justify-center 
                                transition-all duration-200 ${sidebarExpanded ? "h-10 min-w-10" : "w-full h-full"}`}>
                  {conv.logoURL ?
                    <img src={conv.logoURL} alt="Conversation" className="w-10 h-10 object-cover" /> :
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
    </div>
  );
}
