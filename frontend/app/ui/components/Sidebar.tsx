import React, { useEffect } from 'react'
import { Dispatch, SetStateAction } from 'react'
import { usePersonas, addNewPersona } from '@/app/lib/fetchers'
import AddPersonalityForm from './AddPersonalityForm'
import PersonalityList from './PersonalityList'
import LogoutButton from './LogoutButton'
import {PersonaConfig} from "./AddPersonalityForm"
interface SidebarProps {
  setSelectedPersona: Dispatch<SetStateAction<string>>
}
const Sidebar: React.FC<SidebarProps> = ({ setSelectedPersona }) => {
  const { personas, isLoading, isError, addPersona } = usePersonas()
  // Placeholder function for handleAddItem
  const handleAddItem = (item: PersonaConfig) => {
    // Implement your logic here
    //i need to use swr mutation to add a new persona
    addPersona(item)
    setSelectedPersona(item.name);
  };

  return (
    <div className='bg-gray-200 h-screen min-w-2/12 p-4 overflow-y-auto w-2/12 justify-between flex flex-col'>
      <div className="flex flex-col align-items-center">
      <h2>
        Saved Personas
      </h2>
      <AddPersonalityForm onAddItem={handleAddItem} />
      <PersonalityList personalityList={Array.isArray(personas) ? personas : []} onSelectPersona={setSelectedPersona}/>
      </div>
      <LogoutButton />
    </div>
  )
}

export default Sidebar
