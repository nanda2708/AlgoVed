# AlgoVed EC2 deployment

This deployment exposes only Nginx on port 80. MongoDB, the backend, and the compiler remain private Docker services.

## Before the first deployment

1. Create a `.env.production` file next to `docker-compose.prod.yml` from `.env.production.example`.
2. Set `PUBLIC_URL` to `http://YOUR_EC2_PUBLIC_IP` (or your HTTPS domain later).
3. Generate unique values for `JWT_SECRET` and `COMPILER_API_KEY`. Never use the example values.
4. In the EC2 security group, allow inbound TCP `22` from your own IP and TCP `80` from the internet. Do not open `27017`, `5000`, or `8000`.

## Start or update

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.production -f docker-compose.prod.yml ps
curl http://127.0.0.1/api/health
```

After the first start, seed demo data only if wanted:

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml exec backend npm run seed
```

## Operations

```bash
docker compose --env-file .env.production -f docker-compose.prod.yml logs -f
docker compose --env-file .env.production -f docker-compose.prod.yml up -d --build
docker compose --env-file .env.production -f docker-compose.prod.yml down
```

`down` preserves MongoDB data. Adding `-v` deletes the database volume, so use it only when intentionally resetting all data.

## HTTPS

Before public submission, place this stack behind HTTPS (for example, an Nginx Certbot setup or an AWS load balancer) and set `PUBLIC_URL` to the final `https://` domain before rebuilding the frontend image.
