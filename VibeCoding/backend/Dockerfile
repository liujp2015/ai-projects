# syntax=docker/dockerfile:1

# ------------------------------
# Builder stage
# ------------------------------
FROM node:20-alpine AS builder

WORKDIR /app

# 1) Copy only manifests first for better layer caching
COPY package.json package-lock.json ./

# Prisma schema is needed for `prisma generate`
COPY prisma ./prisma

# 2) Install deps (incl. devDeps) for building NestJS/TS
RUN npm ci

# 3) Copy the rest of the source
COPY . .

# 4) Generate Prisma client (required at runtime)
RUN npx prisma generate

# 5) Build TypeScript -> dist/
RUN npm run build


# ------------------------------
# Final stage (production)
# ------------------------------
FROM node:20-alpine AS final

ENV NODE_ENV=production

WORKDIR /app

# Install only production deps
COPY package.json package-lock.json ./
RUN npm ci --omit=dev \
  && npm cache clean --force

# Copy runtime artifacts ONLY (no TS source)
COPY --from=builder /app/dist ./dist

# Prisma runtime needs these two folders
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma/client ./node_modules/@prisma/client

# If you run migrations inside the container, keep prisma schema/migrations
COPY --from=builder /app/prisma ./prisma

# Security: run as non-root user (built into node image)
USER node

EXPOSE 3001

CMD ["node", "dist/main"]
