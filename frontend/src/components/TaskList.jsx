import React, { useState } from 'react';

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

function ChevronIcon({ expanded }) {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
        transition: 'transform 180ms ease',
        color: 'var(--muted)',
        flexShrink: 0,
      }}
    >
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function LBranchIcon() {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="rgba(101, 78, 55, 0.24)"
      strokeWidth="2.5"
      strokeLinecap="round"
      style={{ marginRight: '6px', flexShrink: 0 }}
    >
      <path d="M12 0v12h12" />
    </svg>
  );
}

const getInitials = (name) => {
  if (!name || name === 'Unassigned') return 'UN';
  const clean = name.replace(/^(Lead-|Ravi-|AAA - )/i, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name) => {
  if (!name || name === 'Unassigned') return '#8a8f99';
  const colors = ['#c96c50', '#2f7f73', '#476c9b', '#c28b44', '#8f5f94', '#4f8c61'];
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getEffectiveStatus = (task) => {
  if (!task.subtasks || task.subtasks.length === 0) {
    return task.status;
  }

  const childStatuses = task.subtasks.map(getEffectiveStatus);
  if (childStatuses.every((status) => status === 'Complete')) return 'Complete';
  if (childStatuses.some((status) => status === 'In Progress' || status === 'Complete')) return 'In Progress';
  return 'Pending';
};

const getDirectSubtaskSummary = (task) => {
  const children = task.subtasks || [];
  const completed = children.filter((child) => getEffectiveStatus(child) === 'Complete').length;
  return { completed, total: children.length };
};

const getProgressPercent = (task) => {
  const { completed, total } = getDirectSubtaskSummary(task);
  if (total === 0) {
    return getEffectiveStatus(task) === 'Complete' ? 100 : 0;
  }
  return Math.round((completed / total) * 100);
};

const getSubtaskAssigneesRecursive = (task) => {
  const assigneesSet = new Set();
  const traverse = (node) => {
    for (const child of node.subtasks || []) {
      if (child.assignee && child.assignee !== 'Unassigned') {
        assigneesSet.add(child.assignee);
      }
      traverse(child);
    }
  };
  traverse(task);
  return Array.from(assigneesSet);
};

function TaskRowNode({
  task,
  depth,
  assignees,
  onUpdateTask,
  onDeleteTask,
  onOpenEditTask,
  onAddSubtaskClick,
  searchActive,
  todayDate,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const effectiveStatus = getEffectiveStatus(task);
  const { completed: completedCount, total: totalCount } = getDirectSubtaskSummary(task);
  const isParentTask = totalCount > 0;
  const subtaskAssignees = isParentTask ? getSubtaskAssigneesRecursive(task) : [];
  const expanded = isExpanded || searchActive;
  const progress = getProgressPercent(task);
  const displayDate = effectiveStatus === 'Complete' ? task.dueDate : todayDate;

  const cycleStatus = () => {
    const cycleMap = {
      Pending: 'In Progress',
      'In Progress': 'Complete',
      Complete: 'Pending',
    };

    const nextStatus = cycleMap[effectiveStatus] || 'Pending';
    const updatedFields = { status: nextStatus };

    if (nextStatus === 'Complete') {
      updatedFields.dueDate = todayDate;
    }

    onUpdateTask(task.id, updatedFields);
  };

  const handleAssigneeChange = (event) => {
    onUpdateTask(task.id, { assignee: event.target.value });
  };

  const renderTreeLines = () => {
    const elements = [];
    for (let index = 0; index < depth; index += 1) {
      if (index === depth - 1) {
        elements.push(<LBranchIcon key={index} />);
      } else {
        elements.push(<div key={index} style={{ width: '30px', height: '24px', flexShrink: 0 }} />);
      }
    }
    return elements;
  };

  const toggleExpanded = () => {
    if (isParentTask) {
      setIsExpanded((value) => !value);
    }
  };

  const dateBlock = (
    <div className="card-col-date">
      <span>{displayDate}</span>
    </div>
  );

  const assigneeBlock = (
    <div className="card-col-assignee">
      {isParentTask ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
          {subtaskAssignees.length > 0 ? (
            <div className="avatar-stack">
              {subtaskAssignees.map((name) => (
                <div
                  key={name}
                  className="avatar-stack-circle"
                  style={{ backgroundColor: getAvatarColor(name) }}
                  title={name}
                >
                  {getInitials(name)}
                </div>
              ))}
            </div>
          ) : (
            <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Unassigned</span>
          )}
          <span className="container-label">Group</span>
        </div>
      ) : (
        <div className="assignee-select-wrapper">
          <div className="avatar-circle" style={{ backgroundColor: getAvatarColor(task.assignee) }}>
            {getInitials(task.assignee)}
          </div>
          <select className="assignee-select" value={task.assignee || 'Unassigned'} onChange={handleAssigneeChange}>
            <option value="Unassigned">Unassigned</option>
            {assignees.map((name) => (
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
        className={`status-badge ${effectiveStatus.toLowerCase().replace(/\s+/g, '')}`}
        onClick={isParentTask ? undefined : cycleStatus}
        style={{ cursor: isParentTask ? 'default' : 'pointer' }}
      >
        {effectiveStatus}
      </span>
    </div>
  );

  const actionButtons = (
    <div className="card-col-actions">
      <div className="hover-actions-group">
        <button className="action-btn-circle" onClick={() => onAddSubtaskClick(task.id, task.title)}>Add</button>
        <button className="action-btn-circle" onClick={() => onOpenEditTask(task)}>Edit</button>
        <button className="action-btn-circle delete" onClick={() => onDeleteTask(task.id)}>Delete</button>
      </div>
    </div>
  );

  if (depth === 0) {
    return (
      <div className={`parent-task-card task-surface ${effectiveStatus.toLowerCase().replace(/\s+/g, '-')}`}>
        <div className="parent-card-header">
          {dateBlock}
          <div className="card-col-title">
            <div style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {isParentTask ? (
                  <button type="button" onClick={toggleExpanded} className="chevron-toggle">
                    <ChevronIcon expanded={expanded} />
                  </button>
                ) : (
                  <div style={{ width: '2rem' }} />
                )}
                <button type="button" onClick={toggleExpanded} className="task-title-btn" style={{ fontWeight: 800, fontSize: '0.98rem', textAlign: 'left' }}>
                  {task.title}
                </button>
              </div>
              {isParentTask && (
                <div style={{ paddingLeft: '2.45rem', display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.35rem' }}>
                  <div className="task-progress-track">
                    <div className="task-progress-fill" style={{ width: `${progress}%` }} />
                  </div>
                  <span style={{ color: 'var(--muted)', fontSize: '0.78rem', fontWeight: 700 }}>
                    {completedCount}/{totalCount}
                  </span>
                </div>
              )}
            </div>
          </div>
          {assigneeBlock}
          {statusBlock}
          {actionButtons}
        </div>

        {expanded && task.subtasks?.length > 0 && (
          <div className="subtasks-panel">
            {task.subtasks.map((child) => (
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
                todayDate={todayDate}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className={`subtask-checklist-item task-surface ${effectiveStatus.toLowerCase().replace(/\s+/g, '-')}`}>
        {dateBlock}
        <div className="card-col-title">
          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {renderTreeLines()}
              {isParentTask ? (
                <button type="button" onClick={toggleExpanded} className="chevron-toggle" style={{ width: '1.65rem', height: '1.65rem' }}>
                  <ChevronIcon expanded={expanded} />
                </button>
              ) : (
                <div style={{ width: '1.65rem' }} />
              )}
              <span className="subtask-badge-label">Subtask</span>
              <button type="button" onClick={toggleExpanded} className="task-title-btn" style={{ fontWeight: 700, fontSize: '0.92rem', textAlign: 'left' }}>
                {task.title}
              </button>
            </div>
            {isParentTask && (
              <div style={{ paddingLeft: `${depth * 28 + 44}px`, display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.3rem' }}>
                <div className="task-progress-track" style={{ maxWidth: '120px' }}>
                  <div className="task-progress-fill" style={{ width: `${progress}%` }} />
                </div>
                <span style={{ color: 'var(--muted)', fontSize: '0.74rem', fontWeight: 700 }}>
                  {completedCount}/{totalCount}
                </span>
              </div>
            )}
          </div>
        </div>
        {assigneeBlock}
        {statusBlock}
        {actionButtons}
      </div>

      {expanded && task.subtasks?.length > 0 && (
        <div className="subtasks-panel">
          {task.subtasks.map((child) => (
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
              todayDate={todayDate}
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
  viewMode,
  selectedAssigneeFilter,
  onResetAssigneeFilter,
}) {
  const todayDate = getTodayDate();
  const [filterAssignee, setFilterAssignee] = useState(selectedAssigneeFilter || 'all');
  const [filterStatus, setFilterStatus] = useState('all');

  React.useEffect(() => {
    if (selectedAssigneeFilter) {
      setFilterAssignee(selectedAssigneeFilter);
    }
  }, [selectedAssigneeFilter]);

  const getFilteredTree = (list) => list.map((task) => {
    const matchesAssignee = filterAssignee === 'all'
      || task.assignee === filterAssignee
      || getSubtaskAssigneesRecursive(task).includes(filterAssignee);

    const matchesStatus = filterStatus === 'all' || getEffectiveStatus(task) === filterStatus;

    let matchesView = true;
    if (viewMode === 'today') {
      matchesView = task.dueDate === todayDate && getEffectiveStatus(task) !== 'Complete';
    } else if (viewMode === 'completed') {
      matchesView = getEffectiveStatus(task) === 'Complete';
    }

    const childMatches = getFilteredTree(task.subtasks || []);
    const matchesSelf = matchesAssignee && matchesStatus && matchesView;

    if (matchesSelf || childMatches.length > 0) {
      return {
        ...task,
        subtasks: matchesSelf && task.subtasks?.length ? task.subtasks : childMatches,
      };
    }

    return null;
  }).filter(Boolean);

  const filteredTree = getFilteredTree(tasks);
  const searchActive = filterAssignee !== 'all' || filterStatus !== 'all';

  const titleMap = {
    today: 'Today Tasks',
    all: 'All Tasks',
    completed: 'Completed Tasks',
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-title-sec">
          <h2>{titleMap[viewMode]}</h2>
        </div>

        {selectedAssigneeFilter && selectedAssigneeFilter !== 'all' && (
          <button
            className="nav-link-btn nav-link-cta"
            onClick={() => {
              setFilterAssignee('all');
              onResetAssigneeFilter();
            }}
          >
            Clear Filter
          </button>
        )}
      </div>

      <div className="table-header-row">
        <div className="card-col-date">Date</div>
        <div className="card-col-title">Task</div>
        <div className="card-col-assignee">
          <select
            className="filter-select"
            value={filterAssignee}
            onChange={(event) => {
              setFilterAssignee(event.target.value);
              if (onResetAssigneeFilter) onResetAssigneeFilter();
            }}
          >
            <option value="all">All Assignees</option>
            <option value="Unassigned">Unassigned</option>
            {assignees.map((name) => (
              <option key={name} value={name}>{name}</option>
            ))}
          </select>
        </div>
        <div className="card-col-status">
          <select className="filter-select" value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Complete">Complete</option>
          </select>
        </div>
        <div className="card-col-actions">Actions</div>
      </div>

      <div className="cards-stack">
        {filteredTree.length > 0 ? filteredTree.map((task) => (
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
            todayDate={todayDate}
          />
        )) : (
          <div className="empty-state-card">
            <div className="empty-state-title">No matching tasks</div>
            <p>Try a different filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
