import React from 'react'

const PersonalityList = ({personalityList, onSelectPersona}: {personalityList: any[], onSelectPersona: any}) => {
  console.log(personalityList)
  return (
    <div className="mt-2">
        <ul className="list-none p-0">
          {personalityList ? personalityList.map((persona: any) => (
            <li key={persona.name} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer" onClick={() => onSelectPersona(persona.name)}>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{persona.name}</span>
              </div>
            </li>
          )) : "Loading..."}
        </ul>
    </div>
  )
}

export default PersonalityList
