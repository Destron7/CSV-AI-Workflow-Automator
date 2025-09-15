import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { DataQualityPieChart, TypeConversionChart, NullDataChart } from './charts';

export default function CsvCleaning() {
    const navigate = useNavigate();
    const [selectedFile, setSelectedFile] = useState(null);
    const [cleaningResult, setCleaningResult] = useState(null);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Debug function - for testing only
    const debugNavigateToRemovedRows = () => {
        console.log('Debug navigate to removed rows view');
        // Create a large sample dataset with 50 rows
        const sampleRows = [];
        for (let i = 0; i < 50; i++) {
            sampleRows.push({
                row_index: i,
                data: {
                    "id": i,
                    "name": `Test ${i}`,
                    "email": i % 3 === 0 ? null : `test${i}@example.com`,
                    "age": i % 2 === 0 ? i + 20 : null,
                    "city": i % 4 === 0 ? null : `City ${i}`,
                    "country": "Country " + (i % 10)
                }
            });
        }

        navigate('/removed-rows', {
            state: {
                removedRowsData: sampleRows,
                columns: ["id", "name", "email", "age", "city", "country"],
                filename: "debug_test.csv"
            }
        });
    };

    // Function to handle file selection
    // Function to handle viewing all removed rows
    const handleViewAllRemovedRows = async () => {
        console.log('View All Removed Rows clicked');

        if (!selectedFile) {
            setMessage('Error: Please select a CSV file first.');
            setIsError(true);
            return;
        }

        try {
            setIsLoading(true);

            // Create form data with selected file
            const formData = new FormData();
            formData.append('file', selectedFile);

            // Get all removed rows from backend
            const response = await axios.post('http://localhost:8000/api/v1/csv/removed-rows/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = response.data;
            console.log('All removed rows data:', data);

            // Navigate to the removed rows view with the data
            navigate('/removed-rows', {
                state: {
                    removedRowsData: data.removed_rows,
                    columns: data.columns,
                    filename: selectedFile.name
                }
            });
        } catch (error) {
            console.error('Error fetching removed rows:', error);
            setMessage(`Error fetching removed rows: ${error.message}`);
            setIsError(true);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        setMessage('');
        setIsError(false);
        setCleaningResult(null);

        if (file) {
            if (file.type === 'text/csv') {
                setMessage(`File selected: ${file.name}. Click 'Clean CSV' to remove null values and duplicate rows.`);
                setIsError(false);
            } else {
                setSelectedFile(null);
                setMessage('Error: Please select a valid CSV file (.csv extension).');
                setIsError(true);
                // Reset file input element if invalid file
                const fileInput = document.getElementById('csvFileToClean');
                if (fileInput) fileInput.value = '';
            }
        } else {
            setMessage(''); // Clear message if no file is selected
        }
    };

    // Function to handle cleaning CSV (removing null rows and duplicates)
    const handleCleanCsv = async (event) => {
        event.preventDefault();
        setMessage('');
        setIsError(false);
        setCleaningResult(null);
        setIsLoading(true);

        if (!selectedFile) {
            setMessage('Error: Please select a CSV file to clean.');
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
        // Add parameter to indicate we want to remove duplicates as well
        formData.append('remove_duplicates', 'true');

        try {
            // Using axios to send request to FastAPI backend for cleaning
            const response = await axios.post('http://localhost:8000/api/v1/csv/clean/remove-nulls/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = response.data;
            console.log('CSV Cleaning response data:', data);

            // Update the UI with the result
            setCleaningResult(data);

            // Create appropriate message based on what was cleaned
            let resultMessage = '';
            if (data.null_rows_removed > 0 && data.duplicate_rows_removed > 0) {
                resultMessage = `Success! Removed ${data.null_rows_removed.toLocaleString()} rows with null values and ${data.duplicate_rows_removed.toLocaleString()} duplicate rows.`;
            } else if (data.null_rows_removed > 0) {
                resultMessage = `Success! Removed ${data.null_rows_removed.toLocaleString()} rows with null values.`;
            } else if (data.duplicate_rows_removed > 0) {
                resultMessage = `Success! Removed ${data.duplicate_rows_removed.toLocaleString()} duplicate rows.`;
            } else {
                resultMessage = 'Success! Your data is already clean. No rows needed to be removed.';
            }

            setMessage(resultMessage);
            console.log('CSV Cleaning response:', data);
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message || 'An unknown error occurred.';
            setMessage('Error: ' + errorMessage);
            setIsError(true);
            setCleaningResult(null);
            console.error('CSV Cleaning error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to download cleaned CSV (with nulls and duplicates removed)
    const handleDownloadCleanedCsv = async () => {
        if (!selectedFile) {
            setMessage('Error: No CSV file selected for cleaning.');
            setIsError(true);
            return;
        }

        setIsDownloading(true);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('remove_duplicates', 'true'); // Add parameter to indicate we want to remove duplicates

        try {
            // Using axios to send request to FastAPI backend for downloading cleaned CSV
            const response = await axios.post('http://localhost:8000/api/v1/csv/clean/remove-nulls/download/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'blob', // Important for receiving binary data
            });

            // Create a blob URL and trigger download
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `cleaned_${selectedFile.name}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            // Show different message based on what processing was done
            const hasNumericConversions = cleaningResult?.type_conversions?.numeric_columns?.length > 0;
            const hasAnyProcessing = cleaningResult?.rows_removed > 0 || hasNumericConversions;

            if (hasAnyProcessing) {
                setMessage('Processed CSV file downloaded successfully!');
            } else {
                setMessage('CSV file downloaded successfully! (No processing was needed)');
            }
            setIsError(false);
        } catch (error) {
            const errorMessage = 'Failed to download cleaned CSV file.';
            setMessage('Error: ' + errorMessage);
            setIsError(true);
            console.error('CSV Download error:', error);
        } finally {
            setIsDownloading(false);
        }
    };

    // Function to reset all states
    const handleReset = () => {
        setSelectedFile(null);
        setCleaningResult(null);
        setMessage('');
        setIsError(false);
        setIsLoading(false);
        const fileInput = document.getElementById('csvFileToClean');
        if (fileInput) fileInput.value = '';
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
            <div className="bg-white p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-gray-900 mb-6 sm:mb-8">
                    CSV File Cleaner
                </h1>
                <p className="text-base sm:text-lg text-center text-gray-600 mb-8 sm:mb-10">
                    Upload your CSV file to clean by removing rows with null values and duplicate rows.
                </p>

                <form onSubmit={handleCleanCsv} className="space-y-6 sm:space-y-8">
                    {/* CSV File Upload Section */}
                    <div className="p-5 sm:p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                        <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 mb-4">Upload Your CSV File</h2>
                        <label htmlFor="csvFileToClean" className="block text-base sm:text-lg font-medium text-gray-700 mb-2">
                            Select a CSV File:
                        </label>
                        <input
                            type="file"
                            id="csvFileToClean"
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
                            disabled={isLoading || isDownloading}
                            className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-md text-lg font-semibold text-white bg-gradient-to-r from-green-600 to-blue-700 hover:from-green-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition duration-300 ease-in-out transform hover:scale-105
                                       disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                        >
                            {isLoading ? (
                                <svg className="animate-spin h-6 w-6 mr-3 border-4 border-t-4 border-gray-200 rounded-full" viewBox="0 0 24 24"></svg>
                            ) : (
                                "Clean CSV (Remove Nulls & Duplicates)"
                            )}
                        </button>

                        {cleaningResult && (
                            <button
                                type="button"
                                onClick={handleDownloadCleanedCsv}
                                disabled={isDownloading || isLoading}
                                className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-md text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:scale-105
                                           disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                            >
                                {isDownloading ? (
                                    <svg className="animate-spin h-6 w-6 mr-3 border-4 border-t-4 border-gray-200 rounded-full" viewBox="0 0 24 24"></svg>
                                ) : (
                                    cleaningResult.rows_removed === 0 &&
                                        !cleaningResult.type_conversions?.numeric_columns?.length
                                        ? "Download CSV File"
                                        : "Download Processed CSV"
                                )}
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleReset}
                            className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-gray-300 rounded-lg shadow-md text-lg font-semibold text-gray-700 bg-white hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            Reset
                        </button>

                        {/* Debug button - for testing only */}
                        <button
                            type="button"
                            onClick={debugNavigateToRemovedRows}
                            className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-yellow-300 rounded-lg shadow-md text-sm font-semibold text-yellow-800 bg-yellow-100 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 transition duration-300 ease-in-out"
                        >
                            Debug Test View
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

                {/* Cleaning Results Display */}
                {cleaningResult && (
                    <div className="mt-8 p-6 bg-white border border-gray-200 rounded-lg shadow-inner animate-fade-in">
                        <h3 className="text-2xl font-bold mb-6 text-gray-900">CSV Cleaning Results:</h3>

                        {/* Data Quality Visualization */}
                        {cleaningResult.original_rows > 0 && (
                            <div className="mb-8 p-4 bg-white border border-gray-200 rounded-lg">
                                <h4 className="text-xl font-semibold text-gray-800 mb-4">
                                    Data Quality Visualization
                                </h4>
                                <DataQualityPieChart
                                    totalRows={cleaningResult.original_rows || 0}
                                    rowsWithNulls={cleaningResult.rows_removed || 0}
                                />
                            </div>
                        )}

                        {/* Cleaning Summary Section */}
                        <div className={`mb-6 p-4 ${cleaningResult.rows_removed === 0 && !cleaningResult.type_conversions?.numeric_columns?.length ? 'bg-green-50 border border-green-200' : 'bg-blue-50 border border-blue-200'} rounded-lg`}>
                            <h4 className={`text-xl font-semibold ${cleaningResult.rows_removed === 0 && !cleaningResult.type_conversions?.numeric_columns?.length ? 'text-green-800' : 'text-blue-800'} mb-3`}>
                                {cleaningResult.rows_removed === 0 && !cleaningResult.type_conversions?.numeric_columns?.length ? '✓ Analysis Summary' : '🧹 Cleaning Summary'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                                <p><span className="font-semibold">Filename:</span> {cleaningResult.filename}</p>
                                <p><span className="font-semibold">Original Rows:</span> {cleaningResult.original_rows.toLocaleString()}</p>
                                <p><span className="font-semibold">Cleaned Rows:</span> {cleaningResult.cleaned_rows.toLocaleString()}</p>
                                <p><span className="font-semibold">Rows Removed:</span> {cleaningResult.rows_removed.toLocaleString()} ({cleaningResult.removal_percentage}%)</p>
                                <p className="col-span-full"><span className="font-semibold">{cleaningResult.rows_removed === 0 && !cleaningResult.type_conversions?.numeric_columns?.length ? 'Analysis Result:' : 'Cleaning Operations:'}</span> {cleaningResult.cleaning_summary}</p>

                                {/* Display duplicate rows information if available */}
                                {cleaningResult.duplicate_rows_removed > 0 && (
                                    <div className="col-span-full mt-4 pt-4 border-t border-blue-200">
                                        <h5 className="text-lg font-medium text-blue-800 mb-2">Duplicate Rows Removed:</h5>
                                        <p className="text-sm text-gray-700">
                                            <span className="font-medium">{cleaningResult.duplicate_rows_removed.toLocaleString()}</span> duplicate {cleaningResult.duplicate_rows_removed === 1 ? 'row was' : 'rows were'} detected and removed from the dataset.
                                        </p>
                                    </div>
                                )}

                                {/* Display column type conversions if any occurred */}
                                {cleaningResult.type_conversions &&
                                    cleaningResult.type_conversions.numeric_columns?.length > 0 && (
                                        <div className="col-span-full mt-3">
                                            <h5 className="text-lg font-medium text-gray-800 mb-2">Column Type Conversions:</h5>

                                            <div className="mb-4">
                                                <p className="font-semibold text-gray-700">Numeric Columns:</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {cleaningResult.type_conversions.numeric_columns.map((col, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-block bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded-md"
                                                            title={`Converted from ${cleaningResult.type_conversions.type_changes[col]?.from} to ${cleaningResult.type_conversions.type_changes[col]?.to}`}
                                                        >
                                                            {col}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Fallback for when we only have type_changes but not detailed conversion_details */}
                                            {cleaningResult.type_conversions &&
                                                cleaningResult.type_conversions.type_changes &&
                                                Object.keys(cleaningResult.type_conversions.type_changes).length > 0 &&
                                                (!cleaningResult.type_conversions.conversion_details ||
                                                    Object.keys(cleaningResult.type_conversions.conversion_details).length === 0) && (
                                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                                        <p className="font-semibold text-gray-700 mb-3">Type Conversion Details:</p>
                                                        <div className="overflow-x-auto">
                                                            <table className="min-w-full bg-white border border-gray-200 rounded-md">
                                                                <thead className="bg-gray-100">
                                                                    <tr>
                                                                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                                                                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Type</th>
                                                                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Type</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-200">
                                                                    {Object.entries(cleaningResult.type_conversions.type_changes).map(([col, types], idx) => (
                                                                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                                            <td className="py-2 px-3 text-sm font-medium text-gray-900">{col}</td>
                                                                            <td className="py-2 px-3 text-sm text-gray-600">{types.from}</td>
                                                                            <td className="py-2 px-3 text-sm text-blue-600 font-medium">{types.to}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Detailed Type Conversion Info */}
                                            {/* Make the conversion details check more robust */}
                                            {cleaningResult.type_conversions &&
                                                cleaningResult.type_conversions.conversion_details &&
                                                typeof cleaningResult.type_conversions.conversion_details === 'object' &&
                                                Object.keys(cleaningResult.type_conversions.conversion_details).length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                                        <p className="font-semibold text-gray-700 mb-3">Detailed Conversion Information:</p>

                                                        {/* Type Conversion Chart */}
                                                        <div className="mb-6">
                                                            <h5 className="text-lg font-medium text-gray-600 mb-3">Column Type Conversion Success Rate</h5>
                                                            <TypeConversionChart
                                                                conversionDetails={cleaningResult.type_conversions.conversion_details}
                                                            />
                                                        </div>

                                                        {/* Detailed Table */}
                                                        <div className="overflow-x-auto">
                                                            <table className="min-w-full bg-white border border-gray-200 rounded-md">
                                                                <thead className="bg-gray-100">
                                                                    <tr>
                                                                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Column</th>
                                                                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Original Type</th>
                                                                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">New Type</th>
                                                                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Success Rate</th>
                                                                        <th className="py-2 px-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Values</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-200">
                                                                    {Object.entries(cleaningResult.type_conversions.conversion_details).map(([col, details], idx) => (
                                                                        <tr key={idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                                                                            <td className="py-2 px-3 text-sm font-medium text-gray-900">{col}</td>
                                                                            <td className="py-2 px-3 text-sm text-gray-600">{details.original_type}</td>
                                                                            <td className="py-2 px-3 text-sm text-blue-600 font-medium">{details.new_type}</td>
                                                                            <td className="py-2 px-3 text-sm text-gray-600">
                                                                                <div className="flex items-center">
                                                                                    <div className="w-16 bg-gray-200 rounded-full h-2.5 mr-2">
                                                                                        <div
                                                                                            className="bg-blue-600 h-2.5 rounded-full"
                                                                                            style={{ width: `${details.success_rate * 100}%` }}
                                                                                        ></div>
                                                                                    </div>
                                                                                    {Math.round(details.success_rate * 100)}%
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-2 px-3 text-sm text-gray-600">
                                                                                {details.valid_numeric_values.toLocaleString()} of {details.values_before_conversion.toLocaleString()} converted
                                                                            </td>
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

                        {/* Removed Rows Section - Show if there were rows removed */}
                        {cleaningResult.rows_removed > 0 && (
                            <div className="mb-6">
                                <h4 className="text-xl font-semibold text-gray-800 mb-3">
                                    🗑️ Removed Rows
                                </h4>

                                <div className="p-4 bg-red-50 border-l-4 border-red-400 rounded-md mb-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-red-700">
                                                <span className="font-medium">Removed {cleaningResult.rows_removed} rows</span> containing null values ({cleaningResult.removal_percentage}% of data).
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Null Data Column Chart - visualize nulls per column */}
                                {cleaningResult.null_data && cleaningResult.null_data.null_counts_by_column && (
                                    <div className="mb-6 mt-4">
                                        <h5 className="text-lg font-medium text-gray-600 mb-3">Null Values by Column</h5>
                                        <div className="p-4 bg-white border border-gray-200 rounded-lg">
                                            <NullDataChart
                                                nullCountsByColumn={cleaningResult.null_data.null_counts_by_column}
                                                totalRows={cleaningResult.original_rows}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="mt-6 flex gap-2">
                                    <button
                                        className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 rounded-md flex items-center"
                                        onClick={handleViewAllRemovedRows}
                                        disabled={isLoading}
                                    >
                                        {isLoading ? (
                                            <>
                                                <svg className="animate-spin h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                </svg>
                                                Loading...
                                            </>
                                        ) : (
                                            <>
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                                </svg>
                                                View All Removed Rows
                                            </>
                                        )}
                                    </button>
                                    <button
                                        className="px-4 py-2 bg-yellow-100 hover:bg-yellow-200 text-yellow-800 rounded-md"
                                        onClick={() => {
                                            console.log('Cleaning Result:', cleaningResult);
                                            console.log('null_data field exists:', Boolean(cleaningResult.null_data));
                                            if (cleaningResult.null_data) {
                                                console.log('sample_removed_rows exists:', Boolean(cleaningResult.null_data.sample_removed_rows));
                                                console.log('sample_removed_rows length:', cleaningResult.null_data.sample_removed_rows?.length);
                                                console.log('First sample row:', cleaningResult.null_data.sample_removed_rows?.[0]);
                                            }
                                            alert(`Rows removed: ${cleaningResult.rows_removed}\nNull data exists: ${Boolean(cleaningResult.null_data)}\nSample rows count: ${cleaningResult.null_data?.sample_removed_rows?.length || 0}`);
                                        }}
                                    >
                                        Debug Data
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Data Preview Section */}
                        <div className="mb-6">
                            <h4 className="text-xl font-semibold text-gray-800 mb-3">
                                📋 {cleaningResult.rows_removed === 0 &&
                                    !cleaningResult.type_conversions?.numeric_columns?.length
                                    ? 'Data Preview'
                                    : 'Processed Data Preview'}
                            </h4>
                            <div className="overflow-x-auto rounded-lg border border-gray-200 shadow">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            {cleaningResult.columns.map((column, index) => (
                                                <th
                                                    key={index}
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                                >
                                                    {column}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {cleaningResult.cleaned_data.map((row, rowIndex) => (
                                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                                                {cleaningResult.columns.map((column, colIndex) => (
                                                    <td
                                                        key={`${rowIndex}-${colIndex}`}
                                                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                                                    >
                                                        {row[column]}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-2 text-sm text-gray-500">
                                Showing {cleaningResult.cleaned_data.length} of {cleaningResult.cleaned_rows} rows
                            </p>
                        </div>
                    </div>

                )}
            </div>
        </div>
    );
}
