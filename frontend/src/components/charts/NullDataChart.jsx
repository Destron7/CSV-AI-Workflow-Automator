import React from 'react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    LabelList
} from 'recharts';

/**
 * NullDataChart component to visualize null values by column
 * 
 * @param {Object} props Component props
 * @param {Object} props.nullCountsByColumn Object with column names as keys and null counts as values
 * @param {number} props.totalRows Total number of rows in the dataset for percentage calculation
 */
const NullDataChart = ({ nullCountsByColumn, totalRows }) => {
    // Return early if no data
    if (!nullCountsByColumn || Object.keys(nullCountsByColumn).length === 0) {
        return (
            <div className="text-center text-gray-500 p-4">
                No null data information available
            </div>
        );
    }

    // Transform the data for the chart
    const data = Object.entries(nullCountsByColumn)
        .map(([column, count]) => ({
            name: column,
            nullCount: count,
            percentage: ((count / totalRows) * 100).toFixed(1)
        }))
        // Sort by null count in descending order
        .sort((a, b) => b.nullCount - a.nullCount);

    // Custom tooltip for the chart
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="bg-white p-4 border border-gray-200 shadow-md rounded-md">
                    <p className="font-bold text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600">
                        Null Count: <span className="font-medium">{item.nullCount.toLocaleString()}</span>
                    </p>
                    <p className="text-sm text-gray-600">
                        Percentage: <span className="font-medium">{item.percentage}%</span> of total rows
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="null-data-chart">
            <ResponsiveContainer width="100%" height={Math.max(300, 70 + data.length * 40)}>
                <BarChart
                    data={data}
                    layout="vertical"
                    margin={{ top: 20, right: 80, left: 30, bottom: 10 }}
                >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis
                        type="number"
                        tickFormatter={(value) => value.toLocaleString()}
                    />
                    <YAxis
                        dataKey="name"
                        type="category"
                        width={120}
                        tick={{ fontSize: 12 }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                        dataKey="nullCount"
                        name="Null Values"
                        fill="#F72585"
                        radius={[0, 4, 4, 0]}
                    >
                        <LabelList
                            dataKey="percentage"
                            position="right"
                            formatter={(value) => `${value}%`}
                            style={{ fontSize: '11px', fill: '#666' }}
                        />
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default NullDataChart;
