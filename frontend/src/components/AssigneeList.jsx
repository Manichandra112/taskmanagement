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

export default function AssigneeList({ assignees, tasks, onSelectAssignee, onAddAssignee }) {
  const allTasks = flattenTasks(tasks);
  const [newAssigneeName, setNewAssigneeName] = useState('');

  const handleAddSubmit = (event) => {
    event.preventDefault();
    if (!newAssigneeName.trim()) return;
    onAddAssignee(newAssigneeName.trim());
    setNewAssigneeName('');
  };

  return (
    <div>
      <div className="compact-toolbar">
        <span className="compact-label">Team</span>
        <form onSubmit={handleAddSubmit} style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="Add team member"
            className="search-input"
            style={{ width: '220px' }}
            value={newAssigneeName}
            onChange={(event) => setNewAssigneeName(event.target.value)}
          />
          <button type="submit" className="nav-link-btn nav-link-cta">Add</button>
        </form>
      </div>

      <div className="content-panel team-panel">
        <table className="data-table team-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>No</th>
              <th>Name</th>
              <th>Active</th>
              <th>Done</th>
              <th style={{ width: '170px', textAlign: 'center' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {assignees.map((name, index) => {
              const pendingCount = allTasks.filter((task) => task.assignee === name && task.status !== 'Complete').length;
              const completedCount = allTasks.filter((task) => task.assignee === name && task.status === 'Complete').length;

              return (
                <tr key={name} className="hoverable">
                  <td className="team-index">{index + 1}</td>
                  <td className="team-name">{name}</td>
                  <td>
                    <span className="status-badge pending team-count-badge" style={{ cursor: 'default' }}>
                      {pendingCount} Active
                    </span>
                  </td>
                  <td>
                    <span className="status-badge complete team-count-badge" style={{ cursor: 'default' }}>
                      {completedCount} Done
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button className="table-action-btn" onClick={() => onSelectAssignee(name)}>
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
