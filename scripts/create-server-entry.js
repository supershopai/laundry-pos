const fs = require('fs');
const path = require('path');

// Create the server entry point for Vercel
const serverEntryContent = `const { createMedusaV2Server } = require("@medusajs/medusa")

// Import the built configuration
const config = require("./medusa-config.js")

// Create the Medusa server
const server = createMedusaV2Server(config)

// Export the server for Vercel
module.exports = server`;

// Write the server entry point in the root of the output directory
const serverEntryPath = path.join(__dirname, '..', '.medusa', 'server', 'index.js');
fs.writeFileSync(serverEntryPath, serverEntryContent);

console.log('✅ Server entry point created for Vercel deployment');
