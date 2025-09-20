import { loadEnv, defineConfig } from '@medusajs/framework/utils'
import { Modules } from "@medusajs/framework/utils"

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    redisUrl: process.env.REDIS_URL,
    workerMode: process.env.MEDUSA_WORKER_MODE as "shared" | "worker" | "server",
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  admin: {
    disable: process.env.DISABLE_MEDUSA_ADMIN === "true",
    backendUrl: process.env.MEDUSA_BACKEND_URL,
  },
  modules: [
    // {
    //   resolve: "@medusajs/medusa/cache-redis",
    //   options: {
    //     redisUrl: process.env.REDIS_URL,
    //   },
    // },
    // {
    //   resolve: "@medusajs/medusa/event-bus-redis",
    //   options: {
    //     redisUrl: process.env.REDIS_URL,
    //   },
    // },
    // {
    //   resolve: "@medusajs/medusa/workflow-engine-redis",
    //   options: {
    //     redis: {
    //       url: process.env.REDIS_URL,
    //     },
    //   },
    // },
    // {
    //   resolve: "@medusajs/medusa/locking",
    //   options: {
    //     providers: [
    //       {
    //         resolve: "@medusajs/medusa/locking-redis",
    //         id: "locking-redis",
    //         is_default: true,
    //         options: {
    //           redisUrl: process.env.REDIS_URL,
    //         },
    //       },
    //     ],
    //   },
    // },
     {
      resolve: "./src/modules/pos",
      key: "pos"
    },
    {
      resolve: "./src/modules/invoice-generator",
    },
    {
      resolve: "@medusajs/promotion",
      key: "promotion"
    },
    {
      resolve: "@medusajs/cart",
      key: "cart"
    },
    {
      resolve: "@medusajs/order",
      key: "order"
    },
    {
      resolve: "@medusajs/medusa/payment"
    }
  ],
  plugins: []
})
