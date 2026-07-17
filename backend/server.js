import express from 'express';
import mysql from 'mysql2/promise';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

// Helper to hash password using SHA-256
function hashPassword(password) {
  if (!password) return '';
  return crypto.createHash('sha256').update(password).digest('hex');
}

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
          email VARCHAR(255) UNIQUE DEFAULT NULL,
          password VARCHAR(255) DEFAULT NULL,
          role VARCHAR(20) DEFAULT 'user',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    try {
      await pool.query('ALTER TABLE assignees ADD COLUMN email VARCHAR(255) UNIQUE DEFAULT NULL');
    } catch (e) {}
    try {
      await pool.query('ALTER TABLE assignees ADD COLUMN password VARCHAR(255) DEFAULT NULL');
    } catch (e) {}
    try {
      await pool.query("ALTER TABLE assignees ADD COLUMN role VARCHAR(20) DEFAULT 'user'");
    } catch (e) {}

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

    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Drop legacy users table if it exists
    try {
      await pool.query('DROP TABLE IF EXISTS users');
    } catch (e) {}

    // Seed default admin user in assignees table if not present.
    const adminName = process.env.ADMIN_NAME || 'admin';
    const adminEmail = process.env.ADMIN_EMAIL || process.env.ADMIN_USERNAME || 'adminN@gmail.com';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin';
    const hashedPassword = hashPassword(adminPassword);

    const [existingAdmin] = await pool.query(
      'SELECT * FROM assignees WHERE email = ? OR name = ? OR name = ?',
      [adminEmail, adminName, adminEmail]
    );

    if (existingAdmin.length === 0) {
      await pool.query(
        'INSERT INTO assignees (name, email, password, role) VALUES (?, ?, ?, ?)',
        [adminName, adminEmail, hashedPassword, 'admin']
      );
      console.log('Seeded default admin credentials with separate name and email.');
    } else {
      const adminRecord = existingAdmin[0];
      if (
        adminRecord.password === null ||
        adminRecord.password.length !== 64 ||
        adminRecord.role !== 'admin' ||
        adminRecord.email !== adminEmail ||
        adminRecord.name !== adminName
      ) {
        await pool.query(
          'UPDATE assignees SET name = ?, email = ?, password = ?, role = ? WHERE id = ?',
          [adminName, adminEmail, hashedPassword, 'admin', adminRecord.id]
        );
        console.log('Updated existing admin record with separate name, email, password, and role.');
      }
    }

    // Set default password for any other assignees who do not have a password
    try {
      const defaultUserHashed = hashPassword('password');
      await pool.query('UPDATE assignees SET password = ? WHERE password IS NULL', [defaultUserHashed]);
    } catch (e) {}

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
    return true;
  } catch (err) {
    console.error('? Failed to initialize database schema: ', err.message);
    throw err;
  }
}

// Helper: Find assignee ID by name
async function getAssigneeIdByName(name) {
  if (!name || name === 'Unallocated') return null;
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
      assignee: t.assignee_name || 'Unallocated',
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

// Admin login credentials check
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email and password are required.' });
  }

  try {
    await pool.query('SELECT 1');
    const hashedPassword = hashPassword(password);
    const [rows] = await pool.query('SELECT * FROM assignees WHERE (email = ? OR name = ?) AND password = ?', [email, email, hashedPassword]);
    if (rows.length > 0) {
      const user = rows[0];
      return res.json({ 
        success: true, 
        token: 'mock-jwt-admin-token',
        user: {
          name: user.name,
          email: user.email || email,
          role: user.role
        }
      });
    } else {
      return res.status(401).json({ success: false, error: 'Invalid username or password' });
    }
  } catch (err) {
    console.error('Login failed:', err.message);
    return res.status(500).json({ success: false, error: 'Database error occurred during login.' });
  }
});

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

// Delete a task only when it has no child tasks.
app.delete('/api/tasks/:id', async (req, res) => {
  const taskId = req.params.id;
  try {
    const [rows] = await pool.query('SELECT id, parent_id, title FROM tasks WHERE id = ?', [taskId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const { parent_id: parentId, title } = rows[0];
    const [childRows] = await pool.query('SELECT id FROM tasks WHERE parent_id = ? LIMIT 1', [taskId]);
    if (childRows.length > 0) {
      return res.status(409).json({ error: `Cannot delete \"${title}\" because it still has child tasks.` });
    }

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
    const [rows] = await pool.query("SELECT name FROM assignees WHERE COALESCE(role, 'user') <> 'admin' ORDER BY name ASC");
    const names = rows.map(r => r.name);
    res.json(names);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a new assignee registry profile
app.post('/api/assignees', async (req, res) => {
  const { name, email, password } = req.body;
  const trimmedName = name?.trim();
  const trimmedEmail = email?.trim().toLowerCase() || null;
  const trimmedPassword = password?.trim();

  if (!trimmedName) {
    return res.status(400).json({ error: 'Name is required' });
  }

  try {
    await pool.query(
      'INSERT INTO assignees (name, email, password, role) VALUES (?, ?, ?, ?)',
      [trimmedName, trimmedEmail, trimmedPassword ? hashPassword(trimmedPassword) : null, 'user']
    );
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Name or email already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/assignees/details', async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT name, email FROM assignees WHERE COALESCE(role, 'user') <> 'admin' ORDER BY name ASC");
    res.json(rows.map((row) => ({
      name: row.name,
      email: row.email || ''
    })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/assignees/:name', async (req, res) => {
  const currentName = decodeURIComponent(req.params.name);
  const nextName = req.body.name?.trim();
  const nextEmail = req.body.email?.trim().toLowerCase();
  const nextPassword = req.body.password?.trim();

  if (!nextName) {
    return res.status(400).json({ error: 'Name is required' });
  }

  if (!nextEmail) {
    return res.status(400).json({ error: 'Email is required' });
  }

  try {
    const [existingRows] = await pool.query(
      "SELECT id FROM assignees WHERE name = ? AND COALESCE(role, 'user') <> 'admin' LIMIT 1",
      [currentName]
    );

    if (existingRows.length === 0) {
      return res.status(404).json({ error: 'Assignee not found.' });
    }

    const assigneeId = existingRows[0].id;
    const setClause = ['name = ?', 'email = ?'];
    const values = [nextName, nextEmail];

    if (nextPassword) {
      setClause.push('password = ?');
      values.push(hashPassword(nextPassword));
    }

    values.push(assigneeId);

    await pool.query(`UPDATE assignees SET ${setClause.join(', ')} WHERE id = ?`, values);
    res.json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'Name or email already exists.' });
    }
    res.status(500).json({ error: err.message });
  }
});

// Initialize database before accepting requests.
async function startServer() {
  try {
    await initializeDatabase();
    app.listen(PORT, () => {
      console.log(`Express Backend Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Server startup aborted:', err.message);
    process.exit(1);
  }
}

startServer();

