import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

/**
 * Type Conversion Chart showing the success rate of column type conversions
 * 
 * @param {Object} props Component props
 * @param {Object} props.conversionDetails Details about the column type conversions
 */
const TypeConversionChart = ({ conversionDetails }) => {
    // Return early if no data
    if (!conversionDetails || Object.keys(conversionDetails).length === 0) {
        return (
            <div className="text-center text-gray-500 p-4">
                No type conversion data available
            </div>
        );
    }

    // Transform the data for the chart
    const data = Object.entries(conversionDetails).map(([column, details]) => ({
        name: column,
        successRate: Math.round(details.success_rate * 100),
        originalType: details.original_type,
        newType: details.new_type,
        validValues: details.valid_numeric_values,
        totalValues: details.values_before_conversion
    }));

    // Custom tooltip content
    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const item = payload[0].payload;
            return (
                <div className="bg-white p-4 border border-gray-200 shadow-md rounded-md">
                    <p className="font-bold text-gray-800">{item.name}</p>
                    <p className="text-sm text-gray-600">Original Type: <span className="font-medium">{item.originalType}</span></p>
                    <p className="text-sm text-gray-600">New Type: <span className="font-medium text-blue-600">{item.newType}</span></p>
                    <p className="text-sm text-gray-600">Success Rate: <span className="font-medium">{item.successRate}%</span></p>
                    <p className="text-sm text-gray-600">Values Converted: <span className="font-medium">{item.validValues.toLocaleString()} of {item.totalValues.toLocaleString()}</span></p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="type-conversion-chart">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart
                    data={data}
                    margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                        dataKey="name"
                        angle={-45}
                        textAnchor="end"
                        height={60}
                        tick={{ fontSize: 12 }}
                    />
                    <YAxis
                        domain={[0, 100]}
                        label={{
                            value: 'Success Rate (%)',
                            angle: -90,
                            position: 'insideLeft',
                            style: { textAnchor: 'middle' }
                        }}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar
                        dataKey="successRate"
                        name="Success Rate (%)"
                        fill="#4CC9F0"
                        radius={[4, 4, 0, 0]}
                    />
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
};

export default TypeConversionChart;
