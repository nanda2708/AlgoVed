FROM node:20-bookworm-slim

RUN apt-get update \
    && apt-get install -y --no-install-recommends g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

RUN mkdir -p codes inputs outputs \
    && chown -R node:node /app

USER node

EXPOSE 8000

CMD ["node", "index.js"]
