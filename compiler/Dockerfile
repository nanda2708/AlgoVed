FROM node:20-bookworm-slim

# g++ for compiling submissions; prlimit (util-linux) caps memory, CPU time,
# file size and process count for every submitted program.
RUN apt-get update \
    && apt-get install -y --no-install-recommends g++ util-linux \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

USER node
EXPOSE 8000

CMD ["node", "index.js"]
