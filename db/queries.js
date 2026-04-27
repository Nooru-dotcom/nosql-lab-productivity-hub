require('dotenv').config();
const { ObjectId } = require('mongodb');

// 1. Create a new user (reject duplicate email)
async function signupUser(db, { name, email, passwordHash }) {
  const existing = await db.collection('users').findOne({ email });
  if (existing) throw new Error('Email already in use');
  const result = await db.collection('users').insertOne({
    name,
    email,
    passwordHash,
    createdAt: new Date()
  });
  return { insertedId: result.insertedId };
}

// 2. Find user by email for login
async function loginFindUser(db, email) {
  return await db.collection('users').findOne({ email });
}

// 3. List all non-archived projects for a user
async function listUserProjects(db, userId) {
  return await db.collection('projects')
    .find({ ownerId: new ObjectId(userId), archived: false })
    .sort({ createdAt: -1 })
    .toArray();
}

// 4. Create a new project
async function createProject(db, { ownerId, name, description }) {
  const result = await db.collection('projects').insertOne({
    ownerId: new ObjectId(ownerId),
    name,
    description,
    archived: false,
    createdAt: new Date()
  });
  return { insertedId: result.insertedId };
}

// 5. Archive a project
async function archiveProject(db, projectId) {
  return await db.collection('projects').updateOne(
    { _id: new ObjectId(projectId) },
    { $set: { archived: true } }
  );
}

// 6. List tasks for a project filtered by status and sorted by priority
async function listProjectTasks(db, projectId, status) {
  const filter = { projectId: new ObjectId(projectId) };
  if (status && status !== 'all') {
    filter.status = status;
  }
  return await db.collection('tasks')
    .find(filter)
    .sort({ priority: 1 })
    .toArray();
}

// 7. Create a new task
async function createTask(db, { ownerId, projectId, title, status, priority, tags, subtasks, description, dueDate }) {
  const result = await db.collection('tasks').insertOne({
    ownerId: new ObjectId(ownerId),
    projectId: new ObjectId(projectId),
    title,
    status: status || 'todo',
    priority: Number(priority) || 3,
    tags: tags || [],
    subtasks: subtasks || [],
    description: description || '',
    dueDate: dueDate ? new Date(dueDate) : undefined,
    createdAt: new Date()
  });
  return { insertedId: result.insertedId };
}

// 8. Update task status
async function updateTaskStatus(db, taskId, status) {
  return await db.collection('tasks').updateOne(
    { _id: new ObjectId(taskId) },
    { $set: { status } }
  );
}

// 9. Add a tag to a task (no duplicates)
async function addTaskTag(db, taskId, tag) {
  return await db.collection('tasks').updateOne(
    { _id: new ObjectId(taskId) },
    { $addToSet: { tags: tag } }
  );
}

// 10. Remove a tag from a task
async function removeTaskTag(db, taskId, tag) {
  return await db.collection('tasks').updateOne(
    { _id: new ObjectId(taskId) },
    { $pull: { tags: tag } }
  );
}

// 11. Toggle a subtask's done flag
async function toggleSubtask(db, taskId, subtaskTitle) {
  const task = await db.collection('tasks').findOne(
    { _id: new ObjectId(taskId) }
  );
  const subtask = task.subtasks.find(s => s.title === subtaskTitle);
  return await db.collection('tasks').updateOne(
    { _id: new ObjectId(taskId), 'subtasks.title': subtaskTitle },
    { $set: { 'subtasks.$.done': !subtask.done } }
  );
}

// 12. Delete a task
async function deleteTask(db, taskId) {
  return await db.collection('tasks').deleteOne(
    { _id: new ObjectId(taskId) }
  );
}

// 13. Search notes by tags with optional project filter
async function searchNotes(db, userId, tags, projectId) {
  const filter = {
    ownerId: new ObjectId(userId),
    tags: { $in: tags }
  };
  if (projectId) {
    filter.projectId = new ObjectId(projectId);
  }
  return await db.collection('notes')
    .find(filter)
    .sort({ createdAt: -1 })
    .toArray();
}

// 14. Per-project task counts grouped by status with project names
async function projectTaskSummary(db, userId) {
  return await db.collection('tasks').aggregate([
    {
      $match: { ownerId: new ObjectId(userId) }
    },
    {
      $group: {
        _id: { projectId: '$projectId', status: '$status' },
        count: { $sum: 1 }
      }
    },
    {
      $group: {
        _id: '$_id.projectId',
        statusCounts: {
          $push: {
            status: '$_id.status',
            count: '$count'
          }
        },
        total: { $sum: '$count' }
      }
    },
    {
      $lookup: {
        from: 'projects',
        localField: '_id',
        foreignField: '_id',
        as: 'project'
      }
    },
    {
      $unwind: '$project'
    },
    {
      $project: {
        projectName: '$project.name',
        statusCounts: 1,
        total: 1
      }
    }
  ]).toArray();
}

// 15. Latest 10 tasks across all projects with project name
async function recentActivityFeed(db, userId) {
  return await db.collection('tasks').aggregate([
    {
      $match: { ownerId: new ObjectId(userId) }
    },
    {
      $sort: { createdAt: -1 }
    },
    {
      $limit: 10
    },
    {
      $lookup: {
        from: 'projects',
        localField: 'projectId',
        foreignField: '_id',
        as: 'project'
      }
    },
    {
      $unwind: '$project'
    },
    {
      $project: {
        title: 1,
        status: 1,
        priority: 1,
        createdAt: 1,
        projectName: '$project.name'
      }
    }
  ]).toArray();
}

module.exports = {
  signupUser,
  loginFindUser,
  listUserProjects,
  createProject,
  archiveProject,
  listProjectTasks,
  createTask,
  updateTaskStatus,
  addTaskTag,
  removeTaskTag,
  toggleSubtask,
  deleteTask,
  searchNotes,
  projectTaskSummary,
  recentActivityFeed
};