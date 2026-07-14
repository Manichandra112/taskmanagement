import React, { useEffect, useState } from 'react';
import { convertPersonWiseToTaskWise, convertTaskWiseToPersonWise } from '../utils/apiConverter';

export default function ApiConverterView({ tasks, onImportTasks }) {
  const sampleLegacyData = {
    'AAA - Today works': [
      { date: '2026-04-07', description: 'Trichy land agreement to Rajkumar', status: 'Complete' },
      { date: '2026-04-10', description: 'demt status mail - Rakesh Varma', status: 'Complete' },
    ],
    'Channel Partner': [
      { date: '2026-07-14', description: 'Call Ayyappan and ask the status', status: 'Pending' },
    ],
    Harish: [
      { date: '2026-07-14', description: 'Unibull - Auditor resignation', status: 'Pending' },
    ],
  };

  const [inputJson, setInputJson] = useState(JSON.stringify(sampleLegacyData, null, 2));
  const [outputJson, setOutputJson] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

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
    } catch (error) {
      setErrorMsg(`Invalid JSON syntax: ${error.message}`);
      setOutputJson('');
    }
  }, [inputJson]);

  const handleImport = () => {
    try {
      const parsed = JSON.parse(outputJson);
      if (!Array.isArray(parsed)) {
        setErrorMsg('Output is not a valid task array.');
        return;
      }
      onImportTasks(parsed);
      alert(`Imported ${parsed.length} tasks.`);
    } catch (error) {
      setErrorMsg(`Import failed: ${error.message}`);
    }
  };

  const handleExportState = () => {
    const exported = convertTaskWiseToPersonWise(tasks);
    setInputJson(JSON.stringify(exported, null, 2));
  };

  return (
    <div className="api-converter-view">
      <div className="compact-toolbar">
        <span className="compact-label">Converter</span>
      </div>

      <div className="transporter-layout">
        <div className="console-card">
          <div className="panel-header" style={{ marginBottom: '0.75rem' }}>
            <span className="panel-title" style={{ color: 'var(--pending)' }}>Input</span>
            <button className="nav-link-btn nav-link-tab" onClick={handleExportState}>
              Export Current
            </button>
          </div>

          <textarea
            className="console-textarea"
            placeholder="Paste legacy JSON"
            value={inputJson}
            onChange={(event) => setInputJson(event.target.value)}
          />

          {errorMsg && (
            <div style={{ color: 'var(--accent-strong)', fontSize: '0.82rem', marginTop: '0.6rem', fontWeight: 700 }}>
              {errorMsg}
            </div>
          )}
        </div>

        <div className="console-card">
          <div className="panel-header" style={{ marginBottom: '0.75rem' }}>
            <span className="panel-title" style={{ color: 'var(--success)' }}>Output</span>
            <button className="nav-link-btn nav-link-cta" onClick={handleImport} disabled={!!errorMsg || !outputJson}>
              Import Tasks
            </button>
          </div>

          <div className="console-preview">
            {outputJson || '// Waiting for valid JSON'}
          </div>
        </div>
      </div>
    </div>
  );
}
