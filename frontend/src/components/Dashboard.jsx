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

const getLeafTasks = (list) => flattenTasks(list).filter(
  (task) => !task.subtasks || task.subtasks.length === 0,
);

const isRootParentTask = (task) => (
  (task.parent_id === null || task.parent_id === undefined) && task.subtasks?.length > 0
);

const formatStatusClass = (status) => status.toLowerCase().replace(/\s+/g, '');

const getTodayDate = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getDateLabel = (dueDate, todayDate) => {
  if (dueDate < todayDate) return 'Delayed';
  if (dueDate === todayDate) return 'Today';
  return dueDate;
};

const getTaskHealth = (task, todayDate) => {
  if (task.status === 'Complete') return 'Complete';
  if (task.dueDate < todayDate) return 'Delayed';
  if (task.dueDate === todayDate) return 'Due Today';
  return 'Upcoming';
};

const getAssigneeLabel = (task) => task.assignee && task.assignee !== 'Unallocated'
  ? task.assignee
  : 'Unallocated';

export default function Dashboard({ tasks, assignees }) {
  const allTasks = flattenTasks(tasks);
  const assignableTasks = allTasks.filter((task) => !isRootParentTask(task));
  const leafTasks = getLeafTasks(tasks);
  const todayDate = getTodayDate();

  const stats = leafTasks.reduce((acc, task) => {
    if (task.status === 'Pending') acc.pending += 1;
    if (task.status === 'In Progress') acc.inProgress += 1;
    if (task.status === 'Complete') acc.complete += 1;
    if (task.status !== 'Complete' && task.dueDate === todayDate) acc.dueToday += 1;
    return acc;
  }, {
    pending: 0,
    inProgress: 0,
    complete: 0,
    dueToday: 0,
  });

  const completionRate = leafTasks.length > 0
    ? Math.round((stats.complete / leafTasks.length) * 100)
    : 0;

  const totalAssignableTasks = assignableTasks.length;

  const focusTasks = [...leafTasks]
    .filter((task) => task.status !== 'Complete')
    .sort((a, b) => {
      if (a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return a.title.localeCompare(b.title);
    })
    .slice(0, 5);

  const recentWins = [...leafTasks]
    .filter((task) => task.status === 'Complete')
    .sort((a, b) => b.dueDate.localeCompare(a.dueDate) || a.title.localeCompare(b.title))
    .slice(0, 4);

  const assigned = assignableTasks.filter((task) => task.assignee && task.assignee !== 'Unallocated').length;
  const unassigned = assignableTasks.filter((task) => !task.assignee || task.assignee === 'Unallocated').length;

  const summaryMetrics = [
    { label: 'Total Tasks',  value: totalAssignableTasks, note: 'Tasks that can be assigned to members', tone: 'total' },
    { label: 'Assigned',     value: assigned,          note: 'Have an owner',           tone: 'assigned' },
    { label: 'Unassigned',   value: unassigned,        note: 'Need to be allocated',    tone: 'unassigned' },
    { label: 'In Progress',  value: stats.inProgress,  note: 'Currently being worked',  tone: 'inprogress' },
    { label: 'Completed',    value: stats.complete,    note: `${completionRate}% done`, tone: 'complete' },
  ];

  return (
    <div className="dashboard-shell">
      <section className="kpi-grid">
        {summaryMetrics.map((item) => (
          <article key={item.label} className={`kpi-card ${item.tone}`}>
            <span className="kpi-title">{item.label}</span>
            <strong className="kpi-value">{item.value}</strong>
            <p className="kpi-desc">{item.note}</p>
          </article>
        ))}
      </section>

      <section className="dashboard-panel-grid">
        <article className="dashboard-card spotlight-card">
          <div className="dashboard-card-head">
            <div>
              <span className="section-tag">Priority queue</span>
              <h3>Next tasks to move</h3>
            </div>
            <strong>{focusTasks.length}</strong>
          </div>

          <div className="dashboard-focus-list">
            {focusTasks.length > 0 ? focusTasks.map((task, index) => (
              <div key={task.id} className="dashboard-focus-item">
                <div className="dashboard-rank">{String(index + 1).padStart(2, '0')}</div>
                <div className="dashboard-focus-content">
                  <div className="dashboard-focus-topline">
                    <strong>{task.title}</strong>
                    <span className={`status-badge ${formatStatusClass(task.status)}`}>{task.status}</span>
                  </div>
                  <div className="dashboard-focus-meta">
                    <span>{getAssigneeLabel(task)}</span>
                    <span>{getDateLabel(task.dueDate, todayDate)}</span>
                    <span>{getTaskHealth(task, todayDate)}</span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="dashboard-empty-state">No active tasks in the priority queue.</div>
            )}
          </div>
        </article>

        <article className="dashboard-card summary-card">
          <div className="dashboard-card-head compact">
            {/* <div>
              <span className="section-tag">Delivery health</span>
              <h3>Workload snapshot</h3>
            </div> */}
          </div>


          <div className="recent-win-wrap">
            <div className="mini-heading">Recent completions</div>
            {recentWins.length > 0 ? recentWins.map((task) => (
              <div key={task.id} className="dashboard-win-item">
                <span className="win-dot" />
                <div>
                  <strong>{task.title}</strong>
                  <span>{getAssigneeLabel(task)} � {task.dueDate}</span>
                </div>
              </div>
            )) : (
              <div className="dashboard-empty-state">Completed tasks will appear here.</div>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}


