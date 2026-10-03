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

function makeMockConn() {
  return {
    beginTransaction: jest.fn().mockResolvedValue(undefined),
    query: jest.fn(),
    commit: jest.fn().mockResolvedValue(undefined),
    rollback: jest.fn().mockResolvedValue(undefined),
    release: jest.fn(),
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  db.query = jest.fn();
  db.getConnection = jest.fn();
});

describe('Request conversion', () => {
  test('converts a QUALIFIED request successfully (201)', async () => {
    const mockConn = makeMockConn();
    db.getConnection.mockResolvedValue(mockConn);

    // conn.query call sequence inside convertRequest:
    // 1. SELECT request WHERE id=? AND workspace_id=?
    mockConn.query
      .mockResolvedValueOnce([
        [
          {
            id: 5,
            status: 'QUALIFIED',
            customer_name: 'Jane Doe',
            customer_email: 'jane@example.com',
            requested_service: 'Web Development',
            description: 'Build a website',
            scheduled_date: '2026-01-01',
            workspace_id: 1,
            created_by: 1,
          },
        ],
      ])
      // 2. SELECT work_items WHERE request_id=? (check duplicate)
      .mockResolvedValueOnce([[]])
      // 3. INSERT work_items
      .mockResolvedValueOnce([{ insertId: 10 }])
      // 4. SELECT users WHERE id=?
      .mockResolvedValueOnce([[{ id: 1, name: 'Alice Smith' }]])
      // 5. INSERT activities
      .mockResolvedValueOnce([{ insertId: 1 }]);

    // db.query (pool) used after commit to fetch the created work item
    db.query.mockResolvedValueOnce([
      [
        {
          id: 10,
          request_id: 5,
          title: 'Web Development — Jane Doe',
          customer_name: 'Jane Doe',
          requested_service: 'Web Development',
          scheduled_date: '2026-01-01',
          workspace_id: 1,
          created_by: 1,
          created_by_name: 'Alice Smith',
          created_at: '2026-10-01T00:00:00.000Z',
        },
      ],
    ]);

    const token = makeToken(1, 1);
    const res = await request(app)
      .post('/api/requests/5/convert')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(201);
    expect(res.body.request_id).toBe(5);
    expect(mockConn.commit).toHaveBeenCalledTimes(1);
    expect(mockConn.release).toHaveBeenCalledTimes(1);
  });

  test('returns 409 when request is not QUALIFIED (status=NEW)', async () => {
    const mockConn = makeMockConn();
    db.getConnection.mockResolvedValue(mockConn);

    mockConn.query.mockResolvedValueOnce([
      [
        {
          id: 5,
          status: 'NEW',
          customer_name: 'Jane Doe',
          workspace_id: 1,
        },
      ],
    ]);

    const token = makeToken(1, 1);
    const res = await request(app)
      .post('/api/requests/5/convert')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/qualified/i);
    expect(mockConn.rollback).toHaveBeenCalledTimes(1);
  });

  test('returns 409 when work item already exists (duplicate)', async () => {
    const mockConn = makeMockConn();
    db.getConnection.mockResolvedValue(mockConn);

    mockConn.query
      // Request found with QUALIFIED status
      .mockResolvedValueOnce([
        [
          {
            id: 5,
            status: 'QUALIFIED',
            customer_name: 'Jane Doe',
            workspace_id: 1,
          },
        ],
      ])
      // Work item already exists
      .mockResolvedValueOnce([[{ id: 99 }]]);

    const token = makeToken(1, 1);
    const res = await request(app)
      .post('/api/requests/5/convert')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already/i);
    expect(mockConn.rollback).toHaveBeenCalledTimes(1);
  });

  test('returns 404 when request does not belong to user workspace', async () => {
    const mockConn = makeMockConn();
    db.getConnection.mockResolvedValue(mockConn);

    // Empty result = no request matching id AND workspace_id
    mockConn.query.mockResolvedValueOnce([[]]);

    const token = makeToken(1, 1);
    const res = await request(app)
      .post('/api/requests/99/convert')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(404);
    expect(mockConn.rollback).toHaveBeenCalledTimes(1);
  });

  test('returns 409 on ER_DUP_ENTRY database error (race condition)', async () => {
    const mockConn = makeMockConn();
    db.getConnection.mockResolvedValue(mockConn);

    const dupError = new Error('Duplicate entry');
    dupError.code = 'ER_DUP_ENTRY';

    mockConn.query
      // Request found
      .mockResolvedValueOnce([
        [
          {
            id: 5,
            status: 'QUALIFIED',
            customer_name: 'Jane Doe',
            workspace_id: 1,
          },
        ],
      ])
      // No existing work item
      .mockResolvedValueOnce([[]])
      // INSERT throws ER_DUP_ENTRY
      .mockRejectedValueOnce(dupError);

    const token = makeToken(1, 1);
    const res = await request(app)
      .post('/api/requests/5/convert')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(409);
    expect(res.body.message).toMatch(/already/i);
    expect(mockConn.rollback).toHaveBeenCalledTimes(1);
  });
});
