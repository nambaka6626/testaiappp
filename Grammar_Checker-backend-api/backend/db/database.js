// backend/db/database.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.resolve(__dirname, 'grammar.db');
const sql = fs.readFileSync(path.resolve(__dirname, 'schema.sql'), 'utf8');

const db = new sqlite3.Database(dbPath, err => {
  if (err) console.error('❌ DB Error:', err);
  else {
    console.log('✅ DB Connected');
    db.exec(sql, err => {
      if (err) console.error('❌ Schema Error:', err.message);
      else console.log('📦 Schema Initialized');
    });
  }
});

module.exports = db;
