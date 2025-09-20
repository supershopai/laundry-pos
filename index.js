const { createMedusaV2Server } = require("@medusajs/medusa")

// Import the built configuration
const config = require("./medusa-config.ts")

// Create the Medusa server
const server = createMedusaV2Server(config)

// Export the server for Vercel
module.exports = server
