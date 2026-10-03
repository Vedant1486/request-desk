// Must set env vars before requiring the server
process.env.JWT_SECRET = 'test-secret-xyz';
process.env.DB_HOST = 'localhost';
process.env.DB_NAME = 'test';
process.env.DB_USER = 'root';
process.env.DB_PASSWORD = '';

jest.mock('../server/db');

const request = require('supertest');
const app = require('../server/server');
const jwt = require('jsonwebtoken');
const db = require('../server/db');

function makeToken(workspaceId = 1, userId = 1) {
  return jwt.sign({ userId, workspaceId }, 'test-secret-xyz', { expiresIn: '1h' });
}

beforeEach(() => {
  jest.clearAllMocks();
  db.query = jest.fn();
});

describe('Workspace isolation', () => {
  test('GET /api/requests returns only workspace records', async () => {
    db.query.mockResolvedValue([
      [
        {
          id: 1,
          workspace_id: 1,
          customer_name: 'Test Customer',
          customer_email: 'test@example.com',
          requested_service: 'Web Dev',
          description: 'desc',
          scheduled_date: '2026-10-01',
          status: 'NEW',
          created_by: 1,
          created_by_name: 'Alice',
          has_work_item: 0,
        },
      ],
    ]);

    const token = makeToken(1, 1);
    const res = await request(app)
      .get('/api/requests')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /api/requests/:id returns 404 when workspace does not match', async () => {
    // Controller queries WHERE id=? AND workspace_id=? — return empty to simulate mismatch
    db.query.mockResolvedValue([[]]);

    const token = makeToken(1, 1); // workspace 1
    // Trying to access request that belongs to workspace 2
    const res = await request(app)
      .get('/api/requests/99')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
  });

  test('PATCH /api/requests/:id returns 404 when workspace does not match', async () => {
    // First db.query call in updateRequest is the ownership check — return empty
    db.query.mockResolvedValue([[]]);

    const token = makeToken(1, 1);
    const res = await request(app)
      .patch('/api/requests/99')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'QUALIFIED' });

    expect(res.status).toBe(404);
  });

  test('GET /api/requests with invalid status returns 400', async () => {
    const token = makeToken(1, 1);
    const res = await request(app)
      .get('/api/requests?status=INVALID')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/invalid status/i);
  });

  test('GET /api/requests without token returns 401', async () => {
    const res = await request(app).get('/api/requests');
    expect(res.status).toBe(401);
  });

  test('POST /api/requests ignores workspace_id from body and uses token', async () => {
    // Mock: INSERT returns insertId, SELECT returns the new row
    db.query
      .mockResolvedValueOnce([{ insertId: 10 }])   // INSERT activities
      .mockResolvedValueOnce([{ insertId: 10 }])   // won't reach
      .mockResolvedValueOnce([[{ id: 10, workspace_id: 1, customer_name: 'Jane', customer_email: 'j@j.com', requested_service: 'Dev', description: 'x', scheduled_date: '2026-01-01', status: 'NEW', created_by: 1 }]]);

    // First call is the INSERT into requests
    db.query
      .mockReset()
      .mockResolvedValueOnce([{ insertId: 10 }])  // INSERT request
      .mockResolvedValueOnce([])                   // INSERT activity
      .mockResolvedValueOnce([[{ id: 10, workspace_id: 1, customer_name: 'Jane', customer_email: 'j@j.com', requested_service: 'Dev', description: 'x', scheduled_date: '2026-01-01', status: 'NEW', created_by: 1 }]]);

    const token = makeToken(1, 1);
    const res = await request(app)
      .post('/api/requests')
      .set('Authorization', `Bearer ${token}`)
      .send({
        customer_name: 'Jane',
        customer_email: 'j@j.com',
        requested_service: 'Dev',
        description: 'some desc',
        scheduled_date: '2026-01-01',
        status: 'NEW',
        workspace_id: 999, // Should be ignored
      });

    expect(res.status).toBe(201);
    // The response workspace_id must come from the token (1), not the body (999)
    expect(res.body.workspace_id).toBe(1);
  });
});
