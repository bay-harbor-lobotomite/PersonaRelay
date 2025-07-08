import { motion } from "framer-motion";
import { Bot as BotIcon, User as UserIcon } from "lucide-react";


export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}
const ChatMessage = ({ message }: { message: Message }) => {
  const isUser = message.sender === 'user';
  const messageVariants = {
    hidden: { opacity: 0, x: isUser ? 50 : -50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.17, 0.67, 0.83, 0.67] } },
  };
  return (
    <motion.div
      className={`flex items-start gap-4 ${isUser ? 'justify-end' : ''}`}
      variants={messageVariants} initial="hidden" animate="visible" layout
    >
      {!isUser && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><BotIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" /></div>}
      <div className={`px-4 py-3 rounded-2xl max-w-[70%] sm:max-w-[40%] ${isUser ? 'bg-blue-500 text-white rounded-br-none' : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-none'}`}><p className="text-sm">{message.text}</p></div>
      {isUser && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center"><UserIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" /></div>}
    </motion.div>
  );
}

export default ChatMessage;