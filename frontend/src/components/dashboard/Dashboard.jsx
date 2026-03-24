import React from 'react';
import { FileSpreadsheet, BarChart3, Rows3 } from 'lucide-react';
import ChartCard from './ChartCard';
import FilterPanel from './FilterPanel';
import { GlowingEffect } from '../ui/glowing-effect';

/**
 * Dashboard — the main dashboard view after CSV upload.
 * Renders summary, meta badges, chart grid, and filters.
 */
export default function Dashboard({ payload, onApplyFilters, isFiltering }) {
    if (!payload) return null;

    const { summary, meta, charts, filters } = payload;

    return (
        <div className="space-y-6 pb-8">
            {/* Summary Card */}
            <div className="group relative rounded-xl border border-white/10 bg-white/[0.03] p-6 backdrop-blur-sm">
                <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                <div className="relative z-10">
                    <p className="text-white/80 leading-relaxed">{summary}</p>

                    {/* Meta Badges */}
                    <div className="flex flex-wrap gap-3 mt-4">
                        {meta?.filename && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
                                {meta.filename}
                            </span>
                        )}
                        {meta?.rowCount != null && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                                <Rows3 className="w-3.5 h-3.5 text-blue-400" />
                                {meta.rowCount.toLocaleString()} rows
                            </span>
                        )}
                        {meta?.columnCount != null && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/60">
                                <BarChart3 className="w-3.5 h-3.5 text-purple-400" />
                                {meta.columnCount} columns
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* Filter Panel */}
            <FilterPanel 
                filters={filters} 
                onApply={onApplyFilters} 
                isApplying={isFiltering} 
            />

            {/* Chart Grid */}
            {charts && charts.length > 0 && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    {charts.map((chart, i) => (
                        <ChartCard key={chart.id || i} chart={chart} />
                    ))}
                </div>
            )}
        </div>
    );
}
