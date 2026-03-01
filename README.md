# Smart Bursar

End-to-end school finance platform that lets bursars, accountants, principals, parents, and superadmins manage fees, payments, expenses, and notifications. The stack is Express + MySQL for the API and React (Vite + Tailwind) for the UI.

## Architecture
- `backend/` – Node.js/Express API, MySQL data layer, seed scripts, email sender.
- `frontend/` – React single-page app with role-based portals (bursar, accountant, principal, admin, parent, superadmin).
- MySQL schema and seed data live in `backend/utils/schema.sql` (run once to bootstrap).

## Key Features
- Auth with password or OTP; role-based routing and guards.
- Student enrollment with auto-invoice generation per term.
- Fee collection, receipts, cashbook, defaulters, and class collection reports.
- Expense capture and approval; audit log for financial actions.
- Notification layer (welcome emails, receipts, reset links, balance reminders).
- Superadmin workspace to onboard schools, manage school admins, and view email delivery logs.
- Parent portal for fee card and payment history.

## Prerequisites
- Node.js 18+ and npm
- MySQL 8+
- SMTP account (Gmail App Password recommended)

## Quick Start
```bash
git clone <repo> smart-bursar
cd smart-bursar
```

### 1) Backend
```bash
cd backend
npm install
cp .env.example .env   # fill in values below
```

Set `.env` (minimum):
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_bursar
JWT_SECRET=your_32_char_secret
JWT_EXPIRES_IN=8h
SUPERADMIN_JWT_SECRET=your_superadmin_secret
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=your_app_password
EMAIL_FROM="Smart Bursar <your@gmail.com>"
APP_URL=http://localhost:5173
CLIENT_URL=http://localhost:5173
PORT=5000
```

Create and seed the database:
```bash
mysql -u root -p -e "CREATE DATABASE smart_bursar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p smart_bursar < utils/schema.sql   # creates tables + demo data
npm run seed                                       # optional: re-run seed helpers
```

Start the API:
```bash
npm run dev   # with nodemon
# or
npm start     # plain node
# Health check: GET http://localhost:5000/api/health
```

### 2) Frontend
```bash
cd ../frontend
npm install
cp .env.example .env   # defaults to VITE_API_URL=http://localhost:5000/api
npm run dev            # opens http://localhost:5173
```

## Demo Accounts (from seed)
| Role        | Email                  | Password     | Portal path        |
|-------------|------------------------|--------------|--------------------|
| Bursar      | bursar@kenza.rw        | password123  | /app               |
| Accountant  | accountant@kenza.rw    | password123  | /accountant        |
| Principal   | principal@kenza.rw     | password123  | /principal         |
| Admin       | admin@kenza.rw         | password123  | /admin             |
| Parent      | guardian email on file | password123  | /parent            |
| Superadmin  | superadmin@smartbursar.rw | superadmin123 | /superadmin/login |

## Notable Scripts
- Backend: `npm run dev`, `npm start`, `npm run seed`
- Frontend: `npm run dev`, `npm run build`, `npm run preview`

## Project Layout
- `backend/server.js` – Express bootstrap and route mounts.
- `backend/routes/*.js` – Route definitions (auth, students, payments, expenses, invoices, reports, settings, notifications, users, superadmin).
- `backend/controllers/` – Handlers for the above routes.
- `backend/utils/schema.sql` – Full MySQL schema + seed data.
- `frontend/src/App.jsx` – Router with guards and portal entry points.
- `frontend/src/pages` and `frontend/src/portals` – Screens per role; layouts under `layouts/` and role-specific subfolders.

## API Base
All endpoints are prefixed with `/api`. Example: `POST /api/auth/login`, `GET /api/students`, `POST /api/payments`.

## Emails
SMTP settings come from `.env`. Messages (receipts, welcomes, resets, reminders, new school) are logged in the `email_notifications` table.

## Production Notes
- Set strong `JWT_SECRET`/`SUPERADMIN_JWT_SECRET`.
- Point `APP_URL` and `CLIENT_URL` to the deployed frontend domain.
- Configure a real SMTP sender (avoid free Gmail limits for volume).
- Run `npm run build` in `frontend/` and serve `dist/` behind a reverse proxy; keep backend on HTTPS.

## Troubleshooting
- CORS issues: ensure `CLIENT_URL` matches the frontend origin.
- Emails failing with self-signed cert: set proper SMTP credentials or disable strict TLS only in development.
- Duplicate seed errors: tables use `INSERT ...` with unique keys; re-run after truncating or drop/recreate DB.

