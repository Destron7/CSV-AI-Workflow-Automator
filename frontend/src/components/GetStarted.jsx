import React from 'react'

export const GetStarted = () => {
    const [selectedFile, setSelectedFile] = React.useState(null);
    // State to store column names extracted from the uploaded CSV (simulated)
    const [csvColumns, setCsvColumns] = React.useState([]);

    // State for workflow configuration
    const [workflowTasks, setWorkflowTasks] = React.useState({
        cleanData: true, // Default to true as per project
        causalAnalysis: false,
        forecasting: false, // Week 3 stretch goal, disabled for now
        simulation: false,  // Week 3 stretch goal, disabled for now
    });
    const [outputType, setOutputType] = React.useState('dashboard'); // 'dashboard' or 'report'

    // State for treatment and outcome columns for causal analysis
    const [treatmentColumn, setTreatmentColumn] = React.useState('');
    const [outcomeColumn, setOutcomeColumn] = React.useState('');

    // State for results, errors, and loading indicator
    const [results, setResults] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);

    // Function to handle file selection
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        // Simulate extracting columns from the CSV file
        // In a real app, you'd send the file to the backend, and the backend would return the columns.
        if (file) {
            // Dummy columns for demonstration. Replace with actual column extraction logic
            // (e.g., from a backend response after initial file upload validation)
            const dummyColumns = ['price', 'sales', 'advertising', 'region', 'product_id', 'date'];
            setCsvColumns(dummyColumns);
            // Reset selected columns if a new file is uploaded
            setTreatmentColumn('');
            setOutcomeColumn('');
        } else {
            setCsvColumns([]);
        }
        setError(null); // Clear previous errors
        setResults(null); // Clear previous results
    };

    // Function to handle workflow task checkbox changes
    const handleWorkflowChange = (event) => {
        const { name, checked } = event.target;
        setWorkflowTasks(prev => ({ ...prev, [name]: checked }));
        // If causal analysis is unchecked, clear selected columns
        if (name === 'causalAnalysis' && !checked) {
            setTreatmentColumn('');
            setOutcomeColumn('');
        }
    };

    // Function to handle output type selection
    const handleOutputTypeChange = (event) => {
        setOutputType(event.target.value);
    };

    // Function to handle treatment column selection
    const handleTreatmentColumnChange = (event) => {
        setTreatmentColumn(event.target.value);
    };

    // Function to handle outcome column selection
    const handleOutcomeColumnChange = (event) => {
        setOutcomeColumn(event.target.value);
    };

    // Function to handle form submission
    const handleSubmit = async (event) => {
        event.preventDefault();
        setError(null);
        setResults(null);
        setIsLoading(true);

        // Input validation
        if (!selectedFile) {
            setError("Please upload a CSV file to proceed.");
            setIsLoading(false);
            return;
        }

        if (workflowTasks.causalAnalysis && (!treatmentColumn || !outcomeColumn)) {
            setError("For Causal Analysis, please select both Treatment and Outcome columns.");
            setIsLoading(false);
            return;
        }

        // Create FormData to send file and JSON config
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('workflow_config', JSON.stringify({
            ...workflowTasks,
            output_type: outputType,
            // Only include treatment/outcome if causal analysis is selected
            treatment_column: workflowTasks.causalAnalysis ? treatmentColumn : null,
            outcome_column: workflowTasks.causalAnalysis ? outcomeColumn : null,
        }));

        try {
            // Send data to backend (replace with your actual backend URL)
            // Assuming your backend runs on http://127.0.0.1:8000
            const response = await fetch('http://127.0.0.1:8000/process/', {
                method: 'POST',
                body: formData,
                // No 'Content-Type' header needed for FormData; browser sets it automatically
            });

            // Check if the response was successful
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.detail || 'Workflow processing failed on the server.');
            }

            const data = await response.json();
            setResults(data); // Store results from backend
        } catch (err) {
            setError(`Operation failed: ${err.message}`); // Display detailed error
        } finally {
            setIsLoading(false); // Always hide loading spinner
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-3xl border border-gray-200">
                <h1 className="text-4xl font-extrabold text-center text-gray-900 mb-8">
                    Start Your AI Workflow
                </h1>
                <p className="text-center text-gray-600 mb-10 text-lg">
                    Follow these steps to automate your data tasks:
                </p>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Section 1: Data Upload */}
                    <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Upload Your Data</h2>
                        <label htmlFor="csvFile" className="block text-lg font-medium text-gray-700 mb-2">
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
                        {selectedFile && (
                            <p className="mt-3 text-sm text-gray-600">
                                File selected: <span className="font-medium text-blue-700">{selectedFile.name}</span>
                            </p>
                        )}
                        {csvColumns.length > 0 && (
                            <p className="mt-2 text-sm text-gray-600">
                                Detected columns: <span className="font-medium">{csvColumns.join(', ')}</span>
                            </p>
                        )}
                    </div>

                    {/* Section 2: Configure Workflow */}
                    <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Configure Workflow Tasks</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label className="flex items-center p-3 bg-white rounded-md shadow-sm cursor-pointer hover:bg-gray-100 transition duration-150">
                                <input
                                    type="checkbox"
                                    name="cleanData"
                                    checked={workflowTasks.cleanData}
                                    onChange={handleWorkflowChange}
                                    className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="ml-3 text-gray-800 font-medium">Clean Data</span>
                            </label>
                            <label className="flex items-center p-3 bg-white rounded-md shadow-sm cursor-pointer hover:bg-gray-100 transition duration-150">
                                <input
                                    type="checkbox"
                                    name="causalAnalysis"
                                    checked={workflowTasks.causalAnalysis}
                                    onChange={handleWorkflowChange}
                                    className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
                                />
                                <span className="ml-3 text-gray-800 font-medium">Causal Analysis</span>
                            </label>
                            <label className="flex items-center p-3 bg-white rounded-md shadow-sm opacity-60 cursor-not-allowed">
                                <input
                                    type="checkbox"
                                    name="forecasting"
                                    checked={workflowTasks.forecasting}
                                    onChange={handleWorkflowChange}
                                    className="form-checkbox h-5 w-5 text-blue-600 rounded"
                                    disabled // Disabled for Week 2, enable in Week 3
                                />
                                <span className="ml-3 text-gray-800">Forecasting <span className="text-xs text-gray-500">(Coming Soon)</span></span>
                            </label>
                            <label className="flex items-center p-3 bg-white rounded-md shadow-sm opacity-60 cursor-not-allowed">
                                <input
                                    type="checkbox"
                                    name="simulation"
                                    checked={workflowTasks.simulation}
                                    onChange={handleWorkflowChange}
                                    className="form-checkbox h-5 w-5 text-blue-600 rounded"
                                    disabled // Disabled for Week 2, enable in Week 3
                                />
                                <span className="ml-3 text-gray-800">Simulation <span className="text-xs text-gray-500">(Coming Soon)</span></span>
                            </label>
                        </div>

                        {/* Conditional: Treatment and Outcome Column Selection */}
                        {workflowTasks.causalAnalysis && csvColumns.length > 0 && (
                            <div className="mt-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
                                <h3 className="text-xl font-semibold text-blue-800 mb-3">Causal Analysis Configuration</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label htmlFor="treatmentColumn" className="block text-md font-medium text-gray-700 mb-1">
                                            Treatment Column:
                                        </label>
                                        <select
                                            id="treatmentColumn"
                                            value={treatmentColumn}
                                            onChange={handleTreatmentColumnChange}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                                        >
                                            <option value="">Select a column</option>
                                            {csvColumns.map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="outcomeColumn" className="block text-md font-medium text-gray-700 mb-1">
                                            Outcome Column:
                                        </label>
                                        <select
                                            id="outcomeColumn"
                                            value={outcomeColumn}
                                            onChange={handleOutcomeColumnChange}
                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                                        >
                                            <option value="">Select a column</option>
                                            {csvColumns.map(col => (
                                                <option key={col} value={col}>{col}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}
                        {workflowTasks.causalAnalysis && csvColumns.length === 0 && (
                            <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded relative" role="alert">
                                Please upload a CSV file first to see available columns for Causal Analysis.
                            </div>
                        )}
                    </div>

                    {/* Section 3: Output Type */}
                    <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
                        <h2 className="text-2xl font-semibold text-gray-800 mb-4">3. Choose Output Type</h2>
                        <div>
                            <label htmlFor="outputType" className="block text-lg font-medium text-gray-700 mb-2">
                                How would you like to view the results?
                            </label>
                            <select
                                id="outputType"
                                value={outputType}
                                onChange={handleOutputTypeChange}
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                            >
                                <option value="dashboard">Dashboard (Interactive Summary)</option>
                                <option value="report">Report (Detailed JSON/Text)</option>
                            </select>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={isLoading || !selectedFile || (workflowTasks.causalAnalysis && (!treatmentColumn || !outcomeColumn))}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-md text-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-700 hover:to-purple-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-300 ease-in-out transform hover:scale-105
                                   disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-500"
                    >
                        {isLoading ? (
                            <svg className="animate-spin h-6 w-6 mr-3 border-4 border-t-4 border-gray-200 rounded-full" viewBox="0 0 24 24"></svg>
                        ) : (
                            "Run AI Workflow"
                        )}
                    </button>
                </form>

                {/* Error Display */}
                {error && (
                    <div className="mt-8 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg relative shadow-md" role="alert">
                        <strong className="font-bold">Error!</strong>
                        <span className="block sm:inline ml-2">{error}</span>
                    </div>
                )}

                {/* Results Display */}
                {results && (
                    <div className="mt-8 p-6 bg-green-50 border border-green-300 text-green-800 rounded-lg shadow-inner animate-fade-in">
                        <h3 className="text-3xl font-bold mb-4 text-green-900">Workflow Results:</h3>
                        {/* Display cleaned dataset shape */}
                        {results.cleaned_data_shape && (
                            <p className="text-lg mb-2">
                                <span className="font-semibold">Cleaned Data Shape:</span> Rows - {results.cleaned_data_shape.rows}, Columns - {results.cleaned_data_shape.columns}
                            </p>
                        )}
                        {/* Display causal analysis results */}
                        {results.causal_analysis_results && (
                            <div className="mt-4">
                                <h4 className="text-xl font-semibold text-green-800 mb-2">Causal Analysis Output:</h4>
                                <pre className="bg-green-100 p-4 rounded-md overflow-auto text-sm text-gray-800 border border-green-200">
                                    <code>{JSON.stringify(results.causal_analysis_results, null, 2)}</code>
                                </pre>
                            </div>
                        )}
                        {/* General JSON output (fallback/detailed view) */}
                        <div className="mt-4">
                            <h4 className="text-xl font-semibold text-green-800 mb-2">Full Workflow Output (JSON):</h4>
                            <pre className="bg-green-100 p-4 rounded-md overflow-auto text-sm text-gray-800 border border-green-200">
                                <code>{JSON.stringify(results, null, 2)}</code>
                            </pre>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
