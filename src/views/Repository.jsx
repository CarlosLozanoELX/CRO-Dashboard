import React, { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { format } from 'date-fns';
import { Search, Filter, FlaskConical, ExternalLink } from 'lucide-react';

const Repository = () => {
    const { filteredData } = useData();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');

    // Filter Logic
    const repositoryData = useMemo(() => {
        return filteredData.filter(item => {
            const matchesSearch =
                (item.Title && item.Title.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item['Idea Code'] && item['Idea Code'].toLowerCase().includes(searchTerm.toLowerCase())) ||
                (item.Description && item.Description.toLowerCase().includes(searchTerm.toLowerCase()));

            const matchesStatus = statusFilter === 'All' || item.statusClean === statusFilter;

            return matchesSearch && matchesStatus;
        });
    }, [filteredData, searchTerm, statusFilter]);

    const getStatusColor = (status) => {
        switch (status) {
            case 'Running': return 'text-neon-pink bg-neon-pink/10 border-neon-pink/20';
            case 'Completed': return 'text-neon-blue bg-neon-blue/10 border-neon-blue/20';
            case 'Pipeline': return 'text-neon-purple bg-neon-purple/10 border-neon-purple/20';
            default: return 'text-gray-400 bg-gray-500/10 border-gray-500/20';
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Experiment Repository</h1>
                    <p className="text-gray-400">Searchable database of all CRO initiatives.</p>
                </div>

                {/* Local Toolbar */}
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-hover:text-neon-blue transition-colors" />
                        <input
                            type="text"
                            placeholder="Search experiments..."
                            className="bg-black/40 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-sm text-white focus:outline-none focus:border-neon-blue/50 w-64 transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <select
                        className="bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:border-neon-blue/50"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="All">All Statuses</option>
                        <option value="Running">Running</option>
                        <option value="Pipeline">Pipeline</option>
                        <option value="Completed">Completed</option>
                        <option value="Stopped">Stopped</option>
                    </select>
                </div>
            </div>

            <Card className="overflow-hidden border-white/5">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-white/10 bg-white/5">
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Code</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-1/3">Experiment</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Result</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Dates</th>
                                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Markets</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {repositoryData.map((exp, idx) => (
                                <tr key={idx} className="hover:bg-white/5 transition-colors group">
                                    <td className="p-4 font-mono text-xs text-neon-blue opacity-80">
                                        {exp.url ? (
                                            <a href={exp.url} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline decoration-neon-blue underline-offset-2 transition-all">
                                                {exp['Idea Code']}
                                            </a>
                                        ) : (
                                            exp['Idea Code']
                                        )}
                                    </td>
                                    <td className="p-4">
                                        <div className="font-medium text-white transition-colors">
                                            {exp.url ? (
                                                <a href={exp.url} target="_blank" rel="noopener noreferrer" className="hover:text-neon-blue transition-colors">
                                                    {exp.Title}
                                                </a>
                                            ) : (
                                                exp.Title
                                            )}
                                        </div>
                                        <div className="text-xs text-gray-500 truncate max-w-md mt-1">{exp.Description}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase border ${getStatusColor(exp.statusClean)}`}>
                                            {exp.statusClean}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className={`text-sm font-bold ${exp.resultNormalized === 'Winner' ? 'text-neon-green' :
                                            exp.resultNormalized === 'Loser' ? 'text-neon-pink' : 'text-gray-500'
                                            }`}>
                                            {exp.resultNormalized || '-'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-xs text-gray-400 font-mono">
                                        {exp.startDate ? format(new Date(exp.startDate), 'MMM d, yy') : '-'}
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-wrap gap-1">
                                            {exp.allMarkets && exp.allMarkets.slice(0, 3).map((m, i) => (
                                                <span key={i} className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-gray-300 border border-white/5">
                                                    {m}
                                                </span>
                                            ))}
                                            {exp.allMarkets && exp.allMarkets.length > 3 && (
                                                <span className="text-[10px] text-gray-500">+{exp.allMarkets.length - 3}</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="p-4 border-t border-white/10 text-xs text-gray-500 flex justify-between">
                    <span>Showing {repositoryData.length} experiments</span>
                </div>
            </Card>
        </div>
    );
};

export default Repository;
