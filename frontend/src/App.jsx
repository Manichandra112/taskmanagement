import { useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import AssigneeList from './components/AssigneeList';
import ApiConverterView from './components/ApiConverterView';
import CustomDropdown from './components/CustomDropdown';

const API_BASE = 'http://localhost:5000/api';

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const flattenTasks = (list) => {
  const flat = [];
  const walk = (nodes) => {
    nodes.forEach((node) => {
      flat.push(node);
      if (node.subtasks?.length) {
        walk(node.subtasks);
      }
    });
  };
  walk(list);
  return flat;
};

export default function App() {
  const [tasks, setTasks] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [parentTaskId, setParentTaskId] = useState(null);
  const [parentTaskTitle, setParentTaskTitle] = useState('');
  const [modalAssignee, setModalAssignee] = useState('Unassigned');
  const [modalDescription, setModalDescription] = useState('');
  const [modalDueDate, setModalDueDate] = useState(getTodayDate());
  const [isAddingNewAssignee, setIsAddingNewAssignee] = useState(false);
  const [newAssigneeInput, setNewAssigneeInput] = useState('');

  const todayDate = getTodayDate();

  const fetchTasksAndAssignees = async (signal) => {
    setLoadError('');

    try {
      const [tasksRes, assigneesRes] = await Promise.all([
        fetch(`${API_BASE}/tasks`, { signal }),
        fetch(`${API_BASE}/assignees`, { signal }),
      ]);

      if (!tasksRes.ok || !assigneesRes.ok) {
        throw new Error('Unable to load the latest workspace data.');
      }

      const [tasksData, assigneesData] = await Promise.all([
        tasksRes.json(),
        assigneesRes.json(),
      ]);

      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setAssignees(Array.isArray(assigneesData) ? assigneesData : []);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error loading task data from Express backend:', error);
        setLoadError('Could not reach the backend. Make sure the API is running on port 5000.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchTasksAndAssignees(controller.signal);
    return () => controller.abort();
  }, []);

  const resetModal = () => {
    setEditingTask(null);
    setParentTaskId(null);
    setParentTaskTitle('');
    setModalAssignee('Unassigned');
    setModalDescription('');
    setModalDueDate(todayDate);
    setIsAddingNewAssignee(false);
    setNewAssigneeInput('');
  };

  const closeModal = () => {
    setIsModalOpen(false);
    resetModal();
  };

  const handleOpenCreateModal = () => {
    resetModal();
    setIsModalOpen(true);
  };

  const handleOpenSubtaskModal = (parentId, parentTitle) => {
    resetModal();
    setParentTaskId(parentId);
    setParentTaskTitle(parentTitle);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setParentTaskId(null);
    setParentTaskTitle('');
    setModalAssignee(task.assignee || 'Unassigned');
    setModalDescription(task.title || '');
    setModalDueDate(task.dueDate || todayDate);
    setIsModalOpen(true);
  };

  const refreshData = async (showLoading = false) => {
    if (showLoading) {
      setIsLoading(true);
    }
    await fetchTasksAndAssignees();
  };

  const handleModalSubmit = async (event) => {
    event.preventDefault();

    if (!modalDescription.trim()) {
      alert('Please enter a description.');
      return;
    }

    try {
      let finalAssignee = modalAssignee;
      if (isAddingNewAssignee) {
        const trimmedName = newAssigneeInput.trim();
        if (!trimmedName) {
          alert('Please enter a name for the new assignee.');
          return;
        }
        if (assignees.includes(trimmedName)) {
          finalAssignee = trimmedName;
        } else {
          await fetch(`${API_BASE}/assignees`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: trimmedName }),
          });
          finalAssignee = trimmedName;
        }
      }

      if (editingTask) {
        await fetch(`${API_BASE}/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: modalDescription.trim(),
            assignee: finalAssignee,
            dueDate: modalDueDate,
          }),
        });
      } else {
        await fetch(`${API_BASE}/tasks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: `task_${Date.now()}`,
            parentId: parentTaskId,
            title: modalDescription.trim(),
            dueDate: modalDueDate,
            status: 'Pending',
            assignee: finalAssignee,
          }),
        });
      }

      await refreshData(false);
      closeModal();
    } catch (error) {
      console.error('Error submitting task form:', error);
    }
  };

  const handleUpdateTaskField = async (taskId, updatedFields) => {
    try {
      await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      await refreshData(false);
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task and its subtasks?')) {
      return;
    }

    try {
      await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' });
      await refreshData(false);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const handleImportTasks = async (newTasks) => {
    const uploadTask = async (task, parentId = null, knownAssignees = new Set(assignees)) => {
      if (task.assignee && task.assignee !== 'Unassigned' && !knownAssignees.has(task.assignee)) {
        await fetch(`${API_BASE}/assignees`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: task.assignee }),
        });
        knownAssignees.add(task.assignee);
      }

      await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          parentId,
          title: task.title,
          assignee: task.assignee || 'Unassigned',
          status: task.status || 'Pending',
          dueDate: task.dueDate || todayDate,
        }),
      });

      for (const subtask of task.subtasks || []) {
        await uploadTask(subtask, task.id, knownAssignees);
      }
    };

    try {
      for (const task of newTasks) {
        await uploadTask(task);
      }
      await refreshData(false);
    } catch (error) {
      console.error('Error importing tasks:', error);
    }
  };

  const handleAddAssignee = async (name) => {
    if (assignees.includes(name) || name === 'Unassigned') {
      alert('Assignee already exists.');
      return;
    }

    try {
      await fetch(`${API_BASE}/assignees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      await refreshData(false);
    } catch (error) {
      console.error('Error creating assignee:', error);
    }
  };

  const handleRenameAssignee = async (oldName, newName) => {
    if (!newName || !newName.trim()) return;
    if (assignees.includes(newName.trim()) && newName.trim() !== oldName) {
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/assignees/${encodeURIComponent(oldName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newName: newName.trim() }),
      });
      if (!res.ok) {
        throw new Error('Failed to rename assignee');
      }
      await refreshData(false);
    } catch (error) {
      console.error('Error renaming assignee:', error);
    }
  };

  const leafTasks = useMemo(
    () => flattenTasks(tasks).filter((task) => !task.subtasks || task.subtasks.length === 0),
    [tasks],
  );

  const openTasks = leafTasks.filter((task) => task.status !== 'Complete').length;

  const renderActiveView = () => {
    if (isLoading) {
      return (
        <section className="empty-state-card">
          <div className="empty-state-title">Loading workspace</div>
          <p>Pulling the latest tasks and assignees.</p>
        </section>
      );
    }

    if (loadError) {
      return (
        <section className="empty-state-card error">
          <div className="empty-state-title">Connection issue</div>
          <p>{loadError}</p>
          <button className="nav-link-btn nav-link-cta" onClick={() => refreshData(true)}>
            Retry
          </button>
        </section>
      );
    }

    if (activeView === 'dashboard') {
      return <Dashboard tasks={tasks} assignees={assignees} />;
    }

    if (activeView === 'today') {
      return (
        <TaskList
          tasks={tasks}
          assignees={assignees}
          onUpdateTask={handleUpdateTaskField}
          onDeleteTask={handleDeleteTask}
          onOpenEditTask={handleOpenEditModal}
          onOpenCreateTask={handleOpenCreateModal}
          onAddSubtaskClick={handleOpenSubtaskModal}
          viewMode="today"
        />
      );
    }

    if (activeView === 'all') {
      return (
        <TaskList
          tasks={tasks}
          assignees={assignees}
          onUpdateTask={handleUpdateTaskField}
          onDeleteTask={handleDeleteTask}
          onOpenEditTask={handleOpenEditModal}
          onOpenCreateTask={handleOpenCreateModal}
          onAddSubtaskClick={handleOpenSubtaskModal}
          viewMode="all"
          selectedAssigneeFilter={selectedAssigneeFilter}
          onResetAssigneeFilter={() => setSelectedAssigneeFilter(null)}
        />
      );
    }

    if (activeView === 'completed') {
      return (
        <TaskList
          tasks={tasks}
          assignees={assignees}
          onUpdateTask={handleUpdateTaskField}
          onDeleteTask={handleDeleteTask}
          onOpenEditTask={handleOpenEditModal}
          onOpenCreateTask={handleOpenCreateModal}
          onAddSubtaskClick={handleOpenSubtaskModal}
          viewMode="completed"
        />
      );
    }

    if (activeView === 'assignees') {
      return (
        <AssigneeList
          assignees={assignees}
          tasks={tasks}
          onSelectAssignee={(name) => {
            setSelectedAssigneeFilter(name);
            setActiveView('all');
          }}
          onAddAssignee={handleAddAssignee}
          onRenameAssignee={handleRenameAssignee}
        />
      );
    }

    return <ApiConverterView tasks={tasks} onImportTasks={handleImportTasks} />;
  };

  return (
    <div className="app-container">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAddTaskModal={handleOpenCreateModal}
        openTasks={openTasks}
      />

      <main className="main-content">
        {renderActiveView()}
      </main>

      {isModalOpen && (
        <div className="modal-overlay-bg" onClick={closeModal}>
          <div className="mockup-modal" onClick={(event) => event.stopPropagation()} style={{ width: 'min(500px, 100%)', padding: '1.8rem' }}>
            <button className="mockup-modal-close" onClick={closeModal}>×</button>
            
            <div className="card-header" style={{ borderBottom: 'none', padding: 0, marginBottom: '1.2rem' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
                {editingTask ? 'Edit Task' : parentTaskId ? 'Add Subtask' : 'Create Task'}
              </h3>
              <p style={{ color: 'var(--muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                {editingTask ? 'Modify the selected task properties.' : parentTaskId ? 'Create a nested subtask under the parent.' : 'Create a top-level task to start tracking.'}
              </p>
            </div>

            {parentTaskTitle && (
              <div className="modal-parent-note" style={{ padding: '0.65rem 0.85rem', fontSize: '0.85rem', marginBottom: '1.2rem' }}>
                Parent: <strong>{parentTaskTitle}</strong>
              </div>
            )}

            <form onSubmit={handleModalSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              {editingTask?.parent_id === null && editingTask?.subtasks?.length ? (
                <div>
                  <div className="modal-info-note" style={{ padding: '0.65rem 0.85rem', fontSize: '0.82rem', marginBottom: '1.2rem' }}>
                    This parent task's status and progress are calculated automatically from its subtasks.
                  </div>
                  <div className="mockup-form-group">
                    <label className="field-label" htmlFor="task-date">Date</label>
                    <input
                      id="task-date"
                      type="date"
                      className="mockup-select"
                      required
                      value={modalDueDate}
                      onChange={(event) => setModalDueDate(event.target.value)}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div className="mockup-form-group" style={{ marginBottom: 0 }}>
                    <label className="field-label" htmlFor="assignee-select">Assignee</label>
                    <CustomDropdown
                      value={isAddingNewAssignee ? '_new_' : modalAssignee}
                      onChange={(event) => {
                        const val = event.target.value;
                        if (val === '_new_') {
                          setIsAddingNewAssignee(true);
                        } else {
                          setIsAddingNewAssignee(false);
                          setModalAssignee(val);
                        }
                      }}
                      options={[
                        { value: 'Unassigned', label: 'Unassigned' },
                        ...assignees.map((name) => ({ value: name, label: name })),
                        { value: '_new_', label: '+ Add New Assignee...', special: true }
                      ]}
                    />
                  </div>

                  <div className="mockup-form-group" style={{ marginBottom: 0 }}>
                    <label className="field-label" htmlFor="task-date">Date</label>
                    <input
                      id="task-date"
                      type="date"
                      className="mockup-select"
                      required
                      value={modalDueDate}
                      onChange={(event) => setModalDueDate(event.target.value)}
                    />
                  </div>
                </div>
              )}

              {isAddingNewAssignee && !(editingTask?.parent_id === null && editingTask?.subtasks?.length) && (
                <div className="mockup-form-group" style={{ border: '1px solid var(--line-strong)', borderRadius: '14px', padding: '0.8rem', background: 'rgba(201, 108, 80, 0.03)', marginBottom: 0 }}>
                  <label className="field-label" style={{ color: 'var(--accent)' }}>New Assignee Name</label>
                  <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="e.g. Alice Smith"
                      className="mockup-select"
                      style={{ flex: 1, background: '#fff' }}
                      value={newAssigneeInput}
                      onChange={(event) => setNewAssigneeInput(event.target.value)}
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      className="nav-link-btn"
                      style={{ padding: '0.5rem 1rem', fontSize: '0.78rem', background: 'rgba(33, 53, 71, 0.06)', color: 'var(--text)' }}
                      onClick={() => {
                        setIsAddingNewAssignee(false);
                        setNewAssigneeInput('');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <div className="mockup-form-group">
                <label className="field-label" htmlFor="task-description">Task Details</label>
                <textarea
                  id="task-description"
                  className="mockup-textarea"
                  style={{ minHeight: '80px' }}
                  placeholder="Describe the task clearly"
                  required
                  value={modalDescription}
                  onChange={(event) => setModalDescription(event.target.value)}
                />
              </div>

              <div style={{ display: 'flex', gap: '0.8rem', marginTop: '0.4rem' }}>
                <button
                  type="button"
                  className="nav-link-btn"
                  style={{ flex: 1, justifyContent: 'center', background: 'rgba(33, 53, 71, 0.06)', color: 'var(--text)' }}
                  onClick={closeModal}
                >
                  Cancel
                </button>
                <button type="submit" className="nav-link-btn nav-link-cta" style={{ flex: 1.5, justifyContent: 'center' }}>
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
