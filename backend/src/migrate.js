const fs = require('fs');
const path = require('path');
const db = require('./db');

async function migrate() {
  console.log('Running migrations...');
  const migrationFile = path.join(__dirname, '..', 'migrations', '001_init.sql');
  const sql = fs.readFileSync(migrationFile, 'utf8');

  try {
    await db.query(sql);
    console.log('Migration 001_init.sql applied successfully.');
  } catch (err) {
    console.error('Migration failed:', err.message);
    process.exit(1);
  }

  process.exit(0);
}

migrate();
