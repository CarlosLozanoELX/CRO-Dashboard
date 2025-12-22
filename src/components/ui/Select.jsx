import React from 'react';
import { ChevronDown } from 'lucide-react';

export const Select = ({ value, onChange, options, label, placeholder = 'Select...' }) => {
    return (
        <div className="flex flex-col gap-1 min-w-[160px]">
            {label && <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">{label}</label>}
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="appearance-none w-full bg-white border border-gray-200 text-gray-700 py-2 px-3 pr-8 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium transition-shadow cursor-pointer hover:border-gray-300"
                >
                    {options.map((opt) => (
                        <option key={opt} value={opt}>
                            {opt}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
                    <ChevronDown size={16} />
                </div>
            </div>
        </div>
    );
};
