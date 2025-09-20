const { defineConfig } = require('@medusajs/framework/utils')

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS || "https://laundry-4topf0reb-supershop.vercel.app",
      adminCors: process.env.ADMIN_CORS || "https://laundry-4topf0reb-supershop.vercel.app",
      authCors: process.env.AUTH_CORS || "https://laundry-4topf0reb-supershop.vercel.app",
      jwtSecret: process.env.JWT_SECRET || "supersecret",
      cookieSecret: process.env.COOKIE_SECRET || "supersecret",
    }
  },
  modules: [
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
  plugins: [
    {
      resolve: "@rsc-labs/medusa-store-analytics-v2",
      options: {}
    }
  ]
})
