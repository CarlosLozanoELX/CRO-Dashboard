import React, { useMemo } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    LineChart, Line, XAxis, YAxis, CartesianGrid, Legend, AreaChart, Area
} from 'recharts';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';
import { format } from 'date-fns';

const COLORS = ['#00F0FF', '#0AFF99', '#FCEE0A', '#FF003C', '#BC13FE', '#FFFFFF'];
const RESULT_COLORS = {
    'Winner': '#0AFF99',      // Neon Green
    'Loser': '#FF003C',       // Neon Pink
    'Inconclusive': '#A1A1AA', // Gray-400
    'Unknown': '#52525B'      // Gray-600
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-app-bg/90 border border-neon-blue/30 backdrop-blur-md p-3 rounded-lg shadow-glow-blue">
                <p className="text-white font-bold mb-1">{label}</p>
                {payload.map((entry, index) => (
                    <p key={index} style={{ color: entry.color }} className="text-sm">
                        {entry.name}: <span className="font-mono font-bold">{entry.value}</span>
                    </p>
                ))}
            </div>
        );
    }
    return null;
};

export const Overview = () => {
    const { filteredData, filters } = useData();

    // --- Data Alignment ---
    // Consolidate the "Start Date in Range" logic for the entire Overview page.
    // This ensures consistency between metric cards and charts.
    const inRangeData = useMemo(() => {
        return filteredData.filter(d => {
            if (!d.startDate) return false;
            return d.startDate >= filters.dateRange.start && d.startDate <= filters.dateRange.end;
        });
    }, [filteredData, filters.dateRange.start, filters.dateRange.end]);

    // --- Metrics Calculations ---
    const metrics = useMemo(() => {
        const resultsWithOutcomes = inRangeData.filter(d =>
            ['Winner', 'Loser', 'Inconclusive'].includes(d.resultNormalized)
        );

        const winners = resultsWithOutcomes.filter(d => d.resultNormalized === 'Winner');

        const winRate = resultsWithOutcomes.length > 0
            ? Math.round((winners.length / resultsWithOutcomes.length) * 100)
            : 0;

        const completedCount = resultsWithOutcomes.length;

        return {
            total: inRangeData.length,
            completed: completedCount,
            winners: winners.length,
            winRate
        };
    }, [inRangeData]);

    // --- Chart Data Preparation ---

    // 1. Journeys (Workstream) Distribution
    const workstreamData = useMemo(() => {
        const counts = {};
        inRangeData.forEach(d => {
            const key = d.workstream || 'Unassigned';
            counts[key] = (counts[key] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [inRangeData]);

    // 2. Page Type Distribution
    const pageTypeData = useMemo(() => {
        const counts = {};
        inRangeData.forEach(d => {
            const key = d['Page Type'];
            // Filter out Unknown and any values containing URLs
            if (key && key !== 'Unknown' && !key.includes('http')) {
                counts[key] = (counts[key] || 0) + 1;
            }
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [inRangeData]);

    // Helper for Pie Label
    const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }) => {
        if (percent < 0.05) return null; // Don't show label for small slices
        const RADIAN = Math.PI / 180;
        // Move label closer to the center of the slice logic or out if needed
        const radius = innerRadius + (outerRadius - innerRadius) * 0.6;
        const x = cx + radius * Math.cos(-midAngle * RADIAN);
        const y = cy + radius * Math.sin(-midAngle * RADIAN);

        return (
            <text
                x={x}
                y={y}
                fill="white"
                textAnchor="middle"
                dominantBaseline="central"
                className="text-xs font-bold font-mono drop-shadow-md"
            >
                {`${(percent * 100).toFixed(0)}%`}
            </text>
        );
    };

    // 3. Result Distribution
    const resultData = useMemo(() => {
        const counts = {
            'Winner': 0,
            'Loser': 0,
            'Inconclusive': 0
        };
        inRangeData.forEach(d => {
            const result = d.resultNormalized;
            if (result && counts.hasOwnProperty(result)) {
                counts[result]++;
            }
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .filter(item => item.value > 0)
            .sort((a, b) => b.value - a.value);
    }, [inRangeData]);

    // 4. Trend Data (Experiments over time)
    const trendData = useMemo(() => {
        const monthlyData = {};

        inRangeData.forEach(d => {
            if (d.startDate) {
                const monthYear = format(new Date(d.startDate), 'MMM yyyy');
                if (!monthlyData[monthYear]) {
                    monthlyData[monthYear] = { completed: 0, winners: 0 };
                }
                if (['Winner', 'Loser', 'Inconclusive'].includes(d.resultNormalized)) {
                    monthlyData[monthYear].completed += 1;
                    if (d.resultNormalized === 'Winner') {
                        monthlyData[monthYear].winners += 1;
                    }
                }
            }
        });

        // Sort by date
        const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
            const dateA = new Date(a);
            const dateB = new Date(b);
            return dateA.getTime() - dateB.getTime();
        });

        return sortedMonths.map(month => ({
            name: month,
            completed: monthlyData[month].completed,
            winners: monthlyData[month].winners
        }));
    }, [inRangeData]);

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card hover>
                    <div className="text-xs font-bold text-neon-blue uppercase tracking-widest mb-2">Total Experiments</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-mono font-bold text-white text-glow">{metrics.total}</span>
                    </div>
                </Card>
                <Card hover>
                    <div className="text-xs font-bold text-neon-blue uppercase tracking-widest mb-2">Completed</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-mono font-bold text-neon-blue text-glow">{metrics.completed}</span>
                    </div>
                </Card>
                <Card hover>
                    <div className="text-xs font-bold text-neon-green uppercase tracking-widest mb-2">Winners</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-mono font-bold text-neon-green text-glow">{metrics.winners}</span>
                    </div>
                </Card>
                <Card hover>
                    <div className="text-xs font-bold text-neon-purple uppercase tracking-widest mb-2">Win Rate</div>
                    <div className="flex items-baseline gap-2">
                        <span className="text-4xl font-mono font-bold text-neon-purple text-glow">{metrics.winRate}%</span>
                        <span className="text-xs text-gray-400 font-medium">of results</span>
                    </div>
                </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-1">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-neon-blue rounded-full"></span>
                        <span className="tracking-tight">Exp. by Workstream</span>
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={workstreamData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    label={renderCustomizedLabel}
                                    labelLine={false}
                                >
                                    {workstreamData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    height={70} // Increased height for legend
                                    iconType="circle"
                                    wrapperStyle={{ color: '#A1A1AA', fontSize: '11px', fontFamily: 'Inter', overflowY: 'auto' }} // Scrollable if needed
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="lg:col-span-1">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-neon-pink rounded-full"></span>
                        <span className="tracking-tight">Page Type Dist.</span>
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pageTypeData}
                                    cx="50%"
                                    cy="45%" // Moved up slightly to make room for legend
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={5}
                                    dataKey="value"
                                    stroke="none"
                                    label={renderCustomizedLabel}
                                    labelLine={false}
                                >
                                    {pageTypeData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    height={80} // Increased height for legend
                                    iconType="circle"
                                    wrapperStyle={{ color: '#A1A1AA', fontSize: '10px', fontFamily: 'Inter', overflowY: 'auto' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>

                <Card className="lg:col-span-1">
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <span className="w-1 h-6 bg-neon-green rounded-full"></span>
                        <span className="tracking-tight">Results Breakdown</span>
                    </h3>
                    <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={resultData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={0}
                                    outerRadius={90}
                                    dataKey="value"
                                    stroke="none"
                                    label={renderCustomizedLabel}
                                    labelLine={false}
                                >
                                    {resultData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={RESULT_COLORS[entry.name] || '#52525B'} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                    wrapperStyle={{ color: '#A1A1AA', fontSize: '12px', fontFamily: 'Inter' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </Card>
            </div>

            {/* Charts Row 2: Trends */}
            <Card>
                <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                    <span className="w-1 h-6 bg-neon-purple rounded-full"></span>
                    <span className="tracking-tight">Experiment Velocity & Success (Trend)</span>
                </h3>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#00F0FF" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#00F0FF" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorWinners" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#0AFF99" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#0AFF99" stopOpacity={0} />
                                </linearGradient>
                            </defs>
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
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '20px' }} />
                            <Area
                                type="monotone"
                                dataKey="completed"
                                name="Completed"
                                stroke="#00F0FF"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorCompleted)"
                            />
                            <Area
                                type="monotone"
                                dataKey="winners"
                                name="Winners"
                                stroke="#0AFF99"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorWinners)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </Card>
        </div>
    );
};
