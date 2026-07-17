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

const isRootParentTask = (task) =>
  (task.parent_id === null || task.parent_id === undefined) && task.subtasks?.length > 0;

export default function AssigneeList({
  assigneeProfiles,
  tasks,
  onSelectAssignee,
  onAddAssignee,
  onUpdateAssignee,
  isAdmin,
}) {
  const allTasks = flattenTasks(tasks);
  const assignableTasks = allTasks.filter((task) => !isRootParentTask(task));
  const [newAssigneeName, setNewAssigneeName] = useState('');
  const [newAssigneeEmail, setNewAssigneeEmail] = useState('');
  const [newAssigneePassword, setNewAssigneePassword] = useState('');
  const [addError, setAddError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAssignee, setEditingAssignee] = useState(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editError, setEditError] = useState('');

  const handleAddSubmit = async (event) => {
    event.preventDefault();
    if (!newAssigneeName.trim()) {
      setAddError('Name is required');
      return;
    }

    const created = await onAddAssignee({
      name: newAssigneeName.trim(),
      email: newAssigneeEmail.trim(),
      password: newAssigneePassword,
    });
    if (!created) {
      return;
    }
    setNewAssigneeName('');
    setNewAssigneeEmail('');
    setNewAssigneePassword('');
    setAddError('');
    setShowAddModal(false);
  };

  const openEditModal = (profile) => {
    setEditingAssignee(profile);
    setEditName(profile.name);
    setEditEmail(profile.email || '');
    setEditPassword('');
    setEditError('');
  };

  const closeEditModal = () => {
    setEditingAssignee(null);
    setEditName('');
    setEditEmail('');
    setEditPassword('');
    setEditError('');
  };

  const handleEditSubmit = async (event) => {
    event.preventDefault();

    const trimmedName = editName.trim();
    const trimmedEmail = editEmail.trim().toLowerCase();

    if (!trimmedName) {
      setEditError('Name is required');
      return;
    }

    if (!trimmedEmail) {
      setEditError('Email is required');
      return;
    }

    const updated = await onUpdateAssignee(editingAssignee.name, {
      name: trimmedName,
      email: trimmedEmail,
      password: editPassword,
    });

    if (!updated) {
      return;
    }

    closeEditModal();
  };

  return (
    <div>
      <div className="compact-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '1.2rem', padding: '0 0.5rem 0.35rem' }}>
        <div className="page-title-sec">
          <h2 style={{ margin: 0 }}>Assignees</h2>
        </div>
        {isAdmin && (
          <button
            className="nav-link-btn nav-link-cta"
            onClick={() => {
              setNewAssigneeName('');
              setNewAssigneeEmail('');
              setNewAssigneePassword('');
              setAddError('');
              setShowAddModal(true);
            }}
            style={{ padding: '0.55rem 1.2rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: 800 }}
          >
            + Add Assignee
          </button>
        )}
      </div>

      <div className="content-panel team-panel" style={{ margin: 0 }}>
        <table className="data-table team-table">
          <thead>
            <tr>
              <th style={{ width: '80px', textAlign: 'center' }}>No</th>
              <th style={{ textAlign: 'center' }}>Name</th>
              <th style={{ textAlign: 'center' }}>Email</th>
              <th style={{ textAlign: 'center' }}>Open Tasks</th>
              <th style={{ textAlign: 'center' }}>Completed Tasks</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {assigneeProfiles.map((profile, index) => {
              const openCount = assignableTasks.filter((task) => task.assignee === profile.name && task.status !== 'Complete').length;
              const completedCount = assignableTasks.filter((task) => task.assignee === profile.name && task.status === 'Complete').length;

              return (
                <tr key={profile.name} className="hoverable">
                  <td className="team-index" style={{ textAlign: 'center' }}>{index + 1}</td>
                  <td className="team-name" style={{ textAlign: 'center' }}>{profile.name}</td>
                  <td style={{ textAlign: 'center', fontWeight: 700, color: 'var(--muted)' }}>{profile.email || '-'}</td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="status-badge pending team-count-badge" style={{ cursor: 'default' }}>
                      {openCount} Open
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="status-badge complete team-count-badge" style={{ cursor: 'default' }}>
                      {completedCount} Completed
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '0.6rem', justifyContent: 'center' }}>
                      <button className="table-action-btn" onClick={() => onSelectAssignee(profile.name)} title="View Tasks">
                        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      </button>
                      {isAdmin && (
                        <button className="table-action-btn rename" onClick={() => openEditModal(profile)} title="Edit assignee">
                          <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                      )}
                    </div>
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
            <button className="mockup-modal-close" onClick={() => setShowAddModal(false)}>x</button>

            <div className="card-header" style={{ borderBottom: 'none', padding: 0, marginBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Add Assignee</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Create a member to assign tasks to.</p>
            </div>

            <form onSubmit={handleAddSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="mockup-form-group">
                <label className="field-label" htmlFor="new-assignee-name">Name</label>
                <input id="new-assignee-name" type="text" placeholder="Full name" className="mockup-select" style={{ width: '100%' }} value={newAssigneeName} onChange={(event) => { setNewAssigneeName(event.target.value); setAddError(''); }} required autoComplete="off" autoFocus />
              </div>

              <div className="mockup-form-group">
                <label className="field-label" htmlFor="new-assignee-email">Email <span style={{ color: "var(--muted)", fontWeight: 500 }}>(optional)</span></label>
                <input id="new-assignee-email" type="email" placeholder="Enter the email" className="mockup-select" style={{ width: '100%' }} value={newAssigneeEmail} onChange={(event) => { setNewAssigneeEmail(event.target.value); setAddError(''); }} autoComplete="off" />
              </div>

              <div className="mockup-form-group">
                <label className="field-label" htmlFor="new-assignee-password">Password <span style={{ color: "var(--muted)", fontWeight: 500 }}>(optional)</span></label>
                <input id="new-assignee-password" type="password" placeholder="Create a password" className="mockup-select" style={{ width: '100%' }} value={newAssigneePassword} onChange={(event) => { setNewAssigneePassword(event.target.value); setAddError(''); }} autoComplete="new-password" />
              </div>

              {addError && <div style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 700 }}>{addError}</div>}

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button type="button" className="nav-link-btn" onClick={() => setShowAddModal(false)} style={{ flex: 1, justifyContent: 'center', background: 'rgba(33, 53, 71, 0.06)', color: 'var(--text)' }}>
                  Cancel
                </button>
                <button type="submit" className="nav-link-btn nav-link-cta" style={{ flex: 1.5, justifyContent: 'center' }}>
                  Add Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingAssignee && (
        <div className="modal-overlay-bg" onClick={closeEditModal}>
          <div className="mockup-modal" onClick={(e) => e.stopPropagation()} style={{ width: 'min(430px, 100%)', padding: '1.8rem' }}>
            <button className="mockup-modal-close" onClick={closeEditModal}>x</button>

            <div className="card-header" style={{ borderBottom: 'none', padding: 0, marginBottom: '0.8rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>Edit Assignee</h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>Modify the full assignee details here.</p>
            </div>

            <form onSubmit={handleEditSubmit} autoComplete="off" style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div className="mockup-form-group">
                <label className="field-label" htmlFor="edit-assignee-name">Name</label>
                <input id="edit-assignee-name" type="text" placeholder="Full name" className="mockup-select" style={{ width: '100%' }} value={editName} onChange={(event) => { setEditName(event.target.value); setEditError(''); }} required autoComplete="off" autoFocus />
              </div>

              <div className="mockup-form-group">
                <label className="field-label" htmlFor="edit-assignee-email">Email</label>
                <input id="edit-assignee-email" type="email" placeholder="Enter the email" className="mockup-select" style={{ width: '100%' }} value={editEmail} onChange={(event) => { setEditEmail(event.target.value); setEditError(''); }} autoComplete="off" required />
              </div>

              <div className="mockup-form-group">
                <label className="field-label" htmlFor="edit-assignee-password">Password</label>
                <input id="edit-assignee-password" type="password" placeholder="Leave blank to keep current password" className="mockup-select" style={{ width: '100%' }} value={editPassword} onChange={(event) => { setEditPassword(event.target.value); setEditError(''); }} autoComplete="new-password" />
              </div>

              {editError && <div style={{ color: 'var(--accent)', fontSize: '0.78rem', fontWeight: 700 }}>{editError}</div>}

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.5rem' }}>
                <button type="button" className="nav-link-btn" onClick={closeEditModal} style={{ flex: 1, justifyContent: 'center', background: 'rgba(33, 53, 71, 0.06)', color: 'var(--text)' }}>
                  Cancel
                </button>
                <button type="submit" className="nav-link-btn nav-link-cta" style={{ flex: 1.5, justifyContent: 'center' }}>
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

