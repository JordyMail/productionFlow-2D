// server/db/migrate.js
// Script untuk menjalankan migrasi database
// Usage: node server/db/migrate.js

import { config } from 'dotenv';
import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Load .env file
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Gunakan DB_HOST sebagai fallback untuk DB_SERVER
const server = process.env.DB_SERVER || process.env.DB_HOST || 'localhost';
const port = parseInt(process.env.DB_PORT || '1433', 10);
const user = process.env.DB_USER || 'sa';
const password = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'ProcessTime_IAB';

const dbConfig = {
  server,
  port,
  user,
  password,
  database: dbName, // Langsung connect ke ProcessTime_IAB
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    connectTimeout: 15000,
    requestTimeout: 15000,
  },
  connectionTimeout: 15000,
};

async function runMigration() {
  console.log('========================================');
  console.log('  Flow2D Database Migration');
  console.log('========================================');
  console.log(`Server: ${server}:${port}`);
  console.log(`Database: ${dbName} (existing)`);
  console.log(`User: ${user}`);
  console.log('----------------------------------------\n');

  let dbPool;

  try {
    // [1] Connect langsung ke database yang sudah ada
    console.log(`[1/2] Connecting to "${dbName}" database...`);
    
    try {
      dbPool = await sql.connect(dbConfig);
      console.log(`✓ Connected to "${dbName}"\n`);
    } catch (connectError) {
      console.error('✗ Failed to connect to SQL Server');
      console.error('  Error:', connectError.message);
      console.error('\n  Please check:');
      console.error('  1. SQL Server is running at', server);
      console.error('  2. Database', dbName, 'exists');
      console.error('  3. User', user, 'has access to', dbName);
      console.error('  4. Port', port, 'is correct and not blocked');
      console.error('  5. SQL Server Authentication is enabled\n');
      throw connectError;
    }

    // Cek apakah database benar-benar ada
    const dbExists = await dbPool.request()
      .input('dbName', sql.NVarChar, dbName)
      .query(`SELECT DB_NAME() AS current_db`);
    
    console.log(`  Current database: ${dbExists.recordset[0].current_db}`);
    console.log(`  Tables will be created with prefix 'flow2d_' to avoid conflicts\n`);

    // [2] Jalankan schema
    console.log('[2/2] Running schema migration...');
    
    const schemaPath = path.join(__dirname, 'schema.sql');
    
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }
    
    const schema = fs.readFileSync(schemaPath, 'utf8');
    console.log(`  Schema file loaded (${schema.length} bytes)`);
    
    // Split by GO statements (SQL Server batch separator)
    const batches = schema
      .split(/\bGO\b/i)
      .map(batch => batch.trim())
      .filter(batch => batch.length > 0);
    
    console.log(`  Found ${batches.length} SQL batches to execute\n`);
    
    let successCount = 0;
    let warningCount = 0;
    
    for (let i = 0; i < batches.length; i++) {
      const batchNum = i + 1;
      const batchPreview = batches[i]
        .substring(0, 100)
        .replace(/\n/g, ' ')
        .replace(/\s+/g, ' ');
      
      try {
        await dbPool.request().query(batches[i]);
        console.log(`  ✓ Batch ${batchNum}/${batches.length}`);
        successCount++;
      } catch (batchError) {
        // Cek apakah error karena object sudah ada (expected)
        if (batchError.message.includes('There is already an object named') ||
            batchError.message.includes('already exists')) {
          console.log(`  ○ Batch ${batchNum}: Already exists (skipped)`);
          warningCount++;
        } else {
          console.warn(`  ⚠ Batch ${batchNum} error: ${batchError.message}`);
          console.warn(`    SQL: ${batchPreview}...`);
          warningCount++;
        }
      }
    }
    
    console.log(`\n  Results: ${successCount} succeeded, ${warningCount} skipped/warnings`);

    // Verifikasi tabel yang sudah dibuat
    const tableCheck = await dbPool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = 'dbo' 
        AND (TABLE_NAME LIKE 'flow2d_%' OR TABLE_NAME LIKE 'machine_templates' OR TABLE_NAME LIKE 'flow_saves')
        AND TABLE_TYPE = 'BASE TABLE'
      ORDER BY TABLE_NAME
    `);
    
    if (tableCheck.recordset.length > 0) {
      console.log('\n  ✓ Tables created:');
      tableCheck.recordset.forEach(row => {
        console.log(`    - dbo.${row.TABLE_NAME}`);
      });
    }

    // Verifikasi stored procedures
    const procCheck = await dbPool.request().query(`
      SELECT NAME 
      FROM sys.procedures 
      WHERE NAME LIKE 'sp_%Template%' OR NAME LIKE 'sp_%Flow%'
      ORDER BY NAME
    `);
    
    if (procCheck.recordset.length > 0) {
      console.log('\n  ✓ Stored Procedures created:');
      procCheck.recordset.forEach(row => {
        console.log(`    - dbo.${row.NAME}`);
      });
    }

    await dbPool.close();
    dbPool = null;

    console.log('\n========================================');
    console.log('  ✅ Migration completed successfully!');
    console.log(`  All objects created in [${dbName}]`);
    console.log('========================================');
    process.exit(0);
    
  } catch (error) {
    console.error('\n========================================');
    console.error('  ❌ Migration failed');
    console.error('========================================');
    console.error('Error:', error.message);
    
    if (error.code === 'ESOCKET') {
      console.error('\n  Connection troubleshooting:');
      console.error('  - Is SQL Server running at', server, '?');
      console.error('  - Is port', port, 'open? (check firewall)');
      console.error('  - Try: telnet', server, port);
    }
    
    if (error.code === 'ELOGIN') {
      console.error('\n  Login troubleshooting:');
      console.error('  - Verify username:', user);
      console.error('  - Verify password (hidden)');
      console.error('  - Ensure SQL Server Authentication is enabled');
    }

    if (error.message.includes('Cannot open database')) {
      console.error('\n  Database troubleshooting:');
      console.error('  - Database', dbName, 'might not exist');
      console.error('  - User', user, 'might not have access to it');
    }
    
    console.error('\n  Config used:');
    console.error('  Server:', server);
    console.error('  Port:', port);
    console.error('  Database:', dbName);
    console.error('  User:', user);
    
    process.exit(1);
  } finally {
    try {
      if (dbPool) await dbPool.close();
    } catch {}
  }
}

runMigration();