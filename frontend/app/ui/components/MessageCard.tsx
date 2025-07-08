import { z } from 'zod';
import Modal from 'react-modal';
import React, { useState } from 'react';

// Define the schema and derive the TypeScript type
const MessageSchema = z.object({
    id: z.number(),
    text: z.string(),
    sender: z.literal('bot'),
    persona_name: z.string(),
    username: z.string(),
});

export type Message = z.infer<typeof MessageSchema>;

// Define the component's props
interface MessageCardProps {
    message: Message;
    handlePost: (message: string) => void;
}

const MessageCard = ({ message, handlePost }: MessageCardProps) => {
    const [isAdding, setIsAdding] = useState(false);
    return (
        <div className="flex flex-col justify-between p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow">
            {/* The title attribute shows the full text on hover */}
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
                contentLabel="Add New Item"
                ariaHideApp={true}
            >
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
                    Full Message
                </h3>
                <div className="max-h-[70vh] overflow-y-auto pr-2">
                    <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words">
                        {message.text}
                    </p>
                </div>
            </Modal>
        </div>
    );
};

export default MessageCard;