import React from 'react';
import PieChart from './PieChart';

/**
 * Data Quality Pie Chart showing the comparison between total rows and rows with null values
 * 
 * @param {Object} props Component props
 * @param {number} props.totalRows Total number of rows in the dataset
 * @param {number} props.rowsWithNulls Number of rows containing null values
 */
const DataQualityPieChart = ({ totalRows = 0, rowsWithNulls = 0 }) => {
    // Safety check for invalid inputs
    const safeTotal = Math.max(0, totalRows || 0);
    const safeNulls = Math.max(0, Math.min(rowsWithNulls || 0, safeTotal));

    // Calculate rows without nulls
    const rowsWithoutNulls = safeTotal - safeNulls;

    // Format data for Recharts - only include non-zero values
    const data = [];

    if (rowsWithoutNulls > 0) {
        data.push({ name: 'Complete Rows', value: rowsWithoutNulls });
    }

    if (safeNulls > 0) {
        data.push({ name: 'Rows with Missing Values', value: safeNulls });
    }

    // If there's no meaningful data, show placeholder
    if (data.length === 0 || safeTotal === 0) {
        return (
            <div className="data-quality-chart text-center p-8">
                <p className="text-gray-500">No data available for visualization</p>
            </div>
        );
    }

    // Colors for the pie chart
    const colors = ['#4CC9F0', '#F72585'];

    // Calculate percentage of rows with nulls
    const percentage = safeNulls > 0 ? Math.round((safeNulls / safeTotal) * 100) : 0;

    return (
        <div className="data-quality-chart">
            <div className="text-center mb-4">
                <p className="text-sm text-gray-600">
                    Total Rows: {safeTotal.toLocaleString()} |
                    Rows with Missing Values: {safeNulls.toLocaleString()} (
                    {percentage}%)
                </p>
            </div>
            <PieChart
                data={data}
                colors={colors}
                title="Data Quality Overview"
                showLegend={true}
            />
        </div>
    );
};

export default DataQualityPieChart;
