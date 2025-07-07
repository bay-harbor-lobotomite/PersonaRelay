import React, { useEffect } from 'react'
import { Dispatch, SetStateAction } from 'react'
import { usePersonas, addNewPersona } from '@/app/lib/fetchers'
import AddPersonalityForm from './AddPersonalityForm'
import PersonalityList from './PersonalityList'
import LogoutButton from './LogoutButton'

interface SidebarProps {
  setSelectedPersona: Dispatch<SetStateAction<string | null>>
}
const Sidebar: React.FC<SidebarProps> = ({ setSelectedPersona }) => {
  const { personas, isLoading, isError, addPersona } = usePersonas()
  // Placeholder function for handleAddItem
  const handleAddItem = (item: string) => {
    // Implement your logic here
    //i need to use swr mutation to add a new persona
    addPersona({ name: item})
    setSelectedPersona(item);
  };

  return (
    <div className='bg-gray-200 h-screen p-4 overflow-y-auto w-2/12  justify-between flex flex-col'>
      <div className="flex flex-col align-items-center">
      <h2>
        Saved Personas
      </h2>
      <AddPersonalityForm onAddItem={handleAddItem} />
      <PersonalityList personalityList={personas} onSelectPersona={setSelectedPersona}/>
      </div>
      <LogoutButton />
    </div>
  )
}

export default Sidebar
