import React, { useState } from 'react';
import { LayoutDashboard, CalendarDays, KanbanSquare, Globe, ArrowRight, List, Filter } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useAuth } from '../context/AuthContext';
import { Select } from './Select';

const NavItem = ({ icon, label, active, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 ${active
            ? 'bg-neon-blue/10 text-neon-blue border border-neon-blue/20 shadow-[0_0_15px_rgba(0,240,255,0.2)]'
            : 'text-text-secondary hover:text-white hover:bg-white/5'
            }`}
    >
        {icon}
        {label}
    </button>
);

export const Layout = ({ children, currentView, onViewChange }) => {
    const { filters, updateFilter, options } = useData();
    const { user, logout } = useAuth();

    return (
        <div className="min-h-screen bg-app-bg flex flex-col text-text-primary">
            {/* Top Navigation Bar */}
            <header className="glass-panel border-b border-white/5 sticky top-0 z-50">
                <div className="flex h-16 items-center justify-between px-6">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple shadow-glow-blue flex items-center justify-center">
                                <span className="text-white font-bold font-mono text-lg">E</span>
                            </div>
                            <span className="text-lg font-bold text-white tracking-widest uppercase font-mono">
                                CRO Overview
                            </span>
                        </div>
                        <div className="h-8 w-px bg-white/10 mx-2"></div>

                        <nav className="flex items-center gap-2">
                            <NavItem
                                icon={<LayoutDashboard size={18} />}
                                label="Overview"
                                active={currentView === 'overview'}
                                onClick={() => onViewChange('overview')}
                            />
                            <NavItem
                                icon={<CalendarDays size={18} />}
                                label="Timeline"
                                active={currentView === 'timeline'}
                                onClick={() => onViewChange('timeline')}
                            />
                            <NavItem
                                icon={<KanbanSquare size={18} />}
                                label="Planning"
                                active={currentView === 'planning'}
                                onClick={() => onViewChange('planning')}
                            />
                            <NavItem
                                icon={<List size={18} />}
                                label="Repository"
                                active={currentView === 'repository'}
                                onClick={() => onViewChange('repository')}
                            />
                            <NavItem
                                icon={<Globe size={18} />}
                                label="Map"
                                active={currentView === 'map'}
                                onClick={() => onViewChange('map')}
                            />
                        </nav>
                    </div>

                    <div className="flex items-center gap-6">
                        <div className="flex items-center gap-3 bg-card-bg/50 backdrop-blur-md rounded-lg p-2 border border-white/10 hover:border-neon-blue/30 transition-all group shadow-sm hover:shadow-glow-blue/5">
                            <div className="flex items-center gap-2 pl-1">
                                <span className="text-neon-blue/60 text-[10px] uppercase tracking-widest font-bold">from</span>
                                <input
                                    type="date"
                                    className="bg-transparent text-white text-xs outline-none font-mono cursor-pointer [&::-webkit-calendar-picker-indicator]:invert pr-1 border-b border-white/5 focus:border-neon-blue/40 transition-colors"
                                    value={filters.dateRange.start ? filters.dateRange.start.toISOString().split('T')[0] : ''}
                                    onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value ? new Date(e.target.value) : null })}
                                />
                            </div>
                            <div className="w-px h-6 bg-white/10"></div>
                            <div className="flex items-center gap-2">
                                <span className="text-neon-blue/60 text-[10px] uppercase tracking-widest font-bold">to</span>
                                <input
                                    type="date"
                                    className="bg-transparent text-white text-xs outline-none font-mono cursor-pointer [&::-webkit-calendar-picker-indicator]:invert pr-1 border-b border-white/5 focus:border-neon-blue/40 transition-colors"
                                    value={filters.dateRange.end ? filters.dateRange.end.toISOString().split('T')[0] : ''}
                                    onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value ? new Date(e.target.value) : null })}
                                />
                            </div>
                        </div>

                        {user && (
                            <div className="flex items-center gap-3 pl-4 border-l border-white/10">
                                <div className="text-right hidden md:block">
                                    <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                                    <button
                                        onClick={logout}
                                        className="text-[10px] text-gray-500 hover:text-neon-pink uppercase tracking-widest transition-colors font-bold mt-1"
                                    >
                                        Sign Out
                                    </button>
                                </div>
                                <img
                                    src={user.picture}
                                    alt={user.name}
                                    className="w-8 h-8 rounded-lg border border-white/10 shadow-sm"
                                    referrerPolicy="no-referrer"
                                />
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* Global Filter Bar */}
            <div className="bg-card-bg/30 border-b border-white/5 py-4 backdrop-blur-sm">
                <div className="max-w-[1920px] mx-auto px-6 flex flex-wrap items-center gap-4">
                    <div className="flex items-center gap-2 text-neon-blue/80 mr-4">
                        <Filter size={16} />
                        <span className="text-xs font-bold uppercase tracking-widest">Filters</span>
                    </div>

                    <Select
                        label="Workstream"
                        value={filters.workstream}
                        options={options.workstreams}
                        onChange={(val) => updateFilter('workstream', val)}
                    />

                    <Select
                        label="Page Type"
                        value={filters.pageType}
                        options={options.pageTypes}
                        onChange={(val) => updateFilter('pageType', val)}
                    />

                    <Select
                        label="Status"
                        value={filters.status}
                        options={options.statuses}
                        onChange={(val) => updateFilter('status', val)}
                    />

                    <Select
                        label="Market"
                        value={filters.market}
                        options={options.markets}
                        onChange={(val) => updateFilter('market', val)}
                    />
                </div>
            </div>

            {/* Main Content */}
            <main className="flex-1 max-w-[1920px] w-full mx-auto px-6 py-8">
                {children}
            </main>
        </div>
    );
};
