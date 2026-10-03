require('dotenv').config({ path: '../.env' });
const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  console.log('Seeding database...');

  // Clean up in reverse dependency order
  await db.query('DELETE FROM activities');
  await db.query('DELETE FROM work_items');
  await db.query('DELETE FROM requests');
  await db.query('DELETE FROM users');
  await db.query('DELETE FROM workspaces');

  // Reset auto_increment
  await db.query('ALTER TABLE activities AUTO_INCREMENT = 1');
  await db.query('ALTER TABLE work_items AUTO_INCREMENT = 1');
  await db.query('ALTER TABLE requests AUTO_INCREMENT = 1');
  await db.query('ALTER TABLE users AUTO_INCREMENT = 1');
  await db.query('ALTER TABLE workspaces AUTO_INCREMENT = 1');

  // Workspaces
  const [wsA] = await db.query("INSERT INTO workspaces (name) VALUES ('Workspace A')");
  const [wsB] = await db.query("INSERT INTO workspaces (name) VALUES ('Workspace B')");
  const wsAId = wsA.insertId;
  const wsBId = wsB.insertId;

  // Users
  const hash = await bcrypt.hash('Password123!', 10);
  const [uA] = await db.query(
    'INSERT INTO users (name, email, password, workspace_id) VALUES (?, ?, ?, ?)',
    ['Alice Smith', 'usera@example.com', hash, wsAId]
  );
  const [uB] = await db.query(
    'INSERT INTO users (name, email, password, workspace_id) VALUES (?, ?, ?, ?)',
    ['Bob Johnson', 'userb@example.com', hash, wsBId]
  );
  const uAId = uA.insertId;
  const uBId = uB.insertId;

  // Requests for Workspace A
  const [r1] = await db.query(
    `INSERT INTO requests (customer_name, customer_email, requested_service, description, scheduled_date, status, workspace_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['John Carter', 'john.carter@example.com', 'Website Development',
     'Full redesign of company website with modern UI and mobile responsiveness.',
     '2026-10-15', 'NEW', wsAId, uAId]
  );
  const [r2] = await db.query(
    `INSERT INTO requests (customer_name, customer_email, requested_service, description, scheduled_date, status, workspace_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Sarah Lane', 'sarah.lane@example.com', 'SEO Optimization',
     'Improve search rankings for our online store. Currently on page 4 for key terms.',
     '2026-10-20', 'QUALIFIED', wsAId, uAId]
  );
  const [r3] = await db.query(
    `INSERT INTO requests (customer_name, customer_email, requested_service, description, scheduled_date, status, workspace_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Mike Torres', 'mike.torres@example.com', 'Logo Design',
     'Rebranding project — fresh modern logo for a construction company.',
     '2026-09-30', 'CLOSED', wsAId, uAId]
  );
  const [r4] = await db.query(
    `INSERT INTO requests (customer_name, customer_email, requested_service, description, scheduled_date, status, workspace_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Emily Chen', 'emily.chen@example.com', 'Social Media Management',
     'Monthly content creation and posting for Instagram and Facebook.',
     '2026-11-01', 'NEW', wsAId, uAId]
  );

  // Requests for Workspace B
  const [r5] = await db.query(
    `INSERT INTO requests (customer_name, customer_email, requested_service, description, scheduled_date, status, workspace_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['David Park', 'david.park@example.com', 'Mobile App Development',
     'Cross-platform mobile app for food ordering with payment integration.',
     '2026-11-10', 'QUALIFIED', wsBId, uBId]
  );
  const [r6] = await db.query(
    `INSERT INTO requests (customer_name, customer_email, requested_service, description, scheduled_date, status, workspace_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Lisa Wang', 'lisa.wang@example.com', 'Content Writing',
     '10 blog posts per month covering personal finance topics.',
     '2026-10-25', 'NEW', wsBId, uBId]
  );
  const [r7] = await db.query(
    `INSERT INTO requests (customer_name, customer_email, requested_service, description, scheduled_date, status, workspace_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    ['Tom Nguyen', 'tom.nguyen@example.com', 'IT Support Contract',
     'Annual IT support for 20 workstations and a small server room.',
     '2026-10-01', 'CLOSED', wsBId, uBId]
  );

  // Activities for Workspace A requests
  const actA = [
    [r1.insertId, uAId, 'REQUEST_CREATED', 'Request created with status NEW.'],
    [r2.insertId, uAId, 'REQUEST_CREATED', 'Request created with status NEW.'],
    [r2.insertId, uAId, 'REQUEST_UPDATED', 'Status changed from NEW to QUALIFIED.'],
    [r3.insertId, uAId, 'REQUEST_CREATED', 'Request created with status NEW.'],
    [r3.insertId, uAId, 'REQUEST_UPDATED', 'Status changed from NEW to CLOSED.'],
    [r4.insertId, uAId, 'REQUEST_CREATED', 'Request created with status NEW.'],
  ];
  for (const [reqId, userId, type, msg] of actA) {
    await db.query(
      'INSERT INTO activities (request_id, user_id, activity_type, message) VALUES (?, ?, ?, ?)',
      [reqId, userId, type, msg]
    );
  }

  // Activities for Workspace B requests
  const actB = [
    [r5.insertId, uBId, 'REQUEST_CREATED', 'Request created with status NEW.'],
    [r5.insertId, uBId, 'REQUEST_UPDATED', 'Status changed from NEW to QUALIFIED.'],
    [r6.insertId, uBId, 'REQUEST_CREATED', 'Request created with status NEW.'],
    [r7.insertId, uBId, 'REQUEST_CREATED', 'Request created with status NEW.'],
    [r7.insertId, uBId, 'REQUEST_UPDATED', 'Status changed from NEW to CLOSED.'],
  ];
  for (const [reqId, userId, type, msg] of actB) {
    await db.query(
      'INSERT INTO activities (request_id, user_id, activity_type, message) VALUES (?, ?, ?, ?)',
      [reqId, userId, type, msg]
    );
  }

  console.log('✅ Seed complete!');
  console.log(`   Workspace A (id: ${wsAId}) → usera@example.com / Password123!`);
  console.log(`   Workspace B (id: ${wsBId}) → userb@example.com / Password123!`);
  process.exit(0);
}

seed().catch(err => { console.error('Seed failed:', err); process.exit(1); });
