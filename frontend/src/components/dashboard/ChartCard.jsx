import React from 'react';
import {
    BarChart, Bar,
    LineChart, Line,
    PieChart, Pie, Cell,
    ScatterChart, Scatter,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend,
    ResponsiveContainer,
    ComposedChart,
} from 'recharts';
import { GlowingEffect } from '../ui/glowing-effect';

// Color palette for charts
const COLORS = [
    '#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#f97316', '#14b8a6', '#a855f7',
];

/**
 * ChartCard — renders one chart card using Recharts.
 * Supports: bar, line, pie, scatter, histogram, heatmap, boxplot.
 */
export default function ChartCard({ chart }) {
    const { type, title, data } = chart;

    if (!data || data.length === 0) {
        return (
            <div className="group relative rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
                <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
                <div className="relative z-10">
                    <h3 className="text-white font-medium mb-3">{title}</h3>
                    <p className="text-white/40 text-sm">No data available</p>
                </div>
            </div>
        );
    }

    const chartWidth = data.length > 15 ? `${data.length * 40}px` : '100%';

    const renderChart = () => {
        switch (type) {
            case 'bar':
                return (
                    <div className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
                        <div style={{ width: chartWidth, height: 300, minWidth: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} margin={{ top: 5, right: 20, bottom: 40, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis
                                        dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                                        angle={-35} textAnchor="end" interval={0} height={60}
                                    />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                                    />
                                    <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );

            case 'line':
                return (
                    <div className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
                        <div style={{ width: chartWidth, height: 300, minWidth: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={data} margin={{ top: 5, right: 20, bottom: 40, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis
                                        dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                                        angle={-35} textAnchor="end" interval={0} height={60}
                                    />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                                    />
                                    <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );

            case 'pie':
                return (
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={data}
                                dataKey="value"
                                nameKey="label"
                                cx="50%" cy="50%"
                                outerRadius={100}
                                label={({ label, percent }) => `${label} (${(percent * 100).toFixed(0)}%)`}
                                labelLine={{ stroke: 'rgba(255,255,255,0.3)' }}
                            >
                                {data.map((_, i) => (
                                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                );

            case 'scatter':
                return (
                    <div className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
                        <div style={{ width: chartWidth, height: 300, minWidth: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ScatterChart margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis dataKey="label" type="category" allowDuplicatedCategory={false} tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} name="x" />
                                    <YAxis dataKey="value" type="number" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} name="y" />
                                    <Tooltip
                                        contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                                    />
                                    <Scatter data={data} fill="#8b5cf6" />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );

            case 'histogram':
                return (
                    <div className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
                        <div style={{ width: chartWidth, height: 300, minWidth: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data} barCategoryGap={0} margin={{ top: 5, right: 20, bottom: 40, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis
                                        dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                                        angle={-35} textAnchor="end" interval={0} height={60}
                                    />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                                    />
                                    <Bar dataKey="value" fill="#f59e0b" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );

            case 'heatmap':
                return (
                    <div className="overflow-auto max-h-[300px]">
                        <table className="w-full text-sm">
                            <thead>
                                <tr>
                                    <th className="px-3 py-2 text-left text-white/60 font-medium">Label</th>
                                    <th className="px-3 py-2 text-right text-white/60 font-medium">Value</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.map((row, i) => {
                                    const maxVal = Math.max(...data.map(d => Math.abs(Number(d.value) || 0)));
                                    const intensity = maxVal > 0 ? Math.abs(Number(row.value) || 0) / maxVal : 0;
                                    return (
                                        <tr key={i} style={{ backgroundColor: `rgba(16, 185, 129, ${intensity * 0.3})` }}>
                                            <td className="px-3 py-2 text-white/80">{String(row.label)}</td>
                                            <td className="px-3 py-2 text-right text-white/80">{row.value}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                );

            case 'boxplot':
                // Approximation using ComposedChart with bar for range
                return (
                    <div className="w-full overflow-x-auto overflow-y-hidden custom-scrollbar pb-2">
                        <div style={{ width: chartWidth, height: 300, minWidth: '100%' }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <ComposedChart data={data} margin={{ top: 5, right: 20, bottom: 40, left: 10 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                                    <XAxis
                                        dataKey="label" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }}
                                        angle={-35} textAnchor="end" interval={0} height={60}
                                    />
                                    <YAxis tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                                    <Tooltip
                                        contentStyle={{ background: '#1a1a2e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#fff' }}
                                    />
                                    <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
                                </ComposedChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                );

            default:
                return <p className="text-white/40 text-sm">Unsupported chart type: {type}</p>;
        }
    };

    return (
        <div className="group relative rounded-xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-sm">
            <GlowingEffect spread={40} glow={true} disabled={false} proximity={64} inactiveZone={0.01} borderWidth={3} />
            <div className="relative z-10 flex flex-col h-full">
                <h3 className="text-white font-medium mb-4 text-sm uppercase tracking-wide">
                    {title}
                </h3>
                {renderChart()}
            </div>
        </div>
    );
}
