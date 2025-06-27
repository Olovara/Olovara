import { cleanupPermissionsWithStringDates } from '../lib/permissions';

async function main() {
  console.log('Starting permission cleanup...');
  await cleanupPermissionsWithStringDates();
  console.log('Permission cleanup finished!');
  process.exit(0);
}

main().catch((error) => {
  console.error('Error running permission cleanup:', error);
  process.exit(1);
}); 