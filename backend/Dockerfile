# --- Build: compile the backend and admin dashboard into .medusa/server ---
FROM node:20-slim AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN NODE_OPTIONS=--max-old-space-size=2048 npm run build

# --- Runtime: only the compiled output and production dependencies ---
FROM node:20-slim
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/.medusa/server ./
RUN npm ci --omit=dev && npm cache clean --force
EXPOSE 9000
# The server runs migrations before starting; workers override this command.
CMD ["sh", "-c", "npm run predeploy && npm run start"]
