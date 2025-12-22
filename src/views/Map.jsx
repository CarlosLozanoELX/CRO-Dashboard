import React, { useMemo, useState } from 'react';
import { ComposableMap, Geographies, Geography, ZoomableGroup } from 'react-simple-maps';
import { scaleQuantize } from 'd3-scale';
import { Tooltip } from 'react-tooltip';
import { useData } from '../context/DataContext';
import { Card } from '../components/ui/Card';

// Public URL for World TopoJSON
const GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

// Mapping of market codes/names to ISO-3 or Country Names used in TopoJSON
// Adjust this mapping based on the actual values in the CSV
// Mapping of market codes/names to ISO-3 or Country Names used in TopoJSON
// The map uses: United Kingdom, Germany, France, Italy, Spain, Netherlands, Belgium, Sweden, Denmark, Norway, Finland, United States of America, Canada, Australia
const MARKET_MAPPING = {
    // Standard Codes
    'UK': 'United Kingdom',
    'DE': 'Germany',
    'FR': 'France',
    'IT': 'Italy',
    'ES': 'Spain',
    'NL': 'Netherlands',
    'BE': 'Belgium',
    'SE': 'Sweden',
    'DK': 'Denmark',
    'NO': 'Norway',
    'FI': 'Finland',
    'US': 'United States of America',
    'CA': 'Canada',
    'AU': 'Australia',

    // Explicit Full Names (if they appear without prefix)
    'United Kingdom': 'United Kingdom',
    'Germany': 'Germany',
    'France': 'France',
    'Italy': 'Italy',
    'Spain': 'Spain',
    'Netherlands': 'Netherlands',
    'Belgium': 'Belgium',
    'Sweden': 'Sweden',
    'Denmark': 'Denmark',
    'Norway': 'Norway',
    'Finland': 'Finland',
    'USA': 'United States of America',
    'Australia': 'Australia',
    'Canada': 'Canada',
    'Austria': 'Austria',
    'Switzerland': 'Switzerland',
    'Poland': 'Poland',
    'Portugal': 'Portugal',
    'Czech Republic': 'Czechia', // TopoJSON might use Czechia or Czech Republic
    'Czechia': 'Czechia',
    'Hungary': 'Hungary',
    'Romania': 'Romania',

    // Other common variations
    'Great Britain': 'United Kingdom',
    'GB': 'United Kingdom'
};

const normalizeMarket = (market) => {
    if (!market) return '';
    // Remove "AEG " and "Electrolux " prefixes
    // Also remove " (EN)" or similar suffixes if any
    let cleaned = market
        .replace(/^AEG\s+/i, '')
        .replace(/^Electrolux\s+/i, '')
        .trim();

    return cleaned;
};

