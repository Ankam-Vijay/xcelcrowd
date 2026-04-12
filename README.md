# XcelCrowd — Hiring Pipeline That Moves Itself

A lightweight internal hiring pipeline management system built for small engineering teams who can't afford expensive ATS platforms like Greenhouse or Lever.

##  Live Demo

- Company Dashboard: Login with role `company`
- Applicant Dashboard: Login with role `applicant`

##  Tech Stack

- **MongoDB** — Database
- **Express.js** — Backend framework
- **React.js** — Frontend
- **Node.js** — Runtime environment

##  Features

- Company creates job openings with defined active capacity
- Applications beyond capacity enter a waitlist automatically
- When an active applicant exits, the next waitlisted applicant promotes automatically
- Applicants can check their current status and queue position
- Race conditions handled with atomic MongoDB operations
- Every state transition is logged and fully traceable
- Inactivity decay engine with penalized repositioning
- Auto cascade promotion continues without human intervention

##  Architecture

xcelcrowd/
├── server/
│   ├── models/
│   │   ├── User.js
│   │   ├── Job.js
│   │   └── Application.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── jobRoutes.js
│   │   └── applicationRoutes.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── jobController.js
│   │   └── applicationController.js
│   ├── services/
│   │   ├── queueService.js
│   │   ├── decayService.js
│   │   └── scheduler.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   └── server.js
│
├── client/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.js
│   │   │   ├── Register.js
│   │   │   ├── CompanyDashboard.js
│   │   │   └── ApplicantDashboard.js
│   │   └── api/
│   │       └── index.js

## 🔧 Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB (v6+)
- Git

### Installation

1. Clone the repository
```bash
git clone https://github.com/Ankam-Vijay/xcelcrowd.git
cd xcelcrowd
```

2. Setup Backend
```bash
cd server
npm install
```

3. Create `.env` file in `server/` folder
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/xcelcrowd
JWT_SECRET=xcelcrowd_secret_key_2024
DECAY_WINDOW_HOURS=48
PENALTY_POSITIONS=5
```

4. Start Backend
```bash
nodemon server.js
```

5. Setup Frontend
```bash
cd ../client
npm install
npm start
```

6. Open browser at `http://localhost:3000`

## 📡 API Documentation

### Auth Routes
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register company or applicant |
| POST | `/api/auth/login` | Login and get token |

### Job Routes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/jobs` | Create job opening | Company |
| GET | `/api/jobs` | Get all open jobs | Public |
| GET | `/api/jobs/:id` | Get job with pipeline stats | Public |
| GET | `/api/jobs/company/myjobs` | Get company's jobs | Company |
| PATCH | `/api/jobs/:id/close` | Close a job | Company |

### Application Routes
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/api/applications/:jobId/apply` | Apply for a job | Applicant |
| GET | `/api/applications/:jobId/mystatus` | Check application status | Applicant |
| POST | `/api/applications/:jobId/acknowledge` | Acknowledge promotion | Applicant |
| POST | `/api/applications/:jobId/withdraw` | Withdraw application | Applicant |
| POST | `/api/applications/:applicationId/reject` | Reject applicant | Company |
| POST | `/api/applications/:applicationId/hire` | Hire applicant | Company |

## 🧠 Architectural Decisions

### 1. Queue System — Built from Scratch
No third party queue libraries used. The queue logic is implemented using:
- MongoDB atomic operations (`findOneAndUpdate` with `$expr`) to claim active slots
- Waitlist positions stored as integers in the database
- Auto reordering when someone exits the pipeline

### 2. Race Condition Handling
When two applicants apply simultaneously for the last available slot:
- We use MongoDB's atomic `findOneAndUpdate` with a conditional filter
- Only one transaction can successfully increment `currentActiveCount`
- The other applicant automatically goes to the waitlist
- This is documented in `queueService.js`

### 3. Inactivity Decay Engine
- When a waitlisted applicant is promoted to active, `promotedAt` timestamp is recorded
- A `node-cron` scheduler runs every minute checking for unacknowledged promotions
- If `promotedAt` is older than 48 hours and `acknowledgedAt` is null → decay triggers
- Decayed applicant goes back to waitlist at `lastPosition + PENALTY_POSITIONS`
- Next waitlisted applicant is automatically promoted → cascade continues

### 4. Audit Logging
Every state transition is logged inside the application document itself:
- `APPLIED_ACTIVE` — Applied and got active slot
- `APPLIED_WAITLISTED` — Applied and went to waitlist
- `PROMOTED_TO_ACTIVE` — Promoted from waitlist
- `ACKNOWLEDGED` — Applicant acknowledged promotion
- `DECAYED` — Applicant decayed back to waitlist
- `EXITED_PIPELINE` — Withdrawn, rejected, or hired

### 5. Frontend State Refresh
The frontend polls state on user action rather than using websockets. This is a deliberate decision to keep the system simple and avoid complexity. The company dashboard refreshes pipeline state after every hire/reject action.

## ⚖️ Tradeoffs Made

| Decision | Tradeoff |
|----------|----------|
| Polling instead of websockets | Simpler but not real time |
| Positions stored as integers | Fast reads but requires reordering on exit |
| Decay runs every minute | Good for testing but production should use every hour |
| JWT stored in localStorage | Simple but less secure than httpOnly cookies |
| Single MongoDB instance | Simple setup but no replication |

## 🔮 What I'd Change With More Time

1. **Real time updates** using WebSockets so dashboard updates instantly
2. **Email notifications** when applicants are promoted or decayed
3. **Admin panel** for managing multiple companies
4. **Better security** using httpOnly cookies instead of localStorage
5. **Unit tests** for queue and decay logic
6. **Docker setup** for easier deployment
7. **Pagination** for large waitlists
8. **Rate limiting** on API endpoints

## 👨‍💻 Author

**Ankam Vijay**
- GitHub: [@Ankam-Vijay](https://github.com/Ankam-Vijay)