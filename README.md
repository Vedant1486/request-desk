# Client Request Desk

A full-stack web application for managing customer service requests across multiple isolated business workspaces. Team members can create, review, and update requests — and convert qualified requests into work items through a confirmed, transaction-safe flow.

Built as a Junior Full Stack Developer take-home assignment.

**Demo credentials:**

| Workspace   | Email                 | Password     |
|-------------|-----------------------|--------------|
| Workspace A | usera@example.com     | Password123! |
| Workspace B | userb@example.com     | Password123! |

---

## Features

- JWT authentication with bcrypt password hashing
- Multi-workspace isolation enforced entirely on the backend
- Create, view, edit, and filter customer requests by status
- Human-confirmed work item conversion with a modal
- Duplicate conversion prevention (application check + DB UNIQUE constraint + transaction)
- Activity timeline per request (who did what and when)
- Responsive UI — table on desktop, cards on mobile
- Full test suite: workspace isolation, conversion rules, frontend modal

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Frontend  | React 18, Vite 5, React Router v6, Axios        |
| Styling   | Bootstrap 5, custom CSS design system           |
| Backend   | Node.js, Express.js, REST API                   |
| Auth      | JWT (`jsonwebtoken`), `bcryptjs`                |
| Database  | MySQL 8 (`mysql2` with connection pool)         |
| Testing   | Jest 29, Supertest, React Testing Library       |

---

## Project Structure

```
client-request-desk/
│
├── client/                          # React frontend (Vite)
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Top navigation bar with user info + logout
│   │   │   ├── RequestForm.jsx      # Reusable create/edit form with validation
│   │   │   ├── RequestList.jsx      # Table (desktop) + cards (mobile)
│   │   │   └── ConfirmationModal.jsx # "Are you sure?" modal before conversion
│   │   ├── pages/
│   │   │   ├── Login.jsx            # Login page with demo credential buttons
│   │   │   ├── Dashboard.jsx        # Request list + stats + filters
│   │   │   └── RequestDetails.jsx   # Single request + timeline + work item
│   │   ├── App.jsx                  # Router + ProtectedRoute guard
│   │   ├── api.js                   # Axios instance with JWT interceptor
│   │   ├── main.jsx                 # React entry point
│   │   └── index.css                # Custom design system on top of Bootstrap
│   ├── index.html
│   ├── vite.config.js               # Vite config with /api proxy to Express
│   └── package.json
│
├── server/                          # Express backend
│   ├── controllers/
│   │   ├── authController.js        # POST /api/auth/login
│   │   └── requestController.js    # All 7 request endpoints
│   ├── middleware/
│   │   └── authMiddleware.js        # JWT verification → sets req.user
│   ├── routes/
│   │   ├── authRoutes.js
│   │   └── requestRoutes.js
│   ├── db.js                        # mysql2 connection pool
│   ├── server.js                    # Express app entry point
│   ├── schema.sql                   # All 5 tables with FK + indexes
│   ├── seed.js                      # Demo data (2 workspaces, 2 users, 7 requests)
│   └── package.json
│
├── tests/                           # Jest test suites
│   ├── workspace.test.js            # Workspace isolation tests (Supertest)
│   ├── conversion.test.js           # Conversion business rule tests (Supertest)
│   ├── frontend.test.jsx            # ConfirmationModal tests (RTL)
│   └── __mocks__/
│       └── styleMock.js             # CSS mock for Jest
│
├── .env.example                     # Environment variable template
├── .gitignore
├── babel.config.js                  # Babel config for Jest JSX support
├── package.json                     # Root scripts + Jest config
└── README.md
```

### Key File Responsibilities

| File | Responsibility |
|------|---------------|
| `authMiddleware.js` | Verifies JWT, extracts `userId` + `workspaceId`, rejects invalid tokens |
| `requestController.js` | All request business logic — isolation, validation, conversion transaction |
| `db.js` | Single mysql2 pool shared across all queries |
| `api.js` | Axios base URL, auto-attach token, redirect on 401 |
| `App.jsx` | Route definitions + `ProtectedRoute` (redirects to `/login` if no token) |
| `schema.sql` | Source of truth for DB structure — `UNIQUE(request_id)` is defined here |
| `seed.js` | Reproducible demo data with bcrypt-hashed passwords |

---

