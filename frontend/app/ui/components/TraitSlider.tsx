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
      <label htmlFor={name} className="flex justify-between items-center text-sm font-medium text-gray-700 text-white">
        <span>{label}</span>
        <span className="font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--color-accent-primary)' }}>
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
        className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-green-600"
        style={{ backgroundColor: 'var(--color-bg-primary)' }}
      />
    </div>
  );
}