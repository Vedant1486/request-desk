const mysql = require('mysql2/promise');
require('dotenv').config({ path: '../.env' });

const pool = mysql.createPool({
  host:     process.env.DB_HOST     || 'localhost',
  user:     process.env.DB_USER     || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME     || 'client_request_desk',
  waitForConnections: true,
  connectionLimit: 10,
});

module.exports = pool;
