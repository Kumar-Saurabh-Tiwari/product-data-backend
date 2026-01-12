# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci --legacy-peer-deps || npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Runtime stage
FROM node:18-alpine

WORKDIR /app

RUN apk add --no-cache dumb-init

COPY package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps || npm install --omit=dev --legacy-peer-deps

COPY --from=builder /app/dist ./dist

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/main.js"]

EXPOSE 3001
