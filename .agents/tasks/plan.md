# Implementation Plan — CLIENT REQUEST DESK

## Exploration Summary

The skeleton is more complete than a blank project. Here is what already exists and what does not:

### Already implemented (do NOT rewrite unless noted):
- `server/schema.sql` — complete MySQL schema with all 5 tables, foreign keys, indexes, UNIQUE on work_items.request_id
- `server/db.js` — mysql2 promise pool, reads from .env
- `server/server.js` — Express app, CORS, routes mounted, health endpoint, error handlers, exports `app` for tests
- `server/middleware/authMiddleware.js` — JWT Bearer extraction, sets req.user = {userId, workspaceId}
- `server/controllers/authController.js` — login with bcrypt timing-safe compare, returns token + user object
- `server/controllers/requestController.js` — ALL 7 request handlers fully implemented with workspace isolation
- `server/routes/authRoutes.js` — POST /api/auth/login
- `server/routes/requestRoutes.js` — all 7 request routes with auth middleware
- `server/seed.js` — full seed: 2 workspaces, 2 users (bcrypt), 7 requests (NEW/QUALIFIED/CLOSED in both workspaces), activities
- `client/src/api.js` — axios instance with /api baseURL, JWT interceptor, 401 redirect
- `client/src/main.jsx` — React root, imports Bootstrap CSS
- `client/src/index.css` — status badge classes, timeline styles
- `client/vite.config.js` — proxy /api → localhost:5000
- `client/package.json` — all frontend deps (react, react-router-dom, axios, bootstrap)
- `server/package.json` — all backend deps (express, jwt, bcryptjs, mysql2, cors, dotenv)
- `package.json` (root) — dev/server/client/seed/test/build scripts with concurrently
- `.env.example` — all required env vars
- `.gitignore` — node_modules, .env, dist, coverage

### Missing (must be created):
- `client/src/App.jsx` — needs full React Router setup (currently Vite default)
- `client/src/pages/Login.jsx` — login page
- `client/src/pages/Dashboard.jsx` — dashboard with filter + list
- `client/src/pages/RequestDetails.jsx` — request detail + activities + work item
- `client/src/components/Navbar.jsx` — navigation bar
- `client/src/components/RequestForm.jsx` — create request form
- `client/src/components/RequestList.jsx` — table of requests
- `client/src/components/ConfirmationModal.jsx` — convert confirmation modal
- `tests/workspace.test.js` — workspace isolation tests
- `tests/conversion.test.js` — conversion logic tests
- `tests/frontend.test.jsx` — confirmation modal RTL tests
- `tests/__mocks__/styleMock.js` — CSS mock for Jest
- Root `package.json` — needs jest config + install:all script + updated test script
- `README.md` — full project README

---

## Implementation Plan

- [ ] 1. Add Jest config, test dependencies, and `install:all` script to root `package.json`.
      The root package.json already has scripts but is missing Jest config, `install:all`, and test
      dependencies (jest, babel-jest, @babel/core, @babel/preset-env, @babel/preset-react,
      @testing-library/react, @testing-library/jest-dom, @testing-library/user-event, supertest,
      identity-obj-proxy). Add `jest` config block with testEnvironment: node, transform for
      .jsx? files via babel-jest, setupFilesAfterFramework [@testing-library/jest-dom], and
      moduleNameMapper for .css → styleMock.js. Update "test" script to
      `jest --testPathPattern=tests/ --forceExit`. Add "install:all" script.
      Files: `package.json` (root)
      Verify: `node -e "const p=require('./package.json'); console.log(p.jest.testEnvironment)"` 
      outputs "node".

- [ ] 2. Create Babel config for Jest transpilation.
      Jest needs Babel to handle ES modules in JSX test files. Create `babel.config.js` at the
      root with presets `@babel/preset-env` (targets: {node: 'current'}) and
      `@babel/preset-react` (runtime: 'automatic'). This is the standard pattern for Jest + React
      without TypeScript.
      Files: `babel.config.js` (root)
      Verify: File exists and exports a valid config object. Confirmed when tests run in step 11.

