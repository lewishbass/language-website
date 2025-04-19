'use client';
import { ConversationProvider } from "./contexts/ConversationContext";
import Sidebar from "./components/Sidebar";
import Chat from "./components/Chat";

export default function Home() {
  return (
    <ConversationProvider>
      <div className="flex flex-row w-full, h-full">
        {/* Sidebar Component */}
        <Sidebar />

        {/* Chat Component */}
        <Chat />
      </div>
    </ConversationProvider>
  );
}
