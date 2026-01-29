import React, { useMemo, useState } from 'react';
import { useData } from '../context/DataContext';
import { format, differenceInDays, addDays, startOfMonth, endOfMonth, eachMonthOfInterval, isSameMonth } from 'date-fns';
import { ChevronLeft, ChevronRight, GripHorizontal } from 'lucide-react';

const CATEGORY_COLORS = {
    'Homepage': 'bg-[#f97316] text-white border-[#fb923c] shadow-[0_2px_15px_rgba(249,115,22,0.4)]',
    'Product Page': 'bg-[#2563eb] text-white border-[#60a5fa] shadow-[0_2px_15px_rgba(37,99,235,0.4)]',
    'Product Listing Page': 'bg-[#059669] text-white border-[#34d399] shadow-[0_2px_15px_rgba(5,150,105,0.4)]',
    'Checkout': 'bg-[#7c3aed] text-white border-[#a78bfa] shadow-[0_2px_15px_rgba(124,58,237,0.4)]',
    'Landing Page': 'bg-[#db2777] text-white border-[#f472b6] shadow-[0_2px_15px_rgba(219,39,119,0.4)]',
    'Other': 'bg-[#4b5563] text-white border-[#9ca3af] shadow-[0_2px_15px_rgba(75,85,99,0.4)]'
};

// Also keep status colors for the small badge/status indicator
const STATUS_INDICATORS = {
    'Planning': 'border-gray-500 text-gray-400',
    'Running': 'border-neon-green text-neon-green',
    'Completed': 'border-white text-white',
    'Paused': 'border-neon-pink text-neon-pink'
};

const getCategoryColor = (category) => {
    return CATEGORY_COLORS[category] || CATEGORY_COLORS['Other'];
};

const getStatusIndicator = (status) => {
    const key = Object.keys(STATUS_INDICATORS).find(k => status && status.includes(k));
    return STATUS_INDICATORS[key] || 'border-gray-500 text-gray-400';
};