- [ ] 3. Create `tests/__mocks__/styleMock.js`.
      Jest moduleNameMapper routes CSS imports to this file to prevent parse errors in frontend
      tests. The file exports an empty object: `module.exports = {};`.
      Files: `tests/__mocks__/styleMock.js`
      Verify: File exists. Confirmed when frontend tests run in step 11.

- [ ] 4. Replace `client/src/App.jsx` with full React Router application shell.
      Replace the Vite default with a real app: import BrowserRouter, Routes, Route from
      react-router-dom. Implement a `ProtectedRoute` component that reads `localStorage.getItem('token')`
      and redirects to /login if absent (using Navigate from react-router-dom). Routes:
        - `/login` → Login page (public)
        - `/` → ProtectedRoute → Dashboard
        - `/requests/new` → ProtectedRoute → Dashboard with newRequest state (or navigate to Dashboard)
        - `/requests/:id` → ProtectedRoute → RequestDetails
      Keep App.jsx simple — no context, no Redux, just router + protected route wrapper.
      Files: `client/src/App.jsx`
      Verify: `cd client && npm run build` completes without errors.

- [ ] 5. Create `client/src/components/Navbar.jsx`.
      Bootstrap navbar showing app name "Client Request Desk" on the left. On the right: show
      logged-in user's name (read from `localStorage.getItem('user')` parsed as JSON), a "New
      Request" button that links to `/requests/new` (or triggers a prop callback), and a Logout
      button that clears localStorage and redirects to /login. Use Bootstrap classes: `navbar
      navbar-expand-lg navbar-dark bg-dark`. Keep it simple — no external state.
      Files: `client/src/components/Navbar.jsx`
      Verify: `cd client && npm run build` completes without errors.

- [ ] 6. Create `client/src/components/RequestList.jsx`.
      A Bootstrap table component that receives a `requests` array prop and renders rows with:
      customer_name, requested_service, scheduled_date, status badge (using the CSS classes
      badge-NEW / badge-QUALIFIED / badge-CLOSED already in index.css), has_work_item indicator,
      and a "View" button linking to `/requests/:id`. Accepts an optional `loading` boolean prop
      to show a spinner. Empty state message when no requests. Keep it a pure presentational
      component — no API calls.
      Files: `client/src/components/RequestList.jsx`
      Verify: `cd client && npm run build` completes without errors.

- [ ] 7. Create `client/src/components/ConfirmationModal.jsx`.
      Bootstrap modal component that receives props: `show` (boolean), `request` (object with
      customer_name, requested_service, scheduled_date), `onConfirm` (callback), `onCancel`
      (callback), `loading` (boolean). CRITICAL: this component MUST NOT call any API itself.
      It only displays the data it receives and calls the callbacks. When show=true, render a
      Bootstrap modal overlay showing customer name, service, scheduled date with a "Cancel"
      button (calls onCancel) and "Create Work Item" button (calls onConfirm, disabled while
      loading). Use Bootstrap modal classes without requiring JS bootstrap bundle — control
      visibility via show prop and inline style/className. This design (controlled modal, no
      external API call from modal) is what the frontend tests verify.
      Files: `client/src/components/ConfirmationModal.jsx`
      Verify: `cd client && npm run build` completes without errors.

- [ ] 8. Create `client/src/components/RequestForm.jsx`.
      Bootstrap form component for creating a new request. Fields: customer_name, customer_email,
      requested_service, description, scheduled_date, status (select: NEW/QUALIFIED/CLOSED).
      On submit calls `api.post('/requests', formData)` then navigates to `/requests/:newId`.
      Shows validation errors inline. Shows a loading state on the submit button. Receives an
      optional `onSuccess` callback. Keep all state local with useState — no form library needed.
      Files: `client/src/components/RequestForm.jsx`
      Verify: `cd client && npm run build` completes without errors.

