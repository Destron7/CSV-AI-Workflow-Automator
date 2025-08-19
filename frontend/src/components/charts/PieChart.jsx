import React from 'react';
import { PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, Sector } from 'recharts';

/**
 * A reusable Pie Chart component for data visualization using Recharts
 * 
 * @param {Object} props Component props
 * @param {Array} props.data Array of objects with name and value properties
 * @param {Array} props.colors Array of colors for each data segment
 * @param {string} props.title Chart title
 * @param {boolean} props.showLegend Whether to show the legend
 */
const PieChart = ({
    data = [],
    colors = ['#4361EE', '#F72585', '#4CC9F0', '#7209B7', '#B5179E'],
    title = '',
    showLegend = true,
}) => {
    const [activeIndex, setActiveIndex] = React.useState(0);

    // Handle empty data
    if (!data || data.length === 0) {
        return (
            <div className="flex items-center justify-center h-[400px] bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-gray-500">No data available for visualization</p>
            </div>
        );
    }

    // Calculate total value for percentages
    const total = data.reduce((sum, entry) => sum + entry.value, 0);

    // Format the tooltip to show percentages
    const renderCustomTooltip = (props) => {
        const { payload } = props;
        if (payload && payload.length > 0) {
            const entry = payload[0];
            const percentage = ((entry.value / total) * 100).toFixed(1);
            return (
                <div className="custom-tooltip" style={{
                    backgroundColor: '#fff',
                    padding: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '5px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
                }}>
                    <p style={{ margin: 0, color: entry.color }}><strong>{entry.name}</strong></p>
                    <p style={{ margin: 0 }}>{entry.value.toLocaleString()} ({percentage}%)</p>
                </div>
            );
        }
        return null;
    };

    // Active shape for hover effect
    const renderActiveShape = (props) => {
        const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

        return (
            <g>
                <Sector
                    cx={cx}
                    cy={cy}
                    innerRadius={innerRadius}
                    outerRadius={outerRadius + 10}
                    startAngle={startAngle}
                    endAngle={endAngle}
                    fill={fill}
                />
            </g>
        );
    };

    return (
        <div className="pie-chart-container">
            {title && (
                <h5 className="text-center text-lg font-semibold mb-4">{title}</h5>
            )}
            <ResponsiveContainer width="100%" height={400}>
                <RechartsPieChart>
                    <Pie
                        data={data}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        outerRadius={150}
                        activeIndex={activeIndex}
                        activeShape={renderActiveShape}
                        onMouseEnter={(_, index) => setActiveIndex(index)}
                    >
                        {data.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={colors[index % colors.length]}
                            />
                        ))}
                    </Pie>
                    <Tooltip content={renderCustomTooltip} />
                    {showLegend && <Legend layout="vertical" verticalAlign="middle" align="right" />}
                </RechartsPieChart>
            </ResponsiveContainer>
        </div>
    );
};

export default PieChart;