const GanttChart = ({ data }) => {
    const today = new Date();

    // Determine initial view date based on data
    const initialViewDate = useMemo(() => {
        // PER USER REQUEST: Show current month + 2 following months
        return startOfMonth(today);
    }, []);

    const [viewDate, setViewDate] = useState(initialViewDate);

    // Update viewDate if data changes (e.g. initial load)
    React.useEffect(() => {
        setViewDate(initialViewDate);
    }, [initialViewDate]);

    const monthsToShow = 4;

    const startDate = startOfMonth(viewDate);
    // Use exactly the number of months requested
    const endDate = endOfMonth(addDays(startDate, (monthsToShow - 1) * 30.5)); // Approximation for end of the range
    const months = eachMonthOfInterval({ start: startDate, end: endDate }).slice(0, monthsToShow);

    // Recalculate endDate based on actual months shown to be precise
    const actualEndDate = endOfMonth(months[months.length - 1]);
    const totalDays = differenceInDays(actualEndDate, startDate) + 1;

    // Group Data by Page Type
    const groupedData = useMemo(() => {
        const groups = {};
        // Initialize common groups to ensure correct order if desired, or let dynamic
        const preferredOrder = ['Homepage', 'Product Page', 'Product Listing Page', 'Checkout', 'Landing Page'];

        data.forEach(item => {
            let start = item.startDate;
            let end = item.endDate;

            // Relax date requirement: Fallback if one is missing
            if (!start && !end) return; // Still skip if absolutely no dates

            if (!start && end) {
                start = addDays(end, -14); // Assume 2 week duration ending at 'end'
            } else if (start && !end) {
                end = addDays(start, 14); // Assume 2 week duration starting at 'start'
            }

            // Only include if overlaps with view range
            if (end < startDate || start > actualEndDate) {
                return;
            }

            const type = item['Page Type'] || 'Other';
            if (!groups[type]) groups[type] = [];

            // Use derived dates for positioning but keep original for metadata if needed
            // Actually Timeline uses item.startDate/endDate for rendering below, 
            // so we should probably attach the derived ones to the item copy
            const itemWithDates = { ...item, startDate: start, endDate: end };
            groups[type].push(itemWithDates);
        });

        // Sort keys based on preferred order + others
        const sortedKeys = Object.keys(groups).sort((a, b) => {
            const idxA = preferredOrder.indexOf(a);
            const idxB = preferredOrder.indexOf(b);
            if (idxA !== -1 && idxB !== -1) return idxA - idxB;
            if (idxA !== -1) return -1;
            if (idxB !== -1) return 1;
            return a.localeCompare(b);
        });

        if (import.meta.env.DEV) {
            const upcoming = data.filter(d => d.startDate && d.startDate >= new Date('2026-02-01'));
            console.log(`[Timeline] Items starting after Feb 1st: ${upcoming.length}`, upcoming.map(u => u.title));
        }

        return sortedKeys.reduce((acc, key) => {
            acc[key] = groups[key].sort((a, b) => a.startDate - b.startDate);
            return acc;
        }, {});
    }, [data, startDate, actualEndDate]);

    const handleScroll = (direction) => {
        setViewDate(prev => addDays(prev, direction * 30));
    };

    return (
        <div className="flex flex-col h-full bg-card-bg/30 rounded-2xl border border-white/10 shadow-glass backdrop-blur-sm overflow-hidden">
            {/* Controls */}
            <div className="flex items-center justify-between p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center gap-4">
                    <button onClick={() => handleScroll(-1)} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-white font-mono text-sm font-bold">
                        {format(startDate, 'MMM yyyy')} - {format(actualEndDate, 'MMM yyyy')}
                    </span>
                    <button onClick={() => handleScroll(1)} className="p-2 hover:bg-white/10 rounded-lg text-white transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                    <GripHorizontal size={14} />
                    <span>Scroll or drag to navigate</span>
                </div>
            </div>

            {/* Chart Area */}
            <div className="flex-1 overflow-x-auto overflow-y-auto relative custom-scrollbar">
                <div className="min-w-[1200px]">
                    {/* Header: Months */}
                    <div className="flex bg-card-bg sticky top-0 z-30 border-b border-white/10 shadow-lg">
                        <div className="w-48 flex-shrink-0 p-4 font-bold text-gray-400 text-xs uppercase tracking-widest border-r border-white/10 bg-card-bg sticky left-0 z-40">
                            Page Type
                        </div>
                        <div className="flex-1 flex relative">
                            {months.map(month => {
                                const daysInMonth = differenceInDays(endOfMonth(month), startOfMonth(month)) + 1;
                                const widthPct = (daysInMonth / totalDays) * 100;
                                const isCurrentMonth = isSameMonth(month, today);

                                return (
                                    <div key={month.toString()} style={{ width: `${widthPct}%` }} className={`p-3 text-xs font-bold border-r border-white/5 text-center truncate relative ${isCurrentMonth ? 'bg-neon-blue/5 text-neon-blue' : 'text-gray-500'}`}>
                                        {format(month, 'MMM yyyy')}
                                        {isCurrentMonth && (
                                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neon-blue box-shadow-[0_0_10px_blue]"></div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Swimlanes */}
                    <div className="divide-y divide-white/5">
                        {Object.entries(groupedData).map(([pageType, items], groupIdx) => (
                            <div key={pageType} className={`flex group relative min-h-[140px] transition-colors ${groupIdx % 2 === 0 ? 'bg-white/[0.02]' : 'bg-transparent'}`}>
                                {/* Row Header */}
                                <div className="w-48 flex-shrink-0 p-4 border-r border-white/10 text-sm font-medium text-gray-200 sticky left-0 z-20 bg-card-bg/95 backdrop-blur flex flex-col justify-center shadow-[4px_0_15px_-5px_rgba(0,0,0,0.5)]">
                                    <span className="font-bold text-white mb-1 block truncate" title={pageType}>
                                        {pageType}
                                    </span>
                                    <span className="text-xs text-gray-500 font-mono">
                                        {items.length} experiments
                                    </span>
                                </div>

                                {/* Timeline Track */}
                                <div className="flex-1 relative py-4">
                                    {/* Monthly Grid Lines */}
                                    {months.map((month, idx) => {
                                        if (idx === 0) return null;
                                        const daysSinceStart = differenceInDays(month, startDate);
                                        const leftPct = (daysSinceStart / totalDays) * 100;
                                        return (
                                            <div
                                                key={`line-${idx}`}
                                                className="absolute top-0 bottom-0 border-l border-white/5 border-dashed pointer-events-none z-0"
                                                style={{ left: `${leftPct}%` }}
                                            />
                                        );
                                    })}

                                    {/* Current Date Line */}
                                    {today >= startDate && today <= actualEndDate && (
                                        <div
                                            className="absolute top-0 bottom-0 w-0.5 bg-neon-pink z-10 shadow-[0_0_10px_rgba(255,0,60,0.5)] pointer-events-none"
                                            style={{ left: `${(differenceInDays(today, startDate) / totalDays) * 100}%` }}
                                        >
                                            <div className="absolute -top-1 -ml-1 w-2.5 h-2.5 bg-neon-pink rounded-full"></div>
                                        </div>
                                    )}

                                    {/* Experiment Bars */}
                                    <div className="flex flex-col gap-2 relative z-10 px-2">
                                        {/* Simple improved layout algorithm: stack simply for now */}
                                        {items.map((item, i) => {
                                            // Calculate Position
                                            const startOffset = Math.max(0, differenceInDays(item.startDate, startDate));
                                            const duration = differenceInDays(item.endDate, item.startDate);
                                            const visibleDuration = Math.min(duration, totalDays - startOffset);

                                            const leftPct = (startOffset / totalDays) * 100;
                                            const widthPct = (visibleDuration / totalDays) * 100;

                                            if (widthPct <= 0) return null;

                                            // Handle markets display
                                            const cleanMarkets = item.allMarkets?.map(m => m.replace('Electrolux ', '').replace('AEG ', '')) || [];
                                            const marketDisplay = cleanMarkets.length > 0 ? cleanMarkets.join(', ') : 'Global';

                                            const BarComponent = item.url ? 'a' : 'div';
                                            const barProps = item.url ? {
                                                href: item.url,
                                                target: '_blank',
                                                rel: 'noopener noreferrer',
                                                onClick: (e) => e.stopPropagation()
                                            } : {};

                                            return (
                                                <BarComponent
                                                    key={item.id}
                                                    {...barProps}
                                                    className={`
                                                        relative min-h-[52px] h-auto rounded-md flex flex-col justify-center px-2.5 py-1.5
                                                        ${item.url ? 'cursor-pointer hover:underline decoration-white/50 underline-offset-2' : 'cursor-default'} 
                                                        hover:z-50 transition-all duration-300
                                                        group/bar hover:scale-[1.01] hover:shadow-xl
                                                        border border-white/10 border-l-4 ${getCategoryColor(item['Page Type'])}
                                                    `}
                                                    style={{
                                                        marginLeft: `${leftPct}%`,
                                                        width: `${widthPct}%`,
                                                        minWidth: '120px'
                                                    }}
                                                >
                                                    <div className="flex flex-col w-full gap-0.5 leading-tight overflow-hidden">
                                                        {/* Line 1: Code + Title matches reference exactly */}
                                                        <div className="flex items-start gap-1 w-full text-[10.5px]">
                                                            <span className="font-bold text-white shrink-0">
                                                                {item['Idea Code'] || item.id}
                                                            </span>
                                                            <span className="text-white/95 font-medium truncate">
                                                                - {item['Title'] || item.title}
                                                            </span>
                                                        </div>
                                                        {/* Line 2: Markets in small caps mono font */}
                                                        <div className="text-[10px] font-bold tracking-tight text-white/90 truncate">
                                                            {marketDisplay}
                                                        </div>
                                                    </div>

                                                    {/* Tooltip */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/bar:block w-64 bg-[#0a0a0a] border border-white/20 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] z-50 overflow-hidden animation-fade-in text-left">
                                                        <div className={`h-1 w-full ${getCategoryColor(item['Page Type']).split(' ')[0]}`}></div>
                                                        <div className="p-4">
                                                            <div className="flex justify-between items-start mb-2">
                                                                <span className="bg-white/10 px-1.5 py-0.5 rounded text-[10px] font-mono text-gray-300">{item['Idea Code']}</span>
                                                                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${getStatusIndicator(item.statusClean)}`}>{item.statusClean}</span>
                                                            </div>
                                                            <h4 className="font-bold text-white text-sm leading-tight mb-3">{item['Title']}</h4>

                                                            <div className="space-y-2 text-xs text-gray-400">
                                                                <div className="flex justify-between">
                                                                    <span>Markets:</span>
                                                                    <span className="text-white text-right max-w-[60%]">{item.allMarkets?.join(', ') || 'Global'}</span>
                                                                </div>
                                                                <div className="flex justify-between">
                                                                    <span>Duration:</span>
                                                                    <span className="text-white">
                                                                        {format(item.startDate, 'MMM d, yyyy')} - {format(item.endDate, 'MMM d, yyyy')}
                                                                    </span>
                                                                </div>
                                                                <div className="pt-2 border-t border-white/10 mt-2 flex justify-between items-center">
                                                                    <span>Workstream</span>
                                                                    <span className="text-neon-blue">{item.workstream}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </BarComponent>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {Object.keys(groupedData).length === 0 && (
                            <div className="p-20 text-center flex flex-col items-center gap-4">
                                <span className="text-3xl">👻</span>
                                <p className="text-gray-500 font-mono">No experiments found in this time range.</p>
                                <button onClick={() => setViewDate(today)} className="text-neon-blue hover:underline text-sm">
                                    Jump to Today
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const Timeline = () => {
    const { filteredData } = useData();

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col animate-in fade-in duration-700">
            <div className="mb-6 flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-neon-purple rounded-full shadow-[0_0_10px_rgba(188,19,254,0.5)]"></span>
                    <span className="tracking-tight">Experiment Timeline</span>
                </h2>
                <div className="text-xs text-gray-500 font-mono">
                    {filteredData.length} experiments active
                </div>
            </div>

            <div className="flex-1 min-h-0">
                <GanttChart data={filteredData} />
            </div>
        </div>
    );
};
