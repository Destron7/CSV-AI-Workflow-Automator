import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { CorrelationMatrix } from '../components/charts';
import { useCsvSelection } from '../hooks/useCsvSelection';
import { GlowingCard } from '../components/ui/glowing-card';

export default function CsvAnalysis() {
    const navigate = useNavigate();

    // Global CSV State
    const {
        selectedFile,
        handleFileUpload,
        clearGlobalCsv
    } = useCsvSelection();

    // State to store the metadata and preview data from the backend
    const [csvAnalysisResult, setCsvAnalysisResult] = useState(null);
    // State for error/success messages
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false); // To determine message color
    const [isLoading, setIsLoading] = useState(false);

    // Effect to force update file input when selectedFile changes programmatically
    React.useEffect(() => {
        if (!selectedFile) {
            const fileInput = document.getElementById('csvFile');
            if (fileInput) fileInput.value = '';
            setCsvAnalysisResult(null);
            setMessage('');
        } else {
            // If a file is pre-loaded (e.g. from Redux), we might want to automatically analyse it?
            // Or just show it's ready.
            if (!csvAnalysisResult) {
                setMessage(`File loaded: ${selectedFile.name}. Click 'Get File Info' to process.`);
            }
        }
    }, [selectedFile, csvAnalysisResult]);

    // Function to handle file selection
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        // Use hook to update global state
        handleFileUpload(file);

        setMessage(''); // Clear previous messages
        setIsError(false);
        setCsvAnalysisResult(null); // Clear previous metadata/preview

        if (file) {
            if (file.type === 'text/csv' || file.name.endsWith('.csv')) {
                // Hook handles the setting, just update UI message
            } else {
                setMessage('Error: Please select a valid CSV file (.csv extension).');
                setIsError(true);
            }
        }
    };

    // Function to handle form submission (now just for getting file info)
    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');
        setIsError(false);
        setCsvAnalysisResult(null);
        setIsLoading(true);

        if (!selectedFile) {
            setMessage('Error: Please select a CSV file.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        // Ensure it's a CSV file before sending
        if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
            setMessage('Error: Only CSV files are allowed.');
            setIsError(true);
            setIsLoading(false);
            return;
        }

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            // Using axios to send request to FastAPI backend using the versioned API endpoint
            const response = await axios.post('http://localhost:8000/api/v1/csv/analyse-csv/', formData, {
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
                insights: data.insights,
                correlation_matrix: data.correlation_matrix
            };

            setCsvAnalysisResult(transformedData);
            setMessage('CSV file information retrieved successfully!');
            setIsError(false);
            console.log('CSV Info response:', data);
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message || 'An unknown error occurred.';
            setMessage('Error: ' + errorMessage);
            setIsError(true);
            setCsvAnalysisResult(null);
            console.error('CSV Info error:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Function to reset all states
    const handleReset = () => {
        clearGlobalCsv();
        setCsvAnalysisResult(null);
        setMessage('');
        setIsError(false);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 pt-24 text-foreground">
            <div className="bg-card p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-6xl border border-border/40">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-foreground mb-6 sm:mb-8">
                    CSV File Analyzer
                </h1>
                <p className="text-base sm:text-lg text-center text-muted-foreground mb-8 sm:mb-10">
                    Upload your CSV file to view its structure and basic statistics.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                    {/* CSV File Upload Section */}
                    {!csvAnalysisResult && (
                        <div className="p-5 sm:p-6 border border-border/40 rounded-lg bg-muted/20 shadow-sm">
                            <h2 className="text-xl sm:text-2xl font-semibold text-foreground mb-4">Upload Your CSV File</h2>
                            <label htmlFor="csvFile" className="block text-base sm:text-lg font-medium text-muted-foreground mb-2">
                                Select a CSV File:
                            </label>
                            <input
                                type="file"
                                id="csvFile"
                                accept=".csv"
                                onChange={handleFileChange}
                                className="block w-full text-sm text-foreground
                                       file:mr-4 file:py-2 file:px-4
                                       file:rounded-full file:border-0
                                       file:text-sm file:font-semibold
                                       file:bg-foreground file:text-background
                                       hover:file:bg-foreground/90 cursor-pointer transition duration-200"
                            />
                            {selectedFile && (
                                <p className="mt-3 text-sm text-muted-foreground">
                                    File selected: <span className="font-medium text-foreground">{selectedFile.name}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {/* Pre-loaded file indicator */}
                    {selectedFile && (
                        <div className="p-4 bg-muted/30 border border-border rounded-lg flex items-center justify-between">
                            <div className="flex items-center">
                                <span className="text-2xl mr-3 text-foreground">📂</span>
                                <div>
                                    <p className="font-semibold text-foreground">Analysis Data Loaded</p>
                                    <p className="text-muted-foreground text-sm">{selectedFile.name}</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="text-sm bg-background border border-border text-foreground px-3 py-1 rounded hover:bg-muted transition-colors"
                            >
                                Change File
                            </button>
                        </div>
                    )}

                    {/* Action Buttons */}
                    {!csvAnalysisResult && (
                        <div className="flex flex-col sm:flex-row justify-center gap-4">
                            <button
                                type="submit"
                                disabled={isLoading || isError}
                                className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-md text-lg font-semibold text-black bg-white hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white transition duration-300 ease-in-out transform hover:scale-105
                                       disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
                            >
                                {isLoading ? (
                                    <svg className="animate-spin h-6 w-6 mr-3 border-4 border-t-4 border-gray-500 rounded-full" viewBox="0 0 24 24"></svg>
                                ) : (
                                    "Get File Info"
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={handleReset}
                                className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-border rounded-lg shadow-md text-lg font-semibold text-foreground bg-transparent hover:bg-muted focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-300 ease-in-out transform hover:scale-105"
                            >
                                Reset
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate('/csv-cleaning')}
                                disabled={!selectedFile}
                                className="w-full sm:w-auto flex justify-center items-center py-3 px-6 border border-transparent rounded-lg shadow-md text-lg font-semibold text-white bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition duration-300 ease-in-out transform hover:scale-105
                                       disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-600"
                            >
                                Clean CSV
                            </button>
                        </div>
                    )}
                </form>

                {/* Message / Error Display */}
                {message && (
                    <div className={`mt-8 p-4 rounded-lg relative shadow-md border ${isError ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-zinc-100 border-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-100'}`} role="alert">
                        <strong className="font-bold">{isError ? 'Error' : 'Success'}</strong>
                        <span className="block sm:inline ml-2">{message}</span>
                    </div>
                )}

                {/* CSV Metadata and Data Preview Display */}
                {csvAnalysisResult && (
                    <GlowingCard className="mt-8 p-6 shadow-inner animate-fade-in">
                        <h3 className="text-2xl font-bold mb-6 text-foreground">CSV File Analysis Results:</h3>

                        {/* File Information Section */}
                        <div className="mb-6 p-4 bg-muted/20 border border-border/40 rounded-lg">
                            <h4 className="text-xl font-semibold text-foreground mb-3">📊 File Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-muted-foreground">
                                <p><span className="font-semibold text-foreground">Filename:</span> {csvAnalysisResult.filename}</p>
                                <p><span className="font-semibold text-foreground">File Size:</span> {csvAnalysisResult.file_size_mb} MB</p>
                                <p><span className="font-semibold text-foreground">Total Rows:</span> {csvAnalysisResult.num_rows.toLocaleString()}</p>
                                <p><span className="font-semibold text-foreground">Total Columns:</span> {csvAnalysisResult.num_columns}</p>
                                <p className="col-span-full"><span className="font-semibold text-foreground">Columns:</span> {csvAnalysisResult.columns?.join(', ')}</p>
                            </div>
                        </div>

                        {/* Data Quality Section */}
                        {csvAnalysisResult.data_quality && (
                            <div className="mb-6 p-4 bg-muted/20 border border-border/40 rounded-lg">
                                <h4 className="text-xl font-semibold text-foreground mb-3">✅ Data Quality</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-muted-foreground">
                                    <p><span className="font-semibold text-foreground">Missing Values:</span> {csvAnalysisResult.data_quality.total_missing_values.toLocaleString()}</p>
                                    <p><span className="font-semibold text-foreground">Missing Percentage:</span> {csvAnalysisResult.data_quality.missing_percentage}%</p>
                                    <p><span className="font-semibold text-foreground">Has Missing Data:</span>
                                        <span className={`ml-2 px-2 py-1 rounded text-sm ${csvAnalysisResult.data_quality.has_missing_data ? 'bg-destructive/20 text-destructive' : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200'}`}>
                                            {csvAnalysisResult.data_quality.has_missing_data ? 'Yes' : 'No'}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Correlation Matrix Section */}
                        {csvAnalysisResult.correlation_matrix && (
                            <div className="mb-6 p-4 bg-card border border-border/40 rounded-lg">
                                <h4 className="text-xl font-semibold text-foreground mb-4">🔥 Correlation Matrix</h4>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Correlations between numeric features.
                                    <span className="text-foreground font-semibold ml-2">Light</span> indicates positive correlation,
                                    <span className="text-muted-foreground font-semibold ml-2">Dark</span> indicates negative correlation.
                                </p>
                                <CorrelationMatrix data={csvAnalysisResult.correlation_matrix} />
                            </div>
                        )}

                        {/* Column Types Section */}
                        {csvAnalysisResult.column_types && (
                            <div className="mb-6 p-4 bg-muted/20 border border-border/40 rounded-lg">
                                <h4 className="text-xl font-semibold text-foreground mb-3">🏷️ Column Types</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-muted-foreground">
                                    <p><span className="font-semibold text-foreground">Numeric Columns:</span> {csvAnalysisResult.column_types.numeric}</p>
                                    <p><span className="font-semibold text-foreground">Text Columns:</span> {csvAnalysisResult.column_types.text}</p>
                                    <p><span className="font-semibold text-foreground">Other Types:</span> {csvAnalysisResult.column_types.other}</p>
                                </div>
                            </div>
                        )}

                        {/* Insights Section */}
                        {csvAnalysisResult.insights && (
                            <div className="mb-6 p-4 bg-muted/20 border border-border/40 rounded-lg">
                                <h4 className="text-xl font-semibold text-foreground mb-3">💡 Analysis Insights</h4>
                                <div className="mb-3">
                                    <p><span className="font-semibold text-muted-foreground">Ready for Analysis:</span>
                                        <span className={`ml-2 px-2 py-1 rounded text-sm ${csvAnalysisResult.insights.ready_for_analysis ? 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200' : 'bg-destructive/20 text-destructive'}`}>
                                            {csvAnalysisResult.insights.ready_for_analysis ? 'Yes' : 'No'}
                                        </span>
                                    </p>
                                </div>
                                {csvAnalysisResult.insights.recommended_actions && csvAnalysisResult.insights.recommended_actions.length > 0 && (
                                    <div>
                                        <p className="font-semibold mb-2 text-foreground">Recommendations:</p>
                                        <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                                            {csvAnalysisResult.insights.recommended_actions.map((action, idx) => (
                                                <li key={idx} className="text-sm">{action}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Column Details Table */}
                        {csvAnalysisResult.columns_info && (
                            <div className="mb-6">
                                <h4 className="text-xl font-semibold text-foreground mb-3">📋 Detailed Column Information</h4>
                                <div className="overflow-x-auto rounded-lg border border-border/40 shadow-sm">
                                    <table className="min-w-full divide-y divide-border/20">
                                        <thead className="bg-muted/50 sticky top-0 z-10">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Column Name</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Data Type</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Null Count</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Unique Values</th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">Sample Values</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-card divide-y divide-border/20">
                                            {csvAnalysisResult.columns_info.map((colInfo, idx) => (
                                                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{colInfo.name}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{colInfo.data_type}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{colInfo.null_count.toLocaleString()}</td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{colInfo.unique_count.toLocaleString()}</td>
                                                    <td className="px-6 py-4 text-sm text-muted-foreground max-w-xs truncate">{colInfo.sample_values?.join(', ')}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}

                        {/* Data Preview Table */}
                        {csvAnalysisResult.preview_data && csvAnalysisResult.preview_data.length > 0 && (
                            <div>
                                <h4 className="text-xl font-semibold text-foreground mb-3">👀 Data Preview (First 5 Rows)</h4>
                                <div className="overflow-x-auto rounded-lg border border-border/40 shadow-sm max-h-96">
                                    <table className="min-w-full divide-y divide-border/20">
                                        <thead className="bg-muted/50 sticky top-0 z-10">
                                            <tr>
                                                {csvAnalysisResult.columns?.map(col => (
                                                    <th key={col} scope="col" className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                                                        {col}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="bg-card divide-y divide-border/20">
                                            {csvAnalysisResult.preview_data?.map((row, idx) => (
                                                <tr key={idx} className="hover:bg-muted/30 transition-colors">
                                                    {csvAnalysisResult.columns?.map(col => (
                                                        <td key={`${idx}-${col}`} className="px-6 py-4 whitespace-nowrap text-sm text-foreground max-w-xs truncate">
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
                    </GlowingCard>
                )}
            </div>
        </div>
    );
}
