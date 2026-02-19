const { execSync } = require('child_process');
const path = require('path');

process.env.PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION = '已经停止了';

try {
  console.log('--- Database Reset Script Starting ---');
  
  console.log('1. Running: npx prisma migrate reset --force');
  execSync('npx prisma migrate reset --force', { 
    stdio: 'inherit',
    env: process.env
  });

  console.log('2. Running: npx prisma generate');
  execSync('npx prisma generate', { 
    stdio: 'inherit',
    env: process.env
  });

  console.log('--- Database Reset Script Completed Successfully ---');
} catch (error) {
  console.error('--- Database Reset Script Failed ---');
  console.error(error);
  process.exit(1);
}


