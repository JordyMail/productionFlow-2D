// server/db/connection.ts
import sql from 'mssql';
import { config } from 'dotenv';

// Load .env
config();

// Konfigurasi koneksi SQL Server
const dbConfig: sql.config = {
  server: process.env.DB_SERVER || process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || 'flow2d',
  user: process.env.DB_USER || 'sa',
  password: process.env.DB_PASSWORD || '',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    connectTimeout: 15000,
    requestTimeout: 15000,
  },
  pool: {
    max: 5,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

// Global connection pool
let pool: sql.ConnectionPool | null = null;
let connectionAttempts = 0;
const MAX_RETRIES = 3;
const RETRY_DELAY = 2000; // 2 detik

/**
 * Mendapatkan connection pool (singleton)
 * Auto-retry jika koneksi gagal
 */
export async function getConnection(): Promise<sql.ConnectionPool> {
  if (pool && pool.connected) {
    return pool;
  }

  try {
    connectionAttempts++;
    console.log(`[DB] Connecting to SQL Server (attempt ${connectionAttempts}/${MAX_RETRIES})...`);
    console.log(`[DB] Server: ${dbConfig.server}, Database: ${dbConfig.database}`);
    
    pool = await sql.connect(dbConfig);
    
    console.log('[DB] Connected successfully');
    connectionAttempts = 0;
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('[DB] Pool error:', err.message);
      pool = null;
    });

    return pool;
  } catch (error: any) {
    console.error(`[DB] Connection failed:`, error.message);
    pool = null;

    // Retry logic
    if (connectionAttempts < MAX_RETRIES) {
      console.log(`[DB] Retrying in ${RETRY_DELAY / 1000} seconds...`);
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
      return getConnection();
    }

    throw new Error(`Failed to connect to database after ${MAX_RETRIES} attempts: ${error.message}`);
  }
}

/**
 * Execute a query with parameters (safe from SQL injection)
 */
export async function executeQuery<T = any>(
  query: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const connection = await getConnection();
  
  try {
    const request = connection.request();
    
    // Add parameters safely
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    const result = await request.query(query);
    return result.recordset as T[];
  } catch (error: any) {
    console.error('[DB] Query error:', error.message);
    console.error('[DB] Query:', query.substring(0, 200));
    throw error;
  }
}

/**
 * Execute a stored procedure
 */
export async function executeProc<T = any>(
  procName: string,
  params: Record<string, any> = {}
): Promise<T[]> {
  const connection = await getConnection();
  
  try {
    const request = connection.request();
    
    Object.entries(params).forEach(([key, value]) => {
      request.input(key, value);
    });
    
    const result = await request.execute(procName);
    return result.recordset as T[];
  } catch (error: any) {
    console.error(`[DB] Procedure ${procName} error:`, error.message);
    throw error;
  }
}

/**
 * Check database connection health
 */
export async function checkConnection(): Promise<boolean> {
  try {
    const connection = await getConnection();
    await connection.request().query('SELECT 1 AS health_check');
    return true;
  } catch {
    return false;
  }
}

/**
 * Close connection pool (for graceful shutdown)
 */
export async function closeConnection(): Promise<void> {
  if (pool) {
    try {
      await pool.close();
      pool = null;
      console.log('[DB] Connection pool closed');
    } catch (error: any) {
      console.error('[DB] Error closing pool:', error.message);
    }
  }
}

// Handle process termination
process.on('SIGTERM', async () => {
  await closeConnection();
  process.exit(0);
});

process.on('SIGINT', async () => {
  await closeConnection();
  process.exit(0);
});