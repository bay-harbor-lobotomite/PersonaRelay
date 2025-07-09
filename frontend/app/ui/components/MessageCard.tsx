import { z } from 'zod';
import Modal from 'react-modal';
import React, { useState } from 'react';
import { MessageSchema } from '@/app/generate/page';
export type Message = z.infer<typeof MessageSchema>;

interface MessageCardProps {
  message: Message;
  handlePost: (message: string) => void;
  onDragStart: (message: Message) => void;
}

const MessageCard = ({ message, handlePost, onDragStart }: MessageCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  return (
    <div
      draggable="true"
      onDragStart={() => onDragStart(message)}
      className="flex flex-col justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow flex-shrink-0 w-64 cursor-grab"
    >
      <p
        onClick={() => setIsAdding(true)}
        className="text-gray-700 dark:text-gray-300 mb-4 truncate cursor-pointer"
        title="Click to view full message"
      >
        {message.text}
      </p>
      <button
        onClick={() => handlePost(message.text)}
        className="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-950 transition-colors"
      >
        Post to Nostr
      </button>
      <Modal
        isOpen={isAdding}
        onRequestClose={() => setIsAdding(false)}
        contentLabel="Full Message"
        ariaHideApp={true} 
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            width: '80%',
            maxWidth: '600px',
            background: '#1f2937',
            border: '1px solid #4b5563', 
            borderRadius: '8px',
            color: '#d1d5db',
            zIndex: 1001
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            zIndex: 1000
          },
        }}
      >
        <h3 className="text-lg font-semibold text-gray-100 mb-4 text-center">
          Full Message
        </h3>
        <div className="max-h-[70vh] overflow-y-auto pr-2">
          <p className="text-gray-300 whitespace-pre-wrap break-words">
            {message.text}
          </p>
        </div>
        <button
          onClick={() => setIsAdding(false)}
          className="mt-4 w-full px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
        >
          Close
        </button>
      </Modal>
    </div>
  );
};

export default MessageCard;