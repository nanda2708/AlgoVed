# AlgoVed

An online judge for C++. Users solve problems against hidden test cases, take part
in timed contests with an ICPC-style scoreboard, and can work on code together in
shared rooms.

Live at https://algoved.is-a.dev

## What it does

- **Judging.** A submission is compiled once with `g++ -std=c++17 -O2` and run
  against every test with the problem's own time and memory limits. Verdicts:
  Accepted, Wrong Answer, Time Limit Exceeded, Runtime Error, Compilation Error.
  Hidden test data never leaves the server; only the verdict and run time do.
- **Contests.** Registration, a countdown, problems revealed at start time, and a
  scoreboard ranked by points and then penalty (minutes to solve plus 10 per
  rejected attempt, compile errors excluded).
- **Coding rooms.** A private shared editor and stdin box synced over Socket.IO,
  with an online indicator per member. Edits are broadcast immediately and
  written to MongoDB at most once every 1.5 s per room.
- **Profiles.** Problems solved by difficulty, acceptance rate, verdict breakdown,
  and a daily streak, all computed from submission history with aggregation
  pipelines.
- **Admin.** Create problems (Markdown statements, visible/hidden tests, limits)
  and schedule contests from the UI.
- **AI review** (optional). Sends the code to Gemini for short feedback.

## Architecture

```
 browser ── nginx ──┬── frontend   Next.js 15, React 19, Monaco
                    └── backend    Express 5, Mongoose, Socket.IO ── MongoDB Atlas
                            │
                            └── compiler  (private network, shared-secret auth)
```

The **compiler** service is the only place user code runs. Each job gets a
temporary directory, is compiled once, and each test runs under `prlimit`
(address space, CPU seconds, output file size, process count) with a wall-clock
timeout. A bounded FIFO queue caps how many programs run at once. In production
the container itself is memory/PID-limited, read-only, and runs as a non-root user
with all capabilities dropped.

The **backend** owns everything else: JWT auth, problems, submissions, contests,
rooms and leaderboards. It calls the compiler with a shared key and never exposes
it publicly. Login and code execution are rate limited.

## Repository layout

```
frontend/   Next.js app (App Router)
backend/    REST API + Socket.IO server
  services/judge.js           client for the compiler service
  services/contestScoring.js  contest ranking
compiler/   judge service
  sandbox.js   compile / execute with limits
  judge.js     verdict logic
  queue.js     bounded job queue
nginx/      reverse proxy config
```

## Running locally

Requirements: Node 20+, g++ (for the compiler service) and a MongoDB instance
(Atlas or local).

```bash
# 1. compiler (port 8000)
cd compiler && cp .env.example .env    # set COMPILER_API_KEY
npm install && npm start

# 2. backend (port 5000)
cd backend && cp .env.example .env     # MONGO_URI, JWT_SECRET, same COMPILER_API_KEY
npm install && npm run seed            # optional demo data
npm run dev

# 3. frontend (port 3000)
cd frontend && cp .env.example .env.local
npm install && npm run dev
```

If you don't have MongoDB, `docker compose -f backend/docker-compose.yml up mongo`
starts one on `localhost:27017`.

The seed creates `admin` / `Admin@12345` (or `SEED_ADMIN_PASSWORD`),
`alice` / `Alice@12345` and `bob` / `Bob@12345`.

## Tests

```bash
cd compiler && npm test   # compiles real programs: AC, WA, TLE, RE, CE
cd backend && npm test    # contest ranking and streak calculation
```

CI runs both, plus a lint and production build of the frontend.

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md).
