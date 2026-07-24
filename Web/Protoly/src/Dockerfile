FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
WORKDIR /srv/app
COPY app/package.json ./
RUN npm install --omit=dev
COPY app/ ./
EXPOSE 3000
CMD ["node", "index.js"]
