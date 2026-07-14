import React from 'react';

export default function Dashboard({ tasks, assignees }) {
  // Helper to count tasks recursively
  const getStatsRecursive = (list) => {
    let total = 0;
    let pending = 0;
    let inProgress = 0;
    let complete = 0;

    const traverse = (nodes) => {
      nodes.forEach(node => {
        total++;
        if (node.status === 'Pending') pending++;
        else if (node.status === 'In Progress') inProgress++;
        else if (node.status === 'Complete') complete++;

        if (node.subtasks && node.subtasks.length > 0) {
          traverse(node.subtasks);
        }
      });
    };

    traverse(list);
    return { total, pending, inProgress, complete };
  };

  const stats = getStatsRecursive(tasks);

  // Helper to get active focus tasks (the first pending task from each root task branch)
  const getActiveFocalTasks = (list) => {
    const focusList = [];
    
    // Find the first pending task in a branch recursively
    const findFirstPending = (nodes) => {
      for (const node of nodes) {
        if (node.status !== 'Complete') {
          return node;
        }
        if (node.subtasks && node.subtasks.length > 0) {
          const childPending = findFirstPending(node.subtasks);
          if (childPending) return childPending;
        }
      }
      return null;
    };

    list.forEach(rootTask => {
      const pending = findFirstPending([rootTask]);
      if (pending) {
        focusList.push({
          id: pending.id,
          title: pending.title,
          assignee: pending.assignee,
          dueDate: pending.dueDate,
          status: pending.status,
          isSubtask: pending.id !== rootTask.id
        });
      }
    });

    return focusList.slice(0, 5); // Show top 5 active focal items
  };

  const focalTasks = getActiveFocalTasks(tasks);

  // Helper to calculate assignee workload
  const getAssigneeWorkload = (list) => {
    const counts = {};
    const traverse = (nodes) => {
      nodes.forEach(node => {
        if (node.assignee && node.assignee !== 'Unassigned' && node.status !== 'Complete') {
          counts[node.assignee] = (counts[node.assignee] || 0) + 1;
        }
        if (node.subtasks && node.subtasks.length > 0) {
          traverse(node.subtasks);
        }
      });
    };
    traverse(list);

    return Object.entries(counts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  };

  const workloads = getAssigneeWorkload(tasks);

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      <div className="page-header">
        <div className="page-title-sec">
          <h2>Task Dashboard</h2>
          <p>Real-time analytics and sequential focal pipeline statistics</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="kpi-grid">
        <div className="kpi-card total">
          <div className="kpi-header">
            <span className="kpi-title">TOTAL HIERARCHY SIZE</span>
            <span className="kpi-icon-wrapper">📁</span>
          </div>
          <div className="kpi-value">{stats.total}</div>
          <div className="kpi-desc">Total parent and subtasks currently registered</div>
        </div>

        <div className="kpi-card pending">
          <div className="kpi-header">
            <span className="kpi-title">PENDING / BACKLOG</span>
            <span className="kpi-icon-wrapper">⏳</span>
          </div>
          <div className="kpi-value">{stats.pending}</div>
          <div className="kpi-desc">Queued tasks awaiting work cycles</div>
        </div>

        <div className="kpi-card inprogress">
          <div className="kpi-header">
            <span className="kpi-title">IN PROGRESS</span>
            <span className="kpi-icon-wrapper">⚡</span>
          </div>
          <div className="kpi-value">{stats.inProgress}</div>
          <div className="kpi-desc">Active tasks under development</div>
        </div>

        <div className="kpi-card complete">
          <div className="kpi-header">
            <span className="kpi-title">COMPLETED TASKS</span>
            <span className="kpi-icon-wrapper">✅</span>
          </div>
          <div className="kpi-value">{stats.complete}</div>
          <div className="kpi-desc">Successfully archived and solved items</div>
        </div>
      </div>

      {/* Main Dashboard Panel layout */}
      <div className="dashboard-grid">
        {/* Left Column: Focal Active Tasks */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3 className="panel-title">Active Sequential Focus</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Top 5 tasks requiring immediate action</span>
          </div>
          <table className="data-table" style={{ border: 'none' }}>
            <thead>
              <tr style={{ background: 'transparent' }}>
                <th>Task Focus</th>
                <th>Assignee</th>
                <th>Due Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {focalTasks.length > 0 ? (
                focalTasks.map(task => (
                  <tr key={task.id} className="hoverable">
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        {task.isSubtask && (
                          <span className="subtask-badge-label" style={{ fontSize: '0.6rem', padding: '0.05rem 0.25rem' }}>Subtask</span>
                        )}
                        <span style={{ fontWeight: '500' }}>{task.title}</span>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--text-muted)' }}>
                        {task.assignee === 'Unassigned' ? '👥 Unassigned' : task.assignee}
                      </span>
                    </td>
                    <td className="date-text" style={{ fontSize: '0.85rem' }}>{task.dueDate}</td>
                    <td>
                      <span className={`status-badge ${task.status.toLowerCase().replace(/\s+/g, '')}`} style={{ padding: '0.2rem 0.5rem', fontSize: '0.72rem' }}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dark)' }}>
                    All clear! No pending tasks remaining.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Right Column: Workload Distribution */}
        <div className="dashboard-panel">
          <div className="panel-header">
            <h3 className="panel-title">Active Workloads</h3>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Pending tasks count per person</span>
          </div>
          <div className="workload-list">
            {workloads.length > 0 ? (
              workloads.map(item => (
                <div key={item.name} className="workload-item">
                  <div className="workload-name">{item.name}</div>
                  <div className="workload-bar-wrapper">
                    <div className="workload-bar-label">
                      <span>Workload index</span>
                      <span>{item.count} tasks</span>
                    </div>
                    <div className="task-progress-track">
                      <div 
                        className="task-progress-fill" 
                        style={{ 
                          width: `${Math.min((item.count / 10) * 100, 100)}%`,
                          background: item.count > 5 ? 'var(--primary-color)' : 'var(--color-inprogress)'
                        }} 
                      />
                    </div>
                  </div>
                  <div className="workload-stats">
                    <div className="workload-count">{item.count}</div>
                    <div className="workload-pending">Pending</div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-dark)' }}>
                No active workloads found.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
