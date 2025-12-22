import React, { useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';

export const Markets = () => {
    const { filteredData, options } = useData();

    // 1. Get List of Active Markets (from data or options)
    const markets = useMemo(() => {
        return options.markets.filter(m => m !== 'All').sort();
    }, [options.markets]);

    // 2. Pivot Data: Page Type -> Market -> Experiments
    const matrixData = useMemo(() => {
        const matrix = {};

        // Initialize structure
        options.pageTypes.forEach(pt => {
            if (pt === 'All') return;
            matrix[pt] = {};
            markets.forEach(m => {
                matrix[pt][m] = [];
            });
        });

        // Populate
        filteredData.forEach(item => {
            const pt = item['Page Type'];
            if (!pt || !matrix[pt]) return;

            item.allMarkets.forEach(m => {
                if (matrix[pt][m]) {
                    matrix[pt][m].push(item);
                }
            });
        });

        return matrix;
    }, [filteredData, options.pageTypes, markets]);

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span className="w-1 h-6 bg-neon-pink rounded-full"></span>
                    <span className="tracking-tight">Market Coverage Matrix</span>
                </h2>
                <div className="text-sm text-gray-400 font-mono">
                    Overview by Page Type & Market
                </div>
            </div>

            <div className="overflow-x-auto pb-4">
                <div className="inline-block min-w-full align-middle">
                    <div className="glass-panel border-0 rounded-2xl overflow-hidden shadow-glass">
                        <table className="min-w-full border-collapse">
                            <thead>
                                <tr>
                                    <th scope="col" className="sticky left-0 z-20 bg-card-bg/95 backdrop-blur px-6 py-4 text-left text-[10px] font-bold text-neon-pink uppercase tracking-widest border-r border-white/5 border-b border-white/10 w-48">
                                        Page Type
                                    </th>
                                    {markets.map(market => (
                                        <th key={market} scope="col" className="px-3 py-4 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest min-w-[80px] border-b border-white/10 border-r border-white/5 last:border-r-0 bg-card-header/30">
                                            {market.replace('Electrolux', 'ELX').replace('AEG', 'AEG')}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {Object.entries(matrixData).map(([pageType, marketMap]) => {
                                    return (
                                        <tr key={pageType} className="hover:bg-white/5 transition-colors group">
                                            <td className="sticky left-0 z-10 bg-card-bg/95 backdrop-blur px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-200 border-r border-white/10 group-hover:bg-[#1a1a1a]">
                                                {pageType}
                                            </td>
                                            {markets.map(market => {
                                                const experiments = marketMap[market] || [];
                                                const count = experiments.length;
                                                const hasActive = experiments.some(e => e.statusClean === 'Live' || e.statusClean === 'Development');

                                                return (
                                                    <td key={`${pageType}-${market}`} className="px-2 py-4 whitespace-nowrap border-r border-white/5 last:border-r-0 text-center relative group/cell">
                                                        {count > 0 ? (
                                                            <div className={`
                                                                inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-bold font-mono transition-all cursor-help
                                                                ${hasActive
                                                                    ? 'bg-neon-blue/20 text-neon-blue shadow-[0_0_10px_rgba(0,240,255,0.3)] border border-neon-blue/30 scale-110'
                                                                    : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'}
                                                            `}>
                                                                {count}

                                                                {/* Interactive Tooltip */}
                                                                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 w-64 bg-app-bg/95 backdrop-blur-md border border-neon-blue/20 text-white text-xs rounded-xl py-3 px-4 opacity-0 invisible group-hover/cell:opacity-100 group-hover/cell:visible transition-all duration-200 z-50 text-left shadow-2xl pointer-events-none">
                                                                    <div className="font-bold mb-2 border-b border-white/10 pb-2 text-neon-blue flex justify-between">
                                                                        <span>{market}</span>
                                                                        <span className="text-gray-400 font-normal">{pageType}</span>
                                                                    </div>
                                                                    <ul className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                                                                        {experiments.map(e => (
                                                                            <li key={e.id} className="flex justify-between gap-3 items-center">
                                                                                <span className="truncate text-gray-300">{e['Idea Code']}</span>
                                                                                <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-wider ${e.statusClean === 'Live' ? 'bg-neon-green/20 text-neon-green' :
                                                                                        e.statusClean === 'Development' ? 'bg-neon-blue/20 text-neon-blue' :
                                                                                            'bg-white/10 text-gray-500'
                                                                                    }`}>
                                                                                    {e.statusClean}
                                                                                </span>
                                                                            </li>
                                                                        ))}
                                                                    </ul>
                                                                    {/* Arrow */}
                                                                    <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-neon-blue/20"></div>
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <span className="text-white/5 text-xs">-</span>
                                                        )}
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};
