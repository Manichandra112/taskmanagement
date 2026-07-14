import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();
console.log({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Create connection pool
// const pool = mysql.createPool({
//   host: process.env.DB_HOST || '127.0.0.1',
//   user: process.env.DB_USER || 'root',
//   password: process.env.DB_PASSWORD || '',
//   database: process.env.DB_NAME || 'task_management',
//   port: parseInt(process.env.DB_PORT || '3306'),
//   multipleStatements: true,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0
// });
const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'task_management',
  port: parseInt(process.env.DB_PORT || '3306'),
  multipleStatements: true,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});
// Setup Schema, Stored Procedure and Triggers recursively
// Setup Schema, Stored Procedure and Triggers recursively
async function initializeDatabase() {
  try {
    console.log('? Initializing database schema...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS assignees (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) UNIQUE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS tasks (
          id VARCHAR(50) PRIMARY KEY,
          parent_id VARCHAR(50) DEFAULT NULL,
          title TEXT NOT NULL,
          assignee_id INT DEFAULT NULL,
          status ENUM('Pending', 'In Progress', 'Complete') DEFAULT 'Pending',
          due_date DATE NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (parent_id) REFERENCES tasks(id) ON DELETE CASCADE,
          FOREIGN KEY (assignee_id) REFERENCES assignees(id) ON DELETE SET NULL
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    await pool.query(`
      ALTER TABLE assignees
      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    await pool.query(`
      ALTER TABLE tasks
      CONVERT TO CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
    `);

    try {
      await pool.query("CREATE INDEX idx_tasks_parent ON tasks(parent_id)");
    } catch (e) { }
    try {
      await pool.query("CREATE INDEX idx_tasks_assignee ON tasks(assignee_id)");
    } catch (e) { }
    try {
      await pool.query("CREATE INDEX idx_tasks_status ON tasks(status)");
    } catch (e) { }

    // Disable database-side trigger syncing for now because MySQL blocks
    // updating the same table from its own trigger chain during subtask inserts.
    await pool.query(`DROP TRIGGER IF EXISTS trg_tasks_after_insert`);
    await pool.query(`DROP TRIGGER IF EXISTS trg_tasks_after_update`);
    await pool.query(`DROP TRIGGER IF EXISTS trg_tasks_after_delete`);
    await pool.query(`DROP PROCEDURE IF EXISTS sp_sync_parent_status;`);

    console.log('? Database schema synchronized.');
    console.log('? Startup skipped demo seed data.');
  } catch (err) {
    console.error('? Failed to initialize database schema: ', err.message);
  }
}

// Helper: Find assignee ID by name
async function getAssigneeIdByName(name) {
  if (!name || name === 'Unassigned') return null;
  const [rows] = await pool.query('SELECT id FROM assignees WHERE name = ?', [name]);
  return rows.length > 0 ? rows[0].id : null;
}

// Helper: Format date string to YYYY-MM-DD
function getTodayDate() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDate(dateVal) {
  if (!dateVal) return getTodayDate();
  const d = new Date(dateVal);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Build recursive tree from flat array rows
function buildTree(list, parentId = null) {
  return list
    .filter(t => t.parent_id === parentId)
    .map(t => ({
      id: t.id,
      parent_id: t.parent_id,
      title: t.title,
      status: t.status,
      dueDate: formatDate(t.due_date),
      assignee: t.assignee_name || 'Unassigned',
      subtasks: buildTree(list, t.id)
    }));
}

// Helper: Get all descendant task IDs recursively
async function getDescendantIds(parentIds) {
  if (!parentIds || parentIds.length === 0) return [];
  const [rows] = await pool.query(
    'SELECT id FROM tasks WHERE parent_id IN (?)',
    [parentIds]
  );
  if (rows.length === 0) return [];
  const childIds = rows.map(r => r.id);
  const nextChildIds = await getDescendantIds(childIds);
  return [...childIds, ...nextChildIds];
}

// Helper: Recalculate and update the status of the root-level parent task if the modified task's parent is the root task
async function syncRootParentStatus(taskId) {
  if (!taskId) return;

  const [rows] = await pool.query('SELECT parent_id FROM tasks WHERE id = ?', [taskId]);
  if (rows.length === 0) return;
  const parentId = rows[0].parent_id;
  if (!parentId) return;

  // Check if parentId is a root task (meaning its parent_id is null)
  const [parentRows] = await pool.query('SELECT parent_id FROM tasks WHERE id = ?', [parentId]);
  if (parentRows.length > 0 && parentRows[0].parent_id === null) {
    const [children] = await pool.query('SELECT status FROM tasks WHERE parent_id = ?', [parentId]);
    if (children.length > 0) {
      const childStatuses = children.map(c => c.status);
      let newStatus = 'Pending';
      if (childStatuses.every(status => status === 'Complete')) {
        newStatus = 'Complete';
      } else if (childStatuses.some(status => status === 'In Progress' || status === 'Complete')) {
        newStatus = 'In Progress';
      }
      await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [newStatus, parentId]);
    }
  }
}

// --- API Endpoints ---

// Fetch all tasks in hierarchical tree representation
app.get('/api/tasks', async (req, res) => {
  try {
    const todayDate = getTodayDate();
    await pool.query(`
      UPDATE tasks
      SET due_date = ?
      WHERE status <> 'Complete' AND due_date < ?
    `, [todayDate, todayDate]);
    const [rows] = await pool.query(`
      SELECT t.*, a.name AS assignee_name 
      FROM tasks t
      LEFT JOIN assignees a ON t.assignee_id = a.id
      ORDER BY t.created_at ASC
    `);
    const tree = buildTree(rows, null);
    res.json(tree);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new task (Root level or Subtask child)
app.post('/api/tasks', async (req, res) => {
  const { id, parentId, title, assignee, status, dueDate } = req.body;
  try {
    const assigneeId = await getAssigneeIdByName(assignee);
    const dbDueDate = dueDate || getTodayDate();

    await pool.query(
      'INSERT INTO tasks (id, parent_id, title, assignee_id, status, due_date) VALUES (?, ?, ?, ?, ?, ?)',
      [id, parentId || null, title, assigneeId, status || 'Pending', dbDueDate]
    );

    await syncRootParentStatus(id);

    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update specific fields of a task node
app.put('/api/tasks/:id', async (req, res) => {
  const taskId = req.params.id;
  const updates = req.body;

  try {
    const setClause = [];
    const values = [];

    if (updates.title !== undefined) {
      setClause.push('title = ?');
      values.push(updates.title);
    }

    if (updates.assignee !== undefined) {
      const assigneeId = await getAssigneeIdByName(updates.assignee);
      setClause.push('assignee_id = ?');
      values.push(assigneeId);
    }

    if (updates.status !== undefined) {
      setClause.push('status = ?');
      values.push(updates.status);
    }

    if (updates.dueDate !== undefined) {
      setClause.push('due_date = ?');
      values.push(updates.dueDate);
    }

    if (setClause.length === 0) {
      return res.status(400).json({ error: 'No fields to update.' });
    }

    values.push(taskId);
    await pool.query(`UPDATE tasks SET ${setClause.join(', ')} WHERE id = ?`, values);

    if (updates.status !== undefined) {
      await syncRootParentStatus(taskId);
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a task (MySQL CASCADE handles child deletion automatically)
app.delete('/api/tasks/:id', async (req, res) => {
  const taskId = req.params.id;
  try {
    const [rows] = await pool.query('SELECT parent_id FROM tasks WHERE id = ?', [taskId]);
    const parentId = rows.length > 0 ? rows[0].parent_id : null;

    await pool.query('DELETE FROM tasks WHERE id = ?', [taskId]);

    if (parentId) {
      const [parentRows] = await pool.query('SELECT parent_id FROM tasks WHERE id = ?', [parentId]);
      if (parentRows.length > 0 && parentRows[0].parent_id === null) {
        const [children] = await pool.query('SELECT status FROM tasks WHERE parent_id = ?', [parentId]);
        if (children.length > 0) {
          const childStatuses = children.map(c => c.status);
          let newStatus = 'Pending';
          if (childStatuses.every(status => status === 'Complete')) {
            newStatus = 'Complete';
          } else if (childStatuses.some(status => status === 'In Progress' || status === 'Complete')) {
            newStatus = 'In Progress';
          }
          await pool.query('UPDATE tasks SET status = ? WHERE id = ?', [newStatus, parentId]);
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch list of all assignees
app.get('/api/assignees', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT name FROM assignees ORDER BY name ASC');
    const names = rows.map(r => r.name);
    res.json(names);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new assignee registry profile
app.post('/api/assignees', async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    await pool.query('INSERT INTO assignees (name) VALUES (?)', [name.trim()]);
    res.status(201).json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Listen on start
app.listen(PORT, async () => {
  console.log(`🚀 Express Backend Server listening on http://localhost:${PORT}`);
  await initializeDatabase();
});










