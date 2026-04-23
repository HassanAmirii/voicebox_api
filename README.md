# VoiceBox API

Express + MongoDB backend for anonymous incident reports and admin moderation.

## Tech Stack

- Node.js (ESM)
- Express 5
- MongoDB + Mongoose
- Joi validation
- JWT auth
- CORS + Helmet + mongo sanitize
- NodeCache (admin stats caching)

## Environment Variables

Create a `.env` file in the project root:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/voicebox
JWT_SECRET=replace-with-strong-secret
APP_ENV=development
FRONTEND_URL=http://localhost:5173
```

Notes:

- Required to boot: `MONGO_URI`, `JWT_SECRET`
- `PORT` defaults to `3000` if missing
- `FRONTEND_URL` is used as production CORS origin

## Install and Run

```bash
npm install
```

Start production mode:

```bash
npm start
```

Start in watch mode:

```bash
npm run dev
```

Health check:

```http
GET /health
```

## Authentication

Protected endpoints require:

```http
Authorization: Bearer <jwt-token>
```

Tokens are returned by:

- `POST /auth/register`
- `POST /auth/login`

Token expiry is `1d`.

## Rate Limiting

The API uses `express-rate-limit` on selected public write/auth routes.

- `POST /auth/login`: 5 requests per 15 minutes per IP
- `POST /auth/register`: 10 requests per 1 hour per IP
- `POST /reports`: 20 requests per 1 hour per IP

When a limit is exceeded, the API responds with:

```json
{
  "success": false,
  "message": "too many attempts, try again later"
}
```

## Security Middleware

- `express-mongo-sanitize`: strips mongo operators from payloads
- `helmet`: secures common HTTP response headers
- `cors`: allows configured frontend origins and auth headers

## Data Models (Summary)

### Report

- `title` (string, required, min 20, max 30)
- `tags` (array of allowed values, required, at least one)
- `identity` (string, optional, min 15 if provided, hidden by default)
- `comment` (string, required, min 150)
- `status` (`Unhandled` | `Queue` | `Handled`, default `Unhandled`)
- `adminNote` (required and > 10 chars when status is `Queue` or `Handled`)

### Admin

- `username` (string, unique, min 6)
- `password` (hashed, min 7)
- `membershipCode` (string, 10 chars)

### Membership Code

- `code` (string, unique, 10 chars)
- `generatedBy` (admin id)
- `isUsed` (boolean)
- `expiresAt` (auto expires in 1 hour via TTL index)

## API Endpoints

Base URL examples use `http://localhost:3000`.

### Public Endpoints

#### 1) Submit report

```http
POST /reports
Content-Type: application/json
```

Rate limit: 20 requests per 1 hour per IP.

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

Rate limit: 10 requests per 1 hour per IP.

Body:

```json
{
  "username": "admin001",
  "password": "strongPass123",
  "membershipCode": "A1B2C3D4E5"
}
```

Notes:

- Membership code must exist, be unused, and unexpired.
- On success, the code is marked as used.
- Response includes created admin data and a token.

#### 4) Login admin

```http
POST /auth/login
Content-Type: application/json
```

Rate limit: 5 requests per 15 minutes per IP.

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
- `tags`: comma-separated tags (or repeated query tags)
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

Response is cached for 60 seconds.

#### 8) List admins

```http
GET /admin/admins
Authorization: Bearer <jwt>
```

Returns usernames only.

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

Success response:

```json
{
  "success": true,
  "code": "A1B2C3D4E5"
}
```

## Error Behavior

- Validation errors: `400`
- Invalid or expired token: `401`
- Not found: `404`
- Duplicate unique values: `409`
- Unexpected server errors: `500`

In development (`APP_ENV=development`), error stack is included in responses.
