import { useState } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import TaskList from './components/TaskList';
import AssigneeList from './components/AssigneeList';
import ApiConverterView from './components/ApiConverterView';

import { initialTasks } from './data/initialTasks';
import { initialAssignees } from './data/initialAssignees';

export default function App() {
  const [tasks, setTasks] = useState(initialTasks);
  const [assignees, setAssignees] = useState(initialAssignees);
  const [activeView, setActiveView] = useState('dashboard'); // Default to 'dashboard'
  const [selectedAssigneeFilter, setSelectedAssigneeFilter] = useState(null);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null); // null = Create, object = Edit
  const [parentTaskId, setParentTaskId] = useState(null); // parent ID if adding subtask
  const [parentTaskTitle, setParentTaskTitle] = useState(''); // parent title if adding subtask

  // Modal Form Fields (Defaulting to 'Unassigned')
  const [modalAssignee, setModalAssignee] = useState('Unassigned');
  const [modalDescription, setModalDescription] = useState('');

  const todayDate = '2026-07-14';

  // --- Recursive Tree Helper Functions ---

  // Add a subtask recursively under a parent task
  const addSubtaskRecursive = (list, parentId, newSubtask) => {
    return list.map(item => {
      if (item.id === parentId) {
        return {
          ...item,
          subtasks: [...(item.subtasks || []), newSubtask]
        };
      } else if (item.subtasks && item.subtasks.length > 0) {
        return {
          ...item,
          subtasks: addSubtaskRecursive(item.subtasks, parentId, newSubtask)
        };
      }
      return item;
    });
  };

  // Update task attributes recursively anywhere in the tree
  const updateTaskRecursive = (list, taskId, updatedFields) => {
    return list.map(item => {
      if (item.id === taskId) {
        return {
          ...item,
          ...updatedFields
        };
      } else if (item.subtasks && item.subtasks.length > 0) {
        return {
          ...item,
          subtasks: updateTaskRecursive(item.subtasks, taskId, updatedFields)
        };
      }
      return item;
    });
  };

  // Delete a task node and all its children recursively
  const deleteTaskRecursive = (list, taskId) => {
    return list
      .filter(item => item.id !== taskId)
      .map(item => {
        if (item.subtasks && item.subtasks.length > 0) {
          return {
            ...item,
            subtasks: deleteTaskRecursive(item.subtasks, taskId)
          };
        }
        return item;
      });
  };

  // Automated Sync Engine: Recalculate parent statuses recursively based on subtask statuses
  const syncParentStatuses = (list) => {
    return list.map(item => {
      if (item.subtasks && item.subtasks.length > 0) {
        // Recurse first to sync deeper sub-stages
        const syncedChildren = syncParentStatuses(item.subtasks);
        
        // Determine parent status based on synced children
        let newStatus = 'Pending';
        const allComplete = syncedChildren.every(c => c.status === 'Complete');
        const anyActive = syncedChildren.some(c => c.status === 'Complete' || c.status === 'In Progress');
        
        if (allComplete) {
          newStatus = 'Complete';
        } else if (anyActive) {
          newStatus = 'In Progress';
        }
        
        const updatedItem = {
          ...item,
          subtasks: syncedChildren,
          status: newStatus
        };
        
        // Lock completion date if parent becomes completed
        if (newStatus === 'Complete' && item.status !== 'Complete') {
          updatedItem.dueDate = todayDate;
        }
        
        return updatedItem;
      }
      return item;
    });
  };

  // --- Handlers ---

  // Trigger modal for creating a root task (Defaults assignee to Unassigned)
  const handleOpenCreateModal = () => {
    setEditingTask(null);
    setParentTaskId(null);
    setParentTaskTitle('');
    setModalAssignee('Unassigned');
    setModalDescription('');
    setIsModalOpen(true);
  };

  // Trigger modal for creating a child subtask (Defaults assignee to Unassigned)
  const handleOpenSubtaskModal = (parentId, parentTitle) => {
    setEditingTask(null);
    setParentTaskId(parentId);
    setParentTaskTitle(parentTitle);
    setModalAssignee('Unassigned');
    setModalDescription('');
    setIsModalOpen(true);
  };

  // Trigger modal for editing a task/subtask
  const handleOpenEditModal = (task) => {
    setEditingTask(task);
    setParentTaskId(null);
    setParentTaskTitle('');
    setModalAssignee(task.assignee || 'Unassigned');
    setModalDescription(task.title || '');
    setIsModalOpen(true);
  };

  // Submit handler for creating, editing or adding subtask
  const handleModalSubmit = (e) => {
    e.preventDefault();
    if (!modalDescription.trim()) {
      alert("Please enter a description!");
      return;
    }

    if (editingTask) {
      // Edit Task Node anywhere in the tree (does NOT touch creation date)
      setTasks(prev => {
        const updated = updateTaskRecursive(prev, editingTask.id, {
          title: modalDescription.trim(),
          assignee: modalAssignee
        });
        return syncParentStatuses(updated);
      });
    } else if (parentTaskId) {
      // Add Subtask Node nested under parent
      const newSubtask = {
        id: `task_${Date.now()}`,
        title: modalDescription.trim(),
        dueDate: todayDate, // Auto set to today's date
        status: 'Pending',
        assignee: modalAssignee,
        subtasks: []
      };
      setTasks(prev => {
        const updated = addSubtaskRecursive(prev, parentTaskId, newSubtask);
        return syncParentStatuses(updated);
      });
    } else {
      // Create Root Task Node
      const newTask = {
        id: `task_${Date.now()}`,
        title: modalDescription.trim(),
        dueDate: todayDate, // Auto set to today's date
        status: 'Pending',
        assignee: modalAssignee,
        subtasks: []
      };
      setTasks(prev => [newTask, ...prev]);
    }

    setIsModalOpen(false);
    setModalDescription('');
    setParentTaskId(null);
    setParentTaskTitle('');
  };

  const handleUpdateTaskField = (taskId, updatedFields) => {
    setTasks(prev => {
      const updated = updateTaskRecursive(prev, taskId, updatedFields);
      return syncParentStatuses(updated);
    });
  };

  const handleDeleteTask = (taskId) => {
    if (window.confirm("Are you sure you want to delete this task/subtask and all its children?")) {
      setTasks(prev => {
        const updated = deleteTaskRecursive(prev, taskId);
        return syncParentStatuses(updated);
      });
    }
  };

  const handleImportTasks = (newTasks) => {
    // Import and then sync parent statuses to keep consistency
    const synced = syncParentStatuses(newTasks);
    setTasks(synced);
    
    // Extract unique assignees recursively
    const extractAssignees = (list) => {
      let found = [];
      list.forEach(t => {
        if (t.assignee && t.assignee !== 'Unassigned') found.push(t.assignee);
        if (t.subtasks && t.subtasks.length > 0) {
          found = [...found, ...extractAssignees(t.subtasks)];
        }
      });
      return found;
    };
    const importedAssignees = Array.from(new Set(extractAssignees(synced)));
    setAssignees(prev => {
      const merged = new Set([...prev, ...importedAssignees]);
      return Array.from(merged).filter(Boolean);
    });
  };

  const handleAddAssignee = (name) => {
    if (assignees.includes(name) || name === 'Unassigned') {
      alert("Assignee already exists!");
      return;
    }
    setAssignees(prev => [...prev, name]);
  };

  return (
    <div className="app-container">
      {/* Navbar Header */}
      <Navbar 
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenAddTaskModal={handleOpenCreateModal}
      />

      {/* Main Workplace container */}
      <main className="main-content">
        
        {/* Dashboard view */}
        {activeView === 'dashboard' && (
          <Dashboard 
            tasks={tasks}
            assignees={assignees}
          />
        )}

        {/* Today Tasks view */}
        {activeView === 'today' && (
          <TaskList 
            tasks={tasks}
            assignees={assignees}
            onUpdateTask={handleUpdateTaskField}
            onDeleteTask={handleDeleteTask}
            onOpenEditTask={handleOpenEditModal}
            onAddSubtaskClick={handleOpenSubtaskModal}
            viewMode="today"
          />
        )}

        {/* All Tasks view */}
        {activeView === 'all' && (
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
        )}

        {/* Completed Tasks view */}
        {activeView === 'completed' && (
          <TaskList 
            tasks={tasks}
            assignees={assignees}
            onUpdateTask={handleUpdateTaskField}
            onDeleteTask={handleDeleteTask}
            onOpenEditTask={handleOpenEditModal}
            onAddSubtaskClick={handleOpenSubtaskModal}
            viewMode="completed"
          />
        )}

        {/* Assignees registry view */}
        {activeView === 'assignees' && (
          <AssigneeList 
            assignees={assignees}
            tasks={tasks}
            onSelectAssignee={(name) => {
              setSelectedAssigneeFilter(name);
              setActiveView('all');
            }}
            onAddAssignee={handleAddAssignee}
          />
        )}

        {/* API Transporter view */}
        {activeView === 'api-converter' && (
          <ApiConverterView 
            tasks={tasks}
            onImportTasks={handleImportTasks}
          />
        )}
      </main>

      {/* Mockup Modal matching the Create Task mockup popup */}
      {isModalOpen && (
        <div className="modal-overlay-bg" onClick={() => setIsModalOpen(false)}>
          <div className="mockup-modal" onClick={(e) => e.stopPropagation()}>
            <button className="mockup-modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            <h3 className="mockup-modal-title">
              {editingTask ? 'Edit Task' : parentTaskId ? 'Add Subtask' : 'Create Task'}
            </h3>
            
            {parentTaskTitle && (
              <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', marginBottom: '1.25rem', fontWeight: '500' }}>
                ↳ Parent Task: <strong>{parentTaskTitle}</strong>
              </div>
            )}
            
            <form onSubmit={handleModalSubmit}>
              {/* Dropdown for Assignee selection (Hide and lock for parent tasks) */}
              {editingTask && editingTask.subtasks && editingTask.subtasks.length > 0 ? (
                <div style={{ 
                  fontSize: '0.85rem', 
                  color: 'var(--text-muted)', 
                  marginBottom: '1.75rem', 
                  padding: '0.75rem 1rem', 
                  background: 'var(--bg-tertiary)', 
                  borderRadius: '8px',
                  border: '1.5px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontWeight: '500'
                }}>
                  ℹ️ Assignee and status are automatically managed by subtasks.
                </div>
              ) : (
                <div className="mockup-form-group">
                  <select 
                    className="mockup-select"
                    value={modalAssignee}
                    onChange={(e) => setModalAssignee(e.target.value)}
                  >
                    <option value="Unassigned">👥 Unassigned</option>
                    {assignees.map(name => (
                      <option key={name} value={name}>{name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Textarea for Description */}
              <div className="mockup-form-group">
                <textarea
                  className="mockup-textarea"
                  placeholder="Description"
                  required
                  value={modalDescription}
                  onChange={(e) => setModalDescription(e.target.value)}
                />
              </div>

              {/* Action Button */}
              <button type="submit" className="mockup-btn-create">
                {editingTask ? 'Save' : 'Create'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
