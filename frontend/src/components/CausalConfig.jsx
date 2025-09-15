import React from 'react'

export const CausalConfig = ({
  selectedFile,
  csvColumns,
  treatmentColumn,
  outcomeColumn,
  onFileChange,
  onWorkflowChange,
  workflowTasks,
  onTreatmentChange,
  onOutcomeChange,
  alphaValue,
  onAlphaChange,
  estimator,
  onEstimatorChange,
}) => {
  return (
    <>
      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">1. Upload Your Data</h2>
        <label htmlFor="csvFile" className="block text-lg font-medium text-gray-700 mb-2">
          Select a CSV File:
        </label>
        <input
          type="file"
          id="csvFile"
          accept=".csv"
          onChange={onFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-100 file:text-blue-700 hover:file:bg-blue-200 cursor-pointer transition duration-200"
        />
        {selectedFile && (
          <p className="mt-3 text-sm text-gray-600">
            File selected: <span className="font-medium text-blue-700">{selectedFile.name}</span>
          </p>
        )}
        {csvColumns?.length > 0 && (
          <p className="mt-2 text-sm text-gray-600">
            Detected columns: <span className="font-medium">{csvColumns.join(', ')}</span>
          </p>
        )}
      </div>

      <div className="p-6 border border-gray-200 rounded-lg bg-gray-50 shadow-sm">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">2. Configure Workflow Tasks</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="flex items-center p-3 bg-white rounded-md shadow-sm cursor-pointer hover:bg-gray-100 transition duration-150">
            <input
              type="checkbox"
              name="causalAnalysis"
              checked={workflowTasks.causalAnalysis}
              onChange={onWorkflowChange}
              className="form-checkbox h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
            />
            <span className="ml-3 text-gray-800 font-medium">Causal Analysis</span>
          </label>
          <label className="flex items-center p-3 bg-white rounded-md shadow-sm opacity-60 cursor-not-allowed">
            <input type="checkbox" name="forecasting" checked={workflowTasks.forecasting} onChange={onWorkflowChange} className="form-checkbox h-5 w-5 text-blue-600 rounded" disabled />
            <span className="ml-3 text-gray-800">Forecasting <span className="text-xs text-gray-500">(Coming Soon)</span></span>
          </label>
          <label className="flex items-center p-3 bg-white rounded-md shadow-sm opacity-60 cursor-not-allowed">
            <input type="checkbox" name="simulation" checked={workflowTasks.simulation} onChange={onWorkflowChange} className="form-checkbox h-5 w-5 text-blue-600 rounded" disabled />
            <span className="ml-3 text-gray-800">Simulation <span className="text-xs text-gray-500">(Coming Soon)</span></span>
          </label>
        </div>

        {workflowTasks.causalAnalysis && csvColumns?.length > 0 && (
          <div className="mt-6 p-4 border border-blue-200 bg-blue-50 rounded-lg">
            <h3 className="text-xl font-semibold text-blue-800 mb-3">Causal Analysis Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="treatmentColumn" className="block text-md font-medium text-gray-700 mb-1">Treatment Column:</label>
                <select id="treatmentColumn" value={treatmentColumn} onChange={onTreatmentChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm">
                  <option value="">None</option>
                  {csvColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="outcomeColumn" className="block text-md font-medium text-gray-700 mb-1">Outcome Column:</label>
                <select id="outcomeColumn" value={outcomeColumn} onChange={onOutcomeChange} className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm">
                  <option value="">None</option>
                  {csvColumns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Advanced (Alpha and Estimator) */}
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="alpha" className="block text-md font-medium text-gray-700 mb-1">PC Test Alpha (significance):</label>
                <div className="flex items-center gap-3">
                  <input
                    id="alpha"
                    type="range"
                    min="0.001"
                    max="0.2"
                    step="0.001"
                    value={alphaValue}
                    onChange={(e) => onAlphaChange(parseFloat(e.target.value))}
                    className="w-full accent-blue-600"
                  />
                  <input
                    type="number"
                    min="0.001"
                    max="0.2"
                    step="0.001"
                    value={alphaValue}
                    onChange={(e) => onAlphaChange(Number(e.target.value))}
                    className="w-24 pl-3 pr-2 py-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                  />
                </div>
                <p className="text-xs text-gray-600 mt-1">Default 0.05. Higher alpha finds more edges (less strict); lower finds fewer.</p>
              </div>
              <div>
                <label htmlFor="estimator" className="block text-md font-medium text-gray-700 mb-1">Estimator:</label>
                <select
                  id="estimator"
                  value={estimator}
                  onChange={(e) => onEstimatorChange(e.target.value)}
                  className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md shadow-sm"
                >
                  <option value="backdoor.linear_regression">Linear regression (backdoor)</option>
                  <option value="backdoor.propensity_score_matching">Propensity score matching (ATT)</option>
                </select>
                <p className="text-xs text-gray-600 mt-1">Defaults to linear regression for stable numbers.</p>
              </div>
            </div>
          </div>
        )}
        {workflowTasks.causalAnalysis && (csvColumns?.length || 0) === 0 && (
          <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded relative" role="alert">
            Please upload a CSV file first to see available columns for Causal Analysis.
          </div>
        )}
      </div>
    </>
  )
}
