# XcelCrowd — Hiring Pipeline That Moves Itself

> A lightweight hiring pipeline for small engineering teams who can't afford Greenhouse or Lever.
> Built with MERN stack. No spreadsheets. No manual work. The waitlist moves itself.

---

## What Problem Does This Solve?

Small companies track job applicants in spreadsheets. When someone drops out, HR manually finds the next person, emails them, and hopes they respond. This is slow and messy.

**XcelCrowd fixes this.** Think of it like a doctor's waiting room:

- The doctor sees only **3 patients at a time** (active capacity)
- More patients sit in the **waiting area** (waitlist)
- When one patient leaves, the **next person is automatically called in**
- Nobody manages this manually — **it just happens**

---

## How The System Works — In Simple Steps

```
1. Company creates a job with activeCapacity = 3
2. First 3 applicants → placed in ACTIVE (under review)
3. 4th applicant onwards → placed in WAITLIST with a numbered position
4. When anyone exits (withdraw / reject / hire) → next waitlisted person AUTOMATICALLY promotes
5. Promoted person has 48 hours to click "I Acknowledge"
6. If they don't respond → they DECAY back to waitlist at a penalized position (+5 spots)
7. Next person promotes → cascade continues → zero human intervention
```

---

## Key Features

| Feature | Description |
|---|---|
| Active Capacity | Company controls how many applicants are actively reviewed |
| Auto Promotion | When someone exits, next person promotes automatically |
| Waitlist | Beyond-capacity applicants wait in a numbered queue |
| Status Check | Applicants see their exact status and position anytime |
| Race Condition Safe | Two people applying simultaneously handled with atomic DB operation |
| Inactivity Decay | Promoted applicants who go silent get penalized and sent back |
| Audit Log | Every single action is logged with timestamp |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Database | MongoDB |
| Backend | Node.js + Express.js |
| Frontend | React.js |
| Auth | JWT (JSON Web Tokens) |
| Scheduler | node-cron (runs decay check every minute) |

---

## Project Structure

```
xcelcrowd/
│
├── server/                         ← Backend
│   ├── models/
│   │   ├── User.js                 ← User schema (company & applicant)
│   │   ├── Job.js                  ← Job schema (title, capacity, status)
│   │   └── Application.js         ← Application schema (status, logs, decay)
│   │
│   ├── routes/
│   │   ├── authRoutes.js           ← /api/auth/register, /api/auth/login
│   │   ├── jobRoutes.js            ← /api/jobs (CRUD)
│   │   └── applicationRoutes.js   ← /api/applications (apply, promote, hire)
│   │
│   ├── controllers/
│   │   ├── authController.js       ← Register & login logic
│   │   ├── jobController.js        ← Create job, get pipeline stats
│   │   └── applicationController.js ← Apply, acknowledge, withdraw, hire, reject
│   │
│   ├── services/
│   │   ├── queueService.js         ← CORE: apply, auto-promote, exit pipeline
│   │   ├── decayService.js         ← Detects inactive applicants, triggers decay
│   │   └── scheduler.js            ← Cron job runs decay check every minute
│   │
│   ├── middleware/
│   │   └── authMiddleware.js       ← JWT protect, isCompany, isApplicant
│   │
│   ├── .env                        ← Environment variables
│   └── server.js                   ← Entry point
│
└── client/                         ← Frontend (React)
    └── src/
        ├── pages/
        │   ├── Login.js
        │   ├── Register.js
        │   ├── CompanyDashboard.js ← Pipeline view, hire/reject applicants
        │   └── ApplicantDashboard.js ← Status, position, acknowledge, withdraw
        └── api/
            └── index.js            ← All API calls with axios + auto token inject
```

---

## How To Run Locally — Step By Step

### Prerequisites

Make sure you have these installed:

```bash
node -v        # Should show v18 or above
mongod --version   # Should show v6 or above
git --version      # Any version
```

### Step 1 — Clone the Repository

```bash
git clone https://github.com/Ankam-Vijay/xcelcrowd.git
cd xcelcrowd
```

### Step 2 — Setup Backend

```bash
cd server
npm install
```

### Step 3 — Create the .env file

Create a file called `.env` inside the `server/` folder and paste this:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/xcelcrowd
JWT_SECRET=xcelcrowd_secret_key_2024
DECAY_WINDOW_HOURS=48
PENALTY_POSITIONS=5
```

| Variable | What It Does |
|---|---|
| PORT | Backend runs on port 5000 |
| MONGO_URI | MongoDB connection string |
| JWT_SECRET | Secret key for generating auth tokens |
| DECAY_WINDOW_HOURS | How long a promoted applicant has to acknowledge (48 hrs) |
| PENALTY_POSITIONS | How many spots down they drop if they don't respond (+5) |

### Step 4 — Start the Backend

```bash
# Make sure you are inside the server/ folder
nodemon server.js
```

You should see:
```
✅ MongoDB connected successfully!
⏰ Scheduler started!
✅ Server running on port 5000
```

### Step 5 — Setup and Start Frontend

Open a **new terminal** (keep the backend terminal running):

```bash
cd client
npm install
npm start
```

You should see the app open at:
```
http://localhost:3000
```

> ⚠️ **Important:** Keep BOTH terminals running at all times.
> Terminal 1 = Backend server | Terminal 2 = React frontend

---

## How To Test The App

### Test as a Company

1. Go to `http://localhost:3000/register`
2. Fill in name, email, password → select role: **Company**
3. You will be redirected to the **Company Dashboard**
4. Click **+ New Job** → fill title, description, active capacity (e.g. 3)
5. Click on the job to see the full pipeline

