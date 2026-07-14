import { useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import AssigneeList from './components/AssigneeList';
import ApiConverterView from './components/ApiConverterView';

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
      if (!signal?.aborted) {
        setIsLoading(false);
      }
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

  const refreshData = async () => {
    setIsLoading(true);
    await fetchTasksAndAssignees();
  };

  const handleModalSubmit = async (event) => {
    event.preventDefault();

    if (!modalDescription.trim()) {
      alert('Please enter a description.');
      return;
    }

    try {
      if (editingTask) {
        await fetch(`${API_BASE}/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: modalDescription.trim(),
            assignee: modalAssignee,
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
            assignee: modalAssignee,
          }),
        });
      }

      await refreshData();
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
      await refreshData();
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
      await refreshData();
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
      await refreshData();
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
      await refreshData();
    } catch (error) {
      console.error('Error creating assignee:', error);
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
          <button className="nav-link-btn nav-link-cta" onClick={() => refreshData()}>
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
          <div className="mockup-modal" onClick={(event) => event.stopPropagation()}>
            <button className="mockup-modal-close" onClick={closeModal}>
              x
            </button>
            <h3 className="mockup-modal-title">
              {editingTask ? 'Edit Task' : parentTaskId ? 'Add Subtask' : 'Create Task'}
            </h3>

            {parentTaskTitle && (
              <div className="modal-parent-note">
                Parent task: <strong>{parentTaskTitle}</strong>
              </div>
            )}

            <form onSubmit={handleModalSubmit}>
              {editingTask?.subtasks?.length ? (
                <div className="modal-info-note">This parent task is managed by its subtasks.</div>
              ) : (
                <div className="mockup-form-group">
                  <label className="field-label" htmlFor="assignee-select">Assignee</label>
                  <select
                    id="assignee-select"
                    className="mockup-select"
                    value={modalAssignee}
                    onChange={(event) => setModalAssignee(event.target.value)}
                  >
                    <option value="Unassigned">Unassigned</option>
                    {assignees.map((name) => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="mockup-form-group">
                <label className="field-label" htmlFor="task-description">Task details</label>
                <textarea
                  id="task-description"
                  className="mockup-textarea"
                  placeholder="Describe the task clearly"
                  required
                  value={modalDescription}
                  onChange={(event) => setModalDescription(event.target.value)}
                />
              </div>

              <div className="mockup-form-group">
                <label className="field-label" htmlFor="task-date">Due date</label>
                <input
                  id="task-date"
                  type="date"
                  className="mockup-select"
                  required
                  value={modalDueDate}
                  onChange={(event) => setModalDueDate(event.target.value)}
                />
              </div>

              <button type="submit" className="mockup-btn-create">
                {editingTask ? 'Save changes' : 'Create task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
