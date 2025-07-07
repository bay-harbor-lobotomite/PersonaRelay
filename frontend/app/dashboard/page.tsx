"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { usePersona } from "../lib/fetchers";
import ChatInput from "@/app/ui/components/ChatInput";
import ChatMessage from "@/app/ui/components/ChatMessage";
import Sidebar from "@/app/ui/components/Sidebar";
import { Message } from "@/app/ui/components/ChatMessage";
import { CHAT_BASE_URL } from "@/app/lib/constants";
import { z } from "zod"; 
import { useRouter } from "next/navigation";
import { checkLogin } from "../lib/checkLogin";

const MessageSchema = z.object({
  id: z.number(),
  text: z.string(),
  sender: z.literal('bot'),
});



// --- Main Page Component (Updated Logic) ---

export default function Home() {
  const initialMessages: Message[] = [{ id: 1, text: "Hello! I'm powered by a FastAPI backend. How can I help?", sender: 'bot' }];
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const {persona, isLoading, isError } = usePersona(selectedPersona);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if the user is logged in
    checkLogin(router);
  }, [router])

  useEffect(() => {
    //fetch the correct persona
  }, [selectedPersona])

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  // UPDATED: This function now calls the FastAPI backend
  const handleSendMessage = async (text: string) => {
    setIsSending(true);

    // 1. Add user message to the UI immediately
    const userMessage: Message = { id: Date.now(), text, sender: 'user' };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      // 2. Send the entire chat history to the backend
      const response = await fetch(CHAT_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: newMessages }),
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
        id: Date.now() + 1,
        text: "Sorry, I couldn't connect to the server. Please try again later.",
        sender: 'bot',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };
  
  return (
    <div className="flex">
      <Sidebar setSelectedPersona={setSelectedPersona}/>
      <div className="flex flex-grow flex-col h-screen bg-gray-50 dark:bg-gray-950 font-[family-name:var(--font-geist-sans)]">
      <header className="p-4 border-b border-gray-200 dark:border-gray-800 text-center">
        <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Craft a message as: {persona ? persona.name : ""}</h1>
      </header>
      <div className="flex-grow p-4 sm:p-6 overflow-y-auto">
        <div className="space-y-6">
          {messages.map(message => (<ChatMessage key={message.id} message={message} />))}
          <div ref={messagesEndRef} />
        </div>
      </div>
      <div className="flex-shrink-0">
        <ChatInput onSendMessage={handleSendMessage} isSending={isSending} />
      </div>
      </div>
    </div>
  );
}