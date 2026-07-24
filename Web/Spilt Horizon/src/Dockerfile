FROM node:22-alpine

WORKDIR /app
ENV EDGE_HOST=0.0.0.0
ENV ORIGIN_BIND=127.0.0.1
ENV ORIGIN_HOST=127.0.0.1
ENV ORIGIN_PORT=4001
ENV EDGE_PORT=3000

COPY package.json ./
COPY services ./services
COPY scripts ./scripts
COPY public ./public
COPY flag.txt ./flag.txt

EXPOSE 3000
USER node
CMD ["node", "scripts/run-local.js"]
