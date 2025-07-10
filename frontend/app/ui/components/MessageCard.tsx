import { z } from 'zod';
import Modal from 'react-modal';
import React, { useState } from 'react';
import { MessageSchema } from '@/app/generate/page';
import { se } from 'date-fns/locale';
import { toast, ToastContainer } from 'react-toastify';
import { Vortex } from 'react-loader-spinner';
export type Message = z.infer<typeof MessageSchema>;

interface MessageCardProps {
  message: Message;
  handlePost: (message: string) => void;
  onDragStart: (message: Message) => void;
}

const MessageCard = ({ message, handlePost, onDragStart }: MessageCardProps) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  const handleNostrPost = async (msg: any) => {
    setIsPosting(true);
    await handlePost(msg.text);
    setIsPosting(false);
  }
  return (
    <div
      draggable="true"
      onDragStart={() => onDragStart(message)}
      className="flex flex-col justify-between p-4 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-md hover:shadow-lg transition-shadow flex-shrink-0 w-64 cursor-grab" style={{ backgroundColor: 'var(--color-bg-primary)', color: 'var(--color-text-primary)' }}
    >
      <p
        onClick={() => setIsAdding(true)}
        className="text-white mb-4 truncate cursor-pointer"
        title="Click to view full message"
      >
        {message.text}
      </p>
      <button
        onClick={handleNostrPost}
        disabled={isPosting}
        className="w-full px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-950 transition-colors" style={{ backgroundColor: 'var(--color-accent-primary)' }}
      >
        {isPosting ?
          <Vortex
            visible={true}
            height={30}
            width={40}
            ariaLabel="vortex-loading"
            wrapperStyle={{}}
            wrapperClass="vortex-wrapper"
            colors={['#ffffff', '#ffffff', '#ffffff', '#ffffff', '#ffffff', "#ffffff"]}
          /> :
          "Post to Nostr"}
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
            width: '100%',
            maxWidth: '600px',
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid #4b5563',
            borderRadius: '8px',
            color: '#d1d5db',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            zIndex: 1001
          },
          overlay: {
            backgroundColor: 'var(--color-surface-hover)',
            zIndex: 1000
          },
        }}
      >
        <h3 className="text-2xl font-semibold text-gray-100 mb-4 text-center">
          Full Message
        </h3>
        <div className="max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <p className="text-white whitespace-pre-wrap break-words">
            {message.text}
          </p>
        </div>
        <button
          onClick={() => setIsAdding(false)}
          className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700"
          style={{ backgroundColor: 'var(--color-accent-secondary)' }}
        >
          Close
        </button>
      </Modal>
      <ToastContainer />
    </div>
  );
};

export default MessageCard;