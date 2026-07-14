import React, { useState } from 'react';

export default function AssigneeList({ assignees, tasks, onSelectAssignee, onAddAssignee }) {
  const [newAssigneeName, setNewAssigneeName] = useState('');

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newAssigneeName.trim()) return;
    onAddAssignee(newAssigneeName.trim());
    setNewAssigneeName('');
  };

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700' }}>👥 Assignee Registry</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Registered members and service departments in GHL India Ventures.</p>
        </div>

        <form onSubmit={handleAddSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
          <input
            type="text"
            placeholder="New assignee name..."
            className="search-input"
            style={{ width: '220px', paddingLeft: '1rem' }}
            value={newAssigneeName}
            onChange={(e) => setNewAssigneeName(e.target.value)}
          />
          <button type="submit" className="nav-link-btn">
            Add Assignee
          </button>
        </form>
      </div>

      <div className="content-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>S.No</th>
              <th>Name</th>
              <th>Active Workload</th>
              <th>Completed Tasks</th>
              <th style={{ width: '150px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {assignees.map((name, index) => {
              const pendingCount = tasks.filter(t => t.assignee === name && t.status === 'Pending').length;
              const completedCount = tasks.filter(t => t.assignee === name && t.status === 'Complete').length;

              return (
                <tr key={name} className="hoverable">
                  <td>{index + 1}</td>
                  <td style={{ fontWeight: '600' }}>{name}</td>
                  <td>
                    <span 
                      className="status-badge pending" 
                      style={{ padding: '0.15rem 0.5rem', cursor: 'default' }}
                    >
                      {pendingCount} Pending
                    </span>
                  </td>
                  <td>
                    <span 
                      className="status-badge complete" 
                      style={{ padding: '0.15rem 0.5rem', cursor: 'default' }}
                    >
                      {completedCount} Done
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button 
                      className="nav-link-btn"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.8rem', display: 'inline-block' }}
                      onClick={() => onSelectAssignee(name)}
                    >
                      View Tasks
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
