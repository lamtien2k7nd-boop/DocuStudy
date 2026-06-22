// config/database.js
const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.resolve(__dirname, '../../database/docustudy.db');
const db = new Database(dbPath);

// Hàm query (SELECT nhiều dòng)
function query(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        return stmt.all(...params);
    } catch (err) {
        console.error('Query error:', err);
        throw err;
    }
}

// Hàm get (SELECT 1 dòng)
function get(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        return stmt.get(...params);
    } catch (err) {
        console.error('Get error:', err);
        throw err;
    }
}

// Hàm run (INSERT, UPDATE, DELETE)
function run(sql, params = []) {
    try {
        const stmt = db.prepare(sql);
        const result = stmt.run(...params);
        return { lastID: result.lastInsertRowid, changes: result.changes };
    } catch (err) {
        console.error('Run error:', err);
        throw err;
    }
}

module.exports = { db, query, get, run };