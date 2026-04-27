require('dotenv').config();
const { connect, getDb } = require('./db/connection');
const { ObjectId } = require('mongodb');
const bcrypt = require('bcryptjs');

async function seed() {
  await connect();
  const db = getDb();

  // Clear existing data
  await db.collection('users').deleteMany({});
  await db.collection('projects').deleteMany({});
  await db.collection('tasks').deleteMany({});
  await db.collection('notes').deleteMany({});

  //  USERS 
  const passwordHash = await bcrypt.hash('password123', 10);

  const usersResult = await db.collection('users').insertMany([
    {
      _id: new ObjectId(),
      email: 'alice@example.com',
      passwordHash,
      name: 'Alice Khan',
      createdAt: new Date()
    },
    {
      _id: new ObjectId(),
      email: 'bob@example.com',
      passwordHash,
      name: 'Bob Ahmed',
      createdAt: new Date()
    }
  ]);

  const aliceId = usersResult.insertedIds[0];
  const bobId   = usersResult.insertedIds[1];

  //  PROJECTS 
  const projectsResult = await db.collection('projects').insertMany([
    {
      _id: new ObjectId(),
      ownerId: aliceId,
      name: 'Website Redesign',
      description: 'Redesign the company website',
      archived: false,
      createdAt: new Date()
    },
    {
      _id: new ObjectId(),
      ownerId: aliceId,
      name: 'Mobile App',
      description: 'Build the mobile app',
      archived: false,
      createdAt: new Date()
    },
    {
      _id: new ObjectId(),
      ownerId: bobId,
      name: 'Data Pipeline',
      description: 'ETL pipeline setup',
      archived: false,
      createdAt: new Date()
    },
    {
      _id: new ObjectId(),
      ownerId: bobId,
      name: 'Old Project',
      description: 'Archived project',
      archived: true,
      createdAt: new Date()
    }
  ]);

  const proj1 = projectsResult.insertedIds[0];
  const proj2 = projectsResult.insertedIds[1];
  const proj3 = projectsResult.insertedIds[2];

  //  TASKS 
  await db.collection('tasks').insertMany([
    {
      _id: new ObjectId(),
      ownerId: aliceId,
      projectId: proj1,
      title: 'Design homepage mockup',
      status: 'done',
      priority: 1,
      tags: ['design', 'ui'],
      subtasks: [
        { title: 'Sketch wireframes', done: true },
        { title: 'Choose color palette', done: true }
      ],
      description: 'Create initial mockup for homepage',
      dueDate: new Date('2026-05-01'),
      createdAt: new Date()
    },
    {
      _id: new ObjectId(),
      ownerId: aliceId,
      projectId: proj1,
      title: 'Implement navbar',
      status: 'in-progress',
      priority: 2,
      tags: ['frontend', 'html'],
      subtasks: [
        { title: 'Write HTML structure', done: true },
        { title: 'Add CSS styling', done: false }
      ],
      createdAt: new Date()
    },
    {
      _id: new ObjectId(),
      ownerId: aliceId,
      projectId: proj2,
      title: 'Setup React Native',
      status: 'todo',
      priority: 1,
      tags: ['setup', 'mobile'],
      subtasks: [
        { title: 'Install dependencies', done: false }
      ],
      createdAt: new Date()
    },
    {
      _id: new ObjectId(),
      ownerId: bobId,
      projectId: proj3,
      title: 'Connect to database',
      status: 'in-progress',
      priority: 2,
      tags: ['backend', 'database'],
      subtasks: [
        { title: 'Setup connection string', done: true },
        { title: 'Test queries', done: false }
      ],
      createdAt: new Date()
    },
    {
      _id: new ObjectId(),
      ownerId: bobId,
      projectId: proj3,
      title: 'Write ETL scripts',
      status: 'todo',
      priority: 3,
      tags: ['python', 'etl'],
      subtasks: [],
      createdAt: new Date()
    }
  ]);

  //  NOTES 
  await db.collection('notes').insertMany([
    {
      _id: new ObjectId(),
      ownerId: aliceId,
      projectId: proj1,
      title: 'Design Notes',
      body: 'Use blue and white color scheme for the website.',
      tags: ['design', 'colors'],
      pinned: true,
      createdAt: new Date()
    },
    {
      _id: new ObjectId(),
      ownerId: aliceId,
      projectId: proj2,
      title: 'App Ideas',
      body: 'Push notifications and offline mode are must-haves.',
      tags: ['mobile', 'features'],
      createdAt: new Date()
    },
    {
      _id: new ObjectId(),
      ownerId: aliceId,
      projectId: null,
      title: 'General Thoughts',
      body: 'Need to improve time management this semester.',
      tags: ['personal'],
      createdAt: new Date()
    },
    {
      _id: new ObjectId(),
      ownerId: bobId,
      projectId: proj3,
      title: 'Pipeline Architecture',
      body: 'Use Apache Kafka for streaming data.',
      tags: ['backend', 'architecture'],
      createdAt: new Date()
    },
    {
      _id: new ObjectId(),
      ownerId: bobId,
      projectId: null,
      title: 'Meeting Notes',
      body: 'Discussed project deadlines with the team.',
      tags: ['meeting', 'team'],
      createdAt: new Date()
    }
  ]);

  console.log(' Seed complete!');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