## Architecture

```
Browser (React SPA)
       │
       │  HTTP + Bearer JWT
       ▼
Express REST API  ──►  authMiddleware (verifies JWT, sets req.user)
       │
       ▼
Controllers (requestController.js, authController.js)
       │
       │  Parameterised SQL — always filtered by workspace_id
       ▼
MySQL 8 (connection pool via mysql2)
```

The backend follows a thin controller/route pattern with no ORM, no service layer, and no repository abstractions. SQL queries live directly in controllers — this is intentional (see Trade-offs below).

The frontend is a single-page React app. State is managed with `useState` only. All API calls go through a shared Axios instance (`api.js`) that attaches the JWT token on every request and redirects to `/login` on a 401.

---

## Key Decisions

### 1. Workspace isolation lives in the backend only
The `workspaceId` claim is read exclusively from the verified JWT (`req.user.workspaceId`). The frontend never sends a workspace identifier. Every query that touches a request enforces:

```sql
WHERE id = ? AND workspace_id = ?
```

If a user manually changes a request ID in the URL to one belonging to another workspace, the query returns no rows and the API returns `404 Not Found` — revealing nothing about the other workspace.

### 2. Conversion uses a MySQL transaction + UNIQUE constraint
Three layers prevent a request from being converted twice:
1. **Application check** — query `work_items` for an existing row before inserting.
2. **MySQL UNIQUE constraint** on `work_items.request_id` — the database rejects a second insert at the storage level.
3. **Race condition handler** — if two concurrent requests both pass the application check, the second INSERT raises `ER_DUP_ENTRY`. The catch block detects this error code and returns `409 Conflict`.

All three steps run inside a single transaction with `ROLLBACK` on any failure.

### 3. No ORM
Plain SQL with `mysql2` keeps every query visible and explicit. For a reviewer or junior developer reading the code, it is immediately clear what each database call does. An ORM adds a learning curve and hides the SQL, which works against the goal of simple, explainable code.

### 4. `require.main === module` guard in `server.js`
`app.listen()` is only called when `server.js` is run directly. When Jest imports the app, no port is bound — this prevents `EADDRINUSE` errors when multiple test files require the server in parallel.

### 5. Tests mock the database
`db.js` is mocked with `jest.mock` in all backend tests. No live database is required to run `npm test`. This makes CI straightforward and removes the setup burden for reviewers.

---

## Assumptions and Trade-offs

**MySQL instead of PostgreSQL or SQLite**
The assignment explicitly requests MySQL. MySQL is a production-grade RDBMS common in Node.js stacks. PostgreSQL has stricter SQL standards compliance and richer JSON operators; SQLite would simplify local setup. MySQL was the correct choice here per the stated requirements.

**`bcryptjs` instead of `bcrypt`**
`bcryptjs` is pure JavaScript and installs without native build tools (no Python, no C compiler). It provides identical security to `bcrypt`. For a take-home project that reviewers run on any machine, this reduces setup friction.

**No sign-up flow**
This is an internal business tool, not a public-facing product. In real-world systems like this (CRMs, help desks), accounts are provisioned by an administrator. A self-service sign-up is out of scope for this assignment and would require a user-management layer not called for in the spec.

**Flat file structure**
The project uses the minimum number of files that satisfies all requirements. There are no `services/`, `repositories/`, `utils/`, or `dto/` directories. This is intentional — it makes the code easy to navigate, explain in a follow-up discussion, and extend (see "Adding a field" below).

---

## Adding a Field (Follow-up Readiness)

If asked to add a `priority` field to requests during the discussion:

1. **Schema** — add `priority ENUM('LOW','MEDIUM','HIGH') DEFAULT 'MEDIUM'` to the `requests` table
2. **Seed** — add `priority` values to the INSERT statements in `seed.js`
3. **Controller** — add `priority` to the `createRequest` validation and `updateRequest` merge object
4. **Frontend form** — add a `<select>` field for `priority` in `RequestForm.jsx`
5. **Display** — add a `priority` column/badge in `RequestList.jsx` and a detail row in `RequestDetails.jsx`

No other files need to change. This is the benefit of a flat, explicit architecture.

---

## Database Setup

**Prerequisites:** MySQL 8 running locally.