const MapView = () => {
    const { data } = useData();
    const [tooltipContent, setTooltipContent] = useState("");

    // Aggregate experiments by country
    const countryStats = useMemo(() => {
        const stats = {};

        data.forEach(experiment => {
            experiment.allMarkets.forEach(market => {
                // 1. Try direct map (e.g. "UK")
                let mapped = MARKET_MAPPING[market];

                // 2. If not found, try normalizing (e.g. "AEG United Kingdom" -> "United Kingdom")
                if (!mapped) {
                    const cleaned = normalizeMarket(market);
                    // Check if the cleaned name is in mapping or is a valid country name itself
                    mapped = MARKET_MAPPING[cleaned] || cleaned; // Fallback to the cleaned name
                }

                // Final check for United States special case if normalized is "USA" or "US"
                if (mapped === 'USA' || mapped === 'US') mapped = 'United States of America';

                const countryName = mapped;

                // Handle special cases or pass through
                if (!stats[countryName]) {
                    stats[countryName] = {
                        count: 0,
                        experiments: [],
                        active: 0
                    };
                }

                stats[countryName].count += 1;
                // Keep track of top experiments or just counts
                if (experiment.statusClean === 'Live' || experiment.statusClean === 'Planning') {
                    stats[countryName].active += 1;
                }
            });
        });

        return stats;
    }, [data]);

    // Color scale for the map based on experiment count
    const colorScale = useMemo(() => {
        const counts = Object.values(countryStats).map(s => s.count);
        const max = Math.max(0, ...counts);

        return scaleQuantize()
            .domain([0, max || 1]) // Avoid 0 domain
            .range([
                "#1a1d2e", // Default/Low (Match app bg somewhat)
                "#00f0ff20",
                "#00f0ff40",
                "#00f0ff80",
                "#00f0ff"  // High (Neon Blue)
            ]);
    }, [countryStats]);

    return (
        <div className="space-y-6 animate-in fade-in duration-700">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight mb-2 text-glow">Experiment Distribution</h1>
                    <p className="text-gray-400">Global overview of experimentation coverage.</p>
                </div>
            </div>

            <Card className="min-h-[600px] relative overflow-hidden bg-app-card border-white/5">
                <div className="absolute inset-0 bg-dotted-pattern opacity-5 pointer-events-none"></div>

                <ComposableMap projection="geoMercator" projectionConfig={{ scale: 550, center: [10, 50] }}>
                    {/* Static view of Europe: ZoomableGroup removed or locked gives cleaner static behavior if we just use projectionConfig. 
                        However, keeping ZoomableGroup with disable props ensures consistent behavior if we want to re-enable later. 
                        For "No zoom in or zoom out needed", we'll just use the projectionConfig to frame it and NO ZoomableGroup to avoid scroll capture. 
                        Wait, Geographies needs to be child of ComposableMap. */}
                    <Geographies geography={GEO_URL}>
                        {({ geographies }) =>
                            geographies
                                // Filter to show only Europe + nearby (optional, but cleaner if we only want Europe highlighted)
                                // For now, let's keep all but the viewport will clip them.
                                // Actually, let's filter to ensure we don't draw unnecessary geometry if performance matters, 
                                // but for "Static view of Europe", cropping via viewport (projection) is standard.
                                .map((geo) => {
                                    const countryName = geo.properties.name;
                                    const stat = countryStats[countryName];

                                    // Optional: Hide non-European countries if desired? 
                                    // The user said "static view of Europe". Usually this means crop to Europe.

                                    return (
                                        <Geography
                                            key={geo.rsmKey}
                                            geography={geo}
                                            fill={stat ? colorScale(stat.count) : "#2a2e3f"} // Filled or Empty Grey
                                            stroke="#13151f"
                                            strokeWidth={0.5}
                                            style={{
                                                default: { outline: "none", transition: "all 0.3s ease" },
                                                hover: {
                                                    fill: "#ff003c", // Neon Pink on hover
                                                    outline: "none",
                                                    cursor: "pointer",
                                                    filter: "drop-shadow(0 0 5px rgba(255, 0, 60, 0.5))"
                                                },
                                                pressed: { outline: "none" }
                                            }}
                                            onMouseEnter={() => {
                                                const count = stat ? stat.count : 0;
                                                const active = stat ? stat.active : 0;
                                                setTooltipContent(`${countryName}: ${count} Total (${active} Active)`);
                                            }}
                                            onMouseLeave={() => {
                                                setTooltipContent("");
                                            }}
                                            data-tooltip-id="map-tooltip"
                                            data-tooltip-content={tooltipContent}
                                        />
                                    );
                                })
                        }
                    </Geographies>
                </ComposableMap>
                <Tooltip id="map-tooltip" style={{ backgroundColor: "#000", color: "#fff", border: "1px solid #00f0ff", borderRadius: "8px", zIndex: 50 }} />

                {/* Legend Overlay */}
                <div className="absolute bottom-6 left-6 bg-black/80 backdrop-blur-md p-4 rounded-xl border border-white/10">
                    <h3 className="text-white text-xs font-bold uppercase tracking-wider mb-2">Activity Level</h3>
                    <div className="flex items-center gap-2">
                        <div className="flex gap-1">
                            {["#1a1d2e", "#00f0ff20", "#00f0ff40", "#00f0ff80", "#00f0ff"].map((color, i) => (
                                <div key={i} className="w-6 h-6 rounded" style={{ backgroundColor: color }}></div>
                            ))}
                        </div>
                    </div>
                    <div className="flex justify-between text-[10px] text-gray-400 mt-1 font-mono">
                        <span>Low</span>
                        <span>High</span>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default MapView;
