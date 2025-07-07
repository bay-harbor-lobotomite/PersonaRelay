'use client';
import { FormEvent, useState } from 'react';
const AddItemForm = ({ onAddItem }: {onAddItem: (item: string) => void}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [newItemText, setNewItemText] = useState('');

  const handleSubmit = (e: FormEvent) => {
    // Prevent the default form submission which reloads the page
    e.preventDefault(); 
    // Trim whitespace and check if the input is not empty
    if (newItemText.trim()) {
      onAddItem(newItemText.trim());
      setNewItemText(''); // Clear the input field
      setIsAdding(false);  // Hide the form and show the "Add Item" button again
    }
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
    <form onSubmit={handleSubmit} className="flex items-center gap-2 mt-4">
      <input
        type="text"
        value={newItemText}
        onChange={(e) => setNewItemText(e.target.value)}
        placeholder="Persona name"
        className="flex-grow block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
        autoFocus // Automatically focus the input when it appears
      />
      <button
        type="submit"
        className="flex-shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-full bg-green-500 hover:bg-green-600 text-white font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
      >
        +
      </button>
      <button
        type="button" // Use type="button" to prevent form submission
        onClick={() => setIsAdding(false)}
        className="flex-shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-400"
      >
        × 
      </button>
    </form>
  );
};

export default AddItemForm;