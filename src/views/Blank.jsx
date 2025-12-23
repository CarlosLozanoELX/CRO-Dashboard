import React from 'react';
import { FileQuestion } from 'lucide-react';

const Blank = () => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
            <div className="w-20 h-20 bg-neon-blue/10 rounded-2xl flex items-center justify-center mb-6 border border-neon-blue/20 shadow-glow-blue/10">
                <FileQuestion className="text-neon-blue w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2 tracking-tight uppercase">Blank Workspace</h2>
            <p className="text-gray-400 max-w-md">
                This space is currently empty. It can be used for new experiments, customized reports, or sandbox testing.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="glass-panel p-4 rounded-xl border border-white/5 bg-white/5 animate-pulse">
                        <div className="h-4 w-2/3 bg-white/10 rounded mb-2"></div>
                        <div className="h-3 w-full bg-white/5 rounded"></div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Blank;
