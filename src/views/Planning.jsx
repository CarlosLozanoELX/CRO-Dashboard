import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { differenceInDays, startOfMonth, addDays, endOfMonth, eachMonthOfInterval, format } from 'date-fns';

const PLANNING_PHASES = [
    'Planning',
    'Design',
    'Development',
    'QA',
    'Sign off',
    'Running',
    'Analysis',
    'Completed'
];

const PHASE_COLORS = {
    'Planning': '#A1A1AA',    // Zinc-400
    'Design': '#BC13FE',      // Neon Purple
    'Development': '#00F0FF', // Neon Blue
    'QA': '#FCEE0A',          // Neon Yellow
    'Sign off': '#0AFF99',    // Neon Green
    'Running': '#FF003C',     // Neon Pink
    'Analysis': '#FF8A00',    // Neon Orange
    'Completed': '#3F3F46'    // Zinc-700
};

const KanbanCard = ({ item }) => {
    return (
        <div className="bg-card-bg/40 border border-white/5 rounded-lg p-3 mb-3 hover:bg-white/10 transition-colors cursor-pointer group shadow-sm hover:shadow-glow-blue/10 hover:border-neon-blue/20">
            <div className="flex justify-between items-start mb-1">
                <div className="flex gap-2 items-center">
                    {item.url ? (
                        <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="text-[10px] font-mono font-bold text-neon-blue/80 bg-neon-blue/10 px-1.5 py-0.5 rounded hover:bg-neon-blue hover:text-white transition-colors">
                            {item['Idea Code']}
                        </a>
                    ) : (
                        <span className="text-[10px] font-mono font-bold text-neon-blue/80 bg-neon-blue/10 px-1.5 py-0.5 rounded">{item['Idea Code']}</span>
                    )}
                    {item.isOverdue && (
                        <span className="text-[8px] bg-neon-pink/20 text-neon-pink border border-neon-pink/30 px-1 rounded animate-pulse font-bold tracking-tighter">OVERDUE</span>
                    )}
                    {item.isDelayed && (
                        <span className="text-[8px] bg-neon-yellow/20 text-neon-yellow border border-neon-yellow/30 px-1 rounded font-bold tracking-tighter">DELAYED</span>
                    )}
                </div>
                <span className="text-[10px] text-gray-400">{item.workstream}</span>
            </div>
            <h4 className="text-sm font-medium text-gray-200 mb-2 leading-tight transition-colors">
                {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} className="hover:text-neon-blue transition-colors">
                        {item['Title']}
                    </a>
                ) : (
                    item['Title']
                )}
            </h4>

            <div className="flex flex-wrap gap-1 mt-2">
                {item.allMarkets.slice(0, 3).map(m => (
                    <span key={m} className="text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded border border-white/5">
                        {m}
                    </span>
                ))}
                {item.allMarkets.length > 3 && (
                    <span className="text-[9px] bg-white/5 text-gray-400 px-1.5 py-0.5 rounded border border-white/5">
                        +{item.allMarkets.length - 3}
                    </span>
                )}
            </div>
        </div>
    );
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-app-bg/90 border border-neon-blue/30 backdrop-blur-md p-3 rounded-lg shadow-glow-blue">
                <p className="text-white font-bold mb-1">{label}</p>
                <p className="text-sm text-neon-blue">
                    Count: <span className="font-mono font-bold">{payload[0].value}</span>
                </p>
            </div>
        );
    }
    return null;
};

export const Planning = () => {
    const { filteredData } = useData();

    // Filter for Planning items only (those that map to one of our phases via displayStatus)
    const planningData = useMemo(() => {
        return filteredData.filter(d => {
            return PLANNING_PHASES.includes(d.displayStatus);
        });
    }, [filteredData]);

    // 1. Phase Distribution Data
    const phaseData = useMemo(() => {
        const counts = {};
        PLANNING_PHASES.forEach(p => counts[p] = 0);

        planningData.forEach(d => {
            if (counts[d.displayStatus] !== undefined) {
                counts[d.displayStatus]++;
            }
        });

        return Object.entries(counts).map(([name, value]) => ({ name, value }));
    }, [planningData]);

    // 2. Kanban Columns
    const kanbanColumns = useMemo(() => {
        const columns = {};
        PLANNING_PHASES.forEach(p => columns[p] = []);
        planningData.forEach(d => {
            if (columns[d.displayStatus]) {
                columns[d.displayStatus].push(d);
            }
        });
        return columns;
    }, [planningData]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Pipeline Overview Chart */}
            <Card>
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-neon-purple rounded-full"></span>
                    <span className="tracking-tight">Planning Pipeline Overview</span>
                </h3>
                <div className="h-[250px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={phaseData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1E1E1E" />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#A1A1AA', fontSize: 12 }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#A1A1AA', fontSize: 12 }}
                                allowDecimals={false}
                            />
                            <Tooltip cursor={{ fill: '#FFFFFF', opacity: 0.05 }} content={<CustomTooltip />} />
                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {phaseData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={PHASE_COLORS[entry.name] || '#9CA3AF'} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </Card>

            {/* Kanban Board */}
            <div className="overflow-x-auto pb-4">
                <div className="min-w-[1800px] grid grid-cols-8 gap-4">
                    {PLANNING_PHASES.map(phase => (
                        <div key={phase} className="flex flex-col">
                            <div className={`flex items-center justify-between p-3 rounded-t-xl border-t-4 mb-2 bg-card-bg/50 backdrop-blur-sm`} style={{ borderColor: PHASE_COLORS[phase] }}>
                                <h4 className="font-bold text-gray-200 text-sm uppercase tracking-wider">{phase}</h4>
                                <span className="bg-white/10 text-white text-xs font-mono py-0.5 px-2 rounded-full">
                                    {kanbanColumns[phase].length}
                                </span>
                            </div>

                            <div className="glass-panel rounded-xl p-3 min-h-[400px]">
                                {kanbanColumns[phase].map(item => (
                                    <KanbanCard key={item.id} item={item} />
                                ))}
                                {kanbanColumns[phase].length === 0 && (
                                    <div className="text-center py-8 text-gray-600 text-xs italic">
                                        No items
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
