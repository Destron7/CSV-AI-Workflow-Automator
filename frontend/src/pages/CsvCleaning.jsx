import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { DataQualityPieChart, TypeConversionChart, NullDataChart } from '../components/charts';
import { useCsvSelection } from '../hooks/useCsvSelection';
import { GlowingCard } from '../components/ui/glowing-card';
import { Upload } from 'lucide-react';

export default function CsvCleaning() {
    const navigate = useNavigate();

    const {
        selectedFile,
        isProcessing: isParsingCsv
    } = useCsvSelection();

    // Local UI State
    const [cleaningResult, setCleaningResult] = useState(null);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Auto-clean CSV on mount
    React.useEffect(() => {
        if (selectedFile && !cleaningResult && !isLoading && !isError) {
            handleCleanCsv(new Event('submit'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFile, cleaningResult, isError]);

    // Guard: no CSV uploaded
    if (!selectedFile) {
        return (
            <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 pt-24 text-foreground">
                <div className="bg-card p-10 rounded-xl shadow-2xl max-w-md text-center border border-border/40">
                    <div className="mx-auto w-16 h-16 rounded-full bg-muted/30 flex items-center justify-center mb-6">
                        <Upload className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">No CSV Uploaded</h2>
                    <p className="text-muted-foreground mb-6">
                        Please upload a CSV file on the Home page first to start cleaning your data.
                    </p>
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center py-3 px-6 rounded-lg text-lg font-semibold text-black bg-white hover:bg-gray-200 transition duration-300"
                    >
                        Go to Home Page
                    </Link>
                </div>
            </div>
        );
    }

    // Function to handle viewing all removed rows
    const handleViewAllRemovedRows = async () => {
        if (!selectedFile) {
            setMessage('Error: Please select a CSV file first.');
            setIsError(true);
            return;
        }

        try {
            setIsLoading(true);

            const formData = new FormData();
            formData.append('file', selectedFile);

            const response = await axios.post('http://localhost:8000/api/v1/csv/removed-rows/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = response.data;

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

    // Function to handle cleaning CSV
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

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('remove_duplicates', 'true');

        try {
            const response = await axios.post('http://localhost:8000/api/v1/csv/clean/remove-nulls/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = response.data;

            setCleaningResult(data);

            // NOTE: We do NOT call updateGlobalCsv() here because
            // data.cleaned_data is only a PREVIEW (limited rows) from the backend.
            // Overwriting the global CSV with preview data would truncate the file
            // for all other features. The user can download the full cleaned CSV
            // via the "Download Processed CSV" button instead.

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
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message || 'An unknown error occurred.';
            setMessage('Error: ' + errorMessage);
            setIsError(true);
            setCleaningResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to download cleaned CSV
    const handleDownloadCleanedCsv = async () => {
        if (!selectedFile) {
            setMessage('Error: No CSV file selected for cleaning.');
            setIsError(true);
            return;
        }

        setIsDownloading(true);

        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('remove_duplicates', 'true');

        try {
            const response = await axios.post('http://localhost:8000/api/v1/csv/clean/remove-nulls/download/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `cleaned_${selectedFile.name}`);
            document.body.appendChild(link);
            link.click();
            link.remove();

            const hasNumericConversions = cleaningResult?.type_conversions?.numeric_columns?.length > 0;
            const hasAnyProcessing = cleaningResult?.rows_removed > 0 || hasNumericConversions;

            if (hasAnyProcessing) {
                setMessage('Processed CSV file downloaded successfully!');
            } else {
                setMessage('CSV file downloaded successfully! (No processing was needed)');
            }
            setIsError(false);
        } catch (error) {
            setMessage('Error: Failed to download cleaned CSV file.');
            setIsError(true);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleAnalyzeData = () => {
        navigate('/csv-analysis');
    };

    const handleReset = () => {
        setCleaningResult(null);
        setMessage('');
        setIsError(false);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 pt-24 text-foreground">
            <div className="bg-card p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-6xl border border-border/40">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-foreground mb-6 sm:mb-8">
                    Data Cleaning
                </h1>
                <p className="text-base sm:text-lg text-center text-muted-foreground mb-8 sm:mb-10">
                    Auto-cleaning your dataset by stripping null values and collapsing duplicates.
                </p>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center space-y-4 py-12">
                        <svg className="animate-spin h-10 w-10 text-primary border-4 border-t-transparent border-primary rounded-full" viewBox="0 0 24 24"></svg>
                        <p className="text-lg font-medium text-muted-foreground animate-pulse">Running data cleanup operations...</p>
                    </div>
                )}

                <form onSubmit={handleCleanCsv} className="space-y-6 sm:space-y-8">
                    {/* Action Buttons */}
                    <div className="flex flex-col sm:flex-row justify-center gap-4">

                        {cleaningResult && (
                            <button
                                type="button"
                                onClick={handleDownloadCleanedCsv}
                                disabled={isDownloading || isLoading}
                                className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-md text-lg font-semibold text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-300 ease-in-out transform hover:scale-105
                                           disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
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

                        {cleaningResult && (
                            <button
                                type="button"
                                onClick={handleAnalyzeData}
                                className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-md text-lg font-semibold text-black bg-white/90 hover:bg-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                Analyze Data
                            </button>
                        )}

                        <button
                            type="button"
                            onClick={handleReset}
                            className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-border rounded-lg shadow-md text-lg font-semibold text-foreground bg-transparent hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-300 ease-in-out transform hover:scale-105"
                        >
                            Reset
                        </button>
                    </div>
                </form>

                {/* Message / Error Display */}
                {message && (
                    <div className={`mt-8 p-4 rounded-lg relative shadow-md border ${isError ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-zinc-100 border-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100'}`} role="alert">
                        <strong className="font-bold">{isError ? 'Error' : 'Success'}</strong>
                        <span className="block sm:inline ml-2">{message}</span>
                    </div>
                )}

                {/* Cleaning Results Display */}
                {cleaningResult && (
                    <GlowingCard className="mt-8 p-6 shadow-inner animate-fade-in">
                        <h3 className="text-2xl font-bold mb-6 text-foreground">CSV Cleaning Results:</h3>

                        {/* Data Quality Visualization */}
                        {cleaningResult.original_rows > 0 && (
                            <div className="mb-8 p-4 bg-background border border-border/40 rounded-lg">
                                <h4 className="text-xl font-semibold text-foreground mb-4">
                                    Data Quality Visualization
                                </h4>
                                <DataQualityPieChart
                                    totalRows={cleaningResult.original_rows || 0}
                                    rowsWithNulls={cleaningResult.rows_removed || 0}
                                />
                            </div>
                        )}

                        {/* Cleaning Summary Section */}
                        <div className="mb-6 p-4 bg-muted/20 border border-border/40 rounded-lg">
                            <h4 className="text-xl font-semibold text-foreground mb-3">
                                {cleaningResult.rows_removed === 0 && !cleaningResult.type_conversions?.numeric_columns?.length ? '✓ Analysis Summary' : '🧹 Cleaning Summary'}
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-muted-foreground">
                                <p><span className="font-semibold text-foreground">Filename:</span> {cleaningResult.filename}</p>
                                <p><span className="font-semibold text-foreground">Original Rows:</span> {cleaningResult.original_rows.toLocaleString()}</p>
                                <p><span className="font-semibold text-foreground">Cleaned Rows:</span> {cleaningResult.cleaned_rows.toLocaleString()}</p>
                                <p><span className="font-semibold text-foreground">Rows Removed:</span> {cleaningResult.rows_removed.toLocaleString()} ({cleaningResult.removal_percentage}%)</p>
                                <p className="col-span-full"><span className="font-semibold text-foreground">{cleaningResult.rows_removed === 0 && !cleaningResult.type_conversions?.numeric_columns?.length ? 'Analysis Result:' : 'Cleaning Operations:'}</span> {cleaningResult.cleaning_summary}</p>

                                {/* Display duplicate rows information if available */}
                                {cleaningResult.duplicate_rows_removed > 0 && (
                                    <div className="col-span-full mt-4 pt-4 border-t border-border/20">
                                        <h5 className="text-lg font-medium text-foreground mb-2">Duplicate Rows Removed:</h5>
                                        <p className="text-sm text-muted-foreground">
                                            <span className="font-medium text-foreground">{cleaningResult.duplicate_rows_removed.toLocaleString()}</span> duplicate {cleaningResult.duplicate_rows_removed === 1 ? 'row was' : 'rows were'} detected and removed from the dataset.
                                        </p>
                                    </div>
                                )}

                                {/* Display column type conversions if any occurred */}
                                {cleaningResult.type_conversions &&
                                    cleaningResult.type_conversions.numeric_columns?.length > 0 && (
                                        <div className="col-span-full mt-3">
                                            <h5 className="text-lg font-medium text-gray-800 mb-2">Column Type Conversions:</h5>

                                            <div className="mb-4">
                                                <p className="font-semibold text-muted-foreground">Numeric Columns:</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {cleaningResult.type_conversions.numeric_columns.map((col, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="inline-block bg-muted text-foreground text-sm px-2 py-1 rounded-md border border-border/20"
                                                            title={`Converted from ${cleaningResult.type_conversions.type_changes[col]?.from} to ${cleaningResult.type_conversions.type_changes[col]?.to}`}
                                                        >
                                                            {col}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Type changes table */}
                                            {cleaningResult.type_conversions.type_changes &&
                                                Object.keys(cleaningResult.type_conversions.type_changes).length > 0 &&
                                                (!cleaningResult.type_conversions.conversion_details ||
                                                    Object.keys(cleaningResult.type_conversions.conversion_details).length === 0) && (
                                                    <div className="mt-4 pt-4 border-t border-border/20">
                                                        <p className="font-semibold text-muted-foreground mb-3">Type Conversion Details:</p>
                                                        <div className="overflow-x-auto">
                                                            <table className="min-w-full bg-card border border-border/20 rounded-md">
                                                                <thead className="bg-muted/50">
                                                                    <tr>
                                                                        <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Column</th>
                                                                        <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Original Type</th>
                                                                        <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">New Type</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-border/20">
                                                                    {Object.entries(cleaningResult.type_conversions.type_changes).map(([col, types], idx) => (
                                                                        <tr key={idx} className={idx % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                                                                            <td className="py-2 px-3 text-sm font-medium text-foreground">{col}</td>
                                                                            <td className="py-2 px-3 text-sm text-muted-foreground">{types.from}</td>
                                                                            <td className="py-2 px-3 text-sm text-foreground font-medium">{types.to}</td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                    </div>
                                                )}

                                            {/* Detailed Type Conversion Info */}
                                            {cleaningResult.type_conversions.conversion_details &&
                                                typeof cleaningResult.type_conversions.conversion_details === 'object' &&
                                                Object.keys(cleaningResult.type_conversions.conversion_details).length > 0 && (
                                                    <div className="mt-4 pt-4 border-t border-border/20">
                                                        <p className="font-semibold text-muted-foreground mb-3">Detailed Conversion Information:</p>

                                                        {/* Type Conversion Chart */}
                                                        <div className="mb-6">
                                                            <h5 className="text-lg font-medium text-muted-foreground mb-3">Column Type Conversion Success Rate</h5>
                                                            <TypeConversionChart
                                                                conversionDetails={cleaningResult.type_conversions.conversion_details}
                                                            />
                                                        </div>

                                                        {/* Detailed Table */}
                                                        <div className="overflow-x-auto">
                                                            <table className="min-w-full bg-card border border-border/20 rounded-md">
                                                                <thead className="bg-muted/50">
                                                                    <tr>
                                                                        <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Column</th>
                                                                        <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Original Type</th>
                                                                        <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">New Type</th>
                                                                        <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Success Rate</th>
                                                                        <th className="py-2 px-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Values</th>
                                                                    </tr>
                                                                </thead>
                                                                <tbody className="divide-y divide-gray-200">
                                                                    {Object.entries(cleaningResult.type_conversions.conversion_details).map(([col, details], idx) => (
                                                                        <tr key={idx} className={idx % 2 === 0 ? "bg-card" : "bg-muted/10"}>
                                                                            <td className="py-2 px-3 text-sm font-medium text-foreground">{col}</td>
                                                                            <td className="py-2 px-3 text-sm text-muted-foreground">{details.original_type}</td>
                                                                            <td className="py-2 px-3 text-sm text-foreground font-medium">{details.new_type}</td>
                                                                            <td className="py-2 px-3 text-sm text-muted-foreground">
                                                                                <div className="flex items-center">
                                                                                    <div className="w-16 bg-muted rounded-full h-2.5 mr-2">
                                                                                        <div
                                                                                            className="bg-foreground h-2.5 rounded-full"
                                                                                            style={{ width: `${details.success_rate * 100}%` }}
                                                                                        ></div>
                                                                                    </div>
                                                                                    {Math.round(details.success_rate * 100)}%
                                                                                </div>
                                                                            </td>
                                                                            <td className="py-2 px-3 text-sm text-muted-foreground">
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

                        {/* Removed Rows Section */}
                        {cleaningResult.rows_removed > 0 && (
                            <div className="mb-6">
                                <h4 className="text-xl font-semibold text-foreground mb-3">
                                    🗑️ Removed Rows
                                </h4>

                                <div className="p-4 bg-destructive/10 border-l-4 border-destructive rounded-md mb-4">
                                    <div className="flex">
                                        <div className="flex-shrink-0">
                                            <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                        <div className="ml-3">
                                            <p className="text-sm text-destructive">
                                                <span className="font-medium">Removed {cleaningResult.rows_removed} rows</span> containing null values ({cleaningResult.removal_percentage}% of data).
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Null Data Column Chart */}
                                {cleaningResult.null_data && cleaningResult.null_data.null_counts_by_column && (
                                    <div className="mb-6 mt-4">
                                        <h5 className="text-lg font-medium text-muted-foreground mb-3">Null Values by Column</h5>
                                        <div className="p-4 bg-card border border-border/40 rounded-lg">
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
                                </div>
                            </div>
                        )}

                        {/* Data Preview Section */}
                        <div className="mb-6">
                            <h4 className="text-xl font-semibold text-foreground mb-3">
                                📋 {cleaningResult.rows_removed === 0 &&
                                    !cleaningResult.type_conversions?.numeric_columns?.length
                                    ? 'Data Preview'
                                    : 'Processed Data Preview'}
                            </h4>
                            <div className="overflow-x-auto rounded-lg border border-border/40 shadow">
                                <table className="min-w-full divide-y divide-border/20">
                                    <thead className="bg-muted/50">
                                        <tr>
                                            {cleaningResult.columns.map((column, index) => (
                                                <th
                                                    key={index}
                                                    scope="col"
                                                    className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                                                >
                                                    {column}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-card divide-y divide-border/20">
                                        {cleaningResult.cleaned_data.map((row, rowIndex) => (
                                            <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-card' : 'bg-muted/20'}>
                                                {cleaningResult.columns.map((column, colIndex) => (
                                                    <td
                                                        key={`${rowIndex}-${colIndex}`}
                                                        className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground"
                                                    >
                                                        {row[column]}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <p className="mt-2 text-sm text-muted-foreground">
                                Showing {cleaningResult.cleaned_data.length} of {cleaningResult.cleaned_rows} rows
                            </p>
                        </div>
                    </GlowingCard>
                )}
            </div>
        </div>
    );
}
