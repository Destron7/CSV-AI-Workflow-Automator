import React from 'react'
import { FlowDAG } from './FlowDAG'
import { CausalConfig } from './CausalConfig'

export const GetStarted = () => {
    const [selectedFile, setSelectedFile] = React.useState(null);
    const [csvColumns, setCsvColumns] = React.useState([]);
    const [workflowTasks, setWorkflowTasks] = React.useState({
        causalAnalysis: false,
        forecasting: false,
        simulation: false,
    });
    const [outputType, setOutputType] = React.useState('dashboard');
    const [treatmentColumn, setTreatmentColumn] = React.useState('');
    const [outcomeColumn, setOutcomeColumn] = React.useState('');
    const [alpha, setAlpha] = React.useState(0.05);
    const [estimator, setEstimator] = React.useState('backdoor.linear_regression');
    const [results, setResults] = React.useState(null);
    const [error, setError] = React.useState(null);
    const [isLoading, setIsLoading] = React.useState(false);

    // CSV header parsing
    const parseCSVHeader = (line, sep = ',') => {
        const cols = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
                else { inQuotes = !inQuotes; }
            } else if (ch === sep && !inQuotes) { cols.push(current.trim()); current=''; }
            else { current += ch; }
        }
        cols.push(current.trim());
        return cols.map(c => (c.startsWith('"') && c.endsWith('"') ? c.slice(1,-1) : c));
    };

    const readerRef = React.useRef(null);
    const isMountedRef = React.useRef(true);
    React.useEffect(() => { isMountedRef.current = true; return () => { isMountedRef.current = false; if (readerRef.current) { try { readerRef.current.abort && readerRef.current.abort(); } catch {} } }; }, []);

    const handleFileChange = React.useCallback((event) => {
        const file = event.target.files[0];
        setSelectedFile(file || null);
        setError(null);
        setResults(null);
        setCsvColumns([]);
        setTreatmentColumn('');
        setOutcomeColumn('');
        if (!file) return;
        try {
            if (readerRef.current && readerRef.current.abort) { try { readerRef.current.abort(); } catch {} }
            const blob = file.slice(0, 64 * 1024);
            const reader = new FileReader();
            readerRef.current = reader;
            reader.onload = () => {
                if (!isMountedRef.current) return;
                const text = String(reader.result || '');
                const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/).filter(ln => ln.trim().length>0);
                let sep = ','; let startIdx = 0;
                if (lines[0] && /^sep\s*=\s*./i.test(lines[0])) { const m = lines[0].match(/^sep\s*=\s*(.)/i); if (m) sep = m[1]; startIdx = 1; }
                const headerLine = lines[startIdx] || '';
                const headers = parseCSVHeader(headerLine, sep).filter(h => h !== '');
                setCsvColumns(headers);
                if (headers.length > 1) { setWorkflowTasks(prev => (prev.causalAnalysis ? prev : { ...prev, causalAnalysis: true })); }
                if (!treatmentColumn && !outcomeColumn && headers.length > 1) {
                    const idRegex = /id|uuid|key/i;
                    const tGuess = headers.find(h => !idRegex.test(h)) || headers[0];
                    const yGuess = headers[headers.length - 1] !== tGuess ? headers[headers.length - 1] : headers[Math.max(0, headers.length - 2)];
                    setTreatmentColumn(tGuess);
                    setOutcomeColumn(yGuess);
                }
            };
            reader.onerror = () => { if (!isMountedRef.current) return; setCsvColumns([]); };
            reader.readAsText(blob);
        } catch { setCsvColumns([]); }
    }, [treatmentColumn, outcomeColumn]);

    const handleWorkflowChange = React.useCallback((event) => {
        const { name, checked } = event.target;
        setWorkflowTasks(prev => ({ ...prev, [name]: checked }));
        if (name === 'causalAnalysis' && !checked) { setTreatmentColumn(''); setOutcomeColumn(''); }
    }, []);
    const handleOutputTypeChange = React.useCallback(e => setOutputType(e.target.value), []);
    const handleTreatmentColumnChange = React.useCallback(e => setTreatmentColumn(e.target.value), []);
    const handleOutcomeColumnChange = React.useCallback(e => setOutcomeColumn(e.target.value), []);

    const submitDisabled = React.useMemo(() => {
        if (isLoading || !selectedFile) return true;
        if (workflowTasks.causalAnalysis && (!treatmentColumn || !outcomeColumn)) return true;
        if (!workflowTasks.causalAnalysis) return true;
        return false;
    }, [isLoading, selectedFile, workflowTasks, treatmentColumn, outcomeColumn]);

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

        if (!workflowTasks.causalAnalysis) {
            setError("Please enable Causal Analysis to run this workflow here.");
            setIsLoading(false);
            return;
        }

        // Create FormData for causal analyze-auto endpoint
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('treatment', treatmentColumn);
        formData.append('outcome', outcomeColumn);
        formData.append('alpha', String(alpha));
        formData.append('estimator', estimator);
        formData.append('remove_duplicates', 'true');

        try {
            // Call backend to auto-clean (if needed) and run causal analysis
            const response = await fetch('http://localhost:8000/api/v1/causal/analyze-auto/', {
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
                    <CausalConfig
                        selectedFile={selectedFile}
                        csvColumns={csvColumns}
                        treatmentColumn={treatmentColumn}
                        outcomeColumn={outcomeColumn}
                        onFileChange={handleFileChange}
                        onWorkflowChange={handleWorkflowChange}
                        workflowTasks={workflowTasks}
                        onTreatmentChange={handleTreatmentColumnChange}
                        onOutcomeChange={handleOutcomeColumnChange}
                        alphaValue={alpha}
                        onAlphaChange={setAlpha}
                        estimator={estimator}
                        onEstimatorChange={setEstimator}
                    />

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
                        disabled={submitDisabled}
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
                    outputType === 'dashboard' ? (
                        // Dashboard: only show graph and summary
                        <div className="mt-8 p-6 bg-green-50 border border-green-300 text-green-800 rounded-lg shadow-inner animate-fade-in">
                            <h3 className="text-3xl font-bold mb-4 text-green-900">Workflow Results</h3>
                            {results.causal?.learned_graph && (
                                <div className="mt-2 border rounded bg-gray-50 p-2">
                                    <FlowDAG learned={results.causal.learned_graph} treatmentColumn={treatmentColumn} outcomeColumn={outcomeColumn} />
                                </div>
                            )}
                            {/* Effect Score Card */}
                            {results.causal?.effect_size && (
                                <div className="mt-4 grid gap-3 md:grid-cols-2">
                                    <div className="p-4 bg-white border rounded shadow-sm">
                                        <h4 className="font-semibold text-gray-800 mb-1">Effect Score</h4>
                                        {(() => {
                                            const es = results.causal.effect_size;
                                            if (es.error) return <p className="text-sm text-red-600">{es.error}</p>;
                                            const score = es.effect_score;
                                            const standardized = es.standardized_effect;
                                            const pct = es.percent_of_outcome_mean;
                                            return (
                                                <div className="text-sm text-gray-700 space-y-1">
                                                    <div className="text-2xl font-bold text-indigo-600">{score != null && !isNaN(score) ? Number(score).toFixed(2) : '—'}</div>
                                                    {standardized != null && !isNaN(standardized) && <div>Std Effect: {standardized.toFixed(2)}</div>}
                                                    {pct != null && !isNaN(pct) && <div>Percent of Outcome Mean: {pct.toFixed(2)}%</div>}
                                                    {es.group_mean_diff != null && !isNaN(es.group_mean_diff) && <div>Binary Group Mean Diff: {Number(es.group_mean_diff).toFixed(3)}</div>}
                                                    <div className="text-xs text-gray-500">Effect Score prioritizes standardized effect, then percent of mean, then raw estimate.</div>
                                                </div>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                            {/* Final plain-English causal statement */}
                            {(() => {
                                const val = results.causal?.estimate_value;
                                if (val === undefined || val === null || isNaN(val)) return null;
                                const v = Number(val);
                                const direction = v > 0 ? 'increases' : (v < 0 ? 'decreases' : 'has no measurable effect on');
                                const mag = Math.abs(v).toFixed(3);
                                const t = treatmentColumn || 'treatment';
                                const y = outcomeColumn || 'outcome';
                                const es = results.causal?.effect_size || {};
                                const pct = (es.percent_of_outcome_mean != null && !isNaN(es.percent_of_outcome_mean)) ? es.percent_of_outcome_mean.toFixed(2) + '%' : null;
                                const stdEff = (es.standardized_effect != null && !isNaN(es.standardized_effect)) ? es.standardized_effect.toFixed(2) : null;
                                return (
                                    <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-900">
                                        <span className="font-semibold">Summary:</span> A one-unit increase in <span className="font-semibold">{t}</span> {direction} <span className="font-semibold">{y}</span> by approximately <span className="font-semibold">{mag}</span> (model-based estimate).
                                        {(pct || stdEff) && (
                                            <div className="mt-2 text-sm">
                                                <span className="font-semibold">Effect Context:</span>
                                                {pct && <span className="ml-2">≈ {pct} of outcome mean</span>}
                                                {stdEff && <span className="ml-2">Std. Effect (≈ Cohen d): {stdEff}</span>}
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    ) : (
                        // Report: show full details and JSON
                        <div className="mt-8 p-6 bg-green-50 border border-green-300 text-green-800 rounded-lg shadow-inner animate-fade-in"> 
                            <h3 className="text-3xl font-bold mb-4 text-green-900">Workflow Results</h3>

                            {/* Cleaning Summary */}
                            <div className="p-4 bg-white rounded border border-green-200">
                                <p><span className="font-semibold">Cleaning Performed:</span> {String(results.cleaning_performed)}</p>
                                {typeof results.original_rows === 'number' && (
                                    <p><span className="font-semibold">Original Rows:</span> {results.original_rows}</p>
                                )}
                                {typeof results.cleaned_rows === 'number' && (
                                    <p><span className="font-semibold">Cleaned Rows:</span> {results.cleaned_rows}</p>
                                )}
                                {typeof results.total_rows_removed === 'number' && (
                                    <p><span className="font-semibold">Total Rows Removed:</span> {results.total_rows_removed}</p>
                                )}
                                {results.cleaning_summary && (
                                    <p className="text-sm text-gray-700 mt-2">{results.cleaning_summary}</p>
                                )}
                            </div>

                            {/* Causal Results */}
                            {results.causal && (
                                <div className="mt-4 p-4 bg-white rounded border border-green-200">
                                    <h4 className="text-xl font-semibold text-green-800 mb-2">Causal Analysis</h4>
                                    {results.causal.learned_graph && (
                                        <div className="mb-3">
                                            <p className="font-medium">Graph (PC, alpha={results.causal.learned_graph.alpha}):</p>
                                            <p className="text-sm text-gray-700">Nodes: {results.causal.learned_graph.nodes?.join(', ')}</p>
                                            <ul className="list-disc list-inside text-sm mt-1">
                                                {(results.causal.learned_graph.edges || []).map((e, idx) => (
                                                    <li key={idx}>{e.source} → {e.target}</li>
                                                ))}
                                            </ul>
                                            <div className="mt-4 border rounded bg-gray-50 p-2">
                                                <FlowDAG learned={results.causal.learned_graph} treatmentColumn={treatmentColumn} outcomeColumn={outcomeColumn} />
                                            </div>
                                        </div>
                                    )}
                                    {results.causal.estimand && (
                                        <div className="mt-2">
                                            <p className="font-medium">Estimand:</p>
                                            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{results.causal.estimand}</pre>
                                        </div>
                                    )}
                                    {results.causal.estimate_value !== undefined && (
                                        <div className="mt-2">
                                            <p className="font-medium">Estimate Value:</p>
                                            <p>{String(results.causal.estimate_value)}</p>
                                        </div>
                                    )}
                                    {results.causal.estimate && (
                                        <div className="mt-2">
                                            <p className="font-medium">Estimate:</p>
                                            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{results.causal.estimate}</pre>
                                        </div>
                                    )}
                                    {results.causal.refutation && (
                                        <div className="mt-2">
                                            <p className="font-medium">Refutation:</p>
                                            <pre className="text-xs bg-gray-50 p-2 rounded overflow-auto">{results.causal.refutation}</pre>
                                        </div>
                                    )}

                                    {/* Final plain-English causal statement */}
                                    {(() => {
                                        const val = results.causal?.estimate_value;
                                        if (val === undefined || val === null || isNaN(val)) return null;
                                        const v = Number(val);
                                        const direction = v > 0 ? 'increases' : (v < 0 ? 'decreases' : 'has no measurable effect on');
                                        const mag = Math.abs(v).toFixed(3);
                                        const t = treatmentColumn || 'treatment';
                                        const y = outcomeColumn || 'outcome';
                                        const es = results.causal?.effect_size || {};
                                        const pct = (es.percent_of_outcome_mean != null && !isNaN(es.percent_of_outcome_mean)) ? es.percent_of_outcome_mean.toFixed(2) + '%' : null;
                                        const stdEff = (es.standardized_effect != null && !isNaN(es.standardized_effect)) ? es.standardized_effect.toFixed(2) : null;
                                        const groupDiff = (es.group_mean_diff != null && !isNaN(es.group_mean_diff)) ? es.group_mean_diff.toFixed(3) : null;
                                        return (
                                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-blue-900">
                                                <span className="font-semibold">Summary:</span> A one-unit increase in <span className="font-semibold">{t}</span> {direction} <span className="font-semibold">{y}</span> by approximately <span className="font-semibold">{mag}</span> (model-based estimate).
                                                <div className="mt-2 text-sm space-y-1">
                                                    <div className="font-semibold">Effect Size Metrics</div>
                                                        {es.error && <div className="text-red-600">{es.error}</div>}
                                                    {pct && <div>Relative to outcome mean: {pct}</div>}
                                                    {stdEff && <div>Standardized effect (≈ Cohen d): {stdEff}</div>}
                                                    {groupDiff && <div>Binary group mean diff (if applicable): {groupDiff}</div>}
                                                        {(!pct && !stdEff && !groupDiff && !es.error) && <div className="text-gray-600">No additional effect size metrics available.</div>}
                                                </div>
                                            </div>
                                        );
                                    })()}
                                </div>
                            )}

                            {/* Full JSON */}
                            <div className="mt-4">
                                <h4 className="text-xl font-semibold text-green-800 mb-2">Raw Output (JSON)</h4>
                                <pre className="bg-green-100 p-4 rounded-md overflow-auto text-sm text-gray-800 border border-green-200">
                                    <code>{JSON.stringify(results, null, 2)}</code>
                                </pre>
                            </div>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
