import { useEffect, useMemo, useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import AssigneeList from './components/AssigneeList';
import ApiConverterView from './components/ApiConverterView';
import CustomDropdown from './components/CustomDropdown';
import Login from './components/Login';
import DatePicker from './components/DatePicker';
import ToastViewport from './components/ToastViewport';

const API_BASE = 'http://localhost:5000/api';
const VIEW_PATHS = {
  dashboard: '/dashboard',
  today: '/today',
  all: '/all',
  completed: '/completed',
  assignees: '/assignees',
};

const resolveViewFromPath = (pathname = '/') => {
  const normalizedPath = pathname === '/' ? '/dashboard' : pathname.toLowerCase();
  const match = Object.entries(VIEW_PATHS).find(([, path]) => path === normalizedPath);
  return match?.[0] || 'dashboard';
};

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
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(
    () => localStorage.getItem('isAdminLoggedIn') === 'true'
  );
  const [currentUser, setCurrentUser] = useState(() => {
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    const email = localStorage.getItem('userEmail');
    return role && name ? { role, name, email } : null;
  });
  const [tasks, setTasks] = useState([]);
  const [assignees, setAssignees] = useState([]);
  const [assigneeProfiles, setAssigneeProfiles] = useState([]);
  const [activeView, setActiveView] = useState(() => resolveViewFromPath(window.location.pathname));
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [toasts, setToasts] = useState([]);

  const notify = ({ type = 'success', title = '', message }) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((current) => [...current, { id, type, title, message }]);
    window.setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, 3200);
  };

  const handleLoginSuccess = (token, user) => {
    localStorage.setItem('isAdminLoggedIn', 'true');
    localStorage.setItem('adminToken', token);
    localStorage.setItem('userRole', user.role);
    localStorage.setItem('userName', user.name);
    localStorage.setItem('userEmail', user.email || '');
    setCurrentUser(user);
    setIsAdminLoggedIn(true);
  };

  const handleLogout = async () => {
    localStorage.removeItem('isAdminLoggedIn');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    setCurrentUser(null);
    setIsAdminLoggedIn(false);
    setActiveView('dashboard');
    window.history.replaceState({}, '', VIEW_PATHS.dashboard);
    notify({ type: 'success', title: 'Logged Out', message: 'You have been logged out successfully.' });
  };

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [parentTaskId, setParentTaskId] = useState(null);
  const [parentTaskTitle, setParentTaskTitle] = useState('');
  const [modalAssignee, setModalAssignee] = useState('Unallocated');
  const [modalDescription, setModalDescription] = useState('');
  const [modalDueDate, setModalDueDate] = useState(getTodayDate());
  const [isAddingNewAssignee, setIsAddingNewAssignee] = useState(false);

  const todayDate = getTodayDate();

  useEffect(() => {
    const handlePopState = () => {
      setActiveView(resolveViewFromPath(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const nextPath = VIEW_PATHS[activeView] || VIEW_PATHS.dashboard;
    if (window.location.pathname !== nextPath) {
      window.history.pushState({}, '', nextPath);
    }
  }, [activeView]);

  const fetchTasksAndAssignees = async (signal) => {
    setLoadError('');

    try {
      const [tasksRes, assigneesRes, assigneeDetailsRes] = await Promise.all([
        fetch(`${API_BASE}/tasks`, { signal }),
        fetch(`${API_BASE}/assignees`, { signal }),
        fetch(`${API_BASE}/assignees/details`, { signal }),
      ]);

      if (!tasksRes.ok || !assigneesRes.ok || !assigneeDetailsRes.ok) {
        throw new Error('Unable to load the latest workspace data.');
      }

      const [tasksData, assigneesData, assigneeDetailsData] = await Promise.all([
        tasksRes.json(),
        assigneesRes.json(),
        assigneeDetailsRes.json(),
      ]);

      setTasks(Array.isArray(tasksData) ? tasksData : []);
      setAssignees(Array.isArray(assigneesData) ? assigneesData : []);
      setAssigneeProfiles(Array.isArray(assigneeDetailsData) ? assigneeDetailsData : []);
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
    setModalAssignee('Unallocated');
    setModalDescription('');
    setModalDueDate(todayDate);
    setIsAddingNewAssignee(false);
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
    setModalAssignee(task.assignee || 'Unallocated');
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
      notify({ type: 'warning', title: 'Missing Details', message: 'Please enter a description.' });
      return;
    }

    try {
      const finalAssignee = modalAssignee;

      if (editingTask) {
        const response = await fetch(`${API_BASE}/tasks/${editingTask.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: modalDescription.trim(),
            assignee: finalAssignee,
            dueDate: modalDueDate,
          }),
        });
        if (!response.ok) {
          throw new Error('Failed to update task');
        }
      } else {
        const response = await fetch(`${API_BASE}/tasks`, {
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
        if (!response.ok) {
          throw new Error('Failed to create task');
        }
      }

      await refreshData(false);
      notify({
        type: 'success',
        title: editingTask ? 'Task Updated' : 'Task Created',
        message: editingTask
          ? `${modalDescription.trim()} was updated successfully.`
          : `${modalDescription.trim()} was created successfully.`,
      });
      closeModal();
    } catch (error) {
      notify({ type: 'warning', title: 'Task Save Failed', message: error.message || 'Unable to save the task.' });
      console.error('Error submitting task form:', error);
    }
  };

  const handleUpdateTaskField = async (taskId, updatedFields, task) => {
    const taskTitle = task?.title || 'Task';

    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedFields),
      });
      if (!response.ok) {
        throw new Error('Failed to update task');
      }
      await refreshData(false);

      if (updatedFields.assignee !== undefined) {
        const targetLabel = updatedFields.assignee === 'Unallocated' ? 'Unallocated' : updatedFields.assignee;
        notify({ type: 'success', title: 'Task Assigned', message: `${taskTitle} is assigned to ${targetLabel}.` });
      } else if (updatedFields.status !== undefined) {
        notify({ type: 'success', title: 'Status Updated', message: `${taskTitle} moved to ${updatedFields.status}.` });
      } else {
        notify({ type: 'success', title: 'Task Updated', message: `${taskTitle} was updated successfully.` });
      }
    } catch (error) {
      notify({ type: 'warning', title: 'Update Failed', message: error.message || `Unable to update ${taskTitle}.` });
      console.error('Error updating task:', error);
    }
  };

  const handleDeleteTask = async (taskId) => {
    const task = flattenTasks(tasks).find((item) => item.id === taskId);
    const hasChildren = Boolean(task?.subtasks?.length);

    if (hasChildren) {
      notify({
        type: 'warning',
        title: 'Delete Blocked',
        message: `${task?.title || 'This task'} cannot be deleted until all child tasks are removed.`,
      });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/tasks/${taskId}`, { method: 'DELETE' });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(result?.error || 'Failed to delete task');
      }
      await refreshData(false);
      notify({ type: 'success', title: 'Task Deleted', message: `${task?.title || 'Task'} was deleted successfully.` });
    } catch (error) {
      notify({ type: 'warning', title: 'Delete Failed', message: error.message || 'Unable to delete the task.' });
      console.error('Error deleting task:', error);
    }
  };

  const handleImportTasks = async (newTasks) => {

    const uploadTask = async (task, parentId = null, knownAssignees = new Set(assignees)) => {
      if (task.assignee && task.assignee !== 'Unallocated' && !knownAssignees.has(task.assignee)) {
        throw new Error(`Unknown assignee "${task.assignee}" in imported task data.`);
      }

      const response = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: task.id,
          parentId,
          title: task.title,
          assignee: task.assignee || 'Unallocated',
          status: task.status || 'Pending',
          dueDate: task.dueDate || todayDate,
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to import task "${task.title}".`);
      }

      for (const subtask of task.subtasks || []) {
        await uploadTask(subtask, task.id, knownAssignees);
      }
    };

    try {
      for (const task of newTasks) {
        await uploadTask(task);
      }
      await refreshData(false);
      notify({ type: 'success', title: 'Import Complete', message: `${newTasks.length} tasks imported successfully.` });
    } catch (error) {
      notify({ type: 'warning', title: 'Import Failed', message: error.message || 'Unable to import tasks.' });
      console.error('Error importing tasks:', error);
    }
  };

  const handleAddAssignee = async ({ name, email, password }) => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedName) {
      notify({ type: 'warning', title: 'Missing Name', message: 'Please enter the assignee name.' });
      return false;
    }


    if (assignees.includes(trimmedName) || trimmedName === 'Unallocated') {
      notify({ type: 'warning', title: 'Duplicate Assignee', message: 'Assignee already exists.' });
      return false;
    }

    try {
      const response = await fetch(`${API_BASE}/assignees`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password: trimmedPassword }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to create assignee');
      }

      await refreshData(false);
      notify({ type: 'success', title: 'Member Added', message: `${trimmedName} was added successfully.` });
      return true;
    } catch (error) {
      notify({ type: 'warning', title: 'Create Failed', message: error.message || 'Error creating assignee.' });
      console.error('Error creating assignee:', error);
      return false;
    }
  };

  const handleUpdateAssignee = async (currentName, updates) => {
    const trimmedName = updates.name.trim();
    const trimmedEmail = updates.email.trim().toLowerCase();
    const trimmedPassword = updates.password.trim();

    if (!trimmedName) {
      notify({ type: 'warning', title: 'Missing Name', message: 'Please enter the assignee name.' });
      return false;
    }

    if (!trimmedEmail) {
      notify({ type: 'warning', title: 'Missing Email', message: 'Please enter the assignee email.' });
      return false;
    }

    if (trimmedName !== currentName && assignees.includes(trimmedName)) {
      notify({ type: 'warning', title: 'Duplicate Assignee', message: `${trimmedName} already exists.` });
      return false;
    }

    try {
      const res = await fetch(`${API_BASE}/assignees/${encodeURIComponent(currentName)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          password: trimmedPassword,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to update assignee');
      }

      await refreshData(false);
      notify({ type: 'success', title: 'Member Updated', message: `${trimmedName} was updated successfully.` });
      return true;
    } catch (error) {
      notify({ type: 'warning', title: 'Update Failed', message: error.message || 'Unable to update member.' });
      console.error('Error updating assignee:', error);
      return false;
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
          isAdmin={currentUser?.role === 'admin'}
          canAssignTasks={Boolean(currentUser)}
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
          isAdmin={currentUser?.role === 'admin'}
          canAssignTasks={Boolean(currentUser)}
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
          isAdmin={currentUser?.role === 'admin'}
          canAssignTasks={Boolean(currentUser)}
        />
      );
    }

    if (activeView === 'assignees') {
      return (
        <AssigneeList
          assignees={assignees}
          assigneeProfiles={assigneeProfiles}
          tasks={tasks}
          onSelectAssignee={(name) => {
            setSelectedAssigneeFilter(name);
            setActiveView('all');
          }}
          onAddAssignee={handleAddAssignee}
          onUpdateAssignee={handleUpdateAssignee}
          isAdmin={currentUser?.role === 'admin'}
          canAssignTasks={Boolean(currentUser)}
        />
      );
    }

    return <Dashboard tasks={tasks} assignees={assignees} />;
  };

  if (!isAdminLoggedIn) {
    return <><Login onLoginSuccess={handleLoginSuccess} onNotify={notify} /><ToastViewport toasts={toasts} /></>
  }

  return (
    <div className="app-container">
      <Navbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAddTaskModal={handleOpenCreateModal}
        openTasks={openTasks}
        onLogout={handleLogout}
        userRole={currentUser?.role}
        userName={currentUser?.name}
      />

      <main className="main-content">
        {renderActiveView()}
      </main>

      {isModalOpen && (
        <div className="modal-overlay-bg" onClick={closeModal}>
          <div className="mockup-modal" onClick={(event) => event.stopPropagation()}>
            <button className="mockup-modal-close" onClick={closeModal}>x</button>

            <div className="card-header" style={{ borderBottom: 'none', padding: 0 }}>
              <h3>{editingTask ? 'Edit Task' : parentTaskId ? 'Add Subtask' : 'Create New Task'}</h3>
              {/* <p>
                {editingTask
                  ? 'Modify the selected task properties.'
                  : parentTaskId
                    ? 'Create a child task under the selected parent.'
                    : 'Add a new top-level task to the board.'}
              </p> */}
            </div>

            {parentTaskTitle && <div className="modal-parent-note">Parent: {parentTaskTitle}</div>}

            <form onSubmit={handleModalSubmit} className="mockup-form" style={{ marginTop: '1rem' }}>
              <div className="mockup-form-grid two-col">
                <div className="mockup-form-group">
                  <label className="field-label">Assignee</label>
                  <CustomDropdown
                    value={modalAssignee}
                    onChange={(event) => setModalAssignee(event.target.value)}
                    options={['Unallocated', ...assignees]}
                    style={{ width: '100%' }}
                  />
                </div>

                <div className="mockup-form-group">
                  <label className="field-label">Date</label>
                  <DatePicker
                    value={modalDueDate}
                    onChange={(value) => setModalDueDate(value)}
                    required
                  />
                </div>
              </div>

              <div className="mockup-form-group">
                <label className="field-label">Task Details</label>
                <textarea
                  className="mockup-input mockup-textarea"
                  value={modalDescription}
                  onChange={(event) => setModalDescription(event.target.value)}
                  placeholder="Describe the task clearly"
                  required
                />
              </div>

              <div className="mockup-actions-row" style={{ justifyContent: 'space-between', marginTop: '1.1rem' }}>
                <button type="button" className="nav-link-btn" onClick={closeModal} style={{ minWidth: '180px', justifyContent: 'center' }}>
                  Cancel
                </button>
                <button type="submit" className="nav-link-btn nav-link-cta" style={{ minWidth: '250px', justifyContent: 'center' }}>
                  {editingTask ? 'Save Changes' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ToastViewport toasts={toasts} />
    </div>
  );
}



