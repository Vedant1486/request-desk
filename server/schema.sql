-- Client Request Desk – MySQL Schema
-- Run: mysql -u root -p client_request_desk < server/schema.sql

CREATE DATABASE IF NOT EXISTS client_request_desk
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE client_request_desk;

-- -------------------------------------------------------
-- WORKSPACES
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS workspaces (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  name       VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- -------------------------------------------------------
-- USERS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  name         VARCHAR(255) NOT NULL,
  email        VARCHAR(255) NOT NULL UNIQUE,
  password     VARCHAR(255) NOT NULL,
  workspace_id INT NOT NULL,
  created_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id)
);

-- -------------------------------------------------------
-- REQUESTS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS requests (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  customer_name    VARCHAR(255) NOT NULL,
  customer_email   VARCHAR(255) NOT NULL,
  requested_service VARCHAR(255) NOT NULL,
  description      TEXT NOT NULL,
  scheduled_date   DATE NOT NULL,
  status           ENUM('NEW','QUALIFIED','CLOSED') NOT NULL DEFAULT 'NEW',
  workspace_id     INT NOT NULL,
  created_by       INT NOT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  INDEX idx_workspace_status (workspace_id, status)
);

-- -------------------------------------------------------
-- WORK ITEMS
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS work_items (
  id               INT AUTO_INCREMENT PRIMARY KEY,
  request_id       INT NOT NULL UNIQUE,          -- UNIQUE prevents duplicate conversion
  title            VARCHAR(500) NOT NULL,
  customer_name    VARCHAR(255) NOT NULL,
  requested_service VARCHAR(255) NOT NULL,
  scheduled_date   DATE NOT NULL,
  workspace_id     INT NOT NULL,
  created_by       INT NOT NULL,
  created_at       TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id)   REFERENCES requests(id),
  FOREIGN KEY (workspace_id) REFERENCES workspaces(id),
  FOREIGN KEY (created_by)   REFERENCES users(id)
);

-- -------------------------------------------------------
-- ACTIVITIES
-- -------------------------------------------------------
CREATE TABLE IF NOT EXISTS activities (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  request_id    INT NOT NULL,
  user_id       INT NOT NULL,
  activity_type ENUM('REQUEST_CREATED','REQUEST_UPDATED','WORK_ITEM_CREATED') NOT NULL,
  message       TEXT NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES requests(id),
  FOREIGN KEY (user_id)    REFERENCES users(id),
  INDEX idx_request_activities (request_id)
);
