const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../database/database.sqlite');
const sqlPath = path.join(__dirname, '../src/init_sqlite.sql');

async function seed() {
    if (fs.existsSync(dbPath)) fs.unlinkSync(dbPath);
    const db = new sqlite3.Database(dbPath);
    
    const content = fs.readFileSync(sqlPath, 'utf8');
    const statements = splitSql(content);
    
    console.log(`Processing ${statements.length} statements...`);

    // Cache for subcategory IDs
    const subcatCache = {};

    for (let stmt of statements) {
        if (!stmt) continue;
        
        if (stmt.toUpperCase().includes('INSERT INTO DOCUMENTS') && stmt.toUpperCase().includes('SELECT')) {
            try {
                const regex = /INSERT INTO (\w+) \(([\s\S]+?)\)\s+SELECT\s+([\s\S]+?)\s+FROM\s+\(\s*VALUES([\s\S]+?)\s*\)\s+AS\s+v\(([\s\S]+?)\)/gi;
                const match = regex.exec(stmt);
                
                if (match) {
                    const [full, table, colsRaw, selectColsRaw, valuesContent, vColsRaw] = match;
                    const cols = colsRaw.split(',').map(s => s.trim());
                    const selectCols = selectColsRaw.split(',').map(s => s.trim());
                    const vCols = vColsRaw.split(',').map(s => s.trim());
                    
                    const mapping = selectCols.map(col => {
                        const idx = vCols.indexOf(col);
                        if (idx !== -1) return { type: 'v', index: idx };
                        return { type: 'const', value: unquote(col) };
                    });
                    
                    const rows = parseValues(valuesContent);
                    console.log(`Seeding ${rows.length} rows into ${table}...`);
                    
                    for (const row of rows) {
                        const finalValues = [];
                        for (const m of mapping) {
                            let val = m.type === 'v' ? row[m.index] : m.value;
                            
                            // Check if val is a subquery like (SELECT id FROM subcategories WHERE target_id='...')
                            if (typeof val === 'string' && val.toUpperCase().includes('SELECT ID FROM SUBCATEGORIES')) {
                                const targetIdMatch = val.match(/target_id='([^']+)'/i);
                                if (targetIdMatch) {
                                    const targetId = targetIdMatch[1];
                                    if (subcatCache[targetId]) {
                                        val = subcatCache[targetId];
                                    } else {
                                        // Look up synchronously (we'll wait)
                                        const id = await new Promise((res, rej) => {
                                            db.get("SELECT id FROM subcategories WHERE target_id = ?", [targetId], (err, r) => {
                                                if (err) rej(err); else res(r ? r.id : null);
                                            });
                                        });
                                        subcatCache[targetId] = id;
                                        val = id;
                                    }
                                }
                            } else {
                                val = unquote(val);
                            }
                            finalValues.push(val);
                        }
                        
                        const placeholders = finalValues.map(() => '?').join(',');
                        await new Promise((res, rej) => {
                            db.run(`INSERT INTO ${table} (${cols.join(',')}) VALUES (${placeholders})`, finalValues, (err) => {
                                if (err) {
                                    if (err.message.includes('UNIQUE constraint failed')) res();
                                    else rej(err);
                                } else res();
                            });
                        });
                    }
                }
            } catch (err) {
                console.error('Error seeding block:', err.message);
            }
        } else {
            try {
                await new Promise((res, rej) => {
                    db.run(stmt, (err) => {
                        if (err) rej(err); else res();
                    });
                });
            } catch (err) {
                if (!err.message.includes('already exists')) {
                    console.error('Error in statement:', err.message);
                }
            }
        }
    }
    
    console.log('Finished seeding!');
    db.close();
}

function splitSql(sql) {
    const statements = [];
    let current = '';
    let inString = false;
    let stringChar = '';
    
    for (let i = 0; i < sql.length; i++) {
        const char = sql[i];
        if ((char === "'" || char === '"') && sql[i-1] !== '\\') {
            if (!inString) {
                inString = true;
                stringChar = char;
            } else if (char === stringChar) {
                inString = false;
            }
        }
        
        current += char;
        
        if (char === ';' && !inString) {
            statements.push(current.trim());
            current = '';
        }
    }
    if (current.trim()) statements.push(current.trim());
    return statements;
}

function unquote(val) {
    if (typeof val !== 'string') return val;
    val = val.trim();
    if (val.startsWith("'") && val.endsWith("'")) {
        return val.substring(1, val.length - 1).replace(/''/g, "'");
    }
    if (!isNaN(val) && val.trim() !== '') return Number(val);
    return val;
}

function parseValues(content) {
    const rows = [];
    let currentRow = [];
    let curVal = '';
    let pCount = 0;
    let sIn = false;
    
    for (let i = 0; i < content.length; i++) {
        const c = content[i];
        if (c === "'" && content[i-1] !== '\\') sIn = !sIn;
        
        if (!sIn) {
            if (c === '(') {
                pCount++;
                if (pCount > 1) curVal += c;
            } else if (c === ')') {
                pCount--;
                if (pCount === 0) {
                    if (curVal.trim()) currentRow.push(curVal.trim());
                    rows.push(currentRow);
                    currentRow = [];
                    curVal = '';
                } else {
                    curVal += c;
                }
            } else if (c === ',' && pCount === 1) {
                currentRow.push(curVal.trim());
                curVal = '';
            } else if (pCount >= 1) {
                curVal += c;
            }
        } else {
            curVal += c;
        }
    }
    return rows;
}

seed();
