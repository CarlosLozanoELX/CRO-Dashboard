import React from 'react';

export const Select = ({ label, value, options, onChange }) => {
    return (
        <div className="flex flex-col">
            <label className="text-[10px] font-bold text-neon-blue/70 uppercase tracking-widest mb-1.5 ml-1">
                {label}
            </label>
            <div className="relative">
                <select
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="block w-full appearance-none rounded-lg bg-card-bg/50 border border-white/10 py-2 pl-3 pr-10 text-white text-sm focus:outline-none focus:border-neon-blue/50 focus:ring-1 focus:ring-neon-blue/50 transition-all hover:bg-white/5 cursor-pointer"
                >
                    {options.map((opt) => (
                        <option key={opt} value={opt} className="bg-card-bg text-white">
                            {opt}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neon-blue">
                    <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                        <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                </div>
            </div>
        </div>
    );
};
