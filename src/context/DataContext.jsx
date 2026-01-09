import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { fetchExperimentData } from '../services/dataService';

import { subDays, addDays } from 'date-fns';

const DataContext = createContext();

export const DataProvider = ({ children }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Global Filters
    const [filters, setFilters] = useState({
        dateRange: {
            start: subDays(new Date(), 305),
            end: addDays(new Date(), 60)
        },
        workstream: 'All',
        pageType: 'All',
        status: 'All',
        market: 'All',
    });

    useEffect(() => {
        const loadData = async () => {
            try {
                const result = await fetchExperimentData();
                setData(result);
            } catch (err) {
                console.error("Failed to load data:", err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // Derived Data (Unique values for dropdowns)
    const uniqueWorkstreams = useMemo(() => ['All', ...new Set(data.map(d => d.workstream).filter(Boolean))], [data]);
    const uniquePageTypes = useMemo(() => ['All', ...new Set(data.map(d => d['Page Type']).filter(Boolean))], [data]);
    const uniqueStatuses = useMemo(() => ['All', ...new Set(data.map(d => d.statusClean).filter(Boolean))], [data]);
    const uniqueMarkets = useMemo(() => {
        const markets = new Set();
        data.forEach(d => d.allMarkets.forEach(m => markets.add(m)));
        return ['All', ...Array.from(markets).sort()];
    }, [data]);

    // Filtered Data
    const filteredData = useMemo(() => {
        return data.filter(item => {
            // Workstream Filter
            if (filters.workstream !== 'All' && item.workstream !== filters.workstream) return false;

            // Page Type Filter
            if (filters.pageType !== 'All' && item['Page Type'] !== filters.pageType) return false;

            // Status Filter
            if (filters.status !== 'All' && item.statusClean !== filters.status) return false;

            // Market Filter
            if (filters.market !== 'All' && !item.allMarkets.includes(filters.market)) return false;

            // Date Range Filter (Checks if experiment overlaps with selected range)
            if (filters.dateRange.start && filters.dateRange.end) {
                // If an experiment is missing dates, we show it (don't filter it out)
                // This ensures Planning/Design items without schedules yet are visible
                if (!item.startDate || !item.endDate) return true;

                // Overlap logic: StartA <= EndB && EndA >= StartB
                const startA = item.startDate;
                const endA = item.endDate;
                const startB = filters.dateRange.start;
                const endB = filters.dateRange.end;

                return startA <= endB && endA >= startB;
            }

            return true;
        });
    }, [data, filters]);

    const updateFilter = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    return (
        <DataContext.Provider value={{
            data,
            filteredData,
            loading,
            error,
            filters,
            updateFilter,
            options: {
                workstreams: uniqueWorkstreams,
                pageTypes: uniquePageTypes,
                statuses: uniqueStatuses,
                markets: uniqueMarkets
            }
        }}>
            {children}
        </DataContext.Provider>
    );
};

export const useData = () => useContext(DataContext);
