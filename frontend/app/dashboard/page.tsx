'use client';
import React, { useEffect } from 'react'
import { sendNostrPost } from '@/app/lib/fetchers';
import { API_BASE_URL } from '@/app/lib/constants';
import { useMessages, usePersona } from '@/app/lib/fetchers'
import { checkLogin } from '@/app/lib/checkLogin'
import { useRouter } from 'next/navigation'
import { ToastContainer, toast } from 'react-toastify'
import Sidebar from '@/app/ui/components/Sidebar'
import MessageCard from '@/app/ui/components/MessageCard'

const Page = () => {
    const router = useRouter()
    const [selectedPersona, setSelectedPersona] = React.useState<string>("");
    const [currentUser, setCurrentUser] = React.useState<any>();
    useEffect(() => {
        // Check if the user is logged in
        checkLogin(router, setCurrentUser);
    }, [])
    const { messages, isLoading: messagesLoading, isError: messagesError } = useMessages(selectedPersona)
    const { persona, isLoading: personaLoading, isError: personaError } = usePersona(selectedPersona);

    const handlePostNostr = async (msg: string) => {
        const url = `${API_BASE_URL}/nostr/post`;
        console.log(url)
        const data = await sendNostrPost(url, msg);
        console.log("Posted to Nostr successfully:", data);
        // Optionally, you can update the UI or show a success message
        toast.success("Posted to Nostr successfully!")
    }
    return (
        <div className="flex">
            <ToastContainer position="bottom-right" />
            <Sidebar setSelectedPersona={setSelectedPersona} />
            <div className="flex flex-grow flex-col max-w-screen h-screen bg-gray-50 dark:bg-gray-950 font-[family-name:var(--font-geist-sans)]">
                <header className="p-4 border-b border-gray-200 dark:border-gray-800 text-center flex justify-between items-center">
                    <h1 className="text-xl font-bold text-gray-800 dark:text-gray-200 w-9/12">View messages for : {persona ? persona.name : ""}</h1>
                    <button onClick={() => router.push('/generate')} className='px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:focus:ring-offset-gray-950 transition-colors hover:cursor-pointer'>Generate posts</button>
                </header>
                <div className="flex-grow p-4 sm:p-6 overflow-y-auto">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {messages && messages.map((message: any) => (
                            <MessageCard
                                key={message.id}
                                message={message}
                                handlePost={handlePostNostr}
                            />
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Page
