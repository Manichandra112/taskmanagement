import React, { useState } from 'react';

// Reusable rotating SVG Chevron Icon for task expanding
function ChevronIcon({ expanded }) {
  return (
    <svg 
      width="12" 
      height="12" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3.5" 
      strokeLinecap="round" 
      strokeLinejoin="round"
      style={{ 
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)', 
        transition: 'transform 0.22s cubic-bezier(0.4, 0, 0.2, 1)',
        color: 'var(--text-muted)',
        flexShrink: 0
      }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

// Vector-drawn L-branch connector line for hierarchical subtasks
function LBranchIcon() {
  return (
    <svg 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="var(--border-hover)" 
      strokeWidth="2.5" 
      strokeLinecap="round"
      style={{ marginRight: '6px', flexShrink: 0 }}
    >
      <path d="M12 0v12h12" />
    </svg>
  );
}

// Initials Avatar generator
const getInitials = (name) => {
  if (!name || name === 'Unassigned') return '👤';
  const clean = name.replace(/^(Lead-|Ravi-|AAA - )/i, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
};

// Pastel hash color code generator for assignees
const getAvatarColor = (name) => {
  if (!name || name === 'Unassigned') return '#94a3b8'; // Neutral Slate Grey
  const colors = [
    '#3b82f6', '#10b981', '#6366f1', '#ec4899', '#f59e0b',
    '#8b5cf6', '#14b8a6', '#f43f5e', '#06b6d4', '#0891b2'
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// Calculate completion progress recursively for nested subtask trees
const getProgressRecursive = (task) => {
  if (!task.subtasks || task.subtasks.length === 0) {
    return task.status === 'Complete' ? 100 : 0;
  }
  
  const getAllDescendants = (t) => {
    let list = [];
    if (t.subtasks && t.subtasks.length > 0) {
      t.subtasks.forEach(child => {
        list.push(child);
        list = [...list, ...getAllDescendants(child)];
      });
    }
    return list;
  };

  const descendants = getAllDescendants(task);
  const total = descendants.length;
  const completed = descendants.filter(d => d.status === 'Complete').length;

  return total > 0 ? Math.round((completed / total) * 100) : (task.status === 'Complete' ? 100 : 0);
};

// Recursively calculate subtasks completed vs total counts
const getSubtasksCount = (task) => {
  let completed = 0;
  let total = 0;
  const traverse = (item) => {
    if (item.subtasks && item.subtasks.length > 0) {
      item.subtasks.forEach(child => {
        total++;
        if (child.status === 'Complete') completed++;
        traverse(child);
      });
    }
  };
  traverse(task);
  return { completed, total };
};

// Recursively collect all unique subtask assignees for rollup
const getSubtaskAssigneesRecursive = (task) => {
  const assigneesSet = new Set();
  const traverse = (t) => {
    if (t.subtasks && t.subtasks.length > 0) {
      t.subtasks.forEach(child => {
        if (child.assignee && child.assignee !== 'Unassigned') {
          assigneesSet.add(child.assignee);
        }
        traverse(child);
      });
    }
  };
  traverse(task);
  return Array.from(assigneesSet);
};

// Recursive Task Row component in Card-Checklist hybrid layout
function TaskRowNode({ 
  task, 
  depth, 
  assignees, 
  onUpdateTask, 
  onDeleteTask, 
  onOpenEditTask, 
  onAddSubtaskClick,
  searchActive
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const todayDate = '2026-07-14';

  const cycleStatus = () => {
    const cycleMap = {
      'Pending': 'In Progress',
      'In Progress': 'Complete',
      'Complete': 'Pending'
    };
    const nextStatus = cycleMap[task.status] || 'Pending';
    const updatedFields = { status: nextStatus };
    if (nextStatus === 'Complete') {
      updatedFields.dueDate = todayDate; // Lock completion timestamp
    }
    onUpdateTask(task.id, updatedFields);
  };

  const handleAssigneeChange = (e) => {
    onUpdateTask(task.id, { assignee: e.target.value });
  };

  const renderTreeLines = () => {
    const elements = [];
    for (let i = 0; i < depth; i++) {
      if (i === depth - 1) {
        elements.push(<LBranchIcon key={i} />);
      } else {
        elements.push(
          <div key={i} style={{ width: '30px', height: '24px', flexShrink: 0 }} />
        );
      }
    }
    return elements;
  };

  const progress = getProgressRecursive(task);
  const totalSub = task.subtasks?.length || 0;
  const isParentTask = totalSub > 0;
  const subtaskAssignees = isParentTask ? getSubtaskAssigneesRecursive(task) : [];
  const displayDate = task.status === 'Complete' ? task.dueDate : todayDate;
  
  // Get Completed vs Total fractions count
  const { completed: completedCount, total: totalCount } = getSubtasksCount(task);

  // Auto-expand branches when search/filters are active
  const expanded = isExpanded || searchActive;

  // --- Sub-Column Layout Blocks (Date and status block are shared for all depths) ---
  const dateBlock = (
    <div className="card-col-date">
      <span>{displayDate}</span>
    </div>
  );

  const parentTitleBlock = (
    <div className="card-col-title">
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
          {totalSub > 0 ? (
            <button 
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="chevron-toggle"
            >
              <ChevronIcon expanded={expanded} />
            </button>
          ) : (
            <div style={{ width: '30px', height: '24px', flexShrink: 0 }} />
          )}

          <span style={{ 
            fontWeight: '600',
            fontSize: '0.95rem',
            color: task.status === 'Complete' ? 'var(--text-dark)' : 'var(--text-main)',
            textDecoration: task.status === 'Complete' ? 'line-through' : 'none',
            whiteSpace: 'normal',
            wordBreak: 'break-word',
            lineHeight: '1.4'
          }}>
            {task.title}
          </span>
        </div>

        {totalSub > 0 && (
          <div style={{ paddingLeft: '36px', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem' }}>
            <div className="task-progress-track">
              <div className="task-progress-fill" style={{ width: `${progress}%` }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: '600' }}>
              {completedCount} of {totalCount} subtasks complete
            </span>
          </div>
        )}
      </div>
    </div>
  );

  const assigneeBlock = (
    <div className="card-col-assignee">
      {isParentTask ? (
        <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'center' }}>
          {subtaskAssignees.length > 0 ? (
            <div className="avatar-stack">
              {subtaskAssignees.map(name => (
                <div 
                  key={name}
                  className="avatar-stack-circle"
                  style={{ backgroundColor: getAvatarColor(name) }}
                  title={`Subtask Assignee: ${name}`}
                >
                  {getInitials(name)}
                </div>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: '0.82rem', color: 'var(--text-dark)', fontStyle: 'italic' }}>Unassigned Group</span>
          )}
          <span className="container-label" title="Managed by subtasks.">📁 Group</span>
        </div>
      ) : (
        <div className="assignee-select-wrapper">
          <div 
            className="avatar-circle" 
            style={{ backgroundColor: getAvatarColor(task.assignee) }}
            title={task.assignee || 'Unassigned'}
          >
            {getInitials(task.assignee)}
          </div>
          <select
            className="assignee-select"
            value={task.assignee || 'Unassigned'}
            onChange={handleAssigneeChange}
          >
            <option value="Unassigned">Unassigned</option>
            {assignees.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );

  const statusBlock = (
    <div className="card-col-status">
      <span 
        className={`status-badge ${task.status.toLowerCase().replace(/\s+/g, '')}`}
        onClick={isParentTask ? undefined : cycleStatus} // Locked: Parents derive status from child tasks
        style={{ cursor: isParentTask ? 'default' : 'pointer' }}
        title={isParentTask ? 'Status auto-derived from subtasks' : 'Click to cycle status'}
      >
        <span style={{ fontSize: '0.5rem' }}>●</span> {task.status}
      </span>
    </div>
  );

  const parentActionsBlock = (
    <div className="card-col-actions">
      <button 
        className="action-btn-circle" 
        onClick={() => onAddSubtaskClick(task.id, task.title)}
        title="Add Subtask step"
      >
        ➕
      </button>
      <button 
        className="action-btn-circle" 
        onClick={() => onOpenEditTask(task)}
        title="Edit Details"
      >
        ✏️
      </button>
      <button 
        className="action-btn-circle delete" 
        onClick={() => onDeleteTask(task.id)}
        title="Delete Task"
      >
        🗑️
      </button>
    </div>
  );

  // --- Depth Conditional Layout Rendering ---
  
  if (depth === 0) {
    // Top-Level Task Card Layout (Columns fully aligned)
    return (
      <div className="parent-task-card">
        <div className="parent-card-header">
          {dateBlock}
          {parentTitleBlock}
          {assigneeBlock}
          {statusBlock}
          {parentActionsBlock}
        </div>
        
        {/* Shaded subtask checklist panel inside the card boundary */}
        {expanded && task.subtasks && task.subtasks.length > 0 && (
          <div className="subtasks-panel">
            {task.subtasks.map(child => (
              <TaskRowNode 
                key={child.id}
                task={child}
                depth={depth + 1}
                assignees={assignees}
                onUpdateTask={onUpdateTask}
                onDeleteTask={onDeleteTask}
                onOpenEditTask={onOpenEditTask}
                onAddSubtaskClick={onAddSubtaskClick}
                searchActive={searchActive}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // Nested Checklist-style Subtask Row Layout (Rigid columns alignment, standard word badges for status)
  return (
    <>
      <div className="subtask-checklist-item">
        
        {/* Column 1: Date column aligned on the far left */}
        {dateBlock}

        {/* Column 2: Checklist Task Name elements (Indents, chevron, title, nested progress fraction) */}
        <div className="card-col-title">
          <div style={{ display: 'flex', flexDirection: 'column', width: '100%', minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              {/* Vector indents */}
              {renderTreeLines()}

              {/* Subtask chevron toggle (if it has sub-subtasks) */}
              {totalSub > 0 ? (
                <button 
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="chevron-toggle"
                  style={{ width: '20px', height: '20px' }}
                >
                  <ChevronIcon expanded={expanded} />
                </button>
              ) : (
                <div style={{ width: '20px', height: '20px', flexShrink: 0 }} />
              )}

              {/* Subtask label badge */}
              <span className="subtask-badge-label">Subtask</span>

              {/* Title description (Wraps to next line naturally instead of truncating) */}
              <span style={{ 
                fontSize: '0.88rem',
                color: task.status === 'Complete' ? 'var(--text-dark)' : 'var(--text-main)',
                textDecoration: task.status === 'Complete' ? 'line-through' : 'none',
                whiteSpace: 'normal',
                wordBreak: 'break-word',
                lineHeight: '1.4'
              }}>
                {task.title}
              </span>
            </div>

            {/* Dynamic progress tracker below the subtask name if it is a sub-parent */}
            {totalSub > 0 && (
              <div style={{ paddingLeft: `${depth * 30 + 36}px`, display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.15rem' }}>
                <div className="task-progress-track" style={{ maxWidth: '100px', height: '3px' }}>
                  <div className="task-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-dark)', fontWeight: '600' }}>
                  {completedCount} of {totalCount} complete
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Column 3: Assignee selection (Aligned under Assigned To header) */}
        {assigneeBlock}

        {/* Column 4: Standard Word Status Badge Pill (Aligned under Status header, matching parent style) */}
        {statusBlock}

        {/* Column 5: Hover Actions (Aligned under Actions header, visual silence opacity 0 by default) */}
        <div className="card-col-actions">
          <div className="hover-actions-group">
            <button 
              className="action-btn-circle" 
              onClick={() => onAddSubtaskClick(task.id, task.title)}
              title="Add Subtask step"
              style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}
            >
              ➕
            </button>
            <button 
              className="action-btn-circle" 
              onClick={() => onOpenEditTask(task)}
              title="Edit Details"
              style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}
            >
              ✏️
            </button>
            <button 
              className="action-btn-circle delete" 
              onClick={() => onDeleteTask(task.id)}
              title="Delete Task"
              style={{ width: '24px', height: '24px', fontSize: '0.7rem' }}
            >
              🗑️
            </button>
          </div>
        </div>
      </div>

      {/* Recursive sub-panels if the subtask has children (Removed marginLeft shift to keep columns aligned) */}
      {expanded && task.subtasks && task.subtasks.length > 0 && (
        <div className="subtasks-panel">
          {task.subtasks.map(child => (
            <TaskRowNode 
              key={child.id}
              task={child}
              depth={depth + 1}
              assignees={assignees}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onOpenEditTask={onOpenEditTask}
              onAddSubtaskClick={onAddSubtaskClick}
              searchActive={searchActive}
            />
          ))}
        </div>
      )}
    </>
  );
}

export default function TaskList({ 
  tasks, 
  assignees,
  onUpdateTask, 
  onDeleteTask,
  onOpenEditTask,
  onAddSubtaskClick,
  viewMode, // 'today', 'all', 'completed'
  selectedAssigneeFilter,
  onResetAssigneeFilter
}) {
  const todayDate = '2026-07-14';

  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState(selectedAssigneeFilter || 'all');
  const [filterStatus, setFilterStatus] = useState('all');

  // Sync selectedAssigneeFilter prop changes
  React.useEffect(() => {
    if (selectedAssigneeFilter) {
      setFilterAssignee(selectedAssigneeFilter);
    }
  }, [selectedAssigneeFilter]);

  // --- Sequential Pipeline Traversal ---
  const getSequentialActiveTree = (list) => {
    let foundPending = false;
    return list.map(task => {
      const activeSubtasks = task.subtasks ? getSequentialActiveTree(task.subtasks) : [];
      if (foundPending) {
        return null;
      }
      if (task.status !== 'Complete') {
        foundPending = true;
      }
      return {
        ...task,
        subtasks: activeSubtasks
      };
    }).filter(Boolean);
  };

  const activeTree = getSequentialActiveTree(tasks);

  // Hierarchical search/assignee filter on top of the active tree
  // forceInclude ensures children are not sliced off when parent matches viewMode/search
  const getFilteredTree = (list, forceInclude = false) => {
    return list.map(task => {
      const matchesSearch = task.title.toLowerCase().includes(search.toLowerCase());
      
      let matchesAssignee = filterAssignee === 'all';
      if (!matchesAssignee) {
        if (task.subtasks && task.subtasks.length > 0) {
          const subAssignees = getSubtaskAssigneesRecursive(task);
          matchesAssignee = subAssignees.includes(filterAssignee);
        } else {
          matchesAssignee = task.assignee === filterAssignee;
        }
      }
      
      let matchesStatus = true;
      if (filterStatus !== 'all') {
        matchesStatus = task.status === filterStatus;
      }
      
      let matchesBaseMode = true;
      if (viewMode === 'today') {
        matchesBaseMode = (task.status === 'Pending' || task.status === 'In Progress');
      } else if (viewMode === 'completed') {
        matchesBaseMode = task.status === 'Complete';
      }

      const isMatch = forceInclude || (matchesSearch && matchesAssignee && matchesStatus && matchesBaseMode);

      // Force include all nested children if this node matches
      const filteredChildren = task.subtasks ? getFilteredTree(task.subtasks, isMatch || forceInclude) : [];

      if (isMatch || filteredChildren.length > 0) {
        return {
          ...task,
          subtasks: filteredChildren
        };
      }
      return null;
    }).filter(Boolean);
  };

  const filteredTree = getFilteredTree(activeTree);

  // Search/Filters are considered active if fields are populated
  const searchActive = search.trim().length > 0 || filterAssignee !== 'all' || filterStatus !== 'all';

  return (
    <div style={{ animation: 'fadeIn 0.25s ease-out' }}>
      {/* Header Info */}
      <div className="page-header">
        <div className="page-title-sec">
          <h2>
            {viewMode === 'today' && "Today Tasks"}
            {viewMode === 'completed' && "Completed Tasks"}
            {viewMode === 'all' && "All Tasks"}
          </h2>
          <p>
            {viewMode === 'today' && `Viewing pending workload for ${todayDate}`}
            {viewMode === 'completed' && "Archive of all successfully completed tasks"}
            {viewMode === 'all' && "Central repository for tasks and assignee workloads"}
          </p>
        </div>
        
        {/* Reset filter indicator */}
        {selectedAssigneeFilter && selectedAssigneeFilter !== 'all' && (
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.85rem', background: 'var(--primary-light)', padding: '0.35rem 0.75rem', borderRadius: '4px', border: '1px solid rgba(163, 10, 10, 0.2)' }}>
            <span>Filtered to: <strong>{selectedAssigneeFilter}</strong></span>
            <button 
              style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--primary-color)', fontWeight: 'bold' }}
              onClick={() => {
                setFilterAssignee('all');
                onResetAssigneeFilter();
              }}
            >
              [Clear Filter]
            </button>
          </div>
        )}
      </div>

      {/* Filters Control bar */}
      <div className="filter-bar">
        <div className="filter-left">
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="filter-select"
            value={filterAssignee}
            onChange={(e) => {
              setFilterAssignee(e.target.value);
              if (onResetAssigneeFilter) onResetAssigneeFilter();
            }}
          >
            <option value="all">All Assignees</option>
            <option value="Unassigned">Unassigned</option>
            {assignees.map(name => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>

          {viewMode === 'all' && (
            <select
              className="filter-select"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Complete">Complete</option>
            </select>
          )}
        </div>
      </div>

      {/* Global Columns Heading Row (table-header-row simulated card borders for pixel-perfect layout) */}
      <div className="table-header-row">
        <div className="card-col-date">Date</div>
        <div className="card-col-title" style={{ paddingLeft: 'calc(1.25rem + 30px)' }}>Task Name</div>
        <div className="card-col-assignee" style={{ display: 'flex', justifyContent: 'center' }}>Assigned To</div>
        <div className="card-col-status" style={{ display: 'flex', justifyContent: 'center' }}>Status</div>
        <div className="card-col-actions" style={{ display: 'flex', justifyContent: 'flex-end' }}>Actions</div>
      </div>

      {/* Stack of Cards containing nested checklists */}
      <div className="cards-stack">
        {filteredTree.length > 0 ? (
          filteredTree.map(task => (
            <TaskRowNode 
              key={task.id}
              task={task}
              depth={0}
              assignees={assignees}
              onUpdateTask={onUpdateTask}
              onDeleteTask={onDeleteTask}
              onOpenEditTask={onOpenEditTask}
              onAddSubtaskClick={onAddSubtaskClick}
              searchActive={searchActive}
            />
          ))
        ) : (
          <div style={{ textAlign: 'center', padding: '4.5rem', background: 'var(--bg-secondary)', border: '1.5px solid var(--border-color)', borderRadius: '12px', color: 'var(--text-dark)' }}>
            No active tasks found in the sequence.
          </div>
        )}
      </div>
    </div>
  );
}
