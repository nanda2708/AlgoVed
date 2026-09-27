# Deploying AlgoVed

The production stack in `docker-compose.prod.yml` runs four containers on a single
host (an EC2 instance in my case): nginx, the Next.js frontend, the API and the
compiler. MongoDB is hosted on Atlas.

Only nginx is published (ports 80 and 443). The compiler sits on its own Docker
network that only the backend can reach.

## 1. MongoDB Atlas

1. In Atlas, open **Database Access** and create a database user (or reuse one).
2. In **Network Access**, allow the server's public IP.
3. Copy the connection string from **Connect → Drivers**. It looks like
   `mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/?appName=Cluster0`.
   URL-encode the password if it contains characters such as `@`, `:` or `/`.

The cluster can be shared with other projects. AlgoVed connects with
`dbName=algoved` (override with `MONGO_DB_NAME`), so its collections never mix
with another app's `users` collection even though the connection string has no
database in its path.

## 2. Configure

```bash
cp .env.production.example .env.production
# fill in PUBLIC_URL, MONGO_URI, JWT_SECRET, COMPILER_API_KEY
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"   # for each secret
```

In the EC2 security group allow 22 (from your IP), 80 and 443. Nothing else.

## 3. TLS

`nginx/default.conf` expects Let's Encrypt certificates for the domain under
`/etc/letsencrypt/live/<domain>/`. Issue them once with certbot in standalone
mode before starting nginx:

```bash
sudo certbot certonly --standalone -d algoved.is-a.dev
```

## 4. Start / update

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl -s https://algoved.is-a.dev/api/health
```

`/api/health` reports whether the API is connected to MongoDB.

Optional demo data (three problems, a running contest, users `admin`, `alice`,
`bob`). In production `SEED_ADMIN_PASSWORD` must be set; re-running the seed
never resets an existing user's password.

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend npm run seed
```

To make an existing account an admin, set `isAdmin: true` on it in Atlas.

## Operations

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f backend compiler
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

Tuning the judge:

| Variable | Default | Meaning |
| --- | --- | --- |
| `MAX_CONCURRENT_RUNS` | 2 | Programs compiled/executed in parallel. Roughly one per CPU core. |
| `MAX_PENDING_RUNS` | 50 | Jobs allowed to wait; beyond this the API answers 503. |

The compiler container is limited to 1 GB of memory, 256 processes and 2 CPUs,
runs as a non-root user with a read-only filesystem, and each program also gets
per-process limits (address space, CPU time, file size, process count) through
`prlimit`.
