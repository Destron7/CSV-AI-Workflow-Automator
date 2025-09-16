import React from 'react';

/**
 * ForecastPanel handles:
 *  - Selecting time column, target, optional exogenous columns (multi-select)
 *  - Horizon, seasonal toggle
 *  - Two-stage call: /forecast/analyze/ (validation) then fallback to /forecast/analyze-auto/ if cleaning needed
 *  - Displays forecast table + basic line visualization placeholder (simple SVG for now)
 */
export const ForecastPanel = ({
  csvColumns,
  selectedFile,
  workflowActive,
}) => {
  const [timeColumn, setTimeColumn] = React.useState('');
  const [targetColumn, setTargetColumn] = React.useState('');
  const [exogenousSelected, setExogenousSelected] = React.useState([]);
  const [horizon, setHorizon] = React.useState(12);
  const [seasonal, setSeasonal] = React.useState(true);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState(null);
  const [result, setResult] = React.useState(null);
  const [validation, setValidation] = React.useState(null);
  // Plot enhancements
  const containerRef = React.useRef(null);
  const [plotW, setPlotW] = React.useState(640);
  const [hoverIdx, setHoverIdx] = React.useState(null);

  React.useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const w = entry.contentRect.width;
        if (w && Math.abs(w - plotW) > 10) setPlotW(w);
      }
    });
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, [plotW]);

  React.useEffect(() => {
    if (csvColumns?.length) {
      if (!timeColumn) {
        // Heuristic pick: first column with date/time keyword
        const guess = csvColumns.find(c => /date|time|timestamp/i.test(c)) || csvColumns[0];
        setTimeColumn(guess);
      }
      if (!targetColumn && csvColumns.length > 1) {
        setTargetColumn(csvColumns[csvColumns.length - 1]);
      }
    }
  }, [csvColumns, timeColumn, targetColumn]);

  const toggleExogenous = (col) => {
    setExogenousSelected(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const canSubmit = selectedFile && workflowActive && targetColumn && timeColumn && !isLoading;

  const runForecast = async () => {
    setError(null);
    setResult(null);
    setValidation(null);
    if (!canSubmit) return;
    setIsLoading(true);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('target', targetColumn);
      form.append('time_column', timeColumn);
      form.append('horizon', String(horizon));
      form.append('seasonal', String(seasonal));
      if (exogenousSelected.length) form.append('exogenous', exogenousSelected.join(','));

      // Stage 1: validation/clean check
      const resp = await fetch('http://localhost:8000/api/v1/forecast/analyze/', { method: 'POST', body: form });
      if (!resp.ok) throw new Error('Validation request failed');
      const data = await resp.json();
      if (data.cleaning_needed) {
        setValidation(data);
      } else {
        setResult(data);
      }
    } catch (e) {
      setError(e.message || 'Forecast validation failed');
    } finally {
      setIsLoading(false);
    }
  };

  const autoCleanAndRun = async () => {
    if (!selectedFile) return;
    setIsLoading(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', selectedFile);
      form.append('target', targetColumn);
      form.append('time_column', timeColumn);
      form.append('horizon', String(horizon));
      form.append('seasonal', String(seasonal));
      form.append('remove_duplicates', 'true');
      if (exogenousSelected.length) form.append('exogenous', exogenousSelected.join(','));
      const resp = await fetch('http://localhost:8000/api/v1/forecast/analyze-auto/', { method: 'POST', body: form });
      if (!resp.ok) throw new Error('Auto forecast failed');
      const data = await resp.json();
      setResult(data.forecast ? data : { forecast: data });
      setValidation(null);
    } catch (e) {
      setError(e.message || 'Auto forecasting failed');
    } finally {
      setIsLoading(false);
    }
  };

  const predictions = result?.forecast?.predictions || result?.predictions || [];
  const history = result?.forecast?.history || result?.history || [];
  const modelInfo = result?.forecast?.model || result?.model;
  const trainingInfo = result?.forecast?.training || result?.training;

  return (
    <div className="mt-8 p-6 bg-purple-50 border border-purple-300 rounded-lg shadow-inner">
      <h3 className="text-2xl font-bold text-purple-900 mb-4">Forecasting</h3>
      <p className="text-sm text-gray-700 mb-4">Train a SARIMAX model to predict future values of the selected target. If the data needs cleaning you'll be prompted to auto-clean.</p>

      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Time Column</label>
          <select value={timeColumn} onChange={e => setTimeColumn(e.target.value)} className="w-full border rounded px-2 py-1 text-sm">
            {csvColumns.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Target Column</label>
          <select value={targetColumn} onChange={e => setTargetColumn(e.target.value)} className="w-full border rounded px-2 py-1 text-sm">
            <option value="">Select target</option>
            {csvColumns.filter(c => c !== timeColumn).map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Forecast Horizon</label>
          <input type="number" min={1} max={500} value={horizon} onChange={e => setHorizon(Number(e.target.value))} className="w-full border rounded px-2 py-1 text-sm" />
        </div>
        <div className="flex items-center gap-2 mt-6">
          <input id="seasonalToggle" type="checkbox" checked={seasonal} onChange={e => setSeasonal(e.target.checked)} />
          <label htmlFor="seasonalToggle" className="text-sm text-gray-700">Seasonal</label>
        </div>
      </div>

      <div className="mt-4">
        <div className="text-sm font-medium text-gray-700 mb-1">Exogenous (Treatments) Columns</div>
        <div className="flex flex-wrap gap-2">
          {csvColumns.filter(c => c !== timeColumn && c !== targetColumn).map(c => (
            <button key={c} type="button" onClick={() => toggleExogenous(c)} className={`px-2 py-1 rounded text-xs border ${exogenousSelected.includes(c) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-700 border-gray-300'}`}>{c}</button>
          ))}
        </div>
        {exogenousSelected.length > 0 && (
          <p className="mt-2 text-xs text-gray-600">Selected: {exogenousSelected.join(', ')}</p>
        )}
      </div>

      <div className="mt-6 flex gap-4">
        <button disabled={!canSubmit} onClick={runForecast} className="px-4 py-2 bg-purple-600 text-white rounded shadow disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 text-sm font-semibold">{isLoading ? 'Working...' : 'Validate & Forecast'}</button>
        {validation?.cleaning_needed && (
          <button onClick={autoCleanAndRun} className="px-4 py-2 bg-orange-600 text-white rounded shadow hover:bg-orange-700 text-sm font-semibold">Auto-Clean & Run</button>
        )}
      </div>

      {error && <div className="mt-4 p-3 bg-red-100 border border-red-300 text-red-700 rounded text-sm">{error}</div>}

      {validation?.cleaning_needed && !result && (
        <div className="mt-6 p-4 bg-yellow-50 border border-yellow-300 rounded text-sm text-yellow-900">
          <div className="font-semibold mb-1">Cleaning Needed</div>
          <ul className="list-disc list-inside space-y-1">
            {(validation.issues || []).map((iss, i) => <li key={i}>{iss}</li>)}
          </ul>
          <p className="mt-2 text-xs text-gray-600">Use Auto-Clean & Run to proceed.</p>
        </div>
      )}

      {result && (
        <div className="mt-8">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="p-4 bg-white border rounded shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">Model</h4>
              {modelInfo && (
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>Order: {JSON.stringify(modelInfo.order)}</li>
                  <li>Seasonal: {JSON.stringify(modelInfo.seasonal_order)}</li>
                  <li>AIC: {modelInfo.aic?.toFixed ? modelInfo.aic.toFixed(2) : modelInfo.aic}</li>
                  <li>BIC: {modelInfo.bic?.toFixed ? modelInfo.bic.toFixed(2) : modelInfo.bic}</li>
                  <li>n_obs: {modelInfo.n_obs}</li>
                  <li>Freq: {modelInfo.freq || 'n/a'}</li>
                </ul>
              )}
            </div>
            <div className="p-4 bg-white border rounded shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">Training Window</h4>
              {trainingInfo && (
                <ul className="text-xs text-gray-700 space-y-1">
                  <li>Start: {trainingInfo.start}</li>
                  <li>End: {trainingInfo.end}</li>
                  <li>Mean: {trainingInfo.target_mean?.toFixed ? trainingInfo.target_mean.toFixed(3) : trainingInfo.target_mean}</li>
                  <li>Std: {trainingInfo.target_std?.toFixed ? trainingInfo.target_std.toFixed(3) : trainingInfo.target_std}</li>
                </ul>
              )}
            </div>
            <div className="p-4 bg-white border rounded shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-2 text-sm">Exogenous</h4>
              <p className="text-xs text-gray-700">{exogenousSelected.length ? exogenousSelected.join(', ') : 'None'}</p>
            </div>
          </div>

          {/* Enhanced line plot with confidence interval, responsive & hover */}
          {(predictions.length > 0 || history.length > 0) && (() => {
            // Compute scaled coordinates
            const forecastValues = predictions.map(p => p.forecast);
            const historyValues = history.map(h => h.actual);
            const lowers = predictions.map(p => p.lower_ci);
            const uppers = predictions.map(p => p.upper_ci);
            const all = [...forecastValues, ...historyValues, ...lowers, ...uppers].filter(v => typeof v === 'number' && isFinite(v));
            const minY = Math.min(...all);
            const maxY = Math.max(...all);
            const pad = (maxY - minY) * 0.08 || 1;
            const yMin = minY - pad;
            const yMax = maxY + pad;
            const h = 220;
            const innerPadLeft = 48;
            const innerPadRight = 16;
            const w = Math.max(320, plotW - 0);
            const usableW = w - innerPadLeft - innerPadRight;
            // Combine history + forecast along x: history first then forecast (distinct domain segments)
            const histCount = history.length;
            const totalPoints = histCount + predictions.length;
            const scaleX = (globalIndex) => innerPadLeft + (globalIndex / (totalPoints - 1 || 1)) * usableW;
            const scaleY = (v) => h - 30 - ((v - yMin) / (yMax - yMin || 1)) * (h - 60);
            const forecastLinePath = forecastValues.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(histCount + i)},${scaleY(v)}`).join(' ');
            const historyLinePath = historyValues.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(i)},${scaleY(v)}`).join(' ');
            const upperPath = uppers.map((v, i) => `${i === 0 ? 'M' : 'L'}${scaleX(histCount + i)},${scaleY(v)}`).join(' ');
            const lowerPathPoints = lowers.slice().reverse().map((v, ri) => {
              const i = lowers.length - 1 - ri; return `${scaleX(histCount + i)},${scaleY(v)}`;
            });
            const bandPath = `${uppers.length ? upperPath : ''} ${lowerPathPoints.length ? 'L' + lowerPathPoints.join(' L') : ''} Z`;

            // Build combined timestamps for ticks
            const combinedTimestamps = [
              ...history.map(h => h.timestamp),
              ...predictions.map(p => p.timestamp)
            ];
            const xTicksCount = Math.min(8, combinedTimestamps.length);
            const xTickIdxs = Array.from({ length: xTicksCount }, (_, k) => Math.round(k * (combinedTimestamps.length - 1) / (xTicksCount - 1 || 1)));
            const formatTs = (ts) => {
              // Try to shorten ISO datetime
              if (!ts) return '';
              if (/T/.test(ts)) return ts.split('T')[0];
              return ts.length > 16 ? ts.slice(0, 16) : ts;
            };

            const onMove = (evt) => {
              const rect = evt.currentTarget.getBoundingClientRect();
              const x = evt.clientX - rect.left;
              // invert scaleX approximately
              const rel = (x - innerPadLeft) / usableW;
              const idx = Math.min(totalPoints - 1, Math.max(0, Math.round(rel * (totalPoints - 1))));
              setHoverIdx(idx);
            };
            const onLeave = () => setHoverIdx(null);

            const isForecastPoint = hoverIdx != null && hoverIdx >= histCount;
            const forecastIdx = isForecastPoint ? hoverIdx - histCount : null;
            const hoverForecastPoint = forecastIdx != null ? predictions[forecastIdx] : null;
            const hoverHistoryPoint = hoverIdx != null && hoverIdx < histCount ? history[hoverIdx] : null;
            const hoverX = hoverIdx != null ? scaleX(hoverIdx) : null;
            const hoverYVal = isForecastPoint ? (forecastIdx != null ? forecastValues[forecastIdx] : null) : (hoverHistoryPoint ? hoverHistoryPoint.actual : null);
            const hoverY = hoverYVal != null ? scaleY(hoverYVal) : null;
            return (
              <div className="mt-6 p-4 bg-white border rounded shadow-sm" ref={containerRef}>
                <h4 className="font-semibold text-gray-800 mb-3 text-sm flex items-center gap-4">Forecast (Line Plot)
                  <span className="flex items-center gap-2 text-[10px] text-gray-500">
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-1 bg-gray-500 inline-block" /> Actual</span>
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-1 bg-indigo-500 inline-block" /> Forecast</span>
                    <span className="inline-flex items-center gap-1"><span className="w-3 h-3 bg-indigo-200/70 border border-indigo-300 inline-block" /> CI</span>
                  </span>
                </h4>
                <div className="overflow-hidden">
                  <svg width={w} height={h} className="select-none" onMouseMove={onMove} onMouseLeave={onLeave} role="img" aria-label="Forecast line chart with confidence interval">
                    <defs>
                      <linearGradient id="ciBand" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
                      </linearGradient>
                    </defs>
                    {/* Axes */}
                    <line x1={innerPadLeft} x2={innerPadLeft} y1={10} y2={h - 30} stroke="#9ca3af" strokeWidth={1} />
                    <line x1={innerPadLeft} x2={w - innerPadRight} y1={h - 30} y2={h - 30} stroke="#9ca3af" strokeWidth={1} />
                    {/* Y grid & labels */}
                    {[0, 0.25, 0.5, 0.75, 1].map(f => {
                      const yVal = yMin + f * (yMax - yMin);
                      const y = scaleY(yVal);
                      return <g key={f}>
                        <line x1={innerPadLeft} x2={w - innerPadRight} y1={y} y2={y} stroke="#e5e7eb" strokeWidth={1} />
                        <text x={innerPadLeft - 6} y={y + 3} fontSize="10" fill="#6b7280" textAnchor="end">{yVal.toFixed(2)}</text>
                      </g>
                    })}
                    {/* X ticks */}
                    {xTickIdxs.map(i => {
                      const x = scaleX(i);
                      return <g key={i}>
                        <line x1={x} x2={x} y1={h - 30} y2={h - 26} stroke="#6b7280" />
                        <text x={x} y={h - 14} fontSize="10" fill="#6b7280" textAnchor="middle">{formatTs(predictions[i]?.timestamp)}</text>
                      </g>
                    })}
                    {/* Confidence band (only over forecast region) */}
                    <path d={bandPath} fill="url(#ciBand)" stroke="none" />
                    {/* History line */}
                    {historyValues.length > 0 && <path d={historyLinePath} fill="none" stroke="#6b7280" strokeWidth={1.5} />}
                    {/* Forecast line */}
                    {forecastValues.length > 0 && <path d={forecastLinePath} fill="none" stroke="#4f46e5" strokeWidth={2} />}
                    {/* History points */}
                    {historyValues.map((v, i) => (
                      <circle key={'h' + i} cx={scaleX(i)} cy={scaleY(v)} r={2.2} fill={hoverIdx === i ? "#374151" : "#6b7280"} />
                    ))}
                    {/* Forecast points */}
                    {forecastValues.map((v, i) => (
                      <circle key={'f' + i} cx={scaleX(histCount + i)} cy={scaleY(v)} r={2.6} fill={hoverIdx === (histCount + i) ? "#4338ca" : "#6366f1"} />
                    ))}
                    {/* Hover indicator */}
                    {hoverIdx != null && (
                      <g>
                        <line x1={hoverX} x2={hoverX} y1={10} y2={h - 30} stroke="#6366f1" strokeDasharray="3,3" />
                        <circle cx={hoverX} cy={hoverY} r={4} fill="#ffffff" stroke="#4f46e5" strokeWidth={2} />
                      </g>
                    )}
                  </svg>
                </div>
                {(hoverHistoryPoint || hoverForecastPoint) && (
                  <div className="mt-2 inline-flex items-start gap-4 bg-indigo-50 border border-indigo-200 rounded px-3 py-2 text-[11px] text-indigo-900 shadow-sm">
                    <div><span className="font-semibold">t:</span> {hoverHistoryPoint ? hoverHistoryPoint.timestamp : hoverForecastPoint.timestamp}</div>
                    {hoverHistoryPoint && (
                      <div><span className="font-semibold">actual:</span> {hoverHistoryPoint.actual?.toFixed ? hoverHistoryPoint.actual.toFixed(3) : hoverHistoryPoint.actual}</div>
                    )}
                    {hoverForecastPoint && (
                      <>
                        <div><span className="font-semibold">forecast:</span> {hoverForecastPoint.forecast?.toFixed ? hoverForecastPoint.forecast.toFixed(3) : hoverForecastPoint.forecast}</div>
                        <div><span className="font-semibold">CI:</span> [{hoverForecastPoint.lower_ci?.toFixed ? hoverForecastPoint.lower_ci.toFixed(3) : hoverForecastPoint.lower_ci}, {hoverForecastPoint.upper_ci?.toFixed ? hoverForecastPoint.upper_ci.toFixed(3) : hoverForecastPoint.upper_ci}]</div>
                      </>
                    )}
                  </div>
                )}
                {!(hoverHistoryPoint || hoverForecastPoint) && <p className="mt-2 text-xs text-gray-500">Hover chart to inspect actual & forecast points. Shaded band = forecast confidence interval.</p>}
              </div>
            );
          })()}
          {predictions.length > 0 && (
            <div className="mt-6 p-4 bg-white border rounded shadow-sm">
              <h4 className="font-semibold text-gray-800 mb-3 text-sm">Forecast (Table)</h4>
              <div className="overflow-auto">
                <table className="min-w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100 text-gray-700">
                      <th className="px-2 py-1 text-left font-semibold">#</th>
                      <th className="px-2 py-1 text-left font-semibold">Timestamp</th>
                      <th className="px-2 py-1 text-left font-semibold">Forecast</th>
                      <th className="px-2 py-1 text-left font-semibold">Lower CI</th>
                      <th className="px-2 py-1 text-left font-semibold">Upper CI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {predictions.map((p, i) => (
                      <tr key={i} className="border-b last:border-0 hover:bg-gray-50">
                        <td className="px-2 py-1">{i + 1}</td>
                        <td className="px-2 py-1 whitespace-nowrap">{p.timestamp}</td>
                        <td className="px-2 py-1">{p.forecast?.toFixed ? p.forecast.toFixed(3) : p.forecast}</td>
                        <td className="px-2 py-1">{p.lower_ci?.toFixed ? p.lower_ci.toFixed(3) : p.lower_ci}</td>
                        <td className="px-2 py-1">{p.upper_ci?.toFixed ? p.upper_ci.toFixed(3) : p.upper_ci}</td>
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
  );
};
