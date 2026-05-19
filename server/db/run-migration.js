echo import sql from 'mssql'; > run-migrate.js
echo import fs from 'fs'; >> run-migrate.js
echo. >> run-migrate.js
echo const config = { >> run-migrate.js
echo   server: '10.125.20.42', >> run-migrate.js
echo   port: 1433, >> run-migrate.js
echo   database: 'ProcessTime_IAB', >> run-migrate.js
echo   user: 'iab_admin', >> run-migrate.js
echo   password: 'IABadmin2025', >> run-migrate.js
echo   options: { encrypt: false, trustServerCertificate: true }, >> run-migrate.js
echo }; >> run-migrate.js
echo. >> run-migrate.js
echo async function run() { >> run-migrate.js
echo   const pool = await sql.connect(config); >> run-migrate.js
echo   console.log('Connected!'); >> run-migrate.js
echo   const schema = fs.readFileSync('./server/db/schema.sql', 'utf8'); >> run-migrate.js
echo   const batches = schema.split(/GO/i).filter(b => b.trim().length > 0); >> run-migrate.js
echo   console.log('Batches:', batches.length); >> run-migrate.js
echo   for (let i = 0; i ^< batches.length; i++) { >> run-migrate.js
echo     const batch = batches[i].trim(); >> run-migrate.js
echo     if (!batch) continue; >> run-migrate.js
echo     try { >> run-migrate.js
echo       await pool.request().query(batch); >> run-migrate.js
echo       console.log('OK ' + (i+1) + '/' + batches.length); >> run-migrate.js
echo     } catch(e) { >> run-migrate.js
echo       if (e.message.includes('already exists')) { >> run-migrate.js
echo         console.log('SKIP ' + (i+1)); >> run-migrate.js
echo       } else { >> run-migrate.js
echo         console.log('ERR ' + (i+1) + ': ' + e.message.substring(0, 80)); >> run-migrate.js
echo       } >> run-migrate.js
echo     } >> run-migrate.js
echo   } >> run-migrate.js
echo   const procs = await pool.request().query("SELECT name FROM sys.procedures WHERE name LIKE 'flow2d%%' ORDER BY name"); >> run-migrate.js
echo   console.log('DONE! Procedures:', procs.recordset.length); >> run-migrate.js
echo   procs.recordset.forEach(p => console.log('  -', p.name)); >> run-migrate.js
echo   await pool.close(); >> run-migrate.js
echo } >> run-migrate.js
echo run(); >> run-migrate.js