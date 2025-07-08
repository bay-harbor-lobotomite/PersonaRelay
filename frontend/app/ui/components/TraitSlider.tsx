"use client";

import React from 'react';

type TraitSliderProps = {
  label: string;
  name: string;
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  min?: number;
  max?: number;
  step?: number;
};

export default function TraitSlider({
  label,
  name,
  value,
  onChange,
  min = 0,
  max = 1,
  step = 0.01,
}: TraitSliderProps) {
  return (
    <div>
      <label htmlFor={name} className="flex justify-between items-center text-sm font-medium text-gray-700">
        <span>{label}</span>
        <span className="font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">
          {value.toFixed(2)}
        </span>
      </label>
      <input
        id={name}
        name={name}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={onChange}
        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"
      />
    </div>
  );
}