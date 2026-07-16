import React, { useState } from 'react';
import CustomDropdown from './CustomDropdown';

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getTodayHeading = () => new Date().toLocaleDateString('en-US', {
  weekday: 'long',
  year: 'numeric',
  month: 'long',
  day: 'numeric',
});

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
  if (!name || name === 'Unallocated') return 'UN';
  const clean = name.replace(/^(Lead-|Ravi-|AAA - )/i, '').trim();
  const parts = clean.split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return clean.substring(0, 2).toUpperCase();
};

const getAvatarColor = (name) => {
  if (!name || name === 'Unallocated') return '#8a8f99';
  const colors = ['#c96c50', '#2f7f73', '#476c9b', '#c28b44', '#8f5f94', '#4f8c61'];
  let hash = 0;
  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

const getEffectiveStatus = (task) => {
  if (task.parent_id !== null && task.parent_id !== undefined) {
    return task.status;
  }

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

const getSubtaskAssigneesRecursive = (task, filterAssignee = 'all') => {
  const assigneesSet = new Set();
  const walk = (node) => {
    const matchesFilter = filterAssignee === 'all' || node.assignee === filterAssignee;
    if (matchesFilter && node.assignee && node.assignee !== 'Unallocated') {
      assigneesSet.add(node.assignee);
    }
    if (node.subtasks) {
      node.subtasks.forEach(walk);
    }
  };
  if (task.subtasks) {
    task.subtasks.forEach(walk);
  }
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
  filterAssignee,
  isAdmin,
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const effectiveStatus = getEffectiveStatus(task);
  const { completed: completedCount, total: totalCount } = getDirectSubtaskSummary(task);
  const isParentTask = totalCount > 0;
  const isRootParent = (task.parent_id === null || task.parent_id === undefined) && totalCount > 0;
  const subtaskAssignees = isRootParent ? getSubtaskAssigneesRecursive(task, filterAssignee) : [];
  const expanded = isExpanded;
  const progress = getProgressPercent(task);
  const displayDate = task.dueDate || todayDate;


  const cycleStatus = () => {
    if (!isAdmin) return;
    if (!task.assignee || task.assignee === 'Unallocated') {
      return;
    }
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

    onUpdateTask(task.id, updatedFields, task);
  };

  const handleAssigneeChange = (event) => {
    onUpdateTask(task.id, { assignee: event.target.value }, task);
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
      {isRootParent ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
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
            <span style={{ color: 'var(--muted)', fontSize: '0.82rem' }}>Unallocated</span>
          )}
          <span className="container-label">Group</span>
        </div>
      ) : (
        <div style={{ display: 'flex', justifyContent: 'center', width: '100%' }} onClick={(event) => event.stopPropagation()}>
          <CustomDropdown
            value={task.assignee || 'Unallocated'}
            onChange={handleAssigneeChange}
            options={['Unallocated', ...assignees]}
            style={{ width: '140px' }}
            disabled={!isAdmin}
          />
        </div>
      )}
    </div>
  );

  const isUnallocated = !task.assignee || task.assignee === 'Unallocated';
  const statusBlock = (
    <div className="card-col-status">
      <span
        className={`status-badge ${effectiveStatus.toLowerCase().replace(/\s+/g, '')}`}
        onClick={(isRootParent || isUnallocated || !isAdmin) ? undefined : cycleStatus}
        style={{ 
          cursor: isRootParent ? 'default' : (isUnallocated ? 'not-allowed' : (isAdmin ? 'pointer' : 'default')),
          opacity: isUnallocated && !isRootParent ? 0.65 : 1
        }}
        title={isUnallocated && !isRootParent ? "Assign a person to change status" : ""}
      >
        {effectiveStatus}
      </span>
    </div>
  );

  const actionButtons = (
    <div className="card-col-actions">
      {isAdmin && (
        <div className="hover-actions-group">
          <button className="action-btn-circle add" onClick={() => onAddSubtaskClick(task.id, task.title)} title="Add Subtask">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
          </button>
          <button className="action-btn-circle edit" onClick={() => onOpenEditTask(task)} title="Edit Task">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
          <button className="action-btn-circle delete" onClick={() => onDeleteTask(task.id)} title="Delete Task">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
          </button>
        </div>
      )}
    </div>
  );

  if (depth === 0) {
    return (
      <div className={`parent-task-card task-surface ${effectiveStatus.toLowerCase().replace(/\s+/g, '-')}`}>
        <div className="parent-card-header">
          {dateBlock}
          <div className="card-col-title">
            <div style={{ width: '100%' }}>
              {task.parentPath && task.parentPath.length > 0 && (
                <div style={{ fontSize: '0.72rem', color: 'var(--muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                  {task.parentPath.join(' › ')}
                </div>
              )}
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
                filterAssignee={filterAssignee}
                isAdmin={isAdmin}
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
              filterAssignee={filterAssignee}
              isAdmin={isAdmin}
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
  onOpenCreateTask,
  onAddSubtaskClick,
  viewMode,
  selectedAssigneeFilter,
  onResetAssigneeFilter,
  isAdmin,
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
    const matchesAssignee = filterAssignee === 'all' || task.assignee === filterAssignee;

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
        subtasks: childMatches,
      };
    }

    return null;
  }).filter(Boolean);

  const getFlatFilteredList = (list) => {
    const flat = [];
    const walk = (nodes, parentPath = []) => {
      nodes.forEach((task) => {
        const isLeaf = !task.subtasks || task.subtasks.length === 0;

        const matchesAssignee = filterAssignee === 'all' || task.assignee === filterAssignee;
        const matchesStatus = filterStatus === 'all' || getEffectiveStatus(task) === filterStatus;

        let matchesView = true;
        if (viewMode === 'today') {
          matchesView = task.dueDate === todayDate && getEffectiveStatus(task) !== 'Complete';
        } else if (viewMode === 'completed') {
          matchesView = getEffectiveStatus(task) === 'Complete';
        }

        const currentPath = [...parentPath, task.title];

        if (isLeaf && matchesAssignee && matchesStatus && matchesView) {
          flat.push({
            ...task,
            parentPath: parentPath,
            subtasks: [],
          });
        }

        if (task.subtasks?.length) {
          walk(task.subtasks, currentPath);
        }
      });
    };
    walk(list);
    return flat;
  };

  const filteredTree = getFilteredTree(tasks);
  const searchActive = filterAssignee !== 'all' || filterStatus !== 'all' || viewMode !== 'all';
  const displayTree = filteredTree;

  const titleMap = {
    today: `Today Tasks - ${getTodayHeading()}`,
    all: 'All Tasks',
    completed: 'Completed Tasks',
  };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="page-title-sec">
          <h2>{titleMap[viewMode]}</h2>
        </div>

        {selectedAssigneeFilter && selectedAssigneeFilter !== 'all' && (
          <button
            className="nav-link-btn"
            style={{ padding: '0.55rem 1.2rem', borderRadius: '12px', fontSize: '0.82rem', border: '1px solid var(--line)', background: 'transparent' }}
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
        <div className="card-col-title" style={{ textAlign: 'center', paddingLeft: '0.6rem' }}>Task</div>
        <div className="card-col-assignee">
          <CustomDropdown
            value={filterAssignee}
            onChange={(event) => {
              setFilterAssignee(event.target.value);
              if (onResetAssigneeFilter) onResetAssigneeFilter();
            }}
            options={[
              { value: 'all', label: 'All Assignees' },
              { value: 'Unallocated', label: 'Unallocated' },
              ...assignees.map((name) => ({ value: name, label: name }))
            ]}
            style={{ width: 'calc(100% - 24px)', margin: '0 auto' }}
          />
        </div>
        <div className="card-col-status">
          <CustomDropdown
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value)}
            options={[
              { value: 'all', label: 'All Statuses' },
              { value: 'Pending', label: 'Pending' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Complete', label: 'Complete' }
            ]}
            style={{ width: 'calc(100% - 24px)', margin: '0 auto' }}
          />
        </div>
        <div className="card-col-actions" style={{ justifyContent: 'center' }}>Actions</div>
      </div>

      <div className="cards-stack">
        {displayTree.length > 0 ? displayTree.map((task) => (
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
            filterAssignee={filterAssignee}
            isAdmin={isAdmin}
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

