import React, { useEffect } from 'react'
import { Dispatch, SetStateAction } from 'react'
import { usePersonas, addNewPersona } from '@/app/lib/fetchers'
import AddPersonalityForm from './AddPersonalityForm'
import PersonalityList from './PersonalityList'
import LogoutButton from './LogoutButton'
import {PersonaConfig} from "./AddPersonalityForm"
interface SidebarProps {
  setSelectedPersona: any
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
    <div className='bg-gray-200 h-screen min-w-2/12 p-4 overflow-y-auto w-2/12 justify-between flex flex-col'
    style={{ backgroundColor: "var(--color-bg-primary)", color: "var(--color-text-primary)" }}>
      <div className="flex flex-col align-items-center">
      <AddPersonalityForm onAddItem={handleAddItem} />
      <h2 className='text-xl font-bold mt-4 text-center'>
        Saved Personas
      </h2>
      <PersonalityList personalityList={Array.isArray(personas) ? personas : []} onSelectPersona={setSelectedPersona}/>
      </div>
      <LogoutButton />
    </div>
  )
}

export default Sidebar
