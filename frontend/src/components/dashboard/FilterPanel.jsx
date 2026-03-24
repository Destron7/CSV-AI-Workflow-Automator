import React, { useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { GlowingEffect } from '../ui/glowing-effect';

/**
 * FilterPanel — renders interactive filter controls from payload.filters.
 * Supports: multiselect, slider, daterange, toggle.
 */
export default function FilterPanel({ filters, onApply, isApplying }) {
    const [filterState, setFilterState] = useState({});

    if (!filters || filters.length === 0) return null;

    const handleChange = (column, value) => {
        setFilterState(prev => ({ ...prev, [column]: value }));
    };

    const handleApply = () => {
        if (onApply) {
            onApply(filterState);
        }
    };

    return (
        <div className="group relative rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
            <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
            <div className="relative z-10">
                <div className="flex items-center gap-2 mb-4">
                    <SlidersHorizontal className="w-4 h-4 text-white/50" />
                    <h3 className="text-white font-medium text-sm uppercase tracking-wide">Filters</h3>
                </div>

                <div className="space-y-5">
                    {filters.map((filter, i) => (
                        <div key={i}>
                            <label className="block text-white/60 text-xs font-medium mb-2 uppercase tracking-wider">
                                {filter.label}
                            </label>

                            {filter.filterType === 'multiselect' && filter.options && (
                                <div className="flex flex-wrap gap-2">
                                    {filter.options.slice(0, 20).map((opt, j) => {
                                        const selected = (filterState[filter.column] || []).includes(opt);
                                        return (
                                            <button
                                                key={j}
                                                onClick={() => {
                                                    const current = filterState[filter.column] || [];
                                                    const next = selected
                                                        ? current.filter(v => v !== opt)
                                                        : [...current, opt];
                                                    handleChange(filter.column, next);
                                                }}
                                                className={`
                                                    px-3 py-1.5 rounded-full text-xs font-medium
                                                    transition-all duration-200
                                                    ${selected
                                                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                                        : 'bg-white/5 text-white/50 border border-white/10 hover:bg-white/10'
                                                    }
                                                `}
                                            >
                                                {String(opt)}
                                            </button>
                                        );
                                    })}
                                </div>
                            )}

                            {filter.filterType === 'slider' && (
                                <div className="space-y-2">
                                    <input
                                        type="range"
                                        min={filter.min || 0}
                                        max={filter.max || 100}
                                        step={filter.step || 1}
                                        value={filterState[filter.column] ?? filter.min ?? 0}
                                        onChange={(e) => handleChange(filter.column, parseFloat(e.target.value))}
                                        className="w-full accent-emerald-500"
                                    />
                                    <div className="flex justify-between text-xs text-white/40">
                                        <span>{filter.min}</span>
                                        <span className="text-emerald-400 font-medium">
                                            {filterState[filter.column] ?? filter.min ?? 0}
                                        </span>
                                        <span>{filter.max}</span>
                                    </div>
                                </div>
                            )}

                            {filter.filterType === 'daterange' && (
                                <div className="flex gap-3">
                                    <input
                                        type="date"
                                        defaultValue={filter.minDate}
                                        onChange={(e) => handleChange(filter.column, {
                                            ...filterState[filter.column],
                                            from: e.target.value,
                                        })}
                                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-white/30"
                                    />
                                    <input
                                        type="date"
                                        defaultValue={filter.maxDate}
                                        onChange={(e) => handleChange(filter.column, {
                                            ...filterState[filter.column],
                                            to: e.target.value,
                                        })}
                                        className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:outline-none focus:border-white/30"
                                    />
                                </div>
                            )}

                            {filter.filterType === 'toggle' && (
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={filterState[filter.column] || false}
                                        onChange={(e) => handleChange(filter.column, e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-white/10 rounded-full peer peer-checked:bg-emerald-500/50 peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all" />
                                </label>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        onClick={handleApply}
                        disabled={isApplying}
                        className="px-5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isApplying ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                Applying...
                            </>
                        ) : (
                            'Apply Filters'
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