### Test as an Applicant

1. Open a new browser tab → go to `http://localhost:3000/register`
2. Register with a different email → select role: **Applicant**
3. You will see available jobs → click one → click **Apply Now**
4. If slots are available → you get **ACTIVE** status
5. If slots are full → you get **WAITLISTED** status with your position number

### Test Auto Promotion

1. Login as Company → Reject or Hire an active applicant
2. Go back to applicant view → the next waitlisted applicant is now **ACTIVE**
3. This happens automatically — no manual step needed

### Test Inactivity Decay

1. An applicant gets promoted to Active
2. They do NOT click "I Acknowledge" within 48 hours
3. The scheduler automatically moves them back to waitlist at a penalized position
4. The next person in the waitlist gets promoted

> For testing purposes: the scheduler runs every **1 minute** instead of every hour.
> You can simulate decay by setting `promotedAt` to 49 hours ago in MongoDB.

---

## API Documentation

### Auth Routes

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | `{ name, email, password, role }` | Register new user |
| POST | `/api/auth/login` | `{ email, password }` | Login and receive JWT token |

### Job Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/jobs` | Company | Create a new job opening |
| GET | `/api/jobs` | Public | Get all open jobs |
| GET | `/api/jobs/:id` | Public | Get job with full pipeline stats |
| GET | `/api/jobs/company/myjobs` | Company | Get company's own jobs |
| PATCH | `/api/jobs/:id/close` | Company | Close a job opening |

### Application Routes

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/applications/:jobId/apply` | Applicant | Apply for a job |
| GET | `/api/applications/:jobId/mystatus` | Applicant | Check status and position |
| POST | `/api/applications/:jobId/acknowledge` | Applicant | Acknowledge promotion |
| POST | `/api/applications/:jobId/withdraw` | Applicant | Withdraw application |
| POST | `/api/applications/:id/reject` | Company | Reject an applicant |
| POST | `/api/applications/:id/hire` | Company | Hire an applicant |

> All protected routes require `Authorization: Bearer <token>` header.

---

## Audit Log — Every Action Is Tracked

Every time something happens to an application, a log entry is created:

| Log Action | When It Triggers |
|---|---|
| `APPLIED_ACTIVE` | Applicant applied and got an active slot |
| `APPLIED_WAITLISTED` | Applicant applied but capacity was full |
| `PROMOTED_TO_ACTIVE` | Waitlisted applicant was automatically promoted |
| `ACKNOWLEDGED` | Applicant confirmed their promotion |
| `DECAYED` | Applicant failed to acknowledge — sent back to waitlist |
| `EXITED_PIPELINE` | Application was withdrawn, rejected, or hired |

---

## Architectural Decisions

### 1. Queue Built From Scratch
No third-party queue libraries used (no Bull, BeeQueue, etc.). The entire queue logic is written manually using MongoDB atomic operations. This satisfies the problem statement requirement directly.

### 2. Race Condition Handling
When two applicants apply at the exact same millisecond for the last slot:
- MongoDB's `findOneAndUpdate` with `$expr` condition is used
- Only ONE transaction can win — the other automatically goes to waitlist
- This is handled at the database level, not application level

### 3. Inactivity Decay
- On promotion, `promotedAt` timestamp is saved
- Cron scheduler checks every minute for `promotedAt < 48hrs ago AND acknowledgedAt = null`
- If found → applicant decays back to waitlist at `lastPosition + 5`
- Next waitlisted applicant promotes → cascade continues without human intervention

### 4. Frontend Refresh Strategy
Frontend refreshes pipeline data after every user action (hire, reject, withdraw). This is a deliberate polling approach — simpler than WebSockets and sufficient for this use case. Documented as a conscious tradeoff.

---

## Tradeoffs

| Decision | Why | Tradeoff |
|---|---|---|
| Polling over WebSockets | Simpler to build and maintain | Not instantly real-time |
| Positions as integers | Fast to read and sort | Requires reordering when someone exits |
| Cron runs every minute | Easy to test and demo | Should be hourly in production |
| JWT in localStorage | Simple implementation | Less secure than httpOnly cookies |
| Logs embedded in application | Single document read | Cannot query logs independently |

---

## What I Would Improve With More Time

1. **WebSocket real-time updates** — dashboard refreshes instantly without user action
2. **Email notifications** — alert applicants when promoted or decayed
3. **Docker setup** — single command to run the entire app
4. **Unit tests** — test queue logic, decay engine, and race conditions
5. **Rate limiting** — prevent API abuse
6. **Pagination** — handle large waitlists with hundreds of applicants
7. **httpOnly cookies** — more secure token storage
8. **Separate audit log collection** — allow independent querying and analytics

---

## Author

**Ankam Vijay**
GitHub: [@Ankam-Vijay](https://github.com/Ankam-Vijay)
