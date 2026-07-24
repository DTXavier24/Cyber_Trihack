FROM node:20-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends \
      chromium ca-certificates fonts-liberation \
    && rm -rf /var/lib/apt/lists/*
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
WORKDIR /srv/app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY . ./
EXPOSE 3000
CMD ["node", "index.js"]