"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { usePersona } from "@/app/lib/fetchers";
import ChatInput from "@/app/ui/components/ChatInput";
import ChatMessage from "@/app/ui/components/ChatMessage";
import Sidebar from "@/app/ui/components/Sidebar";
import { Message } from "@/app/ui/components/ChatMessage";
import { API_BASE_URL, CHAT_BASE_URL } from "@/app/lib/constants";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { checkLogin } from "@/app/lib/checkLogin";
import {toast, ToastContainer } from "react-toastify";
export const MessageSchema = z.object({
  _id: z.string(),
  text: z.string(),
  sender: z.literal('bot'),
  persona_name: z.string(),
  username: z.string(),
  scheduled_time: z.string().nullable(),
  schedule_status: z.string(),
  task_id: z.string().nullable(),
});

export default function Home() {
  const initialMessages: Message[] = [];
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const { persona, isLoading, isError } = usePersona(selectedPersona);
  const [currentUser, setCurrentUser] = useState<any>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    checkLogin(router, setCurrentUser);
  }, [])

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);


  const handleSelectedPersona = (personaName: string) => {
    setSelectedPersona(personaName);
    setMessages([]); // Clear messages when persona changes
  }
  const handleSendMessage = async (text: string) => {
    setIsSending(true);

    const userMessage: Message = { _id: String(Date.now()), text, sender: 'user', persona_name: selectedPersona, username: currentUser?.username || "Unknown", schedule_status: "unscheduled" };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      console.log(userMessage, selectedPersona);
      const response = await fetch(CHAT_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem("accessToken")}` },
        body: JSON.stringify({ last_user_message: userMessage, persona_name: selectedPersona }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const botResponseData = await response.json();

      // 3. Validate the response with Zod
      // .parse() will throw an error if the data doesn't match the schema
      const validatedBotMessage = MessageSchema.parse(botResponseData);

      // 4. Add the validated bot message to the UI
      setMessages(prev => [...prev, validatedBotMessage]);

    } catch (error) {
      console.error("Failed to fetch or validate bot response:", error);
      // Display an error message in the chat
      const errorMessage: Message = {
        _id: String(Date.now() + 1),
        text: "Sorry, I couldn't connect to the server. Please try again later.",
        sender: 'bot',
        username: currentUser?.username || "Unknown", 
        persona_name: selectedPersona || "Unknown Persona",
        schedule_status: "failed",
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex">
      <ToastContainer position="bottom-right"/>
      <Sidebar setSelectedPersona={handleSelectedPersona} />
      <div className="flex flex-grow flex-col max-w-screen h-screen font-[family-name:var(--font-geist-sans)]"
      style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-primary)" }}
      >
        <header className="p-4 border-b border-gray-200 dark:border-gray-800 text-center flex justify-between items-center">
          <h1 className="text-xl font-bold text-white dark:text-gray-200 w-full text-left ml-8">Craft posts for : {persona ? persona.name : ""}</h1>
          <button onClick={() => router.push('/dashboard')} className='px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-950 transition-colors hover:cursor-pointer' style={{backgroundColor: "var(--color-accent-primary)"}}>View all posts</button>
        </header>
        <div className="flex-grow p-4 sm:p-6 overflow-y-auto">
          <div className="space-y-6">
            {messages.map(message => (<ChatMessage key={message._id} message={message}/>))}
            <div ref={messagesEndRef} />
              {isSending &&
                <div className="flex items-center justify-center mt-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              }
          </div>
        </div>
        <div className="flex-shrink-0">
          <ChatInput onSendMessage={handleSendMessage} isSending={isSending} isPersonaSelected={selectedPersona !== ""} />
        </div>
      </div>
    </div>
  );
}