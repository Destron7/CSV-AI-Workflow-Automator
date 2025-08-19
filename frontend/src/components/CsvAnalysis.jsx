import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function CsvAnalysis() {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    // State to store the metadata and preview data from the backend
    const [csvMetadata, setCsvMetadata] = useState(null);
    // State for error/success messages
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false); // To determine message color
    const [isLoading, setIsLoading] = useState(false);

    // Function to handle file selection
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        setMessage(''); // Clear previous messages
        setIsError(false);
        setCsvMetadata(null); // Clear previous metadata/preview

        if (file) {
            if (file.type === 'text/csv') {
                // Message indicating file is selected, prompting user to click "Get File Info"
                setMessage(`File selected: ${file.name}. Click 'Get File Info' to process.`);
                setIsError(false);
            } else {
                setSelectedFile(null);
                setMessage('Error: Please select a valid CSV file (.csv extension).');
                setIsError(true);
                // Reset file input element if invalid file
                const fileInput = document.getElementById('csvFile');
                if (fileInput) fileInput.value = '';
            }
        } else {
            setMessage(''); // Clear message if no file is selected
        }
    };

    // Function to handle form submission (now just for getting file info)
    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');
        setIsError(false);
        setCsvMetadata(null);
        setIsLoading(true);

        if (!selectedFile) {
            // This message will now only appear when the button is clicked without a file
            setMessage('Error: Please select a CSV file to get its information.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        // Ensure it's a CSV file before sending
        if (selectedFile.type !== 'text/csv') {
            setMessage('Error: Only CSV files are allowed.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // Using axios to send request to FastAPI backend at /analyse-csv/
            const response = await axios.post('http://localhost:8000/analyse-csv/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = response.data;

            // Use the comprehensive data structure from our enhanced backend
            const transformedData = {
                filename: data.filename,
                file_size: data.file_size,
                file_size_mb: data.file_size_mb,
                num_rows: data.num_rows,
                num_columns: data.num_columns,
                columns: data.columns,
                preview_data: data.preview_data, // Enhanced preview data
                basic_preview: data.data, // Basic preview (for backward compatibility)
                columns_info: data.columns_info, // Detailed column information
                data_quality: data.data_quality,
                column_types: data.column_types,
                insights: data.insights
            };

            setCsvMetadata(transformedData);
            setMessage('CSV file information retrieved successfully!');
            setIsError(false);
            console.log('CSV Info response:', data);
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message || 'An unknown error occurred.';
            setMessage('Error: ' + errorMessage);
            setIsError(true);
            setCsvMetadata(null);
            console.error('CSV Info error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to reset all states
    const handleReset = () => {
        setSelectedFile(null);
        setCsvMetadata(null);
        setMessage('');
        setIsError(false);
        setIsLoading(false);
        const fileInput = document.getElementById('csvFile');
        if (fileInput) fileInput.value = '';
    };

    // Function to navigate to CSV Cleaning page
    const handleGoToCleaning = () => {
        if (selectedFile) {
            // Store the file in sessionStorage to pass it to the CsvCleaning component
            sessionStorage.setItem('csvFileName', selectedFile.name);
            // Navigate to the cleaning page
            navigate('/csv-cleaning');
        } else {
            setMessage('Error: Please select a CSV file first.');
            setIsError(true);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-900 mb-6 sm:mb-8">
                    CSV File Analyzer
                </h1>
                <p className="text-base sm:text-lg text-center text-gray-600 mb-8 sm:mb-10">
                    Upload your CSV file to view its structure and basic statistics.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                    {/* CSV File Upload Section */}
                    <div className="p-5 sm:p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Upload Your CSV File</h2>
                        <label htmlFor="csvFile" className="block text-base sm:text-lg font-medium text-gray-700 mb-2">
                            Select a CSV File:
                        </label>
                        <input
                            type="file"
                            id="csvFile"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="block w-full text-sm text-gray-500
                                       file:mr-4 file:py-2 file:px-4
                                       file:rounded-full file:border-0
                                       file:text-sm file:font-semibold
                                       file:bg-blue-100 file:text-blue-700
                                       hover:file:bg-blue-200 cursor-pointer transition duration-200"
                        />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <button
                            type="submit"
                            disabled={isLoading || isError} // Disabled if loading or current message is an error
                            className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-md text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:scale-105
                                       disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-6 w-6 mr-3 border-4 border-t-4 border-gray-200 rounded-full" viewBox="0 0 24 24"></svg>
                            ) : (
                                "Get File Info"
                            )}
                        </button>
                        <button
                            type="button"
                            onClick={handleReset}
                            className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-gray-300 rounded-lg shadow-md text-lg font-semibold text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            Reset
                        </button>
                        <button
                            type="button"
                            onClick={() => navigate('/csv-cleaning')}
                            disabled={!csvMetadata} // Only enabled when CSV data is loaded
                            className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-md text-lg font-semibold text-white bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300 ease-in-out transform hover:scale-105
                                       disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                        >
                            Clean CSV
                        </button>
                    </div>
                </form>

                {/* Message / Error Display */}
                {message && (
                    <div className={`mt-8 p-4 rounded-lg relative shadow-md ${isError ? 'bg-red-100 border border-red-400 text-red-700' : 'bg-green-100 border border-green-400 text-green-700'}`} role="alert">
                        <strong className="font-bold">{isError ? 'Error!' : 'Success!'}</strong>
                        <span className="block sm:inline ml-2">{message}</span>
                    </div>
                )}

                {/* CSV Metadata and Data Preview Display */}
                {csvMetadata && (
                    <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow-inner animate-fade-in">
                        <h3 className="text-2xl font-bold mb-6 text-gray-900">CSV File Analysis Results:</h3>

                        {/* File Information Section */}
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="text-xl font-semibold text-blue-800 mb-3">📊 File Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-gray-700">
                                <p><span className="font-semibold">Filename:</span> {csvMetadata.filename}</p>
                                <p><span className="font-semibold">File Size:</span> {csvMetadata.file_size_mb} MB</p>
                                <p><span className="font-semibold">Total Rows:</span> {csvMetadata.num_rows.toLocaleString()}</p>
                                <p><span className="font-semibold">Total Columns:</span> {csvMetadata.num_columns}</p>
                                <p className="col-span-full"><span className="font-semibold">Columns:</span> {csvMetadata.columns?.join(', ')}</p>
                            </div>
                        </div>

                        {/* Data Quality Section */}
                        {csvMetadata.data_quality && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <h4 className="text-xl font-semibold text-green-800 mb-3">✅ Data Quality</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700">
                                    <p><span className="font-semibold">Missing Values:</span> {csvMetadata.data_quality.total_missing_values.toLocaleString()}</p>
                                    <p><span className="font-semibold">Missing Percentage:</span> {csvMetadata.data_quality.missing_percentage}%</p>
                                    <p><span className="font-semibold">Has Missing Data:</span>
                                        <span className={`ml-2 px-2 py-1 rounded text-sm ${csvMetadata.data_quality.has_missing_data ? 'bg-yellow-200 text-yellow-800' : 'bg-green-200 text-green-800'}`}>
                                            {csvMetadata.data_quality.has_missing_data ? 'Yes' : 'No'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Column Types Section */}
                        {csvMetadata.column_types && (
                            <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <h4 className="text-xl font-semibold text-purple-800 mb-3">🏷️ Column Types</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-gray-700">
                                    <p><span className="font-semibold">Numeric Columns:</span> {csvMetadata.column_types.numeric}</p>
                                    <p><span className="font-semibold">Text Columns:</span> {csvMetadata.column_types.text}</p>
                                    <p><span className="font-semibold">Other Types:</span> {csvMetadata.column_types.other}</p>
                                </div>
                            </div>
                        )}

                        {/* Insights Section */}
                        {csvMetadata.insights && (
                            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                                <h4 className="text-xl font-semibold text-yellow-800 mb-3">💡 Analysis Insights</h4>
                                <div className="mb-3">
                                    <p><span className="font-semibold">Ready for Analysis:</span>
                                        <span className={`ml-2 px-2 py-1 rounded text-sm ${csvMetadata.insights.ready_for_analysis ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                                            {csvMetadata.insights.ready_for_analysis ? 'Yes' : 'No'}
                                        </span>
                                    </p>
                                </div>
                                {csvMetadata.insights.recommended_actions && csvMetadata.insights.recommended_actions.length > 0 && (
                                    <div>
                                        <p className="font-semibold mb-2">Recommendations:</p>
                                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                                            {csvMetadata.insights.recommended_actions.map((action, idx) => (
                                                <li key={idx} className="text-sm">{action}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Column Details Table */}
                        {csvMetadata.columns_info && (
                            <div className="mb-6">
                                <h4 className="text-xl font-semibold text-gray-800 mb-3">📋 Detailed Column Information</h4>
                                <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100 sticky top-0 z-10">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column Name</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data Type</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Null Count</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Unique Values</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Sample Values</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {csvMetadata.columns_info.map((colInfo, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{colInfo.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{colInfo.data_type}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{colInfo.null_count.toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{colInfo.unique_count.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-sm text-gray-700 max-w-xs truncate">{colInfo.sample_values?.join(', ')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Data Preview Table */}
                        {csvMetadata.preview_data && csvMetadata.preview_data.length > 0 && (
                            <div>
                                <h4 className="text-xl font-semibold text-gray-800 mb-3">👀 Data Preview (First 5 Rows)</h4>
                                <div className="overflow-x-auto rounded-lg border border-gray-300 shadow-sm max-h-96">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-100 sticky top-0 z-10">
                                            <tr>
                                                {csvMetadata.columns?.map(col => (
                                                    <th key={col} scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {csvMetadata.preview_data?.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-gray-50">
                                                    {csvMetadata.columns?.map(col => (
                                                        <td key={`${idx}-${col}`} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                                                            {row[col]}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
