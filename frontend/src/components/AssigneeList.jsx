import React, { useState } from 'react';

const flattenTasks = (list) => {
  const flat = [];
  const walk = (tasks) => {
    tasks.forEach((task) => {
      flat.push(task);
      if (task.subtasks?.length) {
        walk(task.subtasks);
      }
    });
  };
  walk(list);
  return flat;
};

export default function AssigneeList({ assignees, tasks, onSelectAssignee, onAddAssignee, onRenameAssignee }) {
  const allTasks = flattenTasks(tasks);
  const [newAssigneeName, setNewAssigneeName] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);

  const handleAddSubmit = (event) => {
    event.preventDefault();
    if (!newAssigneeName.trim()) return;
    onAddAssignee(newAssigneeName.trim());
    setNewAssigneeName('');
  };

  const [editingName, setEditingName] = useState(null);
  const [renameValue, setRenameValue] = useState('');
  const [editError, setEditError] = useState('');

  const handleStartEdit = (name) => {
    setEditingName(name);
    setRenameValue(name);
    setEditError('');
  };

  const handleCancel = () => {
    setEditingName(null);
    setRenameValue('');
    setEditError('');
  };

  const handleSave = (oldName) => {
    const trimmed = renameValue.trim();
    if (!trimmed) {
      setEditError('Name is required');
      return;
    }
    if (trimmed === oldName) {
      handleCancel();
      return;
    }
    if (assignees.includes(trimmed)) {
      setEditError('Already exists');
      return;
    }
    onRenameAssignee(oldName, trimmed);
    handleCancel();
  };

  return (
    <div>
      <div className="compact-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem', padding: '0.2rem 0.5rem' }}>
        <span className="compact-label" style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text)', textTransform: 'none', letterSpacing: 'normal' }}>Assignees</span>
        <button
          className="nav-link-btn nav-link-cta"
          onClick={() => {
            setNewAssigneeName('');
            setShowAddModal(true);
          }}
          style={{ padding: '0.55rem 1.2rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 800 }}
        >
          + Add Assignee
        </button>
      </div>

      <div className="content-panel team-panel" style={{ margin: 0 }}>
        <table className="data-table team-table">
          <thead>
            <tr>
              <th style={{ width: '80px', textAlign: 'center' }}>No</th>
              <th style={{ textAlign: 'center' }}>Name</th>
              <th style={{ textAlign: 'center' }}>Active</th>
              <th style={{ textAlign: 'center' }}>Done</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {assignees.map((name, index) => {
              const pendingCount = allTasks.filter((task) => task.assignee === name && task.status !== 'Complete').length;
              const completedCount = allTasks.filter((task) => task.assignee === name && task.status === 'Complete').length;
              const isEditing = name === editingName;

              return (
                <tr key={name} className="hoverable">
                  <td className="team-index" style={{ textAlign: 'center' }}>{index + 1}</td>
                  <td className="team-name" style={{ textAlign: 'center' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: 'center' }}>
                        <input
                          type="text"
                          className="search-input"
                          style={{ width: '100%', height: '36px', padding: '0.4rem 0.8rem', borderRadius: '8px', textAlign: 'center' }}
                          value={renameValue}
                          onChange={(event) => {
                            setRenameValue(event.target.value);
                            setEditError('');
                          }}
                          autoFocus
                        />
                        {editError && <span style={{ color: 'var(--accent)', fontSize: '0.74rem', fontWeight: 700 }}>{editError}</span>}
                      </div>
                    ) : (
                      name
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="status-badge pending team-count-badge" style={{ cursor: 'default' }}>
                      {pendingCount} Active
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="status-badge complete team-count-badge" style={{ cursor: 'default' }}>
                      {completedCount} Done
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                        <button className="table-action-btn" onClick={() => handleSave(name)} title="Save name">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </button>
                        <button className="table-action-btn cancel" onClick={handleCancel} title="Cancel">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                        </button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                        <button className="table-action-btn" onClick={() => onSelectAssignee(name)} title="View Tasks">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button className="table-action-btn rename" onClick={() => handleStartEdit(name)} title="Edit name">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="modal-overlay-bg" onClick={() => setShowAddModal(false)}>
          <div className="mockup-modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(400px, 100%)', padding: '1.8rem' }}>
            <button className="mockup-modal-close" onClick={() => setShowAddModal(false)}>×</button>

            <div className="card-header" style={{ borderBottom: 'none', padding: 0, marginBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Add Assignee</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Create a member to assign tasks to.</p>
            </div>

            <form onSubmit={(e) => {
              handleAddSubmit(e);
              setShowAddModal(false);
            }} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="mockup-form-group">
                <label className="field-label" htmlFor="new-assignee-name">Name</label>
                <input
                  id="new-assignee-name"
                  type="text"
                  placeholder="assignee-name"
                  className="mockup-select"
                  style={{ width: '100%' }}
                  value={newAssigneeName}
                  onChange={(event) => setNewAssigneeName(event.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button
                  type="button"
                  className="nav-link-btn"
                  onClick={() => setShowAddModal(false)}
                  style={{ flex: 1, justifyContent: 'center', background: 'rgba(33, 53, 71, 0.06)', color: 'var(--text)' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="nav-link-btn nav-link-cta"
                  style={{ flex: 1.5, justifyContent: 'center' }}
                >
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
