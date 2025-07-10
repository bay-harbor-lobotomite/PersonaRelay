'use client';
import React, { useEffect, useState } from 'react'
import { sendNostrPost } from '@/app/lib/fetchers';
import { API_BASE_URL } from '@/app/lib/constants';
import { useMessages, usePersona } from '@/app/lib/fetchers'
import { checkLogin } from '@/app/lib/checkLogin'
import { useRouter } from 'next/navigation'
import { ToastContainer, toast } from 'react-toastify'
import Sidebar from '@/app/ui/components/Sidebar'
// Import the new PostScheduler component
import PostScheduler from '@/app/ui/components/PostScheduler';
import { Message } from '../ui/components/MessageCard';

const Page = () => {
  const router = useRouter()
  const [selectedPersona, setSelectedPersona] = useState<string>("");
  const [currentUser, setCurrentUser] = useState<any>();

  useEffect(() => {
    checkLogin(router, setCurrentUser);
  }, [router])

  const { messages, isLoading: messagesLoading, isError: messagesError } = useMessages(selectedPersona)
  const { persona, isLoading: personaLoading, isError: personaError } = usePersona(selectedPersona);

  const handlePostNostr = async (msg: string) => {
    const url = `${API_BASE_URL}/nostr/post`;
    try {
      const data = await sendNostrPost(url, msg);
      console.log("Posted to Nostr successfully:", data);
      toast.success("Posted to Nostr successfully!")
    } catch (error) {
      console.error("Failed to post to Nostr:", error);
      toast.error("Failed to post to Nostr.")
    }
  }
  return (
    <div className="flex h-screen">
      <ToastContainer position="bottom-right" />
      <Sidebar setSelectedPersona={setSelectedPersona} />
      <div className="flex flex-grow flex-col max-w-screen h-screen bg-gray-50 dark:bg-gray-950 font-[family-name:var(--font-geist-sans)] overflow-hidden">
        <header className="p-4 border-b border-gray-200 dark:border-gray-800 text-center flex justify-between items-center flex-shrink-0">
          <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 w-full text-left ml-8">
            Schedule posts for: {persona ? persona.name : "..."}
          </h1>
          <button onClick={() => router.push('/generate')} className='px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-950 transition-colors hover:cursor-pointer'>
            Generate Posts
          </button>
        </header>
        <main className="flex-grow overflow-y-auto">
          {messagesLoading && <p className="p-4 text-center">Loading messages...</p>}
          {messagesError && <p className="p-4 text-center text-red-500">Error loading messages.</p>}
          {/* Use the PostScheduler here */}
          {!messagesLoading && !messagesError && (
            <PostScheduler messages={messages as Message[] || []} handlePost={handlePostNostr} />
          )}
        </main>
      </div>
    </div>
  )
}

export default Page;