const { execSync } = require('child_process');
const path = require('path');

console.log('🔄 Running database migrations and seeding...');

try {
  // Change to the server directory where the built Medusa app is
  process.chdir(path.join(__dirname, '..', '.medusa', 'server'));
  
  // Run migrations
  console.log('📊 Running database migrations...');
  execSync('npx medusa db:migrate', { stdio: 'inherit' });
  
  // Run seeding
  console.log('🌱 Seeding database...');
  execSync('npx medusa db:seed', { stdio: 'inherit' });
  
  console.log('✅ Database setup completed successfully!');
} catch (error) {
  console.error('❌ Database setup failed:', error.message);
  process.exit(1);
}