- [ ] 9. Create `client/src/pages/Login.jsx`.
      Bootstrap card-style login form centered on the page. Fields: email, password. On submit
      calls `api.post('/auth/login', {email, password})`, stores token and user in localStorage,
      then navigates to `/`. Shows demo credentials for both workspaces in a small info alert
      below the form (so the evaluator can easily log in). Displays error message on failed login.
      Loading state on submit button.
      Files: `client/src/pages/Login.jsx`
      Verify: `cd client && npm run build` completes without errors.

- [ ] 10. Create `client/src/pages/Dashboard.jsx`.
       Main authenticated page. On mount, calls `api.get('/requests')` (or with ?status= filter).
       Shows Navbar at top. Below: heading "Requests", filter buttons (All / NEW / QUALIFIED /
       CLOSED) as Bootstrap btn-group, and RequestList. Has a "New Request" modal or inline section
       using RequestForm — when the URL is `/requests/new` or a state flag is set, show the
       RequestForm in a Bootstrap modal or collapsible section. On successful request creation,
       refresh the list and close the form. Keep all state local (useState for requests, status
       filter, loading, showForm). No global state.
       Files: `client/src/pages/Dashboard.jsx`
       Verify: `cd client && npm run build` completes without errors.

- [ ] 11. Create `client/src/pages/RequestDetails.jsx`.
        Fetches `api.get('/requests/:id')` which returns the request + activities + work_item in
        one call. Shows: customer info section, request info section, status badge, and an inline
        status-change select (PATCH /api/requests/:id). Activities timeline using the
        `.timeline-item` CSS class already in index.css. Work item section: if work_item exists,
        show it as a card; if request is QUALIFIED and no work item, show "Convert to Work Item"
        button that opens the ConfirmationModal. When modal's onConfirm fires, call
        `api.post('/requests/:id/convert')`, close modal, and refresh the request data. Handle
        loading/error states.
        Files: `client/src/pages/RequestDetails.jsx`
        Verify: `cd client && npm run build` completes without errors (full client build confirms
        all imports resolve).

- [ ] 12. Write `tests/workspace.test.js` — workspace isolation tests.
        Use Jest + Supertest. Mock `../server/db` using `jest.mock`. The mock must return a jest.fn()
        pool where `query` is a jest.fn(). Tests use `require('../server/server')` to get the app.
        Before each test, generate a valid JWT (sign with a test JWT_SECRET set in env) for
        workspace 1. Test cases:
          a. GET /api/requests — mock db returns rows for workspace 1 only; assert response only
             contains workspace_id=1 records.
          b. GET /api/requests/:id — mock db.query returns empty array when workspace_id doesn't
             match; assert 404.
          c. PATCH /api/requests/:id — same workspace mismatch → 404.
          d. GET /api/requests with invalid status → 400.
        Set process.env.JWT_SECRET before tests. Use jest.resetAllMocks() in beforeEach.
        Files: `tests/workspace.test.js`
        Verify: `npx jest tests/workspace.test.js --forceExit` — all tests pass.

- [ ] 13. Write `tests/conversion.test.js` — conversion logic tests.
        Use Jest + Supertest. Mock `../server/db` with jest.mock. The mock pool needs both `query`
        and `getConnection` — getConnection returns a mock connection object with beginTransaction,
        query, commit, rollback, release all as jest.fn(). Test cases:
          a. Convert a QUALIFIED request successfully — mock connection.query returns request row
             with status='QUALIFIED', then empty work_items array, then insertId for new work item,
             then user row; assert 201 response with work item data.
          b. Convert a non-QUALIFIED request (status='NEW') → assert 409 with message about
             QUALIFIED only.
          c. Convert already-converted request (work_items mock returns existing row) → assert 409
             duplicate message.
          d. Convert request not in user's workspace (mock returns empty rows on first query) →
             assert 404.
          e. Duplicate key error (ER_DUP_ENTRY from db) → assert 409.
        Files: `tests/conversion.test.js`
        Verify: `npx jest tests/conversion.test.js --forceExit` — all tests pass.

