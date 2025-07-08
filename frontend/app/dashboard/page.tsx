"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { sendNostrPost, usePersona } from "../lib/fetchers";
import ChatInput from "@/app/ui/components/ChatInput";
import ChatMessage from "@/app/ui/components/ChatMessage";
import Sidebar from "@/app/ui/components/Sidebar";
import { Message } from "@/app/ui/components/ChatMessage";
import { API_BASE_URL, CHAT_BASE_URL } from "@/app/lib/constants";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { checkLogin } from "../lib/checkLogin";
import {toast, ToastContainer } from "react-toastify";
const MessageSchema = z.object({
  id: z.number(),
  text: z.string(),
  sender: z.literal('bot'),
});



// --- Main Page Component (Updated Logic) ---

export default function Home() {
  const initialMessages: Message[] = [];
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isSending, setIsSending] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const { persona, isLoading, isError } = usePersona(selectedPersona);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if the user is logged in
    checkLogin(router);
  }, [])

  useEffect(() => {
    //fetch the correct persona
  }, [selectedPersona])

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };
  useEffect(() => { scrollToBottom(); }, [messages]);

  const handlePostNostr = async (msg: string) => {
    const url = `${API_BASE_URL}/nostr/post`;
    console.log(url)
    const data = await sendNostrPost(url, msg);
    console.log("Posted to Nostr successfully:", data);
    // Optionally, you can update the UI or show a success message
    toast.success("Posted to Nostr successfully!")    
  }

  // UPDATED: This function now calls the FastAPI backend
  const handleSendMessage = async (text: string) => {
    setIsSending(true);

    const userMessage: Message = { id: Date.now(), text, sender: 'user' };
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
      <ToastContainer position="bottom-right"/>
      <Sidebar setSelectedPersona={setSelectedPersona} />
      <div className="flex flex-grow flex-col max-w-screen h-screen bg-gray-50 dark:bg-gray-950 font-[family-name:var(--font-geist-sans)]">
        <header className="p-4 border-b border-gray-200 dark:border-gray-800 text-center">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200">Craft a message as: {persona ? persona.name : ""}</h1>
        </header>
        <div className="flex-grow p-4 sm:p-6 overflow-y-auto">
          <div className="space-y-6">
            {messages.map(message => (<ChatMessage key={message.id} message={message} onPost={handlePostNostr}/>))}
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