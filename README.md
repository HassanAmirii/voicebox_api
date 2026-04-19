# VoiceBox API

Express + MongoDB backend for anonymous incident reports and admin moderation.

## Tech Stack

- Node.js (ESM)
- Express 5
- MongoDB + Mongoose
- Joi validation
- JWT auth

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/voicebox
JWT_SECRET=replace-with-strong-secret
APP_ENV=development
FRONTEND_URL=http://localhost:5173
```

## Install and Run

```bash
npm install
npm start
```

Health check:

```http
GET /health
```

## Bootstrap And Seeding

Use these scripts to break the initial admin onboarding loop.

### 1) Bootstrap first admin + first membership code

Required env vars:

```env
BOOTSTRAP_ADMIN_USERNAME=admin001
BOOTSTRAP_ADMIN_PASSWORD=strongPass123
```

Optional env vars:

```env
BOOTSTRAP_ADMIN_MEMBERSHIP_CODE=A1B2C3D4E5
FIRST_MEMBERSHIP_CODE=F6G7H8I9J0
```

Run:

```bash
npm run bootstrap:admin
```

What it does:

- Creates the first admin if missing.
- Creates one active membership code for that admin if none currently active.

### 2) Seed additional membership code from existing admin

Required env vars:

```env
SEED_ADMIN_USERNAME=admin001
```

Optional env var:

```env
SEED_MEMBERSHIP_CODE=K1L2M3N4O5
```

Run:

```bash
npm run seed:membership-code
```

### 3) One-command interactive bootstrap

Run:

```bash
npm run bootstrap:interactive
```

It prompts for:

- admin username
- admin password
- optional initial admin membership code (10 chars)
- optional first generated membership code (10 chars)

This command only needs `MONGO_URI` in `.env`.

## Authentication

Protected endpoints require:

```http
Authorization: Bearer <jwt-token>
```

Token is returned from `POST /auth/login` and `POST /auth/register`.

## Data Models (Summary)

### Report

- `title` (string, 20-30 chars, required)
- `tags` (array, required, at least one from allowed list)
- `identity` (string, optional, min 15 chars if provided, stored as hidden field)
- `comment` (string, required, min 150 chars)
- `status` (`Unhandled` | `Queue` | `Handled`, default `Unhandled`)
- `adminNote` (string, required to be >10 chars when status is `Queue` or `Handled`)

### Admin

- `username` (string, unique, min 6)
- `password` (hashed, min 7)
- `membershipCode` (string, 10 chars)

### Membership Code

- `code` (string, unique, 10 chars)
- `generatedBy` (admin id)
- `isUsed` (boolean)
- `expiresAt` (auto expires in 1 hour)

## API Endpoints

Base URL examples use `http://localhost:3000`.

### Public

#### 1) Submit report

```http
POST /reports
Content-Type: application/json
```

Body:

```json
{
  "title": "This title has twenty chars",
  "tags": ["Harassment"],
  "identity": "Optional identity details",
  "comment": "At least 150 characters describing what happened, where it happened, who was involved, and any additional context that can help administrators review and respond quickly."
}
```

Success response:

```json
{
  "success": true,
  "message": "report submitted"
}
```

#### 2) List submitted reports (public feed)

```http
GET /reports?page=1&limit=10
```

Success response:

```json
{
  "success": true,
  "reports": [],
  "pagination": {
    "totalReports": 0,
    "currentPage": 1,
    "totalPages": 0,
    "limit": 10
  }
}
```

#### 3) Register admin

```http
POST /auth/register
Content-Type: application/json
```

Body:

```json
{
  "username": "admin001",
  "password": "strongPass123",
  "membershipCode": "A1B2C3D4E5"
}
```

Notes:

- Membership code must exist, be unused, and be unexpired.
- On success, the code becomes used.

#### 4) Login admin

```http
POST /auth/login
Content-Type: application/json
```

Body:

```json
{
  "username": "admin001",
  "password": "strongPass123"
}
```

Success response:

```json
{
  "success": true,
  "message": "login successful",
  "token": "<jwt>"
}
```

### Protected Admin Endpoints

#### 5) Filter/search reports

```http
GET /admin/reports?status=Unhandled&tags=Harassment,Assault&search=class&page=1&limit=10
Authorization: Bearer <jwt>
```

Query params:

- `status`: `Unhandled` | `Queue` | `Handled`
- `tags`: comma-separated tags
- `search`: matches report `title` or `comment`
- `page`: min 1
- `limit`: 1-100

#### 6) Update report status/admin note

```http
PATCH /admin/reports/:id
Authorization: Bearer <jwt>
Content-Type: application/json
```

Body (at least one field required):

```json
{
  "status": "Queue",
  "adminNote": "Escalated to welfare office for immediate follow-up."
}
```

#### 7) Admin dashboard stats

```http
GET /admin/stats
Authorization: Bearer <jwt>
```

Success response:

```json
{
  "success": true,
  "data": {
    "totalReports": 12,
    "totalThisWeek": 4,
    "totalToday": 1,
    "handledRatio": 25
  }
}
```

#### 8) List admins

```http
GET /admin/admins
Authorization: Bearer <jwt>
```

#### 9) Delete admin by username

```http
DELETE /admin/admins/:username
Authorization: Bearer <jwt>
```

Returns `404` if admin does not exist.

#### 10) Generate membership code

```http
POST /admin/membership-code
Authorization: Bearer <jwt>
```

Success response contains generated code document and expires in 1 hour.

## Error Behavior

- Validation errors: `400`
- Invalid credentials/token: `401`
- Not found: `404`
- Duplicate unique values: `409`
- Unexpected server errors: `500`

In development (`APP_ENV=development`), error stack is included in responses.