- [ ] 14. Write `tests/frontend.test.jsx` — ConfirmationModal RTL tests.
        Add `@jest-environment jsdom` docblock at top of file. Import render, screen, fireEvent
        from @testing-library/react and userEvent from @testing-library/user-event. Import
        ConfirmationModal from `../client/src/components/ConfirmationModal.jsx`. Test cases:
          a. Modal hidden when show=false — assert modal content not in document.
          b. Modal visible when show=true — assert customer name, service, date are visible.
          c. onConfirm NOT called when modal first opens (API not pre-called).
          d. onCancel called when Cancel button clicked.
          e. onConfirm called when "Create Work Item" button clicked.
          f. "Create Work Item" button is disabled when loading=true.
        These tests verify the CRITICAL requirement: the modal shows data before any API call, and
        the API is only triggered on user confirmation.
        Files: `tests/frontend.test.jsx`
        Verify: `npx jest tests/frontend.test.jsx --forceExit` — all tests pass.

- [ ] 15. Run the full test suite and fix any failures.
        Run all three test files together. Common issues to watch for and fix:
          - babel.config.js not picking up JSX — ensure @babel/preset-react is in presets
          - Jest moduleNameMapper path for styleMock.js must be `<rootDir>/tests/__mocks__/styleMock.js`
          - db mock shape must match how requestController.js calls db (pool.query vs conn.query)
          - JWT_SECRET must be set in test environment (set in each test file's beforeAll or top-level)
        Files: whichever test or config files need fixing
        Verify: `npx jest --testPathPattern=tests/ --forceExit` — all tests pass, 0 failures.

- [ ] 16. Write `README.md`.
        Comprehensive README covering:
          1. Overview & Features list
          2. Tech Stack table
          3. Architecture overview (client/server/db)
          4. Authentication (JWT, 7d expiry, what's in the payload)
          5. Workspace Isolation (explains the critical security requirement and how it's enforced)
          6. Duplicate Conversion Prevention (UNIQUE constraint + transaction + ER_DUP_ENTRY)
          7. Database Setup:
             a. Create database: `mysql -u root -p -e "CREATE DATABASE client_request_desk"`
             b. Execute schema: `mysql -u root -p client_request_desk < server/schema.sql`
             c. Run seed: `npm run seed`
          8. Installation: copy .env.example → .env, fill in DB creds + JWT_SECRET, then
             `npm run install:all`
          9. Development: `npm run dev` (starts both server on :5000 and client on :5173)
          10. Testing: `npm test`
          11. Production Build: `npm run build`
          12. Demo Credentials (both users)
          13. Assumptions & Trade-offs: MySQL chosen over PostgreSQL/SQLite because the assignment
              explicitly listed it; mysql2 provides promise-based API without ORM overhead; bcryptjs
              (pure JS) chosen over native bcrypt for easier cross-platform install in take-home context
          14. Future Improvements (pagination, roles, file attachments, real-time updates)
          15. AI Usage disclosure
        Files: `README.md` (root)
        Verify: File exists and is readable. No build step needed.

---

## Dependency Order Summary

Steps 1-3 are foundational config (no dependencies on each other, can be done in parallel).
Steps 4-11 are frontend files — each builds on the previous (App.jsx must exist before pages that
use it; components must exist before pages that import them). Build verification at each step catches
import errors immediately.
Steps 12-14 are test files — depend on server files (already exist) and client components (steps 7,
11). They can only be written after the components they test exist.
Step 15 runs everything and patches failures.
Step 16 is documentation — no code dependency, but written last so it reflects the final state.
