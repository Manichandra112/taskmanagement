/**
 * Converts a legacy "person-wise" API response to a "task-wise" flat list.
 * Legacy format:
 * {
 *   "Person Name": [
 *     { "date": "YYYY-MM-DD", "description": "text", "status": "Pending" | "Complete" }
 *   ]
 * }
 *
 * Target format:
 * [
 *   {
 *     id: "task_1",
 *     title: "text",
 *     dueDate: "YYYY-MM-DD",
 *     status: "Pending" | "Complete",
 *     assignee: "Person Name",
 *     subtasks: []
 *   }
 * ]
 */
export function convertPersonWiseToTaskWise(legacyData) {
  if (!legacyData || typeof legacyData !== 'object') {
    return [];
  }

  const tasks = [];
  let counter = 1;

  for (const person in legacyData) {
    if (Object.prototype.hasOwnProperty.call(legacyData, person)) {
      const items = legacyData[person];
      if (Array.isArray(items)) {
        items.forEach(item => {
          tasks.push({
            id: `task_${Date.now()}_${counter++}`,
            title: item.description || item.title || '',
            dueDate: item.date || item.dueDate || '',
            status: item.status || 'Pending',
            assignee: person,
            subtasks: item.subtasks || []
          });
        });
      }
    }
  }

  return tasks;
}

/**
 * Converts the new recursive "task-wise" tree state back into the legacy flat "person-wise" structure
 * to send back to the legacy database/APIs.
 */
export function convertTaskWiseToPersonWise(tasks) {
  if (!Array.isArray(tasks)) {
    return {};
  }

  const personWise = {};

  // Recursive function to flatten all nested subtasks
  const flattenAndGroup = (list) => {
    list.forEach(task => {
      const person = task.assignee || 'Unassigned';
      if (!personWise[person]) {
        personWise[person] = [];
      }

      // Add the task itself to its assignee
      personWise[person].push({
        date: task.dueDate,
        description: task.title,
        status: task.status
      });

      // Recurse on children to flatten them as well
      if (task.subtasks && task.subtasks.length > 0) {
        flattenAndGroup(task.subtasks);
      }
    });
  };

  flattenAndGroup(tasks);
  return personWise;
}
