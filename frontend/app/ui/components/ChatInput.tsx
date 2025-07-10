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
    <form onSubmit={handleSubmit} className="flex items-center p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
      <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder={isSending ? "Waiting for response..." : "Type your message..."} className="flex-grow px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500" disabled={isSending} />
      <button type="submit" className="ml-4 p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50" disabled={!input.trim() || isSending || !isPersonaSelected}><SendIcon className="w-5 h-5" /></button>
    </form>
  );
}

export default ChatInput