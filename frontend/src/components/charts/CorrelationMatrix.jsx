import React from 'react';

export const CorrelationMatrix = ({ data }) => {
    if (!data || !data.columns || !data.data) {
        return (
            <div className="p-4 bg-gray-50 rounded-lg text-center text-gray-500">
                Not enough numeric data to calculate correlation.
            </div>
        );
    }

    const { columns, data: matrixData } = data;
    const size = columns.length;

    // Helper to get color based on correlation value
    const getColor = (value) => {
        if (value === null) return 'bg-gray-100';
        // Normalize -1 to 1 range to 0 to 1 for opacity/color mixing
        // Simple approach: 
        // -1 (Negative) -> Red
        // 0 (Neutral) -> Grey/White
        // 1 (Positive) -> Blue

        if (value > 0) {
            // Blue intensity
            const intensity = Math.min(Math.abs(value), 1);
            return `rgba(59, 130, 246, ${intensity})`; // blue-500
        } else {
            // Red intensity
            const intensity = Math.min(Math.abs(value), 1);
            return `rgba(239, 68, 68, ${intensity})`; // red-500
        }
    };

    const getTextColor = (value) => {
        if (value === null) return 'text-gray-400';
        return Math.abs(value) > 0.5 ? 'text-white' : 'text-gray-800';
    };

    return (
        <div className="overflow-x-auto">
            <div className="inline-block min-w-full align-middle">
                <div className="border rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 w-32 truncate">
                                    Feature
                                </th>
                                {columns.map((col, idx) => (
                                    <th key={idx} className="px-2 py-2 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-20 truncate max-w-[5rem]" title={col}>
                                        {col}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {columns.map((rowCol, rowIdx) => (
                                <tr key={rowIdx}>
                                    <td className="px-3 py-2 text-left text-xs font-medium text-gray-900 sticky left-0 bg-white z-10 whitespace-nowrap overflow-hidden text-ellipsis max-w-[8rem]" title={rowCol}>
                                        {rowCol}
                                    </td>
                                    {columns.map((colCol, colIdx) => {
                                        const cell = matrixData.find(d => d.x === rowCol && d.y === colCol);
                                        const value = cell ? cell.value : null;

                                        return (
                                            <td
                                                key={colIdx}
                                                className="px-2 py-2 text-center text-xs font-medium border border-gray-100"
                                                style={{ backgroundColor: getColor(value) }}
                                            >
                                                <span className={getTextColor(value)}>
                                                    {value !== null ? value.toFixed(2) : '-'}
                                                </span>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-gray-600">
                <div className="flex items-center">
                    <div className="w-4 h-4 mr-1 bg-red-500 rounded"></div>
                    Negative Correlation (-1.0)
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 mr-1 bg-gray-100 border border-gray-300 rounded"></div>
                    No Correlation (0.0)
                </div>
                <div className="flex items-center">
                    <div className="w-4 h-4 mr-1 bg-blue-500 rounded"></div>
                    Positive Correlation (1.0)
                </div>
            </div>
        </div>
    );
};