```bash
# 1. Create the database
mysql -u root -p -e "CREATE DATABASE IF NOT EXISTS client_request_desk CHARACTER SET utf8mb4;"

# 2. Run the schema (creates all 5 tables with foreign keys and indexes)
mysql -u root -p client_request_desk < server/schema.sql

# 3. Seed demo data (2 workspaces, 2 users, 7 requests, activities)
npm run seed
```

---

## Installation

```bash
# 1. Clone the repository
git clone https://github.com/Vedant1486/request-desk.git
cd request-desk

# 2. Copy environment file and fill in your MySQL credentials
cp .env.example .env

# 3. Install all dependencies (root + client + server)
npm run install:all
```

Required `.env` variables:

```
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=client_request_desk
JWT_SECRET=change_this_to_a_long_random_string
CLIENT_URL=http://localhost:5173
```

---

## Development

```bash
npm run dev
```

Starts both servers concurrently:
- Backend API → `http://localhost:5000`
- Frontend (Vite) → `http://localhost:5173`

Vite proxies `/api` requests to Express in development, so there are no CORS issues locally.

Individual servers:
```bash
npm run server   # backend only
npm run client   # frontend only
```

---

## Testing

```bash
npm test
```

Runs all three suites with Jest. No live database required — `db.js` is fully mocked.

| Suite | Tests | What it covers |
|-------|-------|----------------|
| `workspace.test.js` | 4 | Workspace A reads own request (200), cross-workspace returns 404, invalid status filter returns 400 |
| `conversion.test.js` | 7 | QUALIFIED converts (201), NEW rejects (409), CLOSED rejects (409), duplicate returns (409), exactly one work item exists, activity created, wrong workspace returns 404 |
| `frontend.test.jsx` | 5 | Modal renders, shows customer/service/date, API not called on open, API called on confirm, loading state shown |

---

## Production Build

```bash
npm run build
```

Builds the Vite frontend to `client/dist`. Serve the static files from a CDN or the Express server in production.

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | ✗ | Login, returns JWT |
| GET | `/api/requests` | ✓ | List workspace requests (optional `?status=`) |
| POST | `/api/requests` | ✓ | Create request |
| GET | `/api/requests/:id` | ✓ | Get request + activities + work item |
| PATCH | `/api/requests/:id` | ✓ | Update request fields |
| POST | `/api/requests/:id/convert` | ✓ | Convert QUALIFIED request to work item |
| GET | `/api/requests/:id/activities` | ✓ | List activities for request |
| GET | `/api/requests/:id/work-item` | ✓ | Get work item for request |
| GET | `/api/health` | ✗ | Health check |

All protected endpoints return `401` without a valid token and `404` when the record does not exist in the authenticated user's workspace.

---

## Future Improvements

Given more time, I would prioritise:

1. **Pagination** — the request list will become slow at scale; cursor-based or offset pagination on `GET /api/requests` is straightforward to add
2. **Rate limiting** — `express-rate-limit` on the login endpoint to prevent brute-force attacks
3. **Refresh tokens** — short-lived access tokens (15 min) with a secure httpOnly refresh token cookie, instead of long-lived localStorage JWTs
4. **Role-based permissions** — an `admin` role that can manage users and workspaces; the `users` table already has `workspace_id` as a FK which makes this natural to extend
5. **Helmet.js** — add security headers (CSP, HSTS, X-Frame-Options) with a single middleware line
6. **Input sanitisation** — strip HTML from text fields before storage to prevent stored XSS
7. **Soft deletes** — add `deleted_at` to requests instead of hard deletes to preserve audit history
8. **Structured logging** — replace `console.error` with a logger like `pino` that emits JSON for log aggregation

---

## AI Usage

This project was developed with AI assistance (Kiro IDE). The AI generated boilerplate, wired up the JWT middleware, and suggested the three-layer duplicate conversion protection pattern (application check + UNIQUE constraint + ER_DUP_ENTRY handler).

All generated code was reviewed line by line. The workspace isolation logic and conversion transaction were manually traced through the controller to verify correctness. Tests were run after each major change and failures were diagnosed and fixed. No generated code was accepted without understanding what it does.

---

## Commit History

```
feat: Jest infrastructure and test scaffolding
feat: complete React frontend
test: test suites and README
fix: deployment config for Vercel and Render
feat: complete UI redesign - premium responsive design
```
