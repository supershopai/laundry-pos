const express = require("express")
const { expressLoader, container, configLoader } = require("@medusajs/framework")

// Create Express app
const app = express()

// Initialize Medusa with Express
async function initializeMedusa() {
  try {
    // Load configuration first
    await configLoader()
    
    // Then initialize Express with Medusa
    await expressLoader({ app, container })
  } catch (error) {
    console.error("Failed to initialize Medusa:", error)
  }
}

// Initialize Medusa
initializeMedusa()

// Export the Express app for Vercel
module.exports = app
