# Booking Cancellation Tracker

Full-stack web application for tracking booking cancellations, refund reference numbers, follow-up timelines, and overdue refund escalations across travel, accommodation, and event bookings.

## Tech Stack
- **Frontend:** React 19, TypeScript, Tailwind CSS v4, Lucide icons
- **Backend:** Node.js, Express REST API with structured validation middleware
- **Database:** MongoDB via Mongoose (`Cancellation` and `Settings` schemas), with automatic local JSON persistence fallback when `mongod` is offline

## Project Structure
```text
├── server.ts                          # Express + Vite server entrypoint (port 3000)
├── shared/
│   ├── types.ts                       # Shared domain models, enums, API contracts
│   ├── logic.ts                       # Staleness math, validation, KPI aggregation, filtering
│   └── logic.test.ts                  # Node built-in unit tests (node:test)
├── server/
│   ├── db/
│   │   ├── connect.ts                 # Mongoose connection helper
│   │   └── seedData.ts                # Deterministic initial booking records
│   ├── models/
│   │   ├── Cancellation.ts            # Mongoose Cancellation schema + embedded follow-up history
│   │   └── Settings.ts                # Mongoose Settings schema (stale threshold days)
│   ├── repositories/
│   │   └── store.ts                   # Mongoose repository with local JSON fallback
│   ├── middleware/
│   │   ├── validation.ts              # Input validation middleware (400 structured errors)
│   │   └── errorHandler.ts            # Centralized 404 & error handler
│   ├── controllers/
│   │   ├── cancellationsController.ts # CRUD + follow-up handlers
│   │   └── settingsController.ts      # Threshold settings handlers
│   └── routes/
│       ├── cancellations.ts           # /api/cancellations routes
│       └── settings.ts                # /api/settings routes
└── src/
    ├── services/api.ts                # Typed REST client
    ├── components/                    # Modular responsive React components
    └── App.tsx                        # Main workspace application
```

## REST API Endpoints
- `GET /api/cancellations` — List records (supports `search`, `status`, `category`, `provider`, `needsFollowUp=true`, `sortBy`)
- `GET /api/cancellations/:id` — Fetch a single cancellation record
- `POST /api/cancellations` — Create a new cancellation record (validated)
- `PUT /api/cancellations/:id` — Update an existing cancellation record (validated, refreshes `lastUpdatedAt`)
- `POST /api/cancellations/:id/follow-up` — Log a follow-up note & optional status update (refreshes `lastUpdatedAt`)
- `DELETE /api/cancellations/:id` — Delete a cancellation record
- `GET /api/settings` — Get saved stale threshold days and default currency
- `PUT /api/settings` — Save custom stale threshold days (`1`–`365`) and default currency
- `GET /api/health` — API and database status

## Running Locally with MongoDB

### 1. Start MongoDB
Using Docker:
```bash
docker run -d --name tracker-mongo -p 27017:27017 mongo:7
```
Or via Homebrew (macOS):
```bash
brew services start mongodb-community
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure `MONGODB_URI` points to your MongoDB instance:
```env
MONGODB_URI="mongodb://127.0.0.1:27017/booking-cancellation-tracker"
PORT=3000
```

### 3. Install Dependencies & Run
```bash
npm install
npm run dev
```
The Express REST API and React frontend both run on `http://localhost:3000`.

### 4. Run Unit Tests & Production Build
```bash
npm test
npm run build
NODE_ENV=production npm start
```
