# Client Request Desk

A full-stack web application for managing customer requests across multiple business workspaces. Team members can review incoming requests, update their status, and convert qualified requests into actionable work items.

This project was built as a Junior Full Stack Developer take-home assignment.

---

## Overview

Each workspace is fully isolated — users can only see and modify data belonging to their own workspace. Authentication is handled via JWT, and workspace isolation is enforced server-side on every database query.

---

## Features

- JWT-based authentication with bcrypt password hashing
- Multi-workspace isolation enforced entirely on the backend
- Create, view, and update customer requests
- Filter requests by status (NEW, QUALIFIED, CLOSED)
- Convert a QUALIFIED request into a work item (one-to-one, duplicate-safe)
- Activity log per request (created, updated, converted)
- Responsive UI using Bootstrap 5

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, Vite 5, React Router, Axios   |
| Backend   | Node.js, Express.js, REST APIs          |
| Auth      | JWT (`jsonwebtoken`), `bcryptjs`        |
| Database  | MySQL 8 (`mysql2`)                      |
| Testing   | Jest, Supertest, React Testing Library  |

---

## Project Structure

```
client-request-desk/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── RequestForm.jsx
│   │   │   ├── RequestList.jsx
│   │   │   └── ConfirmationModal.jsx
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── RequestDetails.jsx
│   │   ├── App.jsx
│   │   ├── api.js
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── server/
│   ├── controllers/
│   │   ├── authController.js
│   │   └── requestController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── requestRoutes.js
│   ├── db.js
│   ├── server.js
│   ├── seed.js
│   └── schema.sql
├── tests/
│   ├── workspace.test.js
│   ├── conversion.test.js
│   └── frontend.test.jsx
├── .env.example
├── package.json
└── README.md
```

---

## Architecture

The backend is a plain Express.js server with a controller/route structure. There are no service layers, repositories, or ORMs — SQL queries live directly in the controllers, keeping the code easy to follow for a junior developer.

The frontend is a Vite+React SPA. State is managed with `useState` only. All API calls go through a pre-configured Axios instance (`api.js`) that attaches the JWT token automatically.

---

## Authentication

`POST /api/auth/login` accepts `{ email, password }` and returns a JWT containing `userId` and `workspaceId`. The token is stored in `localStorage` and sent as a `Bearer` token on every subsequent request.

The `authMiddleware.js` verifies the token and attaches `req.user = { userId, workspaceId }` to every protected route.

---

## Workspace Isolation

This is a critical security requirement. Every database query that touches a request enforces:

```sql
WHERE id = ? AND workspace_id = ?
```

where `workspace_id` always comes from `req.user.workspaceId` (the verified JWT claim), never from the request body or URL parameters. If a user tries to access a request from another workspace, the query returns no rows and the API responds with `404 Not Found`, revealing nothing about the other workspace's data.

---

## Duplicate Conversion Prevention

Three layers protect against converting the same request twice:

1. **Application check** — the controller queries for an existing work item before inserting.
2. **Database constraint** — `work_items.request_id` has a `UNIQUE` index (defined in `schema.sql`), so the database itself rejects a second insert.
3. **Race condition handling** — if two concurrent requests slip through the application check simultaneously, the second INSERT raises `ER_DUP_ENTRY`. The catch block detects this code and returns `409 Conflict`.

All three steps run inside a single MySQL transaction with rollback on failure.

---

## Database Setup

**Step 1 — Create the database**

```bash
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS client_request_desk CHARACTER SET utf8mb4;"
```

**Step 2 — Run the schema**

```bash
mysql -u root -p client_request_desk < server/schema.sql
```

**Step 3 — Seed demo data**

```bash
npm run seed
```

The seed script creates two workspaces, one user per workspace (with bcrypt-hashed passwords), several sample requests in each workspace across all three statuses, and sample activity log entries.

---

## Installation

```bash
# 1. Copy the environment file and fill in your MySQL credentials
cp .env.example .env

# 2. Install all dependencies (root + client + server)
npm run install:all
```

`.env` variables required:

```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=client_request_desk
JWT_SECRET=change_this_to_a_long_random_string
CLIENT_URL=http://localhost:5173
PORT=5000
```

---

## Running in Development

```bash
npm run dev
```

This uses `concurrently` to start both servers at once:

- Backend API: `http://localhost:5000`
- Frontend (Vite): `http://localhost:5173`

The Vite dev server proxies `/api` requests to the Express backend, so there are no CORS issues in development.

---

## Testing

```bash
npm test
```

Runs all three test suites from the `tests/` directory using Jest. **No live database is required** — `db.js` (the mysql2 pool) is fully mocked with `jest.mock`, so the tests run entirely in memory.

- `workspace.test.js` — workspace isolation (404 on cross-workspace access, 400 on invalid status filter)
- `conversion.test.js` — request conversion (201 success, 409 non-QUALIFIED, 409 duplicate, 404 wrong workspace, 409 ER_DUP_ENTRY race condition)
- `frontend.test.jsx` — `ConfirmationModal` component (render, click handlers, loading state)

---

## Production Build

```bash
npm run build
```

Builds the Vite frontend to `client/dist`. Serve the static files from Express or a CDN in front of the Node server.

---

## Demo Credentials

| Workspace   | Email              | Password     |
|-------------|--------------------|--------------|
| Workspace A | usera@example.com  | Password123! |
| Workspace B | userb@example.com  | Password123! |

Each workspace has its own set of requests. Logging in as one user will not show any data from the other workspace.

---

## Assumptions and Trade-offs

**MySQL instead of PostgreSQL or SQLite**

The assignment explicitly requests MySQL, which was respected here. MySQL is a production-grade RDBMS used at scale and is very common in Node.js stacks. PostgreSQL has richer JSON operators, stricter SQL standards compliance, and better support for advanced indexing. SQLite would simplify local setup (no server process needed) but is not suitable for multi-user production workloads. MySQL was the right choice for this assignment's stated requirements.

**`bcryptjs` instead of `bcrypt`**

`bcryptjs` is a pure-JavaScript implementation that installs on any platform without native build tools. The `bcrypt` package requires Python and a C compiler. For a take-home project that reviewers need to run on any machine, `bcryptjs` reduces friction while providing identical security properties.

**No ORM**

Plain SQL with `mysql2` keeps queries visible and straightforward. For a junior developer reading the code, it is immediately clear what each database call does. An ORM like Prisma or Sequelize adds a learning curve and hides the SQL, which works against the goal of simple, explainable code.

**`require.main === module` guard in `server.js`**

`app.listen()` is called only when `server.js` is run directly (`node server.js`), not when it is `require`d by Jest. This prevents port conflicts when multiple test files import the app in parallel.

---

## Future Improvements

- Password reset flow
- Role-based access (admin vs. team member)
- Pagination on the request list
- Email notifications when a request is converted
- Soft delete for requests and work items
- Refresh token support

---

## AI Usage

This project was developed with AI assistance (GitHub Copilot / Kiro). The AI generated initial boilerplate, helped wire up the JWT middleware, and suggested the three-layer duplicate conversion protection pattern. All code was reviewed, adjusted, and verified to match the assignment requirements.
