# Smart Bursar v2 — Setup Guide

## What's New in v2
- 🏫 **SuperAdmin Portal** — manage schools, admins, platform-wide controls
- 🎓 **Student Enrollment** — add/edit students with auto invoice generation  
- 🌐 **Landing Page** — public marketing page at `/`
- 🔐 **Password Recovery** — forgot/reset password via email link
- 📧 **Email Notification Layer** — receipts, welcome emails, balance reminders
- 🔔 **Notification Dashboard** — admin view of all sent/failed emails

## Prerequisites
- Node.js 18+
- MySQL 8+
- SMTP account (Gmail App Password recommended)

---

## Backend Setup

```bash
cd smart-bursar-backend
npm install
cp .env.example .env
```

### .env Configuration
```env
# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=smart_bursar

# JWT
JWT_SECRET=your_secret_key_minimum_32_chars
JWT_EXPIRES_IN=8h

# SuperAdmin JWT (can be same as JWT_SECRET)
SUPERADMIN_JWT_SECRET=your_superadmin_secret_key

# Email (Gmail example — use App Password, not your real password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your@gmail.com
SMTP_PASS=xxxx_xxxx_xxxx_xxxx   # 16-char App Password
EMAIL_FROM="Smart Bursar <your@gmail.com>"

# App URL (used in email links)
APP_URL=http://localhost:5173

# CORS
CLIENT_URL=http://localhost:5173
PORT=5000
```

### Database Setup
```bash
# Create DB
mysql -u root -p -e "CREATE DATABASE smart_bursar CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Run schema (includes v2 tables)
mysql -u root -p smart_bursar < utils/schema.sql

# Seed test data
npm run seed
```

### Seed SuperAdmin (run once)
```bash
node -e "
const bcrypt = require('bcryptjs');
const pool = require('./config/db');
bcrypt.hash('superadmin123', 10).then(h => {
  pool.query('INSERT IGNORE INTO superadmins (name, email, password_hash) VALUES (?, ?, ?)',
    ['Platform Admin', 'superadmin@smartbursar.rw', h])
    .then(() => { console.log('SuperAdmin created'); process.exit(); });
});
"
```

### Start
```bash
npm run dev    # Development (nodemon)
npm start      # Production
```

---

## Frontend Setup

```bash
cd smart-bursar
npm install
# Already has .env with VITE_API_URL=http://localhost:5000/api
npm run dev    # → http://localhost:5173
```

---

## Login Credentials

### School Users
| Role        | Email                     | Password     | Portal         |
|-------------|---------------------------|--------------|----------------|
| Bursar      | bursar@kenza.rw           | password123  | `/app`         |
| Accountant  | accountant@kenza.rw       | password123  | `/accountant`  |
| Principal   | principal@kenza.rw        | password123  | `/principal`   |
| Admin       | admin@kenza.rw            | password123  | `/admin`       |
| Parent      | (use any student guardian email) | password123 | `/parent` |

### SuperAdmin (platform-level)
| Email                        | Password       | Portal              |
|------------------------------|----------------|---------------------|
| superadmin@smartbursar.rw   | superadmin123  | `/superadmin/login` |

---

## All Routes

### Public
- `/` — Landing page (marketing)
- `/login` — School user login
- `/forgot-password` — Password recovery
- `/reset-password?token=xxx` — Set new password
- `/superadmin/login` — Platform admin login

### School Portals (require login)
- `/app` — Bursar: Daily Ops, Collect Payment, Cash Book, Enrollment, Reports
- `/accountant` — Accountant: Reconciliation, Expense Approval, Ledger, Audit
- `/principal` — Principal: Executive Summary, Fee Collection, Expenditure
- `/admin` — Admin: Users, Enrollment, Notifications, Settings, Terms
- `/parent` — Parent: Child Fee Card, Payment History

### SuperAdmin Portal
- `/superadmin` — Dashboard (stats, recent schools)
- `/superadmin/schools` — Add/disable/configure schools + school admins
- `/superadmin/emails` — Platform-wide email delivery log

---

## Email Notifications

Emails are sent automatically for:
- ✅ **Payment Receipt** — on every payment, to guardian email
- ✅ **Welcome Email** — when admin creates a new user
- ✅ **Password Reset** — when forgot-password is requested
- ✅ **Balance Reminder** — manually triggered from Admin > Notifications
- ✅ **New School** — when SuperAdmin creates a school (to school admin)

All emails are logged to the `email_notifications` table.

### Gmail Setup (recommended)
1. Enable 2FA on your Gmail account
2. Go to Google Account > Security > App Passwords
3. Create an app password for "Mail"
4. Use the 16-character code as `SMTP_PASS`

---

## API Endpoints Summary

```
POST /api/auth/login
GET  /api/auth/me
POST /api/auth/forgot-password
POST /api/auth/reset-password
GET  /api/auth/reset-token/:token

GET  /api/students
POST /api/students
GET  /api/students/:id
PUT  /api/students/:id

GET  /api/payments
POST /api/payments              ← sends receipt email automatically
GET  /api/payments/receipt/:no
POST /api/payments/:id/resend-receipt

GET  /api/notifications
GET  /api/notifications/stats
POST /api/notifications/send-reminders

GET  /api/reports/class-collection
GET  /api/reports/defaulters
GET  /api/reports/daily-summary

GET  /api/users
POST /api/users
PUT  /api/users/:id/role
PUT  /api/users/:id/toggle-active

POST /api/superadmin/login
GET  /api/superadmin/stats
GET  /api/superadmin/schools
POST /api/superadmin/schools
PUT  /api/superadmin/schools/:id
PUT  /api/superadmin/schools/:id/toggle
GET  /api/superadmin/schools/:id/admins
PUT  /api/superadmin/schools/:id/users/:userId/toggle
GET  /api/superadmin/email-log
```
