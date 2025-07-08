'use client';
import { FormEvent, useState } from 'react';
import Modal from 'react-modal';
import TraitSlider from './TraitSlider';

export interface PersonaConfig {
  name: string;
  age: number;
  role: string;
  style: string;
  domain_knowledge: string[];
  quirks: string;
  bio: string;
  lore: string;
  personality: string;
  conversation_style: string;
  description: string;
  emotional_stability: number;
  friendliness: number;
  creativity: number;
  curiosity: number;
  formality: number;
  empathy: number;
  humor: number;
}
const initialPersonaData: PersonaConfig = {
  name: "",
  age: 0,
  role: "",
  style: "",
  domain_knowledge: [],
  quirks: "",
  bio: "",
  lore: "",
  personality: "",
  conversation_style: "",
  description: "",
  emotional_stability: 0.0,
  friendliness: 0.0,
  creativity: 0.0,
  curiosity: 0.0,
  formality: 0.0,
  empathy: 0.0,
  humor: 0.0,
};

const AddItemForm = ({ onAddItem }: { onAddItem: (item: PersonaConfig) => void }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [persona, setPersona] = useState<PersonaConfig>(initialPersonaData);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (name === "domain_knowledge") {
      setPersona(prev => ({
        ...prev,
        // Split by comma, trim whitespace, and remove any empty strings
        domain_knowledge: value.split(',').map(s => s.trim()).filter(Boolean),
      }));
      return;
    }
    const isNumeric = type === 'range' || type === 'number';
    setPersona(prev => ({
      ...prev,
      [name]: isNumeric ? parseFloat(value) || 0 : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, you would send this 'persona' object to your API
    console.log("Form Submitted:", persona);
    onAddItem(persona)
    setIsAdding(false);
  };

  if (!isAdding) {
    return (
      <button
        onClick={() => setIsAdding(true)}
        className="w-full flex items-center justify-center px-4 py-2 mt-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
      >
        Create a new persona
      </button>
    );
  }

  return (
    <Modal
      isOpen={isAdding}
      onRequestClose={() => setIsAdding(false)}
      contentLabel="Add New Item"
      ariaHideApp={true}
    >
      <div className="flex flex-col align-items-center pb-4">
        <section>
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-6">Core Identity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" id="name" name="name" value={persona.name} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700">Age</label>
              <input type="number" id="age" name="age" value={persona.age} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
              <input type="text" id="role" name="role" value={persona.role} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
              <textarea id="description" name="description" value={persona.description} onChange={handleChange} rows={3} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
          </div>
        </section>

        {/* Section 2: Written Voice & Knowledge */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-6">Voice & Knowledge</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="conversation_style" className="block text-sm font-medium text-gray-700">Conversation Style</label>
              <input type="text" id="conversation_style" name="conversation_style" value={persona.conversation_style} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div>
              <label htmlFor="quirks" className="block text-sm font-medium text-gray-700">Quirks</label>
              <input type="text" id="quirks" name="quirks" value={persona.quirks} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="domain_knowledge" className="block text-sm font-medium text-gray-700">Domain Knowledge (comma-separated)</label>
              <input type="text" id="domain_knowledge" name="domain_knowledge" value={persona.domain_knowledge.join(', ')} onChange={handleChange} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="bio" className="block text-sm font-medium text-gray-700">Bio & Lore</label>
              <textarea id="bio" name="bio" value={persona.bio} onChange={handleChange} rows={4} className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
            </div>
          </div>
        </section>

        {/* Section 3: Personality Traits */}
        <section>
          <h2 className="text-xl font-semibold text-gray-800 border-b pb-3 mb-6">Personality Traits</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
            <TraitSlider label="Emotional Stability" name="emotional_stability" value={persona.emotional_stability} onChange={handleChange} />
            <TraitSlider label="Friendliness" name="friendliness" value={persona.friendliness} onChange={handleChange} />
            <TraitSlider label="Creativity" name="creativity" value={persona.creativity} onChange={handleChange} />
            <TraitSlider label="Curiosity" name="curiosity" value={persona.curiosity} onChange={handleChange} />
            <TraitSlider label="Formality" name="formality" value={persona.formality} onChange={handleChange} />
            <TraitSlider label="Empathy" name="empathy" value={persona.empathy} onChange={handleChange} />
            <TraitSlider label="Humor" name="humor" value={persona.humor} onChange={handleChange} />
          </div>
        </section>
        <button onClick={handleSubmit} className='mt-8 bg-blue-600 p-4 rounded-full text-white hover:cursor-pointer'>Create Persona</button>
      </div>
    </Modal>
  );
};

export default AddItemForm;