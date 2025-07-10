'use client';
import React, {useState, FormEvent} from 'react';
import {SendHorizonal as SendIcon} from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (input: string) => void;
  isSending: boolean;
  isPersonaSelected: boolean;
}

const ChatInput: React.FC<ChatInputProps> = ({ onSendMessage, isSending, isPersonaSelected }) => {
  const [input, setInput] = useState('');
  const handleSubmit = (e: FormEvent) => { e.preventDefault(); if (input.trim()) { onSendMessage(input.trim()); setInput(''); } };
  return (
    <form onSubmit={handleSubmit} className="flex items-center p-4 bg-white dark:bg-gray-900"
    style={{ backgroundColor: "var(--color-bg-secondary)", color: "var(--color-text-primary)" }}>
      <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isSending ? "Waiting for response..." : "Type your message..."} className="flex-grow px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isSending} style={{backgroundColor: "var(--color-bg-primary)", color: "var(--color-text-primary)"}} />
      <button type="submit" className="ml-4 p-3 text-white rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50" disabled={!input.trim() || isSending || !isPersonaSelected}
      style={{ backgroundColor: isPersonaSelected ? "var(--color-accent-primary)" : "gray" }}
      ><SendIcon className="w-5 h-5" /></button>
    </form>
  );
}

export default ChatInput