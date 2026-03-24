import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import { CorrelationMatrix } from '../components/charts';
import { useCsvSelection } from '../hooks/useCsvSelection';
import { GlowingCard } from '../components/ui/glowing-card';
import { Upload } from 'lucide-react';

export default function CsvAnalysis() {
    const navigate = useNavigate();

    // Global CSV State
    const { selectedFile } = useCsvSelection();

    // State to store the metadata and preview data from the backend
    const [csvAnalysisResult, setCsvAnalysisResult] = useState(null);
    const [message, setMessage] = useState('');
    const [isError, setIsError] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Auto-fetch insights on mount (Moved above early return to satisfy Rules of Hooks)
    React.useEffect(() => {
        if (selectedFile && !csvAnalysisResult && !isLoading && !isError) {
            handleSubmit(new Event('submit'));
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedFile, csvAnalysisResult, isError]); // removed isLoading from deps so it doesn't trigger repeatedly

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
                        Please upload a CSV file on the Home page first to start analyzing your data.
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

    // Function to handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        setMessage('');
        setIsError(false);
        setCsvAnalysisResult(null);
        setIsLoading(true);

        const formData = new FormData();
        formData.append('file', selectedFile);

        try {
            const response = await axios.post('http://localhost:8000/api/v1/csv/analyse-csv/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            const data = response.data;

            const transformedData = {
                filename: data.filename,
                file_size: data.file_size,
                file_size_mb: data.file_size_mb,
                num_rows: data.num_rows,
                num_columns: data.num_columns,
                columns: data.columns,
                preview_data: data.preview_data,
                basic_preview: data.data,
                columns_info: data.columns_info,
                data_quality: data.data_quality,
                column_types: data.column_types,
                insights: data.insights,
                correlation_matrix: data.correlation_matrix
            };

            setCsvAnalysisResult(transformedData);
            setMessage('CSV file information retrieved successfully!');
            setIsError(false);
        } catch (error) {
            const errorMessage = error.response?.data?.detail || error.message || 'An unknown error occurred.';
            setMessage('Error: ' + errorMessage);
            setIsError(true);
            setCsvAnalysisResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleReset = () => {
        setCsvAnalysisResult(null);
        setMessage('');
        setIsError(false);
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 pt-24 text-foreground">
            <div className="bg-card p-6 sm:p-8 rounded-xl shadow-2xl w-full max-w-6xl border border-border/40">
                <h1 className="text-3xl sm:text-4xl font-extrabold text-center text-foreground mb-6 sm:mb-8">
                    Deep Insights
                </h1>
                <p className="text-base sm:text-lg text-center text-muted-foreground mb-8 sm:mb-10">
                    Auto-analyzing the structure and statistics of your dataset.
                </p>

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center space-y-4 py-12">
                        <svg className="animate-spin h-10 w-10 text-primary border-4 border-t-transparent border-primary rounded-full" viewBox="0 0 24 24"></svg>
                        <p className="text-lg font-medium text-muted-foreground animate-pulse">Running full statistical analysis...</p>
                    </div>
                )}

                {/* Message / Error Display */}
                {message && !isLoading && (
                    <div className={`mt-4 p-4 rounded-lg relative shadow-md border ${isError ? 'bg-destructive/10 border-destructive/20 text-destructive' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400'}`} role="alert">
                        <strong className="font-bold">{isError ? 'Error: ' : ''}</strong>
                        <span className="block sm:inline ml-1">{message}</span>
                        {isError && (
                            <button
                                onClick={handleReset}
                                className="mt-4 px-4 py-2 border rounded-lg text-sm font-medium hover:bg-black/5 dark:hover:bg-white/5 transition-colors block mx-auto"
                            >
                                Try Again
                            </button>
                        )}
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
