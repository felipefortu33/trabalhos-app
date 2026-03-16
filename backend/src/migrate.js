const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrate() {
  console.log('Running migrations...');
  const migrationsDir = path.join(__dirname, '..', 'migrations');
  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith('.sql'))
    .sort();

  try {
    for (const file of files) {
      const migrationFile = path.join(migrationsDir, file);
      const sql = fs.readFileSync(migrationFile, 'utf8');
      await db.query(sql);
      console.log(`Migration ${file} applied successfully.`);
    }
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }

  process.exit(0);
}

migrate();
