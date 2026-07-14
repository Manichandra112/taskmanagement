import React, { useState, useEffect } from 'react';
import { convertPersonWiseToTaskWise, convertTaskWiseToPersonWise } from '../utils/apiConverter';

export default function ApiConverterView({ tasks, onImportTasks }) {
  const sampleLegacyData = {
    "AAA - Today works": [
      { "date": "2026-04-07", "description": "Trichy land agreement to Rajkumar", "status": "Complete" },
      { "date": "2026-04-10", "description": "demt status mail - Rakesh Varma", "status": "Complete" }
    ],
    "Channel Partner": [
      { "date": "2026-07-14", "description": "Call Ayyappan and ask the status", "status": "Pending" }
    ],
    "Harish": [
      { "date": "2026-07-14", "description": "Unibull - Auditor resignation", "status": "Pending" }
    ]
  };

  const [inputJson, setInputJson] = useState(JSON.stringify(sampleLegacyData, null, 2));
  const [outputJson, setOutputJson] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Auto-convert legacy JSON input to Task-Wise output
  useEffect(() => {
    try {
      if (!inputJson.trim()) {
        setOutputJson('');
        setErrorMsg('');
        return;
      }
      const parsed = JSON.parse(inputJson);
      const converted = convertPersonWiseToTaskWise(parsed);
      setOutputJson(JSON.stringify(converted, null, 2));
      setErrorMsg('');
    } catch (err) {
      setErrorMsg(`Invalid JSON syntax: ${err.message}`);
      setOutputJson('');
    }
  }, [inputJson]);

  // Import converted tasks into the React state
  const handleImport = () => {
    try {
      const parsed = JSON.parse(outputJson);
      if (!Array.isArray(parsed)) {
        setErrorMsg("Output is not a valid task array. Please check input data.");
        return;
      }
      onImportTasks(parsed);
      alert(`Imported ${parsed.length} tasks successfully into the active state! Check the Dashboard or Task Board.`);
    } catch (err) {
      setErrorMsg(`Import failed: ${err.message}`);
    }
  };

  // Export current task-wise state back to legacy person-wise
  const handleExportState = () => {
    const exported = convertTaskWiseToPersonWise(tasks);
    setInputJson(JSON.stringify(exported, null, 2));
  };

  return (
    <div className="api-converter-view" style={{ animation: 'fadeIn 0.25s ease-out' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.25rem' }}>
          🔌 Legacy API Transporter Console
        </h2>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          Transition your existing systems seamlessly. Convert between legacy **Person-Wise** JSON structures and the new **Task-Wise** schema in real-time.
        </p>
      </div>

      <div className="transporter-layout">
        {/* Left Console: Legacy format */}
        <div className="console-card">
          <div className="panel-header" style={{ marginBottom: '0.75rem' }}>
            <span className="panel-title" style={{ color: 'var(--color-pending)', fontSize: '0.9rem' }}>
              📥 Legacy Person-Wise API Response (JSON Input)
            </span>
            <button 
              className="btn btn-secondary" 
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              onClick={handleExportState}
              title="Populate with currently active React state tasks"
            >
              Export Current State
            </button>
          </div>
          
          <textarea
            className="console-textarea"
            placeholder="Paste your legacy API JSON response here..."
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
          />
          
          {errorMsg && (
            <div style={{ color: '#ef4444', fontSize: '0.8rem', marginTop: '0.5rem', fontWeight: '500' }}>
              ⚠️ {errorMsg}
            </div>
          )}
        </div>

        {/* Right Console: Task-wise format */}
        <div className="console-card">
          <div className="panel-header" style={{ marginBottom: '0.75rem' }}>
            <span className="panel-title" style={{ color: 'var(--color-success)', fontSize: '0.9rem' }}>
              📤 New Task-Wise Schema (JSON Output)
            </span>
            <button 
              className="btn" 
              style={{ padding: '0.25rem 0.6rem', fontSize: '0.75rem' }}
              onClick={handleImport}
              disabled={!!errorMsg || !outputJson}
            >
              🔌 Import Into Active State
            </button>
          </div>
          
          <div className="console-preview">
            {outputJson || '// Awaiting valid legacy JSON input...'}
          </div>
        </div>
      </div>
    </div>
  );
}
