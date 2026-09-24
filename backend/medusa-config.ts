import { loadEnv, defineConfig } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || "development", process.cwd())

const REDIS_URL = process.env.REDIS_URL

/**
 * Production setup (when REDIS_URL is set): Redis-backed event bus, workflow
 * engine and locking, so several server/worker instances share state.
 * Without Redis (local dev, free hosting) Medusa falls back to in-memory versions.
 */
const redisModules = REDIS_URL
  ? [
      {
        resolve: "@medusajs/medusa/event-bus-redis",
        options: { redisUrl: REDIS_URL },
      },
      {
        resolve: "@medusajs/medusa/workflow-engine-redis",
        options: { redis: { url: REDIS_URL } },
      },
      {
        resolve: "@medusajs/medusa/locking",
        options: {
          providers: [
            {
              resolve: "@medusajs/medusa/locking-redis",
              id: "locking-redis",
              is_default: true,
              options: { redisUrl: REDIS_URL },
            },
          ],
        },
      },
    ]
  : []

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    // Managed Postgres providers such as Neon require SSL.
    databaseDriverOptions:
      process.env.DATABASE_SSL === "true"
        ? { connection: { ssl: { rejectUnauthorized: false } } }
        : undefined,
    redisUrl: REDIS_URL,
    // "server" handles HTTP, "worker" runs subscribers/jobs, "shared" does both.
    workerMode: (process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server") || "shared",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    },
  },
  admin: {
    // Worker instances and memory-constrained hosts don't need the dashboard.
    disable:
      process.env.DISABLE_ADMIN === "true" || process.env.MEDUSA_WORKER_MODE === "worker",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [
    {
      resolve: "./src/modules/training",
    },
    {
      resolve: "@medusajs/medusa/notification",
      options: {
        providers: [
          {
            // Admin dashboard notification feed
            resolve: "@medusajs/medusa/notification-local",
            id: "local",
            options: { channels: ["feed"] },
          },
          {
            // Transactional email (dry-run logging when RESEND_API_KEY is not set)
            resolve: "./src/modules/resend-notification",
            id: "resend",
            options: {
              channels: ["email"],
              api_key: process.env.RESEND_API_KEY,
              from: process.env.RESEND_FROM,
            },
          },
        ],
      },
    },
    ...redisModules,
  ],
})

